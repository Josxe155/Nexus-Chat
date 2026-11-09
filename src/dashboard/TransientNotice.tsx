import {useEffect,useRef} from 'react';
export default function TransientNotice({message,onClose}:{message:string;onClose:()=>void}){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{if(!message)return;const timer=setTimeout(()=>close.current(),3000);return()=>clearTimeout(timer);},[message]);
 return message?<span className="assistant-transient" role="alert">{message}</span>:null;
}
