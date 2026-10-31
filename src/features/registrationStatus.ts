let status='';
export function registrationStatus(){return status;}
export function reportRegistrationStatus(message:string){status=message;window.dispatchEvent(new Event('nexus:registration-status'));}
