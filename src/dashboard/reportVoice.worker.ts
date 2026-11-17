import type {DownloadProgress} from '../features/resumableVoice';
import {prepareKokoroDownload,kokoroAssetCache} from '../features/kokoroDownload';
import wasmURL from '@nexus-kokoro-wasm?url';
import {KokoroTTS,env as kokoroEnv,type GenerateOptions} from 'kokoro-js';
import {RawAudio,env} from '@huggingface/transformers';
import {initialize,setVoice,getPhonemes} from 'espeak-phonemizer';
import {KOKORO_MODEL,KOKORO_VOICE,KOKORO_LANGUAGE,splitSpanishPhonemes} from '../features/kokoroSpanish';
const scope=self as unknown as {onmessage:((event:MessageEvent<string>)=>void)|null;postMessage:(value:ArrayBuffer|null|{type:'phase';phase:'initializing'|'generating'}|{type:'progress';percent?:number;bytes?:DownloadProgress},transfer?:Transferable[])=>void};
kokoroEnv.wasmPaths={mjs:new URL('/tts/v1/ort-wasm-simd-threaded.jsep.mjs',self.location.origin).href,wasm:new URL(wasmURL,self.location.origin).href};
if(env.backends.onnx.wasm)env.backends.onnx.wasm.numThreads=1;
let ready:Promise<KokoroTTS>|undefined;
function load(){return ready??=(async()=>{
 const model=await prepareKokoroDownload((percent,bytes)=>scope.postMessage({type:'progress',percent,bytes}));
 env.allowLocalModels=false;env.useCustomCache=true;const assetCache=await kokoroAssetCache(model);env.customCache=assetCache;
 scope.postMessage({type:'phase',phase:'initializing'});
 await initialize({wasm:'/tts/v1/espeak/wasm/espeak-ng.wasm',manifest:'/tts/v1/espeak/data/manifest.json',data:'/tts/v1/espeak/data/data.data'});
 await setVoice(KOKORO_LANGUAGE);
 const engine=await KokoroTTS.from_pretrained(KOKORO_MODEL,{dtype:'q8',device:'wasm'});assetCache.releaseModel();return engine;
})();}
let chain=Promise.resolve();
scope.onmessage=event=>{chain=chain.then(async()=>{
 try{
  const tts=await load();scope.postMessage({type:'phase',phase:'generating'});const clauses=getPhonemes(event.data);
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
 }catch(error){console.error('Nexus voice runtime:',error instanceof Error?error.message:'generation-failed');scope.postMessage(null);}
 }).catch(()=>scope.postMessage(null));};
