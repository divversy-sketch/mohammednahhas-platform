// When the internet drops at the moment of «سلّم», the finished attempt is kept on the device and sent
// again the next time the student opens the platform, so it never stays stuck as «مش مكتملة».
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const PREFIX = 'nx-pending-submit:';

function plain(value) {
  // serverTimestamp() sentinels can't be stored; they're re-created on resend
  return JSON.parse(JSON.stringify(value, (k, v) => (v && typeof v === 'object' && v._methodName ? undefined : v)));
}

export function queuePendingSubmit(attemptId, payload) {
  if (!attemptId || !payload) return;
  try { localStorage.setItem(PREFIX + attemptId, JSON.stringify({ attemptId, payload: plain(payload), at: Date.now() })); } catch { /* storage blocked */ }
}

export function clearPendingSubmit(attemptId) {
  try { localStorage.removeItem(PREFIX + attemptId); } catch { /* storage blocked */ }
}

export function pendingSubmits(studentId) {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const item = JSON.parse(localStorage.getItem(key) || 'null');
      if (item?.payload && (!studentId || item.payload.studentId === studentId)) out.push(item);
    }
  } catch { /* storage blocked */ }
  return out;
}

/** Sends any queued submissions; returns how many went through. */
export async function flushPendingSubmits(db, studentId) {
  let sent = 0;
  for (const item of pendingSubmits(studentId)) {
    try {
      await setDoc(doc(db, 'exam_results', item.attemptId), { ...item.payload, status: 'completed', submittedAt: serverTimestamp() }, { merge: true });
      clearPendingSubmit(item.attemptId);
      sent += 1;
    } catch { /* still offline: try again next time */ }
  }
  return sent;
}
