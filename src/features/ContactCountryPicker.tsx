import {useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft,Check,Search,X} from 'lucide-react';
import {countryFlag,nativeCountryName,orderedContactCountries} from './contactCountries';
import {useMobileBack} from './useMobileBack';
export default function ContactCountryPicker({value,onSelect,onClose}:{value:string;onSelect:(id:string)=>void;onClose:()=>void}){
 const [search,setSearch]=useState(false),[query,setQuery]=useState('');
 useMobileBack(true,()=>{if(search){setSearch(false);setQuery('');}else onClose();},110);
 return createPortal(<section className="pcm-page pcm-country-picker" role="dialog" aria-modal="true" aria-label="Seleccionar país"><header><button type="button" aria-label="Volver al contacto" onClick={onClose}><ArrowLeft/></button>{search?<input autoFocus aria-label="Buscar país o código" placeholder="Buscar país o código" value={query} onChange={e=>setQuery(e.target.value)}/>:<h2>Elige un país</h2>}<button type="button" aria-label={search?'Cerrar búsqueda de país':'Buscar país'} onClick={()=>{setSearch(!search);setQuery('');}}>{search?<X/>:<Search/>}</button></header><main>{orderedContactCountries(query,value).map(([id,name,code])=><button type="button" className="pcm-country-option" key={id} aria-pressed={id===value} onClick={()=>onSelect(id)}><span className="pcm-country-flag" aria-hidden="true">{countryFlag(id)}</span><span>{name}{nativeCountryName(id)&&<small>{nativeCountryName(id)}</small>}</span><span>{code?'+'+code:''}</span>{id===value&&<Check size={18}/>}</button>)}{!orderedContactCountries(query,value).length&&<p className="pcm-empty">No se encontraron países.</p>}</main></section>,document.body);
}
