import {getCountries} from 'libphonenumber-js';
const supported=new Set<string>(getCountries());
export function validCountry(value:unknown):value is string{return typeof value==='string'&&supported.has(value);}
export async function locateCountry(geo:Geolocation|undefined=navigator.geolocation,fetcher:typeof fetch=fetch){
 if(!geo)throw Error('La ubicación no está disponible.');
 const position=await new Promise<GeolocationPosition>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('La ubicación está tardando. Selecciona tu país para continuar.')),12000);try{geo.getCurrentPosition(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);},{enableHighAccuracy:false,timeout:12000,maximumAge:60000});}catch(error){clearTimeout(timer);reject(error);}});
 const {latitude,longitude}=position.coords;
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw Error('No se pudo identificar el país.');
 const url=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');url.searchParams.set('latitude',String(latitude));url.searchParams.set('longitude',String(longitude));url.searchParams.set('localityLanguage','es');
 const response=await fetcher(url,{signal:AbortSignal.timeout(12000),credentials:'omit',referrerPolicy:'no-referrer'});
 if(!response.ok)throw Error('No se pudo identificar el país.');
 const data=await response.json(),country=String(data.countryCode||'').toUpperCase();
 if(!validCountry(country))throw Error('No se pudo identificar el país.');
 return country;
}
