import config from '../public-services.json';
import {requestDashboardAnswer} from './geminiDashboard';

export function askDashboardAI(question:string,context:string,signal:AbortSignal){
 return requestDashboardAnswer(question,context,signal,{key:config.geminiKey,model:config.geminiModel});
}
