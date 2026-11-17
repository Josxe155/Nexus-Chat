import {test} from 'node:test';
import assert from 'node:assert/strict';
import {googleSpeechChunks,googleSpeechURL} from '../src/features/googleSpeech.ts';
import {playSpanish,releaseSpanishVoice} from '../src/features/spanishSpeech.ts';

test('preserva las 500 líneas completas en segmentos de voz cortos',()=>{
 const text=Array(500).fill('Mañana sí hay clase. Alexander dijo: "¡Buenos días!"').join('\n');
 const chunks=googleSpeechChunks(text);assert.ok(chunks.length>100);assert.ok(chunks.every(s=>s.length<=100));assert.equal(chunks.join(' '),text.replace(/\s+/g,' '));
});
test('codifica comillas y acentos como datos, con idioma español fijo',()=>{
 const text='¡Hola! "Mañana" & hoy: ¿sí?';const url=new URL(googleSpeechURL(text));
 assert.equal(url.origin,'https://translate.google.com');assert.equal(url.searchParams.get('q'),text);assert.equal(url.searchParams.get('tl'),'es');
 assert.throws(()=>googleSpeechURL(''));assert.throws(()=>googleSpeechURL('a'.repeat(101)));
});
test('limpia Markdown sin leer sus marcas ni perder palabras largas',()=>{
 assert.deepEqual(googleSpeechChunks('**Hola** `Nexus` https://example.org'),['Hola Nexus enlace']);
 const word='ñ'.repeat(1234);assert.equal(googleSpeechChunks(word).join(''),word);
});
async function fixture(run:(audios:any[],states:string[])=>Promise<void>|void){
 const old={Audio:globalThis.Audio,window:globalThis.window};const audios:any[]=[],states:string[]=[];
 class AudioMock{
  src='';preload='';onplaying:any;onended:any;onerror:any;onwaiting:any;onstalled:any;plays:string[]=[];paused=false;
  constructor(){audios.push(this);}play(){this.plays.push(this.src);return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){this.src='';}load(){}
 }
 Object.assign(globalThis,{Audio:AudioMock,window:new EventTarget()});
 try{await run(audios,states);}
 finally{releaseSpanishVoice();Object.assign(globalThis,old);}
}
test('reproduce todos los segmentos con el mismo elemento y termina naturalmente',async()=>fixture((audios,states)=>{
 let errors=0;const text=Array(10).fill('Una frase breve en español.').join(' '),chunks=googleSpeechChunks(text);
 playSpanish(text,s=>states.push(s),()=>errors++);
 for(let i=0;i<chunks.length;i++){assert.equal(new URL(audios[0].src).searchParams.get('q'),chunks[i]);audios[0].onplaying();assert.equal(states.at(-1),'playing');audios[0].onended();}
 assert.equal(audios.length,1);assert.equal(audios[0].plays.length,chunks.length);assert.equal(states.at(-1),'idle');assert.equal(errors,0);
}));
test('un error no reinicia la lectura; un clic nuevo permite reintentar',async()=>fixture((audios,states)=>{
 let errors=0;const start=()=>playSpanish('Hola',s=>states.push(s),()=>errors++);
 start();const late=audios[0].onerror;late();late();assert.equal(errors,1);assert.equal(audios.length,1);assert.equal(states.at(-1),'idle');
 start();assert.equal(audios.length,2);assert.equal(audios[1].plays.length,1);
}));
test('cancelar descarta eventos tardíos y libera el audio',async()=>fixture((audios,states)=>{
 let errors=0;const stop=playSpanish('Hola',s=>states.push(s),()=>errors++),late=audios[0].onended;stop();late();
 assert.equal(audios[0].plays.length,1);assert.equal(audios[0].paused,true);assert.equal(audios[0].src,'');assert.equal(errors,0);assert.equal(states.at(-1),'idle');
}));
test('una lectura nueva y salir de la página detienen la anterior',async()=>fixture((audios)=>{
 playSpanish('Primera',()=>{},()=>{});playSpanish('Segunda',()=>{},()=>{});assert.equal(audios[0].paused,true);
 window.dispatchEvent(new Event('pagehide'));assert.equal(audios[1].paused,true);
}));
test('los eventos de espera no extienden el límite de veinte segundos',async()=>{
 const old=globalThis.setTimeout;let deadline:(()=>void)|undefined,count=0;
 globalThis.setTimeout=((fn:any,ms:number)=>{if(ms===20000){deadline=fn;count++;}return old(fn,ms);}) as typeof setTimeout;
 try{await fixture((audios,states)=>{let errors=0;playSpanish('Hola',s=>states.push(s),()=>errors++);audios[0].onwaiting();audios[0].onstalled();assert.equal(count,1);deadline!();assert.equal(errors,1);assert.equal(states.at(-1),'idle');assert.equal(audios.length,1);});}finally{globalThis.setTimeout=old;}
});
test('el texto vacío no solicita audio ni deja activa una lectura',async()=>fixture(async(audios,states)=>{
 playSpanish(' ',s=>states.push(s),()=>assert.fail());await Promise.resolve();assert.equal(audios.length,0);assert.equal(states.at(-1),'idle');
}));
