import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
const publicDocument=doc=>{const {drillOriginal,drillCompleted,revision,updated,...published}=doc;return published;};
export function createStore(filename){
 const db=new DatabaseSync(filename); db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS drafts(id TEXT PRIMARY KEY,doc TEXT NOT NULL,revision INTEGER NOT NULL,updated TEXT NOT NULL); CREATE TABLE IF NOT EXISTS revisions(id TEXT PRIMARY KEY,draft_id TEXT,doc TEXT,created TEXT); CREATE TABLE IF NOT EXISTS releases(id TEXT PRIMARY KEY,draft_id TEXT,doc TEXT,release_at TEXT,cancelled INTEGER DEFAULT 0);`);
 const decode=r=>r?{...JSON.parse(r.doc),id:r.id,revision:r.revision,updated:r.updated}:null;
 function save(doc){
  if(!doc||typeof doc!=='object'||JSON.stringify(doc).length>2500000)throw new Error('Invalid or oversized draft.');
  const id=doc.id||randomUUID(),old=db.prepare('SELECT * FROM drafts WHERE id=?').get(id);
  if(old&&doc.revision!==old.revision){const e=new Error('A newer version exists. Reload this draft before saving. Your recovery copy is still on this device.');e.status=409;throw e;}
  const revision=(old?.revision||0)+1,updated=new Date().toISOString();const value={...doc,id,revision,updated};
  db.exec('BEGIN');try{db.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(randomUUID(),id,JSON.stringify(value),updated);db.prepare('INSERT INTO drafts VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET doc=excluded.doc,revision=excluded.revision,updated=excluded.updated').run(id,JSON.stringify(value),revision,updated);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;} return value;
 }
 function action(action,p={}){
  if(action==='list')return db.prepare('SELECT * FROM drafts ORDER BY updated DESC').all().map(decode);
  if(action==='save')return save(p);
  if(action==='history')return db.prepare('SELECT * FROM revisions WHERE draft_id=? ORDER BY created DESC LIMIT 40').all(p.id).map(r=>({id:r.id,created:r.created,doc:JSON.parse(r.doc)}));
  if(action==='releases')return db.prepare('SELECT * FROM releases WHERE cancelled=0 ORDER BY release_at DESC').all().map(r=>({...r,doc:JSON.parse(r.doc)}));
  if(action==='publish'){
   const row=db.prepare('SELECT * FROM drafts WHERE id=?').get(p.id);if(!row)throw new Error('Save the draft first.');const doc=decode(row);
   if(p.revision!==doc.revision)throw new Error('Draft changed. Review and save before publishing.');
   if(!doc.title?.trim()||!doc.body?.replace(/<[^>]*>/g,'').trim())throw new Error('A title and some writing are required.');
   const releaseAt=new Date(p.release_at||Date.now()).toISOString();
   db.exec('BEGIN');try{db.prepare('UPDATE releases SET cancelled=1 WHERE draft_id=? AND release_at>?').run(p.id,new Date().toISOString());db.prepare('INSERT INTO releases VALUES(?,?,?,?,0)').run(randomUUID(),p.id,JSON.stringify({...doc,slug:doc.id}),releaseAt);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
   return {release_at:releaseAt};
  }
  if(action==='cancel'){db.prepare('UPDATE releases SET cancelled=1 WHERE draft_id=? AND release_at>?').run(p.id,new Date().toISOString());return {ok:true};}
  if(action==='unpublish'){db.prepare('UPDATE releases SET cancelled=1 WHERE draft_id=?').run(p.id);return {ok:true};}
  if(action==='export')return {drafts:actionList(),revisions:db.prepare('SELECT * FROM revisions').all(),releases:db.prepare('SELECT * FROM releases').all()};
  throw new Error('Unknown action');
 }
 function actionList(){return action('list');}
 function feed(now=new Date().toISOString()){
  const rows=db.prepare('SELECT * FROM releases WHERE cancelled=0 AND release_at<=? ORDER BY release_at DESC,rowid DESC').all(now);const seen=new Set();return rows.filter(r=>{if(seen.has(r.draft_id))return false;seen.add(r.draft_id);return true;}).map(r=>({...publicDocument(JSON.parse(r.doc)),published:r.release_at}));
 }
 return {action,feed,close:()=>db.close()};
}
