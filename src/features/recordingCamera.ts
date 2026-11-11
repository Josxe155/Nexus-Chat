import {captureOtherCamera,restoreCallCamera,type CameraFacing} from './callCamera';
const stop=(stream?:MediaStream)=>stream?.getTracks().forEach(track=>track.stop());
export function recordingConstraints(base:MediaStreamConstraints,facing?:CameraFacing):MediaStreamConstraints{
 const video=typeof base.video==='object'?{...base.video}:{};
 if(facing){delete video.deviceId;video.facingMode={exact:facing};}
 else if(!video.deviceId)video.facingMode={ideal:'user'};
 return {...base,video};
}
const actualFacing=(track:MediaStreamTrack|undefined,otherwise:CameraFacing):CameraFacing=>{
 const facing=track?.getSettings().facingMode;return facing==='user'||facing==='environment'?facing:/back|rear|environment|trasera|posterior/i.test(track?.label||'')?'environment':/front|user|frontal|delantera/i.test(track?.label||'')?'user':otherwise;
};
export class RecordingCamera{
 source?:MediaStream;facing:CameraFacing='user';
 private closed=false;private recording=false;private output?:MediaStream;private frame=0;
 constructor(private video:()=>HTMLVideoElement|null,private devices:MediaDevices=navigator.mediaDevices){}
 async open(base:MediaStreamConstraints,facing?:CameraFacing){
  let constraints=recordingConstraints(base,facing),selected:MediaStream;
  try{selected=await this.devices.getUserMedia(constraints);}catch(error){
   const video=constraints.video;
   if(facing||!video||typeof video!=='object'||!video.deviceId||!['NotFoundError','OverconstrainedError'].includes((error as Error).name))throw error;
   const {deviceId,...rest}=video;constraints={...constraints,video:{...rest,facingMode:{ideal:'user'}}};selected=await this.devices.getUserMedia(constraints);
  }
  if(this.closed){stop(selected);return false;}
  if(!selected.getVideoTracks().length){stop(selected);throw Error('camera-missing');}
  this.source=selected;this.facing=actualFacing(selected.getVideoTracks()[0],facing||'user');this.bind();return true;
 }
 private bind(){const video=this.video();if(video&&this.source){video.srcObject=new MediaStream(this.source.getTracks());void video.play().catch(()=>{});}}
 get active(){return !!this.source?.getVideoTracks().some(track=>track.readyState==='live');}
 recordingStream(){
  if(!this.active||!this.source)throw Error('camera-missing');
  if(this.output)return this.output;
  this.recording=true;
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d',{alpha:false});
  if(!canvas.captureStream||!context)return this.source;
  const settings=this.source.getVideoTracks()[0].getSettings();canvas.width=settings.width||640;canvas.height=settings.height||480;
  const draw=()=>{
   if(this.closed)return;
   const video=this.video();
   if(video&&video.readyState>=2&&video.videoWidth&&video.videoHeight){
    const scale=Math.min(canvas.width/video.videoWidth,canvas.height/video.videoHeight),width=video.videoWidth*scale,height=video.videoHeight*scale;
    context.fillStyle='#000';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(video,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
   }
   this.frame=requestAnimationFrame(draw);
  };
  let captured:MediaStream;try{captured=canvas.captureStream(24);}catch{return this.source;}
  if(!captured.getVideoTracks().length){stop(captured);return this.source;}
  this.output=new MediaStream([...captured.getVideoTracks(),...this.source.getAudioTracks()]);draw();return this.output;
 }
 async flip(){
  const source=this.source,old=source?.getVideoTracks()[0];if(!source||!old||this.closed)throw Error('camera-missing');
  const previous=actualFacing(old,this.facing),desired=previous==='user'?'environment':'user',settings=old.getSettings();
  // Without a canvas track, never change the track set of a running recorder.
  if(this.recording&&!this.output){
   try{await old.applyConstraints({facingMode:{exact:desired}});}catch{throw Error('camera-recording-switch-unavailable');}
   if(this.closed)return;
   if(actualFacing(old,previous)!==desired)throw Error('camera-recording-switch-unavailable');
   this.facing=desired;return;
  }
  let selected:MediaStream|undefined,released=false;
  const install=(stream:MediaStream,facing:CameraFacing,verify:boolean)=>{
   if(this.closed){stop(stream);return;}
   const next=stream.getVideoTracks()[0],actual=next?.getSettings();
   if(!next||verify&&(actual?.facingMode&&actual.facingMode!==desired||settings.deviceId&&actual?.deviceId===settings.deviceId)){stop(stream);throw Error('camera-unchanged');}
   source.removeTrack(old);old.stop();source.addTrack(next);stream.getTracks().filter(track=>track!==next).forEach(track=>track.stop());this.facing=actualFacing(next,facing);this.bind();
  };
  try{
   try{selected=await captureOtherCamera(this.devices,desired,settings.deviceId);}catch(error){
    if(this.closed)return;
    if(!['NotReadableError','AbortError'].includes((error as Error).name))throw error;
    source.removeTrack(old);old.stop();released=true;selected=await captureOtherCamera(this.devices,desired,settings.deviceId);
   }
   install(selected,desired,true);
  }catch(error){
   stop(selected);if(this.closed)return;
   if(released){try{install(await restoreCallCamera(this.devices,previous,settings.deviceId),previous,false);}catch{throw Error('camera-restore-failed');}}
   throw error;
  }
 }
 close(){this.closed=true;cancelAnimationFrame(this.frame);stop(this.output);stop(this.source);this.output=undefined;this.source=undefined;const video=this.video();if(video)video.srcObject=null;}
}
export function recordingCameraError(error:unknown){
 if((error as Error)?.message==='camera-restore-failed')return 'No se pudo recuperar la cámara. Detén y revisa el video antes de volver a intentarlo.';
 if(['NotFoundError','OverconstrainedError'].includes((error as Error)?.name)||(error as Error)?.message==='camera-unchanged')return 'No se encontró otra cámara disponible. Puedes continuar con la cámara actual.';
 if(['NotAllowedError','SecurityError'].includes((error as Error)?.name))return 'Permite el acceso a la cámara y al micrófono para grabar.';
 return 'No se pudo cambiar de cámara. Puedes detener y revisar el video, o elegir la cámara antes de grabar.';
}
