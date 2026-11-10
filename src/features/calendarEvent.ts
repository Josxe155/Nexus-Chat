const escapeText=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\r\n?|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const stamp=(time:number)=>new Date(time).toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
export function calendarEvent({id,name,description,start,end,location='',organizer='',remind=true,now=Date.now()}:{id:string;name:string;description:string;start:number;end:number;location?:string;organizer?:string;remind?:boolean;now?:number}){
 if(!name.trim()||name.length>120||description.length>2000||location.length>250||!Number.isFinite(start)||start<=now)throw Error('Escribe el nombre y elige una fecha futura.');
 if(!Number.isFinite(end)||end<=start)throw Error('La finalización debe ser posterior al inicio.');
 if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('No se pudo identificar el evento.');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nexus Chat//Evento//ES','BEGIN:VEVENT','UID:'+id+'@nexus','DTSTAMP:'+stamp(now),'DTSTART:'+stamp(start),'DTEND:'+stamp(end),'SUMMARY:'+escapeText(name.trim()),'DESCRIPTION:'+escapeText(description),'LOCATION:'+escapeText(location),...(organizer?['X-NEXUS-ORGANIZER:'+escapeText(organizer)]:[]),...(remind?['BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-PT1H','DESCRIPTION:'+escapeText(name.trim()),'END:VALARM']:[]),'END:VEVENT','END:VCALENDAR',''];
 // Fold by UTF-8 bytes without splitting code points, as required by iCalendar.
 return lines.map(line=>{let out='',part='',size=0;for(const char of line){const bytes=new TextEncoder().encode(char).length;if(size+bytes>75){out+=part+'\r\n ';part='';size=1;}part+=char;size+=bytes;}return out+part;}).join('\r\n');
}
