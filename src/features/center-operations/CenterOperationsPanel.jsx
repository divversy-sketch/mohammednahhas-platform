import { useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { db } from '@services/firebase';
import { normalizeEgyptPhone } from '@shared/utils/phone';

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const money = (value) => new Intl.NumberFormat('ar-EG').format(Number(value || 0));

const StatusPill = ({ tone = 'slate', children }) => {
  const tones = { emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200', slate: 'bg-slate-50 text-slate-700 border-slate-200' };
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone] || tones.slate}`}>{children}</span>;
};

function useCollection(name, orderField = 'createdAt') {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const q = query(collection(db, name), orderBy(orderField, 'desc'));
    return onSnapshot(q, (snapshot) => setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))));
  }, [name, orderField]);
  return items;
}

export default function CenterOperationsPanel({ users = [], adminProfile = {} }) {
  const [tab, setTab] = useState('attendance');
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [groupName, setGroupName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [homeworkState, setHomeworkState] = useState('done');
  const [saving, setSaving] = useState(false);

  const attendance = useCollection('center_attendance');
  const payments = useCollection('center_payments');
  const reports = useCollection('parent_reports');

  const students = useMemo(() => users.filter((user) => user?.role !== 'admin'), [users]);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredStudents = useMemo(() => {
    if (!normalizedSearch) return students.slice(0, 12);
    return students.filter((student) => {
      const haystack = [student.name, student.email, student.phone, student.parentPhone, student.grade]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(normalizedSearch) || normalizeEgyptPhone(student.phone || '').includes(normalizeEgyptPhone(search));
    }).slice(0, 30);
  }, [students, normalizedSearch, search]);

  const selectedStudent = students.find((student) => student.id === selectedStudentId || student.uid === selectedStudentId);
  const studentId = selectedStudent?.id || selectedStudent?.uid || '';

  const markAttendance = async (status) => {
    if (!selectedStudent || !sessionTitle.trim()) return window.alert('اختر الطالب واكتب اسم الحصة أولًا.');
    setSaving(true);
    try {
      const id = `${todayKey()}_${studentId}_${sessionTitle.trim().replace(/\s+/g, '_')}`;
      await setDoc(doc(db, 'center_attendance', id), {
        studentId,
        studentName: selectedStudent.name || selectedStudent.email || 'طالب',
        phone: selectedStudent.phone || '',
        parentPhone: selectedStudent.parentPhone || '',
        grade: selectedStudent.grade || '',
        groupName: groupName.trim(),
        sessionTitle: sessionTitle.trim(),
        sessionDate: todayKey(),
        status,
        homeworkState,
        recordedBy: adminProfile?.uid || '',
        recordedByName: adminProfile?.name || adminProfile?.email || 'الإدارة',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    } finally { setSaving(false); }
  };

  const recordPayment = async () => {
    if (!selectedStudent || Number(paymentAmount) <= 0) return window.alert('اختر الطالب واكتب قيمة صحيحة.');
    setSaving(true);
    try {
      await addDoc(collection(db, 'center_payments'), {
        studentId,
        studentName: selectedStudent.name || selectedStudent.email || 'طالب',
        phone: selectedStudent.phone || '',
        parentPhone: selectedStudent.parentPhone || '',
        amount: Number(paymentAmount),
        method: paymentMethod,
        month: monthKey(),
        status: 'paid',
        recordedBy: adminProfile?.uid || '',
        recordedByName: adminProfile?.name || adminProfile?.email || 'الإدارة',
        createdAt: serverTimestamp(),
      });
      setPaymentAmount('');
    } finally { setSaving(false); }
  };

  const createParentReport = async () => {
    if (!selectedStudent) return window.alert('اختر الطالب أولًا.');
    const studentAttendance = attendance.filter((item) => item.studentId === studentId && String(item.sessionDate || '').startsWith(monthKey()));
    const studentPayments = payments.filter((item) => item.studentId === studentId && item.month === monthKey());
    const present = studentAttendance.filter((item) => item.status === 'present').length;
    const absent = studentAttendance.filter((item) => item.status === 'absent').length;
    const homeworkDone = studentAttendance.filter((item) => item.homeworkState === 'done').length;
    const paid = studentPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const message = `تقرير متابعة الطالب/ة: ${selectedStudent.name || ''}\nالشهر: ${monthKey()}\nالحضور: ${present}\nالغياب: ${absent}\nالواجبات المكتملة: ${homeworkDone}\nإجمالي المدفوعات: ${money(paid)} جنيه\n\nمع تحيات منصة النحاس.`;
    await addDoc(collection(db, 'parent_reports'), {
      studentId,
      studentName: selectedStudent.name || '',
      parentPhone: selectedStudent.parentPhone || '',
      month: monthKey(),
      present,
      absent,
      homeworkDone,
      paid,
      message,
      status: 'draft',
      createdBy: adminProfile?.uid || '',
      createdAt: serverTimestamp(),
    });
    await navigator.clipboard?.writeText(message);
    window.alert('تم إنشاء التقرير ونسخ الرسالة للحافظة.');
  };

  const stats = useMemo(() => ({
    presentToday: attendance.filter((item) => item.sessionDate === todayKey() && item.status === 'present').length,
    absentToday: attendance.filter((item) => item.sessionDate === todayKey() && item.status === 'absent').length,
    paidMonth: payments.filter((item) => item.month === monthKey()).reduce((sum, item) => sum + Number(item.amount || 0), 0),
    reportsMonth: reports.filter((item) => item.month === monthKey()).length,
  }), [attendance, payments, reports]);

  const tabs = [
    ['attendance', 'الحضور والحصة'],
    ['payments', 'المدفوعات'],
    ['parents', 'تقارير ولي الأمر'],
  ];

  return (
    <section className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-sky-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-black text-amber-700">تشغيل السنتر</p><h2 className="text-3xl font-black text-slate-950">الحضور والدفع وولي الأمر</h2><p className="mt-2 font-bold text-slate-500">شاشة واحدة لتسجيل الحصة والواجب والمدفوعات وتجهيز تقرير ولي الأمر.</p></div>
          <StatusPill tone="emerald">حفظ مباشر على السيرفر</StatusPill>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[['حضور اليوم', stats.presentToday], ['غياب اليوم', stats.absentToday], ['مدفوعات الشهر', `${money(stats.paidMonth)} ج`], ['تقارير الشهر', stats.reportsMonth]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-sm font-black text-slate-500">{label}</p><strong className="mt-2 block text-2xl font-black text-slate-950">{value}</strong></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2">
        {tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`rounded-xl px-5 py-3 font-black ${tab === key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{label}</button>)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">اختيار الطالب</h3>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="الاسم أو الهاتف أو الصف" className="mt-4 w-full rounded-2xl border p-3 font-bold outline-none focus:border-amber-400" />
          <div className="mt-3 max-h-[520px] space-y-2 overflow-auto">
            {filteredStudents.map((student) => {
              const id = student.id || student.uid;
              return <button key={id} onClick={() => setSelectedStudentId(id)} className={`w-full rounded-2xl border p-3 text-right ${studentId === id ? 'border-amber-400 bg-amber-50' : 'hover:bg-slate-50'}`}><strong className="block text-slate-900">{student.name || student.email}</strong><span className="text-xs font-bold text-slate-500">{student.phone || 'بدون هاتف'} · {student.grade || 'بدون صف'}</span></button>;
            })}
          </div>
        </aside>

        <main className="rounded-3xl border bg-white p-6 shadow-sm">
          {!selectedStudent ? <div className="py-24 text-center font-black text-slate-400">اختر طالبًا لبدء التسجيل.</div> : (
            <>
              <div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm font-black text-amber-300">الطالب المحدد</p><h3 className="text-2xl font-black">{selectedStudent.name || selectedStudent.email}</h3><p className="mt-1 text-sm font-bold text-slate-300">{selectedStudent.phone || 'بدون هاتف'} · ولي الأمر: {selectedStudent.parentPhone || 'غير مسجل'}</p></div>

              {tab === 'attendance' && <div className="mt-6 space-y-4">
                <div className="grid gap-3 md:grid-cols-2"><input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="اسم الحصة" className="rounded-2xl border p-4 font-bold" /><input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="اسم المجموعة" className="rounded-2xl border p-4 font-bold" /></div>
                <label className="block font-black">حالة الواجب<select value={homeworkState} onChange={(e) => setHomeworkState(e.target.value)} className="mt-2 w-full rounded-2xl border p-4"><option value="done">تم الحل</option><option value="partial">ناقص</option><option value="missing">لم يحل</option><option value="not_required">لا يوجد واجب</option></select></label>
                <div className="grid gap-3 md:grid-cols-3"><button disabled={saving} onClick={() => markAttendance('present')} className="rounded-2xl bg-emerald-500 p-4 font-black text-white">حاضر</button><button disabled={saving} onClick={() => markAttendance('late')} className="rounded-2xl bg-amber-500 p-4 font-black text-white">متأخر</button><button disabled={saving} onClick={() => markAttendance('absent')} className="rounded-2xl bg-rose-500 p-4 font-black text-white">غائب</button></div>
              </div>}

              {tab === 'payments' && <div className="mt-6 space-y-4"><input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="المبلغ بالجنيه" className="w-full rounded-2xl border p-4 font-bold" /><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-2xl border p-4"><option value="cash">نقدي</option><option value="vodafone_cash">فودافون كاش</option><option value="fawry">فوري</option><option value="card">بطاقة</option><option value="bank_transfer">تحويل بنكي</option></select><button disabled={saving} onClick={recordPayment} className="w-full rounded-2xl bg-slate-950 p-4 font-black text-white">تسجيل الدفعة</button></div>}

              {tab === 'parents' && <div className="mt-6 space-y-4"><p className="rounded-2xl bg-sky-50 p-5 font-bold text-sky-900">سيتم احتساب حضور وغياب وواجبات ومدفوعات الشهر الحالي وإنشاء رسالة جاهزة لولي الأمر.</p><button onClick={createParentReport} className="w-full rounded-2xl bg-amber-500 p-4 font-black text-slate-950">إنشاء ونسخ التقرير الشهري</button></div>}
            </>
          )}
        </main>
      </div>
    </section>
  );
}
