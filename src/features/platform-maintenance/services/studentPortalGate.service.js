import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@services/firebase.js';

export const STUDENT_PORTAL_GATE_COLLECTION = 'settings';
export const STUDENT_PORTAL_GATE_DOC_ID = 'student_portal_gate';
export const STUDENT_PORTAL_GATE_PATH = `${STUDENT_PORTAL_GATE_COLLECTION}/${STUDENT_PORTAL_GATE_DOC_ID}`;

export const defaultStudentPortalGate = Object.freeze({
  enabled: false,
  title: 'الموقع تحت الصيانة حاليًا',
  message: 'نقوم بتجهيز التصميم الجديد للمنصة. برجاء المحاولة لاحقًا.',
  allowedStudentIds: [],
  allowedStudentEmails: [],
  showLoginHint: true,
});

const cleanList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,;]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export function normalizeStudentPortalGate(raw = {}) {
  const allowedStudentIds = cleanList(raw.allowedStudentIds || raw.allowedUids || raw.allowedIds);
  const allowedStudentEmails = cleanList(raw.allowedStudentEmails || raw.allowedEmails)
    .map((email) => email.toLowerCase());

  return {
    ...defaultStudentPortalGate,
    ...raw,
    enabled: Boolean(raw.enabled),
    title: raw.title || defaultStudentPortalGate.title,
    message: raw.message || defaultStudentPortalGate.message,
    allowedStudentIds,
    allowedStudentEmails,
    showLoginHint: raw.showLoginHint ?? defaultStudentPortalGate.showLoginHint,
  };
}

export function subscribeStudentPortalGate(onData, onError) {
  return onSnapshot(
    doc(db, STUDENT_PORTAL_GATE_COLLECTION, STUDENT_PORTAL_GATE_DOC_ID),
    (snapshot) => {
      onData(snapshot.exists() ? normalizeStudentPortalGate(snapshot.data()) : defaultStudentPortalGate);
    },
    onError
  );
}

export async function saveStudentPortalGateSettings(payload, adminUser = null) {
  const normalized = normalizeStudentPortalGate(payload);
  return setDoc(
    doc(db, STUDENT_PORTAL_GATE_COLLECTION, STUDENT_PORTAL_GATE_DOC_ID),
    {
      ...normalized,
      updatedAt: serverTimestamp(),
      updatedBy: adminUser?.uid || '',
      updatedByEmail: adminUser?.email || '',
    },
    { merge: true }
  );
}

export function isStudentAllowedDuringMaintenance(gate, user) {
  const normalized = normalizeStudentPortalGate(gate);
  if (!normalized.enabled) return true;
  if (!user?.uid && !user?.email) return false;

  const uid = String(user?.uid || '').trim();
  const email = String(user?.email || '').trim().toLowerCase();

  return normalized.allowedStudentIds.includes(uid) || normalized.allowedStudentEmails.includes(email);
}
