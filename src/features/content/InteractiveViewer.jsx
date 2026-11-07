// نافذة المحتوى التفاعلي / امتحان HTML — شباك سينمائي بهوية المنصة.
// بيتكلم مع صفحة الـHTML عن طريق postMessage (الشرح الكامل في HTML_EXAM_PROMPT_AR.md):
//   المنصة ← الصفحة: { type:'nahhas:init', theme, student:{name}, kind, title, palette }
//   الصفحة ← المنصة: { type:'nahhas:progress', current, total }
//                    { type:'nahhas:result', score, total, correct, wrong, skipped, details? }
//                    { type:'nahhas:close' }
import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '@services/firebase';
import { platformNotify, platformConfirm } from '../../shared/core/platformShared.jsx';
import { Icon } from '@v2/ui/Icon.jsx';
import '@v2/styles/html-window.css';

const n = (x) => Number(x || 0).toLocaleString('ar-EG');
const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const PALETTE = { copper: '#C0592A', gold: '#F2C063', patina: '#13806F', danger: '#C0303F', night: '#0C0907', paper: '#FAF6F1', ink: '#1A120D' };

function ResultSheet({ result, onAgain, onClose }) {
  const pct = Math.max(0, Math.min(100, Math.round(result.percentage)));
  const r = 54; const c = 2 * Math.PI * r;
  const tone = pct >= 75 ? 'is-good' : pct >= 50 ? 'is-mid' : 'is-low';
  const msg = pct >= 90 ? 'ممتاز! مستوى الأوائل' : pct >= 75 ? 'برافو عليك' : pct >= 50 ? 'كويس، وفاضل خطوة' : 'راجع الدرس وجرّب تاني';
  return (
    <div className="hw-result" role="dialog" aria-modal="true">
      <div className={`hw-result__card ${tone}`}>
        <div className="hw-ring">
          <svg viewBox="0 0 128 128" aria-hidden="true">
            <circle cx="64" cy="64" r={r} className="hw-ring__bg" />
            <circle cx="64" cy="64" r={r} className="hw-ring__fg" strokeDasharray={c} style={{ '--off': c - (c * pct) / 100, '--c': c }} transform="rotate(-90 64 64)" />
          </svg>
          <b>{n(pct)}٪</b>
        </div>
        <h3>{msg}</h3>
        <p>درجتك <b>{n(result.score)}</b> من <b>{n(result.total)}</b></p>
        <div className="hw-result__tiles">
          {result.correct != null && <span className="is-right"><Icon name="checkCircle" />{n(result.correct)} صح</span>}
          {result.wrong != null && <span className="is-wrong"><Icon name="mistake" />{n(result.wrong)} غلط</span>}
          {result.skipped ? <span><Icon name="help" />{n(result.skipped)} متروك</span> : null}
        </div>
        {result.saved ? <small className="hw-result__saved"><Icon name="check" />النتيجة اتسجلت وهتظهر للمدرس</small> : result.saving ? <small className="hw-result__saved is-wait"><Icon name="clock" />بنسجّل النتيجة…</small> : null}
        <div className="hw-result__acts">
          <button type="button" className="hw-btn" onClick={onAgain}><Icon name="eye" />شوف إجاباتك</button>
          <button type="button" className="hw-btn hw-btn--pri" onClick={onClose}><Icon name="arrowLeft" />خروج</button>
        </div>
      </div>
    </div>
  );
}

// محاولة واحدة لكل طالب في امتحان الـHTML: فتحه = محاولة، والإعادة بموافقة الأدمن بس.
export const htmlAttemptId = (contentId, uid) => `html_${contentId}_${uid}`;

function GateScreen({ gate, onRequest, onClose }) {
  const a = gate.attempt || {};
  const done = a.status === 'completed';
  const asked = a.studentNotes === 'retake_request';
  const pct = Math.round(Number(a.percentage) || 0);
  const view = {
    checking: { icon: 'shield', title: 'بنتأكد من الامتحان…', body: '' },
    offline: { icon: 'wifiOff', title: 'محتاج نت عشان تبدأ', body: 'الامتحان ده محاولة واحدة، فلازم المنصة تسجّل إنك بدأت. اتأكد من النت وافتحه تاني.' },
    error: { icon: 'alert', title: 'مقدرناش نفتح الامتحان', body: 'جرّب تاني بعد شوية، ولو المشكلة فضلت كلّم المدرس.' },
    blocked: done
      ? { icon: 'checkCircle', title: 'أنت امتحنت الامتحان ده قبل كده', body: `درجتك ${n(a.score)} من ${n(a.total)} (${n(pct)}٪). الامتحان محاولة واحدة، والإعادة بموافقة المدرس بس.` }
      : { icon: 'lock', title: 'الامتحان ده اتقفل', body: 'خرجت من الامتحان قبل ما تسلّم. مش هتقدر تدخله تاني إلا لو المدرس وافق.' },
  }[gate.state] || {};
  return (
    <div className="hw-gate">
      <div className={`hw-gate__card is-${gate.state}${done ? ' is-done' : ''}`}>
        <span className="hw-gate__ico">{gate.state === 'checking' ? <i className="hw-gate__spin" /> : <Icon name={view.icon} />}</span>
        <h3>{view.title}</h3>
        {view.body && <p>{view.body}</p>}
        {gate.state === 'blocked' && (asked
          ? <small className="hw-gate__ok"><Icon name="check" />طلبك اتبعت للمدرس، أول ما يوافق هتقدر تدخل</small>
          : <button type="button" className="hw-btn" onClick={onRequest}><Icon name="message" />اطلب من المدرس يسمحلك تعيده</button>)}
        {gate.state !== 'checking' && <button type="button" className="hw-btn hw-btn--pri" onClick={onClose}><Icon name="arrowLeft" />رجوع</button>}
      </div>
    </div>
  );
}

const InteractiveViewer = ({ content, user, onClose }) => {
  const [iframeSrc, setIframeSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [secs, setSecs] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  const winRef = useRef(null);
  const frameRef = useRef(null);
  const savedRef = useRef(false);
  const isExam = content?.type === 'interactive_exam';
  const studentName = user?.name || user?.displayName || '';
  const uid = auth.currentUser?.uid || '';
  const isStaff = ['admin', 'teacher', 'assistant', 'owner', 'superadmin'].includes(String(user?.role || '').toLowerCase());
  // القفل للطالب المسجّل بس (الزائر في الصفحة الرئيسية والأدمن بيشوفوه عادي)
  const locked = isExam && Boolean(uid) && Boolean(content?.id) && !isStaff;
  const [gate, setGate] = useState(() => (import.meta.env.DEV && typeof window !== 'undefined' && window.__nxHtmlGate) || { state: locked ? 'checking' : 'open' }); // معاينة التطوير بس
  const attemptRef = useRef(null);
  const finishedRef = useRef(false);
  const latestSecs = useRef(0);
  const resultSent = useRef(false);

  useEffect(() => {
    if (!locked) return undefined;
    let alive = true;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'exam_results'), where('studentId', '==', uid), where('examId', '==', content.id)));
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const grant = rows.find((r) => r.adminDecision === 'restart' && r.status === 'retake_allowed');
        const ref = doc(db, 'exam_results', grant?.id || htmlAttemptId(content.id, uid));
        if (grant) {
          await updateDoc(ref, { status: 'in_progress', adminDecision: 'restart_consumed', startedAtMillis: Date.now(), updatedAt: serverTimestamp() });
        } else if (rows.length) {
          if (alive) setGate({ state: 'blocked', attempt: rows.sort((a, b) => (b.status === 'completed') - (a.status === 'completed'))[0] });
          return;
        } else {
          await setDoc(ref, {
            examId: content.id, examTitle: content.title || 'امتحان تفاعلي', kind: 'html', grade: content.grade || user?.grade || '',
            studentId: uid, studentName: studentName || 'طالب', status: 'in_progress', startedAtMillis: Date.now(), createdAt: serverTimestamp(),
          });
        }
        attemptRef.current = ref;
        if (alive) setGate({ state: 'open' });
      } catch (e) {
        console.warn('html exam gate', e?.code || e?.message);
        if (alive) setGate({ state: navigator.onLine === false || e?.code === 'unavailable' ? 'offline' : 'error' });
      }
    })();
    return () => { alive = false; };
  }, [locked, uid, content?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // خرج من غير ما يسلّم (زرار خروج، رجوع، قفل التطبيق): المحاولة تتقفل
  const markExited = useCallback(() => {
    if (!attemptRef.current || finishedRef.current || resultSent.current) return;
    finishedRef.current = true;
    updateDoc(attemptRef.current, { status: 'exited', timeTaken: latestSecs.current, updatedAt: serverTimestamp() }).catch(() => {});
  }, []);
  useEffect(() => () => markExited(), [markExited]);

  const requestRetake = async () => {
    const a = gate.attempt;
    if (!a?.id) return;
    try {
      await updateDoc(doc(db, 'exam_results', a.id), { studentNotes: 'retake_request', updatedAt: serverTimestamp() });
      setGate((g) => ({ ...g, attempt: { ...g.attempt, studentNotes: 'retake_request' } }));
    } catch { platformNotify('الطلب ماتبعتش، جرّب تاني.'); }
  };

  useEffect(() => {
    if (gate.state !== 'open') return undefined;
    let blobUrl = null;
    setLoading(true);
    if (content.htmlContent) {
      blobUrl = URL.createObjectURL(new Blob([content.htmlContent], { type: 'text/html;charset=utf-8' }));
      setIframeSrc(blobUrl);
    } else if (content.url?.startsWith('data:')) {
      fetch(content.url).then((res) => res.blob()).then((blob) => { blobUrl = URL.createObjectURL(blob); setIframeSrc(blobUrl); }).catch(() => setIframeSrc(content.url));
    } else {
      setIframeSrc(content.url);
    }
    return () => blobUrl && URL.revokeObjectURL(blobUrl);
  }, [content.url, content.htmlContent, reloadKey, gate.state]);

  // حماية + عدّاد الوقت + حالة النت
  useEffect(() => {
    const block = (e) => e.preventDefault();
    const onKey = (e) => { if (e.key === 'PrintScreen') platformNotify('غير مسموح بأخذ لقطات شاشة! المحتوى محمي.', 'error'); };
    const t = setInterval(() => setSecs((s) => { latestSecs.current = s + 1; return s + 1; }), 1000);
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener('keydown', onKey);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    document.documentElement.classList.add('hw-open');
    return () => {
      clearInterval(t);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      window.removeEventListener('online', on); window.removeEventListener('offline', off);
      document.documentElement.classList.remove('hw-open');
    };
  }, []);

  const sendInit = useCallback(() => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    try {
      frameRef.current?.contentWindow?.postMessage({ type: 'nahhas:init', theme, kind: isExam ? 'exam' : 'lesson', title: content.title || '', student: { name: studentName }, palette: PALETTE }, '*');
    } catch { /* الصفحة مش بتسمع */ }
  }, [content.title, isExam, studentName]);

  const latest = useRef({});
  latest.current = { content, user, studentName, secs };
  const saveResult = useCallback(async (r) => {
    const { content, user } = latest.current;
    if (!attemptRef.current || savedRef.current) return false;
    savedRef.current = true;
    finishedRef.current = true;
    try {
      // المفاتيح دي بس المسموح للطالب يكتبها في محاولته (قواعد Firestore)
      await updateDoc(attemptRef.current, {
        status: 'completed', score: r.score, total: r.total, totalPossible: r.total, percentage: Math.round(r.percentage),
        timeTaken: latestSecs.current, submittedAt: serverTimestamp(), examTitle: content.title || 'امتحان تفاعلي', grade: content.grade || user?.grade || '',
        performanceAnalysis: { correct: r.correct ?? null, wrong: r.wrong ?? null, skipped: r.skipped ?? 0, details: Array.isArray(r.details) ? r.details.slice(0, 200) : [] },
      });
      return true;
    } catch (e) { console.warn('html result not saved', e?.message); savedRef.current = false; finishedRef.current = false; return false; }
  }, []);

  // رسائل صفحة الـHTML
  useEffect(() => {
    const onMsg = async (e) => {
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;
      const d = e.data || {};
      if (typeof d !== 'object' || !String(d.type || '').startsWith('nahhas:')) return;
      if (d.type === 'nahhas:ready') sendInit();
      if (d.type === 'nahhas:progress') setProgress({ current: Number(d.current) || 0, total: Number(d.total) || 0 });
      if (d.type === 'nahhas:close') onClose?.();
      if (d.type === 'nahhas:result') {
        const total = Math.max(0, Number(d.total) || 0);
        const score = Math.max(0, Math.min(total || Infinity, Number(d.score) || 0));
        const r = { score, total, percentage: total ? (score / total) * 100 : Number(d.percentage) || 0, correct: d.correct ?? null, wrong: d.wrong ?? null, skipped: d.skipped ?? 0, details: d.details };
        setResult({ ...r, saving: isExam && Boolean(attemptRef.current) }); setShowResult(true);
        if (isExam && (savedRef.current || resultSent.current)) return; // نتيجة واحدة بس
        resultSent.current = true;
        if (!isExam || !attemptRef.current) return;
        // لو النت فاصل: نفضل نحاول لحد ما النتيجة تتسجل
        for (let i = 0; i < 40; i += 1) {
          if (await saveResult(r)) { setResult((x) => (x ? { ...x, saved: true, saving: false } : x)); return; }
          if (i === 0) platformNotify('النتيجة لسه ماتسجلتش، خليك في الصفحة لحد ما النت يرجع.');
          await new Promise((res) => setTimeout(res, 5000));
        }
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [sendInit, saveResult, isExam, onClose]);

  const exit = async () => {
    if (locked && gate.state === 'open' && !result) {
      const ok = await platformConfirm('لو خرجت دلوقتي الامتحان هيتقفل، ومش هتقدر تمتحنه تاني إلا بموافقة المدرس. تخرج؟');
      if (!ok) return;
      markExited();
    }
    onClose?.();
  };
  const fullscreen = () => {
    const el = winRef.current;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (el?.requestFullscreen || el?.webkitRequestFullscreen)?.call(el);
  };
  const pct = progress?.total ? Math.round((progress.current / progress.total) * 100) : null;

  return (
    <div className="hw" dir="rtl" onContextMenu={(e) => e.preventDefault()}>
      <span className="hw-glow hw-glow--a" aria-hidden="true" /><span className="hw-glow hw-glow--b" aria-hidden="true" />
      <section ref={winRef} className={`hw-win${isExam ? ' is-exam' : ''}`} aria-label={content.title || 'محتوى تفاعلي'}>
        <header className="hw-head">
          <span className="hw-badge"><Icon name={isExam ? 'exam' : 'interactive'} /></span>
          <div className="hw-head__txt">
            <small>{isExam ? 'امتحان تفاعلي' : 'درس تفاعلي'}</small>
            <h2>{content.title || 'المحتوى التفاعلي'}</h2>
          </div>
          <div className="hw-head__acts">
            {pct !== null && <span className="hw-chip is-prog" title="الأسئلة"><Icon name="checkCircle" /><bdi>{n(progress.current)} / {n(progress.total)}</bdi></span>}
            {gate.state === 'open' && <span className="hw-chip" title="الوقت"><Icon name="clock" /><bdi dir="ltr">{clock(secs)}</bdi></span>}
            {result && <button type="button" className="hw-chip is-score" onClick={() => setShowResult(true)}><Icon name="trophy" />{n(Math.round(result.percentage))}٪</button>}
            {!isExam && <button type="button" className="hw-icon" title="إعادة تحميل" onClick={() => { savedRef.current = false; setResult(null); setProgress(null); setReloadKey((k) => k + 1); }}><Icon name="refresh" /></button>}
            <button type="button" className="hw-icon hw-hide-m" title="ملء الشاشة" onClick={fullscreen}><Icon name="external" /></button>
            <button type="button" className="hw-exit" onClick={exit}><Icon name="close" /><span>خروج</span></button>
          </div>
          {pct !== null && <div className="hw-prog" aria-label={`سؤال ${progress.current} من ${progress.total}`}><i style={{ width: `${pct}%` }} /></div>}
        </header>

        <div className="hw-stage">
          {gate.state !== 'open' && <GateScreen gate={gate} onRequest={requestRetake} onClose={onClose} />}
          {gate.state === 'open' && loading && (
            <div className="hw-loading">
              <div className="hw-loading__orb"><Icon name={isExam ? 'exam' : 'interactive'} /></div>
              <b>{isExam ? 'بنجهّز الامتحان…' : 'بنجهّز الدرس…'}</b>
              <div className="hw-skel"><i /><i /><i /></div>
            </div>
          )}
          {studentName && <div className="hw-wm" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i}>{studentName}</span>)}</div>}
          {gate.state === 'open' && <iframe
            key={reloadKey}
            ref={frameRef}
            src={iframeSrc || undefined}
            onLoad={() => { setLoading(false); sendInit(); }}
            className="hw-frame"
            title={content.title || 'محتوى تفاعلي'}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            allow="fullscreen; autoplay"
          />}
          {showResult && result && <ResultSheet result={result} onAgain={() => setShowResult(false)} onClose={onClose} />}
        </div>

        <footer className="hw-foot">
          <span><Icon name="shield" />محتوى محمي</span>
          {studentName && <span><Icon name="user" />{studentName}</span>}
          <span className={online ? '' : 'is-off'}><Icon name={online ? 'live' : 'wifiOff'} />{online ? 'متصل' : 'مفيش نت'}</span>
        </footer>
      </section>
    </div>
  );
};

export default InteractiveViewer;
