import {test,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {requestDashboardAnswer} from '../src/dashboard/geminiDashboard.ts';

const originalFetch=globalThis.fetch;
afterEach(()=>{globalThis.fetch=originalFetch;});
const signal=()=>new AbortController().signal;
const settings={key:'test-placeholder',model:'gemini-3.1-flash-lite'};
const ask=()=>requestDashboardAnswer('Resume la actividad','{"cuentas":8}',signal(),settings);
function mock(value:unknown,status=200){globalThis.fetch=async()=>new Response(JSON.stringify(value),{status});}

test('envía solo la muestra revisada y no solicita herramientas',async()=>{
 globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent');
  assert.equal((options.headers as Record<string,string>)['x-goog-api-key'],'test-placeholder');
  const body=JSON.parse(options.body as string);
  assert.deepEqual(JSON.parse(body.contents[0].parts[0].text),{pregunta:'Resume la actividad',registros:{cuentas:8}});
  assert.match(body.systemInstruction.parts[0].text,/Nexus Assistant/);
  assert.equal(body.tools,undefined);
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'privado',thought:true},{text:'Hay 8 cuentas.'}]}}]}));
 };
 assert.deepEqual(await ask(),{text:'Hay 8 cuentas.',truncated:false});
});
test('continúa respuestas cortadas sin repetir acciones ni el texto solapado',async()=>{
 let requests=0,actions=0;
 globalThis.fetch=async(_url,options)=>{
  const body=JSON.parse(options.body as string);requests++;
  assert.equal(body.generationConfig.maxOutputTokens,32768);
  if(requests===1)return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{role:'model',parts:[{functionCall:{name:'write',args:{}},thoughtSignature:'signature'}]}}]}));
  if(requests===2)return new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{role:'model',parts:[{text:'Una respuesta suficientemente larga que sigue incom'}]}}]}));
  assert.equal(body.toolConfig.functionCallingConfig.mode,'NONE');
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'Una respuesta suficientemente larga que sigue incompleta.'}]}}]}));
 };
 const result=await requestDashboardAnswer('Escribe','{}',signal(),settings,{declarations:[{name:'write'}],execute:async()=>{actions++;return {executed:true}}});
 assert.deepEqual(result,{text:'Una respuesta suficientemente larga que sigue incompleta.',truncated:false});assert.equal(actions,1);assert.equal(requests,3);
});
test('conserva la respuesta parcial si falla la continuación y respeta la cancelación',async()=>{
 let requests=0;globalThis.fetch=async()=>{if(requests++)throw Error('network');return new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'Texto recibido'}]}}]}));};
 assert.deepEqual(await ask(),{text:'Texto recibido',truncated:true});
 const controller=new AbortController();globalThis.fetch=async()=>{controller.abort();throw Error('network');};
 await assert.rejects(requestDashboardAnswer('consulta','{}',controller.signal,settings),{name:'AbortError'});
});
test('no muestra texto bloqueado ni detalles del proveedor',async()=>{
 mock({candidates:[{finishReason:'SAFETY',content:{parts:[{text:'No mostrar'}]}}]});
 await assert.rejects(ask(),/Reformúlala/);
 mock({error:{message:'internal provider secret'}},403);
 await assert.rejects(ask(),error=>error instanceof Error&&/no tiene acceso/.test(error.message)&&!error.message.includes('secret'));
 mock({},429);await assert.rejects(ask(),/límite de consultas/);
 mock({candidates:[]});await assert.rejects(ask(),/no devolvió/);
});
test('valida configuración, muestra y cancelación antes de enviar',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected request');};
 await assert.rejects(requestDashboardAnswer('consulta','{}',signal(),{key:''}),/no está configurado/);
 await assert.rejects(requestDashboardAnswer('consulta','{',signal(),settings),/contexto/);
 await assert.rejects(requestDashboardAnswer('consulta','{}',signal(),{...settings,model:'../../other'}),/no es válida/);
 await assert.rejects(requestDashboardAnswer('consulta','x'.repeat(120001),signal(),settings),/demasiado larga/);
 await assert.rejects(requestDashboardAnswer('consulta','{}',AbortSignal.abort(),settings));
 assert.equal(calls,0);
});
test('prepara la clave local sin perder los otros servicios ni imprimir credenciales',()=>{
 const root=mkdtempSync(join(tmpdir(),'nexus-config-'));
 try{
  mkdirSync(join(root,'scripts'));mkdirSync(join(root,'src'));
  copyFileSync(fileURLToPath(new URL('./setup-services.cjs',import.meta.url)),join(root,'scripts/setup-services.cjs'));
  copyFileSync(fileURLToPath(new URL('../src/public-services.example.json',import.meta.url)),join(root,'src/public-services.example.json'));
  writeFileSync(join(root,'src/public-services.json'),JSON.stringify({openrouter:'existing-placeholder',huggingFaceKey:'obsolete-placeholder'}));
  const result=spawnSync(process.execPath,[join(root,'scripts/setup-services.cjs')],{env:{...process.env,GEMINI_API_KEY:'new-placeholder'},encoding:'utf8'});
  assert.equal(result.status,0);
  const config=JSON.parse(readFileSync(join(root,'src/public-services.json'),'utf8'));
  assert.equal(config.openrouter,'existing-placeholder');
  assert.equal(config.geminiKey,'new-placeholder');
  assert.equal(config.huggingFaceKey,undefined);
  assert.equal(config.geminiModel,'gemini-3.1-flash-lite');
  assert.doesNotMatch(result.stdout+result.stderr,/existing-placeholder|new-placeholder|obsolete-placeholder/);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('consulta herramientas de lectura y conserva las firmas entre pasos',async()=>{
 let requests=0,reads=0;
 globalThis.fetch=async(_url,options)=>{
  const body=JSON.parse(options.body as string);requests++;
  if(requests===1){assert.equal(body.tools[0].functionDeclarations[0].name,'count_collection');return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{role:'model',parts:[{thoughtSignature:'opaque-signature',functionCall:{name:'count_collection',args:{path:'users'},id:'call-1'}}]}}]}));}
  assert.equal(body.contents[1].parts[0].thoughtSignature,'opaque-signature');
  assert.equal(body.contents[2].parts[0].functionResponse.response.result.count,8);
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'Hay 8 cuentas.'}]}}]}));
 };
 const result=await requestDashboardAnswer('Cuenta las cuentas','{}',signal(),settings,{declarations:[{name:'count_collection'}],execute:async(name,args)=>{assert.equal(name,'count_collection');assert.equal(args.path,'users');reads++;return {count:8};}});
 assert.equal(result.text,'Hay 8 cuentas.');assert.equal(reads,1);assert.equal(requests,2);
});

test('el dictado entrega una sola vez cada resultado final y conserva repeticiones intencionadas',async()=>{
 const {collectDictation}=await import('../src/features/dictationResults.ts');const collect=collectDictation();
 const result=(transcript:string,isFinal=true)=>({isFinal,0:{transcript}});
 assert.equal(collect(0,[result('Hola')]).text,'Hola');
 assert.equal(collect(0,[result('Hola')]).text,'');
 assert.equal(collect(0,[result('Hola'),result('Hola')]).text,'Hola Hola');
 assert.equal(collect(1,[result('Hola'),result('Hola')]).text,'');
 assert.equal(collect(2,[result('Hola'),result('Hola'),result('mañana',false)]).interim,'mañana');
 assert.equal(collect(2,[result('Hola'),result('Hola'),result('mañana')]).text,'Hola Hola mañana');
 assert.equal(collectDictation()(0,[result('Hola')]).text,'Hola');
});

test('interpreta el comando de edición exacto y rechaza mensajes alterados o caducados',async()=>{
 const {parseMessageEditCommand,assertEditableMessage}=await import('../src/dashboard/messageEditCommand.ts');
 const command=parseMessageEditCommand('edita el mensaje de Alexander Alvarado en el que dice "Mañana no hay clases" y cámbialo por "Mañana si hay clase"');
 assert.deepEqual(command,{author:'Alexander Alvarado',before:'Mañana no hay clases',after:'Mañana si hay clase'});
 assert.equal(parseMessageEditCommand('resume los mensajes'),null);
 const value={senderId:'author',content:command!.before,type:'text'};
 assert.doesNotThrow(()=>assertEditableMessage(value,command!,'author',1000));
 for(const changed of [{...value,content:'Otro texto'},{...value,senderId:'other'},{...value,deletedAt:1},{...value,expiresAt:999},{...value,sealed:{}},{...value,type:'poll'}])assert.throws(()=>assertEditableMessage(changed,command!,'author',1000));
});

test('reconstruye el dictado acumulado sin duplicar frases reenviadas por el navegador',async()=>{
 const {collectDictation}=await import('../src/features/dictationResults.ts');const collect=collectDictation();const final=(text:string)=>({isFinal:true,0:{transcript:text}});
 assert.equal(collect(0,[final('Hola Nexus')]).transcript,'Hola Nexus');
 assert.equal(collect(1,[final('Hola Nexus'),final('Hola Nexus')]).transcript,'Hola Nexus');
 assert.equal(collect(2,[final('Hola Nexus'),final('Hola Nexus'),final('Hola Nexus quiero revisar los mensajes')]).transcript,'Hola Nexus quiero revisar los mensajes');
 assert.equal(collect(0,[final('Hola Nexus quiero revisar los mensajes')]).changed,false);
 const short=collectDictation();short(0,[final('Hola')]);assert.equal(short(1,[final('Hola'),final('Hola Nexus')]).transcript,'Hola Nexus');
});

test('protege destinos administrativos y aplica cambios sin modificar el registro original',async()=>{
 const {actionPath,applyActionPatch,sameRecord,validateActionData}=await import('../src/dashboard/assistantActionCore.ts');
 for(const path of ['dashboardAdmins/a','dashboardActions/a','assistantOperations/a','publicConfig/cleanup'])assert.throws(()=>actionPath(path,'firestore'));
 assert.equal(actionPath('chats/a/messages/b','firestore'),'chats/a/messages/b');
 const before={title:'Antes',nested:{one:1,two:2}};assert.deepEqual(applyActionPatch(before,{'nested.one':3,title:{$delete:true}}),{nested:{one:3,two:2}});assert.equal(before.nested.one,1);
 assert.equal(sameRecord({a:1,b:2},{b:2,a:1}),true);assert.equal(sameRecord({a:1},{a:2}),false);
 assert.throws(()=>validateActionData(JSON.parse('{"__proto__":{"polluted":true}}')));
});

test('ejecuta órdenes directas y deja como propuestas las consultas y la limpieza',async()=>{
 const {requestsImmediateAction}=await import('../src/dashboard/assistantActionCore.ts');
 const plan:any={kind:'firestore',operation:'update'};
 for(const prompt of ['edita el mensaje de Alexander','crea un aviso','Por favor, actualiza la configuración','elimina este documento'])assert.equal(requestsImmediateAction(prompt,plan),true);
 for(const prompt of ['prepara un aviso','¿Qué cambiarías?','consulta mis mensajes'])assert.equal(requestsImmediateAction(prompt,plan),false);
 assert.equal(requestsImmediateAction('ejecuta la limpieza',{...plan,kind:'cleanup'}),false);
});

test('acepta 500 líneas y mensajes largos; rechaza 501 sin enviar consultas',async()=>{
 const {draftError,lineCount,limitAnswer}=await import('../src/dashboard/assistantLimits.ts');
 const text=Array.from({length:500},(_,i)=>'Línea '+i+' con texto largo.').join('\n');let requests=0;
 globalThis.fetch=async()=>{requests++;return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'Completo.'}]}}]}));};
 assert.equal(draftError(text),'');assert.equal((await requestDashboardAnswer(text,'{}',signal(),settings)).text,'Completo.');
 await assert.rejects(requestDashboardAnswer(text+'\nOtra','{}',signal(),settings));assert.equal(requests,1);
 assert.equal(limitAnswer(text).text,text);const limited=limitAnswer(text+'\nOtra');assert.equal(lineCount(limited.text),500);assert.match(limited.text,/tamaño máximo/);
});
test('divide audio largo por frases sin perder palabras, acentos ni comillas',async()=>{
 const {spanishSpeechChunks}=await import('../src/features/speechChunks.ts');
 const text=Array(500).fill('Mañana sí hay clase. Alexander dijo: "¡Buenos días!"').join(' ');
 const chunks=spanishSpeechChunks(text);assert.ok(chunks.length>50);assert.ok(chunks.every(c=>c.length<=320));assert.equal(chunks.join(' '),text);
 assert.deepEqual(spanishSpeechChunks('**Hola** `Nexus` https://example.org'),['Hola Nexus enlace']);
});

test('reintenta un fallo de audio sin repetir fragmentos y cancela sin alertas',async()=>{
 const {playSpanish}=await import('../src/features/spanishSpeech.ts');
 const original={Worker:globalThis.Worker,AudioContext:globalThis.AudioContext,document:globalThis.document,window:globalThis.window};
 const workers:any[]=[],sources:any[]=[],states:string[]=[];let errors=0,closed=0;
 class WorkerMock{
  onerror:any;onmessage:any;terminated=false;jobs:string[]=[];
  constructor(){workers.push(this);}postMessage(text:string){this.jobs.push(text);}terminate(){this.terminated=true;}
 }
 class AudioMock{
  state='running';currentTime=0;destination={};resume(){return Promise.resolve();}close(){closed++;return Promise.resolve();}
  decodeAudioData(){return Promise.resolve({duration:2});}
  createBufferSource(){const source={buffer:null,onended:null as any,connect(){},disconnect(){},start(){},stop(){}};sources.push(source);return source;}
 }
 Object.assign(globalThis,{Worker:WorkerMock,AudioContext:AudioMock,document:new EventTarget(),window:new EventTarget()});
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 try{
  const stop=playSpanish(Array(30).fill('Una frase breve en español.').join(' '),s=>states.push(s),()=>errors++);await flush();
  assert.equal(workers[0].jobs.length,1);workers[0].onmessage({data:null});assert.equal(workers[0].terminated,true);assert.equal(workers.length,2);
  assert.equal(workers[1].jobs[0],workers[0].jobs[0]);workers[1].onmessage({data:new ArrayBuffer(100)});await flush();
  assert.equal(sources.length,1);assert.equal(workers[1].jobs.length,2);stop();assert.equal(closed,1);assert.equal(workers[1].terminated,true);assert.equal(errors,0);assert.equal(states.at(-1),'idle');
  workers[1].onmessage({data:new ArrayBuffer(100)});await flush();assert.equal(sources.length,1);
 }finally{Object.assign(globalThis,original);}
});

test('limita la escritura a datos operativos y permite órdenes naturales sin modificar permisos',async()=>{
 const {actionPath,assertOperationalData,requestsImmediateAction}=await import('../src/dashboard/assistantActionCore.ts');
 for(const path of ['users/person','users/person/private/profile','dashboardSecurity/owner','usernames/test','deletedAccounts/person','mediaFiles/file','calls/live','clientMedia/file','moderatedUsers/person','publicConfig/assistantAdmin'])assert.throws(()=>actionPath(path,path.startsWith('calls/')||path.startsWith('clientMedia/')||path.startsWith('moderatedUsers/')?'realtime':'firestore'));
 for(const data of [{admins:['other']},{'permissions.write':true},{nested:{privateKey:'secret'}},{owner:'other'},{sealed:{}},{key:{$delete:true}}])assert.throws(()=>assertOperationalData(data));
 assert.doesNotThrow(()=>assertOperationalData({content:'Mañana sí hay clase',edited:true}));
 const plan:any={kind:'firestore',operation:'update'};
 for(const prompt of ['Quiero que edites ese mensaje','¿Puedes actualizar el aviso?','Necesito que elimines este reporte'])assert.equal(requestsImmediateAction(prompt,plan,'execute'),true);
 for(const prompt of ['Solo lee los datos','Prepara una propuesta','No elimines nada','Cambia el texto sin guardar'])assert.equal(requestsImmediateAction(prompt,plan,'execute'),false);
 assert.equal(requestsImmediateAction('Crea un aviso',plan,'prepare'),false);
 assert.equal(requestsImmediateAction('Crea un aviso con título "Prepara tus materiales"',plan,'execute'),true);
 assert.equal(requestsImmediateAction('Limpia los mensajes',{...plan,kind:'cleanup'},'execute'),false);
});

test('oculta credenciales, claves y binarios sin cambiar el contenido útil de las consultas',async()=>{
 const {redactAssistantData}=await import('../src/dashboard/assistantData.ts');
 const before={content:'Mañana sí hay clase',senderId:'author',nested:{apiKey:'secret',refreshToken:'token',key:'private',name:'Visible'},bytes:new Uint8Array([1,2])};
 const result=redactAssistantData(before);assert.equal(result.content,before.content);assert.equal(result.senderId,'author');assert.equal(result.nested.name,'Visible');assert.equal(result.nested.apiKey,'[Dato protegido]');assert.equal(result.nested.key,'[Dato protegido]');assert.equal(result.nested.refreshToken,'[Dato protegido]');assert.match(result.bytes,/binario protegido/);assert.equal(before.nested.apiKey,'secret');
});
