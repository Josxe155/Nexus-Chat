import {useEffect,useRef,useState,type RefObject} from 'react';
import type {Message} from '../types';

export function useChatNewMessages(chatId:string,uid:string,messages:Message[],atBottom:boolean){
 const previous=useRef<{chatId:string;ids:Set<string>;tail:string;time:number}|undefined>(undefined),pending=useRef(new Set<string>());
 const [count,setCount]=useState(0);
 const signature=messages.map(m=>m.id+':'+m.senderId+':'+(m.deletedAt||0)).join('|');
 useEffect(()=>{
  const prior=previous.current,tail=messages[messages.length-1],ids=new Set(messages.map(m=>m.id));
  if(!prior||prior.chatId!==chatId||atBottom||messages.length===0)pending.current.clear();
  else{
   const oldTailIndex=messages.findIndex(m=>m.id===prior.tail);
   for(const [index,message] of messages.entries())if(!prior.ids.has(message.id)&&message.senderId!==uid&&!message.deletedAt&&!message.localState&&(oldTailIndex>=0?index>oldTailIndex:message.timestamp>=prior.time))pending.current.add(message.id);
   // A bounded history window can drop messages that are still below the reader.
   // Keep counting those until the reader returns to the bottom; only explicit deletions remove them.
   for(const message of messages)if(message.deletedAt)pending.current.delete(message.id);
  }
  previous.current={chatId,ids,tail:tail?.id||'',time:tail?.timestamp||0};
  setCount(pending.current.size);
 },[chatId,uid,signature,atBottom]);
 return previous.current?.chatId===chatId?count:0;
}

export function useComposerInset(root:RefObject<HTMLDivElement|null>){
 useEffect(()=>{const node=root.current;if(!node)return;let footer:Element|null=null;
  const update=()=>{const next=node.querySelector('.chat-composer');if(next!==footer){if(footer)resize.unobserve(footer);footer=next;if(footer)resize.observe(footer);}const height=footer?.getBoundingClientRect().height||0;node.style.setProperty('--chat-composer-height',height+'px');};
  const resize=new ResizeObserver(update),mutation=new MutationObserver(update);update();mutation.observe(node,{childList:true,subtree:true});
  return()=>{resize.disconnect();mutation.disconnect();};
 },[root]);
}
