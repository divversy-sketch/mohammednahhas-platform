import React from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { COLLECTIONS } from '../../config/collections.js';
import { AlertTriangle, Bell, CreditCard, FileCheck, MessageCircle, ShieldAlert, TrendingDown, Users } from '../../shared/icons/lucide-shim.jsx';
import { getGradeLabel } from '../../shared/constants/grades';

const toDate = (value) => value?.toDate ? value.toDate() : (value ? new Date(value) : null);
const daysUntil = (value) => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
};

function Card({ icon, title, value, note, tone = 'slate', onClick }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    purple: 'border-purple-200 bg-purple-50 text-purple-900',
  };
  return (
    <button type="button" onClick={onClick} className={`text-right rounded-3xl border p-4 shadow-sm hover:shadow-md transition ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black opacity-70">{title}</p>
          <p className="text-3xl font-black mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-2xl bg-white/70">{icon}</div>
      </div>
      {note && <p className="text-xs font-bold opacity-70 mt-2 leading-5">{note}</p>}
    </button>
  );
}

export default function AdminCommandCenter({ users = [], exams = [], examResults = [], paymentRequests = [], supportTickets = [], systemErrors = [], onNavigate }) {
  const [livePayments, setLivePayments] = React.useState(paymentRequests);
  const [liveTickets, setLiveTickets] = React.useState(supportTickets);
  const [liveErrors, setLiveErrors] = React.useState(systemErrors);

  React.useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, COLLECTIONS.PAYMENT_REQUESTS), orderBy('createdAt', 'desc'), limit(80)), (snap) => setLivePayments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setLivePayments(paymentRequests)),
      onSnapshot(query(collection(db, COLLECTIONS.STUDENT_MESSAGES), orderBy('createdAt', 'desc'), limit(80)), (snap) => setLiveTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => r.kind === 'support' || r.type === 'support' || r.category)), () => setLiveTickets(supportTickets)),
      onSnapshot(query(collection(db, COLLECTIONS.SYSTEM_ERRORS), orderBy('createdAt', 'desc'), limit(80)), (snap) => setLiveErrors(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setLiveErrors(systemErrors)),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, []);

  const pendingPayments = livePayments.filter((r) => (r.status || 'pending') === 'pending');
  const openTickets = liveTickets.filter((m) => ['open', 'pending', 'new'].includes(m.status || 'open'));
  const expiring = users.filter((u) => u.subscriptionStatus === 'premium' && (daysUntil(u.subscriptionExpiry) ?? 99) <= 7 && (daysUntil(u.subscriptionExpiry) ?? -99) >= 0);
  const inactive = users.filter((u) => {
    const last = toDate(u.lastLoginAt || u.lastSeenAt || u.updatedAt);
    return !last || ((Date.now() - last.getTime()) / 86400000) >= 10;
  });
  const held = examResults.filter((r) => ['security_hold', 'cheated', 'in_progress'].includes(r.status)).length;
  const recentErrors = liveErrors.filter((e) => {
    const date = toDate(e.createdAt);
    return !date || Date.now() - date.getTime() <= 7 * 86400000;
  });
  const lowScores = examResults.filter((r) => r.status === 'completed' && Number(r.percentage || 0) < 50).length;

  const topExpiring = expiring.slice(0, 4).map((u) => `${u.name || u.email || u.id} (${getGradeLabel(u.grade)} - ${daysUntil(u.subscriptionExpiry)} يوم)`).join('، ');

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 md:p-6 shadow-sm" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><ShieldAlert className="text-blue-600"/> مركز متابعة اليوم</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">ملخص تنفيذي يجمع المطلوب من الأقسام الموجودة بدون إضافة تبويبات جديدة.</p>
        </div>
        <span className="text-xs font-black bg-white border border-slate-200 rounded-full px-3 py-2 text-slate-500">آخر تحديث من بيانات اللوحة الحالية</span>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <Card tone="amber" title="طلبات دفع معلقة" value={pendingPayments.length} note="اضغط للذهاب إلى الاشتراكات والدفع" icon={<CreditCard size={24}/>} onClick={() => onNavigate?.('payments')} />
        <Card tone="red" title="اشتراكات قرب الانتهاء" value={expiring.length} note={topExpiring || 'لا يوجد خطر قريب'} icon={<Bell size={24}/>} onClick={() => onNavigate?.('payments')} />
        <Card tone="purple" title="تذاكر دعم مفتوحة" value={openTickets.length} note="تدار من رسائل الطلاب" icon={<MessageCircle size={24}/>} onClick={() => onNavigate?.('messages_center')} />
        <Card tone="blue" title="محاولات امتحان تحتاج متابعة" value={held} note="أمن الامتحانات والنتائج" icon={<FileCheck size={24}/>} onClick={() => onNavigate?.('exams')} />
        <Card tone="red" title="أخطاء نظام آخر 7 أيام" value={recentErrors.length} note="تظهر داخل إعدادات المنصة وسجل الأمان" icon={<AlertTriangle size={24}/>} onClick={() => onNavigate?.('platform_settings')} />
        <Card tone="amber" title="طلاب غير نشطين" value={inactive.length} note="متابعة تعليمية وتسويقية" icon={<Users size={24}/>} onClick={() => onNavigate?.('student_reports')} />
        <Card tone="red" title="نتائج أقل من 50%" value={lowScores} note="تحتاج مراجعة تعليمية" icon={<TrendingDown size={24}/>} onClick={() => onNavigate?.('student_reports')} />
        <Card tone="emerald" title="إجمالي الامتحانات" value={exams.length} note="مؤشر جاهزية المحتوى" icon={<FileCheck size={24}/>} onClick={() => onNavigate?.('exams')} />
      </div>
    </section>
  );
}
