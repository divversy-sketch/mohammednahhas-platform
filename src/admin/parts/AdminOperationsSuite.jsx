import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { downloadXlsx } from '../../shared/utils/exportData.js';
import { usePagination } from '../../shared/hooks/usePagination.js';
import PaginationBar from '../../shared/components/PaginationBar.jsx';
import { platformConfirm, platformNotify } from '../../shared/core/platformShared.jsx';
import { Bell, ClipboardList, History, Save, Settings, Shield, Users } from '../../shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades.jsx';

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

export function AdminGrowthSuite({ users = [], exams = [], examResults = [], content = [], assignments = [], assignmentSubmissions = [], subscriptionCodes = [], notifications = [], userData = {}, initialTab = 'payments', compact = false }) {
  const [tab, setTab] = useState(initialTab || 'payments');
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [units, setUnits] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [mobileSettings, setMobileSettings] = useState({ bottomNav: true, compactCards: true, dataSaver: false, examSafeMode: true, showInstallPrompt: true });
  const [busy, setBusy] = useState(false);
  const [planDraft, setPlanDraft] = useState({ title: 'اشتراك شهري', price: 150, days: 30, features: 'فتح المحاضرات والامتحانات' });
  const [unitDraft, setUnitDraft] = useState({ title: '', grade: '3sec', week: 1, publishAt: '', prerequisiteContentId: '', status: 'published' });
  const [questionDraft, setQuestionDraft] = useState({ text: '', grade: '3sec', branch: 'النحو', topic: '', difficulty: 'medium', options: '', correctIdx: 0, explanation: '' });
  const [bulkQuestions, setBulkQuestions] = useState('');
  const [messageDraft, setMessageDraft] = useState({ title: '', body: '', audience: 'all', grade: 'all', userIdsText: '', scheduledAt: '' });
  const [replyDrafts, setReplyDrafts] = useState({});
  const [paymentFilter, setPaymentFilter] = useState('pending');
  const [questionFilter, setQuestionFilter] = useState({ grade: 'all', branch: 'all', difficulty: 'all', search: '' });
  const [analyticsGradeFilter, setAnalyticsGradeFilter] = useState('all');
  const [examDraft, setExamDraft] = useState({ title: 'امتحان من بنك الأسئلة', grade: '3sec', count: 10, branch: 'all', difficulty: 'all', durationMinutes: 30 });

  useEffect(() => onSnapshot(query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(100)), (snap) => setPayments(snap.docs.map((d)=>({ id:d.id, ...d.data() }))), () => setPayments([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'subscription_plans'), orderBy('createdAt', 'desc'), limit(50)), (snap) => setPlans(snap.docs.map((d)=>({ id:d.id, ...d.data() }))), () => setPlans([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'course_units'), orderBy('week', 'asc'), limit(200)), (snap) => setUnits(snap.docs.map((d)=>({ id:d.id, ...d.data() }))), () => setUnits([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'question_bank'), orderBy('createdAt', 'desc'), limit(300)), (snap) => setQuestions(snap.docs.map((d)=>({ id:d.id, ...d.data() }))), () => setQuestions([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'student_messages'), orderBy('createdAt', 'desc'), limit(80)), (snap) => setMessages(snap.docs.map((d)=>({ id:d.id, ...d.data() }))), () => setMessages([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'student_chats'), orderBy('updatedAt', 'desc'), limit(100)), (snap) => setSupportTickets(snap.docs.map((d)=>({ id:d.id, ...d.data() }))), () => setSupportTickets([])), []);
  useEffect(() => onSnapshot(doc(db, 'platform_settings', 'mobile_experience'), (snap) => snap.exists() && setMobileSettings((s)=>({ ...s, ...snap.data() })), () => {}), []);

  const writeLog = async (action, title, meta = {}) => setDoc(doc(collection(db, 'admin_client_logs')), {
    action,
    title,
    severity: meta.severity || 'info',
    adminEmail: userData?.email || '',
    adminName: userData?.name || '',
    meta,
    createdAt: serverTimestamp(),
  });

  const dashboardStats = useMemo(() => {
    const active = users.filter((u) => u.status === 'active');
    const premium = users.filter((u) => u.subscriptionStatus === 'premium');
    const completed = examResults.filter((r) => r.status === 'completed');
    const avg = completed.length ? Math.round(completed.reduce((s, r) => s + Number(r.percentage ?? r.scorePercentage ?? r.percent ?? 0), 0) / completed.length) : 0;
    const pendingPayments = payments.filter((p)=>p.status === 'pending').length;
    const openTickets = supportTickets.filter((t)=>['open','pending'].includes(t.status || 'open')).length;
    return { active: active.length, premium: premium.length, avg, pendingPayments, openTickets, questionCount: questions.length, units: units.length };
  }, [users, examResults, payments, supportTickets, questions, units]);

  const savePlan = async () => {
    if (!planDraft.title.trim()) return platformNotify('اكتب اسم الباقة.');
    setBusy(true);
    try {
      await setDoc(doc(collection(db, 'subscription_plans')), {
        ...planDraft,
        price: Number(planDraft.price || 0),
        days: Number(planDraft.days || 30),
        features: String(planDraft.features || '').split('\n').map((x)=>x.trim()).filter(Boolean),
        active: true,
        createdAt: serverTimestamp(),
        createdBy: userData?.email || '',
      });
      await writeLog('subscription_plan_created', 'إنشاء باقة اشتراك', { title: planDraft.title, price: planDraft.price, days: planDraft.days });
      setPlanDraft({ title: 'اشتراك شهري', price: 150, days: 30, features: 'فتح المحاضرات والامتحانات' });
      platformNotify('تم إنشاء الباقة.');
    } finally { setBusy(false); }
  };


  const togglePlan = async (plan) => {
    await setDoc(doc(db, 'subscription_plans', plan.id), { active: plan.active === false, updatedAt: serverTimestamp(), updatedBy: userData?.email || '' }, { merge: true });
    await writeLog('subscription_plan_toggle', plan.active === false ? 'تفعيل باقة اشتراك' : 'إيقاف باقة اشتراك', { planId: plan.id, title: plan.title || '' });
    platformNotify(plan.active === false ? 'تم تفعيل الباقة.' : 'تم إيقاف الباقة.');
  };

  const deletePlan = async (plan) => {
    if (!platformConfirm(`حذف باقة ${plan.title || ''}؟`)) return;
    await deleteDoc(doc(db, 'subscription_plans', plan.id));
    await writeLog('subscription_plan_deleted', 'حذف باقة اشتراك', { planId: plan.id, title: plan.title || '', severity: 'warning' });
    platformNotify('تم حذف الباقة.');
  };

  const exportPayments = () => excelDownload(`nahhas-payments-${new Date().toISOString().slice(0,10)}.xlsx`, [
    ['studentName','email','phone','amount','method','status','days','createdAt','reviewedBy'],
    ...payments.map((p)=>[p.studentName || p.name || '', p.email || p.studentEmail || '', p.phone || '', p.amount || p.price || '', p.method || '', p.status || 'pending', p.days || p.planDays || '', toInputDate(p.createdAt), p.reviewedBy || ''])
  ]);

  const notifyExpiringSubscriptions = async () => {
    const expiring = users.filter((u) => {
      const exp = u.subscriptionExpiry?.toDate?.() || u.subscription?.expiresAt?.toDate?.() || (u.subscriptionExpiry ? new Date(u.subscriptionExpiry) : null);
      return exp && exp > new Date() && (exp.getTime() - Date.now()) / 86400000 <= 7;
    });
    if (!expiring.length) return platformNotify('لا يوجد طلاب اشتراكهم قريب الانتهاء خلال 7 أيام.');
    for (const u of expiring) {
      await setDoc(doc(collection(db, 'student_messages')), {
        userId: u.id,
        title: 'تنبيه قرب انتهاء الاشتراك',
        body: 'اشتراكك أوشك على الانتهاء. يرجى التجديد قبل توقف الوصول للمحتوى.',
        audience: 'student',
        read: false,
        createdAt: serverTimestamp(),
        createdBy: userData?.email || '',
      });
    }
    await writeLog('expiring_subscription_notifications_sent', 'إرسال تنبيهات قرب انتهاء الاشتراك', { count: expiring.length });
    platformNotify(`تم إرسال تنبيه إلى ${expiring.length} طالب.`);
  };

  const decidePayment = async (payment, status) => {
    const days = Number(payment.days || payment.planDays || 30);
    const expiry = new Date(Date.now() + days * 86400000);
    setBusy(true);
    try {
      await updateDoc(doc(db, 'payment_requests', payment.id), { status, reviewedAt: serverTimestamp(), reviewedBy: userData?.email || '' });
      if (status === 'approved' && payment.userId) {
        await setDoc(doc(db, 'users', payment.userId), { subscriptionStatus: 'premium', subscriptionExpiry: expiry, subscriptionUpdatedAt: serverTimestamp(), subscriptionSource: 'payment_request' }, { merge: true });
      }
      await writeLog(status === 'approved' ? 'payment_approved' : 'payment_rejected', status === 'approved' ? 'قبول طلب دفع' : 'رفض طلب دفع', { paymentId: payment.id, userId: payment.userId || '', amount: payment.amount || payment.price || '', days, severity: status === 'approved' ? 'info' : 'warning' });
      platformNotify(status === 'approved' ? 'تم قبول الدفع وتفعيل الاشتراك.' : 'تم رفض طلب الدفع.');
    } finally { setBusy(false); }
  };

  const saveUnit = async () => {
    if (!unitDraft.title.trim()) return platformNotify('اكتب اسم الوحدة أو الأسبوع.');
    await setDoc(doc(collection(db, 'course_units')), {
      ...unitDraft,
      week: Number(unitDraft.week || 1),
      publishAt: unitDraft.publishAt || '',
      createdAt: serverTimestamp(),
      createdBy: userData?.email || '',
    });
    await writeLog('course_unit_created', 'إنشاء وحدة كورس', { title: unitDraft.title, grade: unitDraft.grade, week: unitDraft.week });
    setUnitDraft({ title: '', grade: unitDraft.grade, week: Number(unitDraft.week || 1) + 1, publishAt: '', prerequisiteContentId: '', status: 'published' });
    platformNotify('تم حفظ وحدة الكورس.');
  };

  const saveQuestion = async () => {
    if (!questionDraft.text.trim()) return platformNotify('اكتب نص السؤال.');
    const options = questionDraft.options.split('\n').map((x)=>x.trim()).filter(Boolean);
    await setDoc(doc(collection(db, 'question_bank')), {
      ...questionDraft,
      options,
      correctIdx: Number(questionDraft.correctIdx || 0),
      maxScore: 1,
      createdAt: serverTimestamp(),
      createdBy: userData?.email || '',
    });
    await writeLog('question_bank_item_created', 'إضافة سؤال لبنك الأسئلة', { grade: questionDraft.grade, branch: questionDraft.branch, topic: questionDraft.topic });
    setQuestionDraft({ ...questionDraft, text: '', options: '', explanation: '' });
    platformNotify('تم إضافة السؤال لبنك الأسئلة.');
  };

  const importQuestions = async () => {
    const lines = bulkQuestions.split('\n').map((x)=>x.trim()).filter(Boolean);
    if (!lines.length) return platformNotify('الصق أسئلة CSV أولاً.');
    const rows = lines[0].includes('text') ? lines.slice(1) : lines;
    let count = 0;
    for (const line of rows) {
      const [text, grade, branch, topic, difficulty, optionsRaw, correctIdx, explanation] = parseCsvLine(line);
      if (!text) continue;
      await setDoc(doc(collection(db, 'question_bank')), {
        text,
        grade: grade || '3sec',
        branch: branch || 'عام',
        topic: topic || 'عام',
        difficulty: difficulty || 'medium',
        options: String(optionsRaw || '').split('|').map((x)=>x.trim()).filter(Boolean),
        correctIdx: Number(correctIdx || 0),
        explanation: explanation || '',
        maxScore: 1,
        createdAt: serverTimestamp(),
        createdBy: userData?.email || '',
        source: 'csv_import',
      });
      count += 1;
    }
    await writeLog('question_bank_csv_imported', 'استيراد أسئلة CSV', { count });
    setBulkQuestions('');
    platformNotify(`تم استيراد ${count} سؤال.`);
  };


  const filteredQuestions = useMemo(() => questions.filter((q) => {
    const search = questionFilter.search.trim().toLowerCase();
    const matchesSearch = !search || [q.text, q.topic, q.branch, q.explanation].filter(Boolean).join(' ').toLowerCase().includes(search);
    const matchesGrade = questionFilter.grade === 'all' || q.grade === questionFilter.grade;
    const matchesBranch = questionFilter.branch === 'all' || q.branch === questionFilter.branch;
    const matchesDifficulty = questionFilter.difficulty === 'all' || q.difficulty === questionFilter.difficulty;
    return matchesSearch && matchesGrade && matchesBranch && matchesDifficulty;
  }), [questions, questionFilter]);

  const questionsPagination = usePagination(filteredQuestions, { pageSize: 30 });

  const deleteQuestion = async (q) => {
    if (!platformConfirm('حذف السؤال من بنك الأسئلة؟')) return;
    await deleteDoc(doc(db, 'question_bank', q.id));
    await writeLog('question_bank_item_deleted', 'حذف سؤال من بنك الأسئلة', { questionId: q.id, grade: q.grade || '', severity: 'warning' });
    platformNotify('تم حذف السؤال.');
  };

  const exportQuestionBank = () => excelDownload(`nahhas-question-bank-${new Date().toISOString().slice(0,10)}.xlsx`, [
    ['text','grade','branch','topic','difficulty','options','correctIdx','explanation'],
    ...filteredQuestions.map((q)=>[q.text || '', q.grade || '', q.branch || '', q.topic || '', q.difficulty || '', (q.options || []).join('|'), q.correctIdx ?? 0, q.explanation || ''])
  ]);

  const buildExamFromBank = async () => {
    const pool = questions.filter((q) =>
      (examDraft.grade === 'all' || q.grade === examDraft.grade) &&
      (examDraft.branch === 'all' || q.branch === examDraft.branch) &&
      (examDraft.difficulty === 'all' || q.difficulty === examDraft.difficulty)
    );
    const count = Math.min(Number(examDraft.count || 10), pool.length);
    if (!count) return platformNotify('لا توجد أسئلة مطابقة لاختيارات الامتحان.');
    const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    await setDoc(doc(collection(db, 'exam_drafts')), {
      title: examDraft.title || 'امتحان من بنك الأسئلة',
      grade: examDraft.grade,
      branch: examDraft.branch,
      difficulty: examDraft.difficulty,
      durationMinutes: Number(examDraft.durationMinutes || 30),
      questions: selected.map((q, index) => ({
        id: q.id,
        order: index + 1,
        text: q.text || '',
        options: q.options || [],
        correctIdx: Number(q.correctIdx || 0),
        explanation: q.explanation || '',
        maxScore: Number(q.maxScore || 1),
      })),
      status: 'draft',
      createdAt: serverTimestamp(),
      createdBy: userData?.email || '',
    });
    await writeLog('exam_draft_generated_from_bank', 'توليد مسودة امتحان من بنك الأسئلة', { count, grade: examDraft.grade, branch: examDraft.branch });
    platformNotify(`تم إنشاء مسودة امتحان بعدد ${count} سؤال في exam_drafts.`);
  };

  const sendMessage = async () => {
    if (!messageDraft.title.trim() || !messageDraft.body.trim()) return platformNotify('اكتب عنوان ونص التنبيه.');
    const userIds = messageDraft.userIdsText.split(/[\n,]+/).map((x)=>x.trim()).filter(Boolean);
    const payload = {
      title: messageDraft.title.trim(),
      body: messageDraft.body.trim(),
      audience: messageDraft.audience,
      grade: messageDraft.grade,
      userIds,
      scheduledAt: messageDraft.scheduledAt || '',
      createdAt: serverTimestamp(),
      createdBy: userData?.email || '',
    };
    await setDoc(doc(collection(db, 'student_messages')), payload);
    await setDoc(doc(collection(db, 'announcements')), { ...payload, text: payload.body, isActive: true }, { merge: true });
    await writeLog('student_message_sent', 'إرسال إشعار للطلاب', { audience: payload.audience, grade: payload.grade, userIdsCount: userIds.length });
    setMessageDraft({ title: '', body: '', audience: 'all', grade: 'all', userIdsText: '', scheduledAt: '' });
    platformNotify('تم إرسال التنبيه داخل المنصة.');
  };

  const saveMobileSettings = async () => {
    await setDoc(doc(db, 'platform_settings', 'mobile_experience'), { ...mobileSettings, updatedAt: serverTimestamp(), updatedBy: userData?.email || '' }, { merge: true });
    await writeLog('mobile_experience_settings_updated', 'تعديل إعدادات تجربة الموبايل', mobileSettings);
    platformNotify('تم حفظ إعدادات تجربة الموبايل.');
  };

  const replyTicket = async (ticket) => {
    const text = (replyDrafts[ticket.id] || '').trim();
    if (!text) return platformNotify('اكتب الرد أولاً.');
    await setDoc(doc(collection(db, 'student_chats', ticket.id, 'messages')), {
      senderRole: 'admin',
      senderId: userData?.uid || userData?.id || userData?.email || 'admin',
      senderName: userData?.name || userData?.email || 'الإدارة',
      text,
      readByStudent: false,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'student_chats', ticket.id), { status: 'replied', lastReply: text.slice(0, 160), updatedAt: serverTimestamp(), repliedBy: userData?.email || '' }, { merge: true });
    await writeLog('support_ticket_replied', 'الرد على تذكرة دعم', { ticketId: ticket.id, studentId: ticket.userId || ticket.studentId || '' });
    setReplyDrafts((s)=>({ ...s, [ticket.id]: '' }));
    platformNotify('تم إرسال الرد للطالب.');
  };

  const closeTicket = async (ticket) => {
    await setDoc(doc(db, 'student_chats', ticket.id), { status: 'closed', closedAt: serverTimestamp(), closedBy: userData?.email || '' }, { merge: true });
    await writeLog('support_ticket_closed', 'إغلاق تذكرة دعم', { ticketId: ticket.id });
    platformNotify('تم إغلاق التذكرة.');
  };

  const studentsAtRisk = useMemo(() => users.map((u) => {
    const results = examResults.filter((r)=>r.userId === u.id || r.studentId === u.id || r.uid === u.id);
    const avg = results.length ? Math.round(results.reduce((s, r)=>s + Number(r.percentage ?? r.scorePercentage ?? r.percent ?? 0), 0) / results.length) : 0;
    const submitted = assignmentSubmissions.filter((s)=>s.userId === u.id || s.studentId === u.id).length;
    const risk = (!results.length ? 35 : 0) + (avg && avg < 60 ? 35 : 0) + (submitted < Math.min(2, assignments.length) ? 20 : 0) + (u.status !== 'active' ? 10 : 0);
    return { ...u, avg, resultsCount: results.length, submitted, risk: Math.min(100, risk) };
  }).filter((u)=>u.risk >= 35).sort((a,b)=>b.risk-a.risk), [users, examResults, assignments, assignmentSubmissions]);

  const visibleStudentsAtRisk = useMemo(() => studentsAtRisk.filter((u) => analyticsGradeFilter === 'all' || u.grade === analyticsGradeFilter), [studentsAtRisk, analyticsGradeFilter]);

  const exportAnalytics = () => excelDownload(`nahhas-students-risk-${new Date().toISOString().slice(0,10)}.xlsx`, [
    ['name','email','phone','grade','average','resultsCount','assignmentsSubmitted','risk'],
    ...visibleStudentsAtRisk.map((u)=>[u.name || u.displayName || '', u.email || '', u.phone || '', u.grade || '', u.avg, u.resultsCount, u.submitted, u.risk])
  ]);

  const sendRiskFollowUp = async () => {
    const targets = visibleStudentsAtRisk.slice(0, 100);
    if (!targets.length) return platformNotify('لا يوجد طلاب يحتاجون متابعة حسب الفلتر الحالي.');
    if (!platformConfirm(`إرسال تنبيه متابعة إلى ${targets.length} طالب؟`)) return;
    for (const u of targets) {
      await setDoc(doc(collection(db, 'student_messages')), {
        userId: u.id,
        title: 'خطة متابعة شخصية',
        body: 'لاحظنا أنك تحتاج مراجعة إضافية. افتح الدروس والواجبات المطلوبة اليوم لتحسين مستواك.',
        audience: 'student',
        read: false,
        createdAt: serverTimestamp(),
        createdBy: userData?.email || '',
      });
    }
    await writeLog('risk_followup_notifications_sent', 'إرسال تنبيهات للطلاب المتأخرين', { count: targets.length, grade: analyticsGradeFilter });
    platformNotify(`تم إرسال المتابعة إلى ${targets.length} طالب.`);
  };
  const exportPlan = () => excelDownload(`nahhas-growth-suite-${new Date().toISOString().slice(0,10)}.xlsx`, [
    ['module','status','mainMetric'],
    ['payments','working',`${payments.length} payment requests / ${plans.length} plans`],
    ['courses','working',`${units.length} course units / ${content.length} content items`],
    ['question_bank','working',`${questions.length} questions`],
    ['analytics','working',`${studentsAtRisk.length} at-risk students`],
    ['notifications','working',`${messages.length} sent messages`],
    ['mobile','working',JSON.stringify(mobileSettings)],
    ['support','working',`${supportTickets.length} tickets`],
  ]);

  const visiblePayments = payments.filter((p) => paymentFilter === 'all' || (p.status || 'pending') === paymentFilter);
  const paymentsPagination = usePagination(visiblePayments, { pageSize: 25 });

  const renderPayments = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="طلبات دفع معلقة" value={dashboardStats.pendingPayments}/><StatBox title="باقات مفعلة" value={plans.filter((p)=>p.active !== false).length}/><StatBox title="طلاب VIP" value={dashboardStats.premium}/><StatBox title="أكواد غير مستخدمة" value={subscriptionCodes.filter((c)=>!c.used&&!c.isUsed).length}/></div>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-5 gap-3">
      <input className="border rounded-xl p-3" placeholder="اسم الباقة" value={planDraft.title} onChange={(e)=>setPlanDraft({...planDraft,title:e.target.value})}/>
      <input className="border rounded-xl p-3" type="number" placeholder="السعر" value={planDraft.price} onChange={(e)=>setPlanDraft({...planDraft,price:e.target.value})}/>
      <input className="border rounded-xl p-3" type="number" placeholder="الأيام" value={planDraft.days} onChange={(e)=>setPlanDraft({...planDraft,days:e.target.value})}/>
      <input className="border rounded-xl p-3" placeholder="المميزات" value={planDraft.features} onChange={(e)=>setPlanDraft({...planDraft,features:e.target.value})}/>
      <button disabled={busy} onClick={savePlan} className="bg-emerald-700 text-white rounded-xl p-3 font-black">حفظ الباقة</button>
    </section>
    <section className="bg-white rounded-3xl border p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="font-black">الباقات الحالية</h3>
        <button onClick={notifyExpiringSubscriptions} className="bg-amber-100 text-amber-800 rounded-xl px-4 py-2 font-black">تنبيه قرب انتهاء الاشتراك</button>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {plans.map((plan)=><div key={plan.id} className="border rounded-2xl p-4 bg-slate-50">
          <div className="flex justify-between gap-2"><b>{plan.title}</b><span className={plan.active === false ? 'text-red-600 font-black' : 'text-emerald-700 font-black'}>{plan.active === false ? 'متوقفة' : 'مفعلة'}</span></div>
          <p className="text-sm text-slate-600 mt-2">{plan.price || 0} جنيه • {plan.days || 30} يوم</p>
          <p className="text-xs text-slate-500 mt-2">{Array.isArray(plan.features) ? plan.features.join('، ') : plan.features}</p>
          <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>togglePlan(plan)} className="bg-white border rounded-xl p-2 font-bold">{plan.active === false ? 'تفعيل' : 'إيقاف'}</button><button onClick={()=>deletePlan(plan)} className="bg-red-50 text-red-700 rounded-xl p-2 font-bold">حذف</button></div>
        </div>)}
        {!plans.length && <p className="text-slate-500 font-bold">لا توجد باقات بعد.</p>}
      </div>
    </section>
    <section className="bg-white rounded-3xl border p-5 overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3"><h3 className="font-black">طلبات الدفع</h3><div className="flex gap-2"><select className="border rounded-xl p-2" value={paymentFilter} onChange={(e)=>setPaymentFilter(e.target.value)}><option value="all">كل الطلبات</option><option value="pending">معلقة</option><option value="approved">مقبولة</option><option value="rejected">مرفوضة</option></select><button onClick={exportPayments} className="bg-slate-900 text-white rounded-xl px-4 py-2 font-black">تصدير Excel</button></div></div>
      {visiblePayments.length ? paymentsPagination.pageItems.map((p)=><div key={p.id} className="min-w-[760px] grid grid-cols-7 gap-2 border-b py-3 text-sm items-center"><b>{p.studentName || p.name || p.email || p.userId}</b><span>{p.amount || p.price || '—'} جنيه</span><span>{p.method || '—'}</span><span>{statusLabel(p.status)}</span><span>{toInputDate(p.createdAt) || '—'}</span><button disabled={p.status==='approved'} onClick={()=>decidePayment(p,'approved')} className="bg-emerald-600 disabled:bg-slate-200 text-white rounded-lg px-3 py-2 font-bold">قبول</button><button onClick={()=>decidePayment(p,'rejected')} className="bg-red-50 text-red-700 rounded-lg px-3 py-2 font-bold">رفض</button></div>) : <p className="text-slate-500 font-bold">لا توجد طلبات دفع حسب الفلتر.</p>}
      <PaginationBar page={paymentsPagination.page} totalPages={paymentsPagination.totalPages} totalItems={paymentsPagination.totalItems} pageSize={paymentsPagination.pageSize} onPageChange={paymentsPagination.setPage} label="طلبات الدفع" />
    </section>
  </div>;


  const renderCourses = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="وحدات منظمة" value={units.length}/><StatBox title="فيديوهات" value={content.filter((c)=>c.type==='video').length}/><StatBox title="ملفات وروابط" value={content.filter((c)=>['file','link','html','interactive_exam'].includes(c.type)).length}/><StatBox title="امتحانات مرتبطة" value={exams.length}/></div>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-6 gap-3">
      <input className="border rounded-xl p-3 md:col-span-2" placeholder="اسم الوحدة / الأسبوع" value={unitDraft.title} onChange={(e)=>setUnitDraft({...unitDraft,title:e.target.value})}/>
      <select className="border rounded-xl p-3" value={unitDraft.grade} onChange={(e)=>setUnitDraft({...unitDraft,grade:e.target.value})}><GradeOptions/></select>
      <input className="border rounded-xl p-3" type="number" placeholder="الأسبوع" value={unitDraft.week} onChange={(e)=>setUnitDraft({...unitDraft,week:e.target.value})}/>
      <input className="border rounded-xl p-3" type="date" value={unitDraft.publishAt} onChange={(e)=>setUnitDraft({...unitDraft,publishAt:e.target.value})}/>
      <button onClick={saveUnit} className="bg-blue-700 text-white rounded-xl p-3 font-black">حفظ الوحدة</button>
      <select className="border rounded-xl p-3 md:col-span-3" value={unitDraft.prerequisiteContentId} onChange={(e)=>setUnitDraft({...unitDraft,prerequisiteContentId:e.target.value})}><option value="">بدون شرط سابق</option>{content.map((c)=><option key={c.id} value={c.id}>{c.title}</option>)}</select>
      <select className="border rounded-xl p-3" value={unitDraft.status} onChange={(e)=>setUnitDraft({...unitDraft,status:e.target.value})}><option value="published">منشور</option><option value="draft">مسودة</option></select>
    </section>
    <section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">خريطة الكورس</h3>{units.length ? units.map((u)=><div key={u.id} className="grid md:grid-cols-5 gap-2 border-b py-3 text-sm"><b>{u.title}</b><span>{getGradeLabel(u.grade)}</span><span>الأسبوع {u.week}</span><span>{statusLabel(u.status)}</span><span>{u.publishAt || 'نشر فوري'}</span></div>) : <p className="text-slate-500 font-bold">ابدأ بإنشاء أول وحدة.</p>}</section>
  </div>;

  const renderQuestions = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="إجمالي الأسئلة" value={questions.length}/><StatBox title="نتائج الفلتر" value={filteredQuestions.length}/><StatBox title="نحو" value={questions.filter((q)=>q.branch==='النحو').length}/><StatBox title="صعبة" value={questions.filter((q)=>q.difficulty==='hard').length}/></div>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-4 gap-3">
      <textarea className="border rounded-xl p-3 md:col-span-2 min-h-28" placeholder="نص السؤال" value={questionDraft.text} onChange={(e)=>setQuestionDraft({...questionDraft,text:e.target.value})}/>
      <textarea className="border rounded-xl p-3 md:col-span-2 min-h-28" placeholder={'الاختيارات كل اختيار في سطر'} value={questionDraft.options} onChange={(e)=>setQuestionDraft({...questionDraft,options:e.target.value})}/>
      <select className="border rounded-xl p-3" value={questionDraft.grade} onChange={(e)=>setQuestionDraft({...questionDraft,grade:e.target.value})}><GradeOptions/></select>
      <select className="border rounded-xl p-3" value={questionDraft.branch} onChange={(e)=>setQuestionDraft({...questionDraft,branch:e.target.value})}><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option><option>عام</option></select>
      <input className="border rounded-xl p-3" placeholder="الدرس/الموضوع" value={questionDraft.topic} onChange={(e)=>setQuestionDraft({...questionDraft,topic:e.target.value})}/>
      <select className="border rounded-xl p-3" value={questionDraft.difficulty} onChange={(e)=>setQuestionDraft({...questionDraft,difficulty:e.target.value})}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
      <input className="border rounded-xl p-3" type="number" min="0" placeholder="رقم الإجابة الصحيحة يبدأ من 0" value={questionDraft.correctIdx} onChange={(e)=>setQuestionDraft({...questionDraft,correctIdx:e.target.value})}/>
      <input className="border rounded-xl p-3 md:col-span-2" placeholder="شرح الإجابة" value={questionDraft.explanation} onChange={(e)=>setQuestionDraft({...questionDraft,explanation:e.target.value})}/>
      <button onClick={saveQuestion} className="bg-purple-700 text-white rounded-xl p-3 font-black">إضافة السؤال</button>
    </section>
    <section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-2">استيراد CSV</h3><p className="text-xs text-slate-500 font-bold mb-3">الصيغة: text,grade,branch,topic,difficulty,option1|option2|option3,correctIdx,explanation</p><textarea className="w-full border rounded-2xl p-3 min-h-32" value={bulkQuestions} onChange={(e)=>setBulkQuestions(e.target.value)} /><button onClick={importQuestions} className="mt-3 bg-slate-900 text-white rounded-xl px-5 py-3 font-black">استيراد الأسئلة</button></section>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-6 gap-3">
      <h3 className="font-black md:col-span-6">توليد مسودة امتحان من بنك الأسئلة</h3>
      <input className="border rounded-xl p-3 md:col-span-2" placeholder="عنوان الامتحان" value={examDraft.title} onChange={(e)=>setExamDraft({...examDraft,title:e.target.value})}/>
      <select className="border rounded-xl p-3" value={examDraft.grade} onChange={(e)=>setExamDraft({...examDraft,grade:e.target.value})}><option value="all">كل المراحل</option><GradeOptions/></select>
      <select className="border rounded-xl p-3" value={examDraft.branch} onChange={(e)=>setExamDraft({...examDraft,branch:e.target.value})}><option value="all">كل الفروع</option><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option><option>عام</option></select>
      <select className="border rounded-xl p-3" value={examDraft.difficulty} onChange={(e)=>setExamDraft({...examDraft,difficulty:e.target.value})}><option value="all">كل الصعوبات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
      <input className="border rounded-xl p-3" type="number" min="1" placeholder="عدد الأسئلة" value={examDraft.count} onChange={(e)=>setExamDraft({...examDraft,count:e.target.value})}/>
      <input className="border rounded-xl p-3" type="number" min="5" placeholder="المدة بالدقائق" value={examDraft.durationMinutes} onChange={(e)=>setExamDraft({...examDraft,durationMinutes:e.target.value})}/>
      <button onClick={buildExamFromBank} className="bg-indigo-700 text-white rounded-xl p-3 font-black md:col-span-5">إنشاء مسودة الامتحان</button>
    </section>
    <section className="bg-white rounded-3xl border p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4"><h3 className="font-black">إدارة الأسئلة</h3><button onClick={exportQuestionBank} className="bg-slate-900 text-white rounded-xl px-4 py-2 font-black">تصدير Excel</button></div>
      <div className="grid md:grid-cols-5 gap-3 mb-4"><input className="border rounded-xl p-3 md:col-span-2" placeholder="بحث في السؤال/الشرح" value={questionFilter.search} onChange={(e)=>setQuestionFilter({...questionFilter,search:e.target.value})}/><select className="border rounded-xl p-3" value={questionFilter.grade} onChange={(e)=>setQuestionFilter({...questionFilter,grade:e.target.value})}><option value="all">كل المراحل</option><GradeOptions/></select><select className="border rounded-xl p-3" value={questionFilter.branch} onChange={(e)=>setQuestionFilter({...questionFilter,branch:e.target.value})}><option value="all">كل الفروع</option><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option><option>عام</option></select><select className="border rounded-xl p-3" value={questionFilter.difficulty} onChange={(e)=>setQuestionFilter({...questionFilter,difficulty:e.target.value})}><option value="all">كل الصعوبات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div>
      {questionsPagination.pageItems.map((q)=><div key={q.id} className="border-b py-3 text-sm"><div className="flex justify-between gap-3"><b>{q.text}</b><button onClick={()=>deleteQuestion(q)} className="text-red-700 bg-red-50 rounded-lg px-3 py-1 font-bold">حذف</button></div><p className="text-xs text-slate-500 mt-1">{getGradeLabel(q.grade)} • {q.branch} • {q.topic} • {statusLabel(q.difficulty)}</p></div>)}
      {!filteredQuestions.length && <p className="text-slate-500 font-bold">لا توجد أسئلة مطابقة.</p>}
      <PaginationBar page={questionsPagination.page} totalPages={questionsPagination.totalPages} totalItems={questionsPagination.totalItems} pageSize={questionsPagination.pageSize} onPageChange={questionsPagination.setPage} label="بنك الأسئلة" />
    </section>
  </div>;


  const renderAnalytics = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="طلاب يحتاجون متابعة" value={visibleStudentsAtRisk.length}/><StatBox title="متوسط الامتحانات" value={`${dashboardStats.avg}%`}/><StatBox title="تسليمات واجب" value={assignmentSubmissions.length}/><StatBox title="نتائج مكتملة" value={examResults.filter((r)=>r.status==='completed').length}/></div>
    <div className="bg-white rounded-3xl border p-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <select className="border rounded-xl p-3" value={analyticsGradeFilter} onChange={(e)=>setAnalyticsGradeFilter(e.target.value)}><option value="all">كل المراحل</option><GradeOptions/></select>
      <div className="flex flex-wrap gap-2"><button onClick={sendRiskFollowUp} className="bg-amber-600 text-white rounded-xl px-5 py-3 font-black">إرسال تنبيه متابعة</button><button onClick={exportAnalytics} className="bg-indigo-700 text-white rounded-xl px-5 py-3 font-black">تصدير Excel</button></div>
    </div>
    <section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">أولوية المتابعة</h3>{visibleStudentsAtRisk.slice(0,50).map((u)=><div key={u.id || u.uid || u.email} className="grid md:grid-cols-6 gap-2 border-b py-3 text-sm"><b>{u.name || u.email}</b><span>{getGradeLabel(u.grade)}</span><span>متوسط {u.avg}%</span><span>{u.resultsCount} امتحان</span><span>{u.submitted} واجب</span><span className="font-black text-red-700">خطر {u.risk}%</span></div>)}{!visibleStudentsAtRisk.length && <p className="text-slate-500 font-bold">لا يوجد طلاب يحتاجون متابعة حسب الفلتر.</p>}</section>
  </div>;


  const renderNotifications = () => {
    const recipientCount = messageDraft.audience === 'all'
      ? users.length
      : messageDraft.audience === 'grade'
        ? users.filter((u)=>messageDraft.grade === 'all' || u.grade === messageDraft.grade).length
        : messageDraft.userIdsText.split(/[\n,]+/).map((x)=>x.trim()).filter(Boolean).length;
    return <div className="space-y-5"><section className="bg-white rounded-3xl border p-5 grid md:grid-cols-4 gap-3"><input className="border rounded-xl p-3 md:col-span-2" placeholder="عنوان التنبيه" value={messageDraft.title} onChange={(e)=>setMessageDraft({...messageDraft,title:e.target.value})}/><select className="border rounded-xl p-3" value={messageDraft.audience} onChange={(e)=>setMessageDraft({...messageDraft,audience:e.target.value})}><option value="all">كل الطلاب</option><option value="grade">مرحلة محددة</option><option value="selected">طلاب محددين</option></select><select className="border rounded-xl p-3" value={messageDraft.grade} onChange={(e)=>setMessageDraft({...messageDraft,grade:e.target.value})}><option value="all">كل المراحل</option><GradeOptions/></select><textarea className="border rounded-xl p-3 md:col-span-2 min-h-28" placeholder="نص التنبيه" value={messageDraft.body} onChange={(e)=>setMessageDraft({...messageDraft,body:e.target.value})}/><textarea className="border rounded-xl p-3 min-h-28" placeholder="IDs الطلاب لو التنبيه محدد" value={messageDraft.userIdsText} onChange={(e)=>setMessageDraft({...messageDraft,userIdsText:e.target.value})}/><div className="space-y-2"><input type="datetime-local" className="border rounded-xl p-3 w-full" value={messageDraft.scheduledAt} onChange={(e)=>setMessageDraft({...messageDraft,scheduledAt:e.target.value})}/><p className="text-xs font-black text-slate-500">عدد المستلمين المتوقع: {recipientCount}</p></div><button onClick={sendMessage} className="bg-amber-600 text-white rounded-xl p-3 font-black">إرسال التنبيه</button></section><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">آخر التنبيهات</h3>{messages.slice(0,30).map((m)=><div key={m.id} className="border-b py-3"><b>{m.title}</b><p className="text-sm text-slate-600">{m.body}</p><p className="text-xs text-slate-400">{statusLabel(m.audience)} • {m.grade || 'all'} {m.scheduledAt ? `• مجدول: ${m.scheduledAt}` : ''}</p></div>)}</section></div>;
  };


  const renderMobile = () => <div className="space-y-5"><section className="bg-white rounded-3xl border p-5 grid md:grid-cols-2 gap-3">{Object.keys(mobileSettings).filter((k)=>typeof mobileSettings[k] === 'boolean').map((k)=><label key={k} className="bg-slate-50 rounded-2xl p-4 font-black flex gap-2"><input type="checkbox" checked={!!mobileSettings[k]} onChange={(e)=>setMobileSettings({...mobileSettings,[k]:e.target.checked})}/>{({bottomNav:'شريط تنقل سفلي',compactCards:'كروت مختصرة',dataSaver:'وضع توفير بيانات',examSafeMode:'وضع امتحان آمن للموبايل',showInstallPrompt:'إظهار زر تثبيت التطبيق'}[k] || k)}</label>)}<button onClick={saveMobileSettings} className="bg-slate-900 text-white rounded-xl p-3 font-black md:col-span-2">حفظ إعدادات الموبايل</button></section><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">Checklist الموبايل</h3>{['Dashboard مختصر', 'أزرار كبيرة', 'إخفاء الزحام أثناء الامتحان', 'تقليل تحميل PDF والفيديو عند الحاجة', 'زر تثبيت التطبيق'].map((x)=><div key={x} className="border-b py-3 font-bold">✅ {x}</div>)}</section></div>;

  const renderSupport = () => <div className="space-y-5"><div className="grid md:grid-cols-3 gap-3"><StatBox title="تذاكر مفتوحة" value={dashboardStats.openTickets}/><StatBox title="كل التذاكر" value={supportTickets.length}/><StatBox title="تم الرد" value={supportTickets.filter((t)=>t.status==='replied').length}/></div><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">تذاكر الطلاب</h3>{supportTickets.length ? supportTickets.map((t)=><div key={t.id} className="border rounded-2xl p-4 mb-3"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"><div><b>{t.studentName || t.studentEmail || t.id}</b><p className="text-sm text-slate-600">{t.lastMessage || t.lastReply || '—'}</p><p className="text-xs text-slate-400">{t.category || 'عام'} • {statusLabel(t.status || 'open')}</p></div><button onClick={()=>closeTicket(t)} className="bg-slate-100 text-slate-700 rounded-xl px-3 py-2 font-bold">إغلاق</button></div><div className="grid md:grid-cols-[1fr_auto] gap-2 mt-3"><input className="border rounded-xl p-3" placeholder="رد الإدارة" value={replyDrafts[t.id] || ''} onChange={(e)=>setReplyDrafts({...replyDrafts,[t.id]:e.target.value})}/><button onClick={()=>replyTicket(t)} className="bg-sky-700 text-white rounded-xl px-5 py-3 font-black">رد</button></div></div>) : <p className="text-slate-500 font-bold">لا توجد تذاكر بعد.</p>}</section></div>;

  const renderActive = () => ({ payments: renderPayments, courses: renderCourses, questions: renderQuestions, analytics: renderAnalytics, notifications: renderNotifications, mobile: renderMobile, support: renderSupport }[tab] || renderPayments)();

  return (
    <div className="space-y-6" dir="rtl">
      {!compact && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div><h2 className="text-2xl md:text-3xl font-black">مركز التشغيل الشامل</h2><p className="text-slate-300 font-bold mt-2">الـ 7 أفكار هنا شغالة كأدوات فعلية: إنشاء، تعديل حالة، إرسال، استيراد، تصدير، وردود دعم.</p></div>
            <button onClick={exportPlan} className="bg-amber-500 text-slate-950 rounded-2xl px-5 py-3 font-black hover:bg-amber-400">تصدير ملخص التشغيل Excel</button>
          </div>
        </div>
      )}
      {!compact && <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">{growthTabs.map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`rounded-2xl border p-3 text-sm font-black transition ${tab===key?'bg-amber-500 text-slate-950 border-amber-500 shadow':'bg-white text-slate-700 hover:bg-amber-50'}`}>{label}</button>)}</div>}
      {!compact && <div className="grid grid-cols-2 lg:grid-cols-7 gap-3"><StatBox title="نشطون" value={dashboardStats.active}/><StatBox title="VIP" value={dashboardStats.premium}/><StatBox title="دفع معلق" value={dashboardStats.pendingPayments}/><StatBox title="أسئلة" value={dashboardStats.questionCount}/><StatBox title="وحدات" value={dashboardStats.units}/><StatBox title="تذاكر" value={dashboardStats.openTickets}/><StatBox title="متوسط" value={`${dashboardStats.avg}%`}/></div>}
      {renderActive()}
    </div>
  );
}

function StatBox({ title, value }) {
  return <div className="rounded-3xl border bg-white p-4 shadow-sm"><p className="text-xs font-black text-slate-500 mb-1">{title}</p><p className="text-2xl font-black text-slate-900">{value}</p></div>;
}
