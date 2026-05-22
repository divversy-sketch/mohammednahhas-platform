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

export function AdminRolesManager({ users = [], userData = {} }) {
  const admins = useMemo(() => (users || []).filter((u) => u.role === 'admin' || u.isAdmin || u.adminRole), [users]);
  const students = useMemo(() => (users || []).filter((u) => u.role !== 'admin'), [users]);
  const [target, setTarget] = useState('');
  const [role, setRole] = useState('students_supervisor');

  const saveRole = async () => {
    if (!target) return platformNotify('اختار مستخدم أولاً');
    if (!userData?.isOwner && !isOwnerEmail(userData?.email)) return platformNotify('تعيين المساعدين متاح للمالك فقط.');
    const selected = users.find((u) => u.id === target);
    if (!selected?.id) return platformNotify('المستخدم المحدد غير موجود.');
    if (isOwnerEmail(selected.email)) return platformNotify('حساب المالك ثابت ولا يحتاج تعيين.');

    const permissions = getRolePermissions(role);
    const allowedTabs = getRoleTabs(role);
    const rolePayload = {
      role: 'admin',
      isAdmin: true,
      adminRole: role,
      adminRoleLabel: ROLE_LABELS[role],
      permissions,
      allowedTabs,
      active: true,
      email: selected.email || '',
      name: selected.name || selected.displayName || selected.email || '',
      sourceUserId: target,
      roleUpdatedAt: serverTimestamp(),
      roleUpdatedBy: userData?.email || '',
    };

    await setDoc(doc(db, 'admins', target), rolePayload, { merge: true });
    await updateDoc(doc(db, 'users', target), rolePayload);
    await setDoc(doc(collection(db, 'admin_client_logs')), {
      action: 'admin_role_update',
      title: `تعيين صلاحية ${ROLE_LABELS[role]}`,
      targetUserId: target,
      targetEmail: selected?.email || '',
      adminEmail: userData?.email || '',
      createdAt: serverTimestamp(),
    });
    platformNotify('تم تحويل الحساب لمساعد وتفعيل صلاحياته في بوابة الإدارة.');
  };

  const revokeAdmin = async (u) => {
    if (!userData?.isOwner && !isOwnerEmail(userData?.email)) return platformNotify('إلغاء صلاحيات المساعدين متاح للمالك فقط.');
    if (isOwnerEmail(u.email)) return platformNotify('لا يمكن إلغاء صلاحية المالك الأساسي.');
    const resetPayload = { role: 'student', isAdmin: false, adminRole: '', adminRoleLabel: '', permissions: [], allowedTabs: [], roleRevokedAt: serverTimestamp(), roleRevokedBy: userData?.email || '' };
    await setDoc(doc(db, 'admins', u.id), { active: false, revokedAt: serverTimestamp(), revokedBy: userData?.email || '' }, { merge: true });
    await updateDoc(doc(db, 'users', u.id), resetPayload);
    await setDoc(doc(collection(db, 'admin_client_logs')), { action: 'admin_role_revoke', title: 'إلغاء صلاحية أدمن', targetUserId: u.id, targetEmail: u.email || '', adminEmail: userData?.email || '', createdAt: serverTimestamp() });
    platformNotify('تم إلغاء صلاحية المساعد وإرجاعه كطالب.');
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-3xl p-5 border shadow-sm">
        <h2 className="text-2xl font-black flex gap-2"><Shield className="text-blue-600"/> صلاحيات الأدمن</h2>
        <p className="text-slate-500 font-bold mt-1">حوّل أي مستخدم لمشرف بصلاحية واضحة، وكل عملية تتسجل في سجل الإدارة.</p>
      </div>
      <div className="bg-white rounded-3xl p-5 border shadow-sm grid md:grid-cols-3 gap-3">
        <select className="border rounded-xl p-3" value={target} onChange={(e)=>setTarget(e.target.value)}>
          <option value="">اختار مستخدم</option>
          {[...admins, ...students].map((u)=><option key={u.id} value={u.id}>{u.name || u.email} — {getGradeLabel(u.grade)}</option>)}
        </select>
        <select className="border rounded-xl p-3" value={role} onChange={(e)=>setRole(e.target.value)}>
          {Object.entries(ROLE_LABELS).filter(([key]) => key !== 'owner').map(([key, label])=><option key={key} value={key}>{label}</option>)}
        </select>
        <button onClick={saveRole} className="bg-blue-700 text-white rounded-xl p-3 font-black flex items-center justify-center gap-2"><Users/> حفظ الصلاحية</button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {admins.map((u)=><div key={u.id} className="bg-white border rounded-3xl p-4 shadow-sm">
          <h3 className="font-black text-slate-900">{u.name || u.email}</h3>
          <p className="text-xs text-slate-500 mt-1">{u.email}</p>
          <p className="mt-3 bg-blue-50 text-blue-700 rounded-xl px-3 py-2 font-black text-sm">{ROLE_LABELS[u.adminRole] || u.adminRoleLabel || 'أدمن'}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-600">{(ROLE_TAB_ACCESS[u.adminRole] || u.allowedTabs || []).map((p)=><p key={p}>• {ADMIN_TAB_LABELS[p] || p}</p>)}</div>
          <button onClick={()=>revokeAdmin(u)} className="mt-4 w-full bg-red-50 text-red-700 border border-red-100 rounded-xl p-2 font-black">إلغاء الصلاحية</button>
        </div>)}
        {!admins.length && <div className="bg-white border rounded-3xl p-6 text-center text-slate-500 font-bold">لا يوجد مشرفون مسجلون حتى الآن.</div>}
      </div>
    </div>
  );
}
