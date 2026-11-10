import {parsePhoneNumberFromString,type CountryCode} from 'libphonenumber-js';
export function normalizeContactNumber(country:string,input:string){
 const compact=input.trim().replace(/[\s().-]/g,'');
 if(!/^\+?\d+$/.test(compact))throw Error('Escribe un teléfono válido con su código de país.');
 const international=compact.startsWith('00')?'+'+compact.slice(2):compact;
 if(country==='OTHER'&&!international.startsWith('+'))throw Error('Incluye el prefijo internacional del número.');
 const parsed=parsePhoneNumberFromString(international,country==='OTHER'?undefined:country as CountryCode);
 if(!parsed?.isPossible()||parsed.ext||!/^\+[1-9]\d{6,14}$/.test(parsed.number))throw Error('Escribe un teléfono válido con su código de país.');
 return String(parsed.number);
}
export type ContactDraft={first:string;last:string;username:string;country:string;number:string};
export type PreparedContact={first:string;last:string;username:string;phone:string};
export function prepareContactDraft(draft:ContactDraft):PreparedContact{
 const first=draft.first.trim(),last=draft.last.trim(),username=draft.username.trim().replace(/^@/,'').toLowerCase();
 if(!first)throw Error('Escribe el nombre del contacto.');
 if(first.length>80||last.length>40||[first,last].filter(Boolean).join(' ').length>128)throw Error('Revisa la longitud del nombre y el apellido.');
 if(username&&!/^[a-z0-9_.]{3,32}$/.test(username))throw Error('Revisa el nombre de usuario.');
 const phone=draft.number.trim()?normalizeContactNumber(draft.country,draft.number):'';
 if(!phone&&!username)throw Error('Escribe el número de Nexus o el nombre de usuario.');
 return {first,last,username,phone};
}
export type ResolvedContact={found:boolean;uid?:string;username?:string;nombre?:string;foto?:string;bio?:string};
export class UnregisteredContactError extends Error{constructor(phone:boolean){super(phone?'Este número no está registrado en Nexus Chat':'Este nombre de usuario no está registrado en Nexus Chat');this.name='UnregisteredContactError';}}
export async function submitContactDraft(draft:ContactDraft,actions:{assertActive:()=>void;resolve:(input:{phone:string;username:string})=>Promise<ResolvedContact>;save:(contact:ResolvedContact,input:PreparedContact)=>Promise<void>;open:(uid:string)=>Promise<void>}){
 const input=prepareContactDraft(draft);actions.assertActive();const contact=await actions.resolve({phone:input.phone,username:input.username});actions.assertActive();
 if(!contact.found)throw new UnregisteredContactError(!!input.phone);
 if(typeof contact.uid!=='string'||!contact.uid||contact.uid.includes('/')||contact.uid.length>128)throw Error('No se pudo comprobar el contacto.');
 await actions.save(contact,input);actions.assertActive();await actions.open(contact.uid);actions.assertActive();return input;
}
