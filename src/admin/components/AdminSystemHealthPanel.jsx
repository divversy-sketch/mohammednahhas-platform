import React from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { AlertTriangle, Activity, ClipboardList, Download, FileCheck, History, RefreshCw } from '../../shared/icons/lucide-shim.jsx';
import { db } from '../../services/firebase.js';
import { COLLECTIONS } from '../../config/collections.js';

const dateText = (value) => {
  const d = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString('ar-EG') : '—';
};

const exportCsv = (name, rows) => {
  const header = Object.keys(rows[0] || { empty: '' });
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows.map((r) => header.map((h) => r[h]))].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const qaRows = [
  ['طالب', 'تسجيل الدخول وفتح Dashboard الطالب'],
  ['طالب', 'فتح كورس ودرس وتشغيل فيديو أو ملف'],
  ['امتحانات', 'بدء امتحان ثم refresh ثم استكمال نفس المحاولة وتسليمها'],
  ['مدفوعات', 'إرسال طلب دفع من الطالب ثم قبول الطلب من الأدمن'],
  ['إشعارات', 'إرسال إشعار من الأدمن واستلامه في حساب طالب مستهدف'],
  ['دعم', 'فتح تذكرة دعم والرد عليها وإغلاقها'],
  ['أدمن', 'تصدير CSV للطلاب والمدفوعات والتقارير'],
  ['مراقبة', 'مراجعة أخطاء النظام وقياسات الأداء بعد التجربة'],
];

const backupCollections = [
  'users', 'exam_results', 'examResults', 'attempts', 'payment_requests', 'subscription_codes',
  'student_messages', 'notifications', 'announcements', 'courses', 'content', 'lessonProgress',
  'video_views', 'admin_audit_logs', 'system_errors', 'performance_metrics'
];

function Stat({ title, value, tone = 'slate' }) {
  const tones = {
    red: 'border-red-100 bg-red-50 text-red-900',
    blue: 'border-blue-100 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-100 bg-amber-50 text-amber-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
  };
  return <div className={`rounded-3xl border p-4 ${tones[tone]}`}><p className="text-sm font-black opacity-70">{title}</p><p className="text-3xl font-black">{value}</p></div>;
}

export default function AdminSystemHealthPanel() {
  const [errors, setErrors] = React.useState([]);
  const [metrics, setMetrics] = React.useState([]);
  const [auditLogs, setAuditLogs] = React.useState([]);
  const [migrationReports, setMigrationReports] = React.useState([]);

  React.useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, COLLECTIONS.SYSTEM_ERRORS), orderBy('createdAt', 'desc'), limit(60)), (snap) => setErrors(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setErrors([])),
      onSnapshot(query(collection(db, COLLECTIONS.PERFORMANCE_METRICS), orderBy('createdAt', 'desc'), limit(60)), (snap) => setMetrics(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setMetrics([])),
      onSnapshot(query(collection(db, 'admin_audit_logs'), orderBy('createdAt', 'desc'), limit(40)), (snap) => setAuditLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setAuditLogs([])),
      onSnapshot(query(collection(db, COLLECTIONS.MIGRATION_REPORTS), orderBy('createdAt', 'desc'), limit(20)), (snap) => setMigrationReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setMigrationReports([])),
    ];
    return () => unsubs.forEach((fn) => fn?.());
  }, []);

  const avgLoad = Math.round(metrics.reduce((sum, m) => sum + Number(m.valueMs || 0), 0) / Math.max(metrics.length, 1));
  const slowPages = metrics.filter((m) => Number(m.valueMs || 0) >= 2500).length;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Activity className="text-blue-600"/> صحة النظام والتجهيز للإنتاج</h2>
        <p className="text-sm text-slate-500 font-bold mt-1">المكان الموحد لمراقبة الأخطاء، الأداء، سجل العمليات، QA بعد الرفع، وخطة النسخ الاحتياطي بدون تبويبات جديدة.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        <Stat title="أخطاء مسجلة" value={errors.length} tone="red" />
        <Stat title="قياسات أداء" value={metrics.length} tone="blue" />
        <Stat title="متوسط الوقت" value={`${avgLoad}ms`} tone="emerald" />
        <Stat title="صفحات بطيئة" value={slowPages} tone="amber" />
        <Stat title="آخر عمليات Audit" value={auditLogs.length} />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><ClipboardList className="text-emerald-600"/> قائمة اختبار ما بعد الرفع</h3>
          <button onClick={() => exportCsv('post-deploy-qa', qaRows.map(([area, check]) => ({ area, check, status: 'pending' })))} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-2"><Download size={14}/> CSV</button>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {qaRows.map(([area, check]) => <div key={`${area}-${check}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-black text-slate-400">{area}</p><p className="font-black text-slate-800">{check}</p></div>)}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><AlertTriangle className="text-red-500"/> أخطاء النظام الحقيقية</h3>
            <button onClick={() => exportCsv('system-errors', errors.map((e) => ({ area: e.area, message: e.message, page: e.page, userId: e.userId, createdAt: dateText(e.createdAt) })))} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-2"><Download size={14}/> CSV</button>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto">
            {errors.map((e) => <div key={e.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="font-black text-slate-900">{e.message}</p><p className="text-xs text-slate-500 mt-1" dir="ltr">{e.area} · {e.page} · {dateText(e.createdAt)}</p></div>)}
            {errors.length === 0 && <p className="text-center text-slate-400 font-bold py-6">لا توجد أخطاء مسجلة.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-3"><RefreshCw className="text-blue-500"/> مراقبة الأداء و Firestore</h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {metrics.map((m) => <div key={m.id} className="flex justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"><span className="font-black text-slate-800">{m.metricName}</span><span className="text-sm font-black text-blue-700">{m.valueMs}ms</span></div>)}
            {metrics.length === 0 && <p className="text-center text-slate-400 font-bold py-6">لم يتم تسجيل قياسات أداء بعد.</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-3"><History className="text-purple-600"/> آخر عمليات Audit</h3>
          <div className="space-y-2 max-h-72 overflow-auto">
            {auditLogs.map((log) => <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="font-black text-slate-800">{log.action || log.title || 'عملية إدارية'}</p><p className="text-xs text-slate-500" dir="ltr">{log.adminEmail || log.actorEmail || ''} · {dateText(log.createdAt)}</p></div>)}
            {auditLogs.length === 0 && <p className="text-center text-slate-400 font-bold py-6">لا توجد عمليات حديثة.</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Download className="text-emerald-600"/> Backup و Migration</h3>
            <button onClick={() => exportCsv('backup-collections', backupCollections.map((name) => ({ collection: name, include: 'yes' })))} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-2"><Download size={14}/> CSV</button>
          </div>
          <p className="text-sm font-bold text-slate-500 mb-3">شغّل قبل أي تعديل كبير: <code dir="ltr" className="bg-slate-100 px-2 py-1 rounded">npm run backup:plan</code> ثم <code dir="ltr" className="bg-slate-100 px-2 py-1 rounded">npm run migrate:plan</code></p>
          <div className="flex flex-wrap gap-2">
            {backupCollections.map((name) => <span key={name} dir="ltr" className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-black text-slate-700">{name}</span>)}
          </div>
          {migrationReports.length > 0 && <div className="mt-4 space-y-2">{migrationReports.slice(0, 3).map((r) => <div key={r.id} className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3"><p className="font-black text-emerald-800">{r.title || 'Migration report'}</p><p className="text-xs text-emerald-600">{dateText(r.createdAt)}</p></div>)}</div>}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2"><FileCheck/> أوامر الإنتاج الموحدة</h3>
        <pre dir="ltr" className="mt-3 overflow-auto rounded-2xl bg-white border border-emerald-100 p-4 text-xs font-bold text-slate-800">{`npm run cleanup:report\nnpm run firestore:performance\nnpm run e2e:real\nnpm run backup:plan\nnpm run postdeploy:qa\nnpm run production:ready`}</pre>
      </div>
    </div>
  );
}
