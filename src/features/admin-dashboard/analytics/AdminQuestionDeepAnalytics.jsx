import { useState, useEffect, useMemo } from 'react';


import { BarChart3 } from '@shared/icons/lucide-shim.jsx';


import { safeNumber, extractAllQuestions } from '@shared/core/platformShared.jsx';


export const AdminQuestionDeepAnalytics = ({ examsList = [], examResults = [] }) => {
  const [selectedExamId, setSelectedExamId] = useState('');

  const selectedExam = useMemo(() => {
    return (examsList || []).find(e => e.id === selectedExamId) || (examsList || [])[0] || null;
  }, [examsList, selectedExamId]);

  useEffect(() => {
    if (!selectedExamId && examsList?.length) setSelectedExamId(examsList[0].id);
  }, [examsList, selectedExamId]);

  const analytics = useMemo(() => {
    if (!selectedExam) return { rows: [], branchSummary: [], resultCount: 0 };
    const questions = extractAllQuestions(selectedExam);
    const results = (examResults || []).filter(r => r.examId === selectedExam.id && (r.status === 'completed' || r.answers));

    const rows = questions.map((q, idx) => {
      const optionCounts = {};
      const wrongStudents = [];
      let answered = 0;
      let correct = 0;
      let wrong = 0;

      results.forEach(r => {
        const ans = r.answers?.[q.id];
        const hasAnswer = q.type === 'essay'
          ? !!(ans && ((typeof ans === 'string' && ans.trim()) || ans.text || ans.image))
          : ans !== undefined && ans !== null && ans !== '';

        if (hasAnswer) answered += 1;

        if (q.type !== 'essay') {
          if (hasAnswer) optionCounts[String(ans)] = safeNumber(optionCounts[String(ans)], 0) + 1;
          if (ans === q.correctIdx) correct += 1;
          else if (hasAnswer) {
            wrong += 1;
            wrongStudents.push(r.studentName || 'طالب');
          }
        }
      });

      const correctRate = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
      const difficulty = q.type === 'essay' ? 'مقالي' : correctRate >= 80 ? 'سهل' : correctRate >= 50 ? 'متوسط' : 'صعب';

      return {
        index: idx + 1,
        id: q.id,
        text: q.text || '',
        branch: q.branch || 'عام',
        type: q.type || 'mcq',
        correctRate,
        answered,
        correct,
        wrong,
        optionCounts,
        wrongStudents,
        difficulty
      };
    });

    const branchMap = {};
    rows.forEach(row => {
      branchMap[row.branch] = branchMap[row.branch] || { branch: row.branch, total: 0, avgCorrect: 0, hard: 0, wrong: 0 };
      branchMap[row.branch].total += 1;
      branchMap[row.branch].avgCorrect += row.correctRate;
      branchMap[row.branch].wrong += row.wrong;
      if (row.difficulty === 'صعب') branchMap[row.branch].hard += 1;
    });

    const branchSummary = Object.values(branchMap)
      .map(b => ({ ...b, avgCorrect: b.total ? Math.round(b.avgCorrect / b.total) : 0 }))
      .sort((a, b) => a.avgCorrect - b.avgCorrect);

    return { rows, branchSummary, resultCount: results.length };
  }, [selectedExam, examResults]);

  if (!examsList?.length) {
    return <div className="glass-panel p-6 rounded-2xl text-center text-slate-500 font-bold">لا توجد امتحانات لتحليلها بعد.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-5 border-t-4 border-indigo-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-indigo-600"/> تحليل الأسئلة المتقدم</h2>
            <p className="text-sm text-slate-500 mt-1">اعرف السؤال الصعب، نسبة الصح، واختيارات الطلاب لكل سؤال.</p>
          </div>
          <select className="border rounded-xl p-3 min-w-[260px]" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
            {examsList.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4"><p className="text-xs text-indigo-600 font-bold">عدد النتائج</p><p className="text-3xl font-black text-indigo-800">{analytics.resultCount || 0}</p></div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs text-blue-600 font-bold">عدد الأسئلة</p><p className="text-3xl font-black text-blue-800">{analytics.rows.length}</p></div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs text-red-600 font-bold">أسئلة صعبة</p><p className="text-3xl font-black text-red-800">{analytics.rows.filter(r => r.difficulty === 'صعب').length}</p></div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs text-emerald-600 font-bold">الفروع</p><p className="text-3xl font-black text-emerald-800">{analytics.branchSummary.length}</p></div>
        </div>

        <h3 className="font-black text-slate-800 mb-3">أضعف الفروع في هذا الامتحان</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {analytics.branchSummary.slice(0, 6).map(b => (
            <div key={b.branch} className="bg-white border rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2"><span className="font-black text-slate-800">{b.branch}</span><span className="font-black text-red-600">{b.avgCorrect}%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-red-500 h-2" style={{width: `${Math.max(0, Math.min(100, b.avgCorrect))}%`}} /></div>
              <p className="text-xs text-slate-500 mt-2">صعبة: {b.hard} / أخطاء: {b.wrong}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {analytics.rows.map(row => {
            const originalQuestion = extractAllQuestions(selectedExam).find(q => q.id === row.id) || {};
            return (
              <div key={`${row.id}-${row.index}`} className="bg-white border rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full font-bold">سؤال {row.index}</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">{row.branch}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${row.difficulty === 'صعب' ? 'bg-red-100 text-red-700' : row.difficulty === 'متوسط' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.difficulty}</span>
                    </div>
                    <p className="font-bold text-slate-800 leading-relaxed">{String(row.text).replaceAll('|', ' / ')}</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-xl p-3 min-w-[120px]">
                    <p className="text-xs text-slate-500 font-bold">نسبة الصح</p>
                    <p className="text-3xl font-black text-indigo-700">{row.correctRate}%</p>
                  </div>
                </div>

                {row.type !== 'essay' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {Object.entries(row.optionCounts || {}).filter(([key]) => key !== 'undefined').map(([key, count]) => (
                      <div key={key} className={`rounded-xl p-2 text-xs font-bold border ${String(key) === String(originalQuestion.correctIdx) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600'}`}>
                        اختيار {safeNumber(key, 0) + 1}: {count} طالب
                      </div>
                    ))}
                  </div>
                )}

                {row.wrongStudents.length > 0 && (
                  <details className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
                    <summary className="cursor-pointer font-bold text-red-700 text-sm">الطلاب الذين أخطأوا ({row.wrongStudents.length})</summary>
                    <p className="text-xs text-red-700 mt-2 leading-relaxed">{row.wrongStudents.slice(0, 40).join('، ')}</p>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionDeepAnalytics;
