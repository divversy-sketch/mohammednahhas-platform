import { useMemo, useState } from 'react';
import { CheckCircle, KeyRound, Mail, ShieldAlert, Trash2, User, XCircle } from '../../shared/icons/lucide-shim.jsx';
import { platformNotify, platformPrompt, platformConfirm } from '../../shared/core/platformShared.jsx';
import { adminSecureFunctions } from '../services/adminSecureFunctions.js';

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const generateStrongPassword = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const tail = Math.floor(1000 + Math.random() * 9000);
  return `Nahas@${random}${tail}`;
};

export default function AdminPasswordResetRequestsPanel({ requests = [], users = [] }) {
  const [busyId, setBusyId] = useState('');
  const pendingRequests = useMemo(
    () => requests.filter((item) => (item.status || 'pending') !== 'completed' && (item.status || 'pending') !== 'rejected'),
    [requests]
  );
  const completedRequests = useMemo(
    () => requests.filter((item) => item.status === 'completed' || item.status === 'rejected').slice(0, 8),
    [requests]
  );

  const findStudentByEmail = (email) => {
    const clean = normalizeEmail(email);
    return users.find((student) => normalizeEmail(student.email) === clean);
  };

  const setPasswordForRequest = async (request) => {
    const student = findStudentByEmail(request.email);
    if (!student) {
      platformNotify('لم يتم العثور على طالب بنفس هذا الإيميل داخل قائمة الطلاب.', 'error');
      return;
    }

    const suggestedPassword = generateStrongPassword();
    const password = platformPrompt(
      `اكتب كلمة السر الجديدة للطالب ${student.name || request.email}\nيمكنك استخدام المقترح أو تغييره.`,
      suggestedPassword
    );

    if (!password) return;
    if (password.length < 8) {
      platformNotify('كلمة السر يجب ألا تقل عن 8 حروف/أرقام.', 'error');
      return;
    }

    setBusyId(request.id);
    try {
      await adminSecureFunctions.setStudentPassword(student.id, password, request.id);
      try { await navigator.clipboard?.writeText(password); } catch (_) {}
      platformNotify(`تم تغيير كلمة السر للطالب. الكلمة الجديدة: ${password} — تم نسخها إن أمكن.`, 'success');
    } catch (error) {
      platformNotify(error?.message || 'فشل تغيير كلمة السر من السيرفر.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const rejectRequest = async (request) => {
    if (!platformConfirm(`رفض طلب تغيير كلمة السر الخاص بـ ${request.email}؟`)) return;
    setBusyId(request.id);
    try {
      await adminSecureFunctions.updatePasswordResetRequestStatus(request.id, 'rejected');
      platformNotify('تم رفض الطلب.', 'success');
    } catch (error) {
      platformNotify(error?.message || 'تعذر رفض الطلب.', 'error');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white/80 border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><KeyRound size={22} className="text-amber-600"/> طلبات تغيير كلمة السر</h2>
            <p className="text-sm text-slate-500 mt-1">الطالب يرسل طلب من صفحة الدخول، والأدمن يعيّن كلمة سر جديدة بدون انتظار وصول إيميل.</p>
          </div>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black text-sm">{pendingRequests.length} طلب مفتوح</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold">
            لا توجد طلبات مفتوحة حاليًا. الدنيا هادية… بشكل مريب شوية 😄
          </div>
        ) : (
          <div className="grid gap-3">
            {pendingRequests.map((request) => {
              const student = findStudentByEmail(request.email);
              return (
                <div key={request.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 flex items-center gap-2"><Mail size={16} className="text-blue-600"/> {request.email}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-2"><User size={15}/> {student ? `الطالب: ${student.name || 'بدون اسم'}` : 'لا يوجد طالب مطابق لهذا الإيميل'}</p>
                    <p className="text-xs text-slate-400">الحالة: {request.status || 'pending'} • المصدر: {request.source || 'auth_page'}</p>
                    {!student && <p className="text-xs text-red-600 font-bold flex items-center gap-1"><ShieldAlert size={14}/> راجع الإيميل أو حساب الطالب قبل تعيين كلمة سر.</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === request.id || !student}
                      onClick={() => setPasswordForRequest(request)}
                      className="bg-emerald-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-700 transition"
                    >
                      <CheckCircle size={16}/> تعيين كلمة سر
                    </button>
                    <button
                      type="button"
                      disabled={busyId === request.id}
                      onClick={() => rejectRequest(request)}
                      className="bg-red-100 disabled:opacity-50 text-red-700 px-4 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-red-200 transition"
                    >
                      <XCircle size={16}/> رفض
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {completedRequests.length > 0 && (
        <div className="bg-white/70 border border-slate-100 rounded-2xl p-5 shadow-sm">
          <h3 className="font-black text-slate-700 mb-3 flex items-center gap-2"><Trash2 size={18}/> آخر الطلبات المغلقة</h3>
          <div className="space-y-2">
            {completedRequests.map((request) => (
              <div key={request.id} className="flex justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3 text-sm">
                <span className="font-bold text-slate-700">{request.email}</span>
                <span className={request.status === 'completed' ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}>{request.status === 'completed' ? 'تم التنفيذ' : 'مرفوض'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
