import meSpeak from 'mespeak';
import config from 'mespeak/src/mespeak_config.json';
import spanish from 'mespeak/voices/es-la.json';

const scope=self as unknown as {
 onmessage:((event:MessageEvent<string>)=>void)|null;
 postMessage:(audio:ArrayBuffer|null,transfer?:Transferable[])=>void;
};

let initialized=false;
scope.onmessage=event=>{
 try{
  if(!initialized){meSpeak.loadConfig(config);meSpeak.loadVoice(spanish);initialized=true;}
  const wav=meSpeak.speak(event.data,{voice:'es-la',speed:160,rawdata:true});
  if(!(wav instanceof ArrayBuffer)||wav.byteLength<=44)throw Error('Audio vacío');
  // Transfer a copy: the synthesis engine may reuse its own backing storage.
  const copy=wav.slice(0);scope.postMessage(copy,[copy]);
 }catch{
  scope.postMessage(null);
 }
};
