/** Keep synthesis jobs short; the player only holds two decoded jobs at once. */
export function spanishSpeechChunks(text:string){
 const clean=text.replace(/https?:\/\/\S+/g,'enlace').replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D#*`_]/gu,'').replace(/\s+/g,' ').trim();
 const chunks:string[]=[];let remaining=clean;
 while(remaining){
  if(remaining.length<=320){chunks.push(remaining);break;}
  const head=remaining.slice(0,320);
  const sentence=[...head.matchAll(/[.!?;:]\s/g)].at(-1)?.index;
  let end=sentence!==undefined&&sentence>=100?sentence+1:head.lastIndexOf(' ');
  if(end<80)end=320;
  if(/[\uD800-\uDBFF]/.test(remaining[end-1]))end--;
  chunks.push(remaining.slice(0,end));remaining=remaining.slice(end).trimStart();
 }
 return chunks;
}
