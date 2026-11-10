import type {CSSProperties} from 'react';
export const STATUS_BACKGROUNDS=['#26c4dc','#57c9ff','#5696ff','#7acba5','#54c265','#90a841','#b6b327','#f0b330','#c1a03f','#ff8a8c','#ff7b6b','#a62c71','#6e257e','#8b6990','#c69fcc','#8294ca','#4d6dd7','#7e90a3','#243640','#ae8774','#74676a'] as const;
export const STATUS_FONTS=['sans','serif','serif-italic','hand','bold','rounded','mono'] as const;
export type StatusFont=typeof STATUS_FONTS[number];
export type ChannelStatusInfo={id:string;title:string;description:string;photoURL?:string;followers:number};
export function statusFontStyle(font?:string):CSSProperties{return ({sans:{fontFamily:'Roboto,Arial,sans-serif'},serif:{fontFamily:'Georgia,serif'},'serif-italic':{fontFamily:'Georgia,serif',fontStyle:'italic'},hand:{fontFamily:'cursive'},bold:{fontFamily:'Roboto,Arial,sans-serif',fontWeight:700},rounded:{fontFamily:'Arial Rounded MT Bold,Arial,sans-serif',fontWeight:600},mono:{fontFamily:'ui-monospace,monospace'}} as Record<string,CSSProperties>)[font||'sans']||{};}
