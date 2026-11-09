export type InlineNode={kind:'text'|'code'|'link';text:string}|{kind:'strong'|'em'|'strike'|'strong-em';children:InlineNode[]};
const word=(char:string)=>!!char&&/[\p{L}\p{N}_]/u.test(char);
function runLength(text:string,index:number){let end=index;while(text[end]===text[index])end++;return end-index;}
function closing(text:string,start:number,marker:string){
 for(let at=start;at<text.length;at++){
  if(text[at]==='\\'&&marker[0]!=='`'){at++;continue;}
  if(text[at]==='`'&&marker[0]!=='`'){
   const length=runLength(text,at),end=closing(text,at+length,'`'.repeat(length));if(end>=0){at=end+length-1;continue;}
  }
  if(text.startsWith(marker,at)&&text[at-1]!==marker[0]&&text[at+marker.length]!==marker[0]&&at>start&&(!/\s/.test(text[at-1])||marker[0]==='`'))return at;
 }
 return -1;
}
export function parseInline(text:string,depth=0):InlineNode[]{
 if(depth>=16)return [{kind:'text',text}];
 const nodes:InlineNode[]=[];let plain='';
 const flush=()=>{if(plain){nodes.push({kind:'text',text:plain});plain='';}};
 for(let at=0;at<text.length;){
  const char=text[at];
  if(char==='\\'&&/[\\`*_~'"\[\]]/.test(text[at+1]||'')){plain+=text[at+1];at+=2;continue;}
  if((text.startsWith('https://',at)||text.startsWith('http://',at))&&!word(text[at-1])){
   let url=/^https?:\/\/[^\s<>"'`]+/.exec(text.slice(at))?.[0]||'';
   url=url.replace(/[.,;:!?*_~]+$/g,'');
   for(const [open,close] of [['(',')'],['[',']'],['{','}']])while(url.endsWith(close)&&url.split(close).length>url.split(open).length)url=url.slice(0,-1);
   try{new URL(url);flush();nodes.push({kind:'link',text:url});at+=url.length;continue;}catch{}
  }
  if('`*_~'.includes(char)){
   const length=runLength(text,at),marker=char.repeat(length);
   const kind=char==='`'?'code':char==='*'&&length===3?'strong-em':char==='*'&&length<=2||char==='_'&&length===2?'strong':char==='_'&&length===1?'em':char==='~'&&length<=2?'strike':null;
   const contentStart=at+length;
   if(kind&&(char==='`'||!word(text[at-1]))&&contentStart<text.length&&(char==='`'||!/\s/.test(text[contentStart]))){
    const end=closing(text,contentStart,marker);
    if(end>=0){
     flush();const inner=text.slice(contentStart,end);
     nodes.push(kind==='code'?{kind:'code',text:inner}:{kind,children:parseInline(inner,depth+1)});
     at=end+length;continue;
    }
   }
   plain+=marker;at+=length;continue;
  }
  plain+=char;at++;
 }
 flush();return nodes;
}

export function parseHeading(line:string,next?:string):{level:number;text:string;consumed:number}|null{
 const atx=/^ {0,3}(#{1,6})(?:[\t ]+(.*)|[\t ]*)$/.exec(line);
 if(atx)return {level:atx[1].length,text:(atx[2]||'').replace(/[\t ]+#+[\t ]*$/,'').trim(),consumed:0};
 const underline=next&&/^ {0,3}(=+|-+)[\t ]*$/.exec(next);
 if(underline&&line.trim()&&!/^\s*(?:>|[-*+] |\d+\. |`)/.test(line))return {level:underline[1][0]==='='?1:2,text:line.trim(),consumed:1};
 return null;
}
export const isRule=(line:string)=>/^ {0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line);
