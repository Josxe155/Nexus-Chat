import React from 'react';
function inline(text:string):React.ReactNode[]{
 const pattern=/(https?:\/\/[^\s<>]+|\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g;
 return text.split(pattern).filter(Boolean).map((part,i)=>{
  if(/^https?:\/\//.test(part))return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="message-link">{part}</a>;
  if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;
  if(part.startsWith('*')&&part.endsWith('*'))return <strong key={i}>{part.slice(1,-1)}</strong>;
  if(part.startsWith('_')&&part.endsWith('_'))return <em key={i}>{part.slice(1,-1)}</em>;
  if(part.startsWith('~')&&part.endsWith('~'))return <s key={i}>{part.slice(1,-1)}</s>;
  if(part.startsWith('`')&&part.endsWith('`'))return <code key={i}>{part.slice(1,-1)}</code>;
  return part;
 });
}
export default function RichText({text}:{text:string}){
 const nodes:React.ReactNode[]=[];let code:string[]|null=null;let bullets:string[]=[];let numbered=false;
 const flush=()=>{if(bullets.length){const items=bullets.map((v,i)=><li key={i}>{inline(v)}</li>);nodes.push(numbered?<ol key={'list'+nodes.length}>{items}</ol>:<ul key={'list'+nodes.length}>{items}</ul>);bullets=[];}};
 for(const [i,line]of text.split('\n').entries()){
  if(line.startsWith('```')){flush();if(code){nodes.push(<pre key={i}><code>{code.join('\n')}</code></pre>);code=null;}else code=[];continue;}
  if(code){code.push(line);continue;}
  const list=line.match(/^(?:([-*]) |(\d+)\. )(.*)$/);if(list){const ordered=!!list[2];if(bullets.length&&ordered!==numbered)flush();numbered=ordered;bullets.push(list[3]);continue;}flush();if(line.startsWith('> ')){nodes.push(<blockquote key={i}>{inline(line.slice(2))}</blockquote>);continue;}nodes.push(<React.Fragment key={i}>{inline(line)}<br/></React.Fragment>);
 }
 flush();if(code)nodes.push(<pre key="last"><code>{code.join('\n')}</code></pre>);
 return <span className="rich-message">{nodes}</span>;
}
