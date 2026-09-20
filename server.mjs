import express from 'express';
import {mkdirSync} from 'node:fs';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {createStore} from './store.mjs';
const app=express(),port=Number(process.env.PORT||5530);
mkdirSync('data',{recursive:true});const store=createStore(process.env.JOURNAL_DB||'data/journal.sqlite');
const token=randomBytes(32).toString('hex');
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','no-store');next();});
app.use(express.json({limit:'3mb'}));
function local(req){return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&['127.0.0.1','localhost'].includes(req.hostname);}
function origin(req){return !req.headers.origin||[`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin);}
app.get('/api/feed',(req,res)=>res.json(store.feed()));
app.get('/api/status',(req,res)=>res.json({mode:'local',local:local(req)}));
app.post('/api/local-session',(req,res)=>{if(!local(req)||!origin(req))return res.sendStatus(403);res.cookie('journal_owner',token,{httpOnly:true,sameSite:'strict',path:'/api'});res.json({ok:true});});
app.post('/api/logout',(req,res)=>{res.clearCookie('journal_owner',{path:'/api'});res.json({ok:true});});
app.post('/api/admin/:action',(req,res)=>{
 const got=(req.headers.cookie||'').split('; ').find(x=>x.startsWith('journal_owner='))?.slice(14)||'';
 if(!local(req)||!origin(req)||got.length!==token.length||!timingSafeEqual(Buffer.from(got),Buffer.from(token)))return res.status(401).json({error:'Sign in to the local studio.'});
 try{res.json(store.action(req.params.action,req.body));}catch(e){res.status(e.status||400).json({error:e.message});}
});
app.use('/api',(req,res)=>res.status(404).json({error:'Not found'}));
if(process.argv.includes('--production')){app.use(express.static('dist'));app.get('/{*path}',(req,res)=>res.sendFile(new URL('./dist/index.html',import.meta.url).pathname.replace(/^\/(.:)/,'$1')));}else{const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
app.listen(port,'127.0.0.1',()=>console.log(`Journal ready at http://127.0.0.1:${port} — private studio available only on this computer.`));
