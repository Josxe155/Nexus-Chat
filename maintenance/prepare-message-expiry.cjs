// Trusted one-off metadata migration. No message body or credential is selected/exported.
// request(method, path, body) must authenticate with a local administrator identity.
async function prepareMessageExpiry({request,execute=false}){
 const stats={messages:0,normalized:0,invalidExpiry:0,mediaBound:0,sharedMedia:0,temporaryPreviews:0};const links=new Map();
 async function* list(path,fields){let token;do{const params=new URLSearchParams({pageSize:'200'});fields.forEach(f=>params.append('mask.fieldPaths',f));if(token)params.set('pageToken',token);const page=await request('GET',path+'?'+params);for(const doc of page.documents||[])yield doc;token=page.nextPageToken;}while(token);}
 const patch=(doc,fields)=>request('PATCH',doc.name.split('/documents/')[1].split('/').map(encodeURIComponent).join('/')+'?'+Object.keys(fields).map(f=>'updateMask.fieldPaths='+encodeURIComponent(f)).join('&')+'&currentDocument.updateTime='+encodeURIComponent(doc.updateTime),{name:doc.name,fields:Object.fromEntries(Object.entries(fields).map(([name,value])=>{const parts=name.split('.');let object=value;for(let i=parts.length-1;i>0;i--)object={mapValue:{fields:{[parts[i]]:object}}};return [parts[0],object]}))});
 for await(const chat of list('chats',['lastMessage.expiresAt'])){const chatId=chat.name.split('/').at(-1);
  for await(const message of list('chats/'+encodeURIComponent(chatId)+'/messages',['expiresAt','fileUrl'])){
   stats.messages++;const expiry=message.fields?.expiresAt,number=expiry?Number(expiry.integerValue??expiry.doubleValue):undefined;
   if(!expiry||expiry.nullValue!==undefined){stats.normalized++;if(execute)await patch(message,{expiresAt:{integerValue:'0'}});}
   else if(!Number.isFinite(number)||number<0){stats.invalidExpiry++;if(execute)await patch(message,{expiresAt:{integerValue:'1'}});}
   const id=/^\/api\/media\/([a-f0-9-]{36})$/.exec(message.fields?.fileUrl?.stringValue||'')?.[1];if(id){if(links.has(id))links.set(id,null);else links.set(id,{chatId,messageId:message.name.split('/').at(-1),expiresAt:!expiry||expiry.nullValue!==undefined?0:Number.isFinite(number)&&number>=0?number:1});}
  }
  if(Number(chat.fields?.lastMessage?.mapValue?.fields?.expiresAt?.integerValue)>0){stats.temporaryPreviews++;if(execute)await patch(chat,{'lastMessage.content':{stringValue:'Mensaje temporal'}});}
 }
 for(const [id,link]of links){if(!link){stats.sharedMedia++;continue;}let file;try{file=await request('GET','mediaFiles/'+id+'?mask.fieldPaths=scope&mask.fieldPaths=chatId&mask.fieldPaths=referenceId&mask.fieldPaths=viewOnce&mask.fieldPaths=expiresAt');}catch(e){if(e.status===404)continue;throw e;}const d=file.fields||{};if(d.scope?.stringValue!=='chat'||d.chatId?.stringValue!==link.chatId||d.referenceId?.stringValue)continue;stats.mediaBound++;if(execute)await patch(file,{referenceId:{stringValue:link.messageId},expiresAt:{integerValue:String(d.viewOnce?.booleanValue?Math.min(Number(d.expiresAt?.integerValue||d.expiresAt?.doubleValue)||1,link.expiresAt||Infinity):link.expiresAt)}});}
 return stats;
}
module.exports={prepareMessageExpiry};
