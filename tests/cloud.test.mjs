import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
test('cloud migration enforces owner access and hides private/future snapshots',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 await db.exec(readFileSync('supabase/schema.sql','utf8'));
 const owner='11111111-1111-4111-a111-111111111111';
 const id='22222222-2222-4222-a222-222222222222';
 const rpc=async(op,p={})=>(await db.query('select public.journal_admin($1,$2::jsonb) as result',[op,JSON.stringify(p)])).rows[0].result;
 const feed=async()=>(await db.query('select public.journal_feed() as result')).rows[0].result;
 await db.exec('set role anon');
 assert.deepEqual(await feed(),[]);
 await assert.rejects(()=>rpc('list'),/permission denied/);
 await assert.rejects(()=>db.query('select * from journal_private.drafts'),/permission denied/);
 await db.exec('reset role; set role authenticated');
 await assert.rejects(()=>rpc('list'),/only to its owner/);
 await db.exec(`reset role; insert into auth.users values('${owner}','owner@example.com'); insert into journal_private.owners values('${owner}'); set request.jwt.claim.sub='${owner}'; set role authenticated;`);
 let doc=await rpc('save',{id,title:'Test',body:'<p>First release</p>',drillOriginal:'Private unfiltered original',revision:0});
 assert.equal(doc.revision,1);assert.deepEqual(await feed(),[]);
 await rpc('publish',{id,revision:1,release_at:'2020-01-01T00:00:00Z'});
 assert.equal((await feed())[0].body,'<p>First release</p>');
 assert.equal('drillOriginal' in (await feed())[0],false);
 await rpc('save',{...doc,body:'Private revision'});
 await assert.rejects(()=>rpc('save',doc),/newer version/);
 await rpc('publish',{id,revision:2,release_at:'2099-01-01T00:00:00Z'});
 assert.equal((await feed())[0].body,'<p>First release</p>');
 await rpc('cancel',{id});
 assert.equal((await rpc('releases')).length,1);
 await rpc('unpublish',{id});assert.deepEqual(await feed(),[]);
 assert.equal((await rpc('history',{id})).length,2);
 assert.equal((await rpc('export')).drafts.length,1);
 }finally{await db.close();}
});
