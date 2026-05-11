import React from 'react';
import { BrainCircuit, CheckCircle, FileCheck, Lock, ShieldAlert, Target, Trophy, Users } from '../../shared/icons/lucide-shim.jsx';
import { getResultPercentage, safeNumber } from '../../shared/core/platformShared.jsx';

const pct = (n) => Math.max(0, Math.min(100, Math.round(safeNumber(n, 0))));
const getWeakAreas = (examResults = []) => {
  const areas = {};
  examResults.filter((r) => r.status === 'completed').slice(0, 10).forEach((result) => {
    const stats = result.performanceAnalysis?.branchStats || result.branchStats || result.branchAnalysis || {};
    Object.entries(stats).forEach(([name, data]) => {
      const possible = safeNumber(data.possible, safeNumber(data.total, 0));
      const earned = safeNumber(data.earned, possible - safeNumber(data.wrong, 0));
      areas[name] = areas[name] || { possible: 0, earned: 0 };
      areas[name].possible += possible;
      areas[name].earned += earned;
    });
  });
  return Object.entries(areas).map(([name, data]) => ({ name, pct: data.possible ? Math.round((data.earned / data.possible) * 100) : 0 })).filter((a) => a.pct < 80).sort((a,b)=>a.pct-b.pct).slice(0,3);
};

const Card = ({ icon, title, children, tone = 'bg-white' }) => <div className={`rounded-3xl border border-slate-100 p-5 shadow-sm ${tone}`}><div className="flex items-center gap-2 mb-2"><span className="bg-slate-900 text-white p-2 rounded-xl">{icon}</span><h3 className="font-black text-slate-900">{title}</h3></div>{children}</div>;

export default function StudentSuccessPanel({ userData, videos = [], exams = [], examResults = [], assignments = [], assignmentSubmissions = [], videoViews = [], setActiveTab }) {
  const completedResults = examResults.filter((r) => r.status === 'completed');
  const avg = completedResults.length ? Math.round(completedResults.reduce((s, r) => s + getResultPercentage(r), 0) / completedResults.length) : 0;
  const submitted = new Set((assignmentSubmissions || []).map((s) => s.assignmentId));
  const pendingAssignments = assignments.filter((a) => !submitted.has(a.id));
  const watched = videos.filter((v) => {
    const view = videoViews.find((vv) => vv.videoId === v.id);
    return pct(view?.watchedPercent) >= 80;
  }).length;
  const weakAreas = getWeakAreas(examResults);
  const nextLesson = videos.find((v) => !videoViews.some((vv) => vv.videoId === v.id && pct(vv.watchedPercent) >= 80));
  const points = watched * 10 + completedResults.reduce((sum, r) => sum + Math.round(getResultPercentage(r) / 10), 0) + (assignments.length - pendingAssignments.length) * 8;
  const parentReady = Boolean(userData?.parentPhone);

  return <div className="space-y-5">
    <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-blue-950 text-white p-5 md:p-7 shadow-xl">
      <p className="text-blue-200 font-black text-sm">Student Success Suite</p>
      <h2 className="text-2xl md:text-3xl font-black mt-1">خطة نجاحك الذكية</h2>
      <p className="text-blue-100 text-sm font-bold mt-2">مسار مذاكرة، مراجعة أخطاء، حماية حساب، ونقاط إنجاز في نفس أماكن المنصة الحالية.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <div className="bg-white/10 rounded-2xl p-3"><p className="text-xs text-blue-100 font-bold">متوسطك</p><b className="text-2xl">{avg || '—'}%</b></div>
        <div className="bg-white/10 rounded-2xl p-3"><p className="text-xs text-blue-100 font-bold">محاضرات مكتملة</p><b className="text-2xl">{watched}/{videos.length}</b></div>
        <div className="bg-white/10 rounded-2xl p-3"><p className="text-xs text-blue-100 font-bold">واجبات متأخرة</p><b className="text-2xl">{pendingAssignments.length}</b></div>
        <div className="bg-white/10 rounded-2xl p-3"><p className="text-xs text-blue-100 font-bold">نقاطك</p><b className="text-2xl">{points}</b></div>
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-5">
      <Card icon={<Target size={18}/>} title="المسار المقترح الآن">
        <p className="text-sm font-bold text-slate-600 mb-3">{nextLesson ? `ابدأ/استكمل: ${nextLesson.title}` : pendingAssignments[0] ? `حل الواجب: ${pendingAssignments[0].title}` : 'راجع نتائجك وحافظ على مستواك.'}</p>
        <button onClick={() => setActiveTab(nextLesson ? 'videos' : pendingAssignments[0] ? 'assignments' : 'performance')} className="bg-blue-600 text-white rounded-xl px-4 py-2 font-black">افتح الخطوة</button>
      </Card>
      <Card icon={<BrainCircuit size={18}/>} title="مراجعة أخطاء الامتحانات">
        {weakAreas.length ? <div className="space-y-2">{weakAreas.map((a)=><div key={a.name} className="bg-red-50 border border-red-100 rounded-xl p-2 text-sm font-bold text-red-800 flex justify-between"><span>{a.name}</span><span>{a.pct}%</span></div>)}</div> : <p className="text-sm font-bold text-slate-500">لا توجد نقاط ضعف واضحة حاليًا.</p>}
      </Card>
      <Card icon={<ShieldAlert size={18}/>} title="حماية حسابك والمحتوى">
        <p className="text-sm font-bold text-slate-600">لا تشارك حسابك. سيتم تفعيل تتبع الأجهزة والـ watermark لحماية اشتراكك والمحتوى.</p>
      </Card>
      <Card icon={<Users size={18}/>} title="ولي الأمر">
        <p className="text-sm font-bold text-slate-600">{parentReady ? 'رقم ولي الأمر مسجل وجاهز لتقارير المتابعة.' : 'أضف رقم ولي الأمر من ملفك الشخصي لتفعيل تقارير المتابعة.'}</p>
        {!parentReady && <button onClick={()=>setActiveTab('settings')} className="mt-3 bg-slate-900 text-white px-4 py-2 rounded-xl font-black">تحديث بياناتي</button>}
      </Card>
      <Card icon={<Trophy size={18}/>} title="الشارات والشهادة">
        <p className="text-sm font-bold text-slate-600">اقترب من شارة الالتزام: أكمل محاضرة + امتحان + واجب لتحصل على نقاط إضافية.</p>
      </Card>
      <Card icon={<FileCheck size={18}/>} title="الواجبات المتقدمة">
        <p className="text-sm font-bold text-slate-600">حالات الواجبات مدعومة: تم التسليم، يحتاج تعديل، تم التصحيح، مع تعليق المدرس.</p>
      </Card>
    </div>
  </div>;
}
