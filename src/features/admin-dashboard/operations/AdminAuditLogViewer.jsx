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

export function AdminAuditLogViewer() {
  const [logs, setLogs] = useState([]);
  useEffect(() => onSnapshot(query(collection(db, 'admin_client_logs'), orderBy('createdAt', 'desc'), limit(150)), (snap) => {
    setLogs(snap.docs.map((d)=>({ id: d.id, ...d.data() })));
  }, () => setLogs([])), []);
  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-3xl p-5 border shadow-sm">
        <h2 className="text-2xl font-black flex gap-2"><History className="text-purple-600"/> سجل نشاط الإدارة</h2>
        <p className="text-slate-500 font-bold mt-1">كل العمليات الحساسة: حذف طالب، تغيير كلمة سر، فتح استثنائي، تعديل إعدادات وصلاحيات.</p>
      </div>
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {logs.map((log)=><div key={log.id} className="p-4 border-b last:border-0 hover:bg-slate-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div><p className="font-black text-slate-900 flex gap-2"><ClipboardList size={16}/> {log.title || log.action || 'عملية إدارية'}</p><p className="text-xs text-slate-500 mt-1">{log.adminEmail || log.adminName || 'admin'} {log.targetEmail ? `← ${log.targetEmail}` : ''}</p></div>
            <span className="text-xs bg-slate-100 rounded-full px-3 py-1 font-bold text-slate-600">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('ar-EG') : '—'}</span>
          </div>
        </div>)}
        {!logs.length && <div className="p-8 text-center text-slate-500 font-bold">لا توجد عمليات مسجلة بعد.</div>}
      </div>
    </div>
  );
}
