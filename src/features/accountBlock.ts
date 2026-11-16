/** A report or a personal contact block is not an account sanction. */
export function isAccountBlocked(marker:Record<string,unknown>|undefined){
 return !!marker&&['reports','blocked','moderation'].includes(String(marker.reason||''));
}
