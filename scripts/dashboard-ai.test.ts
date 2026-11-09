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
  assert.match(body.systemInstruction.parts[0].text,/solo lectura/);
  assert.equal(body.tools,undefined);
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'privado',thought:true},{text:'Hay 8 cuentas.'}]}}]}));
 };
 assert.deepEqual(await ask(),{text:'Hay 8 cuentas.',truncated:false});
});
test('marca las respuestas cortadas',async()=>{
 mock({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'Respuesta parcial'}]}}]});
 assert.deepEqual(await ask(),{text:'Respuesta parcial',truncated:true});
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
 await assert.rejects(requestDashboardAnswer('consulta','{',signal(),settings),/vista previa/);
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
