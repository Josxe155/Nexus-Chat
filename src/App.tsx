import {ensureDirectContactChat} from './features/directContactChat';
import {ContactChatContext} from './features/ContactChatContext';
import {useAutomaticAccountReports} from './features/accountReports';
import ChooseUsername,{needsUsernameSelection} from './features/ChooseUsername';
import {recordVisit} from './features/visitActivity';
import PermissionReview from './features/PermissionReview';
import MaintenanceNotice from './features/MaintenanceNotice';
import {useDesktopWeb} from './features/useDesktopWeb';

import {readableMessage,encryptedPreview} from './features/encryption';
import {resetVoicePlayback,voiceAllowedChats} from './features/voicePlayback';
import SessionUnavailable from './components/SessionUnavailable';
import {dataErrorMessage} from './features/dataErrors';
import {touchGuestActivity} from './features/accountActivity';
import {prepareConversations,type StartupProgress} from './features/startupProgress';
import EmailVerificationGate from './features/EmailVerificationGate';
import {admitAccount} from './features/admission';
import ModerationNotices,{useRemovedAccount} from './features/ModerationNotices';
import {ContactCodeLink} from './features/PhoneContactCode';
import GroupInvite from './features/GroupInvite';import {useContactNames} from './features/contacts';
import StartupScreen from './components/StartupScreen';
import {apiFetch} from './features/api';
import {PersonalContext,usePersonalState,visibleMessage,visibleChat,clearForMe,restoreConversation} from './features/PersonalState';
import {useDeliveryReceipts,acknowledgeMessages,canReadReceipt} from './features/Receipts';
import {enqueueMessage,useOutbox} from './features/Outbox';
import usePagedMessages from './features/usePagedMessages';
import {useTheme,setThemeMode,useAccountPreferences,getPreferences} from './features/preferences';
import {usePushSession,queueNotificationEvent,disablePush} from './features/push';
import {useNotificationController,NotificationToast,playOutgoing} from './features/Notifications';
import {migrateOwnProfile,useAccessibleProfiles,normalizePrivacy,savePrivacy} from './features/privacy';
import {useMediaURLs} from './features/mediaTransfer';
import React, { useState, useEffect, useRef } from 'react';
import { auth, db, rtdb } from './firebase';
import {onValue,ref as realtimeRef} from 'firebase/database';
import { onAuthStateChanged,signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  writeBatch,
  getDocs,
  deleteDoc,
  increment,
  deleteField,
  arrayRemove,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { UserProfile, Chat, Message, ReactionMap } from './types';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { MessageCircle, Sparkles, FileText, UserPlus, Mail } from 'lucide-react';
import WorkspaceLayout from './components/WorkspaceLayout';
import RealtimeProvider from './features/RealtimeProvider';
import WorkspaceHub from './features/WorkspaceHub';
import usePresence from './features/usePresence';
import {presenceFor} from './features/presence';
import useServerClock from './features/useServerClock';
import {playNotification} from './features/Sounds';
import {clearMediaURLs,queueMediaDeletion,flushMediaDeletions} from './features/mediaTransfer';

export default function App() {
 useDesktopWeb();
  const [authUid,setAuthUid]=useState('');const accountRemoved=useRemovedAccount(authUid);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const theme=useTheme();
  useAccountPreferences(currentUser?.uid);
  useAutomaticAccountReports(currentUser?.uid);
  const contactNames=useContactNames(currentUser?.uid);
  useEffect(()=>{const select=(event:Event)=>{const id=(event as CustomEvent).detail;if(typeof id==='string'&&id.length<=512){setActiveChatId(id);setMobileView('chat');}};const close=()=>{setActiveChatId(null);setMobileView('sidebar');};window.addEventListener('nexus:select-chat',select);window.addEventListener('nexus:close-chat',close);return()=>{window.removeEventListener('nexus:select-chat',select);window.removeEventListener('nexus:close-chat',close);};},[]);


  const [showHub,setShowHub] = useState(false);
  useEffect(()=>{if(!currentUser)return;const ping=()=>{if(document.visibilityState==='visible'){void touchGuestActivity(currentUser.uid,!!auth.currentUser?.isAnonymous,currentUser.lastActiveAt||0).catch(()=>{});void flushMediaDeletions().catch(()=>{});}};ping();const timer=setInterval(ping,3600000);document.addEventListener('visibilitychange',ping);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',ping);};},[currentUser?.uid]);
  usePresence(currentUser);
  useEffect(()=>{if(currentUser)void recordVisit(currentUser.uid).catch(()=>{});},[currentUser?.uid]);
  // Global lists
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoaded,setChatsLoaded]=useState(false);const [usersLoaded,setUsersLoaded]=useState(false),[startupProgress,setStartupProgress]=useState<StartupProgress|null>(null);
  useEffect(()=>{if(currentUser&&chatsLoaded)voiceAllowedChats(currentUser.uid,new Set(chats.map(chat=>chat.id)));},[currentUser?.uid,chatsLoaded,chats.map(chat=>chat.id).join('|')]);
  const [pinnedIds,setPinnedIds]=useState<string[]>([]);
  const [presence,setPresence]=useState<Record<string,any>>({});
  const presenceNow=useServerClock(5000);
  const [lastSeen,setLastSeen]=useState<Record<string,number>>({}),[presenceAvailable,setPresenceAvailable]=useState(false);
  useEffect(()=>{if(!currentUser){setPinnedIds([]);setPresence({});setLastSeen({});setPresenceAvailable(false);clearMediaURLs();return;}const stops=[onSnapshot(doc(db,'users',currentUser.uid,'private','preferences'),snap=>setPinnedIds((snap.data()?.pinnedChatIds||[]).slice(0,3)),()=>{}),onValue(realtimeRef(rtdb,'.info/connected'),snap=>setPresenceAvailable(snap.val()===true))];return()=>stops.forEach(stop=>stop());},[currentUser?.uid]);
  const [policyRevision,setPolicyRevision]=useState(0);useEffect(()=>{const update=()=>setPolicyRevision(value=>value+1);window.addEventListener('nexus:presence-policy',update);return()=>window.removeEventListener('nexus:presence-policy',update);},[]);
  const presenceRevision=users.map(user=>user.uid+':'+(user.privacy?.updatedAt||0)).join('|');
  useEffect(()=>{if(!currentUser)return;const stops:(()=>void)[]=[];for(const user of users){stops.push(onValue(realtimeRef(rtdb,'presenceSessions/'+user.uid),snap=>setPresence(previous=>({...previous,[user.uid]:snap.val()})),()=>setPresence(previous=>({...previous,[user.uid]:null}))));stops.push(onValue(realtimeRef(rtdb,'presenceLastSeen/'+user.uid),snap=>setLastSeen(previous=>({...previous,[user.uid]:snap.val()||0})),()=>setLastSeen(previous=>({...previous,[user.uid]:0}))));}return()=>stops.forEach(stop=>stop());},[currentUser?.uid,JSON.stringify(currentUser?.privacy),presenceRevision,policyRevision]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const personal=usePersonalState(currentUser?.uid);const pendingMessages=useOutbox(currentUser?.uid);
  const latestMessages=useDeliveryReceipts(currentUser,chats);
  const mutedChatIds=Object.entries(personal.conversations).filter(([,state])=>(state.mutedUntil||0)>Date.now()).map(([id])=>id);
  usePushSession(currentUser?.uid,currentUser?.privacy?.blockedIds,mutedChatIds);
  const [expiryRevision,setExpiryRevision]=useState(0);

  const historyStart=chats.find(c=>c.id===activeChatId)?.historyStartsAt?.[currentUser?.uid||'']||0;
  const paged=usePagedMessages(currentUser?.uid,activeChatId,Math.max(historyStart,(personal.conversations[activeChatId||'']?.clearedAt||0)+1));
  const existingIds=new Set(paged.messages.map(message=>message.id));
  const activeMessages=!personal.loaded?[]:[...paged.messages,...pendingMessages.filter(message=>message.chatId===activeChatId&&!existingIds.has(message.id))].filter(message=>visibleMessage(message,personal.conversations[activeChatId||''],personal.flags)).sort((a,b)=>a.timestamp-b.timestamp);
  // Responsive state for mobile (active view)
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // Toggle Theme
  const handleToggleTheme = () => setThemeMode(theme==='dark'?'light':'dark');

  useEffect(()=>{const disable=(e:MouseEvent)=>e.preventDefault();document.addEventListener('contextmenu',disable);return()=>document.removeEventListener('contextmenu',disable);},[]);

  // Register service worker
  useEffect(() => {
    if (isSecureContext && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const [sessionError, setSessionError] = useState('');const [sessionAttempt,setSessionAttempt]=useState(0);
  useEffect(()=>{if(personal.error)setSessionError(personal.error);},[personal.error]);

  // 1. Listen to Authentication Changes
  useEffect(() => {
    let live=true,authRevision=0;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      resetVoicePlayback();
      if(!live)return;
      const revision=++authRevision;
      setLoading(true);setUsersLoaded(false);setStartupProgress(null);setSessionError('');setCurrentUser(null);setActiveChatId(null);setUsers([]);setChats([]);setMobileView('sidebar');setShowHub(false);
      try {
      setAuthUid(firebaseUser?.uid||'');setChatsLoaded(false);
      if (firebaseUser) {
        if(firebaseUser.providerData.some(p=>p.providerId==='password')&&!firebaseUser.emailVerified)return;
        await admitAccount(firebaseUser);
        // Fetch custom user doc to re-establish state
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const privateDoc = await getDoc(doc(db,'users',firebaseUser.uid,'private','profile'));
          const uData = {...userDoc.data(),...(privateDoc.exists()?privateDoc.data():{}),username:userDoc.data().username,usernameChangedAt:userDoc.data().usernameChangedAt} as UserProfile;
          const privacyDoc=await getDoc(doc(db,'users',firebaseUser.uid,'private','privacy'));
          if(!live||revision!==authRevision)return;
          const own={...uData,uid:firebaseUser.uid,privacy:normalizePrivacy(privacyDoc.exists()?privacyDoc.data():uData.privacy)};
          let ready:UserProfile=own;try{ready=await migrateOwnProfile(own,userDoc.data().privacy?.schemaVersion===2&&privateDoc.exists()&&privacyDoc.exists());}catch{console.warn('No se pudieron sincronizar los ajustes de privacidad.');}if(!live||revision!==authRevision)return;setCurrentUser(ready);
          

        }
      } else {
        setCurrentUser(null);
        setUsers([]);
        setChats([]);
        setActiveChatId(null);

        setMobileView('sidebar');
      }
      } catch (error:any) {
        if(!live||revision!==authRevision)return;
        console.error(error);
        setSessionError(error?.code?dataErrorMessage(error,'No se pudo cargar tu perfil. Inténtalo de nuevo.'):error.message||'No se pudo cargar tu perfil.');
      } finally { if(live&&revision===authRevision)setLoading(false); }
    });

    return () => {live=false;authRevision++;unsubscribe();};
  }, [sessionAttempt]);



  // 4. Real-time Listeners: list of Users
  useEffect(() => {
    if (!currentUser) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const uList: UserProfile[] = [];
      snapshot.forEach(doc => {
        uList.push(doc.data() as UserProfile);
      });
      setUsersLoaded(true);setUsers(uList.filter(u => !u.moderationRemoved && !['nexus-presence-bot','guide-presence-bot'].includes(u.uid) && (!u.isGuest || (u.lastActiveAt||u.createdAt)>Date.now()-30*86400000)));
 
    }, error => setSessionError(dataErrorMessage(error,'No se pudieron cargar los contactos.')));

    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(()=>{if(!currentUser)return;const stops=[onSnapshot(doc(db,'users',currentUser.uid),snap=>{if(snap.exists())setCurrentUser(previous=>previous?{...previous,username:snap.data().username,usernameChangedAt:snap.data().usernameChangedAt,usernameProvisional:snap.data().usernameProvisional}:previous);},()=>{}),onSnapshot(doc(db,'users',currentUser.uid,'private','profile'),snap=>{if(snap.exists())setCurrentUser(previous=>previous?{...previous,...snap.data(),username:previous.username,usernameChangedAt:previous.usernameChangedAt}:previous);},()=>{}),onSnapshot(doc(db,'users',currentUser.uid,'private','privacy'),snap=>{if(snap.exists())setCurrentUser(previous=>previous?{...previous,privacy:{...snap.data(),schemaVersion:2}}:previous);},()=>{})];return()=>stops.forEach(stop=>stop());},[currentUser?.uid]);
  // 5. Real-time Listeners: Chat rooms where currentUser is participant
  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
    
    let live=true,revision=0,first=true;
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ownRevision=++revision;
      const cList=first?await prepareConversations<Chat>(snapshot.docs as any,setStartupProgress,()=>live&&revision===ownRevision):snapshot.docs.map(document=>document.data() as Chat);
      if(!live||ownRevision!==revision||!cList)return;
      first=false;setChats(cList.filter(c => !c.moderationRemoved && !c.participants.some(id => ['nexus-presence-bot','guide-presence-bot'].includes(id))));setChatsLoaded(true);
    }, error => setSessionError(dataErrorMessage(error,'No se pudieron cargar los chats.')));
    return () => {live=false;revision++;unsubscribe();};
  }, [currentUser?.uid]);

  useEffect(()=>{if(!currentUser||!activeChatId)return;const selected=chats.find(chat=>chat.id===activeChatId);if(!selected)return;const mark=async()=>{if(document.visibilityState!=='visible'||document.querySelector('.app-lock-backdrop'))return;await acknowledgeMessages(selected,currentUser.uid,paged.messages,canReadReceipt(selected,currentUser,users));const last=paged.messages.at(-1)?.timestamp||personal.conversations[activeChatId]?.clearedAt||0;await runTransaction(db,async tx=>{const ref=doc(db,'chats',activeChatId),snapshot=await tx.get(ref);if((snapshot.data()?.unreadCount?.[currentUser.uid]||0)>0&&(snapshot.data()?.lastMessage?.timestamp||0)<=last)tx.update(ref,{['unreadCount.'+currentUser.uid]:0});});};mark().catch(()=>{});const listener=()=>mark().catch(()=>{});document.addEventListener('visibilitychange',listener);window.addEventListener('nexus:app-unlocked',listener);return()=>{document.removeEventListener('visibilitychange',listener);window.removeEventListener('nexus:app-unlocked',listener);};},[currentUser?.uid,activeChatId,JSON.stringify(currentUser?.privacy),paged.messages,JSON.stringify(users.map(user=>[user.uid,user.privacy?.readReceipts]))]);

  // 8. Core Operations: Select Chat or create room if not exists
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setMobileView('chat'); // Switch layouts on mobile devices
  };

  const handleCreateChat = async (otherUserId: string, contactSaved=false) => {
    if (!currentUser) throw Error('Vuelve a iniciar sesión.');
    if(auth.currentUser?.uid!==currentUser.uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');
    try {
      const target=await getDoc(doc(db,'users',otherUserId));
      if(!target.exists()||target.data().moderationRemoved)throw Error('Este contacto ya no está registrado en Nexus Chat.');
      // Find whether a chat room involving both participants already exists
      const participants=[...new Set([currentUser.uid,otherUserId])];
      const existingChat=chats.find(chat=>(!chat.kind||chat.kind==='direct')&&chat.participants.length===participants.length&&participants.every(uid=>chat.participants.includes(uid)));

      if (existingChat) {
        if(auth.currentUser?.uid!==currentUser.uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');
        await restoreConversation(currentUser.uid,existingChat.id);
        handleSelectChat(existingChat.id);
        return;
      }

      // If not exists, provision a brand new Chat document
      const newChatId = encodeURIComponent(JSON.stringify([...participants].sort()));

      const newChatObject: Chat = {
        id: newChatId,
        participants,
        createdAt: Date.now(),
        unreadCount: {
          [currentUser.uid]: 0,
          [otherUserId]: 0
        },
        pinned: {
          [currentUser.uid]: false,
          [otherUserId]: false
        },
        archived: {
          [currentUser.uid]: false,
          [otherUserId]: false
        }
      };

      newChatObject.disappearingMs=getPreferences(currentUser.uid).chat.defaultDurationMs;
      await ensureDirectContactChat(currentUser.uid,newChatObject);
      const options=normalizePrivacy(currentUser.privacy);if(!contactSaved&&!options.contactIds.includes(otherUserId))setCurrentUser(await savePrivacy(currentUser,{...options,contactIds:[...options.contactIds,otherUserId]}));
      if(auth.currentUser?.uid!==currentUser.uid)throw Error('La sesión cambió. Vuelve a iniciar sesión.');
      await restoreConversation(currentUser.uid,newChatId);
      handleSelectChat(newChatId);

    } catch (err) {
      console.error("Could not create chat room document", err);throw err;
    }
  };

  // 9. Core Operations: Send Text/Media message
  const handleSendMessage = async (
    content: string, 
    type: Message['type'], 
    fileDetails?: { fileUrl: string; fileName: string; fileSize: number; transferId?: string; viewOnce?: boolean; contact?: {uid:string;name:string;username:string} },
    replyTo?: Message['replyTo']
  ) => {
    if (!currentUser || !activeChatId) return;
    const selected=chats.find(chat=>chat.id===activeChatId);if(!selected)return;
    await enqueueMessage(selected,currentUser.uid,content,type,{...fileDetails,...(replyTo?{replyTo}:{})});
  };

  // 10. Operations: Message Reactions
  const handleReactMessage = async (messageId: string, emoji: string) => {
    if (!currentUser || !activeChatId) return;
    try {
      const mRef = doc(db, 'chats', activeChatId, 'messages', messageId);
      const mDoc = await getDoc(mRef);
      if (mDoc.exists()) {
        const msg = mDoc.data() as Message;
        const currentReactions: ReactionMap = msg.reactions || {};
        
        // Toggle or add reaction
        if (currentReactions[currentUser.uid] === emoji) {
          delete currentReactions[currentUser.uid];
        } else {
          currentReactions[currentUser.uid] = emoji;
        }

        await updateDoc(mRef, { [`reactions.${currentUser.uid}`]: currentReactions[currentUser.uid] || deleteField() });
        if(currentReactions[currentUser.uid])queueNotificationEvent({kind:'reaction',chatId:activeChatId,messageId,senderName:currentUser.nombre});
      }
    } catch (err) {
      console.error("React message error", err);
    }
  };

  // 11. Operations: Edit Message
  const handleEditMessage=async(messageId:string,newContent:string)=>{
    if(!currentUser||!activeChatId)return;
    const messageRef=doc(db,'chats',activeChatId,'messages',messageId);const chatRef=doc(db,'chats',activeChatId);
    await runTransaction(db,async transaction=>{const [snapshot,chatSnapshot]=await Promise.all([transaction.get(messageRef),transaction.get(chatRef)]);const message=snapshot.data();const timestamp=message?.serverSentAt?.toMillis?.()||message?.timestamp;if(!message||message.senderId!==currentUser.uid||Date.now()-timestamp>900000||!newContent.trim()||newContent.length>20000)throw new Error('Puedes editar tus mensajes durante los primeros 15 minutos.');const chat=chatSnapshot.data()as Chat;if(message.sealed)throw Error('Este mensaje pertenece al historial cifrado anterior y no se puede editar.');transaction.update(messageRef,{content:newContent.trim(),edited:true});if(chatSnapshot.data()?.lastMessage?.id===messageId)transaction.update(chatRef,{'lastMessage.content':message.sealed?encryptedPreview:newContent.trim()});});
  };
  const handleDeleteMessage=async(messageId:string)=>{
    if(!currentUser||!activeChatId)return;
    const messageRef=doc(db,'chats',activeChatId,'messages',messageId);const chatRef=doc(db,'chats',activeChatId);
    let mediaToDelete:string|undefined;try{await runTransaction(db,async transaction=>{const [snapshot,chatSnapshot]=await Promise.all([transaction.get(messageRef),transaction.get(chatRef)]);if(snapshot.data()?.senderId!==currentUser.uid)throw new Error('Solo puedes eliminar tus propios mensajes.');mediaToDelete=(await readableMessage({...snapshot.data(),id:messageId}as Message,currentUser.uid)).fileUrl;transaction.update(messageRef,{sealed:deleteField(),deletedAt:Date.now(),content:'🚫 Este mensaje fue eliminado',type:'text',fileUrl:'',fileName:'',fileSize:0});if(chatSnapshot.data()?.lastMessage?.id===messageId)transaction.update(chatRef,{'lastMessage.content':'🚫 Este mensaje fue eliminado','lastMessage.type':'text'});});await queueMediaDeletion(mediaToDelete).catch(()=>{});}catch(error){console.error(error);throw error;}
  };

  // 13. Operations: Profile settings modification
  const handleUpdateProfile=async(nombre:string,bio:string,foto:string)=>{if(currentUser)setCurrentUser(await savePrivacy({...currentUser,nombre,bio,foto},normalizePrivacy(currentUser.privacy)));};

  // 14. Operations: Toggle Pinned Chat Status
  const handleTogglePin = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatDoc = chats.find(c => c.id === chatId);
      if (chatDoc) {
        const currentlyPinned = pinnedIds.includes(chatId);
        if (!currentlyPinned && pinnedIds.length >= 3) {alert('Puedes fijar hasta tres chats.'); return;}
        const chatRef = doc(db, 'chats', chatId);
        const nextPinnedIds=pinnedIds.filter(id=>id!==chatId);
        if(!currentlyPinned)nextPinnedIds.push(chatId);
        const batch=writeBatch(db);
        batch.set(doc(db,'users',currentUser.uid,'private','preferences'),{pinnedChatIds:nextPinnedIds},{merge:true});
        batch.update(chatRef,{[`pinned.${currentUser.uid}`]:!currentlyPinned});
        await batch.commit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 15. Operations: Toggle Archived Chat Status
  const handleToggleArchive = async (chatId: string) => {
    if (!currentUser) return;
    try {
      const chatDoc = chats.find(c => c.id === chatId);
      if (chatDoc) {
        const currentlyArchived = chatDoc.archived?.[currentUser.uid] === true;
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
          [`archived.${currentUser.uid}`]: !currentlyArchived
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 16. Operations: Delete conversation
  const handleDeleteChat=async(chatId:string,removeConversation=true)=>{if(!currentUser)return;const selected=chats.find(chat=>chat.id===chatId);if(!selected)return;await clearForMe(currentUser.uid,selected,removeConversation);if(removeConversation&&activeChatId===chatId){setActiveChatId(null);setMobileView('sidebar');}};

  // 17. Operations: Clear Chat History completely
  const handleClearChatHistory = async (chatId: string) => {
    await handleDeleteChat(chatId, false);
  };

  // 18. Operations: Sync user typing status to Database
  const lastTyping=useRef({chatId:'',at:0,active:false});
  const handleSetTypingStatus = async (isTyping: boolean) => {
    if(!currentUser||!activeChatId)return;const last=lastTyping.current,now=Date.now();if(isTyping&&last.chatId===activeChatId&&last.active&&now-last.at<2000)return;if(!isTyping&&(!last.active||last.chatId!==activeChatId))return;lastTyping.current={chatId:activeChatId,at:now,active:isTyping};
    try {
      if(activeChatId)await updateDoc(doc(db,'chats',activeChatId),{['typing.'+currentUser.uid]:isTyping?Date.now()+5000:0});
    } catch (err) {
      console.warn("Could not sync typing state", err);
    }
  };

  useEffect(()=>{const shortcuts=(event:KeyboardEvent)=>{if(event.key==='F12'||(event.ctrlKey||event.metaKey)&&event.shiftKey&&['I','J','C'].includes(event.key.toUpperCase()))event.preventDefault();};document.addEventListener('keydown',shortcuts,true);return()=>document.removeEventListener('keydown',shortcuts,true);},[]);
  const activeChat = chats.find(c => c.id === activeChatId && !c.moderationRemoved);
  const visibleChats=(personal.loaded?chats:[]).filter(chat=>visibleChat(chat,personal.conversations[chat.id])).filter(chat=>chat.kind==='group'||!chat.participants.some(id=>currentUser?.privacy?.blockedIds?.includes(id))).map(c=>({...c,...(c.lastMessage?.expiresAt&&c.lastMessage.expiresAt<=Date.now()?{lastMessage:{...c.lastMessage,content:'Mensaje temporal caducado',type:'text' as const}}:{}),pinned:{...c.pinned,[currentUser?.uid||'']:pinnedIds.includes(c.id)}}));
  const protectedUsers=useAccessibleProfiles(users,currentUser?.uid||'',currentUser?.privacy);
  const projectedUsers=protectedUsers.map(person=>person.uid===currentUser?.uid?currentUser:contactNames[person.uid]&&currentUser?.privacy?.contactIds?.includes(person.uid)?{...person,nombre:[contactNames[person.uid].first,contactNames[person.uid].last].filter(Boolean).join(' ')}:person);
  const profileMedia=useMediaURLs(projectedUsers.map(person=>({id:person.uid,fileUrl:person.foto,force:true,fileSize:1})),currentUser?.uid||'');
  const visibleUsers=projectedUsers.map(user=>presenceFor(user,presence[user.uid],lastSeen[user.uid],presenceAvailable,presenceNow));
  useNotificationController(currentUser,visibleChats,visibleUsers,handleSelectChat,chatsLoaded&&personal.loaded,mutedChatIds);
  useEffect(()=>{const next=Math.min(...paged.messages.map(message=>message.expiresAt||Infinity).filter(time=>time>Date.now()));if(!Number.isFinite(next))return;const timer=setTimeout(()=>setExpiryRevision(value=>value+1),Math.min(2147483647,Math.max(1,next-Date.now()+10)));return()=>clearTimeout(timer);},[paged.messages,expiryRevision]);

  if(accountRemoved)return <main className="account-removed" role="alert"><h1>Cuenta desactivada</h1><p>Tu cuenta se retiró tras recibir varios reportes.</p><button onClick={()=>signOut(auth)}>Cerrar sesión</button></main>;
  if (loading||currentUser&&!sessionError&&(!chatsLoaded||!usersLoaded||!personal.loaded)) return <StartupScreen phase={authUid?'conversations':'session'} progress={authUid?startupProgress:null}/>;

  if(auth.currentUser?.providerData.some(p=>p.providerId==='password')&&(!auth.currentUser.emailVerified||sessionError.includes('Completa el registro')||sessionError.includes('ocupado')))return <EmailVerificationGate initialComplete={auth.currentUser.emailVerified}/>;
  if (sessionError) return <SessionUnavailable message={sessionError} onRetry={()=>setSessionAttempt(value=>value+1)} onLogout={async()=>{try{await disablePush().catch(()=>{});await signOut(auth);setSessionError('');}catch{setSessionError('No se pudo cerrar la sesión. Inténtalo de nuevo.');}}}/>;

  // Not logged in: Show pair instructions Auth Portal
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} theme={theme} onToggleTheme={handleToggleTheme} />;
  }

  return (
    <ContactChatContext.Provider value={uid=>handleCreateChat(uid,true)}><PersonalContext.Provider value={personal}><RealtimeProvider user={currentUser} users={visibleUsers} knownIds={[...new Set(chats.filter(c=>c.kind!=='channel').flatMap(c=>c.participants))]}><WorkspaceLayout theme={theme} showChat={mobileView === 'chat'} sidebar={
      <Sidebar latestMessages={latestMessages} currentUser={currentUser} chats={visibleChats} activeChatId={activeChatId} users={visibleUsers} theme={theme}
        onUserChange={setCurrentUser} onOpenHub={()=>setShowHub(true)} onToggleTheme={handleToggleTheme} onChatSelect={handleSelectChat} onCreateChat={handleCreateChat}
        onUpdateProfile={handleUpdateProfile} onTogglePin={handleTogglePin} onToggleArchive={handleToggleArchive}
        onDeleteChat={handleDeleteChat} onLogout={() => {disablePush().catch(()=>{});setCurrentUser(null);}}
 />
    }>
      {activeChat ? <ChatWindow key={activeChat.id} currentUser={currentUser} activeChat={activeChat}
        messages={activeMessages} chats={visibleChats} hasOlder={paged.hasMore} loadingOlder={paged.loading} historyError={paged.error} onRetryHistory={paged.retry} onLoadOlder={paged.loadMore} users={visibleUsers} theme={theme} onBack={() => {setActiveChatId(null);setMobileView('sidebar');}}
        onOpenContact={handleCreateChat} onSendMessage={handleSendMessage} onReactMessage={handleReactMessage} onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage} onClearChatHistory={handleClearChatHistory} setTypingStatus={handleSetTypingStatus} />
        : <div className="workspace-empty"><span className="empty-mark"><img src="/nexus-icon.svg?v=4" width="76" height="76" alt=""/></span><span className="eyebrow">TU ESPACIO, TUS CONVERSACIONES</span><h1>Un hola puede<br />ser el comienzo.</h1><p>Elige una conversación o busca un contacto<br />para empezar a compartir.</p><div className="desktop-welcome-actions"><button onClick={()=>{handleCreateChat(currentUser.uid).then(()=>setTimeout(()=>document.querySelector<HTMLButtonElement>('[title="Adjuntar archivo"]')?.click(),100));}}><span><FileText size={23}/></span>Enviar documento</button><button onClick={()=>window.dispatchEvent(new CustomEvent('nexus:navigate',{detail:'contacts'}))}><span><UserPlus size={23}/></span>Añadir contacto</button><button onClick={()=>navigator.clipboard.writeText(location.origin).catch(()=>{})}><span><Mail size={23}/></span>Invitar a un amigo</button><button className="nexus-ai-entry" onClick={()=>window.dispatchEvent(new CustomEvent('nexus:navigate',{detail:'assistant'}))}><span className="nexus-ai-mark"><Sparkles size={23}/></span>Pregúntale a Nexus AI</button></div><span className="empty-footnote">Sin tarjeta SIM. Solo internet.</span></div>}
    </WorkspaceLayout><MaintenanceNotice uid={currentUser.uid}/><PermissionReview/><GroupInvite uid={currentUser.uid}/><ContactCodeLink key={currentUser.uid} uid={currentUser.uid} onContact={handleCreateChat}/><ModerationNotices uid={currentUser.uid}/><NotificationToast/>{showHub&&<WorkspaceHub user={currentUser} users={users} chats={chats} onSelect={handleSelectChat} onClose={()=>setShowHub(false)} onUserChange={setCurrentUser}/>}</RealtimeProvider></PersonalContext.Provider></ContactChatContext.Provider>
  );
}
