export const profileQuestions=[
 '¿Cómo te sientes hoy?',
 '¿Qué canción escuchas una y otra vez?',
 '¿Qué te hizo sonreír hoy?',
 '¿Qué plan te ilusiona?',
 '¿Qué estás disfrutando últimamente?',
 '¿Cuál es tu lugar favorito para desconectar?',
 '¿Qué película recomendarías?',
 '¿Qué sueño quieres cumplir?',
 '¿Qué agradeces hoy?',
 '¿Qué te gustaría compartir?',
] as const;
const positions=new Map<string,number>();
export function nextProfileQuestion(uid:string){const index=((positions.get(uid)??-1)+1)%profileQuestions.length;positions.set(uid,index);return profileQuestions[index];}
