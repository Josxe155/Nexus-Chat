import {and,or,query,where,orderBy,type Query,type QueryConstraint,type QueryFieldFilterConstraint,type QueryNonFilterConstraint,type DocumentData} from 'firebase/firestore';
/** Queries must exclude expired records on the server: rules are not client filters. */
export function liveMessages<T extends DocumentData>(base:Query<T>,...constraints:QueryConstraint[]){
 const filters=constraints.filter(c=>c.type==='where') as QueryFieldFilterConstraint[];
 const rest=constraints.filter(c=>c.type!=='where') as QueryNonFilterConstraint[];
 const orders=rest.filter(c=>c.type==='orderBy'),bounds=rest.filter(c=>c.type!=='orderBy');
 return query(base,and(or(where('expiresAt','==',0),where('expiresAt','>',Date.now()+5000)),...filters),...orders,orderBy('expiresAt','asc'),...bounds);
}
