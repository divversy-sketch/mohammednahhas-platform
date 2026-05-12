import { useState, useEffect, useMemo } from 'react';

import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { WalletCards, Download } from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';
import { usePagination } from '../../shared/hooks/usePagination.js';
import PaginationBar from '../../shared/components/PaginationBar.jsx';
import { downloadXlsx } from '../../shared/utils/exportData.js';

import { getGradeLabel } from '../../shared/constants/grades';

import { platformNotify, platformConfirm, platformPrompt, safeNumber } from '../../shared/core/platformShared.jsx';

import { adminSecureFunctions } from '../services/adminSecureFunctions.js';

const PAYMENT_METHOD_LABELS = {
  vodafone_cash: 'فودافون كاش',
  instapay: 'InstaPay',
  bank_transfer: 'تحويل بنكي',
  cash: 'كاش',
  other: 'أخرى'
};

const getRequestTime = (request) => request?.createdAt?.toMillis?.() || request?.createdAt?.seconds * 1000 || 0;

export const AdminPaymentRequestsPanel = ({ users = [] }) => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(200)), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => getRequestTime(b) - getRequestTime(a));
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

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesStatus = filter === 'all' || r.status === filter;
      const matchesMethod = methodFilter === 'all' || r.method === methodFilter;
      const searchable = [r.studentName, r.studentEmail, r.transactionId, r.transactionRef, r.amount, r.note, r.studentId, r.userId].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !q || searchable.includes(q);
      const createdAt = getRequestTime(r);
      const matchesDate = dateFilter === 'all'
        || (dateFilter === 'today' && createdAt >= now - 24 * 60 * 60 * 1000)
        || (dateFilter === 'week' && createdAt >= now - 7 * 24 * 60 * 60 * 1000)
        || (dateFilter === 'month' && createdAt >= now - 30 * 24 * 60 * 60 * 1000);
      return matchesStatus && matchesMethod && matchesSearch && matchesDate;
    });
  }, [requests, filter, methodFilter, searchTerm, dateFilter]);

  const summary = useMemo(() => ({
    pending: requests.filter(r=>r.status==='pending').length,
    approved: requests.filter(r=>r.status==='approved').length,
    rejected: requests.filter(r=>r.status==='rejected').length,
    approvedAmount: requests.filter(r=>r.status==='approved').reduce((s,r)=>s+safeNumber(r.amount,0),0),
    filteredAmount: filtered.reduce((s,r)=>s+safeNumber(r.amount,0),0)
  }), [requests, filtered]);

  const paymentPagination = usePagination(filtered, { pageSize: 25 });

  const exportPaymentRequestsExcel = async () => {
    const header = ['studentName', 'studentEmail', 'grade', 'amount', 'method', 'transactionId', 'status', 'createdAt', 'note'];
    const rows = filtered.map((req) => [
      req.studentName || '',
      req.studentEmail || '',
      getGradeLabel(req.grade),
      req.amount || '',
      PAYMENT_METHOD_LABELS[req.method] || req.method || '',
      req.transactionId || req.transactionRef || '',
      req.status || '',
      getRequestTime(req) ? new Date(getRequestTime(req)).toLocaleString('ar-EG') : '',
      req.note || ''
    ]);
    await downloadXlsx(`payment-requests-${new Date().toISOString().slice(0, 10)}.xlsx`, [header, ...rows]);
    platformNotify('تم تجهيز ملف Excel لطلبات الدفع.');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><WalletCards className="text-emerald-600"/> طلبات الدفع والتفعيل</h2>
          <p className="text-sm text-slate-500">مراجعة مدفوعات الطلاب مع بحث وفلاتر وتصدير سريع.</p>
        </div>
        <button onClick={exportPaymentRequestsExcel} className="bg-slate-900 text-white px-4 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-slate-800"><Download size={16}/> تصدير الحالي</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs font-bold text-amber-600">قيد المراجعة</p><p className="text-3xl font-black text-amber-700">{summary.pending}</p></div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs font-bold text-emerald-600">مفعلة</p><p className="text-3xl font-black text-emerald-700">{summary.approved}</p></div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs font-bold text-red-600">مرفوضة</p><p className="text-3xl font-black text-red-700">{summary.rejected}</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs font-bold text-blue-600">إجمالي مفعّل</p><p className="text-3xl font-black text-blue-700">{summary.approvedAmount}</p></div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4"><p className="text-xs font-bold text-slate-600">مجموع الفلتر</p><p className="text-3xl font-black text-slate-800">{summary.filteredAmount}</p></div>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="md:col-span-2 border border-slate-200 rounded-xl p-3 font-bold outline-none focus:border-emerald-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث بالطالب / الإيميل / رقم العملية" />
          <select className="border rounded-xl p-3 font-bold bg-white" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مفعلة</option>
            <option value="rejected">مرفوضة</option>
            <option value="all">الكل</option>
          </select>
          <select className="border rounded-xl p-3 font-bold bg-white" value={methodFilter} onChange={e=>setMethodFilter(e.target.value)}>
            <option value="all">كل الطرق</option>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select className="border rounded-xl p-3 font-bold bg-white" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}>
            <option value="all">كل المدة</option>
            <option value="today">آخر 24 ساعة</option>
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {paymentPagination.pageItems.map(req => (
          <div key={req.id} className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-800">{req.studentName}</h3>
                <p className="text-xs text-slate-500">{req.studentEmail} • {getGradeLabel(req.grade)} • {getRequestTime(req) ? new Date(getRequestTime(req)).toLocaleString('ar-EG') : 'بدون تاريخ'}</p>
                <p className="text-sm text-slate-700 mt-2"><b>الطريقة:</b> {PAYMENT_METHOD_LABELS[req.method] || req.method} | <b>المبلغ:</b> {req.amount} | <b>العملية:</b> {req.transactionId || req.transactionRef || '-'}</p>
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
        {filtered.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">لا توجد طلبات مطابقة للفلاتر الحالية.</p>}
      <PaginationBar page={paymentPagination.page} totalPages={paymentPagination.totalPages} totalItems={paymentPagination.totalItems} pageSize={paymentPagination.pageSize} onPageChange={paymentPagination.setPage} label="طلبات الدفع" />
      </div>
    </div>
  );
};

export default AdminPaymentRequestsPanel;
