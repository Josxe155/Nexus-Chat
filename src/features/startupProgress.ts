export const LARGE_INBOX=40;
export type StartupProgress={completed:number;total:number};
export async function prepareConversations<T>(documents:{data:()=>T}[],onProgress:(value:StartupProgress)=>void,isCurrent:()=>boolean):Promise<T[]|null>{
 const result:T[]=[];if(documents.length<LARGE_INBOX)return documents.map(document=>document.data());
 onProgress({completed:0,total:documents.length});
 for(let index=0;index<documents.length;index+=25){
  // Yield between real batches so large inboxes remain responsive.
  await new Promise<void>(resolve=>setTimeout(resolve,0));if(!isCurrent())return null;
  for(const document of documents.slice(index,index+25))result.push(document.data());
  onProgress({completed:result.length,total:documents.length});
 }
 return result;
}
