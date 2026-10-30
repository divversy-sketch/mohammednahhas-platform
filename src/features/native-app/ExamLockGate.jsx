// شاشة قبل الامتحان على تطبيق الأندرويد: الامتحان ما يبدأش غير لما الطالب يوافق على تثبيت الشاشة.
import { useEffect, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';
import { isExamLockSupported, requestExamLock, getExamLockState, releaseExamLock } from './examLock.js';
import { markExamPage } from './examLockGuard.js';
import './exam-lock.css';

export function needsExamLock({ exam, isReviewMode, existingResult }) {
  return isExamLockSupported() && !isReviewMode && !existingResult && exam?.id !== 'custom_mistakes_exam';
}

export function ExamLockGate({ exam, onClose, children }) {
  const [step, setStep] = useState('check'); // check | intro | waiting | declined | ready

  // طول ما صفحة الامتحان مفتوحة التثبيت مسموح، وأول ما تتقفل (بأي طريقة) بيتفك
  useEffect(() => {
    markExamPage(true);
    return () => { markExamPage(false); releaseExamLock(); };
  }, []);

  useEffect(() => {
    let alive = true;
    getExamLockState().then((s) => { if (alive) setStep(s === 'pinned' || s === 'locked' ? 'ready' : 'intro'); });
    return () => { alive = false; };
  }, []);

  const start = async () => {
    setStep('waiting');
    const ok = await requestExamLock();
    setStep(ok ? 'ready' : 'declined');
  };

  const back = async () => { await releaseExamLock(); onClose?.(); };

  if (step === 'ready') return children;
  if (step === 'check') return <div className="xl-screen" dir="rtl" />;

  return (
    <div className="xl-screen" dir="rtl">
      <div className="xl-card">
        <span className={`xl-badge ${step === 'declined' ? 'is-bad' : ''}`}><Icon name={step === 'declined' ? 'alert' : 'lock'} /></span>
        <h2>{step === 'declined' ? 'لازم توافق على تثبيت الشاشة' : 'قبل ما تبدأ الامتحان'}</h2>
        <p className="xl-exam">{exam?.title || 'امتحان'}</p>

        {step !== 'declined' && (
          <ul className="xl-rules">
            <li><Icon name="lock" /><span>التطبيق هيتثبّت على الشاشة لحد ما تسلّم. مش هتقدر تفتح أي تطبيق تاني.</span></li>
            <li><Icon name="bell" /><span>الإشعارات مش هتظهرلك خالص وانت بتمتحن، عشان تركز.</span></li>
            <li><Icon name="shield" /><span>أي محاولة لفك التثبيت بتتسجل محاولة غش وبتوصل للمستر.</span></li>
            <li><Icon name="checkCircle" /><span>أول ما تسلّم، الشاشة بتتفك لوحدها.</span></li>
          </ul>
        )}

        {step === 'declined' && (
          <div className="xl-help">
            <p>الامتحان مش هيبدأ غير لما توافق. اضغط «جرّب تاني» وبعدين اختار <b>«تثبيت»</b> أو <b>«Pin»</b> في الرسالة اللي هتظهر.</p>
            <p>لو الرسالة ما ظهرتش خالص: افتح <b>الإعدادات ← الأمان</b> ودوّر على <b>«تثبيت التطبيق»</b> أو <b>«App pinning»</b> وفعّله، وارجع جرّب تاني.</p>
          </div>
        )}

        {step === 'waiting' ? (
          <div className="xl-wait"><i />وافق على «تثبيت التطبيق» في الرسالة اللي ظهرت…</div>
        ) : (
          <div className="xl-actions">
            <button type="button" className="xl-primary" onClick={start}><Icon name="lock" />{step === 'declined' ? 'جرّب تاني' : 'ثبّت الشاشة وابدأ'}</button>
            <button type="button" className="xl-ghost" onClick={back}>رجوع</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** بيغطي الامتحان لو الطالب فك التثبيت، لحد ما يرجّعه. */
export function ExamLockBrokenOverlay({ onRepin }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const go = async () => { setBusy(true); const ok = await onRepin(); setBusy(false); setFailed(!ok); };
  return (
    <div className="xl-screen xl-screen--over" dir="rtl" role="alertdialog" aria-modal="true">
      <div className="xl-card">
        <span className="xl-badge is-bad"><Icon name="alert" /></span>
        <h2>اتفك تثبيت الشاشة</h2>
        <p className="xl-exam">ده اتسجل محاولة غش ووصل للمستر. إجاباتك ووقتك محفوظين.</p>
        <p className="xl-help-line">رجّع التثبيت عشان تكمّل الامتحان.</p>
        {failed && <p className="xl-help-line is-bad">لازم تختار «تثبيت» في الرسالة عشان تكمّل.</p>}
        <div className="xl-actions">
          <button type="button" className="xl-primary" disabled={busy} onClick={go}><Icon name="lock" />{busy ? 'وافق في الرسالة…' : 'رجّع التثبيت وكمّل'}</button>
        </div>
      </div>
    </div>
  );
}
