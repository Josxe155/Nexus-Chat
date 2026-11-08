declare module 'mespeak' {
 const meSpeak:{
  loadConfig(config:unknown):void;
  loadVoice(voice:unknown):void;
  speak(text:string,options:{voice:string;speed:number;rawdata:true}):ArrayBuffer|false;
 };
 export default meSpeak;
}
declare module 'mespeak/voices/es-la.json' {
 const voice:unknown;
 export default voice;
}

declare module 'mespeak/src/mespeak_config.json' {
 const config:unknown;
 export default config;
}
