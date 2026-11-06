import React from 'react';
import {UserProfile,Chat,Message} from '../types';
import MobileSidebar from './MobileSidebar';
import {useDesktopWeb} from '../features/useDesktopWeb';
export interface SidebarProps {
  latestMessages?:Record<string,Message>;
  currentUser: UserProfile;
  chats: Chat[];
  activeChatId: string | null;
  users: UserProfile[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onChatSelect: (chatId: string) => void;
  onCreateChat: (otherUserId: string) => void;
  onUpdateProfile: (nombre: string, bio: string, foto: string) => Promise<void>;
  onTogglePin: (chatId: string) => void;
  onToggleArchive: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onLogout: () => void;
  onOpenHub?: () => void;
  onUserChange?: (user:UserProfile)=>void;
}
export default function Sidebar(props:SidebarProps){const desktop=useDesktopWeb();return <MobileSidebar {...props} desktop={desktop}/>;}
