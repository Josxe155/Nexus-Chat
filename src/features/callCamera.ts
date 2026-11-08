export type CameraFacing='user'|'environment';
const resolution={width:{ideal:640},height:{ideal:480}};
const capture=(devices:MediaDevices,video:MediaTrackConstraints)=>devices.getUserMedia({audio:false,video:{...resolution,...video}});
const labelFacing=(label:string):CameraFacing|undefined=>/back|rear|environment|trasera|posterior/i.test(label)?'environment':/front|user|frontal|delantera/i.test(label)?'user':undefined;

export async function captureOtherCamera(devices:MediaDevices,desired:CameraFacing,oldDevice?:string){
 try{
  return await capture(devices,{facingMode:{exact:desired}});
 }catch(error){
  if(!['NotFoundError','OverconstrainedError'].includes((error as Error).name))throw error;
  const alternate=(await devices.enumerateDevices()).find(device=>device.kind==='videoinput'&&device.deviceId!==oldDevice&&labelFacing(device.label)===desired);
  if(!alternate)throw error;
  return capture(devices,{deviceId:{exact:alternate.deviceId}});
 }
}

export async function restoreCallCamera(devices:MediaDevices,previous:CameraFacing,deviceId?:string){
 if(deviceId){try{return await capture(devices,{deviceId:{exact:deviceId}});}catch(error){if(!['NotFoundError','OverconstrainedError'].includes((error as Error).name))throw error;}}
 return capture(devices,{facingMode:{ideal:previous}});
}

export async function replaceCameraSenders(senders:RTCRtpSender[],next:MediaStreamTrack,previous:MediaStreamTrack|null){
 const replaced:RTCRtpSender[]=[];
 try{
  for(const sender of senders){await sender.replaceTrack(next);replaced.push(sender);}
 }catch(error){
  await Promise.allSettled(replaced.map(sender=>sender.replaceTrack(previous?.readyState==='live'?previous:null)));
  throw error;
 }
}
