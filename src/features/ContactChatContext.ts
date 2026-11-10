import {createContext} from 'react';
export const ContactChatContext=createContext<((uid:string)=>Promise<void>)|null>(null);
