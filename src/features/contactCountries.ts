import {getCountries,getCountryCallingCode} from 'libphonenumber-js';
const names=new Intl.DisplayNames(['es'],{type:'region'});
export const COUNTRY_CODES=[...getCountries().map(id=>[id,names.of(id)||id,getCountryCallingCode(id)]).sort((a,b)=>a[1].localeCompare(b[1],'es')),['OTHER','Otro país','']];
export const countryFlag=(id:string)=>/^[A-Z]{2}$/.test(id)?String.fromCodePoint(...Array.from(id,c=>127397+c.charCodeAt(0))):'🌐';
const searchable=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
export function matchingCountries(query:string){const text=searchable(query),code=text.replace(/^\+|^00/,'');return COUNTRY_CODES.filter(([id,name,prefix])=>!text||searchable(name).includes(text)||id.toLowerCase()===text||!!prefix&&/^\d+$/.test(code)&&prefix.startsWith(code));}
