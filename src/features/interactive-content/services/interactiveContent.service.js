import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@services/firebase.js';

export function subscribeCollection(collectionName, onData, onError, constraints = []) {
  const ref = constraints.length ? query(collection(db, collectionName), ...constraints) : collection(db, collectionName);
  return onSnapshot(ref, (snapshot) => onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}

export async function getDocument(collectionName, id) {
  const snapshot = await getDoc(doc(db, collectionName, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function createDocument(collectionName, payload) {
  return addDoc(collection(db, collectionName), { ...payload, createdAt: serverTimestamp() });
}

export async function saveDocument(collectionName, id, payload) {
  return setDoc(doc(db, collectionName, id), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function updateDocument(collectionName, id, payload) {
  return updateDoc(doc(db, collectionName, id), { ...payload, updatedAt: serverTimestamp() });
}

export async function deleteDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id));
}

export { where, getDocs };
