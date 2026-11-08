export interface UserStatus {
  online: boolean;
  lastSeen: number;
  typing?: string | boolean; // stores the chatId they are currently typing, or false
}

export interface UserProfile {
  moderationRemoved?: boolean;
  isGuest?: boolean;
  lastActiveAt?: number;
  uid: string;
  nombre: string;
  username: string;
  usernameProvisional?: boolean;
  usernameChangedAt?: number | {toMillis:()=>number};
  foto: string;
  bio: string;
  estado: string;
  online: boolean;
  lastSeen: number;
  typing?: string | boolean;
  createdAt: number;
  privacy?: Partial<import('./features/privacy').PrivacyOptions> & {hideOnline?: boolean; hideLastSeen?: boolean; hidePhoto?: boolean; hideBio?: boolean;schemaVersion?:number;updatedAt?:number};
}

export interface ReactionMap {
  [uid: string]: string; // e.g. { "user_123": "👍" }
}

export interface MessageReplyContext {
  id: string;
  senderName: string;
  content: string;
  type: string;
}

export interface Message {
  sealed?:import('./features/encryptionCore').Sealed;
  decryptionFailed?:boolean;
  localError?:string;
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "video" | "audio" | "document" | "sticker" | "video-note" | "poll" | "contact";
  contact?: {uid:string;name:string;username:string};
  locationShare?:{id:string;expiresAt:number};
  fileUrl?: string;
  transferId?: string;
  fileName?: string;
  fileSize?: number;
  voiceNote?: boolean;
  forwarded?: boolean;
  forwardCount?:number;
  receivedBy?: Record<string,number>;
  readBy?: Record<string,number>;
  localState?: 'queued'|'failed';
  timestamp: number;
  serverSentAt?: any;
  status: "sent" | "delivered" | "read";
  reactions?: ReactionMap;
  replyTo?: MessageReplyContext;
  edited?: boolean;
  deletedAt?: number;
  expiresAt?: number;
  keptBy?: string;
  viewOnce?: boolean;
  keepRequestedBy?: string;
  keepVetoed?: boolean;
  keptAt?: any;
  originalExpiresAt?: number;
  pinned?: boolean;
  pinExpiresAt?:number;
  pinnedAt?:number;
  pinnedBy?:string;
  poll?: {hideVoterNames?:boolean;closesAt?:number;closedAt?:any;question: string; options: {id: string; text: string}[]; multiple: boolean; optionIds:string[]; votes: Record<string,string[]>};
}

export interface Chat {
  e2ee?:'v1';
  moderationRemoved?: boolean;
  description?:string;
  photoURL?:string;
  createdBy?:string;
  membersCanEdit?:boolean;
  membersCanAdd?:boolean;
  groupInviteToken?:string;
  kind?: "direct" | "group" | "channel";
  title?: string;
  admins?: string[];
  sendPolicy?: "everyone" | "admins";
  aliases?: Record<string,string>;
  disappearingMs?: number;
  communityId?: string;
  voiceRoomId?: string;
  messagePins?:Record<string,{expiresAt:number;by:string}>;
  historyStartsAt?: Record<string,number>;
  typing?:Record<string,number>;
  id: string;
  participants: string[];
  createdAt: number;
  lastMessage?: {
    expiresAt?:number;
    id: string;
    content: string;
    senderId: string;
    timestamp: number;
    type: "text" | "image" | "video" | "audio" | "document" | "sticker" | "video-note" | "poll" | "contact";
  };
  unreadCount: {
    [uid: string]: number;
  };
  pinned?: {
    [uid: string]: boolean;
  };
  archived?: {
    [uid: string]: boolean;
  };
}

export interface EmojiGroup {
  category: string;
  emojis: string[];
}
