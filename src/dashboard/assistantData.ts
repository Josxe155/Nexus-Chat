/** Keep credentials and binary payloads out of the model's data context. */
export function redactAssistantData(value:any,seen=new WeakSet<object>()):any{
 if(typeof value==='string'&&/^guest[.][a-z0-9]+@guests[.]nexus-chat[.]invalid$/i.test(value))return '[Correo técnico protegido]';
 if(value===null||typeof value!=='object')return value;
 if(value.version===1&&typeof value.email==='string'&&value.email.endsWith('@guests.nexus-chat.invalid')&&typeof value.password==='string')return '[Credenciales protegidas]';
 if(typeof value.toMillis==='function')return {$timestamp:value.toMillis()};
 if(typeof value.path==='string'&&value.firestore)return {$reference:value.path};
 if(typeof value.toBase64==='function'||ArrayBuffer.isView(value)||value instanceof ArrayBuffer)return '[Contenido binario protegido]';
 if(seen.has(value))return '[Referencia repetida]';seen.add(value);
 const secrets=/^(?:password|passwordHash|passwordSalt|privateKey|apiKey|accessToken|refreshToken|idToken|credential|credentials|secret|secrets|encryptionKey|sealedKey|key|sealed|(?:gemini|openrouter|groq|giphy|klipy|metered|pollinations)(?:Key|Token|Secret)?|api_key|access_token|refresh_token)$/i;
 const result=Array.isArray(value)?value.map(item=>redactAssistantData(item,seen)):Object.fromEntries(Object.entries(value).map(([key,item])=>[key,secrets.test(key)?'[Dato protegido]':redactAssistantData(item,seen)]));
 seen.delete(value);return result;
}
