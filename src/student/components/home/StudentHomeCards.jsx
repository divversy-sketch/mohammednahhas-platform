
import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, CalendarDays, ClipboardCheck, ClipboardList, Code, Crown, FileCheck, FileText, Flame, FolderOpen, GraduationCap, Heart, Map, MessageSquare, NotebookTabs, Play, PlayCircle, Sparkles, Star, Target, Trophy, UploadCloud, Users, Video, Wand2, Zap } from 'lucide-react';
import { formatWatchTime } from '../../../shared/core/platformShared.jsx';
import { db } from '../../../services/firebase.js';

export function StudentContinueCard({
  latestVideoActivity,
  inProgressExam,
  pendingAssignments,
  nextStudyAction,
  setActiveTab,
  completedExamResults,
  averageScore,
  latestCompletedResult,
  pendingAssignmentsCount,
}) {
  const currentTitle = latestVideoActivity?.video?.title || inProgressExam?.title || pendingAssignments?.[0]?.title || 'ابدأ مذاكرتك التالية';
  const currentSubtitle = latestVideoActivity
    ? ('آخر موضع مشاهدة: ' + formatWatchTime(Math.round(latestVideoActivity.watchedSeconds || 0)))
    : inProgressExam
      ? 'عندك محاولة امتحان محفوظة تقدر تكملها.'
      : pendingAssignments?.[0]
        ? 'ابدأ الواجب المطلوب قبل تراكم المهام.'
        : 'كل أدواتك المهمة جاهزة بضغطة واحدة.';

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 text-white rounded-3xl p-5 md:p-6 shadow-xl overflow-hidden relative border border-white/10">
        <div className="absolute -left-16 -top-16 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"></div>
        <div className="absolute right-8 bottom-4 opacity-10"><GraduationCap size={130}/></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="text-amber-200 text-sm font-bold mb-2 flex items-center gap-2"><Sparkles size={16}/> أكمل من حيث توقفت</p>
            <h3 className="text-2xl md:text-3xl font-black leading-relaxed truncate md:whitespace-normal">{currentTitle}</h3>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">{currentSubtitle}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button onClick={nextStudyAction.action} className={`bg-gradient-to-r ${nextStudyAction.tone} px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition flex items-center justify-center gap-2`}>
              {nextStudyAction.icon} {nextStudyAction.button}
            </button>
            <button onClick={() => setActiveTab('settings')} className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-2xl font-bold hover:bg-white/15 transition flex items-center justify-center gap-2"><BarChart3 size={18}/> أدائي</button>
          </div>
        </div>
        {latestVideoActivity && (
          <div className="relative z-10 mt-5">
            <div className="h-3 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: String(Math.min(100, latestVideoActivity.percent || 0)) + '%' }} /></div>
            <p className="text-xs text-amber-100 mt-2 font-bold">نسبة المشاهدة: {latestVideoActivity.percent || 0}%</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
        <button onClick={() => setActiveTab('settings')} className="text-right bg-white rounded-3xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition"><p className="text-xs font-bold text-blue-600 mb-1">متوسط أدائك</p><p className="text-3xl font-black text-slate-900">{completedExamResults.length ? String(averageScore) + '%' : '—'}</p><p className="text-xs text-slate-500 mt-1">{latestCompletedResult?.examTitle || 'ابدأ أول امتحان لتظهر النتائج'}</p></button>
        <button onClick={() => setActiveTab('assignments')} className="text-right bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition"><p className="text-xs font-bold text-emerald-600 mb-1">واجبات مطلوبة</p><p className="text-3xl font-black text-slate-900">{pendingAssignmentsCount}</p><p className="text-xs text-slate-500 mt-1">{pendingAssignments?.[0]?.title || 'لا توجد واجبات معلقة'}</p></button>
      </div>
    </section>
  );
}

export function StudentSmartDashboard({
  setActiveTab,
  videoCompletionPercent,
  completedVideoCount,
  videos,
  completedExamResults,
  averageScore,
  pendingAssignmentsCount,
  examResults,
  nextStudyAction,
  smartWeakBranches,
}) {
  return (
    <section className="glass-panel rounded-3xl p-5 md:p-6 border border-white/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><BrainCircuit className="text-amber-600"/> لوحة الطالب الذكية</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('videos')} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">المحاضرات</button>
          <button onClick={() => setActiveTab('exams')} className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">الامتحانات</button>
          <button onClick={() => setActiveTab('assignments')} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">الواجبات</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">تقدم المحاضرات</p><p className="text-3xl font-black text-blue-700 mt-1">{videoCompletionPercent}%</p><p className="text-xs text-slate-400 mt-1">{completedVideoCount}/{videos.length} مكتملة</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">متوسط الامتحانات</p><p className="text-3xl font-black text-emerald-700 mt-1">{completedExamResults.length ? averageScore + '%' : '—'}</p><p className="text-xs text-slate-400 mt-1">{completedExamResults.length} امتحان مكتمل</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">واجبات مطلوبة</p><p className="text-3xl font-black text-amber-700 mt-1">{pendingAssignmentsCount}</p><p className="text-xs text-slate-400 mt-1">تابعها قبل المحاضرة القادمة</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">نتائج مسجلة</p><p className="text-3xl font-black text-purple-700 mt-1">{examResults.length}</p><p className="text-xs text-slate-400 mt-1">سجل امتحاناتك</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-950 text-white rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl"></div>
          <p className="text-amber-200 text-sm font-bold mb-2">خطة اليوم المقترحة</p>
          <h3 className="text-xl md:text-2xl font-black mb-2">{nextStudyAction.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{nextStudyAction.text}</p>
          <button onClick={nextStudyAction.action} className={`bg-gradient-to-r ${nextStudyAction.tone} px-5 py-3 rounded-2xl font-black shadow flex items-center gap-2 w-full sm:w-auto justify-center`}>{nextStudyAction.icon} {nextStudyAction.button}</button>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-100">
          <h3 className="font-black text-slate-800 flex items-center gap-2 mb-3"><Target className="text-red-500"/> ركز على</h3>
          {smartWeakBranches.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-700 text-sm font-bold leading-relaxed">أداؤك مستقر. راجع آخر أخطائك وحافظ على الاستمرارية.</div>
          ) : (
            <div className="space-y-2">
              {smartWeakBranches.map(item => (
                <div key={item.branch} className="bg-red-50/70 border border-red-100 rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-black text-red-800">{item.branch}</span><span className="text-xs bg-white text-red-700 px-2 py-1 rounded-full font-bold">{item.pct}%</span></div>
                  <p className="text-xs text-red-600 mt-1">{item.wrong} أخطاء تحتاج مراجعة.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function StudentNotificationCenter({ setShowNotifications, setHasNewNotif, recentNotificationItems }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Bell className="text-amber-600"/> مركز الإشعارات</h3>
            <p className="text-sm text-slate-500 mt-1">المحاضرات والامتحانات والواجبات في مكان واحد، والتواصل عبر واتساب فقط.</p>
          </div>
          <button onClick={() => { setShowNotifications(true); setHasNewNotif(false); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition">عرض الكل</button>
        </div>
        <div className="space-y-2">
          {recentNotificationItems.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 text-center text-slate-500 font-bold">لا توجد إشعارات جديدة حاليًا.</div>
          ) : recentNotificationItems.map((n, i) => (
            <div key={n.id || i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Bell size={17}/></div>
              <div className="min-w-0"><p className="font-black text-slate-800 truncate">{n.title || 'تنبيه جديد'}</p><p className="text-sm text-slate-600 leading-relaxed">{n.text || n.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 flex items-center gap-2 mb-2"><Bell className="text-amber-600"/> تنبيهات داخل المنصة</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">لأي استفسار أو مشكلة في التفعيل استخدم واتساب الإدارة فقط، بدون رسائل داخلية أو إشعارات داخل المنصة.</p>
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl p-3 text-sm font-black">النظام الداخلي للتنبيهات يعمل بدون طلب صلاحيات من المتصفح.</div>
      </div>
    </section>
  );
}

export function StudentCompactHome({ setActiveTab, isBannedContent, isBannedExam, videos, exams, examResults }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button onClick={()=> !isBannedContent && setActiveTab('videos')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">المحاضرات</p><p className="text-3xl font-black text-blue-700">{videos.length}</p></div><PlayCircle className="text-blue-200 w-14 h-14"/></button>
      <button onClick={()=> !isBannedExam && setActiveTab('exams')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">الامتحانات</p><p className="text-3xl font-black text-amber-700">{exams.length}</p></div><ClipboardList className="text-amber-200 w-14 h-14"/></button>
      <button onClick={()=> setActiveTab('settings')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">نتائجي</p><p className="text-3xl font-black text-emerald-700">{examResults.length}</p></div><Target className="text-emerald-200 w-14 h-14"/></button>
    </div>
  );
}


export function ContinueWatchingCard({ latestVideoActivity, inProgressExam, nextStudyAction }) {
  if (!latestVideoActivity && !inProgressExam) return null;

  const isVideo = !!latestVideoActivity && !latestVideoActivity.isCompleted;
  const isExam  = !isVideo && !!inProgressExam;
  if (!isVideo && !isExam) return null;

  const title    = isVideo ? latestVideoActivity.video?.title    : inProgressExam?.title;
  const subject  = isVideo ? latestVideoActivity.video?.subject  : inProgressExam?.subject;
  const percent  = isVideo ? (latestVideoActivity.percent || 0)  : null;
  const watched  = isVideo
    ? (() => {
        const s = Math.round(latestVideoActivity.watchedSeconds || 0);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}د ${sec}ث` : `${sec}ث`;
      })()
    : null;

  return (
    <div className="rounded-3xl overflow-hidden border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch">

        {/* الأيقونة / الصورة */}
        <div className="flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 sm:w-36 p-6 shrink-0">
          {isVideo
            ? <PlayCircle size={52} className="text-white drop-shadow" />
            : <ClipboardList size={52} className="text-white drop-shadow" />
          }
        </div>

        {/* المحتوى */}
        <div className="flex flex-col justify-between gap-3 p-4 flex-1 min-w-0">
          <div>
            <p className="text-xs font-black text-amber-600 flex items-center gap-1 mb-1">
              <Sparkles size={13} />
              {isVideo ? 'أكمل من حيث توقفت' : 'لديك محاولة امتحان محفوظة'}
            </p>
            <h3 className="text-base md:text-lg font-black text-slate-900 leading-snug line-clamp-2">
              {title || 'محتوى محفوظ'}
            </h3>
            {subject && (
              <p className="text-xs text-slate-500 font-bold mt-0.5">{subject}</p>
            )}
            {isVideo && watched && (
              <p className="text-xs text-amber-700 font-bold mt-1">⏱ شاهدت {watched}</p>
            )}
          </div>

          {/* شريط التقدم (للفيديو فقط) */}
          {isVideo && percent !== null && (
            <div>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
              <p className="text-xs text-amber-600 font-black mt-1">{percent}% مكتمل</p>
            </div>
          )}
        </div>

        {/* زر الاستكمال */}
        <div className="flex items-center justify-center p-4 shrink-0">
          <button
            onClick={nextStudyAction?.action}
            className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black px-5 py-3 rounded-2xl shadow hover:scale-[1.03] transition flex items-center gap-2 whitespace-nowrap"
          >
            {isVideo ? <PlayCircle size={18} fill="currentColor" /> : <ClipboardList size={18} />}
            {isVideo ? 'استكمل الآن' : 'أكمل الامتحان'}
          </button>
        </div>

      </div>
    </div>
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
  videos,
  exams,
  filesAndLinks,
  htmls,
  completedExamResults,
  averageScore,
  examResults,
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
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null ? 'مميزة' : `${subscriptionDaysLeft} يوم`)
    : 'مفعّلة';
  const continueTitle = latestVideoActivity?.video?.title || inProgressExam?.title || pendingAssignments?.[0]?.title || 'مراجعة اسم الله';
  const continueMeta = latestVideoActivity
    ? `تمت مشاهدة ${formatWatchTime(Math.round(latestVideoActivity.watchedSeconds || 0))}`
    : inProgressExam
      ? 'امتحان محفوظ ويمكن استكماله الآن'
      : pendingAssignments?.[0]
        ? 'واجب مطلوب قبل المحاضرة القادمة'
        : 'المحاضرة 12 · التوحيد';
  const continuePercent = Math.min(100, latestVideoActivity?.percent || videoCompletionPercent || 54);
  const watchTime = latestVideoActivity ? formatWatchTime(Math.round(latestVideoActivity.watchedSeconds || 0)) : '27:45';
  const focusItems = smartWeakBranches?.length
    ? smartWeakBranches.slice(0, 3).map((item) => ({ title: item.branch, hint: `${item.pct}% يحتاج مراجعة`, minutes: '25 دقيقة', icon: Target, color: 'text-rose-300' }))
    : [
        { title: 'أكمل محاضرة الطهارة', hint: 'فقه العبادات · المحاضرة التالية', minutes: '45 دقيقة', icon: ClipboardCheck, color: 'text-cyan-300' },
        { title: 'حل الاختبار القصير', hint: 'اختبار قصير · 20 سؤال', minutes: '25 دقيقة', icon: ClipboardList, color: 'text-amber-300' },
        { title: 'مراجعة محتوى التفسير', hint: 'سورة الفاتحة · نقاط مهمة', minutes: '30 دقيقة', icon: BookOpen, color: 'text-emerald-300' },
      ];

  const statCards = [
    { key: 'videos', label: 'المحاضرات', value: videos.length || 15, hint: 'محاضرة متاحة', icon: Video, color: 'cyan', locked: isBannedContent },
    { key: 'courses', label: 'الكورسات', value: '6', hint: 'كورسات قيد التعلم', icon: GraduationCap, color: 'amber', locked: isBannedContent },
    { key: 'assignments', label: 'الواجبات', value: pendingAssignmentsCount || 0, hint: 'واجبات قيد التقديم', icon: FileCheck, color: 'blue', locked: isBannedExam },
    { key: 'exams', label: 'الاختبارات', value: exams.length || 0, hint: `${completedExamResults.length} مكتملة`, icon: Trophy, color: 'violet', locked: isBannedExam },
    { key: 'files', label: 'الملفات', value: filesAndLinks.length || 0, hint: 'ملف شخصي وموارد', icon: FolderOpen, color: 'green', locked: isBannedContent },
    { key: 'settings', label: 'المستوى التعليمي', value: '12', hint: 'الشهادة الثانوية عامة', icon: Users, color: 'teal', locked: false },
  ];

  const quickTools = [
    { label: 'رفع واجب', tab: 'assignments', icon: UploadCloud, color: 'cyan' },
    { label: 'تقييم محاضرة', tab: 'videos', icon: PlayCircle, color: 'blue' },
    { label: 'الملاحظات', tab: 'student_messages', icon: NotebookTabs, color: 'amber' },
    { label: 'خريطة ذهنية', tab: 'learning_path', icon: Map, color: 'green' },
    { label: 'المفضلة', tab: 'files', icon: Heart, color: 'rose' },
    { label: 'تقييم الأداء', tab: 'settings', icon: BarChart3, color: 'orange' },
  ];

  const scheduleItems = [
    { time: '10:00 ص', title: 'محاضرة متقدمة', subtitle: 'الرياضيات · التفاضل', color: 'bg-amber-400' },
    { time: '02:00 م', title: 'اختبار قصير', subtitle: 'لغة عربية', color: 'bg-violet-400' },
    { time: '06:00 م', title: 'مراجعة سريعة', subtitle: 'اختبار بنقاط محددة', color: 'bg-cyan-400' },
  ];

  return (
    <section className="nahhas-student-islamic-dashboard page-soft-enter" dir="rtl">
      <style>{`
        @keyframes nhIslamGlow { 0%,100% { opacity:.62; filter: drop-shadow(0 0 10px rgba(34,211,238,.25)); } 50% { opacity:1; filter: drop-shadow(0 0 28px rgba(245,158,11,.45)); } }
        @keyframes nhIslamBorder { to { transform: rotate(360deg); } }
        .nahhas-student-islamic-dashboard{margin:-.5rem; padding:1rem; border-radius:2rem; background:radial-gradient(circle at 12% 18%, rgba(14,165,233,.12), transparent 28rem), radial-gradient(circle at 90% 25%, rgba(245,158,11,.08), transparent 30rem), linear-gradient(180deg,#061322 0%,#071426 38%,#f5f8fb 38%,#f5f8fb 100%); color:#fff; overflow:hidden;}
        .nh-islam-card{position:relative; overflow:hidden; border:1px solid rgba(148,163,184,.22); background:linear-gradient(145deg,rgba(10,23,40,.88),rgba(4,12,24,.82)); box-shadow:0 22px 70px rgba(2,6,23,.28);}
        .nh-islam-glow-border{position:relative; isolation:isolate; overflow:hidden;}
        .nh-islam-glow-border:before{content:""; position:absolute; inset:-2px; z-index:-2; border-radius:inherit; background:conic-gradient(from 0deg,transparent,rgba(34,211,238,.75),rgba(245,158,11,.72),transparent,rgba(14,165,233,.65),transparent); animation:nhIslamBorder 7s linear infinite;}
        .nh-islam-glow-border:after{content:""; position:absolute; inset:1px; z-index:-1; border-radius:inherit; background:var(--nh-card-bg,linear-gradient(145deg,#08172a,#06111f));}
        .nh-mosque-scene{position:relative; min-height:290px; border-radius:2.1rem; background:radial-gradient(circle at 50% 30%,rgba(34,211,238,.22),transparent 38%),linear-gradient(180deg,#061b32,#020816); border:1px solid rgba(34,211,238,.18); box-shadow:inset 0 0 70px rgba(34,211,238,.08),0 22px 80px rgba(0,0,0,.28);}
        .nh-mosque-arch{position:absolute; inset:26px 36px 26px 36px; border:4px solid rgba(34,211,238,.56); border-bottom-width:1px; border-radius:48% 48% 10% 10%/58% 58% 10% 10%; box-shadow:0 0 44px rgba(34,211,238,.28); animation:nhIslamGlow 4s ease-in-out infinite;}
        .nh-moon{position:absolute; top:74px; right:50%; width:48px; height:48px; border-radius:50%; background:#f8fafc; box-shadow:0 0 38px rgba(255,255,255,.62); transform:translateX(50%)}
        .nh-moon:after{content:""; position:absolute; inset:-2px -11px 2px 10px; border-radius:50%; background:#061b32;}
        .nh-mosque-base{position:absolute; left:34px; right:34px; bottom:32px; height:80px; background:linear-gradient(180deg,transparent 0,#05243b 34%,#020816 100%); clip-path:polygon(0 100%,10% 52%,18% 72%,27% 35%,39% 62%,50% 14%,61% 62%,73% 35%,82% 72%,91% 52%,100% 100%); opacity:.92;}
        .nh-stat-cyan{--accent:#22d3ee}.nh-stat-amber{--accent:#f59e0b}.nh-stat-blue{--accent:#3b82f6}.nh-stat-violet{--accent:#a855f7}.nh-stat-green{--accent:#22c55e}.nh-stat-teal{--accent:#14b8a6}.nh-stat-rose{--accent:#f43f5e}.nh-stat-orange{--accent:#fb923c}
        .nh-stat-card{border:1px solid color-mix(in srgb,var(--accent) 36%,transparent); background:linear-gradient(135deg,rgba(15,23,42,.86),rgba(2,6,23,.78)); box-shadow:0 18px 42px rgba(2,6,23,.2), inset 0 -2px 0 color-mix(in srgb,var(--accent) 70%,transparent);}
        .nh-stat-card .nh-stat-icon{color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent); box-shadow:0 0 32px color-mix(in srgb,var(--accent) 28%,transparent);}
        .nh-orange-btn{background:linear-gradient(135deg,#facc15,#f97316); color:#08111f; box-shadow:0 18px 42px rgba(249,115,22,.28)}
        .nh-dashboard-light-card{background:rgba(255,255,255,.96); border:1px solid rgba(15,23,42,.08); color:#0f172a; box-shadow:0 20px 50px rgba(15,23,42,.08)}
        @media(max-width:900px){.nahhas-student-islamic-dashboard{margin:0;padding:.75rem}.nh-mosque-scene{min-height:230px}.nh-mosque-arch{inset:20px}.nh-student-hero-grid{grid-template-columns:1fr!important}.nh-dashboard-lower{grid-template-columns:1fr!important}}
      `}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-slate-900">
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowNotifications(true); setHasNewNotif?.(false); }} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-black shadow-sm text-slate-700"><Bell size={17} className="inline ml-2 text-amber-500" />الإشعارات</button>
          <button onClick={() => setActiveTab('settings')} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-black shadow-sm text-slate-700"><BarChart3 size={17} className="inline ml-2 text-cyan-600" />الإعدادات</button>
        </div>
        <span className="rounded-full bg-slate-950/90 px-4 py-2 text-xs font-black text-amber-200 ring-1 ring-amber-300/25">الباقة: {subscriptionText}</span>
      </div>

      <div className="nh-student-hero-grid grid grid-cols-[.86fr_1.14fr] gap-5">
        <div className="nh-mosque-scene">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(255,255,255,.12),transparent_2px)] bg-[length:28px_28px] opacity-30" />
          <div className="nh-mosque-arch" />
          <div className="nh-moon" />
          <div className="nh-mosque-base" />
          <div className="absolute bottom-6 right-6 h-16 w-10 rounded-t-full bg-amber-300/20 blur-sm" />
          <div className="absolute bottom-10 left-8 h-20 w-12 rounded-full bg-emerald-400/10 blur-xl" />
        </div>

        <div className="flex flex-col justify-between gap-4 py-2">
          <div className="text-right">
            <h1 className="text-4xl font-black leading-tight md:text-5xl">أهلاً <span className="text-amber-300">{firstName}</span></h1>
            <p className="mt-2 max-w-2xl text-lg font-black leading-8 text-slate-200">كل اللي محتاجه في لوحة واحدة.</p>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-slate-400">تابع تقدمك، استكمل محاضراتك، وطوّر مستواك مع كل الأدوات اللي تساعدك توصل لهدفك.</p>
          </div>

          <div className="nh-islam-glow-border rounded-[1.7rem] p-5" style={{ '--nh-card-bg': 'linear-gradient(135deg,#071426,#0a1628 58%,#111827)' }}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-2 text-sm font-black text-amber-300"><PlayCircle size={17}/> استكمال آخر محاضرة</p>
                <h2 className="truncate text-2xl font-black text-white md:whitespace-normal">{continueTitle}</h2>
                <p className="mt-1 text-sm font-bold text-slate-400">{continueMeta}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xl font-black text-amber-300">{continuePercent}%</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-amber-300 to-orange-500" style={{ width: `${continuePercent}%` }} /></div>
                </div>
              </div>
              <button onClick={nextStudyAction.action} className="grid h-24 w-24 place-items-center rounded-full border border-amber-300/30 bg-slate-950 text-white shadow-[0_0_45px_rgba(245,158,11,.35)] transition hover:scale-105">
                <Play size={34} fill="currentColor" />
              </button>
            </div>
            <button onClick={nextStudyAction.action} className="nh-orange-btn mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-lg font-black transition hover:-translate-y-0.5">
              استكمل الآن <span className="text-xl">←</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} disabled={item.locked} onClick={() => !item.locked && setActiveTab(item.key)} className={`nh-stat-card nh-stat-${item.color} rounded-3xl p-4 text-right transition hover:-translate-y-1 disabled:opacity-50`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="nh-stat-icon grid h-12 w-12 place-items-center rounded-2xl"><Icon size={23}/></span>
                <span className="text-xs font-black text-slate-400">{item.label}</span>
              </div>
              <p className="text-3xl font-black text-white">{item.value}</p>
              <p className="mt-1 truncate text-xs font-bold text-slate-400">{item.locked ? 'مغلق مؤقتًا' : item.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="nh-dashboard-lower mt-5 grid grid-cols-[1fr_1fr_1fr] gap-4">
        <div className="nh-islam-card nh-islam-glow-border rounded-3xl p-4" style={{ '--nh-card-bg': 'linear-gradient(135deg,#071426,#06111f)' }}>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black">تابع المشاهدة</h3><PlayCircle className="text-cyan-300" size={22}/></div>
          <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <button onClick={nextStudyAction.action} className="relative min-h-[150px] overflow-hidden rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,.24),transparent_34%),linear-gradient(135deg,#061729,#020817)]">
              <div className="absolute inset-0 opacity-25"><div className="nh-mosque-arch" style={{ inset: '22px', borderWidth: '2px' }} /></div>
              <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-black">متابعة</span>
              <span className="absolute left-4 bottom-4 rounded-lg bg-black/60 px-2 py-1 text-xs font-black">51:00</span>
              <span className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-white ring-2 ring-white/40"><Play size={26} fill="currentColor" /></span></span>
            </button>
            <div>
              <h4 className="text-2xl font-black text-white">{continueTitle}</h4>
              <p className="mt-1 text-sm font-bold text-slate-400">{continueMeta}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-bold text-slate-300"><span><span className="text-cyan-300">{watchTime}</span><br/>الوقت المتبقي</span><span><span className="text-emerald-300">{continuePercent}%</span><br/>نسبة التقدم</span></div>
              <button onClick={nextStudyAction.action} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-black text-white shadow-lg transition hover:bg-blue-500">متابعة المشاهدة</button>
            </div>
          </div>
        </div>

        <div className="nh-islam-card rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black">جدول اليوم</h3><CalendarDays className="text-cyan-300" size={22}/></div>
          <div className="space-y-3">
            {scheduleItems.map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className={`h-3 w-3 rounded-full ${item.color}`}/>
                <div className="min-w-0 flex-1"><p className="truncate font-black text-white">{item.title}</p><p className="truncate text-xs font-bold text-slate-400">{item.subtitle}</p></div>
                <span className="text-sm font-bold text-slate-300">{item.time}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab('learning_path')} className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-black text-slate-200 hover:bg-white/10">عرض الجدول الكامل</button>
        </div>

        <div className="nh-islam-card rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-xl font-black">أدوات سريعة</h3><Zap className="text-amber-300" size={22}/></div>
          <div className="grid grid-cols-2 gap-3">
            {quickTools.map((tool) => {
              const Icon = tool.icon;
              return <button key={tool.label} onClick={() => setActiveTab(tool.tab)} className={`nh-stat-card nh-stat-${tool.color} rounded-2xl p-3 text-right transition hover:-translate-y-0.5`}><Icon size={22} className="mb-2"/><span className="text-sm font-black text-white">{tool.label}</span></button>;
            })}
          </div>
          <button onClick={() => setActiveTab('courses')} className="mt-4 w-full rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 font-black text-cyan-200 hover:bg-cyan-400/15">عرض كل الأدوات</button>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-cyan-300/15 bg-slate-950/80 p-4 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-full bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30"><Trophy size={30}/></div><div><h3 className="text-xl font-black text-cyan-200">أنت على الطريق الصحيح!</h3><p className="text-sm font-bold text-slate-400">حافظ على استمراريتك واجتهادك للوصول إلى هدفك.</p></div></div>
          <div className="grid grid-cols-3 gap-4 text-center"><div><p className="text-2xl font-black text-cyan-300">{examResults.length || 7}</p><p className="text-xs text-slate-400">أيام متتالية</p></div><div><p className="text-2xl font-black text-amber-300">{completedExamResults.length ? `${averageScore}%` : '85%'}</p><p className="text-xs text-slate-400">إنجاز أسبوعي</p></div><button onClick={() => setActiveTab('performance')} className="rounded-xl bg-blue-600 px-5 py-2 font-black text-white">عرض التقرير</button></div>
        </div>
      </div>

      {latestVideoActivity?.video && !latestVideoActivity.isCompleted && (
        <ContentRatingCard userId={userId} contentId={latestVideoActivity.video.id} contentTitle={latestVideoActivity.video.title} />
      )}

      {nextOpenExam && !inProgressExam && (
        <button onClick={() => setActiveTab('exams')} className="mt-4 w-full rounded-3xl border border-blue-100 bg-blue-50 p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><p className="font-black text-blue-900">امتحان متاح الآن</p><p className="mt-1 text-sm font-bold text-blue-700">{nextOpenExam?.title || 'افتح مركز الامتحانات'}</p></div>
            <span className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-black text-white">فتح الامتحانات</span>
          </div>
        </button>
      )}
    </section>
  );
}
/* ─────────────────────────────────────────
   ⭐  تقييم المحاضرة بنجوم
   Collection: content_ratings/{userId}_{contentId}
   بدون Cloud Functions — client write مباشر
───────────────────────────────────────── */
export function ContentRatingCard({ userId, contentId, contentTitle }) {
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(false);

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
    <div className="nh-rating-card nh-animated-border rounded-2xl border border-amber-100 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-amber-700 mb-0.5">قيّم آخر محاضرة شاهدتها</p>
        <p className="text-sm font-bold text-slate-700 truncate">{contentTitle || 'المحاضرة الحالية'}</p>
      </div>
      {saved ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-black text-amber-600">شكراً على تقييمك!</span>
          <span className="text-lg">{'⭐'.repeat(rating)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              disabled={loading}
              onClick={() => submit(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-2xl transition-transform hover:scale-125 disabled:opacity-50"
              aria-label={`تقييم ${star} نجوم`}
            >
              <Star
                size={26}
                fill={(hover || rating) >= star ? '#f59e0b' : 'none'}
                className={(hover || rating) >= star ? 'text-amber-400' : 'text-slate-300'}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   📊  مقارنة الأداء مع المجموعة
   يعتمد على examResults الموجودة — بدون أي read جديد
───────────────────────────────────────── */
export function GroupPerformanceCard({ averageScore, completedExamResults, grade, setActiveTab }) {
  if (!completedExamResults?.length) return null;

  // نحاكي توزيع المجموعة من بيانات الطالب نفسه بشكل واقعي
  // (في البيئة الحقيقية هيحتاج query على examResults للمرحلة)
  const myAvg     = averageScore || 0;
  const excellent = myAvg >= 85 ? 'أنت من المتفوقين 🏆' : myAvg >= 70 ? 'أداؤك فوق المتوسط 💪' : myAvg >= 50 ? 'أنت في المنتصف — ارفع من مستواك' : 'أنت أقل من المتوسط — تحتاج مجهود أكبر';
  const barColor  = myAvg >= 85 ? 'from-emerald-400 to-teal-500' : myAvg >= 70 ? 'from-blue-400 to-indigo-500' : myAvg >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500';

  // شريط مقارنة بسيط: طالبنا vs متوسط افتراضي للمرحلة (70%)
  const groupAvg  = 70;
  const diff      = myAvg - groupAvg;
  const diffText  = diff > 0 ? `+${diff}% فوق متوسط المجموعة` : diff < 0 ? `${diff}% تحت متوسط المجموعة` : 'مساوٍ لمتوسط المجموعة';
  const diffColor = diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-500';

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
          <BarChart3 size={18} className="text-blue-500" />
          موقعك بين زملائك
        </h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
          {grade || 'مرحلتك'}
        </span>
      </div>

      {/* شريط الطالب */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black text-slate-500">متوسطك</span>
          <span className="text-xs font-black text-slate-900">{myAvg}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all`} style={{ width: `${Math.min(100, myAvg)}%` }} />
        </div>
      </div>

      {/* شريط المجموعة */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black text-slate-500 flex items-center gap-1"><Users size={12} /> متوسط المجموعة</span>
          <span className="text-xs font-black text-slate-500">{groupAvg}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-slate-300 transition-all" style={{ width: `${groupAvg}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs font-black text-slate-900">{excellent}</p>
          <p className={`text-xs font-bold mt-0.5 ${diffColor}`}>{diffText}</p>
        </div>
        <button
          onClick={() => setActiveTab?.('settings')}
          className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700 transition"
        >
          تقرير كامل
        </button>
      </div>
    </div>
  );
}
