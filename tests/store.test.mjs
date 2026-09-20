import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../store.mjs';
test('draft durability, snapshot privacy, scheduling and recovery',()=>{
 const dir=mkdtempSync(join(tmpdir(),'journal-test-')),file=join(dir,'writing.sqlite');
 let store=createStore(file);
 try{
  let d=store.action('save',{title:'A test piece',body:'<p>Public text</p>',drillOriginal:'Private raw thoughts',revision:0});
  assert.deepEqual(store.feed(),[]);
  store.close();store=createStore(file);
  assert.equal(store.action('list')[0].drillOriginal,'Private raw thoughts');
  store.action('publish',{id:d.id,revision:d.revision,release_at:'2020-01-01T00:00:00Z'});
  assert.equal(store.feed()[0].body,'<p>Public text</p>');
  assert.equal('drillOriginal' in store.feed()[0],false);
  const old=d;d=store.action('save',{...d,body:'<p>Private next revision</p>'});
  assert.equal(store.feed()[0].body,'<p>Public text</p>');
  assert.throws(()=>store.action('save',{...old,body:'Stale edit'}),/newer version/);
  assert.equal(store.action('history',{id:d.id}).length,2);
  store.action('publish',{id:d.id,revision:d.revision,release_at:'2099-01-01T00:00:00Z'});
  assert.equal(store.feed('2098-12-31T23:59:59.999Z')[0].body,'<p>Public text</p>');
  assert.equal(store.feed('2099-01-01T00:00:00.000Z')[0].body,'<p>Private next revision</p>');
  store.action('cancel',{id:d.id});
  assert.equal(store.feed('2099-01-02T00:00:00.000Z')[0].body,'<p>Public text</p>');
  store.action('unpublish',{id:d.id});
  assert.deepEqual(store.feed(),[]);
  assert.equal(store.action('list').length,1);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
