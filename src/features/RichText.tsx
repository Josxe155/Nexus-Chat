import React from 'react';
import {parseInline,parseHeading,isRule,type InlineNode} from './richTextParser';
import './rich-text.css';
function render(nodes:InlineNode[]):React.ReactNode[]{
 return nodes.map((node,index)=>{
  switch(node.kind){
   case 'text':return node.text;
   case 'link':return <a key={index} href={node.text} target="_blank" rel="noopener noreferrer" className="message-link">{node.text}</a>;
   case 'code':return <code key={index}>{node.text}</code>;
   case 'strong':return <strong key={index}>{render(node.children)}</strong>;
   case 'em':return <em key={index}>{render(node.children)}</em>;
   case 'strike':return <s key={index}>{render(node.children)}</s>;
   case 'strong-em':return <strong key={index}><em>{render(node.children)}</em></strong>;
  }
 });
}
const inline=(text:string)=>render(parseInline(text));
export default function RichText({text}:{text:string}){
 const nodes:React.ReactNode[]=[],lines=text.replace(/\r\n?/g,'\n').split('\n');let bullets:string[]=[],numbered=false;let plainLines:string[]=[];
 const flush=()=>{if(bullets.length){const items=bullets.map((value,index)=><li key={index}>{inline(value)}</li>);nodes.push(numbered?<ol key={'list'+nodes.length}>{items}</ol>:<ul key={'list'+nodes.length}>{items}</ul>);bullets=[];}};
 const flushLines=()=>{if(plainLines.length){nodes.push(<React.Fragment key={'text'+nodes.length}><span className="rich-text-line">{inline(plainLines.join('\n'))}</span><br/></React.Fragment>);plainLines=[];}};
 for(let index=0;index<lines.length;index++){
  const line=lines[index],fence=/^\s{0,3}(`{3,})([a-zA-Z0-9_-]*)\s*$/.exec(line);
  if(fence){
   flushLines();flush();let end=index+1;
   const close=new RegExp('^\\s{0,3}`{'+fence[1].length+',}\\s*$');
   while(end<lines.length&&!close.test(lines[end]))end++;
   if(end<lines.length){nodes.push(<pre key={'code'+index}><code>{lines.slice(index+1,end).join('\n')}</code></pre>);index=end;continue;}
   nodes.push(<span className="rich-text-line" key={'literal'+index}>{lines.slice(index).join('\n')}</span>);break;
  }
  if(isRule(line)){flushLines();nodes.push(<span key={'rule'+index} className="rich-rule" role="separator"/>);continue;}
  const list=/^(?:([-*]) |(\d+)\. )(.*)$/.exec(line);
  if(list){flushLines();const ordered=!!list[2];if(bullets.length&&ordered!==numbered)flush();numbered=ordered;bullets.push(list[3]);continue;}
  flush();
  if(line.startsWith('> ')){flushLines();nodes.push(<blockquote key={index}>{inline(line.slice(2))}</blockquote>);continue;}
  const heading=parseHeading(line,lines[index+1]);
  if(heading){flushLines();nodes.push(<span key={'heading'+index} className={'rich-heading rich-heading-'+heading.level} role="heading" aria-level={heading.level}>{inline(heading.text)}</span>);index+=heading.consumed;continue;}
  plainLines.push(line);
 }
 flushLines();flush();return <span className="rich-message">{nodes}</span>;
}
