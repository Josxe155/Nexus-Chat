export type MessageEditCommand={author:string;before:string;after:string;chat?:string};
export const normalizeName=(value:string)=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase().replace(/^@/,'').replace(/\s+/g,' ').trim();
export function parseMessageEditCommand(text:string):MessageEditCommand|null{
 const match=/^\s*(?:edita|modifica|cambia)\s+el\s+mensaje\s+de\s+(.+?)\s+(?:(?:en\s+el\s+)?que\s+dice|que\s+contiene)\s*["“«]([^"”»]+)["”»]\s+y\s+(?:c[aá]mbialo\s+por|reempl[aá]zalo\s+por)\s*["“«]([^"”»]+)["”»](?:\s+en\s+el\s+chat\s*["“«]([^"”»]+)["”»])?\s*[.!]?\s*$/iu.exec(text);
 return match?{author:match[1].trim(),before:match[2],after:match[3],...(match[4]?{chat:match[4].trim()}:{})}:null;
}
export function assertEditableMessage(data:Record<string,any>|undefined,command:MessageEditCommand,senderId:string,now:number){
 if(!data||data.senderId!==senderId||data.type!=='text'||data.sealed||data.deletedAt||data.expiresAt&&data.expiresAt<=now||data.content!==command.before)
  throw Error('El mensaje cambió o ya no se puede editar. No se realizó ningún cambio.');
 if(!command.after.trim()||command.after.length>20000)throw Error('El texto nuevo debe tener entre 1 y 20 000 caracteres.');
}
