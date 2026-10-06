import test from 'node:test';
import assert from 'node:assert/strict';
import {speechLanguages,transcribeSpeech,synthesizeSpeech} from '../src/kasa-speech.mjs';

test('unsupported recognition never silently substitutes another language',async()=>{
  let called=false;
  for(const language of ['ga','ewe','fante','hausa'])await assert.rejects(transcribeSpeech(new Blob(['audio']),language,undefined,()=>{called=true;}),/not connected/);
  assert.equal(called,false);
  assert.equal(speechLanguages.pidgin.asr,'gpe');
});
test('transcription uploads actual audio with the correct language and returns the provider transcript',async()=>{
  const text=await transcribeSpeech(new Blob(['audio'],{type:'audio/webm'}),'twi',undefined,async(url,options)=>{
    assert.match(url,/asr\/transcribe/);assert.equal(options.body.get('language'),'twi-en');assert.equal(options.body.get('audio_file').name,'request.webm');
    return {ok:true,json:async()=>({text:'me data nyɛ adwuma'})};
  });
  assert.equal(text,'me data nyɛ adwuma');
});
test('quota exhaustion produces an actionable error without repeated requests',async()=>{
  await assert.rejects(synthesizeSpeech('Akwaaba','twi',undefined,async()=>({ok:false,status:402})),/preview limit/);
});
test('empty transcripts and malformed audio are rejected',async()=>{
  await assert.rejects(transcribeSpeech(new Blob(['audio']),'twi',undefined,async()=>({ok:true,json:async()=>({text:''})})),/clear request/);
  await assert.rejects(synthesizeSpeech('Akwaaba','twi',undefined,async()=>({ok:true,json:async()=>({status:'success',audio_base64:btoa('not audio'),mime_type:'audio/wav'})})),/invalid audio/);
});
test('cancellation prevents uploading and synthesis uses a Ghanaian voice',async()=>{
  const controller=new AbortController();controller.abort();let called=false;
  await assert.rejects(transcribeSpeech(new Blob(['audio']),'twi',controller.signal,()=>{called=true;}),{name:'AbortError'});assert.equal(called,false);
  const blob=await synthesizeSpeech('Akwaaba','twi',undefined,async(url,options)=>{
    assert.equal(JSON.parse(options.body).voice,'abena_twi_high');
    return {ok:true,json:async()=>({status:'success',audio_base64:btoa('RIFF0000WAVEdata'),mime_type:'audio/wav'})};
  });assert.equal(blob.type,'audio/wav');
});
