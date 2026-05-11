import { useMemo } from 'react';
import { BarChart3, BrainCircuit, CheckCircle, ClipboardList, MessageCircle, Target, Trophy, AlertTriangle, BookOpen } from '../../shared/icons/lucide-shim.jsx';
import { buildParentReportText, buildStudentInsight, buildWhatsAppLink } from './learningInsights.js';

const Card = ({ title, value, hint, icon }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-500">{title}</p><div className="text-amber-600">{icon}</div></div>
    <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
    {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
);

const StudentGrowthPanel = ({ user, userData, exams = [], examResults = [], assignments = [], assignmentSubmissions = [], hwResults = [], mistakes = [], videoViews = [], content = [], onStartMistakesExam, compact = false }) => {
  const insight = useMemo(() => buildStudentInsight({
    student: { id: user?.uid, uid: user?.uid, ...userData },
    exams,
    results: examResults,
    assignments,
    submissions: assignmentSubmissions,
    hwResults,
    mistakes,
    videoViews
  }), [user?.uid, userData, exams, examResults, assignments, assignmentSubmissions, hwResults, mistakes, videoViews]);

  const reportText = useMemo(() => buildParentReportText(userData, insight), [userData, insight]);
  const whatsAppLink = buildWhatsAppLink(userData?.parentPhone, reportText);

  const copyReport = async () => {
    await navigator.clipboard?.writeText(reportText);
    window.dispatchEvent(new CustomEvent('nahhas-toast', { detail: { message: 'تم نسخ تقرير ولي الأمر.', type: 'success' } }));
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 md:p-6 rounded-3xl border border-amber-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2"><BarChart3 className="text-amber-600"/> لوحة تقدم الطالب</h2>
            <p className="text-slate-500 text-sm mt-1">درجاتك، واجباتك، أخطاؤك، وخطة المراجعة في صفحة واحدة.</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl font-black text-sm ${insight.riskLevel === 'high' ? 'bg-red-100 text-red-700' : insight.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {insight.riskLevel === 'high' ? 'يحتاج متابعة قوية' : insight.riskLevel === 'medium' ? 'يحتاج تركيز بسيط' : 'مستوى مستقر'}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card title="متوسط الامتحانات" value={`${insight.average}%`} hint={`${insight.examCount} امتحان`} icon={<Trophy/>}/>
          <Card title="متوسط واجبات QR" value={insight.hwCount ? `${insight.hwAverage}%` : '—'} hint={`${insight.hwCount} واجب`} icon={<ClipboardList/>}/>
          <Card title="واجبات متأخرة" value={insight.pendingAssignmentsCount} hint="واجبات عادية لم تُسلّم" icon={<AlertTriangle/>}/>
          <Card title="بنك الأخطاء" value={insight.mistakesCount} hint="سؤال يحتاج مراجعة" icon={<BrainCircuit/>}/>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm lg:col-span-2">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Target className="text-red-500"/> خطة المراجعة الذكية</h3>
          <div className="space-y-3">
            {insight.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <CheckCircle className="text-emerald-600" size={20}/>
                <span className="font-bold text-slate-700">{rec}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={onStartMistakesExam} className="bg-red-600 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-red-500/20"><Target size={18}/> اختبار من أخطائي</button>
            <button onClick={copyReport} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2"><ClipboardList size={18}/> نسخ تقرير ولي الأمر</button>
            {whatsAppLink && <a href={whatsAppLink} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black flex items-center gap-2"><MessageCircle size={18}/> إرسال واتساب</a>}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="text-amber-600"/> أضعف الفروع</h3>
          {insight.weakBranches.length === 0 ? (
            <p className="text-slate-500 text-sm bg-emerald-50 p-4 rounded-2xl border border-emerald-100">لا توجد فروع ضعيفة واضحة حتى الآن.</p>
          ) : insight.weakBranches.map(branch => (
            <div key={branch.branch} className="mb-3">
              <div className="flex justify-between text-xs font-black mb-1"><span>{branch.branch}</span><span>{branch.percentage}%</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${Math.max(8, branch.percentage)}%` }} /></div>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><BrainCircuit className="text-red-500"/> بنك الأخطاء المطور</h3>
          {insight.mistakes.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl"><Trophy className="mx-auto text-amber-400 mb-3" size={48}/><p className="font-black text-slate-700">بنك الأخطاء فارغ. شغل عالي يا بطل.</p></div>
          ) : (
            <div className="space-y-4">
              {insight.mistakes.map(m => (
                <div key={m.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <p className="text-xs font-black text-red-600 mb-2">{m.examTitle || m.homeworkTitle || 'مراجعة'}</p>
                  <p className="font-bold text-slate-800 leading-relaxed">{m.question?.text || m.questionText || 'سؤال من بنك الأخطاء'}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3"><b>إجابتك:</b> {m.question?.studentAnswerText || m.studentAnswer || 'غير محدد'}</div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><b>الصحيح:</b> {m.question?.correctAnswerText || m.correctAnswer || 'غير محدد'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentGrowthPanel;
