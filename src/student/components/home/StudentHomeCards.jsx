import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Clock3,
  Crown,
  FileArchive,
  FileText,
  FolderOpen,
  Gamepad2,
  GraduationCap,
  Heart,
  LineChart,
  MessageSquare,
  NotebookPen,
  Play,
  PlayCircle,
  Route,
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

const islamicStyles = `
@keyframes nhIslamicGlow { 0%,100% { opacity:.55; transform:translateX(0); } 50% { opacity:1; transform:translateX(-16px); } }
@keyframes nhPulseRing { 0%,100% { box-shadow:0 0 0 0 rgba(34,211,238,.18), 0 0 42px rgba(34,211,238,.24); } 50% { box-shadow:0 0 0 14px rgba(34,211,238,.04), 0 0 72px rgba(245,158,11,.24); } }
.nh-islamic-card { position:relative; isolation:isolate; overflow:hidden; }
.nh-islamic-card:before { content:""; position:absolute; inset:0; border-radius:inherit; padding:1px; background:linear-gradient(135deg,rgba(34,211,238,.45),rgba(245,158,11,.46),rgba(20,184,166,.35)); -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none; }
.nh-islamic-card:after { content:""; position:absolute; inset:-60% -20%; background:linear-gradient(90deg,transparent,rgba(103,232,249,.10),rgba(250,204,21,.09),transparent); transform:rotate(12deg); animation:nhIslamicGlow 5.8s ease-in-out infinite; pointer-events:none; }
.nh-mosque-arch { position:absolute; inset:2.4rem 2rem 2rem auto; width:31%; min-width:280px; max-width:420px; border:4px solid rgba(34,211,238,.45); border-bottom:0; border-radius:999px 999px 10px 10px; filter:drop-shadow(0 0 34px rgba(34,211,238,.18)); }
.nh-mosque-arch:before { content:""; position:absolute; inset:22px; border:1px solid rgba(34,211,238,.26); border-bottom:0; border-radius:999px 999px 4px 4px; }
.nh-moon { position:absolute; top:72px; right:50%; width:54px; height:54px; border-radius:999px; background:#e6fbff; box-shadow:0 0 34px rgba(103,232,249,.38); }
.nh-moon:after { content:""; position:absolute; inset:-5px -12px 0 auto; width:54px; height:54px; border-radius:999px; background:#061325; }
.nh-mosque-silhouette { position:absolute; right:18%; bottom:22px; width:62%; height:100px; opacity:.58; background:linear-gradient(to top,rgba(34,211,238,.42),rgba(34,211,238,.08)); clip-path:polygon(0 100%,0 75%,8% 75%,8% 48%,12% 48%,12% 100%,18% 100%,18% 60%,27% 35%,36% 60%,36% 100%,43% 100%,43% 48%,47% 48%,47% 75%,56% 75%,56% 100%,63% 100%,63% 55%,72% 25%,82% 55%,82% 100%,100% 100%); }
.nh-play-orb { animation:nhPulseRing 3s ease-in-out infinite; }
@media(max-width:900px){.nh-mosque-arch{position:relative;inset:auto;width:100%;min-width:0;height:260px;margin-bottom:1rem}.nh-moon{right:45%;}.nh-mosque-silhouette{right:14%;}}
`;

function pct(value) {
  const n = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

function StatTile({ icon: Icon, label, value, hint, color = 'cyan', onClick, locked }) {
  const palette = {
    cyan: 'from-cyan-400/18 to-blue-500/5 text-cyan-300 border-cyan-300/22',
    amber: 'from-amber-400/20 to-orange-500/5 text-amber-300 border-amber-300/24',
    emerald: 'from-emerald-400/18 to-green-500/5 text-emerald-300 border-emerald-300/22',
    violet: 'from-violet-400/18 to-fuchsia-500/5 text-violet-300 border-violet-300/24',
    blue: 'from-blue-400/18 to-cyan-500/5 text-blue-300 border-blue-300/22',
  }[color];
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`nh-islamic-card group min-h-[7.2rem] rounded-[1.35rem] border bg-gradient-to-br ${palette} p-4 text-right transition duration-300 hover:-translate-y-1 hover:bg-white/[.06] disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black/20 ring-1 ring-white/10 shadow-[0_0_26px_rgba(34,211,238,.12)]">
          <Icon size={28} strokeWidth={1.9} />
        </div>
        <div>
          <p className="text-xs font-black text-slate-300">{label}</p>
          <p className="mt-1 text-3xl font-black text-white">{value}</p>
        </div>
      </div>
      <div className="relative z-10 mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-current opacity-70" />
      </div>
      <p className="relative z-10 mt-2 truncate text-xs font-bold text-slate-400">{locked ? 'مغلق مؤقتًا' : hint}</p>
    </button>
  );
}

export function ContinueWatchingCard({ latestVideoActivity, inProgressExam, nextStudyAction }) {
  const isVideo = !!latestVideoActivity && !latestVideoActivity?.isCompleted;
  const isExam = !isVideo && !!inProgressExam;
  const title = isVideo ? latestVideoActivity?.video?.title : inProgressExam?.title;
  const subject = isVideo ? latestVideoActivity?.video?.subject : inProgressExam?.subject;
  const percent = isVideo ? pct(latestVideoActivity?.percent) : 0;
  const watched = isVideo ? formatWatchTime(Math.round(latestVideoActivity?.watchedSeconds || 0)) : null;

  if (!isVideo && !isExam) return null;

  return (
    <section className="nh-islamic-card rounded-[1.55rem] border border-cyan-300/18 bg-[#071426] p-4 text-white shadow-[0_24px_80px_rgba(2,6,23,.28)]">
      <div className="relative z-10 grid gap-5 md:grid-cols-[310px_1fr_auto] md:items-center">
        <div className="relative min-h-[150px] overflow-hidden rounded-[1.25rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.22),transparent_34%),linear-gradient(135deg,#071b2d,#020617)]">
          <div className="nh-mosque-silhouette !right-[14%] !bottom-0 !w-[72%] !h-[85px]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(245,158,11,.08),transparent)]" />
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-black text-white">{watched || 'محفوظ'}</span>
          <button type="button" onClick={nextStudyAction?.action} className="nh-play-orb absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white ring-1 ring-white/20 backdrop-blur">
            <Play size={26} fill="currentColor" />
          </button>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-black text-cyan-200"><PlayCircle size={18} /> تابع المشاهدة</p>
          <h3 className="mt-2 text-2xl font-black leading-snug text-white">{title || 'محتوى محفوظ'}</h3>
          <p className="mt-1 text-sm font-bold text-slate-400">{subject || (isVideo ? 'آخر محاضرة توقفت عندها' : 'محاولة امتحان محفوظة')}</p>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-bold text-slate-300">
            {isVideo && <span className="flex items-center gap-2"><Clock3 size={17} className="text-amber-300" /> {watched}</span>}
            {isVideo && <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-full border-2 border-cyan-300 border-r-transparent" /> {percent}% نسبة التقدم</span>}
          </div>
          {isVideo && (
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-amber-300 to-orange-500" style={{ width: `${percent}%` }} />
            </div>
          )}
        </div>
        <button onClick={nextStudyAction?.action} className="rounded-2xl bg-gradient-to-l from-amber-400 to-orange-500 px-7 py-3.5 font-black text-slate-950 shadow-[0_18px_38px_rgba(245,158,11,.22)] transition hover:-translate-y-1">
          {isVideo ? 'متابعة المشاهدة' : 'أكمل الامتحان'}
        </button>
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
  examResults = [],
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
  const focusItems = smartWeakBranches?.length
    ? smartWeakBranches.map((item) => `${item.branch} · ${item.pct}%`)
    : ['أكمل محاضرة اليوم', 'حل اختبار قصير', 'راجع أخطاءك'];
  const lastPercent = pct(latestVideoActivity?.percent || videoCompletionPercent);
  const continueTitle = latestVideoActivity?.video?.title || nextStudyAction?.title || 'مراجعة اسم الله';
  const continueSubject = latestVideoActivity?.video?.subject || 'المحاضرة 12 - التوحيد';

  const statTiles = [
    { key: 'videos', label: 'المحاضرات', value: videos.length || 15, hint: `${completedVideoCount || 0} محاضرة مكتملة`, icon: PlayCircle, color: 'cyan', locked: isBannedContent },
    { key: 'courses', label: 'الكورسات', value: videos.length ? Math.max(1, Math.ceil(videos.length / 3)) : 6, hint: 'كورسات قيد التعلم', icon: GraduationCap, color: 'amber', locked: isBannedContent },
    { key: 'assignments', label: 'الواجبات', value: pendingAssignmentsCount || 0, hint: pendingAssignments?.[0]?.title || 'واجبات قيد التقديم', icon: CheckSquare, color: 'blue', locked: isBannedExam },
    { key: 'exams', label: 'الاختبارات', value: exams.length || 0, hint: `${completedExamResults.length || 0} اختبارات مكتملة`, icon: ClipboardCheck, color: 'violet', locked: isBannedExam },
    { key: 'files', label: 'الملفات', value: filesAndLinks.length || 0, hint: 'ملفات شخصية وموارد', icon: FolderOpen, color: 'emerald', locked: isBannedContent },
    { key: 'settings', label: 'المستوى التعليمي', value: completedExamResults.length ? `${averageScore}%` : '12', hint: 'الشهادة الثانوية عامة', icon: Users, color: 'cyan', locked: false },
  ];

  return (
    <section className="page-soft-enter -m-4 min-h-screen bg-[#07111f] p-4 text-white md:-m-6 md:p-6">
      <style>{islamicStyles}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowNotifications(true)} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-black text-slate-200 backdrop-blur transition hover:bg-white/10">
            <Bell className="ml-2 inline" size={16} /> التنبيهات
            {!!unseenNotificationCount && <span className="mr-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] text-white">{unseenNotificationCount}</span>}
          </button>
          <button type="button" onClick={() => setActiveTab('settings')} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-black text-slate-200 backdrop-blur transition hover:bg-white/10">
            <Target className="ml-2 inline" size={16} /> الإعدادات
          </button>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black text-amber-200">
          {isPremium ? 'الباقة مفعّلة' : subscriptionDaysLeft ? `${subscriptionDaysLeft} يوم متبقي` : 'الباقة المجانية'}
        </span>
      </div>

      <section className="nh-islamic-card relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#061325] p-5 shadow-[0_30px_110px_rgba(2,6,23,.42)] md:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_38%,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_88%_45%,rgba(245,158,11,.15),transparent_22%),linear-gradient(180deg,#071426,#030814)]" />
        <div className="nh-mosque-arch" />
        <div className="nh-moon" />
        <div className="nh-mosque-silhouette" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[.92fr_1.08fr] xl:items-center">
          <div className="min-h-[340px]" />
          <div>
            <h1 className="text-4xl font-black leading-[1.15] md:text-6xl">
              أهلاً <span className="text-amber-300">{firstName}</span>،
              <br />كل اللي محتاجه في لوحة واحدة.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-slate-300 md:text-lg">
              تابع تقدمك، استكمل محاضراتك، وطور مستواك مع كل الأدوات التي تساعدك للوصول لهدفك.
            </p>

            <div className="mt-6 rounded-[1.55rem] border border-cyan-300/22 bg-black/18 p-4 shadow-[inset_0_0_35px_rgba(34,211,238,.07)] backdrop-blur">
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-black text-amber-300"><PlayCircle size={18} /> استكمال آخر محاضرة</p>
                  <h2 className="mt-2 text-2xl font-black leading-snug text-white">{continueTitle}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-400">{continueSubject}</p>
                  <div className="mt-5 flex items-center gap-4">
                    <span className="text-xl font-black text-amber-300">{lastPercent}%</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-l from-amber-300 to-orange-500" style={{ width: `${lastPercent || 54}%` }} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-400">تمت مشاهدة {latestVideoActivity?.watchedSeconds ? formatWatchTime(Math.round(latestVideoActivity.watchedSeconds)) : '27:45'} من المحاضرة</p>
                </div>
                <button type="button" onClick={nextStudyAction?.action} className="nh-play-orb grid h-24 w-24 place-items-center rounded-full bg-[#071426] text-white ring-2 ring-amber-300/45 transition hover:scale-105">
                  <Play size={38} fill="currentColor" />
                </button>
              </div>
              <button onClick={nextStudyAction?.action} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-300 px-6 py-3.5 text-lg font-black text-slate-950 shadow-[0_18px_45px_rgba(245,158,11,.22)] transition hover:-translate-y-1">
                استكمل الآن <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statTiles.map((item) => <StatTile key={item.key} {...item} onClick={() => !item.locked && setActiveTab(item.key)} />)}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_.9fr_.72fr]">
        <ContinueWatchingCard latestVideoActivity={latestVideoActivity} inProgressExam={inProgressExam} nextStudyAction={nextStudyAction} />

        <section className="nh-islamic-card rounded-[1.55rem] border border-white/10 bg-[#071426] p-4 shadow-[0_20px_70px_rgba(2,6,23,.28)]">
          <div className="relative z-10 mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-black text-white"><CalendarDays className="text-amber-300" /> جدول اليوم</h3>
            <button type="button" className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-black text-slate-300">عرض الكامل</button>
          </div>
          <div className="relative z-10 space-y-2">
            {[
              ['10:00 ص', 'رياضيات متقدمة', 'محاضرة مباشرة', 'bg-amber-400'],
              ['02:00 م', nextOpenExam?.title || 'اختبار قصير', 'صفحة الاختبارات', 'bg-violet-400'],
              ['06:00 م', 'مراجعة سريعة', 'اختبارات قصيرة', 'bg-cyan-400'],
            ].map(([time, title, sub, dot]) => (
              <div key={time} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                <span className="w-16 text-sm font-black text-slate-300">{time}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{title}</p>
                  <p className="truncate text-xs font-bold text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="nh-islamic-card rounded-[1.55rem] border border-white/10 bg-[#071426] p-4 shadow-[0_20px_70px_rgba(2,6,23,.28)]">
          <div className="relative z-10 mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-black text-white"><Zap className="text-amber-300" /> أدوات سريعة</h3>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-2">
            {[
              { tab: 'videos', label: 'تقييم محاضرة', icon: PlayCircle, color: 'text-cyan-300' },
              { tab: 'assignments', label: 'رفع واجب', icon: UploadCloud, color: 'text-emerald-300' },
              { tab: 'student_messages', label: 'الملاحظات', icon: NotebookPen, color: 'text-amber-300' },
              { tab: 'learning_path', label: 'خريطة ذهنية', icon: Route, color: 'text-lime-300' },
            ].map(({ tab, label, icon: Icon, color }) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="rounded-2xl border border-white/10 bg-white/[.035] p-3 text-right transition hover:-translate-y-1 hover:bg-white/[.07]">
                <Icon className={color} size={23} />
                <p className="mt-2 text-sm font-black text-white">{label}</p>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setActiveTab('htmls')} className="relative z-10 mt-3 w-full rounded-2xl border border-cyan-300/18 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-200">عرض كل الأدوات</button>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="nh-islamic-card rounded-[1.55rem] border border-white/10 bg-[#071426] p-4 shadow-[0_20px_70px_rgba(2,6,23,.28)]">
          <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
            <h3 className="flex items-center gap-2 text-xl font-black text-white"><Bell className="text-amber-300" /> آخر التنبيهات</h3>
            <button onClick={() => { setShowNotifications(true); setHasNewNotif?.(false); }} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white">عرض الكل</button>
          </div>
          <div className="relative z-10 space-y-2">
            {recentNotificationItems?.length ? recentNotificationItems.slice(0, 3).map((n, i) => (
              <div key={n.id || i} className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                <p className="truncate text-sm font-black text-white">{n.title || 'تنبيه جديد'}</p>
                <p className="line-clamp-1 text-xs font-bold text-slate-400">{n.body || n.text || n.message || ''}</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-center text-sm font-bold text-slate-400">لا توجد تنبيهات جديدة.</p>}
          </div>
        </section>

        <section className="nh-islamic-card rounded-[1.55rem] border border-white/10 bg-[#071426] p-4 shadow-[0_20px_70px_rgba(2,6,23,.28)]">
          <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
            <h3 className="flex items-center gap-2 text-xl font-black text-white"><Target className="text-cyan-300" /> ركّز على المهم</h3>
            <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-200">أولويات اليوم</span>
          </div>
          <div className="relative z-10 grid gap-2 md:grid-cols-3">
            {focusItems.slice(0, 3).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                <p className="text-xs font-black text-cyan-300">نقطة {index + 1}</p>
                <p className="mt-1 font-black text-white">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 nh-islamic-card rounded-[1.4rem] border border-cyan-300/18 bg-[#071426] p-4">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-300/10 text-amber-300 ring-1 ring-amber-300/20"><Trophy size={32} /></div>
            <div>
              <h3 className="text-2xl font-black text-cyan-200">أنت على الطريق الصحيح!</h3>
              <p className="text-sm font-bold text-slate-400">حافظ على استمراريتك واجتهادك للوصول إلى هدفك.</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-center">
            <div><p className="text-2xl font-black text-cyan-300">{completedExamResults.length ? `${averageScore}%` : '85%'}</p><p className="text-xs font-bold text-slate-400">الإنجاز الأسبوعي</p></div>
            <div><p className="text-2xl font-black text-amber-300">7</p><p className="text-xs font-bold text-slate-400">أيام متتالية</p></div>
            <button type="button" onClick={() => setActiveTab('settings')} className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white transition hover:bg-blue-500">عرض التقرير</button>
          </div>
        </div>
      </div>

      {latestVideoActivity?.video && !latestVideoActivity.isCompleted && (
        <ContentRatingCard userId={userId} contentId={latestVideoActivity.video.id} contentTitle={latestVideoActivity.video.title} />
      )}
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
      await setDoc(doc(db, 'content_ratings', docId), {
        userId,
        contentId,
        contentTitle: contentTitle || '',
        rating: stars,
        ratedAt: serverTimestamp(),
      }, { merge: true });
      setRating(stars);
      setSaved(true);
    } catch (e) {
      console.error('rating error', e);
    } finally {
      setLoading(false);
    }
  }, [userId, contentId, contentTitle, loading]);

  if (!contentId) return null;
  return (
    <div className="mt-4 rounded-[1.3rem] border border-amber-300/20 bg-[#071426] p-4 text-white shadow-[0_20px_70px_rgba(2,6,23,.25)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-amber-300">قيّم آخر محاضرة شاهدتها</p>
          <p className="truncate text-sm font-bold text-slate-300">{contentTitle || 'المحاضرة الحالية'}</p>
        </div>
        {saved ? <span className="text-sm font-black text-amber-300">شكراً على تقييمك! {'⭐'.repeat(rating)}</span> : (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} disabled={loading} onClick={() => submit(star)} onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} className="text-2xl transition hover:scale-125 disabled:opacity-50" aria-label={`تقييم ${star} نجوم`}>
                <Star size={26} fill={(hover || rating) >= star ? '#f59e0b' : 'none'} className={(hover || rating) >= star ? 'text-amber-400' : 'text-slate-500'} />
              </button>
            ))}
          </div>
        )}
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
    <div className="mt-4 rounded-[1.3rem] border border-cyan-300/18 bg-[#071426] p-4 text-white shadow-[0_20px_70px_rgba(2,6,23,.25)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-black"><LineChart size={18} className="text-cyan-300" /> موقعك بين زملائك</h3>
        <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">{grade || 'مرحلتك'}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div><div className="mb-1 flex justify-between text-xs font-black text-slate-400"><span>متوسطك</span><span>{myAvg}%</span></div><div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-400" style={{ width: `${pct(myAvg)}%` }} /></div></div>
        <div><div className="mb-1 flex justify-between text-xs font-black text-slate-400"><span>متوسط المجموعة</span><span>{groupAvg}%</span></div><div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-slate-500" style={{ width: `${groupAvg}%` }} /></div></div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <p className={`text-xs font-bold ${diff >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{diff >= 0 ? `+${diff}% فوق متوسط المجموعة` : `${diff}% تحت متوسط المجموعة`}</p>
        <button onClick={() => setActiveTab?.('settings')} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15">تقرير كامل</button>
      </div>
    </div>
  );
}
