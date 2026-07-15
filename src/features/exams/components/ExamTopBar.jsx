import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Timer } from '../../../shared/icons/lucide-shim.jsx';
import { db } from '../../../services/firebase.js';
import fallbackPlatformLogo from '../../../assets/nahhas-exam-logo.png';

function formatTime(timeLeft = 0) {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = Math.max(0, timeLeft % 60);
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" focusable="false" className="block overflow-visible">
      <path d="M8.25 3.5H5.5a2 2 0 0 0-2 2v2.75M15.75 3.5h2.75a2 2 0 0 1 2 2v2.75M20.5 15.75v2.75a2 2 0 0 1-2 2h-2.75M8.25 20.5H5.5a2 2 0 0 1-2-2v-2.75" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ExamTopBar({
  exam,
  isSubmitted,
  timeLeft,
  activeBranchTab,
  uniqueBranches = [],
  onDashboard,
  onSubmit,
  onBranchChange,
  onFullscreen,
}) {
  const questionCount = Number(exam?.questionCount || exam?.questions?.length || 0);
  const [platformIdentity, setPlatformIdentity] = useState({
    platformName: 'منصة النحاس التعليمية',
    logoUrl: '',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'platform_settings', 'main'),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() || {};
        setPlatformIdentity((current) => ({
          platformName: String(data.platformName || current.platformName || 'منصة النحاس التعليمية'),
          logoUrl: String(data.logoUrl || '').trim(),
        }));
      },
      () => {},
    );
    return unsubscribe;
  }, []);

  const activePlatformLogo = platformIdentity.logoUrl || fallbackPlatformLogo;

  return (
    <header className="relative z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-3 px-3 py-3 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-orange-200/70 bg-gradient-to-br from-orange-50 to-white p-2 shadow-[0_8px_24px_rgba(194,65,12,0.14)] md:h-[76px] md:w-[76px]">
            <img src={activePlatformLogo} alt={`شعار ${platformIdentity.platformName}`} className="block h-full w-full select-none object-contain" draggable="false" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackPlatformLogo; }} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black text-slate-900 md:text-xl">
              {exam?.title || 'الامتحان'} {isSubmitted ? '— مراجعة الإجابات' : ''}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500 md:text-sm">
              {exam?.grade && <span>{exam.grade}</span>}
              {exam?.subject && <><span className="text-slate-300">•</span><span>{exam.subject}</span></>}
              {questionCount > 0 && <><span className="text-slate-300">•</span><span>{questionCount} سؤال</span></>}
              {exam?.totalScore && <><span className="text-slate-300">•</span><span>الدرجة الكلية: {exam.totalScore}</span></>}
            </div>
          </div>
        </div>

        {!isSubmitted ? (
          <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
            <div className="order-2 flex min-w-[156px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center lg:order-none">
              <Timer size={20} className="text-slate-600" />
              <div>
                <div className="text-[11px] font-bold text-slate-500">الوقت المتبقي</div>
                <div className="font-mono text-lg font-black tracking-wider text-indigo-600 md:text-xl">{formatTime(timeLeft)}</div>
              </div>
            </div>
            <button type="button" onClick={onFullscreen} className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-slate-800 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-100" title="فتح وضع ملء الشاشة" aria-label="فتح وضع ملء الشاشة">
              <span className="transition-transform duration-200 group-hover:scale-110"><FullscreenIcon /></span>
            </button>
            <button onClick={onSubmit} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600 transition hover:bg-rose-50">
              إنهاء الامتحان
            </button>
          </div>
        ) : (
          <button onClick={onDashboard} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800">
            العودة إلى النتيجة
          </button>
        )}
      </div>

      {isSubmitted && (
        <div className="border-t border-slate-100 px-3 pb-3 md:px-6">
          <div className="mx-auto flex max-w-[1700px] gap-2 overflow-x-auto pt-3 scrollbar-hide">
            <button onClick={() => onBranchChange('الكل')} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-black transition ${activeBranchTab === 'الكل' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>الامتحان كله</button>
            {uniqueBranches.filter((branch) => branch !== 'الكل').map((branch) => (
              <button key={branch} onClick={() => onBranchChange(branch)} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-black transition ${activeBranchTab === branch ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{branch}</button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
