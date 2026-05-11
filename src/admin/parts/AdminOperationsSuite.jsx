import { useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { platformNotify } from '../../shared/core/platformShared.jsx';
import { Bell, ClipboardList, History, Save, Settings, Shield, Users } from '../../shared/icons/lucide-shim.jsx';
import { getGradeLabel } from '../../shared/constants/grades.jsx';

import { ADMIN_ROLE_LABELS as ROLE_LABELS, ADMIN_TAB_LABELS, ROLE_TAB_ACCESS, getRolePermissions, getRoleTabs, isOwnerEmail } from '../../config/adminPermissions';

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

export function AdminPlatformSettingsManager({ userData = {} }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);

  useEffect(() => onSnapshot(doc(db, 'platform_settings', 'main'), (snap) => {
    if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
  }, () => {}), []);

  const save = async () => {
    setBusy(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'main'), {
        ...settings,
        defaultExamGatePercentage: Number(settings.defaultExamGatePercentage || 70),
        defaultLessonWatchPercentage: Number(settings.defaultLessonWatchPercentage || 75),
        updatedAt: serverTimestamp(),
        updatedBy: userData?.email || userData?.uid || 'admin',
      }, { merge: true });
      await setDoc(doc(collection(db, 'admin_client_logs')), {
        action: 'platform_settings_update',
        title: 'تعديل إعدادات المنصة العامة',
        adminEmail: userData?.email || '',
        adminName: userData?.name || '',
        createdAt: serverTimestamp(),
      });
      platformNotify('تم حفظ إعدادات المنصة وتشغيلها للواجهات المرتبطة بها.');
    } catch (error) {
      platformNotify(error?.message || 'تعذر حفظ الإعدادات');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-3xl p-5 border shadow-sm">
        <h2 className="text-2xl font-black flex gap-2 text-slate-900"><Settings className="text-amber-600"/> إعدادات المنصة العامة</h2>
        <p className="text-slate-500 font-bold mt-1">الإعدادات هنا محفوظة في Firestore وتُستخدم في تجربة الطالب والتشغيل العام بدل التعديل من الكود.</p>
      </div>
      <div className="bg-white rounded-3xl p-5 border shadow-sm grid md:grid-cols-2 gap-4">
        <Field label="اسم المنصة"><input className="w-full border rounded-xl p-3" value={settings.platformName} onChange={(e)=>setSettings({...settings, platformName:e.target.value})}/></Field>
        <Field label="رقم واتساب الدعم"><input className="w-full border rounded-xl p-3" value={settings.supportWhatsapp} onChange={(e)=>setSettings({...settings, supportWhatsapp:e.target.value})}/></Field>
        <Field label="رابط اللوجو"><input className="w-full border rounded-xl p-3" value={settings.logoUrl} onChange={(e)=>setSettings({...settings, logoUrl:e.target.value})}/></Field>
        <Field label="لون المنصة الرئيسي"><input className="w-full border rounded-xl p-3" type="color" value={settings.primaryColor} onChange={(e)=>setSettings({...settings, primaryColor:e.target.value})}/></Field>
        <Field label="رسالة الترحيب"><textarea className="w-full border rounded-xl p-3 min-h-24" value={settings.welcomeMessage} onChange={(e)=>setSettings({...settings, welcomeMessage:e.target.value})}/></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نسبة فتح الامتحان الافتراضية"><input className="w-full border rounded-xl p-3" type="number" min="0" max="100" value={settings.defaultExamGatePercentage} onChange={(e)=>setSettings({...settings, defaultExamGatePercentage:e.target.value})}/></Field>
          <Field label="نسبة مشاهدة الدرس الافتراضية"><input className="w-full border rounded-xl p-3" type="number" min="0" max="100" value={settings.defaultLessonWatchPercentage} onChange={(e)=>setSettings({...settings, defaultLessonWatchPercentage:e.target.value})}/></Field>
        </div>
        <label className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 font-black"><input type="checkbox" checked={!!settings.registrationOpen} onChange={(e)=>setSettings({...settings, registrationOpen:e.target.checked})}/> التسجيل مفتوح للطلاب الجدد</label>
        <label className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 font-black"><input type="checkbox" checked={!!settings.showLockedExams} onChange={(e)=>setSettings({...settings, showLockedExams:e.target.checked})}/> إظهار الامتحانات المقفولة للطالب مع سبب القفل</label>
        <label className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 font-black"><input type="checkbox" checked={!!settings.showLearningPath} onChange={(e)=>setSettings({...settings, showLearningPath:e.target.checked})}/> تفعيل صفحة مساري التعليمي للطالب</label>
        <button disabled={busy} onClick={save} className="md:col-span-2 bg-amber-600 text-white rounded-2xl p-4 font-black flex items-center justify-center gap-2 hover:bg-amber-700 disabled:bg-slate-300"><Save/> حفظ الإعدادات</button>
      </div>
    </div>
  );
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
