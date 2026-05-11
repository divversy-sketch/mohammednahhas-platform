import { useMemo } from 'react';
import { CheckCircle, ClipboardList, FileCheck, Lock, PlayCircle, Target } from '../../shared/icons/lucide-shim.jsx';
import { getResultPercentage, safeNumber, VIDEO_EXAM_UNLOCK_PERCENT } from '../../shared/core/platformShared.jsx';

const pct = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

function SectionCard({ title, percent, children, icon, tone = 'blue' }) {
  const color = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'red' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">{icon}{title}</h3>
        <span className="font-black text-slate-700 bg-slate-100 rounded-full px-3 py-1 text-sm">{percent}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4"><div className={`${color} h-full`} style={{ width: `${pct(percent)}%` }} /></div>
      {children}
    </div>
  );
}

export default function StudentLearningPath({ videos = [], exams = [], examResults = [], assignments = [], assignmentSubmissions = [], videoViews = [], mistakes = [], setActiveTab }) {
  const getVideoPercent = (video) => {
    const row = videoViews.find((v) => v.videoId === video.id);
    if (!row) return 0;
    if (row.watchedPercent !== undefined) return pct(row.watchedPercent);
    const duration = safeNumber(video.durationSeconds, safeNumber(video.estimatedDurationMinutes, 0) * 60);
    return duration > 0 ? pct((safeNumber(row.watchedSeconds, 0) / duration) * 100) : 0;
  };

  const completedVideos = videos.filter((v) => getVideoPercent(v) >= VIDEO_EXAM_UNLOCK_PERCENT);
  const completedResults = examResults.filter((r) => r.status === 'completed');
  const avgExam = completedResults.length ? pct(completedResults.reduce((sum, r) => sum + getResultPercentage(r), 0) / completedResults.length) : 0;
  const submittedIds = new Set(assignmentSubmissions.map((s) => s.assignmentId));
  const submittedAssignments = assignments.filter((a) => submittedIds.has(a.id));

  const weakTopics = useMemo(() => {
    const map = {};
    (mistakes || []).forEach((m) => {
      const topic = m.topic || m.lesson || m.branch || m.question?.topic || 'مراجعة عامة';
      map[topic] = (map[topic] || 0) + 1;
    });
    if (Object.keys(map).length) return Object.entries(map).map(([topic, count]) => ({ topic, count })).sort((a,b)=>b.count-a.count).slice(0, 6);
    const resultTopics = {};
    completedResults.forEach((r) => {
      const stats = r.performanceAnalysis?.branchStats || r.branchStats || {};
      Object.entries(stats).forEach(([topic, data]) => {
        const possible = safeNumber(data.possible, safeNumber(data.total, 0));
        const earned = safeNumber(data.earned, safeNumber(data.score, 0));
        const scorePct = possible ? Math.round((earned / possible) * 100) : 100;
        if (scorePct < 75) resultTopics[topic] = { topic, count: 100 - scorePct };
      });
    });
    return Object.values(resultTopics).slice(0, 6);
  }, [mistakes, completedResults]);

  const videoPercent = videos.length ? pct((completedVideos.length / videos.length) * 100) : 0;
  const examsPercent = exams.length ? pct((completedResults.length / exams.length) * 100) : 0;
  const assignmentsPercent = assignments.length ? pct((submittedAssignments.length / assignments.length) * 100) : 0;
  const totalPath = pct((videoPercent + examsPercent + assignmentsPercent) / 3);

  const nextLockedExam = exams.find((exam) => exam.accessRule?.enabled && !completedResults.some((r) => r.examId === exam.id));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-br from-slate-950 to-slate-800 text-white rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
        <Target className="absolute -left-8 -bottom-8 w-48 h-48 text-white/10" />
        <p className="text-amber-200 font-black mb-2">مساري التعليمي</p>
        <h2 className="text-3xl md:text-4xl font-black mb-3">خطة تقدمك في المنصة</h2>
        <p className="text-slate-300 font-bold leading-7 max-w-2xl">هنا تشوف المحاضرات، الامتحانات، الواجبات، ونقاط الضعف في مكان واحد، وكل جزء مربوط بمكانه الحقيقي في المنصة.</p>
        <div className="mt-5 max-w-xl"><div className="h-4 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${totalPath}%` }} /></div><p className="mt-2 text-sm font-black text-amber-100">إجمالي التقدم التقريبي: {totalPath}%</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard title="المحاضرات" percent={videoPercent} icon={<PlayCircle className="text-blue-600"/>}>
          <p className="text-sm text-slate-500 font-bold mb-3">مكتمل: {completedVideos.length} من {videos.length}</p>
          <button onClick={()=>setActiveTab('videos')} className="w-full bg-blue-50 text-blue-700 rounded-xl p-3 font-black">فتح المحاضرات</button>
        </SectionCard>
        <SectionCard title="الامتحانات" percent={examsPercent} tone="emerald" icon={<ClipboardList className="text-emerald-600"/>}>
          <p className="text-sm text-slate-500 font-bold mb-3">متوسط النتائج: {completedResults.length ? `${avgExam}%` : 'لم تبدأ بعد'}</p>
          <button onClick={()=>setActiveTab('exams')} className="w-full bg-emerald-50 text-emerald-700 rounded-xl p-3 font-black">فتح الامتحانات</button>
        </SectionCard>
        <SectionCard title="الواجبات" percent={assignmentsPercent} tone="amber" icon={<FileCheck className="text-amber-600"/>}>
          <p className="text-sm text-slate-500 font-bold mb-3">مسلم: {submittedAssignments.length} من {assignments.length}</p>
          <button onClick={()=>setActiveTab('assignments')} className="w-full bg-amber-50 text-amber-700 rounded-xl p-3 font-black">فتح الواجبات</button>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-black text-xl text-slate-900 mb-4 flex items-center gap-2"><Target className="text-red-600"/> نقاط تحتاج مراجعة</h3>
          {weakTopics.length ? weakTopics.map((item) => <div key={item.topic} className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-2xl p-3 mb-2"><span className="font-black text-red-800">{item.topic}</span><span className="text-xs bg-white text-red-700 px-2 py-1 rounded-full font-black">{item.count}</span></div>) : <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 font-bold">لا توجد نقاط ضعف واضحة حتى الآن. حل المزيد من الامتحانات لتظهر الخطة بدقة.</div>}
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-black text-xl text-slate-900 mb-4 flex items-center gap-2"><Lock className="text-slate-600"/> قبل الامتحان التالي</h3>
          {nextLockedExam ? <div className="bg-slate-50 border rounded-2xl p-4">
            <p className="font-black text-slate-900">{nextLockedExam.title}</p>
            <p className="text-sm text-slate-600 mt-2">هذا الامتحان مربوط بشرط فتح. افتح صفحة الامتحانات لمعرفة الامتحان السابق والنسبة المطلوبة بدقة.</p>
            <button onClick={()=>setActiveTab('exams')} className="mt-3 bg-slate-900 text-white rounded-xl p-3 font-black w-full">عرض حالة الامتحان</button>
          </div> : <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 font-bold flex items-center gap-2"><CheckCircle/> لا يوجد امتحان مقفول عليك حاليًا.</div>}
        </div>
      </div>
    </div>
  );
}
