import {useEffect,useState} from 'react';
export type CallQuality={state:'waiting'|'good'|'fair'|'poor'|'reconnecting';rtt?:number;loss?:number};
export function qualityFrom(rtt:number|undefined,loss:number|undefined):CallQuality['state']{return (rtt||0)>600||(loss||0)>8?'poor':(rtt||0)>300||(loss||0)>3?'fair':'good';}
export function useCallQuality(peers:React.MutableRefObject<Map<string,RTCPeerConnection>>,roomId?:string){
 const [quality,setQuality]=useState<CallQuality>({state:'waiting'});
 useEffect(()=>{let live=true,running=false;const previous=new Map<string,{received:number;lost:number}>();setQuality({state:'waiting'});if(!roomId)return;
 const sample=async()=>{if(running)return;running=true;try{let rtt:number|undefined,received=0,lost=0,measured=false,reconnecting=false,connected=false;
 for(const [uid,pc]of peers.current){reconnecting ||= ['failed','disconnected','connecting'].includes(pc.connectionState);connected ||= pc.connectionState==='connected';try{const stats=await pc.getStats();stats.forEach(report=>{if(report.type==='candidate-pair'&&report.state==='succeeded'&&(report.nominated||report.selected)&&Number.isFinite(report.currentRoundTripTime))rtt=Math.max(rtt||0,report.currentRoundTripTime*1000);if(report.type==='inbound-rtp'&&!report.isRemote&&Number.isFinite(report.packetsReceived)){const key=uid+':'+report.id,now={received:report.packetsReceived,lost:Math.max(0,report.packetsLost||0)},old=previous.get(key);previous.set(key,now);if(old&&now.received>=old.received&&now.lost>=old.lost){received+=now.received-old.received;lost+=now.lost-old.lost;measured=true;}}});}catch{}}
 const loss=measured&&received+lost>0?100*lost/(received+lost):undefined;if(live)setQuality({state:reconnecting?'reconnecting':!connected?'waiting':rtt===undefined&&loss===undefined?'waiting':qualityFrom(rtt,loss),rtt:rtt===undefined?undefined:Math.round(rtt),loss:loss===undefined?undefined:Math.round(loss*10)/10});
 }finally{running=false;}};void sample();const timer=setInterval(sample,4000);return()=>{live=false;clearInterval(timer);};},[roomId]);return quality;
}
