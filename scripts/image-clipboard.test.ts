import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readClipboardImages,pastedFiles,clipboardImageError} from '../src/features/imageClipboard.ts';
const item=(types:string[],getType=(type:string)=>Promise.resolve(new Blob(['image'],{type})))=>({types,getType}) as ClipboardItem;
const source=(items:ClipboardItem[])=>({read:async()=>items}) as Pick<Clipboard,'read'>;

test('un elemento con varias representaciones produce una sola imagen, sin leer texto ni HTML',async()=>{
 const requested:string[]=[];const files=await readClipboardImages(source([item(['text/html','image/jpeg','image/png'],async type=>{requested.push(type);return new Blob(['photo'],{type});})]));
 assert.deepEqual(requested,['image/png']);assert.equal(files.length,1);assert.equal(files[0].type,'image/png');assert.match(files[0].name,/\.png$/);assert.equal(await files[0].text(),'photo');
});
test('conserva varias imágenes, formatos y orden para revisar antes de enviar',async()=>{
 const files=await readClipboardImages(source([item(['image/jpeg']),item(['text/plain']),item(['image/webp'])]));assert.deepEqual(files.map(file=>file.type),['image/jpeg','image/webp']);assert.match(files[0].name,/\.jpg$/);assert.match(files[1].name,/\.webp$/);
});
test('rechaza texto solo, imágenes vacías y formatos no admitidos sin convertirlos en adjuntos',async()=>{
 await assert.rejects(readClipboardImages(source([item(['text/plain','text/html'])])),/clipboard-no-images/);
 await assert.rejects(readClipboardImages(source([item(['image/svg+xml'])])),/clipboard-no-images/);
 await assert.rejects(readClipboardImages(source([item(['image/png'],async()=>new Blob([],{type:'image/png'}))])),/clipboard-empty-image/);
});
test('admite diez imágenes y rechaza once antes de descargar sus representaciones',async()=>{
 assert.equal((await readClipboardImages(source(Array.from({length:10},()=>item(['image/png']))))).length,10);
 let reads=0;await assert.rejects(readClipboardImages(source(Array.from({length:11},()=>item(['image/png'],async()=>{reads++;return new Blob(['photo']);})))),/clipboard-too-many/);assert.equal(reads,0);
});
test('un fallo de lectura no devuelve una selección parcial',async()=>{
 await assert.rejects(readClipboardImages(source([item(['image/png']),item(['image/jpeg'],async()=>{throw Error('read failed');})])),/read failed/);
});
test('un navegador incompatible o un permiso denegado ofrece un mensaje comprensible',async()=>{
 await assert.rejects(readClipboardImages({} as Pick<Clipboard,'read'>),/clipboard-unavailable/);
 const denied=new DOMException('provider-internal-secret','NotAllowedError');await assert.rejects(readClipboardImages({read:async()=>{throw denied;}}),error=>error===denied);
 assert.match(clipboardImageError(denied),/Autoriza/);assert.doesNotMatch(clipboardImageError(denied),/provider-internal-secret/);assert.match(clipboardImageError(Error('clipboard-unavailable')),/Mantén pulsado/);
});
test('el pegado nativo acepta FileList o items sin duplicar una misma imagen',()=>{
 const file=new File(['photo'],'foto.jpg',{type:'image/jpeg'}),entry={kind:'file',getAsFile:()=>file};
 assert.deepEqual(pastedFiles({files:[file],items:[entry]} as unknown as DataTransfer),[file]);
 assert.deepEqual(pastedFiles({files:[],items:[entry,{kind:'string',getAsFile:()=>null}]} as unknown as DataTransfer),[file]);assert.deepEqual(pastedFiles(null),[]);
});
test('un archivo nativo sin nombre recibe la extensión de su formato',()=>{
 const image=new File(['photo'],'',{type:'image/webp'});const [file]=pastedFiles({files:[image]} as unknown as DataTransfer);assert.match(file.name,/\.webp$/);assert.equal(file.type,'image/webp');
});
