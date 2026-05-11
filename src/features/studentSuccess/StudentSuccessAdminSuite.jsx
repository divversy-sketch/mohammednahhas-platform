import React from 'react';
import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, BarChart3, Bell, BrainCircuit, CheckCircle, Download, FileCheck, Lock, MessageCircle, ShieldAlert, Target, Users, Smartphone, Trophy } from '../../shared/icons/lucide-shim.jsx';
import { db } from '../../services/firebase.js';
import { platformNotify, getResultPercentage, safeNumber } from '../../shared/core/platformShared.jsx';
import { getGradeLabel } from '../../shared/constants/grades';

const dateText = (value) => {
  const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('ar-EG') : '—';
};

const csv = (filename, headers, rows) => {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const body = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([`\ufeff${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const Panel = ({ title, subtitle, icon, children }) => (
  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
    <div className="flex items-start gap-3 mb-4">
      <div className="bg-slate-900 text-white p-3 rounded-2xl">{icon}</div>
      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm font-bold text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Metric = ({ label, value, tone = 'bg-slate-50 text-slate-800 border-slate-100' }) => (
  <div className={`rounded-2xl border p-4 ${tone}`}>
    <p className="text-xs font-black opacity-70">{label}</p>
    <p className="text-2xl font-black mt-1">{value}</p>
  </div>
);

const getWeakAreas = (examResults = []) => {
  const areas = {};
  examResults.filter((r) => r.status === 'completed').forEach((result) => {
    const stats = result.performanceAnalysis?.branchStats || result.branchStats || result.branchAnalysis || {};
    Object.entries(stats).forEach(([name, data]) => {
      const possible = safeNumber(data.possible, safeNumber(data.total, 0));
      const earned = safeNumber(data.earned, possible - safeNumber(data.wrong, 0));
      const wrong = safeNumber(data.wrong, Math.max(0, possible - earned));
      areas[name] = areas[name] || { possible: 0, earned: 0, wrong: 0, attempts: 0 };
      areas[name].possible += possible;
      areas[name].earned += earned;
      areas[name].wrong += wrong;
      areas[name].attempts += 1;
    });
  });
  return Object.entries(areas).map(([name, data]) => ({
    name,
    pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0,
    wrong: data.wrong,
    attempts: data.attempts,
  })).sort((a, b) => a.pct - b.pct).slice(0, 8);
};

const getAtRiskStudents = ({ users = [], examResults = [], videoViews = [], assignments = [], assignmentSubmissions = [] }) => {
  const byUser = new Map();
  examResults.filter((r) => r.status === 'completed').forEach((result) => {
    const key = result.userId || result.studentId || result.uid;
    if (!key) return;
    const list = byUser.get(key) || [];
    list.push(getResultPercentage(result));
    byUser.set(key, list);
  });
  const submitted = new Set((assignmentSubmissions || []).map((item) => `${item.userId || item.studentId}-${item.assignmentId}`));
  return (users || []).map((student) => {
    const scores = byUser.get(student.id) || [];
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const views = (videoViews || []).filter((v) => (v.userId || v.studentId) === student.id).length;
    const pendingHw = (assignments || []).filter((a) => !submitted.has(`${student.id}-${a.id}`)).length;
    const risk = (!scores.length ? 25 : 0) + (avg && avg < 65 ? 35 : 0) + (views < 2 ? 20 : 0) + (pendingHw > 2 ? 20 : 0);
    return { student, avg, views, pendingHw, risk };
  }).filter((row) => row.risk >= 35).sort((a, b) => b.risk - a.risk).slice(0, 12);
};

function ContentProtectionPanel({ users = [] }) {
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState({ maxDevices: 2, allowConcurrentSessions: false, watermark: true, pdfWatermark: true });
  const suspicious = users.filter((u) => {
    const devices = u.devices || u.deviceSessions || u.activeDevices || [];
    const count = Array.isArray(devices) ? devices.length : Object.keys(devices || {}).length;
    return count > 2 || u.sharedAccountWarning || u.lastLoginRisk === 'high';
  }).slice(0, 10);
  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'content_protection'), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
      platformNotify('تم حفظ إعدادات حماية الحساب والمحتوى.');
    } catch (err) {
      console.error(err);
      platformNotify('تعذر حفظ إعدادات الحماية الآن.');
    } finally {
      setSaving(false);
    }
  };
  return <Panel title="حماية الحساب والمحتوى" subtitle="موجودة داخل مركز الحماية/حماية الفيديوهات، وتتحكم في مشاركة الحساب والـ watermark." icon={<ShieldAlert size={22} />}>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Metric label="حد الأجهزة" value={settings.maxDevices} tone="bg-blue-50 text-blue-900 border-blue-100" />
      <Metric label="تزامن الجلسات" value={settings.allowConcurrentSessions ? 'مسموح' : 'ممنوع'} tone="bg-emerald-50 text-emerald-900 border-emerald-100" />
      <Metric label="Watermark" value={settings.watermark ? 'مفعل' : 'متوقف'} tone="bg-purple-50 text-purple-900 border-purple-100" />
      <Metric label="حسابات مشبوهة" value={suspicious.length} tone="bg-red-50 text-red-900 border-red-100" />
    </div>
    <div className="grid md:grid-cols-4 gap-3 mb-4">
      <input type="number" min="1" className="border rounded-xl p-3 font-bold" value={settings.maxDevices} onChange={(e)=>setSettings({...settings, maxDevices: Number(e.target.value || 1)})} />
      <label className="border rounded-xl p-3 bg-slate-50 font-bold flex items-center gap-2"><input type="checkbox" checked={!settings.allowConcurrentSessions} onChange={(e)=>setSettings({...settings, allowConcurrentSessions: !e.target.checked})}/> منع فتح الحساب من أكثر من جهاز</label>
      <label className="border rounded-xl p-3 bg-slate-50 font-bold flex items-center gap-2"><input type="checkbox" checked={settings.watermark} onChange={(e)=>setSettings({...settings, watermark: e.target.checked})}/> Watermark على الفيديو</label>
      <button disabled={saving} onClick={save} className="bg-slate-900 text-white rounded-xl font-black px-4 py-3">{saving ? 'جار الحفظ...' : 'حفظ إعدادات الحماية'}</button>
    </div>
    <div className="space-y-2">
      {suspicious.length ? suspicious.map((u) => <div key={u.id} className="border rounded-2xl p-3 flex justify-between gap-3 bg-red-50 border-red-100"><b>{u.name || u.email}</b><span className="text-sm font-bold text-red-700">مراجعة أجهزة الحساب</span></div>) : <p className="text-sm font-bold text-slate-500 bg-slate-50 rounded-2xl p-3">لا توجد حسابات مشاركة واضحة حسب البيانات الحالية.</p>}
    </div>
  </Panel>;
}

function ExamErrorAnalyticsPanel({ examResults = [], content = [] }) {
  const weakAreas = getWeakAreas(examResults);
  const exportRows = () => csv('exam-error-analysis.csv', ['area','percent','wrong','attempts'], weakAreas.map((a) => [a.name, a.pct, a.wrong, a.attempts]));
  return <Panel title="تحليل أخطاء الامتحانات" subtitle="تطوير داخل التقارير والامتحانات: يوضح أكثر فروع محتاجة مراجعة ودروس مقترحة." icon={<BrainCircuit size={22} />}>
    <div className="flex justify-end mb-3"><button onClick={exportRows} className="bg-slate-100 text-slate-800 rounded-xl px-4 py-2 font-black flex items-center gap-2"><Download size={16}/> تصدير التحليل</button></div>
    <div className="grid md:grid-cols-2 gap-3">
      {weakAreas.length ? weakAreas.map((area) => {
        const related = content.find((c) => String(c.title || '').includes(area.name) || String(c.branch || '').includes(area.name));
        return <div key={area.name} className="border rounded-2xl p-4 bg-slate-50">
          <div className="flex justify-between gap-3"><b className="text-slate-900">{area.name}</b><span className="font-black text-red-700">{area.pct}%</span></div>
          <p className="text-xs font-bold text-slate-500 mt-1">أخطاء: {area.wrong} — محاولات: {area.attempts}</p>
          <p className="text-xs font-bold text-blue-700 mt-2">المراجعة المقترحة: {related?.title || 'اربط أسئلة هذا الفرع بدرس مراجعة داخل المحتوى.'}</p>
        </div>;
      }) : <p className="text-sm font-bold text-slate-500 bg-slate-50 rounded-2xl p-4">لا توجد بيانات كافية لتحليل الأخطاء بعد.</p>}
    </div>
  </Panel>;
}

function LearningPathAdminPanel(props) {
  const atRisk = getAtRiskStudents(props);
  const sendFollowUp = async (row) => {
    try {
      await addDoc(collection(db, 'student_messages'), {
        targetType: 'user', targetUserId: row.student.id, userId: row.student.id,
        title: 'خطة متابعة شخصية',
        text: `راجع محاضراتك وحل واجباتك المتأخرة. متوسطك الحالي ${row.avg || 'غير متاح'}%.`,
        type: 'learning_path', read: false, createdAt: serverTimestamp(),
      });
      platformNotify('تم إرسال رسالة متابعة للطالب.');
    } catch (err) { console.error(err); platformNotify('تعذر إرسال المتابعة.'); }
  };
  return <Panel title="مسارات تعلم ذكية للمتابعة" subtitle="داخل تقارير الطلاب: يحدد الطلاب المحتاجين خطة مذاكرة بدل إضافة قسم جديد." icon={<Target size={22} />}>
    <div className="space-y-2">
      {atRisk.length ? atRisk.map((row) => <div key={row.student.id} className="bg-white border rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div><b>{row.student.name || row.student.email}</b><p className="text-xs font-bold text-slate-500">متوسط: {row.avg || '—'}% — مشاهدات: {row.views} — واجبات متأخرة: {row.pendingHw}</p></div>
        <button onClick={() => sendFollowUp(row)} className="bg-blue-600 text-white rounded-xl px-4 py-2 font-black">إرسال خطة متابعة</button>
      </div>) : <p className="text-sm font-bold text-slate-500 bg-slate-50 rounded-2xl p-3">لا يوجد طلاب يحتاجون متابعة عاجلة حسب المؤشرات الحالية.</p>}
    </div>
  </Panel>;
}

function ParentPortalPanel({ users = [], examResults = [], assignments = [], assignmentSubmissions = [] }) {
  const parentCoverage = users.filter((u) => u.parentPhone).length;
  const exportParentReport = () => {
    const rows = users.map((u) => {
      const results = examResults.filter((r) => (r.userId || r.studentId) === u.id && r.status === 'completed');
      const avg = results.length ? Math.round(results.reduce((sum, r) => sum + getResultPercentage(r), 0) / results.length) : 0;
      const submitted = new Set(assignmentSubmissions.filter((s) => (s.userId || s.studentId) === u.id).map((s) => s.assignmentId));
      const pending = assignments.filter((a) => !submitted.has(a.id)).length;
      return [u.name || '', u.parentPhone || '', getGradeLabel(u.grade), avg || '', results.length, pending, u.subscriptionStatus || 'free'];
    });
    csv('parent-weekly-summary.csv', ['student','parentPhone','grade','avg','exams','pendingAssignments','subscription'], rows);
  };
  return <Panel title="ولي الأمر والتقرير الأسبوعي" subtitle="بدون تبويب جديد: أدوات ولي الأمر داخل التقارير ورسائل الطلاب." icon={<Users size={22} />}>
    <div className="grid md:grid-cols-3 gap-3 mb-4">
      <Metric label="طلاب لديهم رقم ولي أمر" value={`${parentCoverage}/${users.length}`} tone="bg-emerald-50 text-emerald-900 border-emerald-100" />
      <Metric label="نموذج التقرير" value="جاهز" tone="bg-blue-50 text-blue-900 border-blue-100" />
      <Metric label="قناة الإرسال" value="واتساب/CSV" tone="bg-amber-50 text-amber-900 border-amber-100" />
    </div>
    <button onClick={exportParentReport} className="bg-slate-900 text-white rounded-xl px-4 py-3 font-black flex items-center gap-2"><Download size={16}/> تصدير تقرير ولي الأمر الأسبوعي</button>
  </Panel>;
}

function AdvancedAssignmentsPanel({ assignments = [], assignmentSubmissions = [] }) {
  const pendingReview = assignmentSubmissions.filter((s) => ['submitted','pending_review'].includes(s.status || 'submitted')).length;
  const needsRevision = assignmentSubmissions.filter((s) => ['needs_revision','returned'].includes(s.status)).length;
  return <Panel title="تطوير الواجبات والتصحيح" subtitle="داخل الواجبات: Workflow للتصحيح وإعادة التسليم والـ rubric." icon={<FileCheck size={22} />}>
    <div className="grid md:grid-cols-4 gap-3 mb-4">
      <Metric label="واجبات منشورة" value={assignments.length} />
      <Metric label="تسليمات تنتظر تصحيح" value={pendingReview} tone="bg-amber-50 text-amber-900 border-amber-100" />
      <Metric label="تحتاج إعادة تسليم" value={needsRevision} tone="bg-red-50 text-red-900 border-red-100" />
      <Metric label="Rubric" value="مدعوم" tone="bg-blue-50 text-blue-900 border-blue-100" />
    </div>
    <div className="grid md:grid-cols-3 gap-3 text-sm font-bold text-slate-600">
      <div className="bg-slate-50 rounded-2xl p-3 border">الحالات القياسية: لم يبدأ / تم التسليم / يحتاج تعديل / تم التصحيح.</div>
      <div className="bg-slate-50 rounded-2xl p-3 border">يدعم تعليق نصي ودرجة وملاحظات مراجعة للطالب.</div>
      <div className="bg-slate-50 rounded-2xl p-3 border">جاهز لإضافة ملاحظات صوتية لاحقًا من نفس قسم الواجبات.</div>
    </div>
  </Panel>;
}

function GamificationAndCertificatesPanel({ users = [], examResults = [] }) {
  const top = [...users].map((u) => {
    const results = examResults.filter((r) => (r.userId || r.studentId) === u.id && r.status === 'completed');
    const points = results.reduce((sum, r) => sum + Math.round(getResultPercentage(r)), 0) + safeNumber(u.learningPoints, 0);
    return { u, points, exams: results.length };
  }).sort((a, b) => b.points - a.points).slice(0, 6);
  return <Panel title="التحفيز والشهادات" subtitle="داخل Dashboard والتقارير: نقاط، شارات، وشهادات إكمال عند انتهاء كورس/مستوى." icon={<Trophy size={22} />}>
    <div className="grid md:grid-cols-3 gap-3">
      {top.length ? top.map((row, index) => <div key={row.u.id} className="border rounded-2xl p-3 bg-amber-50 border-amber-100"><b>#{index + 1} {row.u.name || row.u.email}</b><p className="text-xs font-bold text-amber-800">{row.points} نقطة — {row.exams} امتحان</p></div>) : <p className="text-sm font-bold text-slate-500">لا توجد بيانات كافية للترتيب بعد.</p>}
    </div>
  </Panel>;
}

function BroadcastEnhancerPanel({ users = [] }) {
  const [target, setTarget] = React.useState('all');
  const count = target === 'all' ? users.length : users.filter((u) => u.grade === target || u.subscriptionStatus === target).length;
  return <Panel title="Broadcast احترافي" subtitle="داخل الإشعارات: استهداف حسب المرحلة أو الاشتراك قبل الإرسال." icon={<Bell size={22} />}>
    <div className="grid md:grid-cols-3 gap-3">
      <select className="border rounded-xl p-3 font-bold" value={target} onChange={(e)=>setTarget(e.target.value)}>
        <option value="all">كل الطلاب</option><option value="premium">VIP فقط</option><option value="free">المجاني فقط</option><option value="1sec">أولى ثانوي</option><option value="2sec">ثانية ثانوي</option><option value="3sec">ثالثة ثانوي</option>
      </select>
      <Metric label="عدد مستلمين متوقع" value={count} tone="bg-blue-50 text-blue-900 border-blue-100" />
      <div className="bg-slate-50 border rounded-2xl p-3 text-sm font-bold text-slate-600">استخدم نفس نموذج الإشعارات الحالي، وهذه الأداة تساعدك تحدد الجمهور قبل الإرسال.</div>
    </div>
  </Panel>;
}

export default function AdminStudentSuccessSuite({ variant = 'reports', users = [], exams = [], examResults = [], content = [], assignments = [], assignmentSubmissions = [], videoViews = [] }) {
  const common = { users, exams, examResults, content, assignments, assignmentSubmissions, videoViews };
  if (variant === 'security') return <ContentProtectionPanel users={users} />;
  if (variant === 'assignments') return <AdvancedAssignmentsPanel assignments={assignments} assignmentSubmissions={assignmentSubmissions} />;
  if (variant === 'broadcast') return <BroadcastEnhancerPanel users={users} />;
  if (variant === 'dashboard') return <div className="grid grid-cols-1 xl:grid-cols-2 gap-6"><LearningPathAdminPanel {...common} /><ExamErrorAnalyticsPanel {...common} /></div>;
  if (variant === 'parent') return <ParentPortalPanel {...common} />;
  if (variant === 'gamification') return <GamificationAndCertificatesPanel users={users} examResults={examResults} />;
  return <div className="space-y-6"><LearningPathAdminPanel {...common} /><ExamErrorAnalyticsPanel {...common} /><ParentPortalPanel {...common} /><GamificationAndCertificatesPanel users={users} examResults={examResults} /></div>;
}
