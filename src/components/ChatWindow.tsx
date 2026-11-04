import DesktopStickerViewer from '../features/DesktopStickerViewer';
import MobileContacts from '../features/MobileContacts';
import {useDesktopWeb} from '../features/useDesktopWeb';import {DesktopAttachmentReview,DesktopContacts,DesktopCamera,DesktopFileAudio} from '../features/DesktopAttachments';import DesktopEvent from '../features/DesktopEvent';
import {Lock} from 'lucide-react';
import ReactionDetails from '../features/ReactionDetails';
import {excludeVoice,invalidateVoice,type VoiceTrack} from '../features/voicePlayback';
import PinMessageDialog,{messagePinned,setMessagePin,usePinClock,useSharedPins} from '../features/MessagePins';
import ProfileQuickView from '../features/ProfileQuickView';
import {useMobileBack} from '../features/useMobileBack';
import MediaViewer from '../features/MediaViewer';
import AttachmentCard from '../features/AttachmentCard';
import AppLock from '../features/AppLock';
import MobileChatOptions from '../features/MobileChatOptions';
import ChannelDetails from '../features/ChannelDetails';
import {useInterfacePalette,defaultBubble} from '../features/InterfacePalette';
import ConversationReport from '../features/ConversationReport';import {clearForMe} from '../features/PersonalState';import {Users,UserPlus,Flag,Shield,LogOut} from 'lucide-react';
import LocationComposer from '../features/LocationComposer';import {MapPin} from 'lucide-react';
import {ConversationTool} from '../features/ConversationTools';import EventComposer from '../features/EventComposer';import {changeConversation} from '../features/PersonalState';import {normalizePrivacy,savePrivacy} from '../features/privacy';import {Calendar,BellOff,ListPlus} from 'lucide-react';
import {pastedFiles,copyImage} from '../features/clipboard';
import FloatingMenu from '../features/FloatingMenu';
import ContactDetails from '../features/ContactDetails';
import {ForwardDialog,MessageInformation,DeleteMessagesDialog,exportConversation} from '../features/ConversationActions';
import {LiveLocationCard,startLiveLocation} from '../features/LiveLocation';
import PhotoEditor from '../features/PhotoEditor';
import {useDeleteUndo} from '../features/DeleteUndo';
import {editPollQuestion} from '../features/chatService';
import {usePersonal,setMessageFlag,hideMessages,flagId,visibleMessage,readDraft,writeDraft} from '../features/PersonalState';
import {MessageTick,canReadReceipt} from '../features/Receipts';
import {retryMessage,discardMessage} from '../features/Outbox';
import {Forward,Copy,Star,CheckSquare,Clock,ChevronDown} from 'lucide-react';
import {usePreferences,replaceEmojiText,preparePhoto} from '../features/preferences';
import {previewMedia} from '../features/mediaTransfer';
import CameraCapture from '../features/CameraCapture';
import EmojiPicker,{stickerFile} from '../features/EmojiPicker';
import {lastSeenLabel} from '../features/presence';
import AppearancePanel,{useAppearance,contrastColor} from '../features/Appearance';
import {useMediaURLs,downloadMedia,isPrivateMedia} from '../features/mediaTransfer';
import {avatar,DEFAULT_AVATAR} from '../features/avatar';
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Chat, Message, ReactionMap } from '../types';
import { 
  Camera, UserRound, AudioLines,
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  Image as ImageIcon, 
  File, 
  Video, 
  X, 
  Check, 
  CheckCheck, 
  CornerUpLeft, 
  Edit3, 
  Trash2, 
  ArrowLeft, 
  MoreVertical, 
  Search, 
  Info, 
  Play, 
  Pause,
  Download,
  AlertCircle, Pin, Languages, BarChart3, Sparkles, Type
} from 'lucide-react';
import { db } from '../firebase';
import RichText from '../features/RichText';
import GroupSettings from '../features/GroupSettings';
import Stickers from '../features/Stickers';
import Recorder, {AudioPlayer} from '../features/Recorder';
import {CallButtons,VoiceRoomButton,useRealtime} from '../features/RealtimeProvider';
import {PollCard,PollDialog,TranslationDialog,WritingDialog} from '../features/MessageTools';

import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';

interface ChatWindowProps {
  chats?:Chat[];hasOlder?:boolean;loadingOlder?:boolean;
  historyError?:string;
  onRetryHistory?:()=>void;onLoadOlder?:()=>void;
  onOpenContact?: (uid:string)=>void;
  currentUser: UserProfile;
  activeChat: Chat;
  messages: Message[];
  users: UserProfile[];
  theme: "light" | "dark";
  onBack: () => void;
  onSendMessage: (
    content: string, 
    type: Message['type'], 
    fileDetails?: { fileUrl: string; fileName: string; fileSize: number; transferId?: string; contact?: {uid:string;name:string;username:string} },
    replyTo?: { id: string; senderName: string; content: string; type: string }
  ) => Promise<void>;
  onReactMessage: (messageId: string, emoji: string) => Promise<void>;
  onEditMessage: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onClearChatHistory: (chatId: string) => Promise<void>;
  setTypingStatus: (isTyping: boolean) => void;
}

function safeMediaURL(value?:string){if(!value)return undefined;try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return value;if(url.protocol==='blob:'&&value.startsWith('blob:'+location.origin+'/'))return value;}catch{}return undefined;}

export default function ChatWindow({
  currentUser,onOpenContact,chats:allChats=[],hasOlder=false,loadingOlder=false,historyError,onRetryHistory,onLoadOlder,
  activeChat,
  messages:incomingMessages,
  users,
  theme,
  onBack,
  onSendMessage,
  onReactMessage,
  onEditMessage,
  onDeleteMessage,
  onClearChatHistory,
  setTypingStatus
}: ChatWindowProps) {
  const desktopWeb=useDesktopWeb(),mobileOptions=!desktopWeb;
  const [contactView,setContactView]=useState('info');useEffect(()=>{const open=()=>{if(sessionStorage.getItem('nexus-open-contact')===activeChat.id){sessionStorage.removeItem('nexus-open-contact');setContactView('info');setShowContact(true);}};open();window.addEventListener('nexus:contact-info',open);return()=>window.removeEventListener('nexus:contact-info',open);},[activeChat.id]);
  const [restricted,setRestricted]=useState(false);const restrictEvent='nexus:restrict:'+activeChat.id;useEffect(()=>{if(sessionStorage.getItem('nexus-restrict-chat')===activeChat.id){sessionStorage.removeItem('nexus-restrict-chat');setTimeout(()=>window.dispatchEvent(new Event(restrictEvent)),0);}},[activeChat.id]);
  const realtime=useRealtime(),personal=usePersonal(),deleteUndo=useDeleteUndo(currentUser.uid);
  useEffect(()=>{const host=document.querySelector('.workspace-chat');host?.setAttribute('data-voice-chat',activeChat.id);return()=>host?.removeAttribute('data-voice-chat');},[activeChat.id]);
  const messages=incomingMessages.filter(message=>visibleMessage(message,personal.conversations[activeChat.id],personal.flags));
  const [selectedIds,setSelectedIds]=useState<string[]>([]),[forwarding,setForwarding]=useState<Message[]|null>(null),[deleting,setDeleting]=useState<Message[]|null>(null),[information,setInformation]=useState<Message|null>(null),[showContact,setShowContact]=useState(false),[menuAt,setMenuAt]=useState({x:0,y:0}),[dragging,setDragging]=useState(false),[nearBottom,setNearBottom]=useState(true);
  const ignoreMessageClick=useRef<string|null>(null);
  const gesture=useRef<any>(undefined),dragDepth=useRef(0),lastScrollCount=useRef(0),previousHeight=useRef(0);
  const selected=messages.filter(message=>selectedIds.includes(message.id));
  const openMenu=(message:Message,x:number,y:number)=>{if(message.decryptionFailed){setContactView('security');setShowContact(true);return;}setMenuAt({x,y});setOpenMessageId(message.id);};
  const toggleSelection=(id:string)=>setSelectedIds(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id]);
  const copyText=async(list:Message[])=>{try{await navigator.clipboard.writeText(list.map(message=>message.content).join('\n'));}catch{setUploadError('No se pudo copiar. Selecciona el texto para copiarlo.');}};
  const mine=async(list:Message[])=>{deleteUndo.offer(await hideMessages(currentUser.uid,list));excludeVoice(activeChat.id,new Set(list.map(message=>message.id)));for(const message of list)if(message.localState)await discardMessage(message.id);setSelectedIds([]);};
  const everyone=async(list:Message[])=>{for(const message of list)await onDeleteMessage(message.id);setSelectedIds([]);};
  const star=async(list:Message[])=>{const add=list.some(message=>!personal.flags[flagId(message.chatId,message.id)]?.starred);for(const message of list)await setMessageFlag(currentUser.uid,message,{starred:add});};
  const beginGesture=(event:React.PointerEvent,message:Message)=>{if(event.pointerType==='mouse'||(event.target as HTMLElement).closest('button,a,input,video,audio'))return;ignoreMessageClick.current=null;gesture.current={id:message.id,x:event.clientX,y:event.clientY,moved:false,timer:setTimeout(()=>{ignoreMessageClick.current=message.id;toggleSelection(message.id);gesture.current=undefined;navigator.vibrate?.(20);},500)};};
  const moveGesture=(event:React.PointerEvent)=>{const value=gesture.current;if(!value)return;const dx=event.clientX-value.x,dy=event.clientY-value.y;if(Math.abs(dx)>12||Math.abs(dy)>12){clearTimeout(value.timer);value.moved=true;}if(Math.abs(dy)<25&&dx>20)(event.currentTarget as HTMLElement).style.transform='translateX('+Math.min(70,dx/2)+'px)';};
  const endGesture=(event:React.PointerEvent,message:Message)=>{const value=gesture.current;(event.currentTarget as HTMLElement).style.transform='';if(value){clearTimeout(value.timer);if(event.clientX-value.x>80&&Math.abs(event.clientY-value.y)<30&&!selectedIds.length){setReplyTarget(message);textareaRef.current?.focus();}}gesture.current=undefined;};
  useEffect(()=>()=>{if(gesture.current)clearTimeout(gesture.current.timer);},[]);
  useEffect(()=>{const listener=(event:KeyboardEvent)=>{if(event.key==='Escape'){setSelectingMessages(false);setSelectedIds([]);setOpenMessageId(null);setShowContact(false);}if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='f'){event.preventDefault();setIsSearchingMessages(true);}};document.addEventListener('keydown',listener);return()=>document.removeEventListener('keydown',listener);},[]);
  const palette=useInterfacePalette();const bubbleDefault=defaultBubble(palette,theme);
  const preferences=usePreferences(currentUser.uid);const [manualMedia,setManualMedia]=useState<Record<string,string>>({});
  const appearance=useAppearance(currentUser.uid,activeChat.id),resolvedMedia=useMediaURLs(messages.filter(message=>!realtime?.media[message.transferId||'']),currentUser.uid);
  const voiceTrack=(message:Message):VoiceTrack=>({key:currentUser.uid+':'+activeChat.id+':'+message.id,uid:currentUser.uid,chatId:activeChat.id,messageId:message.id,src:manualMedia[message.id]||resolvedMedia[message.id]||realtime?.media[message.transferId||'']||(!isPrivateMedia(message.fileUrl)?message.fileUrl||'':''),label:message.senderId===currentUser.uid?'Tú':users.find(user=>user.uid===message.senderId)?.nombre||'Contacto Nexus',photo:users.find(user=>user.uid===message.senderId)?.foto||(message.senderId===currentUser.uid?currentUser.foto:''),expiresAt:message.expiresAt});
  const followingVoice=(id:string)=>{const after=messages.slice(messages.findIndex(message=>message.id===id)+1),stop=after.findIndex(message=>message.type!=='audio'||!!message.deletedAt);return (stop<0?after:after.slice(0,stop)).map(voiceTrack).reduce<VoiceTrack[]>((list,track,index,tracks)=>{if(track.src&&tracks.slice(0,index).every(value=>!!value.src))list.push(track);return list;},[]);};
  useEffect(()=>{invalidateVoice(activeChat.id,new Set(messages.filter(message=>!message.deletedAt&&(!message.expiresAt||message.expiresAt>Date.now())).map(message=>message.id)),new Set(incomingMessages.map(message=>message.id)));},[activeChat.id,incomingMessages.map(message=>message.id+':'+message.deletedAt+':'+message.expiresAt).join('|')]);
  const [showAppearance,setShowAppearance]=useState(false),[presenceNow,setPresenceNow]=useState(Date.now());
  const [clipboardMessage,setClipboardMessage]=useState<Message|null>(null);const chatRoot=useRef<HTMLDivElement>(null);
  const [imageViewer,setImageViewer]=useState<string|null>(null);
  useEffect(()=>{const timer=setInterval(()=>setPresenceNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{const clear=()=>{if(document.visibilityState!=='visible')setTypingStatus(false);};document.addEventListener('visibilitychange',clear);return()=>{document.removeEventListener('visibilitychange',clear);setTypingStatus(false);};},[activeChat.id]);
  const [showCamera,setShowCamera]=useState(false),[showContacts,setShowContacts]=useState(false),[contactSearch,setContactSearch]=useState(''),[audioOptions,setAudioOptions]=useState(false),[pendingFiles,setPendingFiles]=useState<File[]>([]),[fileBusy,setFileBusy]=useState(false);
  const uploadKind=useRef<'document'|'media'|'audio'>('document');
  const [editingPhoto,setEditingPhoto]=useState<File|null>(null);
  const [desktopSticker,setDesktopSticker]=useState<File[]>([]);const stickerInput=useRef<HTMLInputElement>(null);
  const [previewURLs,setPreviewURLs]=useState<string[]>([]);
  useEffect(()=>{const urls=pendingFiles.map(f=>URL.createObjectURL(f));setPreviewURLs(urls);return()=>urls.forEach(URL.revokeObjectURL);},[pendingFiles]);
  useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setShowAttachMenu(false);setAudioOptions(false);setShowContacts(false);}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[]);
  const chooseFiles=(kind:'document'|'media'|'audio')=>{uploadKind.current=kind;const input=fileInputRef.current;if(!input)return;input.accept=kind==='media'?'image/*,video/*':kind==='audio'?'audio/*':'';input.click();setShowAttachMenu(false);setAudioOptions(false);};
  const [showGroupSettings,setShowGroupSettings]=useState(false),[groupSection,setGroupSection]=useState('general'),[reporting,setReporting]=useState(false),[selectingMessages,setSelectingMessages]=useState(false);
  const openGroup=(page='general')=>{setGroupSection(page);setShowGroupSettings(true);};
  const [showStickers,setShowStickers]=useState(false);
  const [recordMode,setRecordMode]=useState<'audio'|'video'|null>(null);
  const [showEvent,setShowEvent]=useState(false),[conversationTool,setConversationTool]=useState<'mute'|'lists'|'temporary'|null>(null);
  const [showPoll,setShowPoll]=useState(false);
  const [pinTarget,setPinTarget]=useState<Message|null>(null);const sharedPins=useSharedPins(activeChat,currentUser.uid);const pinClock=usePinClock([...messages,...sharedPins]);const pinnedInView=Array.from(new Map([...messages,...sharedPins].map(message=>[message.id,message])).values()).filter(message=>messagePinned(message,activeChat,pinClock)&&visibleMessage(message,personal.conversations[activeChat.id],personal.flags));
  const [quickProfile,setQuickProfile]=useState(false);
  useMobileBack(true,onBack,10);
  useMobileBack(showContact,()=>setShowContact(false),40);
  useMobileBack(showGroupSettings,()=>setShowGroupSettings(false),50);
  useEffect(()=>{const info=(event:Event)=>{if((event as CustomEvent).detail===activeChat.id){setContactView('info');setShowContact(true);}};window.addEventListener('nexus:contact-info',info);return()=>window.removeEventListener('nexus:contact-info',info);},[activeChat.id]);
  const [translation,setTranslation]=useState<string|null>(null);
  const [showWriting,setShowWriting]=useState(false);
  const [showFormatting,setShowFormatting]=useState(false);
  const [reactionTarget,setReactionTarget]=useState<string|null>(null),[reactionInfo,setReactionInfo]=useState<string|null>(null);
  const [searchKind,setSearchKind]=useState('all'),[searchDate,setSearchDate]=useState(''),[showLocation,setShowLocation]=useState(false);
  const [captions,setCaptions]=useState<Map<File,string>>(()=>new Map());
  useEffect(()=>{setCaptions(previous=>new Map([...previous].filter(([file])=>pendingFiles.includes(file))));},[pendingFiles]);
  const textareaRef=useRef<HTMLTextAreaElement|null>(null);
  const [inputText,setInputText]=useState(()=>readDraft(currentUser.uid,activeChat.id));
  useEffect(()=>{writeDraft(currentUser.uid,activeChat.id,inputText);},[inputText,currentUser.uid,activeChat.id]);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);const [headerMenuAt,setHeaderMenuAt]=useState({x:0,y:0});const jumpTarget=useRef<string|undefined>(undefined);
  useEffect(()=>{if(!showAttachMenu&&!showChatMenu)return;const close=(event:PointerEvent)=>{if((event.target as HTMLElement).closest('.attachment-panel,[role="menu"],.inbox-submenu-portal,[aria-label="Opciones del chat"],[title="Adjuntar archivo"]'))return;setShowAttachMenu(false);setShowChatMenu(false);};const timer=setTimeout(()=>document.addEventListener('pointerdown',close,true),0);return()=>{clearTimeout(timer);document.removeEventListener('pointerdown',close,true);};},[showAttachMenu,showChatMenu]);
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  useEffect(()=>{if(!isSearchingMessages){setSearchQuery('');setSearchKind('all');setSearchDate('');}},[isSearchingMessages]);

  // Editing & Replying state
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [editingTarget, setEditingTarget] = useState<Message | null>(null);
  const [editingText, setEditingText] = useState('');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // File states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Audio elements state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageAreaRef = useRef<HTMLDivElement | null>(null);

  useMobileBack(showChatMenu||showAttachMenu||showEmojiPicker||isSearchingMessages||selectingMessages||selectedIds.length>0,()=>{setShowChatMenu(false);setShowAttachMenu(false);setShowEmojiPicker(false);setIsSearchingMessages(false);setSelectingMessages(false);setSelectedIds([]);},35);
  const canSend=(activeChat.sendPolicy!=='admins'||!!activeChat.admins?.includes(currentUser.uid))&&(activeChat.kind==='group'||!activeChat.participants.some(uid=>currentUser.privacy?.blockedIds?.includes(uid)));
  const groupAvatar=useMediaURLs(activeChat.photoURL?[{id:activeChat.id,fileUrl:activeChat.photoURL,force:true,fileSize:1}]:[],currentUser.uid);
  const otherUser = (activeChat.kind==='group'||activeChat.kind==='channel') ? {nombre:activeChat.title||'Espacio Nexus',uid:activeChat.id,online:false,foto:groupAvatar[activeChat.id]||activeChat.photoURL||'',bio:activeChat.description||'',username:'',estado:'',lastSeen:0,typing:false,privacy:undefined} : activeChat.participants.length===1?{...currentUser,nombre:currentUser.nombre+' (Tú)'}:users.find(u => u.uid === activeChat.participants.find(p => p !== currentUser.uid));

  useEffect(()=>{const element=messageAreaRef.current;if(!element)return;if(previousHeight.current){element.scrollTop+=element.scrollHeight-previousHeight.current;previousHeight.current=0;}else if(nearBottom||lastScrollCount.current===0)messagesEndRef.current?.scrollIntoView({behavior:lastScrollCount.current?'smooth':'instant'});lastScrollCount.current=messages.length;},[messages.length]);

  // Detener audio y grabación al cambiar de chat o desmontar
  useEffect(() => {
    
  return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeChat.id]);

  // Typing state debouncer
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(preferences.chat.emojiReplacement?replaceEmojiText(e.target.value):e.target.value);
    setTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 2000);
  };

  const revealMessage=(id:string)=>{const element=document.getElementById('message-'+id);if(!element)return false;element.scrollIntoView({behavior:'smooth',block:'center'});element.classList.add('message-highlight');setTimeout(()=>element.classList.remove('message-highlight'),1800);jumpTarget.current=undefined;return true;};
  useEffect(()=>{try{const value=JSON.parse(sessionStorage.getItem('nexus-jump-message')||'null');if(value?.chatId===activeChat.id&&typeof value.messageId==='string'){sessionStorage.removeItem('nexus-jump-message');jumpTarget.current=value.messageId;if(!revealMessage(value.messageId)&&hasOlder&&!loadingOlder)onLoadOlder?.();}}catch{sessionStorage.removeItem('nexus-jump-message');}},[activeChat.id,messages.length]);
  useEffect(()=>{const jump=(event:Event)=>{jumpTarget.current=(event as CustomEvent).detail;if(!revealMessage(jumpTarget.current!)&&hasOlder&&!loadingOlder)onLoadOlder?.();};window.addEventListener('nexus:jump-message',jump);return()=>window.removeEventListener('nexus:jump-message',jump);},[messages.length,hasOlder,loadingOlder]);
  useEffect(()=>{if(!jumpTarget.current||revealMessage(jumpTarget.current)||loadingOlder)return;if(hasOlder)onLoadOlder?.();else{jumpTarget.current=undefined;setUploadError('El mensaje ya no está disponible en tu historial.');}},[messages.length,hasOlder,loadingOlder]);
  const copyPicture=async(url:string)=>{try{await copyImage(url,currentUser.uid);}catch(error){setUploadError(error instanceof Error?error.message:'No se pudo copiar la imagen.');}};
  useEffect(()=>{const paste=(event:ClipboardEvent)=>{const target=event.target as HTMLElement;if(!canSend||!chatRoot.current?.contains(target)||target.closest('[role=dialog]')||target.closest('input,textarea')&&target!==textareaRef.current)return;const files=pastedFiles(event.clipboardData);if(!files.length)return;event.preventDefault();if(files.length>10){setUploadError('Selecciona hasta diez archivos por envío.');return;}uploadKind.current='media';setPendingFiles(files);setUploadError('');};const copy=(event:KeyboardEvent)=>{if(imageViewer)return;if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='c'||event.altKey)return;const target=event.target as HTMLElement;if(target.closest('input,textarea,[contenteditable=true]')||window.getSelection()?.toString())return;const url=(clipboardMessage&&['image','sticker'].includes(clipboardMessage.type)?manualMedia[clipboardMessage.id]||resolvedMedia[clipboardMessage.id]||realtime?.media[clipboardMessage.transferId||'']||clipboardMessage.fileUrl:undefined);if(!url||!imageViewer&&!chatRoot.current?.contains(target))return;event.preventDefault();copyPicture(url);};document.addEventListener('paste',paste);document.addEventListener('keydown',copy);return()=>{document.removeEventListener('paste',paste);document.removeEventListener('keydown',copy);};},[canSend,imageViewer,clipboardMessage,resolvedMedia,manualMedia]);
  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      setRecordingSeconds(0);
    }

    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  const handleSend = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);
    setUploadError('');
    try {
    if (editingTarget) {
      if (!editingText.trim()) return;
      if(editingTarget.type==='poll')await editPollQuestion(activeChat,currentUser.uid,editingTarget.id,editingText);else await onEditMessage(editingTarget.id, editingText.trim());
      setEditingTarget(null);
      setEditingText('');
    } else {
      if (!inputText.trim()) return;
      const contentToSend = preferences.chat.emojiReplacement?replaceEmojiText(inputText.trim()):inputText.trim();setInputText('');
      setTypingStatus(false);
      
      await onSendMessage(
        contentToSend,
        'text',
        undefined,
        replyTarget
          ? {
              id: replyTarget.id,
              senderName:
                replyTarget.senderId === currentUser.uid
                  ? 'Tú'
                  : activeChat.aliases?.[replyTarget.senderId]||users.find(u=>u.uid===replyTarget.senderId)?.nombre||'Contacto',
              content: replyTarget.content,
              type: replyTarget.type
            }
          : undefined
      );
      
      setReplyTarget(null);
    }
    } catch (error) { if(!editingTarget)setInputText(current=>inputText+(current?'\n'+current:''));setUploadError('No se pudo enviar. Tu mensaje se conserva para reintentar.'); }
    finally { sendingRef.current = false; setIsSending(false); if(!showEmojiPicker)textareaRef.current?.focus({preventScroll:true}); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.nativeEvent.isComposing) {const token=({b:'*',i:'_',s:'~'} as Record<string,string>)[e.key.toLowerCase()];if(token&&(e.key.toLowerCase()!=='s'||e.shiftKey)){e.preventDefault();format(token);return;}}
    if ((mobileOptions||preferences.chat.enterSend) && e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReactionClick = async (messageId: string, emoji: string) => {
    await onReactMessage(messageId, emoji);
  };

  const sendMedia = async(file:File,type:Message['type'],caption='')=>{
    if(!realtime)throw new Error('La conexión directa no está disponible.');
    if(type==='image')file=await preparePhoto(file,preferences.chat.uploadQuality);
    const attachment={...await realtime.sendFile(activeChat,file),...(type==='audio'&&/^nota-/.test(file.name)?{voiceNote:true}:{})};
    await onSendMessage(caption.trim()||(attachment.voiceNote?'Mensaje de voz':file.name),type,attachment,replyTarget?{id:replyTarget.id,senderName:replyTarget.senderId===currentUser.uid?'Tú':users.find(user=>user.uid===replyTarget.senderId)?.nombre||'Contacto',content:replyTarget.content,type:replyTarget.type}:undefined);
    setReplyTarget(null);
  };
  const handleFileChange=async(e:React.ChangeEvent<HTMLInputElement>,mediaType:Message['type'])=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;setShowAttachMenu(false);setUploadError('');
    try{await sendMedia(file,mediaType);}catch(e){setUploadError(e instanceof Error?e.message:String(e));}
  };
  const format=(before:string,after=before)=>{const field=textareaRef.current;const value=editingTarget?editingText:inputText;const start=field?.selectionStart??value.length;const end=field?.selectionEnd??value.length;const next=value.slice(0,start)+before+value.slice(start,end)+after+value.slice(end);if(editingTarget)setEditingText(next);else setInputText(next);requestAnimationFrame(()=>{field?.focus();field?.setSelectionRange(start+before.length,end+before.length);});};

  const getSenderName = (senderId: string) => {
    if (senderId === currentUser.uid) return 'Tú';
    return otherUser?.nombre || 'Contacto';
  };

  // Group messages by Date
  const groupMessagesByDate = (msgList: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    msgList.forEach(m => {
      const date = new Date(m.timestamp);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(m);
    });
    return groups;
  };

  const getFriendlyDateHeader = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    
    return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Audio Controller
  const handlePlayAudio = async (msgId: string, url?: string) => {
    if (!url) return;

    if (playingAudioId === msgId) {
      const currentAudio = audioRefs.current[msgId];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      setPlayingAudioId(null);
      return;
    }

    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    try {
      const audio = new Audio(url);
      audioRefs.current[msgId] = audio;
      setPlayingAudioId(msgId);
      await audio.play();
      audio.onended = () => setPlayingAudioId(null);
    } catch (err) {
      console.error('Audio playback error:', err);
      setPlayingAudioId(null);
    }
  };

  const searchableMessages=messages.filter(message=>!searchDate||new Date(message.timestamp).toLocaleDateString('en-CA')===new Date(searchDate+'T00:00:00').toLocaleDateString('en-CA'));
  const conversationAction=(action:string)=>{if(action==='restrict'){window.dispatchEvent(new Event(restrictEvent));return;}if(action==='search'){setShowContact(false);setIsSearchingMessages(true);return;}if(action==='mute'||action==='lists'||action==='temporary'){setConversationTool(action);return;}if(action==='appearance'){setShowAppearance(true);return;}if(action==='report'){setReporting(true);return;}const perform=async()=>{if(action==='favorite')await changeConversation(currentUser.uid,activeChat.id,{favorite:!personal.conversations[activeChat.id]?.favorite});if(action==='export')await exportConversation(activeChat,currentUser,users,personal);if(action==='clear'&&confirm('¿Vaciar solo tu historial de esta conversación?'))await onClearChatHistory(activeChat.id);if(action==='delete'&&confirm('¿Eliminar esta conversación solo para ti?')){await clearForMe(currentUser.uid,activeChat,true);onBack();}if(action==='block'&&otherUser?.uid){const privacy=normalizePrivacy(currentUser.privacy),blocked=privacy.blockedIds.includes(otherUser.uid);if(!confirm((blocked?'¿Desbloquear a ':'¿Bloquear a ')+otherUser.nombre+'?'))return;const updated=await savePrivacy(currentUser,{...privacy,blockedIds:blocked?privacy.blockedIds.filter(id=>id!==otherUser.uid):[...privacy.blockedIds,otherUser.uid]});window.dispatchEvent(new CustomEvent('nexus:profile-update',{detail:updated}));}};perform().catch(error=>setUploadError(error.message||'No se pudo completar la operación.'));};
  const messageGroups = groupMessagesByDate(
    searchQuery.trim() 
      ? searchableMessages.filter(m => (m.content+' '+(m.fileName||'')).toLowerCase().includes(searchQuery.toLowerCase()) && (searchKind==='all'||m.type===searchKind||searchKind==='video'&&m.type==='video-note'||(searchKind==='links'&&/https?:\/\//.test(m.content)))) 
      : searchableMessages.filter(m=>searchKind==='all'||m.type===searchKind||searchKind==='video'&&m.type==='video-note'||(searchKind==='links'&&/https?:\/\//.test(m.content)))
  );

  const restriction=<AppLock uid={currentUser.uid+':chat:'+activeChat.id} eventName={restrictEvent} onLock={setRestricted}/>;
  return (<>
    {restriction}
    <div hidden={restricted} ref={chatRoot} onDragEnter={event=>{if(event.dataTransfer.types.includes('Files')){event.preventDefault();dragDepth.current++;setDragging(true);}}} onDragOver={event=>{if(event.dataTransfer.types.includes('Files'))event.preventDefault();}} onDragLeave={()=>{dragDepth.current=Math.max(0,dragDepth.current-1);if(!dragDepth.current)setDragging(false);}} onDrop={event=>{if(!event.dataTransfer.files.length)return;event.preventDefault();dragDepth.current=0;setDragging(false);if(event.dataTransfer.files.length>10){setUploadError('Selecciona hasta diez archivos.');return;}uploadKind.current='media';setPendingFiles(Array.from(event.dataTransfer.files));}} style={{'--own-bubble':appearance.bubble||bubbleDefault,'--own-ink':contrastColor(appearance.bubble||bubbleDefault),'--mic-color':appearance.microphoneColor||bubbleDefault,'--mic-ink':contrastColor(appearance.microphoneColor||bubbleDefault)} as React.CSSProperties} data-doodles={appearance.doodles!==false} data-bubble={appearance.bubbleShape||'soft'} data-microphone={appearance.microphone||'round'} className={`nexus-chat-window flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden relative ${theme === 'dark' ? 'bg-[#101218]' : 'bg-[#efeae2]'}`}>
      
      {dragging&&<div className="chat-drop-overlay"><Paperclip size={42}/><strong>Suelta los archivos para enviarlos</strong></div>}
      {(selectedIds.length>0||selectingMessages)&&<div className="selection-toolbar"><button aria-label="Cancelar selección" onClick={()=>{setSelectedIds([]);setSelectingMessages(false);}}><X/></button><strong>{selectedIds.length} seleccionados</strong><button title="Copiar seleccionados" disabled={!selectedIds.length} onClick={()=>copyText(selected)}><Copy/></button><button title="Destacar seleccionados" disabled={!selectedIds.length} onClick={()=>star(selected).catch(error=>setUploadError(error.message))}><Star/></button><button title="Reenviar seleccionados" disabled={!selectedIds.length||selected.some(message=>!!message.localState)} onClick={()=>setForwarding(selected)}><Forward/></button><button title="Eliminar seleccionados" disabled={!selectedIds.length} onClick={()=>setDeleting(selected)}><Trash2/></button></div>}
      {/* ---------------- HEADER ----------------- */}
      <header hidden={selectedIds.length>0||selectingMessages} className={`px-4 h-[60px] flex items-center justify-between shrink-0 select-none z-10 shadow-sm ${theme === 'dark' ? 'bg-[#232732]' : 'bg-[#f0f2f5]'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <button 
            aria-label="Volver a conversaciones"
            onClick={onBack}
            className={`p-1 rounded-full workspace-back-button cursor-pointer ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button className="contact-avatar-trigger relative shrink-0" aria-label="Ver foto del contacto" onClick={()=>setQuickProfile(true)}>
            <img 
              src={avatar(otherUser?.foto)} 
              alt="Foto del contacto" 
              className="w-10 h-10 rounded-full border bg-white object-cover"
              referrerPolicy="no-referrer"
            />
            {otherUser?.online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-indigo-500 border-2 border-white dark:border-[#232732] rounded-full" />
            )}
          </button>

          <button className="min-w-0 leading-tight contact-title-trigger" onClick={()=>setShowContact(true)}>
            <h2 className={`font-semibold text-sm truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              {otherUser?.nombre || 'Contacto Nexus'}
            </h2>
            <p className={`text-[11px] truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {activeChat.kind==='channel'?'Canal':activeChat.participants.length===1?'Envía mensajes a este mismo usuario':activeChat.kind==='group' ? `${activeChat.participants.length} miembros` : otherUser?.online ? (
                (activeChat.typing?.[otherUser.uid]||0)>presenceNow ? (
                  <span className="text-indigo-400 font-medium animate-pulse">escribiendo...</span>
                ) : 'En línea'
              ) : otherUser?.lastSeen ? (
                lastSeenLabel(otherUser.lastSeen,presenceNow)
              ) : ''}
            </p>
          </button>
        </div>

        <div className={`flex items-center gap-2 relative ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {activeChat.kind!=='channel'&&activeChat.participants.some(uid=>uid!==currentUser.uid)&&<CallButtons chat={activeChat} display="calls"/>}
          <button 
            onClick={() => setIsSearchingMessages(!isSearchingMessages)}
            className={`p-2 rounded-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all ${isSearchingMessages ? 'bg-black/15' : ''}`}
            title="Buscar mensajes"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          <button 
            onClick={event => {const rect=event.currentTarget.getBoundingClientRect();setHeaderMenuAt({x:rect.right-250,y:rect.bottom+5});setShowChatMenu(!showChatMenu);}}
            className="p-2 rounded-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
            title="Opciones del chat" aria-label="Opciones del chat"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>

          {showChatMenu && (
            <>
              
              <FloatingMenu at={headerMenuAt} onClose={()=>setShowChatMenu(false)} label="Opciones del chat">
 {activeChat.kind==='channel'?<><button onClick={()=>{setShowContact(true);setShowChatMenu(false);}}><Info size={17}/>Info. del canal</button><button onClick={()=>{setIsSearchingMessages(true);setShowChatMenu(false);}}><Search size={17}/>Buscar</button><button onClick={()=>{setConversationTool('mute');setShowChatMenu(false);}}><BellOff size={17}/>Notificaciones del canal</button><button onClick={()=>{setReporting(true);setShowChatMenu(false);}}><Flag size={17}/>Reportar canal</button>{!mobileOptions&&<button onClick={()=>{setShowChatMenu(false);onBack();}}><X size={17}/>Cerrar canal</button>}</>:mobileOptions?<MobileChatOptions key={activeChat.id} group={activeChat.kind==='group'} canAdd={!!(activeChat.admins?.includes(currentUser.uid)||activeChat.membersCanAdd)} canEdit={activeChat.kind!=='group'||!!(activeChat.admins?.includes(currentUser.uid)||activeChat.membersCanEdit)} muted={(personal.conversations[activeChat.id]?.mutedUntil||0)>Date.now()} onAction={action=>{setShowChatMenu(false);if(action==='info'||action==='files'){setContactView(action==='files'?'files':'info');setShowContact(true);}else if(action==='search')setIsSearchingMessages(true);else if(action==='members'||action==='leave')openGroup(action);else if(action==='mute'){if((personal.conversations[activeChat.id]?.mutedUntil||0)>Date.now())changeConversation(currentUser.uid,activeChat.id,{mutedUntil:0}).catch(error=>setUploadError(error.message));else setConversationTool('mute');}else if(action==='temporary')setConversationTool('temporary');else if(action==='appearance')setShowAppearance(true);else if(action==='report')setReporting(true);else conversationAction(action);}}/>:<>{(activeChat.kind==='group'&&(activeChat.admins?.includes(currentUser.uid)||activeChat.membersCanAdd))&&<button onClick={()=>{openGroup('members');setShowChatMenu(false);}}><UserPlus size={17}/>Añadir miembro</button>}
 <button onClick={()=>{setContactView('info');setShowContact(true);setShowChatMenu(false);}}><Info size={17}/>{activeChat.kind==='group'?'Info. del grupo':'Info. del contacto'}</button>
 <button onClick={()=>{setIsSearchingMessages(true);setShowChatMenu(false);}}><Search size={17}/>Buscar</button>
 <button onClick={()=>{setSelectingMessages(true);setSelectedIds([]);setShowChatMenu(false);}}><CheckSquare size={17}/>Seleccionar mensajes</button>
 <button onClick={()=>{if((personal.conversations[activeChat.id]?.mutedUntil||0)>Date.now())changeConversation(currentUser.uid,activeChat.id,{mutedUntil:0}).catch(error=>setUploadError(error.message));else setConversationTool('mute');setShowChatMenu(false);}}><BellOff size={17}/>{(personal.conversations[activeChat.id]?.mutedUntil||0)>Date.now()?'Desactivar silencio de notificaciones':'Silenciar notificaciones'}</button>
 {(activeChat.kind!=='group'||activeChat.admins?.includes(currentUser.uid)||activeChat.kind==='group'&&activeChat.membersCanEdit)&&<button onClick={()=>{setConversationTool('temporary');setShowChatMenu(false);}}><Clock size={17}/>Mensajes temporales</button>}
 <button onClick={()=>{conversationAction('restrict');setShowChatMenu(false);}}><Lock size={17}/>Restringir chat</button>
 <button onClick={()=>{setShowAppearance(true);setShowChatMenu(false);}}><Type size={17}/>Estilo del chat</button>
 <button onClick={()=>{conversationAction('favorite');setShowChatMenu(false);}}><Star size={17}/>{personal.conversations[activeChat.id]?.favorite?'Quitar de favoritos':'Añadir a favoritos'}</button>
 <button onClick={()=>{setConversationTool('lists');setShowChatMenu(false);}}><ListPlus size={17}/>Añadir a la lista</button>
 <button onClick={()=>{conversationAction('export');setShowChatMenu(false);}}><Download size={17}/>Exportar chat</button>
 <button onClick={()=>{setShowChatMenu(false);onBack();}}><X size={17}/>Cerrar chat</button>
 <button onClick={()=>{conversationAction('clear');setShowChatMenu(false);}}><Trash2 size={17}/>Vaciar chat</button>
 {activeChat.kind==='group'?<button onClick={()=>{openGroup('leave');setShowChatMenu(false);}}><LogOut size={17}/>Salir del grupo</button>:otherUser?.uid!==currentUser.uid&&<button onClick={()=>{conversationAction('block');setShowChatMenu(false);}}><Shield size={17}/>{currentUser.privacy?.blockedIds?.includes(otherUser?.uid||'')?'Desbloquear a ':'Bloquear a '}{otherUser?.nombre||'este contacto'}</button>}
 <button onClick={()=>{setReporting(true);setShowChatMenu(false);}}><Flag size={17}/>{activeChat.kind==='group'?'Reportar grupo':'Reportar a '+(otherUser?.nombre||'este contacto')}</button>
 {activeChat.kind!=='group'&&<button onClick={()=>{conversationAction('delete');setShowChatMenu(false);}}><Trash2 size={17}/>Eliminar chat</button>}
 </>}</FloatingMenu>
            </>
          )}
        </div>
      </header>

      {/* ----------------- SEARCH ----------------- */}
      {isSearchingMessages && (
        <div className={`p-2 shrink-0 border-b flex items-center justify-between gap-3 ${theme === 'dark' ? 'bg-[#1a1e27] border-gray-800' : 'bg-gray-100 border-gray-250'}`}>
          <div className="flex items-center gap-2 flex-1 px-3 py-1 bg-white dark:bg-[#232732] rounded-md text-xs.">
            <Search className="w-4 h-4 opacity-50" />
            <input 
              type="text" 
              aria-label="Buscar en esta conversación" placeholder="Buscar en esta conversación..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs"
            />
            {searchQuery && (
              <button aria-label="Borrar búsqueda" onClick={() => setSearchQuery('')} className="p-0.5 rounded-full hover:bg-black/10">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <label className="chat-date-search" title="Buscar por fecha"><Calendar size={17}/><input type="date" aria-label="Buscar por fecha" value={searchDate} onChange={event=>setSearchDate(event.target.value)}/></label><select aria-label="Tipo de resultado" value={searchKind} onChange={e=>setSearchKind(e.target.value)}><option value="all">Todo</option><option value="links">Enlaces</option><option value="document">Documentos</option><option value="image">Fotos</option><option value="video">Videos</option><option value="audio">Audio</option><option value="poll">Encuestas</option><option value="sticker">Stickers</option><option value="contact">Contactos</option></select>
          <button 
            onClick={() => {
              setSearchKind('all');setSearchDate('');
              setIsSearchingMessages(false);
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-indigo-500 pr-2 hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {isSearchingMessages&&<div className="chat-search-scope"><span>{Object.values(messageGroups).flat().length} resultados en el historial cargado</span>{hasOlder&&<button disabled={loadingOlder} onClick={onLoadOlder}>{loadingOlder?'Cargando…':'Buscar también en mensajes anteriores'}</button>}</div>}
      {historyError&&<div className="history-load-error" role="alert"><span>{historyError}</span><button onClick={onRetryHistory}>Reintentar</button></div>}
      {pinnedInView.length>0&&<div className="pinned-messages"><Pin size={16}/><span>Mensajes fijados</span>{pinnedInView.map(m=><button key={m.id} onClick={()=>window.dispatchEvent(new CustomEvent('nexus:jump-message',{detail:m.id}))}>{m.content.slice(0,70)}</button>)}</div>}
      {/* ----------------- CHAT BODY ----------------- */}
      <div 
        ref={messageAreaRef} onScroll={event=>{const element=event.currentTarget;setNearBottom(element.scrollHeight-element.scrollTop-element.clientHeight<120);}}
        style={{backgroundImage:[appearance.doodles!==false?'url("/chat-doodles.svg")':'',appearance.background?`linear-gradient(#10141e25,#10141e25),url("${appearance.background}")`:''].filter(Boolean).join(',')||'none',backgroundSize:appearance.doodles!==false?'280px 280px,cover,cover':'cover',backgroundPosition:'center',backgroundRepeat:appearance.doodles!==false?'repeat,no-repeat,no-repeat':'no-repeat'}}
        className={`chat-history flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 lg:px-8 py-4 space-y-4 relative ${theme === 'dark' ? 'nexus-bg-dark' : 'nexus-bg-light'} nexus-scrollbar`}
      >
        {uploadError && <div role="alert" className="p-3 bg-red-900 text-white text-sm">{uploadError}<button className="ml-3 underline" onClick={() => setUploadError('')}>Cerrar</button></div>}
        {uploadProgress !== null && recordMode!=='audio' && (
          <div className="sticky top-2 z-20 mx-auto max-w-xs p-3 rounded-lg bg-indigo-500 text-white shadow-lg flex items-center gap-3 text-xs font-medium animate-bounce justify-between">
            <span className="flex items-center gap-1.5 shrink-0">Subiendo archivo ({uploadProgress}%)</span>
            <div className="flex-1 h-1.5 max-w-[80px] bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="h-32 flex items-center justify-center">
            <span className={`text-[11px] px-3 py-1.5 rounded-lg shadow-sm font-medium ${theme === 'dark' ? 'bg-[#1a1e27] text-[#727cf5]' : 'bg-[#ffeec1] text-amber-900'}`}>
              Este puede ser el comienzo de una buena conversación.
            </span>
          </div>
        )}

        {hasOlder&&<button className="load-older" disabled={loadingOlder} onClick={()=>{previousHeight.current=messageAreaRef.current?.scrollHeight||0;onLoadOlder?.();}}>{loadingOlder?'Cargando mensajes…':'Cargar mensajes anteriores'}</button>}
        {Object.keys(messageGroups).map(dateStr => (
          <div key={dateStr} className="space-y-3">
            <div className="flex justify-center sticky top-0 z-10 py-1.5 select-none">
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-md shadow-sm border ${theme === 'dark' ? 'bg-[#1a1e27] border-gray-800 text-gray-400' : 'bg-[#e1f3ff] border-[#bfe1f6] text-[#2a4e6c]'}`}>
                {getFriendlyDateHeader(dateStr)}
              </span>
            </div>

            {messageGroups[dateStr].map((msg,index) => {
              const isMine = msg.senderId === currentUser.uid;
              const starred=!!personal.flags[flagId(msg.chatId,msg.id)]?.starred;
              const mediaURL=manualMedia[msg.id]||safeMediaURL(resolvedMedia[msg.id]||realtime?.media[msg.transferId||'']||msg.fileUrl);
              const hasReaction = msg.reactions && Object.keys(msg.reactions).length > 0;
              const isDeleted = msg.content === '🚫 Este mensaje fue eliminado';

              return (
                <div 
                  key={msg.id}
                  id={`message-${msg.id}`} data-run={index>0&&messageGroups[dateStr][index-1].senderId===msg.senderId?'same':'first'} data-selected={selectedIds.includes(msg.id)} onContextMenu={event=>{event.preventDefault();event.stopPropagation();openMenu(msg,event.clientX,event.clientY);}} onPointerDown={event=>beginGesture(event,msg)} onPointerMove={moveGesture} onPointerUp={event=>endGesture(event,msg)} onPointerCancel={event=>{if(gesture.current)clearTimeout(gesture.current.timer);gesture.current=undefined;event.currentTarget.style.transform='';}} onClick={event=>{if(ignoreMessageClick.current===msg.id){ignoreMessageClick.current=null;event.preventDefault();event.stopPropagation();return;}if((selectedIds.length||selectingMessages)&&!(event.target as HTMLElement).closest('button,a,input,video,audio'))toggleSelection(msg.id);}}
                  className={`flex flex-col group/msg ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div data-mine={isMine} className="message-bubble max-w-[88%] sm:max-w-[80%] xl:max-w-[70%] min-w-0 relative leading-tight">
                    
                    {!isDeleted && (
                      <div className={`hover-reactions absolute top-[-30px] z-20 flex items-center gap-1 bg-white dark:bg-[#233138] border dark:border-gray-700 p-0.5 rounded-full shadow-md opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 delay-100 ${isMine ? 'right-0' : 'left-0'}`}>
                        {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => handleReactionClick(msg.id, emoji)}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-transform text-xs hover:scale-130 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className={`message-content p-2.5 rounded-lg shadow-sm border relative select-text transition-all ${
                      isMine 
                        ? (theme === 'dark' ? 'bg-[#343b62] text-gray-100 border-none' : 'bg-[#e2e6f1] text-gray-950 border-none') 
                        : (theme === 'dark' ? 'bg-[#232732] text-gray-100 border-none' : 'bg-white text-gray-950 border-[#e1e5e8]')
                    }`}>

                      {msg.replyTo && (
                        <div className={`border-l-4 rounded-r p-2 mb-2 text-xs select-none max-w-full truncate ${
                          isMine 
                            ? (theme === 'dark' ? 'border-[#727cf5] bg-[#2c3151]/60' : 'border-[#727cf5] bg-[#d5dceb]/60')
                            : (theme === 'dark' ? 'border-sky-500 bg-sky-950/20' : 'border-sky-500 bg-sky-50/70')
                        }`}>
                          <div className="font-semibold text-indigo-500 truncate">{msg.replyTo.senderName}</div>
                          <div className="opacity-70 truncate text-[11px]">{msg.replyTo.content}</div>
                        </div>
                      )}

                      <div className="text-sm break-words pr-8">{(activeChat.kind==='group'&&msg.senderId!==currentUser.uid)&&<small className="group-sender">{activeChat.aliases?.[msg.senderId]||users.find(u=>u.uid===msg.senderId)?.nombre||'Miembro'}</small>}{msg.forwarded&&<small className="forwarded-label"><Forward size={13}/>{(msg.forwardCount||0)>=5?'Reenviado muchas veces':'Reenviado'}</small>}
                        
                        {msg.type === 'text' && (
                          <span className={isDeleted ? 'italic text-gray-400 opacity-60' : ''}><RichText text={msg.content}/></span>
                        )}

                        
                        {msg.type==='contact'&&msg.contact&&<button className="shared-contact-card" onClick={()=>onOpenContact?.(msg.contact!.uid)}><UserRound size={30}/><span><strong>{msg.contact.name}</strong><small>@{msg.contact.username}</small><small>Abrir conversación</small></span></button>}
                        {msg.locationShare&&<LiveLocationCard message={msg} uid={currentUser.uid}/>}
                        {msg.type==='poll'&&<PollCard message={msg} userId={currentUser.uid} users={users}/>}
                        {['image','sticker','video','video-note','document'].includes(msg.type)&&<AttachmentCard message={msg} url={mediaURL} onOpen={()=>{setClipboardMessage(msg);setImageViewer(msg.id);}}/>}
                        {['image','video'].includes(msg.type)&&msg.content&&msg.content!==msg.fileName&&<div className="media-caption"><RichText text={msg.content}/></div>}
                        {msg.type === 'audio'&&(desktopWeb&&!msg.voiceNote?<DesktopFileAudio track={voiceTrack(msg)} following={followingVoice(msg.id)}/>:<AudioPlayer src={mediaURL||''} track={voiceTrack(msg)} following={followingVoice(msg.id)}/>)}
                        
                        {msg.transferId&&!msg.fileUrl&&!realtime?.media[msg.transferId]&&<small>Archivo directo: disponible en los dispositivos que completaron la transferencia.</small>}

                      </div>

                      <div className="flex items-center justify-end gap-1 select-none pt-1">
                        {starred&&<Star size={11} className="starred-indicator"/>}{msg.localState==='failed'&&msg.localError&&<span className="outbox-error-reason" role="alert">{msg.localError}</span>}{msg.localState==='failed'&&<button onClick={()=>retryMessage(msg.id).catch(error=>setUploadError(error.message))} className="retry-message">Reintentar</button>}
                        {msg.edited && (
                          <span className={`text-[9px] uppercase tracking-wider opacity-60 font-semibold pr-1`}>editado</span>
                        )}
                        <span className={`text-[9px] text-right font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        {isMine && !isDeleted && (
                          <span className="shrink-0 inline-block">
                            <MessageTick message={msg} chat={activeChat} readAllowed={canReadReceipt(activeChat,currentUser,users)}/>
                          </span>
                        )}
                      </div>

                      {!isDeleted && (
                        <div className="message-actions absolute right-1 top-1">
                          <button aria-label="Opciones del mensaje" title="Opciones del mensaje" aria-expanded={openMessageId === msg.id} onClick={event=>{const rect=event.currentTarget.getBoundingClientRect();if(openMessageId===msg.id)setOpenMessageId(null);else openMenu(msg,rect.right-250,rect.bottom+5);}} className="message-menu-trigger"><MoreVertical size={16} /></button>
                          {openMessageId === msg.id && <>
                            <FloatingMenu at={menuAt} onClose={()=>setOpenMessageId(null)}>
                              <div className="message-menu-emojis">{['👍','❤️','😂','😮','😢','🙏'].map(emoji => <button key={emoji} aria-label={`Reaccionar ${emoji}`} onClick={() => {handleReactionClick(msg.id,emoji);setOpenMessageId(null);}}>{emoji}</button>)}</div>
                              <button onClick={() => {setReplyTarget(msg);setOpenMessageId(null);}}><CornerUpLeft size={17} />Responder</button>
                              {isMine && !msg.sealed && !msg.localState && ['text','poll'].includes(msg.type) && Date.now()-(msg.serverSentAt?.toMillis?.()||msg.timestamp)<=15*60*1000 && <button onClick={() => {setEditingTarget(msg);setEditingText(msg.poll?.question||msg.content);setOpenMessageId(null);}}><Edit3 size={17} />{msg.type==='poll'?'Editar pregunta':'Editar mensaje'}</button>}
<button onClick={()=>{if(['image','sticker'].includes(msg.type)&&mediaURL)copyPicture(mediaURL);else copyText([msg]);setOpenMessageId(null);}}><Copy size={17}/>{['image','sticker'].includes(msg.type)?'Copiar imagen':'Copiar'}</button><button disabled={!!msg.localState} onClick={()=>{setForwarding([msg]);setOpenMessageId(null);}}><Forward size={17}/>Reenviar</button>{msg.fileUrl&&['audio','image','sticker','video','video-note','document'].includes(msg.type)&&<button onClick={()=>{downloadMedia(msg.fileUrl!,msg.fileName||'nota-de-voz.webm',msg.fileSize).catch(error=>setUploadError(error.message));setOpenMessageId(null);}}><Download size={17}/>{msg.type==='audio'?'Descargar audio':'Guardar archivo'}</button>}<button onClick={()=>{star([msg]).catch(error=>setUploadError(error.message));setOpenMessageId(null);}}><Star size={17}/>{starred?'Quitar de destacados':'Destacar mensaje'}</button><button onClick={()=>{setSelectedIds([msg.id]);setOpenMessageId(null);}}><CheckSquare size={17}/>Seleccionar</button>{isMine&&<button onClick={()=>{setInformation(msg);setOpenMessageId(null);}}><Info size={17}/>Información</button>}
                              {!mobileOptions&&<button onClick={()=>{localStorage.setItem('nexus-ai-draft:'+currentUser.uid,'Ayúdame a entender este mensaje:\n'+msg.content);setOpenMessageId(null);window.dispatchEvent(new CustomEvent('nexus:navigate',{detail:'assistant'}));}}><Sparkles size={17}/>Pregúntale a Nexus AI</button>}
                              {((activeChat.kind!=='group'&&activeChat.kind!=='channel')||(activeChat.kind==='group'&&activeChat.membersCanEdit)||activeChat.admins?.includes(currentUser.uid))&&<button onClick={()=>{if(messagePinned(msg,activeChat))setMessagePin(activeChat.id,msg.id,0).catch(e=>setUploadError(e.message));else setPinTarget(msg);setOpenMessageId(null);}}><Pin size={17}/>{messagePinned(msg,activeChat)?'Desfijar mensaje':'Fijar mensaje'}</button>}
                              
                              <button className="message-delete" onClick={()=>{setDeleting([msg]);setOpenMessageId(null);}}><Trash2 size={17}/>Eliminar</button>
                            </FloatingMenu>
                          </>}
                        </div>
                      )}

                    </div>

                    {hasReaction&&<button className="message-reaction-summary" aria-label="Ver reacciones del mensaje" onClick={()=>setReactionInfo(msg.id)}>{[...new Set(Object.values(msg.reactions||{}))].slice(0,3).map(emoji=><span key={emoji}>{emoji}</span>)}{Object.keys(msg.reactions||{}).length>1&&<small>{Object.keys(msg.reactions||{}).length}</small>}</button>}

                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!nearBottom&&<button className="scroll-to-latest" aria-label="Ir al último mensaje" onClick={()=>{messagesEndRef.current?.scrollIntoView({behavior:'smooth'});setNearBottom(true);}}><ChevronDown/></button>}
      {deleteUndo.notice}
      {forwarding&&<ForwardDialog messages={forwarding} chats={allChats.length?allChats:[activeChat]} user={currentUser} users={users} cached={Object.fromEntries(messages.map(message=>[message.id,manualMedia[message.id]||resolvedMedia[message.id]||realtime?.media[message.transferId||'']||'']))} onClose={()=>{setForwarding(null);setSelectedIds([]);}}/>}
      {deleting&&<DeleteMessagesDialog messages={deleting} uid={currentUser.uid} onMine={()=>mine(deleting)} onEveryone={()=>everyone(deleting)} onClose={()=>setDeleting(null)}/>}
      {information&&<MessageInformation message={messages.find(message=>message.id===information.id)||information} chat={activeChat} user={currentUser} users={users} onClose={()=>setInformation(null)}/>}
      {pinTarget&&<PinMessageDialog chat={activeChat} message={pinTarget} onClose={()=>setPinTarget(null)}/>}
      {quickProfile&&<ProfileQuickView chat={activeChat} user={currentUser} person={otherUser} onClose={()=>setQuickProfile(false)} onMessage={()=>setQuickProfile(false)} onInfo={()=>{setQuickProfile(false);setContactView('info');setShowContact(true);}}/>}
      {showContact&&activeChat.kind==='channel'&&<ChannelDetails chat={activeChat} user={currentUser} onClose={()=>setShowContact(false)} onReport={()=>{setShowContact(false);setReporting(true);}} onLeave={()=>{setShowContact(false);onBack();}}/>}
      {showContact&&activeChat.kind!=='channel'&&<ContactDetails initialView={contactView} chat={activeChat} user={currentUser} person={otherUser} users={users} messages={messages} onClose={()=>setShowContact(false)} onAction={conversationAction} onGroupSettings={openGroup} onClear={()=>{if(confirm('¿Vaciar solo tu historial de esta conversación?'))onClearChatHistory(activeChat.id).then(()=>setShowContact(false)).catch(error=>setUploadError(error.message));}}/>}
      {/* ----------------- EDIT BAR ----------------- */}
      {editingTarget && (
        <div className={`chat-context px-4 py-2.5 flex items-center justify-between border-t ${theme === 'dark' ? 'bg-[#222733] border-gray-800' : 'bg-gray-100 border-gray-250'}`}>
          <div className="text-xs">
            <span className="text-[#727cf5] font-semibold flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Editando mensaje</span>
            <p className="opacity-75 max-w-sm truncate mt-0.5">{editingTarget.content}</p>
          </div>
          <button 
            onClick={() => {
              setEditingTarget(null);
              setEditingText('');
            }}
            className="p-1 text-red-500 border border-red-500/20 hover:bg-red-500/10 rounded-lg text-xs"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ----------------- REPLY BAR ----------------- */}
      {replyTarget && (
        <div className={`chat-context px-4 py-2 flex items-center justify-between border-t border-l-4 border-l-[#727cf5] ${theme === 'dark' ? 'bg-[#222733] border-gray-800' : 'bg-gray-100 border-gray-250'}`}>
          <div className="text-xs">
            <span className="text-[#727cf5] font-semibold">Respondiendo a {replyTarget.senderId === currentUser.uid ? 'Tú' : (otherUser?.nombre || 'Contacto')}</span>
            <span className="opacity-75 block truncate text-[11px] mt-0.5">{replyTarget.content}</span>
          </div>
          <button onClick={() => setReplyTarget(null)} className="p-1 hover:bg-black/10 rounded-full cursor-pointer">
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>
      )}

      {/* ----------------- INPUT FOOTER ----------------- */}
      {canSend?<footer className={`chat-composer px-3 sm:px-4 py-2.5 shrink-0 select-none z-10 flex flex-col relative ${theme === 'dark' ? 'bg-[#232732]' : 'bg-[#f0f2f5]'}`}>{recordMode==='audio'?<Recorder mode="audio" onClose={()=>setRecordMode(null)} onSend={sendMedia}/>:<>
        {showEmojiPicker&&<EmojiPicker onClose={()=>setShowEmojiPicker(false)} onSelect={emoji=>{const field=textareaRef.current,value=editingTarget?editingText:inputText,start=field?.selectionStart??value.length,end=field?.selectionEnd??value.length,next=value.slice(0,start)+emoji+value.slice(end);if(editingTarget)setEditingText(next);else setInputText(next);requestAnimationFrame(()=>{field?.setSelectionRange(start+emoji.length,start+emoji.length);});}} onAsset={async(url,name,type)=>{const response=await fetch(url);const blob=await response.blob();const file=new window.File([blob],name+(/webp/i.test(blob.type)?'.webp':/png/i.test(blob.type)?'.png':'.gif'),{type:blob.type||'image/gif'});if(desktopWeb&&type==='image'){uploadKind.current='media';setPendingFiles([file]);setShowEmojiPicker(false);}else await sendMedia(file,type);}} onCreateSticker={()=>{setShowEmojiPicker(false);if(desktopWeb)stickerInput.current?.click();else setShowStickers(true);}}/>}

        {showAttachMenu&&<div className="attachment-panel attachment-complete" role="menu" aria-label="Adjuntar al chat">{[[File,'Documento',()=>chooseFiles('document')],[ImageIcon,'Fotos y videos',()=>chooseFiles('media')],[Camera,'Cámara',()=>{setShowCamera(true);setShowAttachMenu(false);}],[AudioLines,'Audio',()=>{setAudioOptions(true);setShowAttachMenu(false);}],[UserRound,'Contacto',()=>{setShowContacts(true);setShowAttachMenu(false);}],[MapPin,'Ubicación',()=>{setShowLocation(true);setShowAttachMenu(false);}],[BarChart3,'Encuesta',()=>{setShowPoll(true);setShowAttachMenu(false);}],[Calendar,'Evento',()=>{setShowEvent(true);setShowAttachMenu(false);}],[Smile,'Nuevo sticker',()=>{if(desktopWeb)stickerInput.current?.click();else setShowStickers(true);setShowAttachMenu(false);}]].filter(([,label])=>mobileOptions||label!=='Ubicación').map(([Icon,label,action]:any)=><button role="menuitem" key={label} onClick={action}><Icon size={20}/>{label}</button>)}</div>}
        <input type="file" multiple ref={fileInputRef} aria-label="Seleccionar archivos para enviar" onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(files.length>10){setUploadError('Selecciona hasta 10 archivos por envío.');return;}setPendingFiles(files);setUploadError('');}} className="hidden"/>
        <div className="composer-row flex items-center gap-2 sm:gap-3">
          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            <button 
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-5.5 h-5.5 text-violet-500" />
            </button>
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Emojis"
            >
              <Smile className="w-6 h-6 text-indigo-500" />
            </button>
          </div>

          <div className="flex-1 min-w-0 relative">
              <textarea ref={textareaRef}
                aria-label="Escribe un mensaje"
                spellCheck={preferences.chat.spellcheck}
                rows={inputText.split('\n').length > 1 ? Math.min(inputText.split('\n').length, 4) : 1}
                maxLength={editingTarget?.type==='poll'?255:20000}
                value={editingTarget ? editingText : inputText}
                onChange={editingTarget ? (e) => setEditingText(e.target.value) : handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={editingTarget ? "Modifica el texto de tu mensaje..." : "Escribe un mensaje..."}
                style={{ resize: 'none' }}
                className={`w-full p-2.5 rounded-lg border-none outline-none text-sm transition-all nexus-scrollbar max-h-24 ${
                  theme === 'dark' ? 'bg-[#2c3140] text-white focus:bg-[#353b4b]' : 'bg-white text-gray-900 focus:bg-[#fcfcfc]'
                }`}
              />
          </div>

          <div className={`shrink-0 ${theme === 'dark' ? 'text-[#727cf5]' : 'text-indigo-600'}`}>
            {(inputText.trim() || editingTarget) ? (
              <button 
                onPointerDown={event=>{if(event.pointerType!=='mouse')event.preventDefault();}}
                onMouseDown={event=>event.preventDefault()}
                onClick={handleSend}
                aria-busy={isSending}
                className="p-2.5 bg-[#727cf5] text-white rounded-full hover:bg-[#5964dd] active:scale-90 transition-all cursor-pointer shadow-md flex items-center justify-center outline-none"
                title="Enviar mensaje"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={()=>setRecordMode('audio')}
                className={`p-2.5 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  isRecording ? 'bg-red-500 text-white hover:bg-red-600 animate-bounce' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
                title={isRecording ? "Enviar grabación" : "Grabar nota de voz"}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </>}</footer>:<div className="readonly-channel">Solo los administradores pueden publicar en este espacio.</div>}
      {showAppearance&&<div className="feature-backdrop"><section className="feature-dialog" role="dialog" aria-label="Personalizar chat"><button className="dialog-close" aria-label="Cerrar personalización" onClick={()=>setShowAppearance(false)}><X/></button><h2>Estilo de este chat</h2><AppearancePanel uid={currentUser.uid} chatId={activeChat.id}/></section></div>}
      {reactionInfo&&messages.find(message=>message.id===reactionInfo)&&<ReactionDetails message={messages.find(message=>message.id===reactionInfo)!} user={currentUser} users={users} onRemove={emoji=>handleReactionClick(reactionInfo,emoji)} onClose={()=>setReactionInfo(null)}/>}
      {reactionTarget&&<div className="reaction-picker-wrap"><EmojiPicker onClose={()=>setReactionTarget(null)} onSelect={emoji=>{handleReactionClick(reactionTarget,emoji).catch(()=>setUploadError('No se pudo guardar la reacción.'));setReactionTarget(null);}}/></div>}
      {reporting&&<ConversationReport chat={activeChat} user={currentUser} messages={messages} onClose={()=>setReporting(false)}/>}
      {showGroupSettings&&<GroupSettings key={groupSection} initialSection={groupSection} chat={activeChat} messages={messages} user={currentUser} users={users} onClose={()=>setShowGroupSettings(false)}/>}
      {imageViewer&&desktopWeb&&messages.find(message=>message.id===imageViewer)?.type==='sticker'&&(()=>{const item=messages.find(message=>message.id===imageViewer)!;return <DesktopStickerViewer uid={currentUser.uid} item={{...item,sender:item.senderId===currentUser.uid?'Tú':users.find(person=>person.uid===item.senderId)?.nombre||'Contacto',photo:item.senderId===currentUser.uid?currentUser.foto:users.find(person=>person.uid===item.senderId)?.foto,url:manualMedia[item.id]||resolvedMedia[item.id]||realtime?.media[item.transferId||'']}} onClose={()=>setImageViewer(null)} onReply={()=>{setReplyTarget(item);setImageViewer(null);textareaRef.current?.focus();}} onStar={()=>star([item])} onForward={()=>{setForwarding([item]);setImageViewer(null);}} onDelete={()=>{setDeleting([item]);setImageViewer(null);}} onPin={((activeChat.kind!=='group'&&activeChat.kind!=='channel')||activeChat.membersCanEdit||activeChat.admins?.includes(currentUser.uid))?()=>{setImageViewer(null);if(messagePinned(item,activeChat))void setMessagePin(activeChat.id,item.id,0).catch(e=>setUploadError(e.message));else setPinTarget(item);}:undefined}/>;})()}
      {imageViewer&&(!desktopWeb||messages.find(message=>message.id===imageViewer)?.type!=='sticker')&&<MediaViewer uid={currentUser.uid} initialId={imageViewer} items={messages.filter(message=>!message.deletedAt&&(!message.expiresAt||message.expiresAt>Date.now())&&['image','sticker','video','video-note','document'].includes(message.type)).map(message=>({...message,url:manualMedia[message.id]||resolvedMedia[message.id]||realtime?.media[message.transferId||''],sender:message.senderId===currentUser.uid?'Tú':users.find(person=>person.uid===message.senderId)?.nombre||'Contacto'}))} onClose={()=>setImageViewer(null)}/>}
      {showCamera&&desktopWeb&&<DesktopCamera onClose={()=>setShowCamera(false)} onCapture={file=>{setShowCamera(false);uploadKind.current='media';setPendingFiles([file]);}}/>}
      {showCamera&&!desktopWeb&&<CameraCapture onVideo={()=>{setShowCamera(false);setRecordMode('video');}} onClose={()=>setShowCamera(false)} onSend={sendMedia}/>}
      {audioOptions&&desktopWeb&&<div className="nx-web-modal-shade"><section className="nx-web-modal nx-web-audio-choice" role="dialog" aria-label="Compartir audio"><header><button aria-label="Cerrar audio" onClick={()=>setAudioOptions(false)}><X/></button><h2>Audio</h2></header><button onClick={()=>{setAudioOptions(false);chooseFiles('audio');}}>Elegir archivo de audio</button><button onClick={()=>{setAudioOptions(false);setRecordMode('audio');}}>Grabar nota de voz</button></section></div>}
      {audioOptions&&!desktopWeb&&<div className="feature-backdrop"><section className="feature-dialog" role="dialog" aria-label="Compartir audio"><button className="dialog-close" aria-label="Cerrar audio" onClick={()=>setAudioOptions(false)}><X/></button><h2>Comparte un audio</h2><div className="feature-actions"><button onClick={()=>chooseFiles('audio')}>Elegir archivo de audio</button><button onClick={()=>{setAudioOptions(false);setRecordMode('audio');}}>Grabar nota de voz</button></div></section></div>}
      {showContacts&&desktopWeb&&<DesktopContacts user={currentUser} users={users} onClose={()=>setShowContacts(false)} onSend={person=>onSendMessage(person.nombre,'contact',{fileUrl:'',fileName:'',fileSize:0,contact:{uid:person.uid,name:person.nombre,username:person.username}})}/>}
      {showContacts&&!desktopWeb&&<MobileContacts user={currentUser} users={users} onClose={()=>setShowContacts(false)} onSend={person=>onSendMessage(person.nombre,'contact',{fileUrl:'',fileName:'',fileSize:0,contact:{uid:person.uid,name:person.nombre,username:person.username}})}/>}{pendingFiles.length>0&&desktopWeb&&<DesktopAttachmentReview files={pendingFiles} documentMode={uploadKind.current==='document'} onFiles={setPendingFiles} onClose={()=>setPendingFiles([])} onEdit={setEditingPhoto} onSend={sendMedia}/>}
      {pendingFiles.length>0&&!desktopWeb&&<div className="feature-backdrop"><section className="feature-dialog" role="dialog" aria-label="Revisar archivos"><button disabled={fileBusy} className="dialog-close" aria-label="Cancelar archivos" onClick={()=>setPendingFiles([])}><X/></button><h2>Revisa antes de enviar</h2><p>Revisa los archivos antes de compartirlos. Puedes adjuntar hasta diez por envío.</p><div className="pending-files">{pendingFiles.map((file,index)=><article key={index}>{uploadKind.current!=='document'&&file.type.startsWith('image/')&&<img src={previewURLs[index]} alt={file.name}/ >}{uploadKind.current!=='document'&&file.type.startsWith('video/')&&<video src={previewURLs[index]} controls playsInline/>}{file.type.startsWith('audio/')&&<audio src={previewURLs[index]} controls/>}<strong>{file.name}</strong>{uploadKind.current!=='document'&&['image/png','image/jpeg','image/webp'].includes(file.type)&&<button disabled={fileBusy} onClick={()=>setEditingPhoto(file)}>Editar foto</button>}<button disabled={fileBusy} aria-label={'Quitar '+file.name} onClick={()=>setPendingFiles(previous=>previous.filter(item=>item!==file))}>Quitar</button>{uploadKind.current!=='document'&&/^(image|video)\//.test(file.type)&&<label>Comentario<input aria-label={'Comentario de '+file.name} maxLength={2000} placeholder="Añade un comentario…" value={captions.get(file)||''} onChange={event=>setCaptions(previous=>new Map(previous).set(file,event.target.value))}/></label>}<small>{(file.size/1024/1024).toFixed(2)} MB</small></article>)}</div><button disabled={fileBusy} onClick={async()=>{setFileBusy(true);setUploadError('');try{const queue=[...pendingFiles];for(const file of queue){const type=uploadKind.current==='document'||file.type==='image/svg+xml'?'document':file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':file.type.startsWith('audio/')?'audio':'document';await sendMedia(file,type,captions.get(file)||'');setPendingFiles(current=>current.slice(1));}}catch(e){setUploadError(e instanceof Error?e.message:'No se pudo enviar el archivo.');}finally{setFileBusy(false);}}}>{fileBusy?'Enviando…':'Enviar archivos'}</button>{uploadError&&<p role="alert">{uploadError}</p>}</section></div>}
      {editingPhoto&&<PhotoEditor file={editingPhoto} onClose={()=>setEditingPhoto(null)} onApply={file=>{const old=editingPhoto;setCaptions(previous=>{const next=new Map(previous);next.set(file,next.get(old)||'');next.delete(old);return next;});setPendingFiles(previous=>previous.map(item=>item===old?file:item));setDesktopSticker(previous=>previous.map(item=>item===old?file:item));setEditingPhoto(null);}}/>}
      <input ref={stickerInput} type="file" hidden accept="image/*" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)setDesktopSticker([file]);}}/>
      {desktopSticker.length>0&&desktopWeb&&<DesktopAttachmentReview files={desktopSticker} sticker onFiles={setDesktopSticker} onClose={()=>setDesktopSticker([])} onEdit={setEditingPhoto} onSend={async(file,_kind,caption)=>sendMedia(await stickerFile(file,file.name),'sticker',caption)}/>}
      {showStickers&&!desktopWeb&&<Stickers onClose={()=>setShowStickers(false)} onSend={sendMedia}/>}
      {recordMode==='video'&&<Recorder mode={recordMode} onClose={()=>setRecordMode(null)} onSend={sendMedia}/>}
      {conversationTool&&<ConversationTool uid={currentUser.uid} chat={activeChat} kind={conversationTool} onClose={()=>setConversationTool(null)}/>}
      {showLocation&&<LocationComposer onLive={activeChat.kind!=='channel'?async duration=>{await startLiveLocation(activeChat,currentUser.uid,duration);}:undefined} onClose={()=>setShowLocation(false)} onSend={text=>onSendMessage(text,'text')}/>}
      {showEvent&&desktopWeb&&<DesktopEvent disappearingMs={activeChat.disappearingMs} onLink={realtime&&activeChat.kind==='group'?at=>realtime.link(activeChat,at,'video'):undefined} onClose={()=>setShowEvent(false)} onSend={file=>sendMedia(file,'document')}/>}
      {showEvent&&!desktopWeb&&<EventComposer onClose={()=>setShowEvent(false)} onSend={file=>sendMedia(file,'document')}/>}
      {showPoll&&<PollDialog chat={activeChat} uid={currentUser.uid} onClose={()=>setShowPoll(false)}/>}
      {translation!==null&&<TranslationDialog text={translation} onClose={()=>setTranslation(null)}/>}
      {showWriting&&<WritingDialog text={inputText} history={messages.slice(-100).map(m=>m.content).join('\n')} onApply={setInputText} onClose={()=>setShowWriting(false)}/>}
    </div>
    {restricted&&<button onClick={onBack}>Volver a chats</button>}
    </>
  );
}


