// Public, no-account preview API. Never put a private provider key in this module.
export const SPEECH_API = 'https://abena.mobobi.com/playground/api/v1';
export const speechLanguages = {
  twi: {name: 'Twi', asr: 'twi-en', voice: 'abena_twi_high', voiceName: 'Abena · Ghanaian Twi'},
  pidgin: {name: 'Pidgin', asr: 'gpe', voice: 'kobby_gpe', voiceName: 'Kobby · Ghanaian Pidgin'},
  en: {name: 'English', asr: 'en', voice: 'akua_eng', voiceName: 'Akua · Ghanaian English'},
  hausa: {name: 'Hausa', asr: null, voice: 'abubakar_hau', voiceName: 'Abubakar · Hausa (Nigeria)'},
  ga: {name: 'Ga', asr: null, voice: null},
  ewe: {name: 'Ewe', asr: null, voice: null},
  fante: {name: 'Fante', asr: null, voice: null},
};

async function providerRequest(path, options, signal, fetcher = fetch) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  signal?.addEventListener('abort', abort, {once:true});
  const timer = setTimeout(abort, 60000);
  try {
    const response = await fetcher(SPEECH_API + path, {...options, signal:controller.signal, credentials:'omit'});
    if (!response.ok) {
      if ([401,402,429].includes(response.status)) throw new Error('The speech provider’s free preview limit has been reached. Please try later or continue by typing.');
      if ([500,502,503,504].includes(response.status)) throw new Error('The speech service is busy. Please try again shortly; text support is still available.');
      throw new Error('The speech service could not process this request. Please try a shorter recording.');
    }
    return await response.json();
  } catch(error) {
    if(error.name==='AbortError' && !signal?.aborted) throw new Error('The speech service took too long. Please try again.');
    throw error;
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}

export async function transcribeSpeech(blob, language, signal, fetcher) {
  const config = speechLanguages[language];
  if (!config?.asr) throw new Error('Speech recognition is not connected for this language.');
  if (!blob.size || blob.size > 4_000_000) throw new Error('Please record a short request of up to 30 seconds.');
  const extension = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('audio_file',blob,'request.' + extension);
  form.append('language',config.asr);
  const data = await providerRequest('/asr/transcribe/',{method:'POST',body:form},signal,fetcher);
  const transcript = (data.text || data.transcription || '').trim();
  if(!transcript) throw new Error('I could not hear a clear request. Please try again or type it below.');
  if(transcript.length>1000) throw new Error('Please keep your request to one short question.');
  return transcript;
}

export async function synthesizeSpeech(text, language, signal, fetcher) {
  const config = speechLanguages[language];
  if(!config?.voice) throw new Error('A voice is not connected for this language.');
  if(!text.trim() || text.length>500) throw new Error('This answer is available as text only.');
  const data = await providerRequest('/tts/synthesize/',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice:config.voice,speed:1}),
  },signal,fetcher);
  if(data.status!=='success'||typeof data.audio_base64!=='string'||!data.audio_base64||data.audio_base64.length>12_000_000) throw new Error('Voice playback is unavailable right now. Your answer is still shown in the conversation.');
  if(data.mime_type && data.mime_type!=='audio/wav') throw new Error('The speech service returned an unsupported audio format.');
  const bytes=Uint8Array.from(atob(data.audio_base64),char=>char.charCodeAt(0));
  if(String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WAVE') throw new Error('The speech service returned invalid audio.');
  return new Blob([bytes],{type:'audio/wav'});
}
