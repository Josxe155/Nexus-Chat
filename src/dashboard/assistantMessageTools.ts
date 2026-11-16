export function messageChangeInput(args:Record<string,unknown>){
 const chatId=String(args.chatId||''),messageId=String(args.messageId||'');
 if(!/^[^/\s]{1,128}$/.test(chatId)||! /^[^/\s]{1,128}$/.test(messageId)||['.','..'].includes(chatId)||['.','..'].includes(messageId))throw Error('Indica el chat y el mensaje exactos.');
 if(!['edit','delete'].includes(String(args.change))||typeof args.expectedContent!=='string')throw Error('Consulta primero el mensaje y proporciona su contenido actual.');
 if(args.change==='edit'&&(typeof args.text!=='string'||!args.text.trim()||args.text.length>20000))throw Error('El texto nuevo debe tener entre 1 y 20 000 caracteres.');
 return {path:'chats/'+chatId+'/messages/'+messageId,operation:args.change==='edit'?'update':'delete',dataJson:args.change==='edit'?JSON.stringify({content:args.text,edited:true}):'{}',execution:args.execution};
}
export function assertMessageChange(before:Record<string,any>|null,args:Record<string,unknown>,now=Date.now()){
 if(!before||before.type!=='text'||before.sealed||before.viewOnce||before.deletedAt||before.expiresAt&&before.expiresAt<=now||before.content!==args.expectedContent)throw Error('El mensaje cambió o no es un texto editable. Vuelve a consultarlo antes de actuar.');
}
export function filterMessagePage(records:{id:string;data:Record<string,any>}[],args:Record<string,unknown>){
 const text=typeof args.text==='string'?args.text.toLocaleLowerCase().slice(0,1000):'';
 return records.filter(({data:d})=>(!args.authorId||d.senderId===args.authorId)&&(!args.type||d.type===args.type)&&(!text||typeof d.content==='string'&&d.content.toLocaleLowerCase().includes(text))).map(({id,data:d})=>({id,senderId:d.senderId,type:d.type,content:d.sealed?'[Contenido protegido]':d.content,timestamp:d.timestamp,deletedAt:d.deletedAt||0,expiresAt:d.expiresAt||0,fileName:d.fileName,fileUrl:d.viewOnce?undefined:d.fileUrl}));
}
