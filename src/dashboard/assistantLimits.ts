/** Lines mean explicit line breaks, independently of the screen width. */
export const ASSISTANT_MAX_LINES=500;
export const ASSISTANT_MAX_CHARACTERS=250000;
export const lineCount=(text:string)=>text.split(/\r\n|\r|\n/).length;
export function draftError(text:string){
 if(lineCount(text)>ASSISTANT_MAX_LINES)return 'Puedes escribir hasta 500 líneas. Conservamos el borrador para que lo ajustes.';
 if(text.length>ASSISTANT_MAX_CHARACTERS)return 'El mensaje es demasiado extenso. Divídelo en varios mensajes.';
 return '';
}
export function limitAnswer(text:string){
 const lines=text.replace(/\r\n?/g,'\n').split('\n');
 if(lines.length<=ASSISTANT_MAX_LINES&&text.length<=ASSISTANT_MAX_CHARACTERS)return {text,truncated:false};
 const kept:string[]=[];let size=0;
 for(const line of lines){if(kept.length>=ASSISTANT_MAX_LINES-2||size+line.length+1>ASSISTANT_MAX_CHARACTERS-100)break;kept.push(line);size+=line.length+1;}
 // Reserve the last two lines for an explicit limit notice, without cutting a line.
 return {text:kept.join('\n')+'\n\nSe alcanzó el tamaño máximo de esta respuesta. Pide el siguiente apartado.',truncated:true};
}
export function joinContinuation(before:string,next:string){
 if(!before)return next;
 if(next===before)return before;
 // Remove an exact repeated suffix; never collapse ordinary repeated words.
 for(let size=Math.min(before.length,next.length,16000);size>=20;size--){
  if(before.endsWith(next.slice(0,size)))return before+next.slice(size);
 }
 return before+next;
}
