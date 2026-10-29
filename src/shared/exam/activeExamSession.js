// «الامتحان المفتوح على الجهاز ده»: لو التطبيق اتقفل أو اتعمله ريستارت والطالب في نص الامتحان
// (أندرويد قفله عشان الكاميرا، البطارية، أو أي سبب)، المنصة بترجّعه لنفس الامتحان على نفس الجهاز
// بنفس إجاباته، والوقت بيفضل شغال. على جهاز تاني لسه محتاج موافقة الأدمن زي الأول.
import { makeExamAutosaveKey, readLocalExamBackup } from './examState.js';

const KEY = 'nx-active-exam-v1';
const MAX_AGE = 6 * 3600e3;

export function markActiveExam({ uid, examId, attemptId }) {
  if (!uid || !attemptId) return;
  try { localStorage.setItem(KEY, JSON.stringify({ uid, examId, attemptId, at: Date.now() })); } catch { /* ignore */ }
}

export function clearActiveExam(attemptId) {
  try {
    const cur = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!attemptId || !cur || cur.attemptId === attemptId) localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export function readActiveExam(uid) {
  try {
    const cur = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!cur || cur.uid !== uid || Date.now() - (cur.at || 0) > MAX_AGE) return null;
    return cur;
  } catch { return null; }
}

const ms = (v) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);

/** بيانات الاستكمال: الأحدث بين اللي على السيرفر واللي محفوظ على الجهاز. */
export function buildDeviceResume({ user, exam, result }) {
  const local = readLocalExamBackup(makeExamAutosaveKey(user, { ...exam, attemptId: result.id }));
  const serverAt = ms(result.lastSavedAt);
  const localAt = ms(local?.savedAt);
  const base = local && localAt > serverAt
    ? { ...result, answers: local.answers || result.answers || {}, remainingTime: local.remainingTime, currentQIndex: local.currentQIndex, lastSavedAt: local.savedAt }
    : { ...result };
  const log = [...(base.antiCheatLog || result.antiCheatLog || []), { type: 'app_restarted', at: new Date().toISOString() }];
  return { ...base, status: 'in_progress', antiCheatLog: log, antiCheatWarnings: Number(result.antiCheatWarnings) || 0 };
}
