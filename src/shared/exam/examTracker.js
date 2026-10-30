// تتبع الامتحان: كل حاجة الطالب بيعملها من أول ما يفتح الامتحان لحد ما يسلّم أو يخرج.
// الأحداث بتتجمع وتتبعت كل كام ثانية في دفعة واحدة (collection: exam_events) عشان ما نكترش الكتابة،
// ولو النت فاصل بتتحفظ وتتبعت أول ما يرجع (بوقتها الحقيقي)، فالأدمن يشوف «النت فصل الساعة كذا ورجع الساعة كذا».
// وملخص سريع بيتكتب على المحاولة نفسها (آخر حدث، النت، البطارية، الجهاز، الوقت على كل سؤال) للمراقبة اللايف.
import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const FLUSH_MS = 4000;
const URGENT = new Set(['open', 'hide', 'offline', 'close', 'submit_try', 'submit_ok', 'submit_fail', 'cheated', 'hold', 'error', 'unpin', 'resume']);

export function deviceSnapshot() {
  if (typeof window === 'undefined') return {};
  const cap = window.Capacitor;
  const native = Boolean(cap?.isNativePlatform?.());
  const ua = navigator.userAgent || '';
  const platform = native ? cap.getPlatform?.() : /android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'web';
  const model = (ua.match(/Android [\d.]+; ([^;)]+)/) || [])[1] || (/iPhone/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : '');
  const conn = navigator.connection || {};
  return {
    app: native ? 'app' : 'web',
    platform: platform || 'web',
    model: String(model).trim().slice(0, 40),
    build: typeof __NX_BUILD_ID__ !== 'undefined' ? __NX_BUILD_ID__ : '',
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    net: conn.effectiveType || '',
  };
}

export function createExamTracker({ db, exam, user, enabled = true }) {
  const attemptId = exam?.attemptId;
  const on = Boolean(enabled && db && attemptId && exam?.id !== 'custom_mistakes_exam');
  let buffer = [];
  let timer = 0;
  let summary = {};
  let stopped = false;

  const flush = () => {
    clearTimeout(timer); timer = 0;
    if (!on) return;
    if (buffer.length) {
      const events = buffer; buffer = [];
      addDoc(collection(db, 'exam_events'), {
        attemptId, examId: exam.id, studentId: user?.uid || '', studentName: user?.displayName || '',
        events, clientAt: Date.now(), createdAt: serverTimestamp(),
      }).catch(() => { /* القواعد لسه ما اتنشرتش أو مشكلة: التتبع مش لازم يوقف الامتحان */ });
    }
    if (Object.keys(summary).length) {
      const patch = summary; summary = {};
      setDoc(doc(db, 'exam_results', attemptId), patch, { merge: true }).catch(() => {});
    }
  };

  const schedule = (urgent) => {
    if (urgent) { flush(); return; }
    if (!timer) timer = setTimeout(flush, FLUSH_MS);
  };

  const log = (type, data = {}) => {
    if (!on || stopped) return;
    const ev = { t: type, at: Date.now() };
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') ev[k] = typeof v === 'string' ? v.slice(0, 160) : v; });
    buffer.push(ev);
    if (import.meta.env.DEV && typeof window !== 'undefined') (window.__nxTrackLog = window.__nxTrackLog || []).push(ev); // معاينة التطوير بس
    summary.lastEvent = { t: type, at: ev.at, ...(data.i !== undefined ? { i: data.i } : {}) };
    schedule(URGENT.has(type));
  };

  const setSummary = (patch, urgent = false) => {
    if (!on || stopped) return;
    Object.assign(summary, patch);
    schedule(urgent);
  };

  const stop = () => { flush(); stopped = true; };

  return { log, setSummary, flush, stop, enabled: on };
}
