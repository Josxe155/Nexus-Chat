export function isDashboardAccessDenied(error:unknown){
 const code=typeof error==='object'&&error!==null&&'code'in error?String(error.code):'';
 return ['permission-denied','firestore/permission-denied','auth/user-disabled','auth/user-token-expired','auth/invalid-user-token'].includes(code);
}
