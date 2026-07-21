import { useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '@services/firebase';
import { normalizeEgyptPhone } from '@shared/utils/phone';

const monthKey = () => new Date().toISOString().slice(0, 7);
const dateText = (value) => {
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleString('ar-EG');
  } catch { return '—'; }
};
const money = (value) => new Intl.NumberFormat('ar-EG').format(Number(value || 0));
const randomCode = () => String(Math.floor(100000 + Math.random() * 900000));
const whatsappPhone = (value) => {
  const phone = normalizeEgyptPhone(value || '').replace(/^0/, '20');
  return phone.startsWith('20') ? phone : `20${phone}`;
};

function useLiveCollection(name) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const q = query(collection(db, name), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
  }, [name]);
  return items;
}

export default function ParentEngagementPanel({ users = [], adminProfile = {} }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [saving, setSaving] = useState(false);

  const reports = useLiveCollection('parent_reports');
  const attendance = useLiveCollection('center_attendance');
  const payments = useLiveCollection('center_payments');
  const messages = useLiveCollection('parent_message_log');

  const students = useMemo(() => users.filter((user) => user?.role !== 'admin'), [users]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students.slice(0, 20);
    return students.filter((student) => [student.name, student.email, student.phone, student.parentPhone, student.grade]
      .filter(Boolean).join(' ').toLowerCase().includes(term)).slice(0, 40);
  }, [students, search]);
  const student = students.find((item) => (item.id || item.uid) === selectedId);
  const studentId = student?.id || student?.uid || '';

  const summary = useMemo(() => {
    const att = attendance.filter((item) => item.studentId === studentId && String(item.sessionDate || '').startsWith(monthKey()));
    const pay = payments.filter((item) => item.studentId === studentId && item.month === monthKey());
    return {
      present: att.filter((item) => item.status === 'present').length,
      absent: att.filter((item) => item.status === 'absent').length,
      late: att.filter((item) => item.status === 'late').length,
      homeworkDone: att.filter((item) => item.homeworkState === 'done').length,
      paid: pay.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [attendance, payments, studentId]);

  const buildMonthlyMessage = () => {
    if (!student) return;
    setMessage(`تقرير متابعة الطالب/ة: ${student.name || ''}\nالشهر: ${monthKey()}\nالحضور: ${summary.present}\nالغياب: ${summary.absent}\nالتأخير: ${summary.late}\nالواجبات المكتملة: ${summary.homeworkDone}\nإجمالي المدفوعات: ${money(summary.paid)} جنيه\n\nمع تحيات منصة النحاس.`);
  };

  const createAccessCode = async () => {
    if (!student || !student.parentPhone) return window.alert('رقم ولي الأمر غير مسجل لهذا الطالب.');
    const code = randomCode();
    await setDoc(doc(db, 'parent_access_codes', studentId), {
      studentId,
      studentName: student.name || '',
      parentPhone: student.parentPhone || '',
      code,
      active: true,
      updatedAt: serverTimestamp(),
      createdBy: adminProfile.uid || '',
      createdAt: serverTimestamp(),
    }, { merge: true });
    setMessage(`كود متابعة ولي أمر الطالب/ة ${student.name || ''}: ${code}\nاحتفظ بالكود ولا تشاركه إلا مع ولي الأمر.`);
  };

  const queueMessage = async () => {
    if (!student || !message.trim()) return window.alert('اختر الطالب واكتب الرسالة أولًا.');
    setSaving(true);
    try {
      await addDoc(collection(db, 'parent_message_log'), {
        studentId,
        studentName: student.name || '',
        parentPhone: student.parentPhone || '',
        channel,
        message: message.trim(),
        status: channel === 'whatsapp' ? 'ready' : 'queued',
        createdBy: adminProfile.uid || '',
        createdByName: adminProfile.name || adminProfile.email || 'الإدارة',
        createdAt: serverTimestamp(),
      });
      if (channel === 'whatsapp') {
        const phone = whatsappPhone(student.parentPhone || '');
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`, '_blank', 'noopener,noreferrer');
      }
    } finally { setSaving(false); }
  };

  const markSent = async (item) => {
    await updateDoc(doc(db, 'parent_message_log', item.id), { status: 'sent', sentAt: serverTimestamp() });
  };

  const pendingReports = reports.filter((item) => item.status !== 'sent').length;
  const sentMessages = messages.filter((item) => item.status === 'sent').length;

  return (
    <section className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-sky-200 bg-gradient-to-l from-sky-50 via-white to-amber-50 p-6 shadow-sm">
        <p className="text-sm font-black text-sky-700">بوابة ولي الأمر</p>
        <h2 className="text-3xl font-black text-slate-950">التقارير والرسائل والمتابعة</h2>
        <p className="mt-2 font-bold text-slate-500">إنشاء كود متابعة، تجهيز تقرير شهري، وإرسال رسالة لولي الأمر مع سجل محفوظ على السيرفر.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4"><span className="font-black text-slate-500">تقارير بانتظار الإرسال</span><strong className="mt-2 block text-3xl">{pendingReports}</strong></div>
        <div className="rounded-2xl border bg-white p-4"><span className="font-black text-slate-500">رسائل تم إرسالها</span><strong className="mt-2 block text-3xl">{sentMessages}</strong></div>
        <div className="rounded-2xl border bg-white p-4"><span className="font-black text-slate-500">أولياء أمور مسجلون</span><strong className="mt-2 block text-3xl">{students.filter((item) => item.parentPhone).length}</strong></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">اختيار الطالب</h3>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اسم الطالب أو رقم الهاتف" className="mt-4 w-full rounded-2xl border p-3 font-bold" />
          <div className="mt-3 max-h-[560px] space-y-2 overflow-auto">
            {filtered.map((item) => { const id = item.id || item.uid; return <button key={id} onClick={() => setSelectedId(id)} className={`w-full rounded-2xl border p-3 text-right ${selectedId === id ? 'border-sky-400 bg-sky-50' : 'hover:bg-slate-50'}`}><strong className="block">{item.name || item.email}</strong><span className="text-xs font-bold text-slate-500">ولي الأمر: {item.parentPhone || 'غير مسجل'}</span></button>; })}
          </div>
        </aside>

        <main className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm">
          {!student ? <div className="py-24 text-center font-black text-slate-400">اختر طالبًا لفتح أدوات ولي الأمر.</div> : <>
            <div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm font-black text-amber-300">الطالب المحدد</p><h3 className="text-2xl font-black">{student.name || student.email}</h3><p className="mt-1 text-sm font-bold text-slate-300">رقم ولي الأمر: {student.parentPhone || 'غير مسجل'}</p></div>
            <div className="grid gap-3 md:grid-cols-5">{[['حضور', summary.present], ['غياب', summary.absent], ['تأخير', summary.late], ['واجب مكتمل', summary.homeworkDone], ['مدفوع', `${money(summary.paid)} ج`]].map(([label, value]) => <div key={label} className="rounded-2xl border bg-slate-50 p-3 text-center"><span className="text-xs font-black text-slate-500">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>)}</div>
            <div className="flex flex-wrap gap-2"><button onClick={buildMonthlyMessage} className="rounded-xl bg-amber-500 px-5 py-3 font-black">إنشاء التقرير الشهري</button><button onClick={createAccessCode} className="rounded-xl bg-sky-600 px-5 py-3 font-black text-white">إنشاء كود ولي الأمر</button></div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={9} placeholder="اكتب الرسالة أو أنشئ تقريرًا تلقائيًا" className="w-full rounded-2xl border p-4 font-bold" />
            <div className="grid gap-3 md:grid-cols-[220px_1fr]"><select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-2xl border p-4 font-bold"><option value="whatsapp">واتساب</option><option value="telegram">تليجرام - قائمة إرسال</option><option value="in_app">إشعار داخل المنصة</option></select><button disabled={saving} onClick={queueMessage} className="rounded-2xl bg-emerald-600 p-4 font-black text-white">حفظ الرسالة وفتح قناة الإرسال</button></div>
          </>}
        </main>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black">سجل رسائل أولياء الأمور</h3>
        <div className="mt-4 space-y-3">{messages.slice(0, 30).map((item) => <div key={item.id} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_170px_130px_auto]"><div><strong>{item.studentName || 'طالب'}</strong><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.message}</p></div><span className="text-sm font-bold">{item.channel}</span><span className="text-sm font-bold">{dateText(item.createdAt)}</span><button disabled={item.status === 'sent'} onClick={() => markSent(item)} className="rounded-xl bg-slate-950 px-4 py-2 font-black text-white disabled:bg-emerald-100 disabled:text-emerald-700">{item.status === 'sent' ? 'تم الإرسال' : 'تأكيد الإرسال'}</button></div>)}</div>
      </div>
    </section>
  );
}
