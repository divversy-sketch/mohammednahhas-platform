import { useState, useEffect, useMemo } from 'react';

import { doc, collection, onSnapshot, deleteDoc, serverTimestamp, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { CreditCard } from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';


import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';


import { platformNotify, platformConfirm, safeNumber } from '../../shared/core/platformShared.jsx';
import { downloadXlsx } from '../../shared/utils/exportData.js';
import { usePagination } from '../../shared/hooks/usePagination.js';
import PaginationBar from '../../shared/components/PaginationBar.jsx';


export const SmartSubscriptionManager = ({ users = [], adminGradeFilter = 'all' }) => {
  const [codes, setCodes] = useState([]);
  const [plan, setPlan] = useState('monthly');
  const [grade, setGrade] = useState(adminGradeFilter === 'all' ? '3sec' : adminGradeFilter);
  const [count, setCount] = useState(1);
  const [customPrefix, setCustomPrefix] = useState('VIP');
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'subscription_codes'), orderBy('createdAt', 'desc'), limit(250)), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCodes(rows);
    }, (error) => {
      console.warn('subscription codes listener blocked:', error?.message);
      setCodes([]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (plan === 'monthly') setDurationDays(30);
    if (plan === 'quarter') setDurationDays(90);
    if (plan === 'yearly') setDurationDays(365);
  }, [plan]);

  const generateCode = () => {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    return `${customPrefix || 'VIP'}-${random}-${stamp}`;
  };

  const createCodes = async () => {
    const safeCount = Math.min(Math.max(safeNumber(count, 1), 1), 100);
    if (!grade) return platformNotify('اختار الصف.');
    if (safeNumber(durationDays, 0) <= 0) return platformNotify('حدد مدة الاشتراك بالأيام.');

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const created = [];
      for (let i = 0; i < safeCount; i++) {
        const codeValue = generateCode();
        const ref = doc(collection(db, 'subscription_codes'));
        created.push(codeValue);
        batch.set(ref, {
          code: codeValue,
          grade,
          plan,
          type: plan,
          durationDays: safeNumber(durationDays, 30),
          expiresInDays: safeNumber(durationDays, 30),
          used: false,
          active: true,
          usedBy: null,
          usedByEmail: '',
          usedByName: '',
          usedAt: null,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      await navigator.clipboard?.writeText(created.join('\n')).catch(() => {});
      platformNotify(`تم إنشاء ${safeCount} كود ونسخهم للحافظة.`);
    } catch (error) {
      console.error('create subscription codes error:', error);
      platformNotify('تعذر إنشاء الأكواد. راجع الصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  const deleteCode = async (id) => {
    if (!platformConfirm('حذف الكود؟')) return;
    await deleteDoc(doc(db, 'subscription_codes', id));
  };

  const copyAvailableCodes = async () => {
    const available = codes.filter(c => !c.used && c.active !== false).map(c => c.code);
    if (!available.length) return platformNotify('لا توجد أكواد متاحة للنسخ.');
    await navigator.clipboard?.writeText(available.join('\n'));
    platformNotify(`تم نسخ ${available.length} كود متاح.`);
  };

  const exportExcel = () => {
    const header = ['code','grade','plan','durationDays','used','usedByName','usedByEmail'];
    return downloadXlsx('subscription_codes.xlsx', [header, ...codes.map(c => header.map(h => c[h] ?? ''))]);
  };

  const stats = useMemo(() => {
    const total = codes.length;
    const used = codes.filter(c => c.used).length;
    const available = codes.filter(c => !c.used && c.active !== false).length;
    const disabled = codes.filter(c => c.active === false).length;
    return { total, used, available, disabled };
  }, [codes]);

  const codesPagination = usePagination(codes, { pageSize: 30 });

  const vipUsers = useMemo(() => {
    return (users || []).filter(u => {
      const exp = u.subscription?.expiresAt?.toDate?.() || (u.subscription?.expiresAt ? new Date(u.subscription.expiresAt) : null);
      return u.subscription?.active && (!exp || exp > new Date());
    });
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
        <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><CreditCard className="text-emerald-600"/> نظام الاشتراكات الذكي</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs font-bold text-slate-500">إجمالي الأكواد</p><p className="text-3xl font-black">{stats.total}</p></div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs font-bold text-emerald-600">متاحة</p><p className="text-3xl font-black text-emerald-700">{stats.available}</p></div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs font-bold text-amber-600">مستخدمة</p><p className="text-3xl font-black text-amber-700">{stats.used}</p></div>
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4"><p className="text-xs font-bold text-purple-600">طلاب VIP</p><p className="text-3xl font-black text-purple-700">{vipUsers.length}</p></div>
        </div>

        <div className="bg-white border rounded-2xl p-4 mb-6">
          <h3 className="font-black text-slate-800 mb-3">إنشاء أكواد جديدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input className="border rounded-xl p-3" placeholder="بادئة الكود" value={customPrefix} onChange={e => setCustomPrefix(e.target.value.toUpperCase())} />
            <select className="border rounded-xl p-3" value={grade} onChange={e => setGrade(e.target.value)}><GradeOptions/></select>
            <select className="border rounded-xl p-3" value={plan} onChange={e => setPlan(e.target.value)}>
              <option value="monthly">شهري</option>
              <option value="quarter">3 شهور</option>
              <option value="yearly">سنوي</option>
              <option value="custom">مدة مخصصة</option>
            </select>
            <input type="number" className="border rounded-xl p-3" placeholder="المدة بالأيام" value={durationDays} onChange={e => setDurationDays(e.target.value)} />
            <input type="number" min="1" max="100" className="border rounded-xl p-3" placeholder="عدد الأكواد" value={count} onChange={e => setCount(e.target.value)} />
            <button disabled={loading} onClick={createCodes} className="bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50">{loading ? 'جاري...' : 'إنشاء'}</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <button onClick={copyAvailableCodes} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold">نسخ الأكواد المتاحة</button>
          <button onClick={exportExcel} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">تصدير Excel</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="bg-slate-100 text-slate-700">
              <th className="p-3 text-right">الكود</th><th className="p-3">الصف</th><th className="p-3">الخطة</th><th className="p-3">المدة</th><th className="p-3">الحالة</th><th className="p-3">استخدمه</th><th className="p-3">تحكم</th>
            </tr></thead>
            <tbody>
              {codesPagination.pageItems.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-mono font-black">{c.code}</td>
                  <td className="p-3 text-center">{getGradeLabel(c.grade)}</td>
                  <td className="p-3 text-center">{c.plan || c.type}</td>
                  <td className="p-3 text-center">{c.durationDays || c.expiresInDays} يوم</td>
                  <td className="p-3 text-center">{c.used ? <span className="text-amber-600 font-bold">مستخدم</span> : <span className="text-emerald-600 font-bold">متاح</span>}</td>
                  <td className="p-3 text-center">{c.usedByName || c.usedByEmail || '-'}</td>
                  <td className="p-3 text-center"><button onClick={() => deleteCode(c.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded-lg font-bold">حذف</button></td>
                </tr>
              ))}
              {codes.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-bold">لا توجد أكواد بعد.</td></tr>}
            </tbody>
          </table>
          <PaginationBar page={codesPagination.page} totalPages={codesPagination.totalPages} totalItems={codesPagination.totalItems} pageSize={codesPagination.pageSize} onPageChange={codesPagination.setPage} label="أكواد الاشتراك" />
        </div>
      </div>
    </div>
  );
};

export default SmartSubscriptionManager;
