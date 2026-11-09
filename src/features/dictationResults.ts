export type DictationResult={isFinal:boolean;0:{transcript:string}};
const words=(value:string)=>value.trim().split(/\s+/).filter(Boolean);
const same=(a:string,b:string)=>a.toLocaleLowerCase().replace(/[.,!?;:]+$/g,'')===b.toLocaleLowerCase().replace(/[.,!?;:]+$/g,'');
function combine(parts:string[]){
 const output:string[]=[];
 for(const part of parts){
  const next=words(part);
  if(output.length&&next.length>output.length&&output.every((word,index)=>same(word,next[index]))){output.splice(0,output.length,...next);continue;}
  let overlap=0;
  for(let count=Math.min(output.length,next.length);count>=2;count--)if(next.slice(0,count).every((word,index)=>same(word,output[output.length-count+index]))){overlap=count;break;}
  output.push(...next.slice(overlap));
 }
 return output.join(' ');
}
export function collectDictation(){
 let previous='';
 return (_resultIndex:number,results:ArrayLike<DictationResult>)=>{
  const finals:string[]=[],interims:string[]=[];
  for(let index=0;index<results.length;index++)(results[index].isFinal?finals:interims).push(results[index][0].transcript);
  const transcript=combine(finals),changed=transcript!==previous;previous=transcript;
  return {text:changed?transcript:'',transcript,changed,interim:combine(interims)};
 };
}
