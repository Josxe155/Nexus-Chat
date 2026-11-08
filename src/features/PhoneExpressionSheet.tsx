import {useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties,type RefObject} from 'react';
import {flushSync} from 'react-dom';
import {Apple,Clock,Flag,Grid3X3,Hand,Hash,Lightbulb,PawPrint,Pencil,Plane,Search,Smile,Star,Sticker,Trophy,X} from 'lucide-react';
import {emojiCatalog,emojiGroups,matchesEmoji,readRecentEmoji,rememberEmoji,type EmojiCatalog} from './emojiCatalog';
import RemoteExpressions from './RemoteExpressions';
import SavedStickerPicker from './SavedStickerPicker';
import {recentStickers} from './stickerLibrary';
import {useDismissOutside} from './useDismissOutside';
import {useMobileBack} from './useMobileBack';
import './phone-expression-sheet.css';

const phoneQuery='(max-width: 599px), (pointer: coarse) and (max-height: 599px)';
export function usePhoneExpressions(){
 const [phone,setPhone]=useState(()=>matchMedia(phoneQuery).matches);
 useEffect(()=>{const media=matchMedia(phoneQuery),update=()=>setPhone(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 return phone;
}

type Tab='emoji'|'gif'|'sticker';
type Shelf='recent'|'favorites'|'catalog';
type Props={
 uid:string;history:RefObject<HTMLDivElement|null>;atEnd:boolean;
 onSelect:(emoji:string)=>void;onClose:()=>void;
 onAsset:(url:string,name:string,type:'sticker'|'image')=>Promise<void>;
 onCreateSticker:()=>void;
};
const categoryIcons=[Smile,Hand,PawPrint,Apple,Plane,Trophy,Lightbulb,Hash,Flag];
const batchSize=112;
const suggestions=[['👋','Hola'],['😂','Me divierte'],['❤️','Me encanta'],['😢','Triste']];
const lastTabKey='nexus-phone-expression-tab';
function lastTab():Tab{
 try{const saved=localStorage.getItem(lastTabKey);if(saved==='gif'||saved==='sticker')return saved;}catch{}
 return 'emoji';
}

export default function PhoneExpressionSheet({uid,history,atEnd,onSelect,onClose,onAsset,onCreateSticker}:Props){
 const [tab,setTab]=useState<Tab>(lastTab),[expanded,setExpanded]=useState(false);
 const [shelf,setShelf]=useState<Shelf>(()=>recentStickers(uid).length?'recent':'catalog');
 const [searching,setSearching]=useState(false),[query,setQuery]=useState('');
 const [category,setCategory]=useState('all'),[recent,setRecent]=useState(readRecentEmoji);
 const [catalog,setCatalog]=useState<EmojiCatalog>(),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const [limit,setLimit]=useState(batchSize),[roomHeight,setRoomHeight]=useState<number>();
 const panel=useDismissOutside<HTMLElement>(onClose),body=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null);
 const pointer=useRef<{id:number;y:number}|null>(null),swiped=useRef(false),follow=useRef(atEnd);

 useLayoutEffect(()=>{
  const area=history.current,room=area?.closest('.nexus-chat-window');
  if(!area||!room)return;
  let observedHeight=area.clientHeight;
  const update=()=>{
   setRoomHeight(room.clientHeight);
   observedHeight=area.clientHeight;
   if(follow.current)area.scrollTo({top:area.scrollHeight,behavior:'instant'});
  };
  const scroll=()=>{
   if(area.clientHeight===observedHeight)follow.current=area.scrollHeight-observedHeight-area.scrollTop<40;
  };
  update();
  const observer=new ResizeObserver(update);
  observer.observe(area);observer.observe(room);
  area.addEventListener('scroll',scroll,{passive:true});
  return()=>{observer.disconnect();area.removeEventListener('scroll',scroll);};
 },[history]);
 useEffect(()=>{
  let live=true;
  setFailed(false);
  emojiCatalog().then(value=>{if(live)setCatalog(value);}).catch(()=>{if(live)setFailed(true);});
  return()=>{live=false;};
 },[retry]);
 useLayoutEffect(()=>{body.current?.scrollTo({top:0});setLimit(batchSize);},[tab,query,category,shelf]);

 const entries=useMemo(()=>{
  const found=(catalog?.entries||[]).filter(entry=>(category==='all'||(category==='recent'?recent.includes(entry.emoji):entry.group===category))&&matchesEmoji(entry,query));
  return category==='recent'?found.sort((a,b)=>recent.indexOf(a.emoji)-recent.indexOf(b.emoji)):found;
 },[catalog,category,query,recent]);
 const clearSearch=()=>{input.current?.blur();setSearching(false);setQuery('');};
 const back=()=>{if(searching)clearSearch();else if(expanded)setExpanded(false);else onClose();};
 useMobileBack(true,back,95);
 const switchTab=(next:Tab)=>{clearSearch();setTab(next);if(next==='emoji')setCategory('all');try{localStorage.setItem(lastTabKey,next);}catch{}};
 const chooseShelf=(next:Shelf)=>{clearSearch();setShelf(next);};
 const openSearch=()=>{
  flushSync(()=>{setSearching(true);if(tab==='emoji')setCategory('all');if(tab==='sticker')setShelf('catalog');});
  input.current?.focus({preventScroll:true});
 };
 const createTile=<button type="button" className="phone-expression-create" onClick={onCreateSticker}><span><Pencil size={17}/></span><strong>Crear<br/>sticker</strong></button>;
 const searchLabel=tab==='emoji'?'Buscar emojis':tab==='gif'?'Buscar GIF':'Buscar stickers';
 return <section ref={panel} className="phone-expression-sheet" data-expanded={expanded} data-tab={tab} role="dialog" aria-label="Emojis, GIF y stickers"
  style={roomHeight?{'--phone-expression-room':roomHeight+'px'} as CSSProperties:undefined}
  onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();back();}}}>
  <button type="button" className="phone-expression-grip" aria-label={expanded?'Reducir panel de expresiones':'Ampliar panel de expresiones'} aria-expanded={expanded}
   onPointerDown={event=>{swiped.current=false;pointer.current={id:event.pointerId,y:event.clientY};event.currentTarget.setPointerCapture?.(event.pointerId);}}
   onPointerUp={event=>{const start=pointer.current;pointer.current=null;if(start?.id!==event.pointerId)return;const dy=event.clientY-start.y;if(Math.abs(dy)>=28){swiped.current=true;setExpanded(dy<0);}}}
   onPointerCancel={()=>{pointer.current=null;swiped.current=false;}}
   onClick={event=>{if(event.detail===0||!swiped.current)setExpanded(value=>!value);swiped.current=false;}}><span/></button>
  <header className="phone-expression-toolbar">
   <button type="button" aria-label={searching?'Cerrar búsqueda':searchLabel} onClick={searching?clearSearch:openSearch}>{searching?<X/>:<Search/>}</button>
   <div role="tablist" aria-label="Expresiones">
    <button type="button" role="tab" aria-label="Emojis" aria-selected={tab==='emoji'} onClick={()=>switchTab('emoji')}><Smile/></button>
    <button type="button" role="tab" aria-label="GIF" aria-selected={tab==='gif'} onClick={()=>switchTab('gif')}><b>GIF</b></button>
    <button type="button" role="tab" aria-label="Stickers" aria-selected={tab==='sticker'} onClick={()=>switchTab('sticker')}><Sticker/></button>
   </div>
   {tab==='sticker'?<button type="button" aria-label="Crear sticker desde una foto" onClick={onCreateSticker}><Pencil/></button>:<span/>}
  </header>
  {searching&&<label className="phone-expression-search"><Search size={16}/><input ref={input} aria-label={searchLabel} placeholder={searchLabel} type="search" value={query} onChange={event=>setQuery(event.target.value)}/></label>}
  {expanded&&tab==='sticker'&&!searching&&<div className="phone-expression-suggestions" aria-label="Buscar stickers por expresión">{suggestions.map(([emoji,label])=><button type="button" key={label} onClick={()=>{setShelf('catalog');setQuery(label);}} aria-pressed={query===label}>{emoji} {label}</button>)}</div>}
  <div ref={body} className="phone-expression-body" role="tabpanel" aria-label={tab==='emoji'?'Emojis':tab==='gif'?'GIF':'Stickers'}
   onScroll={event=>{const list=event.currentTarget;if(tab==='emoji'&&limit<entries.length&&list.scrollHeight-list.clientHeight-list.scrollTop<150)setLimit(value=>value+batchSize);}}>
   {tab==='emoji'?<>
    <div className="emoji-grid phone-emoji-grid" aria-label="Resultados de emojis">{entries.slice(0,limit).map(entry=><button key={entry.emoji} type="button" aria-label={entry.name} onClick={()=>{setRecent(rememberEmoji(entry.emoji,recent));onSelect(entry.emoji);}}>{entry.emoji}</button>)}</div>
    {!catalog&&!failed&&<p role="status">Cargando emojis…</p>}
    {failed&&<p role="alert">No se pudieron cargar los emojis. <button type="button" onClick={()=>setRetry(value=>value+1)}>Reintentar</button></p>}
    {catalog&&!entries.length&&<p>{category==='recent'&&!query?'Los emojis que uses aparecerán aquí.':'No se encontraron emojis.'}</p>}
   </>:tab==='sticker'&&shelf!=='catalog'?<SavedStickerPicker leading={createTile} recent={shelf==='recent'} query={query} onSend={onAsset}/>:<RemoteExpressions kind={tab} query={query} onSend={onAsset} leading={tab==='sticker'?createTile:undefined}/>}
  </div>
  {tab==='emoji'&&<nav className="phone-expression-shelves" aria-label="Categorías de emojis">
   <button type="button" aria-label="Emojis recientes" aria-pressed={category==='recent'} onClick={()=>setCategory('recent')}><Clock/></button>
   <button type="button" aria-label="Todos los emojis" aria-pressed={category==='all'} onClick={()=>setCategory('all')}><Grid3X3/></button>
   {Object.entries(emojiGroups).map(([id,label],i)=>{const Icon=categoryIcons[i];return <button type="button" key={id} aria-label={label} aria-pressed={category===id} onClick={()=>setCategory(id)}><Icon/></button>;})}
  </nav>}
  {tab==='sticker'&&<nav className="phone-expression-shelves" aria-label="Biblioteca de stickers">
   <button type="button" aria-label="Stickers recientes" aria-pressed={shelf==='recent'} onClick={()=>chooseShelf('recent')}><Clock/></button>
   <button type="button" aria-label="Stickers favoritos" aria-pressed={shelf==='favorites'} onClick={()=>chooseShelf('favorites')}><Star/></button>
   <button type="button" aria-label="Explorar stickers" aria-pressed={shelf==='catalog'} onClick={()=>chooseShelf('catalog')}><Sticker/></button>
  </nav>}
 </section>;
}
