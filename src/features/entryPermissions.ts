import {locateCountry,validCountry} from './countryLocation';
let pending:Promise<string>|undefined;
let source:'location'|'selected'='selected';
export function countrySource(){return source;}
export async function chooseEntryCountry(suggestion:string){
 const [{createElement},{createRoot},{default:Picker}]=await Promise.all([import('react'),import('react-dom/client'),import('./ContactCountryPicker')]);
 return new Promise<string>((resolve,reject)=>{const element=document.createElement('div');document.body.append(element);const root=createRoot(element);const finish=(value?:string)=>{root.unmount();element.remove();if(value)resolve(value);else reject(Error('Selecciona tu país para preparar tu número de Nexus.'));};root.render(createElement(Picker,{value:validCountry(suggestion)?suggestion:'',allowOther:false,onClose:()=>finish(),onSelect:(value:string)=>{if(validCountry(value))finish(value);}}));});
}
export async function entryPermissions(suggestion:string){
 if(!pending)pending=(async()=>{try{const country=await locateCountry();source='location';return country;}catch{source='selected';return chooseEntryCountry(suggestion);}})();
 try{return await pending;}catch(error){pending=undefined;throw error;}
}
