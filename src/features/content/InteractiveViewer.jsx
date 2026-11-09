// نافذة المحتوى التفاعلي / امتحان HTML — شباك سينمائي بهوية المنصة.
// بيتكلم مع صفحة الـHTML عن طريق postMessage (الشرح الكامل في HTML_EXAM_PROMPT_AR.md):
//   المنصة ← الصفحة: { type:'nahhas:init', theme, student:{name}, kind, title, palette, durationMinutes, endsAt }
//                    { type:'nahhas:timeup' }   الوقت خلص: الصفحة تسلّم فورًا باللي اتجاوب
//                    { type:'nahhas:locked' }   الطالب اتحظر: الصفحة توقف كل حاجة
//   الصفحة ← المنصة: { type:'nahhas:ready' } | { type:'nahhas:progress', current, total }
//                    { type:'nahhas:result', score, total, correct, wrong, skipped, details? } | { type:'nahhas:close' }
// امتحان HTML للطالب: محاولة واحدة، وقت بيتسلّم لوحده، وخروج من الشاشة = تحذير ثم حظر (الفك من الأدمن بس).
import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '@services/firebase';
import { platformNotify, platformConfirm } from '../../shared/core/platformShared.jsx';
import { isExamLockSupported, requestExamLock, releaseExamLock, blockBackButton, useExamLockWatch, wasScreenTurnedOff } from '@features/native-app/examLock.js';
import { markExamPage } from '@features/native-app/examLockGuard.js';
import { Icon } from '@v2/ui/Icon.jsx';
import '@v2/styles/html-window.css';

const n = (x) => Number(x || 0).toLocaleString('ar-EG');
const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
// معاينة التطوير بس: تجربة الامتحان من غير قاعدة بيانات
const devTest = () => Boolean(import.meta.env.DEV && typeof window !== 'undefined' && window.__nxHtmlExamTest);
const upd = (ref, data) => (devTest() ? Promise.resolve() : updateDoc(ref, data));
const PALETTE = { copper: '#C0592A', gold: '#F2C063', patina: '#13806F', danger: '#C0303F', night: '#0C0907', paper: '#FAF6F1', ink: '#1A120D' };

function ResultSheet({ result, onAgain, onClose, onReview, onPractice, practice }) {
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
        {practice && <small className="hw-result__saved is-wait"><Icon name="info" />ده تدريب — الدرجة مابتتسجلش</small>}
        {result.saved ? <small className="hw-result__saved"><Icon name="check" />النتيجة اتسجلت وهتظهر للمدرس</small> : result.saving ? <small className="hw-result__saved is-wait"><Icon name="clock" />بنسجّل النتيجة…</small> : null}
        <div className="hw-result__acts">
          {Array.isArray(result.details) && result.details.length > 0
            ? <button type="button" className="hw-btn" onClick={onReview}><Icon name="mistake" />راجع أخطاءك</button>
            : <button type="button" className="hw-btn" onClick={onAgain}><Icon name="eye" />شوف إجاباتك</button>}
          <button type="button" className="hw-btn hw-btn--pri" onClick={onClose}><Icon name="arrowLeft" />خروج</button>
        </div>
        {onPractice && <button type="button" className="hw-link" onClick={onPractice}><Icon name="refresh" />حلّه تاني للتدريب{practice ? '' : ' (درجتك الرسمية مش هتتغير)'}</button>}
      </div>
    </div>
  );
}

// محاولة واحدة لكل طالب في امتحان الـHTML: فتحه = محاولة، والإعادة بموافقة الأدمن بس.
export const htmlAttemptId = (contentId, uid) => `html_${contentId}_${uid}`;
const toMs = (v) => (v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
const fmtWhen = (ms) => new Date(ms).toLocaleString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
const STRIKE_LABEL = { hidden: 'خرج من الشاشة / غيّر التبويب', blur: 'فتح شباك تاني', unpin: 'فك تثبيت الشاشة' };

// Firestore مابيقبلش undefined، ونقصّ النصوص الطويلة
const cleanDetails = (list) => (Array.isArray(list) ? list.slice(0, 200) : []).map((d) => {
  const o = JSON.parse(JSON.stringify(d || {}));
  ['text', 'explain'].forEach((k) => { if (o[k]) o[k] = String(o[k]).slice(0, 1500); });
  if (Array.isArray(o.options)) o.options = o.options.slice(0, 8).map((x) => String(typeof x === 'object' ? JSON.stringify(x) : x).slice(0, 400));
  return o;
});
const strip = (h) => String(h ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

// مراجعة الأخطاء: من التفاصيل اللي الصفحة بعتتها مع النتيجة
function ReviewSheet({ details = [], summary, onClose }) {
  const [only, setOnly] = useState('wrong');
  const items = details.map((d, i) => ({ ...d, n: d.n || i + 1, state: d.ok ? 'right' : d.answer === undefined || d.answer === null || d.answer === '' ? 'skipped' : 'wrong' }));
  const wrong = items.filter((x) => x.state !== 'right');
  const list = only === 'wrong' ? wrong : items;
  const optText = (d, k) => (Array.isArray(d.options) && d.options[k] !== undefined ? strip(d.options[k]) : `الاختيار ${LETTERS[k] || Number(k) + 1}`);
  return (
    <div className="hw-review" role="dialog" aria-modal="true">
      <header className="hw-review__head">
        <div><small>مراجعة الامتحان</small><h3>{summary || 'إجاباتك'}</h3></div>
        <div className="hw-review__tabs">
          <button type="button" className={only === 'wrong' ? 'is-on' : ''} onClick={() => setOnly('wrong')}>الأخطاء والمتروك <i>{n(wrong.length)}</i></button>
          <button type="button" className={only === 'all' ? 'is-on' : ''} onClick={() => setOnly('all')}>كل الأسئلة <i>{n(items.length)}</i></button>
        </div>
        <button type="button" className="hw-icon" title="إغلاق" onClick={onClose}><Icon name="close" /></button>
      </header>
      <div className="hw-review__list">
        {!list.length && <div className="hw-review__empty"><Icon name="trophy" /><b>مفيش ولا غلطة!</b><span>جاوبت كل الأسئلة صح.</span></div>}
        {list.map((d) => (
          <article key={d.n} className={`hw-q is-${d.state}`}>
            <header>
              <span className="hw-q__n">{n(d.n)}</span>
              {d.branch && <span className="hw-q__tag">{strip(d.branch)}</span>}
              <span className="hw-q__pts">{n(d.points || 0)} / {n(d.max || 0)}</span>
              <span className={`hw-q__state is-${d.state}`}><Icon name={d.state === 'right' ? 'checkCircle' : d.state === 'wrong' ? 'mistake' : 'help'} />{d.state === 'right' ? 'صح' : d.state === 'wrong' ? 'غلط' : 'متروك'}</span>
            </header>
            {d.text ? <p className="hw-q__text">{strip(d.text)}</p> : <p className="hw-q__text is-dim">سؤال رقم {n(d.n)}</p>}
            {Array.isArray(d.options) && d.options.length > 0 ? (
              <div className="hw-q__opts">
                {d.options.map((o, k) => {
                  const right = Number(d.correct) === k; const mine = d.answer !== undefined && d.answer !== null && Number(d.answer) === k;
                  return <div key={k} className={`hw-q__opt${right ? ' is-right' : mine ? ' is-wrong' : ''}`}><i>{LETTERS[k] || k + 1}</i><span>{strip(o)}</span>{right ? <em>الإجابة الصح</em> : mine ? <em>إجابتك</em> : null}</div>;
                })}
              </div>
            ) : (
              <div className="hw-q__pair">
                <span className="is-wrong">إجابتك: {d.answer === undefined || d.answer === null || d.answer === '' ? 'متروك' : optText(d, d.answer)}</span>
                {d.correct !== undefined && <span className="is-right">الصح: {optText(d, d.correct)}</span>}
              </div>
            )}
            {d.explain && <p className="hw-q__why"><Icon name="info" />{strip(d.explain)}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

function GateScreen({ gate, rules, onStart, onRequest, onClose, onReview, onPractice }) {
  const a = gate.attempt || {};
  const done = a.status === 'completed';
  const asked = a.studentNotes === 'retake_request';
  const pct = Math.round(Number(a.percentage) || 0);
  const blockedView = done
    ? { icon: 'checkCircle', tone: 'done', title: 'أنت امتحنت الامتحان ده قبل كده', body: `درجتك ${n(a.score)} من ${n(a.total)} (${n(pct)}٪). الامتحان محاولة واحدة، والإعادة بموافقة المدرس بس.` }
    : a.status === 'cheated'
      ? { icon: 'shield', tone: 'bad', title: 'اتحظرت من الامتحان ده', body: 'خرجت من شاشة الامتحان بعد التحذير. الحظر مايتفكش غير من المدرس.' }
      : a.status === 'timed_out'
        ? { icon: 'clock', tone: 'bad', title: 'وقت الامتحان خلص', body: 'الامتحان اتقفل لما الوقت خلص. الإعادة بموافقة المدرس بس.' }
        : { icon: 'lock', tone: 'bad', title: 'الامتحان ده اتقفل', body: 'خرجت من الامتحان قبل ما تسلّم. مش هتقدر تدخله تاني إلا لو المدرس وافق.' };
  const view = {
    checking: { icon: 'shield', title: 'بنتأكد من الامتحان…', body: '' },
    starting: { icon: 'shield', title: 'بنجهّز الامتحان…', body: '' },
    offline: { icon: 'wifiOff', tone: 'wait', title: 'محتاج نت عشان تبدأ', body: 'الامتحان ده محاولة واحدة، فلازم المنصة تسجّل إنك بدأت. اتأكد من النت وافتحه تاني.' },
    error: { icon: 'alert', tone: 'bad', title: 'مقدرناش نفتح الامتحان', body: 'جرّب تاني بعد شوية، ولو المشكلة فضلت كلّم المدرس.' },
    expired: { icon: 'calendar', tone: 'bad', title: 'ميعاد الامتحان خلص', body: `الامتحان كان متاح لحد ${gate.until ? fmtWhen(gate.until) : ''}.` },
    banned: { icon: 'shield', tone: 'bad', title: 'اتحظرت من الامتحان', body: 'خرجت من شاشة الامتحان تاني بعد التحذير، فالامتحان اتقفل واتسجّل غش. الحظر مايتفكش غير من المدرس.' },
    timeup: { icon: 'clock', tone: 'bad', title: 'الوقت خلص', body: 'الامتحان اتقفل لما الوقت خلص، والصفحة دي ماسلّمتش إجاباتك لوحدها. كلّم المدرس.' },
    blocked: blockedView,
  }[gate.state] || {};

  if (gate.state === 'ready') {
    return (
      <div className="hw-gate">
        <div className="hw-gate__card hw-rules">
          <span className="hw-gate__ico is-gold"><Icon name="exam" /></span>
          <h3>قبل ما تبدأ</h3>
          <ul>
            {rules.duration ? <li><Icon name="clock" /><span>وقت الامتحان <b>{n(rules.duration)} دقيقة</b>. لما يخلص، الامتحان بيتسلّم لوحده.</span></li> : null}
            {rules.until ? <li><Icon name="calendar" /><span>متاح لحد <b>{fmtWhen(rules.until)}</b>.</span></li> : null}
            <li><Icon name="lock" /><span><b>محاولة واحدة بس.</b> أول ما تدوس «ابدأ» تتحسب عليك، ولو خرجت قبل التسليم الامتحان بيتقفل.</span></li>
            <li><Icon name="alert" /><span>لو غيّرت التبويب أو خرجت من الشاشة: <b>أول مرة تحذير</b>، والمرة التانية <b>حظر من الامتحان</b> مايتفكش غير من المدرس.</span></li>
            {rules.native ? <li><Icon name="shield" /><span>التطبيق هيطلب يثبّت الشاشة، وافق عشان تقدر تمتحن.</span></li> : null}
          </ul>
          <button type="button" className="hw-btn hw-btn--pri" onClick={onStart}><Icon name="check" />موافق، ابدأ الامتحان</button>
          <button type="button" className="hw-btn" onClick={onClose}><Icon name="arrowLeft" />مش دلوقتي</button>
        </div>
      </div>
    );
  }
  return (
    <div className="hw-gate">
      <div className={`hw-gate__card is-${view.tone || 'wait'}`}>
        <span className="hw-gate__ico">{['checking', 'starting'].includes(gate.state) ? <i className="hw-gate__spin" /> : <Icon name={view.icon} />}</span>
        <h3>{view.title}</h3>
        {view.body && <p>{view.body}</p>}
        {gate.state === 'blocked' && done && (
          <>
            {(a.performanceAnalysis?.details || []).length > 0 && <button type="button" className="hw-btn hw-btn--pri" onClick={onReview}><Icon name="mistake" />راجع أخطاءك</button>}
            <button type="button" className="hw-btn" onClick={onPractice}><Icon name="refresh" />حلّه تاني للتدريب</button>
            <small className="hw-gate__note">التدريب مابيغيّرش درجتك الرسمية.</small>
          </>
        )}
        {['blocked', 'banned', 'timeup'].includes(gate.state) && a.id && !done && (asked
          ? <small className="hw-gate__ok"><Icon name="check" />طلبك اتبعت للمدرس، أول ما يوافق هتقدر تدخل</small>
          : <button type="button" className="hw-btn" onClick={onRequest}><Icon name="message" />اطلب من المدرس يسمحلك تعيده</button>)}
        {!['checking', 'starting'].includes(gate.state) && <button type="button" className={`hw-btn${gate.state === 'blocked' && done ? '' : ' hw-btn--pri'}`} onClick={onClose}><Icon name="arrowLeft" />رجوع</button>}
      </div>
    </div>
  );
}

function WarningSheet({ reason, onBack }) {
  return (
    <div className="hw-result hw-warn" role="alertdialog" aria-modal="true">
      <div className="hw-gate__card is-bad">
        <span className="hw-gate__ico"><Icon name="alert" /></span>
        <h3>تحذير أول وأخير</h3>
        <p>اتسجّل إنك {reason || 'خرجت من شاشة الامتحان'}. <b>لو حصلت تاني هتتحظر من الامتحان</b>، والحظر مايتفكش غير من المدرس.</p>
        <button type="button" className="hw-btn hw-btn--pri" onClick={onBack}><Icon name="arrowLeft" />فاهم، رجّعني للامتحان</button>
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
  const [warning, setWarning] = useState(null);
  const [timeUpPending, setTimeUpPending] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [practice, setPractice] = useState(false);
  const [review, setReview] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  const winRef = useRef(null);
  const frameRef = useRef(null);
  const savedRef = useRef(false);
  const isExam = content?.type === 'interactive_exam';
  const studentName = user?.name || user?.displayName || '';
  const uid = auth.currentUser?.uid || '';
  const isStaff = ['admin', 'teacher', 'assistant', 'owner', 'superadmin'].includes(String(user?.role || '').toLowerCase());
  // القفل للطالب المسجّل بس (الزائر في الصفحة الرئيسية والأدمن بيشوفوه عادي)
  const locked = isExam && (devTest() || (Boolean(uid) && Boolean(content?.id) && !isStaff));
  const durationMin = Math.max(0, Number(content?.examDurationMinutes) || 0);
  const untilMs = toMs(content?.availableUntil);
  const native = isExamLockSupported();
  const [gate, setGate] = useState(() => (import.meta.env.DEV && typeof window !== 'undefined' && window.__nxHtmlGate) || { state: locked ? 'checking' : 'open' }); // معاينة التطوير بس
  const attemptRef = useRef(null);
  const grantRef = useRef(null);
  const finishedRef = useRef(false);
  const latestSecs = useRef(0);
  const resultSent = useRef(false);
  const deadlineRef = useRef(0);
  const strikesRef = useRef([]);
  const bypassRef = useRef(false);
  const examRunning = locked && !practice && gate.state === 'open' && !result && !timeUpPending;

  // ١) فحص: امتحنه قبل كده؟ الميعاد خلص؟
  useEffect(() => {
    if (!locked || gate.state !== 'checking') return undefined;
    let alive = true;
    (async () => {
      try {
        if (devTest()) { if (alive) setGate({ state: 'ready' }); return; }
        const snap = await getDocs(query(collection(db, 'exam_results'), where('studentId', '==', uid), where('examId', '==', content.id)));
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const grant = rows.find((r) => r.adminDecision === 'restart' && r.status === 'retake_allowed');
        if (!alive) return;
        if (!grant && rows.length) return setGate({ state: 'blocked', attempt: rows.sort((a, b) => (b.status === 'completed') - (a.status === 'completed'))[0] });
        if (!grant && untilMs && Date.now() > untilMs) return setGate({ state: 'expired', until: untilMs });
        grantRef.current = grant || null;
        setGate({ state: 'ready' });
      } catch (e) {
        console.warn('html exam gate', e?.code || e?.message);
        if (alive) setGate({ state: navigator.onLine === false || e?.code === 'unavailable' ? 'offline' : 'error' });
      }
    })();
    return () => { alive = false; };
  }, [locked, uid, content?.id, gate.state, untilMs]);

  // ٢) «ابدأ»: تتسجل المحاولة، تتثبت الشاشة على التطبيق، ويبدأ العدّاد
  const start = async () => {
    setGate({ state: 'starting' });
    const startMs = Date.now();
    const grant = grantRef.current;
    const ref = devTest() ? { id: 'dev-test' } : doc(db, 'exam_results', grant?.id || htmlAttemptId(content.id, uid));
    try {
      if (devTest()) { /* من غير حفظ */ } else if (grant) {
        await updateDoc(ref, { status: 'in_progress', adminDecision: 'restart_consumed', startedAtMillis: startMs, totalTime: durationMin * 60, antiCheatWarnings: 0, antiCheatLog: [], securityReason: '', updatedAt: serverTimestamp() });
      } else {
        await setDoc(ref, {
          examId: content.id, examTitle: content.title || 'امتحان تفاعلي', kind: 'html', grade: content.grade || user?.grade || '',
          studentId: uid, studentName: studentName || 'طالب', status: 'in_progress', startedAtMillis: startMs, totalTime: durationMin * 60,
          antiCheatWarnings: 0, antiCheatLog: [], createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('html exam start', e?.code || e?.message);
      return setGate({ state: navigator.onLine === false || e?.code === 'unavailable' ? 'offline' : 'error' });
    }
    attemptRef.current = ref;
    const ends = [durationMin ? startMs + durationMin * 60000 : 0, untilMs || 0].filter(Boolean);
    deadlineRef.current = ends.length ? Math.min(...ends) : 0;
    setSecs(0); latestSecs.current = 0;
    if (native) {
      markExamPage(true);
      bypassRef.current = true; // رسالة أندرويد بتاخد الفوكس
      setPinned(await requestExamLock());
      setTimeout(() => { bypassRef.current = false; }, 1500);
    }
    setGate({ state: 'open' });
  };

  // خرج من غير ما يسلّم (زرار خروج، رجوع، قفل التطبيق): المحاولة تتقفل
  const markExited = useCallback(() => {
    if (!attemptRef.current || finishedRef.current || resultSent.current) return;
    finishedRef.current = true;
    upd(attemptRef.current, { status: 'exited', timeTaken: latestSecs.current, leftAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(() => {});
  }, []);
  useEffect(() => () => { markExited(); if (native) { releaseExamLock(); markExamPage(false); } }, [markExited, native]);
  useEffect(() => { if (native && (result || ['banned', 'timeup'].includes(gate.state))) { releaseExamLock(); markExamPage(false); } }, [native, result, gate.state]);

  // تدريب بعد ما امتحن: نفس الصفحة، من غير وقت ولا مراقبة ولا تسجيل
  const startPractice = () => {
    setPractice(true); setResult(null); setShowResult(false); setProgress(null); setReview(null); setWarning(null);
    resultSent.current = false; setSecs(0); latestSecs.current = 0;
    setReloadKey((k) => k + 1);
    setGate({ state: 'open' });
  };

  const requestRetake = async () => {
    const id = gate.attempt?.id || attemptRef.current?.id;
    if (!id) return;
    try {
      await updateDoc(doc(db, 'exam_results', id), { studentNotes: 'retake_request', updatedAt: serverTimestamp() });
      setGate((g) => ({ ...g, attempt: { ...(g.attempt || { id }), studentNotes: 'retake_request' } }));
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

  // حماية + العدّاد + حالة النت
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

  const post = useCallback((msg) => { try { frameRef.current?.contentWindow?.postMessage(msg, '*'); } catch { /* الصفحة مش بتسمع */ } }, []);
  const sendInit = useCallback(() => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    post({ type: 'nahhas:init', theme, kind: isExam ? (practice ? 'practice' : 'exam') : 'lesson', practice, title: content.title || '', student: { name: studentName }, palette: PALETTE, durationMinutes: durationMin || null, endsAt: deadlineRef.current || null });
  }, [post, content.title, isExam, studentName, durationMin, practice]);

  const latest = useRef({});
  latest.current = { content, user };
  const saveResult = useCallback(async (r) => {
    const { content, user } = latest.current;
    if (!attemptRef.current || savedRef.current) return false;
    savedRef.current = true;
    finishedRef.current = true;
    try {
      // المفاتيح دي بس المسموح للطالب يكتبها في محاولته (قواعد Firestore)
      await upd(attemptRef.current, {
        status: 'completed', score: r.score, total: r.total, totalPossible: r.total, percentage: Math.round(r.percentage),
        timeTaken: latestSecs.current, submittedAt: serverTimestamp(), examTitle: content.title || 'امتحان تفاعلي', grade: content.grade || user?.grade || '',
        antiCheatWarnings: strikesRef.current.length, antiCheatLog: strikesRef.current,
        performanceAnalysis: { correct: r.correct ?? null, wrong: r.wrong ?? null, skipped: r.skipped ?? 0, details: cleanDetails(r.details), autoSubmitted: Boolean(r.auto) },
      });
      return true;
    } catch (e) { console.warn('html result not saved', e?.message); savedRef.current = false; finishedRef.current = false; return false; }
  }, []);

  // ٣) الغش: أول مرة تحذير، التانية حظر
  const strike = useCallback((kind) => {
    if (!attemptRef.current || finishedRef.current || resultSent.current || bypassRef.current) return;
    const last = strikesRef.current[strikesRef.current.length - 1];
    if (last && Date.now() - last.at < 2500) return; // نفس الخروجة بتطلع أكتر من حدث
    strikesRef.current = [...strikesRef.current, { type: kind, at: Date.now(), sec: latestSecs.current }];
    const count = strikesRef.current.length;
    if (count === 1) {
      setWarning(STRIKE_LABEL[kind]);
      upd(attemptRef.current, { antiCheatWarnings: 1, antiCheatLog: strikesRef.current, updatedAt: serverTimestamp() }).catch(() => {});
      return;
    }
    finishedRef.current = true;
    post({ type: 'nahhas:locked', reason: 'cheating' });
    setWarning(null);
    upd(attemptRef.current, { status: 'cheated', securityReason: STRIKE_LABEL[kind] || kind, securityHoldAt: serverTimestamp(), antiCheatWarnings: count, antiCheatLog: strikesRef.current, timeTaken: latestSecs.current, updatedAt: serverTimestamp() }).catch(() => {});
    setGate({ state: 'banned', attempt: { id: attemptRef.current.id, status: 'cheated' } });
  }, [post]);

  useEffect(() => {
    if (!examRunning) return undefined;
    let hiddenAt = 0;
    const onVis = async () => {
      if (document.hidden) { hiddenAt = Date.now(); return; }
      if (!hiddenAt) return;
      const at = hiddenAt; hiddenAt = 0;
      if (native && await wasScreenTurnedOff(at)) return; // قفل الشاشة مش غش
      strike('hidden');
    };
    // شباك تاني على الكمبيوتر (الضغط جوه الامتحان نفسه بيعمل blur برضه، فبنتجاهله)
    const onBlur = () => setTimeout(() => {
      if (native || document.hidden || document.activeElement === frameRef.current) return;
      strike('blur');
    }, 60);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    const unBack = blockBackButton(() => platformNotify('مينفعش تخرج من الامتحان قبل ما تسلّم.'));
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('blur', onBlur); unBack(); };
  }, [examRunning, native, strike]);
  const lockWatch = useExamLockWatch({ enabled: examRunning && native && pinned, onBroken: () => strike('unpin'), bypassRef });

  // ٤) الوقت: لما يخلص المنصة بتطلب من الصفحة تسلّم، ولو ماسلّمتش في ٦ ثواني الامتحان بيتقفل
  const remaining = deadlineRef.current ? Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)) : null;
  useEffect(() => {
    if (!examRunning || remaining === null || remaining > 0) return undefined;
    setTimeUpPending(true);
    setWarning(null);
    post({ type: 'nahhas:timeup' });
    const id = setTimeout(() => {
      if (resultSent.current) return;
      finishedRef.current = true;
      if (attemptRef.current) upd(attemptRef.current, { status: 'timed_out', timeTaken: latestSecs.current, antiCheatWarnings: strikesRef.current.length, antiCheatLog: strikesRef.current, updatedAt: serverTimestamp() }).catch(() => {});
      setGate({ state: 'timeup', attempt: attemptRef.current ? { id: attemptRef.current.id, status: 'timed_out' } : undefined });
      setTimeUpPending(false);
    }, 6000);
    return () => clearTimeout(id);
  }, [examRunning, remaining, post]);

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
        if (isExam && resultSent.current) return; // نتيجة واحدة بس
        if (locked && !practice && finishedRef.current && !savedRef.current) return; // اتحظر أو الوقت خلص قبلها
        const total = Math.max(0, Number(d.total) || 0);
        const score = Math.max(0, Math.min(total || Infinity, Number(d.score) || 0));
        const r = { score, total, percentage: total ? (score / total) * 100 : Number(d.percentage) || 0, correct: d.correct ?? null, wrong: d.wrong ?? null, skipped: d.skipped ?? 0, details: d.details, auto: timeUpPending };
        resultSent.current = true;
        setTimeUpPending(false);
        setWarning(null);
        setResult({ ...r, saving: isExam && !practice && Boolean(attemptRef.current) }); setShowResult(true);
        if (!isExam || practice || !attemptRef.current) return;
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
  }, [sendInit, saveResult, isExam, locked, onClose, timeUpPending, practice]);

  const exit = async () => {
    if (locked && !practice && gate.state === 'open' && !result) {
      bypassRef.current = true;
      const ok = await platformConfirm('لو خرجت دلوقتي الامتحان هيتقفل، ومش هتقدر تمتحنه تاني إلا بموافقة المدرس. تخرج؟');
      bypassRef.current = false;
      if (!ok) return;
      markExited();
    }
    onClose?.();
  };
  const fullscreen = () => {
    const el = winRef.current;
    bypassRef.current = true;
    setTimeout(() => { bypassRef.current = false; }, 1200);
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (el?.requestFullscreen || el?.webkitRequestFullscreen)?.call(el);
  };
  const pct = progress?.total ? Math.round((progress.current / progress.total) * 100) : null;
  const showTimer = gate.state === 'open' && !result;
  const countdown = locked && !practice && remaining !== null;

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
            {practice && <span className="hw-chip is-practice"><Icon name="refresh" />تدريب</span>}
            {pct !== null && <span className="hw-chip is-prog" title="الأسئلة"><Icon name="checkCircle" /><bdi>{n(progress.current)} / {n(progress.total)}</bdi></span>}
            {showTimer && (countdown
              ? <span className={`hw-chip is-timer${remaining <= 60 ? ' is-danger' : remaining <= 300 ? ' is-warn' : ''}`} title="الوقت الفاضل"><Icon name="clock" /><bdi dir="ltr">{clock(remaining)}</bdi></span>
              : <span className="hw-chip" title="الوقت"><Icon name="clock" /><bdi dir="ltr">{clock(secs)}</bdi></span>)}
            {result && <button type="button" className="hw-chip is-score" onClick={() => setShowResult(true)}><Icon name="trophy" />{n(Math.round(result.percentage))}٪</button>}
            {!isExam && <button type="button" className="hw-icon" title="إعادة تحميل" onClick={() => { savedRef.current = false; setResult(null); setProgress(null); setReloadKey((k) => k + 1); }}><Icon name="refresh" /></button>}
            <button type="button" className="hw-icon hw-hide-m" title="ملء الشاشة" onClick={fullscreen}><Icon name="external" /></button>
            <button type="button" className="hw-exit" onClick={exit}><Icon name="close" /><span>خروج</span></button>
          </div>
          {pct !== null && <div className="hw-prog" aria-label={`سؤال ${progress.current} من ${progress.total}`}><i style={{ width: `${pct}%` }} /></div>}
        </header>

        <div className="hw-stage">
          {gate.state !== 'open' && <GateScreen gate={gate} rules={{ duration: durationMin, until: untilMs, native }} onStart={start} onRequest={requestRetake} onClose={onClose} onPractice={startPractice} onReview={() => setReview({ details: gate.attempt?.performanceAnalysis?.details || [], summary: `درجتك ${n(gate.attempt?.score)} من ${n(gate.attempt?.total)}` })} />}
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
            sandbox={locked ? 'allow-scripts allow-same-origin allow-forms' : 'allow-scripts allow-same-origin allow-popups allow-forms allow-modals'}
            allow="fullscreen; autoplay"
          />}
          {warning && gate.state === 'open' && <WarningSheet reason={warning} onBack={() => setWarning(null)} />}
          {lockWatch.broken && gate.state === 'open' && !warning && (
            <div className="hw-result hw-warn"><div className="hw-gate__card is-bad">
              <span className="hw-gate__ico"><Icon name="lock" /></span><h3>رجّع تثبيت الشاشة</h3>
              <p>الامتحان مايكملش غير والشاشة متثبتة.</p>
              <button type="button" className="hw-btn hw-btn--pri" onClick={() => lockWatch.repin()}><Icon name="shield" />ثبّت الشاشة</button>
            </div></div>
          )}
          {timeUpPending && (
            <div className="hw-result"><div className="hw-gate__card is-wait">
              <span className="hw-gate__ico"><i className="hw-gate__spin" /></span><h3>الوقت خلص</h3><p>بنسلّم إجاباتك…</p>
            </div></div>
          )}
          {showResult && result && <ResultSheet result={result} practice={practice} onAgain={() => setShowResult(false)} onClose={onClose} onReview={() => setReview({ details: result.details, summary: `${practice ? 'تدريب — ' : ''}درجتك ${n(result.score)} من ${n(result.total)}` })} onPractice={locked && isExam ? startPractice : null} />}
          {review && <ReviewSheet details={review.details} summary={review.summary} onClose={() => setReview(null)} />}
        </div>

        <footer className="hw-foot">
          <span><Icon name="shield" />{practice ? 'تدريب — مش بيتسجل' : locked ? 'امتحان مراقَب' : 'محتوى محمي'}</span>
          {studentName && <span><Icon name="user" />{studentName}</span>}
          <span className={online ? '' : 'is-off'}><Icon name={online ? 'live' : 'wifiOff'} />{online ? 'متصل' : 'مفيش نت'}</span>
        </footer>
      </section>
    </div>
  );
};

export default InteractiveViewer;
