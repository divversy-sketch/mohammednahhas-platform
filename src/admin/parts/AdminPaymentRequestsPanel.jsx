import { useState, useEffect } from 'react';

import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { WalletCards } from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';


import { getGradeLabel } from '../../shared/constants/grades';


import { platformNotify, platformConfirm, platformPrompt, safeNumber } from '../../shared/core/platformShared.jsx';

import { adminSecureFunctions } from '../services/adminSecureFunctions.js';


export const AdminPaymentRequestsPanel = ({ users = [] }) => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(100)), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(rows);
    }, (error) => {
      console.warn('payment requests admin listener blocked:', error?.message);
      setRequests([]);
    });
    return () => unsub();
  }, []);

  const approveRequest = async (req) => {
    if (!platformConfirm(`تفعيل اشتراك ${req.studentName} لمدة ${req.durationDays || 30} يوم؟`)) return;

    try {
      await adminSecureFunctions.approvePaymentRequest(req.id, safeNumber(req.durationDays, 30));
      platformNotify('تم تفعيل الاشتراك بنجاح.');
    } catch (error) {
      console.error('approve payment request error:', error);
      platformNotify(error?.message || 'تعذر تفعيل الاشتراك. راجع الصلاحيات.');
    }
  };

  const rejectRequest = async (req) => {
    const reason = platformPrompt('سبب الرفض؟', 'بيانات الدفع غير واضحة');
    if (reason === null) return;
    await adminSecureFunctions.rejectPaymentRequest(req.id, reason);
    platformNotify('تم رفض الطلب.');
  };

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><WalletCards className="text-emerald-600"/> طلبات الدفع والتفعيل</h2>
          <p className="text-sm text-slate-500">مراجعة مدفوعات الطلاب وتفعيل الاشتراك مباشرة.</p>
        </div>
        <select className="border rounded-xl p-3" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">مفعلة</option>
          <option value="rejected">مرفوضة</option>
          <option value="all">الكل</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs font-bold text-amber-600">قيد المراجعة</p><p className="text-3xl font-black text-amber-700">{requests.filter(r=>r.status==='pending').length}</p></div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs font-bold text-emerald-600">مفعلة</p><p className="text-3xl font-black text-emerald-700">{requests.filter(r=>r.status==='approved').length}</p></div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs font-bold text-red-600">مرفوضة</p><p className="text-3xl font-black text-red-700">{requests.filter(r=>r.status==='rejected').length}</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs font-bold text-blue-600">إجمالي مبالغ مفعلة</p><p className="text-3xl font-black text-blue-700">{requests.filter(r=>r.status==='approved').reduce((s,r)=>s+safeNumber(r.amount,0),0)}</p></div>
      </div>

      <div className="space-y-3">
        {filtered.map(req => (
          <div key={req.id} className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-800">{req.studentName}</h3>
                <p className="text-xs text-slate-500">{req.studentEmail} • {getGradeLabel(req.grade)}</p>
                <p className="text-sm text-slate-700 mt-2"><b>الطريقة:</b> {req.method} | <b>المبلغ:</b> {req.amount} | <b>العملية:</b> {req.transactionRef}</p>
                {req.note && <p className="text-sm text-slate-500 mt-1">ملاحظة: {req.note}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {req.status === 'pending' && (
                  <>
                    <button onClick={() => approveRequest(req)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold">تفعيل</button>
                    <button onClick={() => rejectRequest(req)} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold">رفض</button>
                  </>
                )}
                <span className={`px-3 py-2 rounded-xl text-xs font-black ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {req.status === 'approved' ? 'مفعل' : req.status === 'rejected' ? 'مرفوض' : 'انتظار'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">لا توجد طلبات في هذا القسم.</p>}
      </div>
    </div>
  );
};

export default AdminPaymentRequestsPanel;
