// بيسجّل كل اللي بيحصل في الامتحان (examTracker.js): فتح الامتحان، كل سؤال اتفتح والوقت عليه،
// كل إجابة واتغيرت ولا لأ، النت فصل/رجع، خرج من الشاشة/رجع، البطارية، الأخطاء، التسليم، والقفل.
import { useEffect, useRef } from 'react';
import { db } from '@services/firebase';
import { createExamTracker, deviceSnapshot } from '@shared/exam/examTracker.js';

const answered = (v) => v !== undefined && v !== null && v !== '' && !(typeof v === 'object' && !v.text && !v.image);

export function useExamTracking({ exam, user, isReviewMode, existingResult, isSubmitted, isCheating, currentQIndex, flatQuestions, answers, flagged, timeLeft, examLocked }) {
  const trackerRef = useRef(null);
  if (!trackerRef.current) {
    trackerRef.current = createExamTracker({ db, exam, user, enabled: !isReviewMode && !existingResult });
  }
  const tr = trackerRef.current;
  const ended = isSubmitted || isCheating;

  // فتح الامتحان + الجهاز
  useEffect(() => {
    if (!tr.enabled) return undefined;
    const resumed = Boolean(exam.resumeData);
    const restarted = (exam.resumeData?.antiCheatLog || []).slice(-1)[0]?.type === 'app_restarted';
    tr.log(restarted ? 'resume' : 'open', { n: flatQuestions.length, left: Math.round(timeLeft || 0), resumed: resumed || undefined, locked: examLocked || undefined });
    tr.setSummary({ device: deviceSnapshot(), network: navigator.onLine === false ? 'offline' : 'online', appState: 'active', trackVersion: 1 }, true);
    return () => tr.flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // السؤال اللي قدامه والوقت على كل سؤال
  const qRef = useRef({ idx: currentQIndex, since: Date.now(), times: { ...(exam.resumeData?.questionTimes || {}) } });
  useEffect(() => {
    if (!tr.enabled || ended) return;
    const s = qRef.current;
    if (s.idx === currentQIndex) return;
    const spent = Math.round((Date.now() - s.since) / 1000);
    const key = String(s.idx + 1);
    s.times[key] = (s.times[key] || 0) + spent;
    tr.log('q', { i: currentQIndex + 1, from: s.idx + 1, spent });
    s.idx = currentQIndex; s.since = Date.now();
    tr.setSummary({ questionTimes: { ...s.times } });
  }, [currentQIndex, ended, tr]);

  // الإجابات: أول إجابة / غيّر إجابته / مسحها
  const prevAnswers = useRef(answers || {});
  const changes = useRef(Number(exam.resumeData?.answerChanges) || 0);
  useEffect(() => {
    if (!tr.enabled || ended) { prevAnswers.current = answers || {}; return; }
    const prev = prevAnswers.current || {};
    const next = answers || {};
    const ids = new Set([...Object.keys(prev), ...Object.keys(next)]);
    ids.forEach((id) => {
      const a = prev[id]; const b = next[id];
      if (JSON.stringify(a) === JSON.stringify(b)) return;
      const i = flatQuestions.findIndex((q) => String(q.id) === String(id)) + 1;
      const q = flatQuestions[i - 1];
      if (q?.type === 'essay' && answered(a) && answered(b) && a?.image === b?.image) return; // كتابة في المقالي: مش كل حرف حدث
      const kind = !answered(a) ? 'first' : !answered(b) ? 'clear' : 'change';
      if (kind === 'change') changes.current += 1;
      tr.log('ans', { i: i || undefined, kind, essay: q?.type === 'essay' ? 1 : undefined, img: q?.type === 'essay' && b?.image && b?.image !== a?.image ? 1 : undefined });
    });
    prevAnswers.current = next;
    tr.setSummary({ answerChanges: changes.current });
  }, [answers, ended, flatQuestions, tr]);

  // علامة المراجعة
  const prevFlags = useRef(flagged || {});
  useEffect(() => {
    if (!tr.enabled || ended) return;
    const prev = prevFlags.current || {};
    Object.keys({ ...prev, ...(flagged || {}) }).forEach((id) => {
      if (Boolean(prev[id]) === Boolean(flagged?.[id])) return;
      const i = flatQuestions.findIndex((q) => String(q.id) === String(id)) + 1;
      tr.log('flag', { i: i || undefined, on: flagged?.[id] ? 1 : 0 });
    });
    prevFlags.current = flagged || {};
  }, [flagged, ended, flatQuestions, tr]);

  // الوقت: فاضل ٥ دقايق / دقيقة / خلص
  const marks = useRef({});
  useEffect(() => {
    if (!tr.enabled || ended || timeLeft == null) return;
    const m = marks.current;
    if (timeLeft <= 300 && timeLeft > 60 && !m.t5) { m.t5 = 1; tr.log('time_5'); }
    if (timeLeft <= 60 && timeLeft > 0 && !m.t1) { m.t1 = 1; tr.log('time_1'); }
    if (timeLeft === 0 && !m.t0) { m.t0 = 1; tr.log('time_up'); }
  }, [timeLeft, ended, tr]);

  // النت، الشاشة، البطارية، الأخطاء، قفل الصفحة
  useEffect(() => {
    if (!tr.enabled || ended) return undefined;
    let offAt = 0; let hideAt = 0;
    const onOffline = () => { offAt = Date.now(); tr.log('offline'); tr.setSummary({ network: 'offline', networkAt: Date.now() }, true); };
    const onOnline = () => { tr.log('online', { secs: offAt ? Math.round((Date.now() - offAt) / 1000) : undefined }); offAt = 0; tr.setSummary({ network: 'online', networkAt: Date.now() }, true); };
    const onVis = () => {
      if (document.hidden) { hideAt = Date.now(); tr.log('hide'); tr.setSummary({ appState: 'background' }, true); }
      else { tr.log('show', { secs: hideAt ? Math.round((Date.now() - hideAt) / 1000) : undefined }); hideAt = 0; tr.setSummary({ appState: 'active' }, true); }
    };
    const native = Boolean(window.Capacitor?.isNativePlatform?.());
    const onBlur = () => { if (!document.hidden && !native) tr.log('blur'); };
    const onErr = (e) => tr.log('error', { msg: String(e?.message || e?.reason?.message || e?.reason || 'خطأ').slice(0, 140) });
    const onHide = () => { tr.log('close'); tr.flush(); };
    const conn = navigator.connection;
    const onConn = () => tr.setSummary({ device: { ...deviceSnapshot() } });
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onErr);
    window.addEventListener('pagehide', onHide);
    conn?.addEventListener?.('change', onConn);

    let battery = null; let lowSent = false;
    const onBat = () => {
      if (!battery) return;
      const level = Math.round(battery.level * 100);
      tr.setSummary({ battery: { level, charging: Boolean(battery.charging) } });
      if (level <= 15 && !battery.charging && !lowSent) { lowSent = true; tr.log('battery_low', { level }); }
    };
    navigator.getBattery?.().then((b) => { battery = b; onBat(); b.addEventListener('levelchange', onBat); b.addEventListener('chargingchange', onBat); }).catch(() => {});

    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onErr);
      window.removeEventListener('pagehide', onHide);
      conn?.removeEventListener?.('change', onConn);
      if (battery) { battery.removeEventListener('levelchange', onBat); battery.removeEventListener('chargingchange', onBat); }
    };
  }, [ended, tr]);

  // بعد التسليم أو القفل: آخر دفعة وخلاص
  useEffect(() => { if (ended) tr.stop(); }, [ended, tr]);

  return tr;
}
