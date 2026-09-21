import test from 'node:test';
import assert from 'node:assert/strict';
import {draftSignature} from '../src/draft-signature.mjs';
test('cloud JSONB key order and revision metadata do not trigger another save',()=>{
 const local={id:'a',title:'An essay',body:'<p>Words</p>',revision:1,settings:{b:2,a:1}};
 const cloud={settings:{a:1,b:2},body:local.body,title:local.title,id:'a',revision:2,updated:'2026-09-21'};
 assert.equal(draftSignature(local),draftSignature(cloud));
 assert.notEqual(draftSignature({...local,body:'<p>A new thought</p>'}),draftSignature(cloud));
});
