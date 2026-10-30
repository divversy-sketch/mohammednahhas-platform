// حارس تثبيت الشاشة: التثبيت مسموح بس وصفحة الامتحان مفتوحة.
// لو التطبيق اتعمله إعادة تحميل، أو الطالب خرج من الامتحان بأي طريقة، أو حصل أي حاجة خلّت الامتحان
// يتقفل والشاشة لسه متثبتة، الحارس بيفك التثبيت لوحده عشان المنصة كلها ما تفضلش مقفولة.
import { isExamLockSupported, getExamLockState, releaseExamLock } from './examLock.js';

const inExamPage = () => typeof document !== 'undefined' && document.documentElement.dataset.nxExamGate === '1';

let started = false;
export function startExamLockGuard() {
  if (started || !isExamLockSupported()) return;
  started = true;
  const check = async () => {
    if (inExamPage()) return;
    const s = await getExamLockState();
    if ((s === 'pinned' || s === 'locked') && !inExamPage()) releaseExamLock();
  };
  setTimeout(check, 800);
  setInterval(check, 3000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  try { window.Capacitor?.Plugins?.App?.addListener?.('resume', check); } catch { /* ignore */ }
}

/** صفحة الامتحان بتعلن إنها مفتوحة (ExamLockGate) */
export function markExamPage(open) {
  try {
    if (open) document.documentElement.dataset.nxExamGate = '1';
    else delete document.documentElement.dataset.nxExamGate;
  } catch { /* ignore */ }
}
