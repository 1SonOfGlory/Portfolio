import React,{useState,useEffect,useRef} from 'react';
import {Mic,Square,Volume2,Headphones} from 'lucide-react';
import {speechLanguages,transcribeSpeech,synthesizeSpeech} from './kasa-speech.mjs';

export default function KasaVoice({language,onTranscript,reply}) {
  const [consent,setConsent]=useState(false),[phase,setPhase]=useState('idle'),[error,setError]=useState(''),[level,setLevel]=useState(0),[seconds,setSeconds]=useState(0),[audioUrl,setAudioUrl]=useState('');
  const [supported,setSupported]=useState(false);
  const resources=useRef({}),operation=useRef(0),controller=useRef(null),urlRef=useRef(''),audioRef=useRef(null),mounted=useRef(true);
  const config=speechLanguages[language];
  const busy=['requesting','listening','transcribing','preparing'].includes(phase);
  useEffect(()=>{mounted.current=true;setSupported(Boolean(navigator.mediaDevices?.getUserMedia&&window.MediaRecorder));return()=>{mounted.current=false;cancel();};},[]);
  function releaseMic(){
    const r=resources.current;
    clearInterval(r.meter);clearTimeout(r.limit);
    r.stream?.getTracks().forEach(track=>track.stop());
    r.context?.close().catch(()=>{});
    resources.current={};
  }
  function clearAudio(){audioRef.current?.pause();if(urlRef.current)URL.revokeObjectURL(urlRef.current);urlRef.current='';if(mounted.current)setAudioUrl('');}
  function cancel(){
    operation.current++;controller.current?.abort();
    const recorder=resources.current.recorder;
    if(recorder&&recorder.state!=='inactive'){recorder.onstop=null;recorder.stop();}
    releaseMic();clearAudio();
    if(mounted.current){setPhase('idle');setLevel(0);}
  }
  useEffect(()=>{cancel();setError('');setConsent(false);},[language]);
  useEffect(()=>{const hidden=()=>{if(document.hidden)cancel();};document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);},[]);
  async function speak(text,id,signal){
    setPhase('preparing');
    const audio=await synthesizeSpeech(text,language,signal);
    if(id!==operation.current||!mounted.current)return;
    clearAudio();const url=URL.createObjectURL(audio);urlRef.current=url;setAudioUrl(url);setPhase('ready');
    // Keep native audio controls available when browser autoplay rules prevent playback.
    requestAnimationFrame(()=>{if(id!==operation.current||!audioRef.current)return;audioRef.current.play().catch(()=>{if(mounted.current)setPhase('ready');});});
  }
  async function replay(){
    cancel();setError('');const id=++operation.current;const aborter=new AbortController();controller.current=aborter;
    try{await speak(reply,id,aborter.signal);}catch(e){if(id===operation.current&&e.name!=='AbortError'){setError(e.message||'Could not reach the speech provider. Please try again.');setPhase('idle');}}
  }
  function finish(){const recorder=resources.current.recorder;if(recorder?.state==='recording')recorder.stop();}
  async function record(){
    cancel();setError('');setSeconds(0);setPhase('requesting');const id=++operation.current;
    const aborter=new AbortController();controller.current=aborter;
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}});
      if(id!==operation.current||!mounted.current){stream.getTracks().forEach(t=>t.stop());return;}
      resources.current.stream=stream;
      const type=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
      const recorder=new MediaRecorder(stream,type?{mimeType:type}:undefined),chunks=[];
      resources.current.recorder=recorder;
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onerror=()=>{cancel();setError('The microphone recording failed. Please try again.');};
      recorder.onstop=async()=>{
        releaseMic();if(id!==operation.current||!mounted.current)return;setLevel(0);setPhase('transcribing');
        try{
          const text=await transcribeSpeech(new Blob(chunks,{type:recorder.mimeType}),language,aborter.signal);
          if(id!==operation.current||!mounted.current)return;
          const answer=onTranscript(text);
          await speak(answer,id,aborter.signal);
        }catch(e){if(id===operation.current&&mounted.current&&e.name!=='AbortError'){setError(e.message||'Could not reach the speech provider. You can still type your request.');setPhase('idle');}}
      };
      recorder.start();setPhase('listening');
      const started=Date.now();let speechStarted=false,lastSpeech=started;
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(AudioContext){
        const context=new AudioContext(),analyser=context.createAnalyser();analyser.fftSize=512;
        resources.current.context=context;context.createMediaStreamSource(stream).connect(analyser);context.resume().catch(()=>{});
        const data=new Uint8Array(analyser.fftSize);
        resources.current.meter=setInterval(()=>{
          analyser.getByteTimeDomainData(data);
          const rms=Math.sqrt(data.reduce((sum,n)=>sum+((n-128)/128)**2,0)/data.length);
          setLevel(Math.min(100,rms*550));setSeconds(Math.floor((Date.now()-started)/1000));
          if(rms>.025){speechStarted=true;lastSpeech=Date.now();}
          if(speechStarted&&Date.now()-lastSpeech>1500&&Date.now()-started>1500)finish();
        },100);
      }
      resources.current.limit=setTimeout(finish,30000);
    }catch(e){if(id===operation.current&&mounted.current){cancel();setError(e.name==='NotAllowedError'?'Microphone access was denied. Allow it in your browser or continue by typing.':e.name==='NotFoundError'?'No microphone was found. Connect one or type your request.':'The microphone could not start. Please try again or type your request.');}}
  }
  const status={idle:'Ready when you are',requesting:'Waiting for microphone permission…',listening:'Listening… pause when you finish',transcribing:'Turning your voice into text…',preparing:'Preparing your spoken reply…',ready:'Your reply is ready — press play if needed',speaking:'Kasa is speaking…'}[phase];
  return <section className="kasa-voice" aria-label="Voice conversation">
    <div className="kasa-voice-heading"><Headphones size={19}/><div><strong>Speak to Kasa</strong><span>{config?.voiceName||'Voice integration pending'}</span></div><span className="kasa-voice-badge">Voice preview</span></div>
    <p className="kasa-voice-info">{config?.asr?'Speak naturally, then pause. Your request appears as text and Kasa reads its answer aloud. Transcription appears after each utterance, not word by word.':'Microphone input is not yet available for this language. You can type and hear a reply where a voice is connected.'}</p>
    <label className="kasa-voice-consent"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked)cancel();}}/> I agree to send my recording and reply text to Abena AI for speech processing. I won’t include account numbers, PINs or other private details.</label>
    <div className="kasa-voice-buttons">{phase==='listening'?<button className="kasa-button" onClick={finish}><Square size={15}/> Finish speaking</button>:<button className="kasa-button" disabled={!consent||!config?.asr||!supported||busy} onClick={record}><Mic size={16}/> Speak in {config?.name}</button>}<button className="kasa-voice-listen" disabled={!consent||!config?.voice||!reply||busy} onClick={replay}><Volume2 size={15}/> Hear latest reply</button>{phase!=='idle'&&<button className="kasa-voice-cancel" onClick={cancel}>Cancel audio</button>}</div>
    <div className="kasa-voice-status" role="status" aria-live="polite">{status}{phase==='listening'&&<span> · {seconds}s / 30s</span>}</div>
    {phase==='listening'&&<div className="kasa-mic-meter" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level)}><span style={{width:level+'%'}}/></div>}
    {audioUrl&&<audio ref={audioRef} src={audioUrl} controls onPlay={()=>setPhase('speaking')} onPause={()=>setPhase('ready')} onEnded={()=>setPhase('ready')} onError={()=>{setError('Audio could not play. Your text reply is still available.');setPhase('idle');}} aria-label={'Kasa reply in '+config.name}/>}
    {error&&<p className="kasa-voice-error" role="alert">{error}</p>}
    {!supported&&<p className="kasa-voice-error">Microphone recording requires a compatible browser and a secure HTTPS connection.</p>}
    <p className="kasa-voice-fine">Internet is required for this browser voice preview. Free provider limits and processing delays apply. <a href="https://abena.mobobi.com/playground/tts/" target="_blank" rel="noreferrer">Speech provider ↗</a></p>
  </section>;
}
