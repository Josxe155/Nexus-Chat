export type CallAudioRoute={id:string;label:string;kind:'speaker'|'phone'|'headset'|'system'};
type OutputDevice=Pick<MediaDeviceInfo,'kind'|'deviceId'|'label'|'groupId'>;
const cleanLabel=(label:string)=>label.replace(/^(?:default|communications|predeterminado|comunicaciones)\s*[-–:]\s*/i,'').trim();
function route(device:OutputDevice):CallAudioRoute{
 const name=cleanLabel(device.label);
 const kind=/headphones?|headset|earbuds?|airpods?|bluetooth|aud[ií]fonos?|auriculares(?!\s+intern)|\bvisor\b|\bbuds\b/i.test(name)?'headset':/earpiece|receiver|auricular interno|tel[eé]fono|receptor/i.test(name)?'phone':/speakers?|loudspeaker|altavo[cz]/i.test(name)?'speaker':'system';
 return {id:device.deviceId,label:kind==='speaker'?'Altavoz':kind==='phone'?'Teléfono':name||'Salida del sistema',kind};
}
export function callAudioRoutes(devices:OutputDevice[]):CallAudioRoute[]{
 const outputs=devices.filter(d=>d.kind==='audiooutput'&&d.deviceId),physical=outputs.filter(d=>d.deviceId!=='default'&&d.deviceId!=='communications');
 // Virtual defaults describe a physical output; don't show duplicate entries.
 const rows=physical.length?physical:outputs.filter(d=>d.deviceId!=='communications');
 const ordered={speaker:0,phone:1,headset:2,system:3};
 return rows.map(route).sort((a,b)=>ordered[a.kind]-ordered[b.kind]);
}
export function currentCallAudioRoute(devices:OutputDevice[],id:string):CallAudioRoute{
 const outputs=devices.filter(d=>d.kind==='audiooutput');
 const selected=outputs.find(d=>d.deviceId===(id||'default'));
 if(selected){const physical=selected.deviceId==='default'?outputs.find(d=>d.deviceId!=='default'&&d.deviceId!=='communications'&&((selected.groupId&&d.groupId===selected.groupId)||cleanLabel(d.label)===cleanLabel(selected.label))):undefined;return route(physical||selected);}
 return {id:id||'',label:'Salida del sistema',kind:'system'};
}
export function callAudioOutputError(error:unknown){
 const name=(error as {name?:string})?.name;
 if(name==='NotAllowedError')return 'Permite usar la salida de audio seleccionada en el navegador.';
 if(name==='NotFoundError')return 'Esa salida de audio ya no está conectada. Elige otra salida.';
 return 'No se pudo cambiar la salida de audio. Revisa los controles de sonido del dispositivo.';
}
export type CallAudioElement=Pick<HTMLMediaElement,'sinkId'|'setSinkId'>;
/** Route every remote participant together; microphone, volume and mute are untouched. */
export async function routeCallAudio(elements:CallAudioElement[],id:string){
 if(!elements.length||elements.some(element=>typeof element.setSinkId!=='function'))throw Error('audio-output-unavailable');
 const previous=elements.map(element=>element.sinkId||'');
 const changed=await Promise.allSettled(elements.map(element=>element.setSinkId(id)));
 const failed=changed.find(result=>result.status==='rejected');
 if(failed?.status==='rejected'){
  await Promise.allSettled(elements.map((element,index)=>element.setSinkId(previous[index])));
  throw failed.reason;
 }
}
