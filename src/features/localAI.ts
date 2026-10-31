import {apiFetch} from './api';
import {auth} from '../firebase';
export function localAISettings(){return {endpoint:localStorage.getItem('nexus-ai-endpoint')||'http://localhost:11434',model:localStorage.getItem('nexus-ai-model')||'llama3.2'};}
export function localEndpoint(value:string){const url=new URL(value);const host=url.hostname;const privateHost=['localhost','127.0.0.1','[::1]'].includes(host)||/^10\.\d+\.\d+\.\d+$/.test(host)||/^192\.168\.\d+\.\d+$/.test(host)||/^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/.test(host);if(!['http:','https:'].includes(url.protocol)||!privateHost||url.username||url.password)throw new Error('Usa un servidor propio en localhost o en tu red local.');return value.replace(/\/$/,'');}
export async function localAI(prompt:string):Promise<string>{const token=await auth.currentUser?.getIdToken();const response=await apiFetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({messages:[{role:'user',content:prompt.slice(0,8000)}]}),signal:AbortSignal.timeout(65000)});let data:any;try{data=await response.json();}catch{throw new Error('El servicio está temporalmente ocupado. Inténtalo más tarde.');}if(!response.ok||typeof data.text!=='string')throw new Error(data.error||'El servicio está temporalmente ocupado. Inténtalo más tarde.');return data.text;}
export async function translateText(text:string,sourceLanguage:string,targetLanguage:string){
 const Translator=(globalThis as any).Translator;
 if(!Translator) return localAI(`Traduce de ${sourceLanguage} a ${targetLanguage}. Devuelve solo la traducción. Texto:\n${text}`);
 const availability=await Translator.availability({sourceLanguage,targetLanguage});
 if(availability==='unavailable')throw new Error('Este par de idiomas no está disponible en el traductor del navegador.');
 const translator=await Translator.create({sourceLanguage,targetLanguage});
 try{return await translator.translate(text);}finally{translator.destroy();}
}
