import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@services/firebase.js';

export function subscribePublicContent(onData, onError) {
  const publicContentQuery = query(collection(db, 'content'), where('isPublic', '==', true));
  return onSnapshot(
    publicContentQuery,
    (snapshot) => onData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
    onError
  );
}
