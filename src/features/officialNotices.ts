import {collection,limit,onSnapshot,orderBy,query,Timestamp,type Firestore} from 'firebase/firestore';

export const noticeCategories=['Novedad','Aviso','Seguridad'] as const;
export const noticeLimit=50;
export type OfficialNotice={id:string;category:typeof noticeCategories[number];title:string;body:string;publishedAt:Timestamp};

export function subscribeToOfficialNotices(db:Firestore,onNotices:(notices:OfficialNotice[])=>void,onError:()=>void){
 const recent=query(collection(db,'officialNotices'),orderBy('publishedAt','desc'),limit(noticeLimit));
 return onSnapshot(recent,snapshot=>{
  const notices=snapshot.docs.flatMap(item=>{
   const {category,title,body,publishedAt:value}=item.data({serverTimestamps:"estimate"});
   const publishedAt=typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<8e12?Timestamp.fromMillis(value):value;
   if(!noticeCategories.some(option=>option===category)||typeof title!=='string'||typeof body!=='string'||!(publishedAt instanceof Timestamp))return [];
   return [{id:item.id,category,title,body,publishedAt}];
  });
  onNotices(notices);
 },onError);
}
