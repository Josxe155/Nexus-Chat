import {getCountries,getCountryCallingCode,getExampleNumber,parsePhoneNumberFromString} from 'libphonenumber-js/max';
import examples from 'libphonenumber-js/examples.mobile.json';
/** Nexus identifiers use the mobile numbering plan; they do not establish ownership of a real line. */
export function generateNumber(country:string,random:(bytes:Uint8Array)=>Uint8Array=bytes=>crypto.getRandomValues(bytes)){
 const selected=getCountries().find(value=>value===country);
 if(!selected)throw Error('Selecciona un país válido.');
 const example=getExampleNumber(selected,examples),callingCode=getCountryCallingCode(selected);
 if(!example)throw Error('No se pudo preparar un número para este país.');
 const prefix=example.nationalNumber.slice(0,Math.min(3,example.nationalNumber.length-4));
 for(let attempt=0;attempt<512;attempt++){
  // Some mobile plans allocate only a narrow range after the first three digits.
  // Keep the verified example prefix after broad sampling is exhausted.
  let national=attempt<256?prefix:example.nationalNumber.slice(0,-Math.min(4,example.nationalNumber.length-1));
  while(national.length<example.nationalNumber.length){const bytes=random(new Uint8Array(16));for(const byte of bytes){if(byte<250&&national.length<example.nationalNumber.length)national+=String(byte%10);}}
  const numberKey='+'+callingCode+national,phone=parsePhoneNumberFromString(numberKey);
  if(phone?.countryCallingCode===callingCode&&phone.isValid()&&['MOBILE','FIXED_LINE_OR_MOBILE'].includes(phone.getType()||''))return {country:selected,callingCode,numberKey,number:phone.formatInternational()};
 }
 // Exhaust a small verified suffix without relying on another random success.
 const offset=random(new Uint8Array(1))[0]%10;
 for(let i=0;i<10;i++){const phone=parsePhoneNumberFromString('+'+callingCode+example.nationalNumber.slice(0,-1)+((offset+i)%10));if(phone?.countryCallingCode===callingCode&&phone.isValid()&&['MOBILE','FIXED_LINE_OR_MOBILE'].includes(phone.getType()||''))return {country:selected,callingCode,numberKey:phone.number,number:phone.formatInternational()};}
 throw Error('No se pudo asignar un número válido. Vuelve a intentarlo.');
}
