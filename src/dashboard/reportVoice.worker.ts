import meSpeak from 'mespeak';
import config from 'mespeak/src/mespeak_config.json';
import spanish from 'mespeak/voices/es-la.json';

const scope=self as unknown as {
 onmessage:((event:MessageEvent<string>)=>void)|null;
 postMessage:(audio:ArrayBuffer|null,transfer?:Transferable[])=>void;
};

scope.onmessage=event=>{
 try{
  meSpeak.loadConfig(config);
  meSpeak.loadVoice(spanish);
  const wav=meSpeak.speak(event.data,{voice:'es-la',speed:160,rawdata:true});
  if(!(wav instanceof ArrayBuffer)||wav.byteLength<=44)throw Error('Audio vacío');
  scope.postMessage(wav,[wav]);
 }catch{
  scope.postMessage(null);
 }
};
