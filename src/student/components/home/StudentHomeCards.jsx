
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target } from '../../../shared/icons/lucide-shim.jsx';
import { formatWatchTime } from '../../../shared/core/platformShared.jsx';

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
}) {
  const firstName = String(userData?.name || 'بطل').split(' ')[0];
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null ? 'VIP مفعل' : `${subscriptionDaysLeft} يوم متبقي`)
    : 'فعّل الباقة';
  const focusItems = smartWeakBranches?.length
    ? smartWeakBranches.map((item) => `${item.branch} · ${item.pct}%`)
    : ['راجع آخر محاضرة', 'حل امتحان قصير', 'راجع أخطاءك'];

  const mainActions = [
    { key: 'videos', label: 'المحاضرات', value: videos.length, hint: `${completedVideoCount}/${videos.length || 0} مكتملة`, icon: PlayCircle, tone: 'from-blue-600 to-sky-600', locked: isBannedContent },
    { key: 'courses', label: 'الكورسات', value: 'افتح', hint: 'المباشر والكورسات', icon: BookOpen, tone: 'from-indigo-600 to-blue-800', locked: isBannedContent },
    { key: 'exams', label: 'الامتحانات', value: exams.length, hint: `${completedExamResults.length} مكتملة`, icon: ClipboardList, tone: 'from-amber-500 to-orange-600', locked: isBannedExam },
    { key: 'assignments', label: 'الواجبات', value: pendingAssignmentsCount, hint: pendingAssignments?.[0]?.title || 'لا يوجد معلق', icon: FileCheck, tone: 'from-emerald-500 to-teal-700', locked: isBannedExam },
    { key: 'files', label: 'الملفات', value: filesAndLinks.length, hint: 'ملفات وروابط', icon: FileText, tone: 'from-rose-500 to-red-700', locked: isBannedContent },
    { key: 'htmls', label: 'تفاعلي', value: htmls.length, hint: 'أنشطة ذكية', icon: Code, tone: 'from-purple-600 to-fuchsia-700', locked: isBannedContent },
    { key: 'student_messages', label: 'رسائلي', value: unseenNotificationCount || 0, hint: 'تنبيهات ورسائل', icon: MessageSquare, tone: 'from-cyan-600 to-teal-700', locked: false },
    { key: 'settings', label: 'أدائي', value: completedExamResults.length ? `${averageScore}%` : 'ابدأ', hint: `${examResults.length} نتيجة`, icon: BarChart3, tone: 'from-slate-800 to-slate-950', locked: false },
  ];

  return (
    <section className="page-soft-enter space-y-5">
      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-slate-950 p-4 md:p-6 shadow-2xl text-white">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1 text-xs font-black text-amber-200">
                <Sparkles size={14} /> الرئيسية المختصرة
              </span>
              <h1 className="mt-4 text-3xl md:text-5xl font-black leading-[1.25]">
                أهلاً <span className="text-amber-300">{firstName}</span>، كل اللي محتاجه في لوحة واحدة.
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-base font-bold leading-8 text-slate-300">
                اختار وجهتك من الكروت بالأسفل بدل الزحمة. المحاضرات، الامتحانات، الواجبات، الملفات، والتقارير كلها بضغطة واحدة.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black text-amber-200">خطوتك التالية</p>
                  <h2 className="mt-1 text-xl md:text-2xl font-black truncate md:whitespace-normal">{nextStudyAction.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-300 line-clamp-2">{nextStudyAction.text}</p>
                </div>
                <button onClick={nextStudyAction.action} className={`shrink-0 rounded-2xl px-5 py-3 font-black shadow-lg transition hover:-translate-y-0.5 bg-gradient-to-r ${nextStudyAction.tone || 'from-amber-400 to-orange-500 text-slate-950'}`}>
                  <span className="flex items-center justify-center gap-2">{nextStudyAction.icon}{nextStudyAction.button}</span>
                </button>
              </div>
              {latestVideoActivity && (
                <div className="mt-4">
                  <div className="h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, latestVideoActivity.percent || 0)}%` }} /></div>
                  <p className="mt-2 text-xs font-black text-amber-100">آخر محاضرة: {latestVideoActivity.percent || 0}% مشاهدة</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 content-start">
            <button onClick={() => setActiveTab('subscription')} className="rounded-3xl border border-amber-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <Crown className="mb-3 text-amber-300" size={24} />
              <p className="text-xs font-black text-amber-100">الاشتراك</p>
              <p className="mt-1 text-xl font-black text-white">{subscriptionText}</p>
            </button>
            <button onClick={() => setActiveTab('videos')} className="rounded-3xl border border-blue-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <PlayCircle className="mb-3 text-sky-300" size={24} />
              <p className="text-xs font-black text-sky-100">تقدم المحاضرات</p>
              <p className="mt-1 text-xl font-black text-white">{videoCompletionPercent}%</p>
            </button>
            <button onClick={() => setActiveTab('exams')} className="rounded-3xl border border-purple-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <ClipboardList className="mb-3 text-purple-300" size={24} />
              <p className="text-xs font-black text-purple-100">متوسط الامتحانات</p>
              <p className="mt-1 text-xl font-black text-white">{completedExamResults.length ? `${averageScore}%` : 'ابدأ'}</p>
            </button>
            <button onClick={() => setActiveTab('assignments')} className="rounded-3xl border border-emerald-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <FileCheck className="mb-3 text-emerald-300" size={24} />
              <p className="text-xs font-black text-emerald-100">واجبات مطلوبة</p>
              <p className="mt-1 text-xl font-black text-white">{pendingAssignmentsCount}</p>
            </button>
          </div>
        </div>
      </div>

      {(inProgressExam || nextOpenExam) && (
        <button onClick={() => setActiveTab('exams')} className="w-full rounded-3xl border border-blue-100 bg-blue-50 p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-black text-blue-900">{inProgressExam ? 'لديك محاولة محفوظة' : 'امتحان متاح الآن'}</p>
              <p className="mt-1 text-sm font-bold text-blue-700">{(inProgressExam || nextOpenExam)?.title || 'افتح مركز الامتحانات'}</p>
            </div>
            <span className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-black text-white">فتح الامتحانات</span>
          </div>
        </button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {mainActions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              disabled={item.locked}
              onClick={() => !item.locked && setActiveTab(item.key)}
              className={`group relative overflow-hidden rounded-3xl p-4 text-right text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-br ${item.tone}`}
            >
              <Icon className="absolute -bottom-4 -left-4 h-20 w-20 text-white/15 transition group-hover:scale-110" />
              <div className="relative z-10">
                <p className="text-xs font-black text-white/80">{item.label}</p>
                <p className="mt-2 text-2xl font-black">{item.value}</p>
                <p className="mt-1 truncate text-xs font-bold text-white/80">{item.locked ? 'مغلق مؤقتًا' : item.hint}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/95 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Target className="text-amber-600" /> ركّز على المهم</h3>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">بدون تشتت</span>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {focusItems.slice(0, 3).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-400">نقطة {index + 1}</p>
                <p className="mt-1 font-black text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/95 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Bell className="text-blue-600" /> آخر التنبيهات</h3>
            <button onClick={() => { setShowNotifications(true); setHasNewNotif?.(false); }} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">عرض الكل</button>
          </div>
          <div className="space-y-2">
            {recentNotificationItems?.length ? recentNotificationItems.slice(0, 3).map((n, i) => (
              <div key={n.id || i} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="truncate text-sm font-black text-slate-900">{n.title || 'تنبيه جديد'}</p>
                <p className="line-clamp-1 text-xs font-bold text-slate-500">{n.body || n.text || n.message || ''}</p>
              </div>
            )) : <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">لا توجد تنبيهات جديدة.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
