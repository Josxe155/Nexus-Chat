export type DictationResult={isFinal:boolean;0:{transcript:string}};
export function collectDictation(){
 const delivered=new Set<number>();
 return (resultIndex:number,results:ArrayLike<DictationResult>)=>{
  const final:string[]=[],draft:string[]=[];
  for(let index=resultIndex;index<results.length;index++){
   const result=results[index];
   if(result.isFinal){if(!delivered.has(index)){delivered.add(index);final.push(result[0].transcript);}}
   else draft.push(result[0].transcript);
  }
  return {text:final.join(' ').trim(),interim:draft.join(' ').trim()};
 };
}
