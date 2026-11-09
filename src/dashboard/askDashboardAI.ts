import config from '../public-services.json';
import {requestDashboardAnswer,type DashboardTools} from './geminiDashboard';

export function askDashboardAI(question:string,context:string,signal:AbortSignal,tools?:DashboardTools){
 return requestDashboardAnswer(question,context,signal,{key:config.geminiKey,model:config.geminiModel},tools);
}
