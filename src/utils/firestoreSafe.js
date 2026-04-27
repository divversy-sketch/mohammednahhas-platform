// src/utils/firestoreSafe.js
// حماية ضد خطأ:
// Function collection() cannot be called with an empty path
//
// الاستخدام:
// import { safeCollection, safeDoc, safeId } from './utils/firestoreSafe';
// const ref = safeCollection(db, 'student_chats', studentId, 'messages');

import { collection, doc } from "firebase/firestore";

export function safeId(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

export function isValidPathPart(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function safeCollection(db, ...parts) {
  const cleanParts = parts.map(safeId);

  if (!db) {
    console.error("Firestore safeCollection error: db is missing", { parts: cleanParts });
    throw new Error("Firestore db is missing");
  }

  if (cleanParts.length === 0 || cleanParts.some((part) => !isValidPathPart(part))) {
    console.error("Firestore safeCollection error: empty collection path part", { parts: cleanParts });
    throw new Error(`Firestore collection path is invalid: ${cleanParts.join("/")}`);
  }

  return collection(db, ...cleanParts);
}

export function safeDoc(db, ...parts) {
  const cleanParts = parts.map(safeId);

  if (!db) {
    console.error("Firestore safeDoc error: db is missing", { parts: cleanParts });
    throw new Error("Firestore db is missing");
  }

  if (cleanParts.length === 0 || cleanParts.some((part) => !isValidPathPart(part))) {
    console.error("Firestore safeDoc error: empty document path part", { parts: cleanParts });
    throw new Error(`Firestore document path is invalid: ${cleanParts.join("/")}`);
  }

  return doc(db, ...cleanParts);
}
