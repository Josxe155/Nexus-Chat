import {spanishSpeechChunks} from './speechChunks';

/** Short requests for the web audio service, preserving the complete spoken text. */
export function googleSpeechChunks(text:string){
 const result:string[]=[];
 for(let remaining of spanishSpeechChunks(text)){
  while(remaining.length>100){
   const head=remaining.slice(0,100);
   const sentence=[...head.matchAll(/[.!?;:]\s/g)].at(-1)?.index;
   let end=sentence!==undefined&&sentence>=30?sentence+1:head.lastIndexOf(' ');
   if(end<30)end=100;
   if(/[\uD800-\uDBFF]/.test(remaining[end-1]))end--;
   result.push(remaining.slice(0,end));remaining=remaining.slice(end).trimStart();
  }
  if(remaining)result.push(remaining);
 }
 return result;
}
export function googleSpeechURL(text:string){
 if(!text.trim()||text.length>100)throw new Error('Invalid speech segment');
 const url=new URL('https://translate.google.com/translate_tts');
 url.search=new URLSearchParams({ie:'UTF-8',client:'tw-ob',tl:'es',q:text}).toString();
 return url.href;
}
