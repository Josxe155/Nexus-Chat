// Runtime binaries are reproducibly copied from locked npm packages, never from credentials.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),target=path.join(root,'public/tts/v1');
const copy=(from,to)=>{const dest=path.join(target,to);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,'node_modules',from),dest)};
for(const file of ['ort-wasm-simd-threaded.jsep.mjs'])copy('onnxruntime-web/dist/'+file,file);
for(const file of ['wasm/espeak-ng.wasm','data/manifest.json','data/data.data'])copy('espeak-phonemizer/dist/'+file,'espeak/'+file);
copy('@huggingface/transformers/LICENSE','transformers-LICENSE.txt');
for(const name of ['kokoro-js','espeak-phonemizer'])copy(name+'/LICENSE',name+'-LICENSE.txt');
copy('espeak-phonemizer/THIRD_PARTY_NOTICES.md','phonemizer-NOTICES.md');
console.log('Browser speech runtime prepared.');

fs.rmSync(path.join(target,'ort-wasm-simd-threaded.jsep.wasm'),{force:true});
