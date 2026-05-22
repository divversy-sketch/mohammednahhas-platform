import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target, Star, Users } from '@shared/icons/lucide-shim.jsx';
import { formatWatchTime } from '@shared/core/platformShared.jsx';
import { db } from '@services/firebase.js';

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
