import {Radio} from 'lucide-react';
import {useMediaURLs} from './mediaTransfer';
import {auth} from '../firebase';
import type {ChannelStatusInfo} from './statusStyle';
export default function ChannelStatusCard({channel,interactive=false}:{channel:ChannelStatusInfo;interactive?:boolean}){
 const urls=useMediaURLs([{id:'shared-channel',fileUrl:channel.photoURL,force:true,fileSize:1}],auth.currentUser?.uid||'');
 return <article className="channel-status-card"><img src={urls['shared-channel']||'/nexus-icon.svg'} alt=""/><strong>{channel.title}</strong><small>{channel.followers} seguidores</small><p>{channel.description}</p><button type="button" disabled={!interactive} onClick={()=>{if(!/^[a-zA-Z0-9_-]{1,128}$/.test(channel.id))return;window.dispatchEvent(new CustomEvent('nexus:channel-open',{detail:channel.id}));window.dispatchEvent(new Event('nexus:status-close'));}}><Radio size={16}/>Ver canal</button></article>;
}
