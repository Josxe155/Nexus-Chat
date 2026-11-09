import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseInline,type InlineNode} from '../src/features/richTextParser.ts';
const plain=(nodes:InlineNode[]):string=>nodes.map(node=>'text' in node?node.text:plain(node.children)).join('');

test('conserva comillas rectas, tipográficas y apóstrofos',()=>{
 for(const value of [`'`, `"`, `D'Angelo dijo "mañana"`, `«Hola», “Nexus” y ‘Chat’`, `O'Connor: **`, '`', '``', '***', '**sin cerrar', 'texto **', '*** sin contenido ***']){
  assert.equal(plain(parseInline(value)),value);
 }
});
test('aplica negrita y formatos anidados sin dejar delimitadores',()=>{
 assert.deepEqual(parseInline('**Hola**'),[{kind:'strong',children:[{kind:'text',text:'Hola'}]}]);
 assert.deepEqual(parseInline('*Hola*'),parseInline('**Hola**'));
 assert.equal(parseInline('***Hola***')[0].kind,'strong-em');
 const nested=parseInline('**Dijo "hola" y _adiós_**');assert.equal(nested[0].kind,'strong');assert.equal(plain(nested),'Dijo "hola" y adiós');
 assert.equal(plain(parseInline('**uno** y **dos**')),'uno y dos');
 assert.deepEqual(parseInline('nombre_con_guion'),[{kind:'text',text:'nombre_con_guion'}]);
 assert.equal(plain(parseInline('2*3*4')),'2*3*4');
});
test('los fragmentos de código preservan símbolos y comillas',()=>{
 assert.deepEqual(parseInline('`"**Hola**"`'),[{kind:'code',text:'"**Hola**"'}]);
 assert.deepEqual(parseInline('```a ` b **texto**```'),[{kind:'code',text:'a ` b **texto**'}]);
 assert.equal(plain(parseInline('\\*\\*literal\\*\\*')),'**literal**');
 assert.equal(plain(parseInline('**antes `**` después**')),'antes ** después');
 assert.deepEqual(parseInline('`C:\\`'),[{kind:'code',text:'C:\\'}]);
});
test('separa las comillas y la puntuación de los enlaces',()=>{
 const nodes=parseInline('"https://example.com/a" y https://example.com/b.');
 assert.equal(nodes.filter(node=>node.kind==='link').length,2);
 assert.deepEqual(nodes.filter(node=>node.kind==='link').map(node=>'text' in node?node.text:''),['https://example.com/a','https://example.com/b']);
 assert.equal(plain(nodes),'"https://example.com/a" y https://example.com/b.');
 assert.equal(parseInline('javascript:alert(1)').some(node=>node.kind==='link'),false);
 assert.equal(plain(parseInline('<img src=x onerror="alert(1)">')),'<img src=x onerror="alert(1)">');
});

test('reconoce títulos con numerales y subrayados sin alterar etiquetas ni texto literal',async()=>{
 const {parseHeading,isRule}=await import('../src/features/richTextParser.ts');
 assert.deepEqual(parseHeading('### Un **título**'),{level:3,text:'Un **título**',consumed:0});
 assert.deepEqual(parseHeading('  ## Título ##'),{level:2,text:'Título',consumed:0});
 assert.deepEqual(parseHeading('Título','---'),{level:2,text:'Título',consumed:1});
 assert.deepEqual(parseHeading('Título','==='),{level:1,text:'Título',consumed:1});
 for(const line of ['#etiqueta','####### Fuera de nivel','    ### Código','Texto ### literal','> ### Cita'])assert.equal(parseHeading(line),null);
 assert.equal(isRule('---'),true);assert.equal(isRule('* * *'),true);assert.equal(isRule('---texto'),false);
});
