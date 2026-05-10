import React from 'react';
import { FileText, LogOut, Play, CheckCircle, Check, XCircle, PenTool, BrainCircuit, Layers, ClipboardList, Clock } from '../../../shared/icons/lucide-shim.jsx';
import { generatePDF, getGradeBadge, calculateDetailedExamMetrics, getPerformanceInsights, StudentLocalAdvice, platformNotify } from '../../../shared/core/platformShared.jsx';

export default function ExamDashboardView({
  exam,
  user,
  isSubmitted,
  timeLeft,
  score,
  mcqQuestions,
  flatQuestions,
  answers,
  onClose,
  setActiveView,
  confirmSubmit,
  totalQs,
  percentage,
  solvedQs,
  correctQs,
  wrongQs,
  essayAnswered,
  essayQuestions,
  antiCheatWarnings,
  branchStats,
  canReview,
  setActiveBranchTab
}) {
  const detailedMetrics = calculateDetailedExamMetrics(exam, answers);
  const performanceInsights = getPerformanceInsights(detailedMetrics);
  const gradeBadge = getGradeBadge(detailedMetrics.percentage || percentage);

  return (
      <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto p-4 md:p-8 font-['Cairo'] text-slate-200" dir="rtl">
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-700 pb-4 gap-4">
            <div className="text-center md:text-right">
              <h2 className="text-3xl font-black text-white mb-2">{exam.title}</h2>
              {isSubmitted ? (
                <p className="text-lg text-slate-400">الطالب: {user.displayName}</p>
              ) : (
                <p className="text-amber-400 font-bold">⏳ الوقت المتبقي: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isSubmitted ? (
                <>
                  <button
                    onClick={() => generatePDF('student', { studentName: user.displayName, score, total: mcqQuestions.length, status: 'completed', examTitle: exam.title, questions: flatQuestions, answers })}
                    className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
                    title="تحميل التقرير PDF"
                  >
                    <FileText size={20} />
                  </button>
                  <button onClick={onClose} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-600 shadow-lg transition flex items-center gap-2">
                    خروج <LogOut size={18} />
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setActiveView('questions')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    استكمال الامتحان <Play size={18} />
                  </button>
                  <button onClick={confirmSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2">
                    تسليم الآن <CheckCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">عدد الأسئلة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{totalQs}</p>
            </div>
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">{isSubmitted ? 'النتيجة' : 'تم الحل'}</p>
              <p className="text-4xl md:text-5xl font-black text-white">{isSubmitted ? `${percentage}%` : `${solvedQs}/${totalQs}`}</p>
            </div>
            <div className="bg-[#0e7490] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-cyan-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16} /> المحلولة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{solvedQs}</p>
            </div>
            <div className="bg-[#115e59] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-teal-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Check size={16} /> الصحيحة</p>
              <p className="text-4xl md:text-5xl font-black text-teal-50">{correctQs}</p>
            </div>
            <div className="bg-[#831843] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-pink-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><XCircle size={16} /> الخاطئة</p>
              <p className="text-4xl md:text-5xl font-black text-pink-50">{wrongQs}</p>
            </div>
            <div className="bg-[#78350f] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><PenTool size={16} /> المقالي</p>
              <p className="text-4xl md:text-5xl font-black text-amber-50">{essayAnswered}/{essayQuestions.length}</p>
            </div>
          </div>

          {!isSubmitted && (
            <div className="mb-6 bg-slate-800/60 text-slate-200 p-4 rounded-2xl border border-slate-700 text-center font-bold">
              وضع الأمان مفعل: يتم تسجيل الخروج من الصفحة، النسخ/اللصق، كليك يمين، والخروج من ملء الشاشة.
              زر ملء الشاشة موجود الآن بجانب زر التسليم داخل صفحة الأسئلة.
            </div>
          )}

          {antiCheatWarnings > 0 && !isSubmitted && (
            <div className="mb-6 bg-amber-900/30 text-amber-300 p-4 rounded-2xl border border-amber-700 text-center font-bold">
              تم تسجيل {antiCheatWarnings} تنبيه أمان. النظام يعطي تنبيهات قبل أي إجراء نهائي لتجنب ظلم الطالب.
            </div>
          )}

          {isSubmitted && (
            <div className="mb-10 bg-white/5 border border-slate-700 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><BrainCircuit className="text-amber-400"/> المراجعة الذكية</h3>
                <span className={`px-4 py-2 rounded-full border text-sm font-bold ${gradeBadge.tone}`}>{gradeBadge.text} - {detailedMetrics.percentage || percentage}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">إجمالي الدرجة</p><p className="text-2xl font-black text-emerald-300">{detailedMetrics.totalScore}/{detailedMetrics.totalPossible || mcqQuestions.length}</p></div>
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">اختياري</p><p className="text-2xl font-black text-blue-300">{detailedMetrics.mcqCount} سؤال</p></div>
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">مقالي</p><p className="text-2xl font-black text-amber-300">{detailedMetrics.essayCount} سؤال</p></div>
              </div>
              <div className="space-y-2">
                {performanceInsights.map((note, idx) => <div key={idx} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm font-bold">{note}</div>)}
              </div>
              <div className="mt-5">
                <StudentLocalAdvice metrics={detailedMetrics} content={[]} />
              </div>
            </div>
          )}

          {!isSubmitted && (
            <div className="mb-6 bg-blue-900/20 text-blue-300 p-4 rounded-2xl border border-blue-900/40 text-center font-bold">
              زر التسليم أصبح ظاهرًا في أعلى صفحة الأسئلة وأيضًا داخل لوحة التحكم.
            </div>
          )}

          {Object.keys(branchStats).length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-teal-400"><Layers size={28} /> {isSubmitted ? 'ملخص الفروع' : 'أقسام الامتحان'}</h3>
                {(canReview || !isSubmitted) && (
                  <button onClick={() => { setActiveBranchTab('الكل'); setActiveView('questions'); }} className="text-teal-400 bg-teal-900/30 px-4 py-2 rounded-lg font-bold hover:bg-teal-900/50 transition text-sm flex items-center gap-2">
                    مراجعة الامتحان كله <ClipboardList size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(branchStats).map(([branch, stats], idx) => {
                  const branchMcqTotal = flatQuestions.filter(q => q.branch === branch && q.type !== 'essay').length;
                  const bPercent = branchMcqTotal > 0 ? Math.round((stats.correct / branchMcqTotal) * 100) : 100;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!isSubmitted || canReview) {
                          setActiveBranchTab(branch);
                          setActiveView('questions');
                        } else {
                          platformNotify("نموذج الإجابة سيتاح بعد انتهاء وقت الامتحان للجميع.");
                        }
                      }}
                      className={`bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-lg transition group ${(!isSubmitted || canReview) ? 'cursor-pointer hover:border-teal-400 hover:-translate-y-1' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className={`${isSubmitted ? 'text-teal-400' : 'text-blue-400'} text-4xl font-black`}>{bPercent}%</span>
                        <span className="text-xl font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">{branch}</span>
                      </div>
                      <div className="w-full bg-[#0f172a] rounded-full h-2.5 mb-6 overflow-hidden">
                        <div className={`${isSubmitted ? 'bg-teal-400' : 'bg-blue-400'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${bPercent}%` }} />
                      </div>
                      <div className="text-sm mt-4 bg-[#0f172a] p-3 rounded-lg text-slate-300 space-y-1">
                        <div className="flex justify-between"><span>إجمالي</span><span>{stats.total}</span></div>
                        <div className="flex justify-between"><span>صحيحة</span><span className="text-teal-300">{stats.correct}</span></div>
                        <div className="flex justify-between"><span>خاطئة</span><span className="text-pink-300">{stats.wrong}</span></div>
                        <div className="flex justify-between"><span>مقالي</span><span className="text-amber-300">{stats.essay}</span></div>
                      </div>
                      {(canReview || !isSubmitted) && (
                        <div className="mt-4 text-center text-teal-300 text-xs font-bold">
                          اضغط لمراجعة هذا الفرع فقط
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!canReview && isSubmitted && (
            <div className="mt-8 bg-amber-900/30 text-amber-400 p-6 rounded-2xl border border-amber-900 text-center font-bold text-lg flex flex-col items-center gap-3">
              <Clock size={32} />
              نموذج الإجابة والمراجعة سيظهر هنا تلقائياً بعد انتهاء وقت الامتحان للأغلبية.
            </div>
          )}

          {!isSubmitted && (
            <div className="flex justify-end mt-8 border-t border-slate-700 pt-6">
              <button onClick={confirmSubmit} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                <CheckCircle size={20} /> تسليم الامتحان نهائياً
              </button>
            </div>
          )}
        </div>
      </div>
  );
}
