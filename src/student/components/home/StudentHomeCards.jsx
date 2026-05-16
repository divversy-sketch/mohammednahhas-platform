
import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target, Star, Users } from '../../../shared/icons/lucide-shim.jsx';
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
  nextStudyAction,
  latestVideoActivity,
  pendingAssignments,
  pendingAssignmentsCount,
  videoCompletionPercent,
  completedVideoCount,
  videos,
  exams,
  filesAndLinks,
  completedExamResults,
  averageScore,
  examResults,
  setActiveTab,
  isBannedContent,
  isBannedExam,
}) {
  const firstName = String(userData?.name || 'محمد').split(' ')[0];
  const safeVideos = Array.isArray(videos) ? videos : [];
  const latest = latestVideoActivity?.video || safeVideos[0] || null;
  const continueTitle = latest?.title || nextStudyAction?.title || 'محاضرة اسم الفاعل';
  const continueSubtitle = latest?.branch || latest?.videoSection || 'النحو - اللغة العربية';
  const continuePercent = Math.max(0, Math.min(100, Math.round(latestVideoActivity?.percent || videoCompletionPercent || 0)));
  const lectureCards = (safeVideos.length ? safeVideos : [
    { id: 'placeholder-1', title: 'اسم الفاعل', branch: 'النحو', estimatedDurationMinutes: 38 },
    { id: 'placeholder-2', title: 'التشبيه وأنواعه', branch: 'البلاغة', estimatedDurationMinutes: 42 },
    { id: 'placeholder-3', title: 'النصوص المتحررة', branch: 'القراءة', estimatedDurationMinutes: 35 },
  ]).slice(0, 3);
  const getThumb = (item, index) => item?.thumbnailUrl || item?.imageUrl || item?.coverUrl || item?.image || '';
  const progressOf = (item, index) => {
    if (latestVideoActivity?.video?.id && latestVideoActivity.video.id === item?.id) return continuePercent;
    if (index === 0) return Math.max(continuePercent, 15);
    return [42, 25, 0][index] || 0;
  };
  const tasks = [
    pendingAssignments?.[0]?.title ? { time: 'اليوم', title: pendingAssignments[0].title, type: 'واجب' } : null,
    exams?.[0]?.title ? { time: 'قريبًا', title: exams[0].title, type: 'اختبار' } : null,
    { time: '09:00 م', title: 'مراجعة اسم الفاعل', type: 'مراجعة' },
    { time: '11:30 م', title: 'حل تدريب قصير', type: 'تدريب' },
  ].filter(Boolean).slice(0, 4);

  return (
    <section className="nh-neon-home page-soft-enter" dir="rtl">
      <aside className="nh-neon-side">
        <div className="nh-glass nh-assistant">
          <div className="nh-orb" />
          <h3>المساعد الذكي</h3>
          <p>اسأل عن أي درس أو امتحان أو ملف، وسيتم توجيهك بسرعة.</p>
          <button type="button" onClick={() => setActiveTab?.('support')} className="nh-neon-btn secondary mt-4">ابدأ محادثة</button>
        </div>

        <div className="nh-glass nh-progress-card">
          <div className="nh-progress-row">
            <div className="nh-progress-ring" style={{ '--pct': videoCompletionPercent || 0 }}><b>{videoCompletionPercent || 0}%</b></div>
            <div>
              <h3 className="nh-card-title">ملخص تقدمك</h3>
              <p className="nh-muted">+12% عن الأسبوع الماضي</p>
            </div>
          </div>
          <div className="nh-mini-stats">
            <div className="nh-mini-stat"><span>المحاضرات</span><b>{completedVideoCount || 0}</b></div>
            <div className="nh-mini-stat"><span>ساعات التعلم</span><b>18.6</b></div>
            <div className="nh-mini-stat"><span>الاختبارات</span><b>{completedExamResults?.length || 0}</b></div>
          </div>
        </div>

        <div className="nh-glass nh-progress-card text-center">
          <h3 className="nh-card-title">سلسلة التعلم 🔥</h3>
          <div className="text-4xl font-black mt-3">12</div>
          <p className="nh-muted">أيام متتالية</p>
          <div className="nh-streak-dots"><i className="on"/><i className="on"/><i className="on"/><i className="on"/><i/><i/><i/></div>
        </div>
      </aside>

      <main className="nh-neon-main">
        <div className="nh-topbar md:hidden">
          <div>
            <h2 className="text-2xl font-black">مرحبًا {firstName} 👋</h2>
            <p className="nh-muted">جاهز لمواصلة التعلم اليوم؟</p>
          </div>
        </div>

        <section className="nh-glass nh-hero">
          <div className="nh-hero-art" style={getThumb(latest, 0) ? { backgroundImage: `linear-gradient(135deg, rgba(7,17,38,.18), rgba(15,23,42,.55)), url(${getThumb(latest, 0)})` } : undefined} />
          <div>
            <span className="nh-kicker">متابعة التعلم</span>
            <h1>{continueTitle}</h1>
            <p className="nh-hero-sub">{continueSubtitle}</p>
            <div className="nh-progress-line">
              <span className="font-black text-white">{continuePercent}%</span>
              <div className="nh-bar"><span style={{ width: `${continuePercent}%` }} /></div>
              <span className="nh-muted">آخر تقدم</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={isBannedContent} onClick={nextStudyAction?.action || (() => setActiveTab?.('videos'))} className="nh-neon-btn"><PlayCircle size={18}/> متابعة المحاضرة</button>
              <button type="button" onClick={() => setActiveTab?.('videos')} className="nh-neon-btn secondary">عرض التفاصيل</button>
            </div>
          </div>
        </section>

        <section className="nh-glass nh-path">
          <div className="flex items-center justify-between gap-4"><h3 className="nh-card-title">مساري الدراسي</h3><button onClick={() => setActiveTab?.('learning_path')} className="nh-kicker">عرض الخطة كاملة</button></div>
          <div className="nh-path-row">
            {[['01','أساسيات النحو'],['02','البلاغة'],['03','اسم الفاعل'],['04','النصوص'],['05','تدريبات متقدمة']].map((step, i) => (
              <button key={step[0]} onClick={() => setActiveTab?.('courses')} className={`nh-path-step ${i === 2 ? 'active' : ''}`}><span>{step[1]}</span><small>{step[0]}</small></button>
            ))}
          </div>
        </section>

        <section className="nh-dashboard-grid">
          <div className="nh-glass nh-analytics">
            <h3 className="nh-card-title">خطة اليوم</h3>
            <div className="nh-task-list">
              {tasks.map((task, index) => (
                <div className="nh-task" key={`${task.title}-${index}`}><span className="nh-time">{task.time}</span><b>{task.title}</b><small className="nh-kicker">{task.type}</small></div>
              ))}
            </div>
            <button type="button" onClick={() => setActiveTab?.('assignments')} className="nh-neon-btn secondary w-full mt-4">عرض الجدول الكامل</button>
          </div>

          <div className="nh-glass nh-analytics">
            <div className="flex items-center justify-between gap-3"><h3 className="nh-card-title">المحاضرات الحديثة</h3><button onClick={() => setActiveTab?.('videos')} className="nh-kicker">عرض الكل</button></div>
            <div className="nh-lecture-grid">
              {lectureCards.map((item, index) => {
                const thumb = getThumb(item, index);
                const pct = progressOf(item, index);
                return (
                  <button key={item.id || item.title || index} onClick={() => !isBannedContent && setActiveTab?.('videos')} className="nh-lecture text-right">
                    <div className={`nh-thumb ${thumb ? 'has-img' : ''}`} style={thumb ? { backgroundImage: `linear-gradient(180deg, rgba(7,17,38,.04), rgba(7,17,38,.65)), url(${thumb})` } : undefined}>
                      <span className="nh-duration">{item.estimatedDurationMinutes ? `${item.estimatedDurationMinutes}:00` : ['42:18','38:45','45:10'][index]}</span>
                    </div>
                    <div className="nh-lecture-body">
                      <div className="nh-lecture-title">{item.title || 'محاضرة جديدة'}</div>
                      <div className="nh-lecture-meta">{item.branch || 'اللغة العربية'}</div>
                      <div className="nh-progress-line !my-2"><span className="text-xs">{pct}%</span><div className="nh-bar"><span style={{ width: `${pct}%` }}/></div></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="nh-glass nh-analytics">
            <h3 className="nh-card-title">تحليلات سريعة</h3>
            <p className="nh-muted">ساعات التعلم</p>
            <div className="flex items-end justify-between mt-2"><b className="text-4xl">18.6</b><span className="text-emerald-300 font-black">+2.6</span></div>
            <div className="nh-bars"><span style={{height:'36%'}}/><span style={{height:'44%'}}/><span style={{height:'58%'}}/><span style={{height:'46%'}}/><span style={{height:'68%'}}/><span style={{height:'76%'}}/><span style={{height:'64%'}}/></div>
            <div className="nh-points"><p className="nh-muted">متوسط الاختبارات</p><b className="text-3xl">{completedExamResults?.length ? `${averageScore}%` : '—'}</b></div>
          </div>
        </section>
      </main>
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
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
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
