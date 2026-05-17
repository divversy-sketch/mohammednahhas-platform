import { useCallback, useMemo, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Crown,
  FileCheck2,
  FileText,
  FolderOpen,
  GraduationCap,
  Heart,
  LineChart as LineChartIcon,
  Mail,
  MessageSquare,
  NotebookPen,
  Play,
  PlayCircle,
  Route,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  UploadCloud,
  Users,
  Zap,
} from 'lucide-react';
import { formatWatchTime } from '../../../shared/core/platformShared.jsx';
import { db } from '../../../services/firebase.js';

const premiumStudentStyles = `
@keyframes ndGlowSweep { 0%,100%{transform:translateX(0);opacity:.55} 50%{transform:translateX(-22px);opacity:1} }
@keyframes ndPurplePulse { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.18),0 0 38px rgba(139,92,246,.2)} 50%{box-shadow:0 0 0 12px rgba(139,92,246,.04),0 0 62px rgba(168,85,247,.3)} }
@keyframes ndFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
.nd-premium-shell{background:#07111f;color:#f8fafc;border-radius:28px;overflow:hidden;position:relative;isolation:isolate;box-shadow:0 30px 90px rgba(2,6,23,.32)}
.nd-premium-shell:before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(circle at 18% 8%,rgba(139,92,246,.22),transparent 24rem),radial-gradient(circle at 72% 18%,rgba(59,130,246,.16),transparent 22rem),linear-gradient(180deg,#07111f,#08111e 60%,#050b15)}
.nd-premium-shell:after{content:"";position:absolute;inset:0;z-index:-1;opacity:.08;background-image:radial-gradient(circle at 1px 1px,#fff 1px,transparent 0);background-size:32px 32px;pointer-events:none}
.nd-glass{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);backdrop-filter:blur(18px);box-shadow:0 18px 45px rgba(0,0,0,.28)}
.nd-glass:before{content:"";position:absolute;inset:-60% -15%;background:linear-gradient(90deg,transparent,rgba(168,85,247,.08),rgba(59,130,246,.08),transparent);transform:rotate(12deg);animation:ndGlowSweep 6s ease-in-out infinite;pointer-events:none}
.nd-card-hover{transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease,background .25s ease}.nd-card-hover:hover{transform:translateY(-4px);border-color:rgba(168,85,247,.45);box-shadow:0 0 35px rgba(139,92,246,.24),0 22px 60px rgba(0,0,0,.32)}
.nd-play-orb{animation:ndPurplePulse 3s ease-in-out infinite}.nd-float{animation:ndFloat 5s ease-in-out infinite}
.nd-progress{height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}.nd-progress>span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#3b82f6,#8b5cf6,#a855f7);box-shadow:0 0 18px rgba(168,85,247,.65)}
.nd-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.68}.nd-hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,17,31,.98),rgba(7,17,31,.74) 48%,rgba(91,33,182,.32))}
@media(max-width:900px){.nd-premium-shell{border-radius:20px}.nd-hero-img{opacity:.42}}
`;

const defaultThumbs = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
];

function pct(value) {
  const n = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

function thumb(item, index = 0) {
  return item?.thumbnail || item?.thumbnailUrl || item?.image || item?.coverUrl || item?.cover || defaultThumbs[index % defaultThumbs.length];
}

function getTitle(item, fallback = 'محتوى تعليمي') {
  return item?.title || item?.name || item?.lessonTitle || fallback;
}

function getSubject(item, fallback = 'المرحلة التعليمية') {
  return item?.subject || item?.courseName || item?.category || item?.gradeName || fallback;
}

function ProgressBar({ value, className = '' }) {
  return <div className={`nd-progress ${className}`}><span style={{ width: `${pct(value)}%` }} /></div>;
}

function CircleProgress({ value }) {
  const r = 43;
  const c = 2 * Math.PI * r;
  const dash = c - (pct(value) / 100) * c;
  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <svg className="h-32 w-32 -rotate-90">
        <circle cx="64" cy="64" r={r} stroke="rgba(255,255,255,.09)" strokeWidth="12" fill="none" />
        <circle cx="64" cy="64" r={r} stroke="url(#ndCircleGrad)" strokeWidth="12" strokeLinecap="round" fill="none" strokeDasharray={c} strokeDashoffset={dash} />
        <defs><linearGradient id="ndCircleGrad"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient></defs>
      </svg>
      <div className="absolute text-center"><p className="text-3xl font-black text-white">{pct(value)}%</p><p className="text-xs font-bold text-slate-400">ممتاز</p></div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, note, tone = 'purple', onClick, disabled }) {
  const tones = {
    purple: ['#8B5CF6', 'rgba(139,92,246,.14)'],
    blue: ['#3B82F6', 'rgba(59,130,246,.14)'],
    cyan: ['#22D3EE', 'rgba(34,211,238,.14)'],
    green: ['#22C55E', 'rgba(34,197,94,.13)'],
    orange: ['#F59E0B', 'rgba(245,158,11,.14)'],
  }[tone] || ['#8B5CF6', 'rgba(139,92,246,.14)'];
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="nd-glass nd-card-hover rounded-[22px] p-5 text-right disabled:opacity-50 disabled:cursor-not-allowed">
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: tones[1], color: tones[0], boxShadow: `0 0 32px ${tones[1]}` }}><Icon size={25} /></div>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
      <h3 className="relative z-10 mt-4 font-black text-white">{title}</h3>
      <p className="relative z-10 mt-1 truncate text-xs font-bold text-slate-400">{note}</p>
      <ProgressBar value={Math.min(100, Number(value) || 68)} className="relative z-10 mt-4" />
    </button>
  );
}

function LessonCard({ item, index, onClick }) {
  const progress = pct(item?.progress || item?.percent || item?.completionPercent || item?.watchProgress || 0);
  return (
    <button type="button" onClick={onClick} className="nd-glass nd-card-hover overflow-hidden rounded-[20px] p-3 text-right">
      <div className="relative h-32 overflow-hidden rounded-2xl">
        <img src={thumb(item, index)} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/95 via-[#07111F]/35 to-transparent" />
        <span className="nd-play-orb absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-full bg-[#8B5CF6]/90 text-white shadow-[0_0_25px_rgba(139,92,246,.55)]"><Play size={16} fill="currentColor" /></span>
        <span className="absolute bottom-3 right-3 rounded-lg bg-black/45 px-2 py-1 text-[11px] font-black text-white">{item?.durationLabel || item?.time || item?.duration || 'مشاهدة'}</span>
      </div>
      <div className="relative z-10 p-2">
        <h3 className="line-clamp-1 text-base font-black text-white">{getTitle(item, `درس ${index + 1}`)}</h3>
        <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">{getSubject(item)}</p>
        <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500"><span>{progress}%</span><span>متابعة</span></div>
        <ProgressBar value={progress} className="mt-2" />
      </div>
    </button>
  );
}

export function ContinueWatchingCard({ latestVideoActivity, inProgressExam, nextStudyAction }) {
  const isVideo = !!latestVideoActivity && !latestVideoActivity?.isCompleted;
  const isExam = !isVideo && !!inProgressExam;
  if (!isVideo && !isExam) return null;

  const source = isVideo ? latestVideoActivity?.video : inProgressExam;
  const progress = isVideo ? pct(latestVideoActivity?.percent) : 0;
  const watched = isVideo ? formatWatchTime(Math.round(latestVideoActivity?.watchedSeconds || 0)) : null;
  return (
    <section className="nd-glass nd-card-hover rounded-[24px] p-5">
      <div className="relative z-10 grid gap-5 lg:grid-cols-[320px_1fr_auto] lg:items-center">
        <div className="relative h-44 overflow-hidden rounded-[20px]">
          <img src={thumb(source)} alt="" className="h-full w-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/95 to-transparent" />
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/55 px-2 py-1 text-xs font-black text-white">{watched || 'محفوظ'}</span>
          <button onClick={nextStudyAction?.action} className="nd-play-orb absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#8B5CF6]/90 text-white"><Play size={25} fill="currentColor" /></button>
        </div>
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-purple-300"><PlayCircle size={18} /> تابع المشاهدة</p>
          <h3 className="mt-2 text-2xl font-black text-white">{getTitle(source, isVideo ? 'آخر محاضرة' : 'اختبار محفوظ')}</h3>
          <p className="mt-1 text-sm font-bold text-slate-400">{getSubject(source, isVideo ? 'آخر موضع توقفت عنده' : 'محاولة محفوظة')}</p>
          {isVideo && <ProgressBar value={progress} className="mt-5" />}
        </div>
        <button onClick={nextStudyAction?.action} className="rounded-[16px] bg-gradient-to-l from-[#A855F7] to-[#7C3AED] px-7 py-3.5 font-black text-white shadow-[0_0_28px_rgba(139,92,246,.35)] transition hover:-translate-y-1">{isVideo ? 'متابعة المشاهدة' : 'أكمل الامتحان'}</button>
      </div>
    </section>
  );
}

export function StudentUnifiedHomeDashboard({
  userData,
  isPremium,
  nextStudyAction,
  latestVideoActivity,
  inProgressExam,
  nextOpenExam,
  pendingAssignments,
  pendingAssignmentsCount,
  videoCompletionPercent,
  completedVideoCount,
  videos = [],
  exams = [],
  filesAndLinks = [],
  htmls = [],
  completedExamResults = [],
  averageScore = 0,
  subscriptionDaysLeft,
  smartWeakBranches,
  recentNotificationItems,
  unseenNotificationCount,
  setActiveTab,
  setShowNotifications,
  setHasNewNotif,
  isBannedContent,
  isBannedExam,
  userId,
}) {
  const firstName = String(userData?.name || 'محمد').split(' ')[0];
  const progress = pct(latestVideoActivity?.percent || videoCompletionPercent || 68);
  const continueVideo = latestVideoActivity?.video || videos[0] || null;
  const recommended = videos?.length ? videos.slice(0, 4) : [];
  const focusItems = smartWeakBranches?.length ? smartWeakBranches.slice(0, 3).map((item) => ({ title: item.branch, hint: `${item.pct}% يحتاج مراجعة`, icon: Target })) : [
    { title: nextOpenExam?.title || 'حل اختبار قصير', hint: 'أولوية عالية', icon: ClipboardCheck },
    { title: pendingAssignments?.[0]?.title || 'استكمال واجب', hint: 'أولوية متوسطة', icon: FileCheck2 },
    { title: continueVideo ? getTitle(continueVideo) : 'راجع أخطاءك', hint: 'أولوية مقترحة', icon: BarChart3 },
  ];

  const stats = [
    { title: 'المحاضرات', value: videos.length || 0, note: `${completedVideoCount || 0} مكتملة`, icon: PlayCircle, tone: 'orange', tab: 'videos', disabled: isBannedContent },
    { title: 'الكورسات', value: videos.length ? Math.max(1, Math.ceil(videos.length / 3)) : 0, note: 'رحلات تعلم', icon: GraduationCap, tone: 'purple', tab: 'courses', disabled: isBannedContent },
    { title: 'الواجبات', value: pendingAssignmentsCount || 0, note: pendingAssignments?.[0]?.title || 'واجبات مطلوبة', icon: FileCheck2, tone: 'green', tab: 'assignments', disabled: isBannedExam },
    { title: 'الاختبارات', value: exams.length || 0, note: `${completedExamResults.length || 0} مكتملة`, icon: ClipboardCheck, tone: 'blue', tab: 'exams', disabled: isBannedExam },
    { title: 'الملفات', value: filesAndLinks.length || 0, note: 'ملفات وروابط', icon: FolderOpen, tone: 'cyan', tab: 'files', disabled: isBannedContent },
    { title: 'المحتوى التفاعلي', value: htmls.length || 0, note: 'أنشطة تفاعلية', icon: Sparkles, tone: 'purple', tab: 'htmls', disabled: isBannedContent },
  ];

  return (
    <section className="nd-premium-shell p-4 md:p-6">
      <style>{premiumStudentStyles}</style>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white md:text-4xl">لوحة متابعة الطالب</h1>
          <p className="mt-2 text-sm font-bold text-slate-400">نظرة واضحة على رحلتك التعليمية اليوم</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-slate-400 md:flex"><Search size={17} /><span className="text-sm">ابحث عن درس، اختبار، ملف...</span></div>
          <button onClick={() => { setShowNotifications?.(true); setHasNewNotif?.(false); }} className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white"><Bell size={18} />{unseenNotificationCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#07111f]" />}</button>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 pr-3">
            <div className="text-right"><p className="text-sm font-black text-white">أهلاً بك، {firstName} 👋</p><p className="text-xs font-bold text-slate-400">كل يوم خطوة نحو هدفك</p></div>
            <div className="grid h-11 w-11 place-items-center rounded-full border border-purple-400/50 bg-purple-500/20 text-sm font-black text-white">{firstName.charAt(0)}</div>
          </div>
        </div>
      </div>

      <section className="relative min-h-[390px] overflow-hidden rounded-[28px] border border-white/10 bg-[#101A2D] shadow-[0_30px_90px_rgba(0,0,0,.45)]">
        <img src="/dashboard-hero-bg.jpg" alt="" className="nd-hero-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="nd-hero-overlay" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[#8B5CF6]/25 blur-3xl" />
        <div className="relative grid h-full gap-6 p-6 md:p-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex max-w-xl flex-col justify-center">
            <span className="w-fit rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 px-4 py-2 text-xs font-black text-purple-200">رحلتك التعليمية الذكية</span>
            <h2 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">أهلاً بك، <span className="text-[#FACC15]">{firstName}</span></h2>
            <p className="mt-3 text-lg font-bold text-slate-300">تابع تقدمك، أكمل محاضراتك، وحقق هدفك خطوة بخطوة.</p>
          </div>
          <div className="grid content-center gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="nd-glass rounded-[22px] p-5">
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div><p className="text-sm font-bold text-slate-300">تقدمك هذا الأسبوع</p><p className="mt-2 text-2xl font-black text-white">ممتاز</p><p className="mt-1 text-xs font-bold text-slate-400">استمر بنفس القوة</p></div>
                <CircleProgress value={progress || 68} />
              </div>
            </div>
            <div className="nd-glass rounded-[22px] border-[#A855F7]/30 p-5">
              <div className="relative z-10 flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#8B5CF6]/20 text-purple-200"><Play size={22} fill="currentColor" /></span><span className="text-xs font-bold text-slate-400">{progress}%</span></div>
              <h3 className="relative z-10 mt-5 text-lg font-black text-white">أكمل من حيث توقفت</h3>
              <p className="relative z-10 mt-1 line-clamp-1 text-sm font-bold text-slate-300">{continueVideo ? getTitle(continueVideo) : nextStudyAction?.title || 'لا توجد محاضرة محددة'}</p>
              <p className="relative z-10 mt-1 text-xs font-bold text-slate-500">{continueVideo ? getSubject(continueVideo) : 'ابدأ من لوحة المحاضرات'}</p>
              <ProgressBar value={progress} className="relative z-10 mt-4" />
              <button onClick={nextStudyAction?.action || (() => setActiveTab?.('videos'))} className="relative z-10 mt-5 h-11 w-full rounded-[14px] bg-gradient-to-l from-[#A855F7] to-[#7C3AED] text-sm font-black text-white shadow-[0_0_25px_rgba(139,92,246,0.35)]">متابعة الآن</button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((s) => <StatCard key={s.title} {...s} onClick={() => setActiveTab?.(s.tab)} />)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <ContinueWatchingCard latestVideoActivity={latestVideoActivity} inProgressExam={inProgressExam} nextStudyAction={nextStudyAction} />
        <section className="nd-glass rounded-[24px] p-5">
          <div className="relative z-10 mb-4 flex items-center justify-between"><h2 className="text-2xl font-black text-white">ركّز على المهم</h2><Target className="text-purple-300" /></div>
          <div className="relative z-10 space-y-3">
            {focusItems.map(({ title, hint, icon: Icon }, i) => <button key={`${title}-${i}`} onClick={() => setActiveTab?.(i === 0 ? 'videos' : i === 1 ? 'exams' : 'remediation')} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-right transition hover:bg-white/[0.08]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-500/15 text-purple-300"><Icon size={21} /></span><span className="min-w-0 flex-1"><span className="block truncate font-black text-white">{title}</span><span className="block truncate text-xs font-bold text-slate-400">{hint}</span></span></button>)}
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black text-white">موصى به لك</h2><button onClick={() => setActiveTab?.('videos')} className="text-sm font-black text-purple-300">عرض الكل</button></div>
        {recommended.length ? <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">{recommended.map((item, i) => <LessonCard key={item.id || getTitle(item) || i} item={item} index={i} onClick={() => setActiveTab?.('videos')} />)}</div> : <div className="nd-glass rounded-[22px] p-8 text-center text-slate-400">لا توجد محاضرات مقترحة حاليًا. ستظهر هنا تلقائيًا عند رفع المحاضرات من لوحة الأدمن.</div>}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="nd-glass rounded-[24px] p-5">
          <div className="relative z-10 mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-white">آخر التنبيهات</h3><button onClick={() => { setShowNotifications?.(true); setHasNewNotif?.(false); }} className="text-sm font-black text-purple-300">عرض الكل</button></div>
          <div className="relative z-10 space-y-3">{recentNotificationItems?.length ? recentNotificationItems.slice(0, 3).map((n, i) => <div key={n.id || i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="truncate font-black text-white">{n.title || 'تنبيه جديد'}</p><p className="line-clamp-1 text-xs font-bold text-slate-400">{n.body || n.text || n.message || ''}</p></div>) : <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center text-sm font-bold text-slate-400">لا توجد تنبيهات جديدة.</p>}</div>
        </section>
        <section className="nd-glass rounded-[24px] p-5">
          <div className="relative z-10 mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-white">أدوات سريعة</h3><Zap className="text-yellow-300" /></div>
          <div className="relative z-10 grid grid-cols-2 gap-3">
            {[
              { tab: 'videos', label: 'المحاضرات', icon: PlayCircle },
              { tab: 'assignments', label: 'الواجبات', icon: UploadCloud },
              { tab: 'student_messages', label: 'الرسائل', icon: Mail },
              { tab: 'learning_path', label: 'خطة التعلم', icon: Route },
            ].map(({ tab, label, icon: Icon }) => <button key={tab} onClick={() => setActiveTab?.(tab)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right transition hover:bg-white/[0.08]"><Icon className="text-purple-300" size={23} /><p className="mt-2 font-black text-white">{label}</p></button>)}
          </div>
        </section>
      </div>

      <div className="mt-6 nd-glass rounded-[24px] p-5">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-yellow-400/15 text-yellow-300"><Trophy size={32} /></div><div><h3 className="text-2xl font-black text-white">أنت على الطريق الصحيح!</h3><p className="text-sm font-bold text-slate-400">حافظ على استمراريتك واجتهادك للوصول إلى هدفك.</p></div></div>
          <div className="flex items-center gap-8 text-center"><div><p className="text-2xl font-black text-purple-300">{completedExamResults.length ? `${averageScore}%` : '68%'}</p><p className="text-xs font-bold text-slate-400">معدل الأداء</p></div><div><p className="text-2xl font-black text-blue-300">{subscriptionDaysLeft || 0}</p><p className="text-xs font-bold text-slate-400">يوم في الباقة</p></div><button type="button" onClick={() => setActiveTab?.('settings')} className="rounded-2xl bg-gradient-to-l from-[#A855F7] to-[#7C3AED] px-6 py-3 font-black text-white">عرض التقرير</button></div>
        </div>
      </div>

      {latestVideoActivity?.video && !latestVideoActivity.isCompleted && <ContentRatingCard userId={userId} contentId={latestVideoActivity.video.id} contentTitle={latestVideoActivity.video.title} />}
      <GroupPerformanceCard averageScore={averageScore} completedExamResults={completedExamResults} grade={userData?.grade} setActiveTab={setActiveTab} />
    </section>
  );
}

export function ContentRatingCard({ userId, contentId, contentTitle }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async (stars) => {
    if (!userId || !contentId || loading) return;
    setLoading(true);
    try {
      const docId = `${userId}_${contentId}`;
      await setDoc(doc(db, 'content_ratings', docId), { userId, contentId, contentTitle: contentTitle || '', rating: stars, ratedAt: serverTimestamp() }, { merge: true });
      setRating(stars); setSaved(true);
    } catch (e) { console.error('rating error', e); } finally { setLoading(false); }
  }, [userId, contentId, contentTitle, loading]);

  if (!contentId) return null;
  return (
    <div className="mt-6 nd-glass rounded-[22px] p-5 text-white">
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><p className="text-xs font-black text-purple-300">قيّم آخر محاضرة شاهدتها</p><p className="truncate text-sm font-bold text-slate-300">{contentTitle || 'المحاضرة الحالية'}</p></div>
        {saved ? <span className="text-sm font-black text-yellow-300">شكراً على تقييمك! {'⭐'.repeat(rating)}</span> : <div className="flex items-center gap-1">{[1,2,3,4,5].map((star) => <button key={star} disabled={loading} onClick={() => submit(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="text-2xl transition hover:scale-125 disabled:opacity-50" aria-label={`تقييم ${star} نجوم`}><Star size={26} fill={(hover || rating) >= star ? '#facc15' : 'none'} className={(hover || rating) >= star ? 'text-yellow-300' : 'text-slate-500'} /></button>)}</div>}
      </div>
    </div>
  );
}

export function GroupPerformanceCard({ averageScore, completedExamResults, grade, setActiveTab }) {
  if (!completedExamResults?.length) return null;
  const myAvg = averageScore || 0;
  const groupAvg = 70;
  const diff = myAvg - groupAvg;
  return (
    <div className="mt-6 nd-glass rounded-[22px] p-5 text-white">
      <div className="relative z-10 mb-3 flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-base font-black"><LineChartIcon size={18} className="text-purple-300" /> موقعك بين زملائك</h3><span className="rounded-full bg-purple-300/10 px-3 py-1 text-xs font-black text-purple-200">{grade || 'مرحلتك'}</span></div>
      <div className="relative z-10 grid gap-3 md:grid-cols-2"><div><div className="mb-1 flex justify-between text-xs font-black text-slate-400"><span>متوسطك</span><span>{myAvg}%</span></div><ProgressBar value={myAvg} /></div><div><div className="mb-1 flex justify-between text-xs font-black text-slate-400"><span>متوسط المجموعة</span><span>{groupAvg}%</span></div><ProgressBar value={groupAvg} /></div></div>
      <div className="relative z-10 mt-3 flex items-center justify-between border-t border-white/10 pt-3"><p className={`text-xs font-bold ${diff >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{diff >= 0 ? `+${diff}% فوق متوسط المجموعة` : `${diff}% تحت متوسط المجموعة`}</p><button onClick={() => setActiveTab?.('settings')} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15">تقرير كامل</button></div>
    </div>
  );
}
