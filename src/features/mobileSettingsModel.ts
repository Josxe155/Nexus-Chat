export const mobileColors=[
 ['Verde','#22c56a'],['Grafito','#75848b'],['Océano','#209bc1'],['Ciruela','#ab65cf'],
 ['Rosa','#eb4c91'],['Azul','#398aec'],['Cielo','#399ed3'],['Violeta','#8b71e7'],
 ['Oliva','#91ad38'],['Turquesa','#18a994'],['Cian','#21a9ac'],['Bosque','#74a57c'],
 ['Amarillo','#dbc225'],['Arena','#bda182'],['Café','#bb8a66'],['Frambuesa','#e0547d'],
 ['Oro','#d7a646'],['Terracota','#dc784a'],['Coral','#e25563'],['Naranja','#f27947'],
] as const;
export const mobileIcons=[['Nexus',''],['Verde','#21c063'],['Azul','#58a8ff'],['Violeta','#b989ff'],['Coral','#ff808a']] as const;
const accentKey='nexus-mobile-accent',iconKey='nexus-mobile-icon';
export const mobileSettingsQuery='(max-width: 599px), (pointer: coarse) and (max-height: 599px)';
export const mobileSettingsActive=()=>matchMedia(mobileSettingsQuery).matches;
export const readMobileAccent=()=>mobileColors.find(([,color])=>color===localStorage.getItem(accentKey))?.[1]||mobileColors[0][1];
export const readMobileIcon=()=>mobileIcons.find(([,color])=>color===localStorage.getItem(iconKey))?.[1]||'';
export function mobileIconURL(color:string){
 if(!mobileIcons.some(([,value])=>value===color)||!color)return '/nexus-icon.svg?v=3';
 return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color}"/><path d="M15 17h34v24H33L21 49v-8h-6zM22 24h20v3H22zm0 8h14v3H22z" fill="#101820" fill-rule="evenodd"/></svg>`);
}
export function applyMobileBranding(){
 const root=document.documentElement;
 const active=mobileSettingsActive();
 if(active)root.style.setProperty('--nx-mobile-accent',readMobileAccent());else root.style.removeProperty('--nx-mobile-accent');
 document.querySelector<HTMLLinkElement>('link[rel=icon][type="image/svg+xml"]')?.setAttribute('href',mobileIconURL(active?readMobileIcon():''));
}
export function saveMobileBranding(key:'accent'|'icon',color:string){
 localStorage.setItem(key==='accent'?accentKey:iconKey,color);
 applyMobileBranding();
}

export type FocusSchedule={start:string;end:string};
export function focusActive(schedule?:FocusSchedule,now=new Date()){
 if(!schedule)return false;
 const minutes=(time:string)=>{const [h,m]=time.split(':').map(Number);return h*60+m;};
 if(![schedule.start,schedule.end].every(time=>typeof time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))return false;
 const from=minutes(schedule.start),to=minutes(schedule.end),current=now.getHours()*60+now.getMinutes();
 return from<to?current>=from&&current<to:from>to&&(current>=from||current<to);
}

export type DownloadNetwork='wifi'|'mobile'|'roaming';
export type DownloadSelection={photos:boolean;audio:boolean;videos:boolean;documents:boolean};
export const downloadFields={photos:'Fotos',audio:'Audio',videos:'Videos',documents:'Documentos'} as const;
export function networkProfile(connection?:{type?:string;roaming?:boolean}):DownloadNetwork|undefined{
 if(connection?.roaming===true)return 'roaming';
 if(connection?.type==='cellular')return 'mobile';
 if(connection?.type==='wifi'||connection?.type==='ethernet')return 'wifi';
}
export const browserConnection=()=> (navigator as Navigator&{connection?:EventTarget&{type?:string;roaming?:boolean}}).connection;

export type NoticeVibration='off'|'default'|'short'|'long';
export function vibrationPattern(value:NoticeVibration='off'){
 return {off:[],default:[140],short:[70],long:[170,80,170]}[value]||[];
}

export function limitCallBitrate(pc:RTCPeerConnection){
 for(const sender of pc.getSenders()){
  if(!sender.track)continue;
  try{
   const parameters=sender.getParameters();
   if(!parameters.encodings?.length)continue;
   const limit=sender.track.kind==='audio'?24000:400000;
   for(const encoding of parameters.encodings)encoding.maxBitrate=Math.min(encoding.maxBitrate??limit,limit);
   void sender.setParameters(parameters).catch(()=>{});
  }catch{}
 }
}
