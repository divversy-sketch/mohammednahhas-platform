import React from 'react';
import {
  BarChart3,
  Bell,
  BrainCircuit,
  ClipboardList,
  Crown,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Target,
} from '../../../shared/icons/lucide-shim.jsx';
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
