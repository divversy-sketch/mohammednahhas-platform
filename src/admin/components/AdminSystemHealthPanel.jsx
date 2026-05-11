import React from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { AlertTriangle, Activity, Download } from '../../shared/icons/lucide-shim.jsx';
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

export default function AdminSystemHealthPanel() {
  const [errors, setErrors] = React.useState([]);
  const [metrics, setMetrics] = React.useState([]);

  React.useEffect(() => {
    const unsubErrors = onSnapshot(query(collection(db, COLLECTIONS.SYSTEM_ERRORS), orderBy('createdAt', 'desc'), limit(40)), (snap) => {
      setErrors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => setErrors([]));
    const unsubMetrics = onSnapshot(query(collection(db, COLLECTIONS.PERFORMANCE_METRICS), orderBy('createdAt', 'desc'), limit(40)), (snap) => {
      setMetrics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => setMetrics([]));
    return () => { unsubErrors(); unsubMetrics(); };
  }, []);

  const avgLoad = Math.round(metrics.reduce((sum, m) => sum + Number(m.valueMs || 0), 0) / Math.max(metrics.length, 1));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-3xl border border-red-100 bg-red-50 p-4"><p className="text-sm font-black text-red-700">أخطاء مسجلة</p><p className="text-3xl font-black text-red-900">{errors.length}</p></div>
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-black text-blue-700">قياسات أداء</p><p className="text-3xl font-black text-blue-900">{metrics.length}</p></div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-sm font-black text-emerald-700">متوسط الوقت</p><p className="text-3xl font-black text-emerald-900">{avgLoad}ms</p></div>
      </div>

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
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-3"><Activity className="text-blue-500"/> مراقبة الأداء</h3>
        <div className="space-y-2 max-h-72 overflow-auto">
          {metrics.map((m) => <div key={m.id} className="flex justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"><span className="font-black text-slate-800">{m.metricName}</span><span className="text-sm font-black text-blue-700">{m.valueMs}ms</span></div>)}
          {metrics.length === 0 && <p className="text-center text-slate-400 font-bold py-6">لم يتم تسجيل قياسات أداء بعد.</p>}
        </div>
      </div>
    </div>
  );
}
