import { useState, useMemo } from 'react';


import { Users, BarChart3, Target } from '../../shared/icons/lucide-shim.jsx';


import { getGradeLabel } from '../../shared/constants/grades';


import { safeNumber, getResultPercentage, getGradeBadge, calculateDetailedExamMetrics } from '../../shared/core/platformShared.jsx';


export const AdminPerformanceAnalytics = ({ examResults = [], examsList = [], users = [], adminGradeFilter = 'all' }) => {
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  const analytics = useMemo(() => {
    const examsById = Object.fromEntries((examsList || []).map(exam => [exam.id, exam]));
    const usersById = Object.fromEntries((users || []).map(u => [u.id, u]));
    const rowsByStudent = {};
    const branchTotals = {};

    const getMetricsForResult = (result) => {
      const savedBranchStats = result.performanceAnalysis?.branchStats || result.branchStats;
      if (savedBranchStats && Object.keys(savedBranchStats).length > 0) {
        const branchStats = Object.fromEntries(Object.entries(savedBranchStats).map(([branch, stat]) => [branch, {
          earned: safeNumber(stat.earned, 0),
          possible: safeNumber(stat.possible, 0),
          answered: safeNumber(stat.answered, 0),
          total: safeNumber(stat.total, 0),
          correct: safeNumber(stat.correct, 0),
          wrong: safeNumber(stat.wrong, 0),
          essay: safeNumber(stat.essay, 0),
        }]));
        const totalScore = safeNumber(result.performanceAnalysis?.totalScore, Object.values(branchStats).reduce((a, s) => a + safeNumber(s.earned, 0), 0));
        const totalPossible = safeNumber(result.performanceAnalysis?.totalPossible, Object.values(branchStats).reduce((a, s) => a + safeNumber(s.possible, 0), 0));
        return { branchStats, totalScore, totalPossible, percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : getResultPercentage(result) };
      }

      const exam = examsById[result.examId];
      if (exam) return calculateDetailedExamMetrics(exam, result.answers || {}, result.essayGrades || result.essayScores || {});

      return { branchStats: {}, totalScore: safeNumber(result.score, 0), totalPossible: safeNumber(result.totalPossible, safeNumber(result.total, 0)), percentage: getResultPercentage(result) };
    };

    (examResults || [])
      .filter(result => result.status === 'completed')
      .filter(result => selectedExamId === 'all' || result.examId === selectedExamId)
      .forEach(result => {
        const exam = examsById[result.examId] || {};
        const student = usersById[result.studentId] || {};
        const grade = result.grade || student.grade || exam.grade || 'غير محدد';
        if (adminGradeFilter !== 'all' && grade !== adminGradeFilter) return;

        const metrics = getMetricsForResult(result);
        const key = result.studentId || result.studentName || result.id;
        if (!rowsByStudent[key]) {
          rowsByStudent[key] = {
            studentId: result.studentId,
            studentName: result.studentName || student.name || student.displayName || 'طالب',
            grade,
            examsCount: 0,
            totalScore: 0,
            totalPossible: 0,
            branches: {},
            lastExamTitle: result.examTitle || exam.title || 'امتحان'
          };
        }
        const row = rowsByStudent[key];
        row.examsCount += 1;
        row.totalScore += safeNumber(metrics.totalScore, safeNumber(result.score, 0));
        row.totalPossible += safeNumber(metrics.totalPossible, safeNumber(result.totalPossible, safeNumber(result.total, 0)));
        row.lastExamTitle = result.examTitle || exam.title || row.lastExamTitle;

        Object.entries(metrics.branchStats || {}).forEach(([branch, stat]) => {
          row.branches[branch] = row.branches[branch] || { earned: 0, possible: 0, exams: 0, wrong: 0, total: 0, correct: 0 };
          row.branches[branch].earned += safeNumber(stat.earned, 0);
          row.branches[branch].possible += safeNumber(stat.possible, 0);
          row.branches[branch].wrong += safeNumber(stat.wrong, 0);
          row.branches[branch].correct += safeNumber(stat.correct, 0);
          row.branches[branch].total += safeNumber(stat.total, 0);
          row.branches[branch].exams += 1;

          branchTotals[branch] = branchTotals[branch] || { earned: 0, possible: 0, wrong: 0, correct: 0, total: 0, students: new Set() };
          branchTotals[branch].earned += safeNumber(stat.earned, 0);
          branchTotals[branch].possible += safeNumber(stat.possible, 0);
          branchTotals[branch].wrong += safeNumber(stat.wrong, 0);
          branchTotals[branch].correct += safeNumber(stat.correct, 0);
          branchTotals[branch].total += safeNumber(stat.total, 0);
          branchTotals[branch].students.add(key);
        });
      });

    const studentRows = Object.values(rowsByStudent).map(row => {
      const branchRows = Object.entries(row.branches).map(([branch, stat]) => ({
        branch,
        pct: stat.possible > 0 ? Math.round((stat.earned / stat.possible) * 100) : 0,
        ...stat
      })).sort((a,b) => a.pct - b.pct);
      return {
        ...row,
        average: row.totalPossible > 0 ? Math.round((row.totalScore / row.totalPossible) * 100) : 0,
        weakestBranches: branchRows,
        strongestBranch: [...branchRows].sort((a,b) => b.pct - a.pct)[0]
      };
    }).filter(row => !studentSearch.trim() || row.studentName.toLowerCase().includes(studentSearch.trim().toLowerCase()))
      .sort((a,b) => a.average - b.average);

    const branchRows = Object.entries(branchTotals).map(([branch, stat]) => ({
      branch,
      pct: stat.possible > 0 ? Math.round((stat.earned / stat.possible) * 100) : 0,
      wrong: stat.wrong,
      correct: stat.correct,
      total: stat.total,
      studentsCount: stat.students.size
    })).sort((a,b) => a.pct - b.pct);

    return { studentRows, branchRows };
  }, [examResults, examsList, users, adminGradeFilter, selectedExamId, studentSearch]);

  const riskStudents = analytics.studentRows.filter(row => row.average < 70).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 md:p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-blue-600"/> تحليل أداء الطلاب والفروع الضعيفة</h2>
            <p className="text-sm text-slate-500 mt-1">اعرف بسرعة الطالب ناقص في أي فرع، وأي فرع محتاج شرح أو واجب إضافي.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <select className="border p-3 rounded-xl bg-white" value={selectedExamId} onChange={e=>setSelectedExamId(e.target.value)}>
              <option value="all">كل الامتحانات</option>
              {(examsList || []).map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
            </select>
            <input className="border p-3 rounded-xl" placeholder="بحث باسم الطالب" value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-blue-600 text-sm font-bold">طلاب تم تحليلهم</p><p className="text-3xl font-black text-blue-900">{analytics.studentRows.length}</p></div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-red-600 text-sm font-bold">طلاب يحتاجون متابعة</p><p className="text-3xl font-black text-red-900">{riskStudents.length}</p></div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-amber-700 text-sm font-bold">أضعف فرع عام</p><p className="text-xl font-black text-amber-900">{analytics.branchRows[0]?.branch || 'لا يوجد'}</p></div>
        </div>

        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Target size={18}/> أضعف الفروع على مستوى الطلاب</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          {analytics.branchRows.slice(0, 8).map(item => (
            <div key={item.branch} className="bg-white border rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2"><span className="font-black text-slate-800">{item.branch}</span><span className={`text-sm font-bold px-2 py-1 rounded-full ${item.pct < 50 ? 'bg-red-100 text-red-700' : item.pct < 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.pct}%</span></div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-2 bg-blue-500 rounded-full" style={{width: `${item.pct}%`}} /></div>
              <p className="text-xs text-slate-500 mt-2">{item.studentsCount} طالب • {item.wrong} خطأ</p>
            </div>
          ))}
          {analytics.branchRows.length === 0 && <p className="text-slate-500 col-span-full text-center py-8">لا توجد نتائج كافية للتحليل بعد. تأكد أن الطالب سلّم امتحانًا يحتوي على فروع مثل النحو/البلاغة/الأدب.</p>}
        </div>
      </div>

      <div className="glass-panel p-5 md:p-6 rounded-2xl">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18}/> تقرير كل طالب</h3>
        <div className="space-y-3 max-h-[650px] overflow-y-auto">
          {analytics.studentRows.map(row => (
            <div key={row.studentId || row.studentName} className="bg-white border rounded-2xl p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="font-black text-slate-800 text-lg">{row.studentName}</p>
                  <p className="text-xs text-slate-500">{getGradeLabel(row.grade)} • {row.examsCount} امتحان • آخر امتحان: {row.lastExamTitle}</p>
                </div>
                <div className="text-center md:text-left">
                  <span className={`inline-flex px-4 py-2 rounded-full font-black border ${getGradeBadge(row.average).tone}`}>{row.average}% - {getGradeBadge(row.average).text}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {row.weakestBranches.map(branch => (
                  <div key={branch.branch} className="bg-slate-50 rounded-xl p-3 border">
                    <div className="flex justify-between text-sm font-bold"><span>{branch.branch}</span><span className={branch.pct < 50 ? 'text-red-600' : branch.pct < 70 ? 'text-amber-600' : 'text-emerald-600'}>{branch.pct}%</span></div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden mt-2"><div className={branch.pct < 50 ? 'h-2 bg-red-400' : branch.pct < 70 ? 'h-2 bg-amber-400' : 'h-2 bg-emerald-400'} style={{width: `${branch.pct}%`}} /></div>
                    <p className="text-xs text-slate-500 mt-1">أخطاء: {branch.wrong} • صحيح: {branch.correct}</p>
                  </div>
                ))}
                {row.weakestBranches.length === 0 && <p className="text-sm text-slate-400">لا توجد فروع كافية لهذا الطالب.</p>}
              </div>
            </div>
          ))}
          {analytics.studentRows.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد بيانات مطابقة للفلاتر الحالية.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPerformanceAnalytics;
