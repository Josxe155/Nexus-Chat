import {doc,getDoc,runTransaction,writeBatch} from 'firebase/firestore';
import {auth,db} from '../firebase';
import type {UserProfile} from '../types';
import {validateGroupDraft} from './contactMenuModel';
import {normalizePrivacy} from './privacy';
// A missing private chat/community is not publicly readable under the existing rules.
async function existing(reference:ReturnType<typeof doc>){try{const snapshot=await getDoc(reference);return snapshot.exists()?snapshot:null;}catch(error){if((error as {code?:string}).code==='permission-denied')return null;throw error;}}
function session(uid:string){if(auth.currentUser?.uid!==uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');}
export async function createContactGroup(user:UserProfile,id:string,title:string,members:string[],disappearingMs:number){
 const draft=validateGroupDraft(title,members,user.uid);if(![0,86400000,604800000,7776000000].includes(disappearingMs))throw Error('Elige una duración válida.');session(user.uid);
 const target=doc(db,'chats',id),validExisting=(data:Record<string,any>)=>data.kind==='group'&&data.createdBy===user.uid;
 const saved=await existing(target);session(user.uid);if(saved){if(!validExisting(saved.data()))throw Error('No se pudo recuperar el grupo.');return id;}
 try{await runTransaction(db,async tx=>{
  const snapshot=await tx.get(doc(db,'users',user.uid,'private','privacy'));session(user.uid);
  const settings=normalizePrivacy(snapshot.exists()?snapshot.data():user.privacy);
  if(draft.members.some(uid=>!settings.contactIds.includes(uid)||settings.blockedIds.includes(uid)))throw Error('Revisa los miembros: deben estar en tus contactos y disponibles.');
  const profiles=await Promise.all(draft.members.map(uid=>tx.get(doc(db,'users',uid))));if(profiles.some(profile=>!profile.exists()||profile.data()?.moderationRemoved))throw Error('Uno de los contactos ya no está disponible.');session(user.uid);
  tx.set(target,{id,kind:'group',createdBy:user.uid,title:draft.title,description:'',photoURL:'',participants:[user.uid,...draft.members],admins:[user.uid],sendPolicy:'everyone',membersCanEdit:false,membersCanAdd:false,disappearingMs,createdAt:Date.now(),unreadCount:{}});
 });}catch(error){const recovered=await existing(target);if(!recovered||!validExisting(recovered.data()))throw error;}
 session(user.uid);return id;
}
export async function createContactCommunity(user:UserProfile,id:string,announcements:string,title:string,description:string,photoURL:string){
 session(user.uid);if(!title.trim()||title.trim().length>100||description.length>2048)throw Error('Revisa el nombre y la descripción de la comunidad.');
 const community=doc(db,'communities',id),room=doc(db,'chats',announcements);
 const recover=async()=>{const saved=await existing(community);if(!saved)return null;const data=saved.data();if(data.owner!==user.uid||data.announcementsChatId!==announcements)throw Error('No se pudo recuperar la comunidad.');const chat=await existing(room);if(!chat)throw Error('No se pudo recuperar el grupo de avisos.');return {id,...data};};
 const saved=await recover();session(user.uid);if(saved)return saved;
 const value={id,title:title.trim(),description:description.trim(),photoURL,owner:user.uid,admins:[user.uid],members:[user.uid],groups:[announcements],announcementsChatId:announcements,createdAt:Date.now()};
 const batch=writeBatch(db);batch.set(community,value);batch.set(room,{id:announcements,kind:'group',createdBy:user.uid,description:'',photoURL:'',title:('Avisos · '+title.trim()).slice(0,100),participants:[user.uid],admins:[user.uid],sendPolicy:'admins',communityId:id,createdAt:Date.now(),unreadCount:{}});
 try{session(user.uid);await batch.commit();}catch(error){const recovered=await recover();if(!recovered)throw error;session(user.uid);return recovered;}
 session(user.uid);return value;
}
