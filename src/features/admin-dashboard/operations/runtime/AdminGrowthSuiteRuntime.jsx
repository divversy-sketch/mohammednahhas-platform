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
import { StatBox } from '../components/StatBox.jsx';
import { GrowthSuiteHeader } from '../components/GrowthSuiteHeader.jsx';
import { GrowthSuiteTabs } from '../components/GrowthSuiteTabs.jsx';
import { GrowthSuiteStatsGrid } from '../components/GrowthSuiteStatsGrid.jsx';
import { MobileSettingsPanel } from '../components/MobileSettingsPanel.jsx';
import { SupportTicketsPanel } from '../components/SupportTicketsPanel.jsx';
import { AdminGrowthSuiteRuntimeView } from '../views/AdminGrowthSuiteView.jsx';

const growthTabs = [
  ['payments', 'المدفوعات والاشتراكات'],
  ['courses', 'المحتوى والكورسات'],
  ['questions', 'بنك الأسئلة'],
  ['analytics', 'التقارير والتحليلات'],
  ['notifications', 'الإشعارات والتنبيهات'],
  ['mobile', 'تجربة الموبايل'],
  ['support', 'الدعم والرسائل'],
];

const statusLabel = (status) => ({
  pending: 'معلق',
  approved: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  open: 'مفتوحة',
  replied: 'تم الرد',
  closed: 'مغلقة',
  published: 'منشور',
  draft: 'مسودة',
  medium: 'متوسط',
  easy: 'سهل',
  hard: 'صعب',
  all: 'الكل',
}[(status || '').toString()] || status || '—');

const toInputDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '';
};

const parseCsvLine = (line = '') => {
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

  return <AdminGrowthSuiteRuntimeView ctx={{compact, tab, setTab, growthTabs, exportPlan, dashboardStats,
        plans, subscriptionCodes, planDraft, setPlanDraft, busy, savePlan,
        notifyExpiringSubscriptions, togglePlan, deletePlan, paymentFilter,
        setPaymentFilter, exportPayments, visiblePayments, paymentsPagination,
        statusLabel, toInputDate, decidePayment, units, content, exams, unitDraft,
        setUnitDraft, saveUnit, questions, filteredQuestions, questionDraft,
        setQuestionDraft, bulkQuestions, setBulkQuestions, importQuestions,
        examDraft, setExamDraft, buildExamFromBank, exportQuestionBank,
        questionFilter, setQuestionFilter, questionsPagination, deleteQuestion,
        visibleStudentsAtRisk, assignmentSubmissions, examResults,
        analyticsGradeFilter, setAnalyticsGradeFilter, sendRiskFollowUp,
        exportAnalytics, messageDraft, setMessageDraft, users, sendMessage,
        messages, mobileSettings, setMobileSettings, saveMobileSettings,
        supportTickets, replyDrafts, setReplyDrafts, replyTicket, closeTicket
      }} />;
}

