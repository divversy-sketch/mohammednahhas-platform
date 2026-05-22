import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@services/firebase';
import { downloadXlsx } from '@shared/utils/exportData.js';
import { usePagination } from '@shared/hooks/usePagination.js';
import PaginationBar from '@shared/components/PaginationBar.jsx';
import { platformConfirm, platformNotify } from '@shared/core/platformShared.jsx';
import { Bell, ClipboardList, History, Save, Settings, Shield, Users } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';

import { ADMIN_ROLE_LABELS as ROLE_LABELS, ADMIN_TAB_LABELS, ROLE_TAB_ACCESS, getRolePermissions, getRoleTabs, isOwnerEmail } from '@config/adminPermissions';

const DEFAULT_SETTINGS = {
  platformName: 'منصة النحاس التعليمية',
  welcomeMessage: 'ابدأ مذاكرتك بخطوة واضحة، وراجع تقدمك باستمرار.',
  supportWhatsapp: '201500076322',
  registrationOpen: true,
  defaultExamGatePercentage: 70,
  defaultLessonWatchPercentage: 75,
  showLockedExams: true,
  showLearningPath: true,
  primaryColor: '#f59e0b',
  logoUrl: '',
};

function Field({ label, children }) {
  return <label className="block"><span className="text-xs font-black text-slate-500 mb-1 block">{label}</span>{children}</label>;
}

export function AdminNotificationsManager({ users = [], userData = {} }) {
  const [form, setForm] = useState({ target: 'all', title: '', body: '', grade: '' });
  const send = async () => {
    if (!form.title.trim() || !form.body.trim()) return platformNotify('اكتب عنوان ومحتوى الإشعار');
    const targets = users.filter((u) => form.target === 'all' || (form.target === 'grade' && u.grade === form.grade) || (form.target === 'student' && u.id === form.studentId));
    for (const u of targets) {
      await setDoc(doc(collection(db, 'notifications')), {
        userId: u.id,
        title: form.title,
        body: form.body,
        type: 'admin_message',
        read: false,
        createdAt: serverTimestamp(),
        createdBy: userData?.email || '',
      });
    }
    await setDoc(doc(collection(db, 'admin_client_logs')), { action: 'send_notifications', title: `إرسال إشعار إلى ${targets.length} طالب`, adminEmail: userData?.email || '', createdAt: serverTimestamp() });
    setForm({ target: 'all', title: '', body: '', grade: '' });
    platformNotify(`تم إرسال الإشعار إلى ${targets.length} طالب.`);
  };
  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-3xl p-5 border shadow-sm"><h2 className="text-2xl font-black flex gap-2"><Bell className="text-amber-600"/> إشعارات داخل المنصة</h2><p className="text-slate-500 font-bold mt-1">إرسال تنبيه يظهر داخل حساب الطالب بدون الاعتماد على إشعارات المتصفح.</p></div>
      <div className="bg-white rounded-3xl p-5 border shadow-sm grid gap-3">
        <select className="border rounded-xl p-3" value={form.target} onChange={(e)=>setForm({...form, target:e.target.value})}><option value="all">كل الطلاب</option><option value="grade">مرحلة معينة</option><option value="student">طالب محدد</option></select>
        {form.target === 'grade' && <select className="border rounded-xl p-3" value={form.grade} onChange={(e)=>setForm({...form, grade:e.target.value})}><option value="">اختار المرحلة</option>{Array.from(new Set(users.map(u=>u.grade).filter(Boolean))).map(g=><option key={g} value={g}>{getGradeLabel(g)}</option>)}</select>}
        {form.target === 'student' && <select className="border rounded-xl p-3" value={form.studentId || ''} onChange={(e)=>setForm({...form, studentId:e.target.value})}><option value="">اختار الطالب</option>{users.map(u=><option key={u.id} value={u.id}>{u.name || u.email}</option>)}</select>}
        <input className="border rounded-xl p-3" placeholder="عنوان الإشعار" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})}/>
        <textarea className="border rounded-xl p-3 min-h-28" placeholder="نص الإشعار" value={form.body} onChange={(e)=>setForm({...form, body:e.target.value})}/>
        <button onClick={send} className="bg-amber-600 text-white rounded-xl p-3 font-black">إرسال الإشعار</button>
      </div>
    </div>
  );
}

const planCardClass = 'bg-white border border-slate-200 rounded-3xl p-5 shadow-sm';
const pct = (done, total) => total > 0 ? Math.round((done / total) * 100) : 0;


const growthTabs = [
  ['payments', 'المدفوعات والاشتراكات'],
  ['courses', 'المحتوى والكورسات'],
  ['questions', 'بنك الأسئلة'],
  ['analytics', 'التقارير والتحليلات'],
  ['notifications', 'الإشعارات والتنبيهات'],
  ['mobile', 'تجربة الموبايل'],
  ['support', 'الدعم والرسائل'],
];

const statusLabel = (status) => ({ pending: 'معلق', approved: 'مقبول', rejected: 'مرفوض', completed: 'مكتمل', open: 'مفتوحة', replied: 'تم الرد', closed: 'مغلقة', published: 'منشور', draft: 'مسودة' }[status] || status || '—');
const toInputDate = (value) => {
  const d = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
};
const parseCsvLine = (line) => {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === ',' && !quoted) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
};
const excelDownload = (filename, rows) => downloadXlsx(filename.replace(/\.csv$/i, '.xlsx'), rows);
