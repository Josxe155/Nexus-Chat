import wasmURL from '@nexus-kokoro-wasm?url';
import {KokoroTTS,env as kokoroEnv,type GenerateOptions} from 'kokoro-js';
import {RawAudio,env} from '@huggingface/transformers';
import {initialize,setVoice,getPhonemes} from 'espeak-phonemizer';
import {KOKORO_MODEL,KOKORO_VOICE,KOKORO_LANGUAGE,splitSpanishPhonemes} from '../features/kokoroSpanish';
const scope=self as unknown as {onmessage:((event:MessageEvent<string>)=>void)|null;postMessage:(value:ArrayBuffer|null|{type:'progress';percent?:number},transfer?:Transferable[])=>void};
kokoroEnv.wasmPaths={mjs:new URL('/tts/v1/ort-wasm-simd-threaded.jsep.mjs',self.location.origin).href,wasm:new URL(wasmURL,self.location.origin).href};
if(env.backends.onnx.wasm)env.backends.onnx.wasm.numThreads=1;
let ready:Promise<KokoroTTS>|undefined;
function load(){return ready??=(async()=>{
 await initialize({wasm:'/tts/v1/espeak/wasm/espeak-ng.wasm',manifest:'/tts/v1/espeak/data/manifest.json',data:'/tts/v1/espeak/data/data.data'});
 await setVoice(KOKORO_LANGUAGE);
 return KokoroTTS.from_pretrained(KOKORO_MODEL,{dtype:'q8',device:'wasm',progress_callback:(info)=>{if('progress' in info&&'file' in info&&String(info.file).endsWith('.onnx'))scope.postMessage({type:'progress',percent:Math.max(0,Math.min(100,Math.floor(Number(info.progress))))});}});
})();}
let chain=Promise.resolve();
scope.onmessage=event=>{chain=chain.then(async()=>{
 try{
  const tts=await load();scope.postMessage({type:'progress'});const clauses=getPhonemes(event.data);
  const phonemes=clauses.map(clause=>clause.phonemes+clause.terminator).join(' ');
  const parts:Float32Array[]=[];
  // KokoroJS' English-only catalog does not describe the model's Spanish voice.
  // The public phoneme-ID API accepts its published Spanish style weights.
  const options={voice:KOKORO_VOICE,speed:1} as unknown as GenerateOptions;
  for(const part of splitSpanishPhonemes(phonemes)){
   const {input_ids}=tts.tokenizer(part,{truncation:false});
   if(input_ids.dims.at(-1)!>512)throw Error('Speech segment too long');
   const audio=await tts.generate_from_ids(input_ids,options);parts.push(audio.audio);
  }
  const total=parts.reduce((sum,part)=>sum+part.length,0);if(!total)throw Error('Empty audio');
  const samples=new Float32Array(total);let offset=0;for(const part of parts){samples.set(part,offset);offset+=part.length;}
  const wav=new RawAudio(samples,24000).toWav();scope.postMessage(wav,[wav]);
 }catch{scope.postMessage(null);}
 }).catch(()=>scope.postMessage(null));};
