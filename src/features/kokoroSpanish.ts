export const KOKORO_MODEL='onnx-community/Kokoro-82M-v1.0-ONNX';
export const KOKORO_VOICE='ef_dora';
export const KOKORO_LANGUAGE='es-419';
/** Keep every phoneme, including long expanded numbers, below the 512-token model limit. */
export function splitSpanishPhonemes(input:string){
 const result:string[]=[];let chars=Array.from(input.replace(/g/g,'ɡ'));
 while(chars.length){let end=Math.min(400,chars.length);if(end<chars.length){const space=chars.slice(0,end).lastIndexOf(' ');if(space>80)end=space;}const part=chars.slice(0,end).join('').trim();if(part)result.push(part);chars=chars.slice(end);}
 return result;
}
