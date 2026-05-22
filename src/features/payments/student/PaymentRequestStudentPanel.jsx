import { useState, useEffect } from 'react';

import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { CreditCard } from '@shared/icons/lucide-shim.jsx';

import { db } from '@services/firebase';


import { platformNotify, safeNumber } from '@shared/core/platformShared.jsx';


export const PaymentRequestStudentPanel = ({ user, userData }) => {
  const [method, setMethod] = useState('vodafone_cash');
  const [plan, setPlan] = useState('monthly');
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const planDays = plan === 'monthly' ? 30 : plan === 'quarter' ? 90 : plan === 'yearly' ? 365 : 30;

  useEffect(() => {
    if (!user?.uid) return;
    const qRef = query(collection(db, 'payment_requests'), where('userId', '==', user.uid));
    const unsub = onSnapshot(qRef, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(rows);
    }, (error) => {
      console.warn('payment requests listener blocked:', error?.message);
      setRequests([]);
    });
    return () => unsub();
  }, [user?.uid]);

  const submitRequest = async () => {
    if (!transactionRef.trim()) return platformNotify('اكتب رقم العملية أو آخر 4 أرقام.');
    if (!amount || safeNumber(amount, 0) <= 0) return platformNotify('اكتب المبلغ المدفوع.');

    setLoading(true);
    try {
      await addDoc(collection(db, 'payment_requests'), {
        userId: user.uid,
        studentName: userData?.name || user?.displayName || user?.email || 'طالب',
        studentEmail: user?.email || '',
        grade: userData?.grade || '',
        method,
        plan,
        durationDays: planDays,
        amount: safeNumber(amount, 0),
        transactionRef: transactionRef.trim(),
        note: note.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: ''
      });
      setAmount('');
      setTransactionRef('');
      setNote('');
      platformNotify('تم إرسال طلب التفعيل للإدارة. سيتم المراجعة قريبًا.');
    } catch (error) {
      console.error('payment request error:', error);
      platformNotify('تعذر إرسال طلب الدفع. راجع الاتصال أو الصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><CreditCard className="text-emerald-600"/> طلب تفعيل اشتراك</h2>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4 text-sm text-emerald-800 font-bold leading-relaxed">
        بعد الدفع خارج المنصة، اكتب رقم العملية هنا وسيتم تفعيل اشتراكك بعد مراجعة الإدارة.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <select className="border rounded-xl p-3" value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="vodafone_cash">Vodafone Cash</option>
          <option value="instapay">InstaPay</option>
          <option value="bank_transfer">تحويل بنكي</option>
          <option value="manual">دفع يدوي</option>
        </select>

        <select className="border rounded-xl p-3" value={plan} onChange={e=>setPlan(e.target.value)}>
          <option value="monthly">شهري - 30 يوم</option>
          <option value="quarter">3 شهور - 90 يوم</option>
          <option value="yearly">سنوي - 365 يوم</option>
        </select>

        <input className="border rounded-xl p-3" type="number" placeholder="المبلغ المدفوع" value={amount} onChange={e=>setAmount(e.target.value)} />
        <input className="border rounded-xl p-3" placeholder="رقم العملية / آخر 4 أرقام" value={transactionRef} onChange={e=>setTransactionRef(e.target.value)} />
      </div>

      <textarea className="w-full border rounded-xl p-3 mb-3" placeholder="ملاحظة اختيارية للإدارة..." value={note} onChange={e=>setNote(e.target.value)} />

      <button disabled={loading} onClick={submitRequest} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50">
        {loading ? 'جاري الإرسال...' : 'إرسال طلب التفعيل'}
      </button>

      {requests.length > 0 && (
        <div className="mt-5">
          <h3 className="font-black text-slate-800 mb-2">طلباتي السابقة</h3>
          <div className="space-y-2">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="bg-white border rounded-xl p-3 flex justify-between items-center gap-3">
                <div>
                  <p className="font-bold text-slate-800">{req.method} - {req.amount} جنيه</p>
                  <p className="text-xs text-slate-500">رقم العملية: {req.transactionRef}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-black ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {req.status === 'approved' ? 'تم التفعيل' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRequestStudentPanel;
