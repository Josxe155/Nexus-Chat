import {doc, getDocFromServer, onSnapshot, runTransaction} from 'firebase/firestore';
import {db} from '../firebase';

export const validContactCode = (token: unknown): token is string =>
  typeof token === 'string' && /^[a-f0-9]{32}$/.test(token);

export function contactCodeURL(token: string) {
  return new URL('/?contact=' + token, location.origin).href;
}

export function parseContactCode(value: string) {
  if (value.length > 2048) return null;
  try {
    const url = new URL(value);
    const token = url.searchParams.get('contact');
    return url.origin === location.origin && url.pathname === '/' && !url.username &&
      !url.password && !url.hash && url.search === '?contact=' + token &&
      validContactCode(token) ? token : null;
  } catch {
    return null;
  }
}

export function updateContactCode(uid: string, reset = false) {
  const profile = doc(db, 'users', uid, 'private', 'contactQr');
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(profile);
    const current = snapshot.data()?.token;
    if (validContactCode(current) && !reset) return current;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte =>
      byte.toString(16).padStart(2, '0')).join('');
    if (validContactCode(current)) transaction.delete(doc(db, 'contactCodes', current));
    transaction.set(profile, {token});
    transaction.set(doc(db, 'contactCodes', token), {uid});
    return token;
  });
}

export function watchContactCode(uid: string, onCode: (token: string) => void, onError: () => void) {
  return onSnapshot(doc(db, 'users', uid, 'private', 'contactQr'), snapshot => {
    const token = snapshot.data()?.token;
    onCode(validContactCode(token) ? token : '');
  }, onError);
}

export async function resolveContactCode(token: string) {
  if (!validContactCode(token)) throw Error('El código no pertenece a Nexus Chat.');
  const code = await getDocFromServer(doc(db, 'contactCodes', token));
  const uid = code.data()?.uid;
  if (typeof uid !== 'string') throw Error('Este código QR ya no está disponible.');
  const profile = await getDocFromServer(doc(db, 'users', uid));
  const data = profile.data();
  if (!data || data.moderationRemoved) throw Error('Este perfil ya no está disponible.');
  return {uid, nombre: String(data.nombre || 'Contacto de Nexus'), username: String(data.username || '')};
}
