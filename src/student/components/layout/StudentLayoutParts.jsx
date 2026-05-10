import React from 'react';
import { Crown } from '../../../shared/icons/lucide-shim.jsx';
import { getGradeLabel } from '../../../shared/constants/grades';

export function StudentTopGreeting({ user, userData, isPremium, videos, exams, examResults, setActiveTab }) {
  const studentFirstName = String(userData?.name || user?.displayName || 'طالب').split(' ')[0];
  return (
    <section className="student-sticky-hero bg-white/95 backdrop-blur-xl border border-amber-100 rounded-3xl shadow-xl p-4 md:p-5 mb-6 overflow-hidden relative">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-arabic flex flex-wrap items-center gap-2">
            منور يا <span className="text-amber-600">{studentFirstName}</span> 👋
            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-sans">{getGradeLabel(userData?.grade)}</span>
            {isPremium ? (
              <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><Crown size={14}/> حساب VIP</span>
            ) : (
              <button className="bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 transition" onClick={()=>setActiveTab('subscription')}>مجاني (رقي حسابك)</button>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center min-w-[220px]">
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100"><p className="text-xl font-black text-amber-700">{videos.length}</p><p className="text-[11px] text-amber-800 font-bold">محاضرة</p></div>
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100"><p className="text-xl font-black text-blue-700">{exams.length}</p><p className="text-[11px] text-blue-800 font-bold">امتحان</p></div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100"><p className="text-xl font-black text-emerald-700">{examResults.length}</p><p className="text-[11px] text-emerald-800 font-bold">نتيجة</p></div>
        </div>
      </div>
    </section>
  );
}

export function LearningHubTabs({ activeTab, setActiveTab, setLearningHubTab }) {
  return (
    <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm mb-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button onClick={() => { setLearningHubTab('assignments'); setActiveTab('assignments'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'assignments' ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-50 text-emerald-700'}`}>الواجبات</button>
        <button onClick={() => { setLearningHubTab('history'); setActiveTab('smart_hw_results'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'smart_hw_results' ? 'bg-blue-600 text-white shadow' : 'bg-blue-50 text-blue-700'}`}>سجل الواجبات</button>
        <button onClick={() => { setLearningHubTab('mistakes'); setActiveTab('mistakes_bank'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'mistakes_bank' ? 'bg-red-600 text-white shadow' : 'bg-red-50 text-red-700'}`}>بنك الأخطاء</button>
      </div>
    </div>
  );
}
