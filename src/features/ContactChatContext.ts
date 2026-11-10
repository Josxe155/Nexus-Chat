import {createContext} from 'react';
export const ContactChatContext=createContext<((uid:string,contactSaved?:boolean)=>Promise<void>)|null>(null);
