import { useMemo, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';
import '@styles/pages/admin-people.css';
import { platformNotify, platformPrompt, platformConfirm } from '@shared/core/platformShared.jsx';
import { adminSecureFunctions } from '@admin/services/adminSecureFunctions.js';

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
      platformNotify('تم تغيير كلمة السر للطالب بنجاح. شاركها من قناة آمنة ولا تحفظها داخل المنصة.', 'success');
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

  const ms = (v) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
  return (
    <div className="apl" dir="rtl">
      <div className="apl-bar">
        <p className="apl-lead"><Icon name="info" />الطالب بيبعت الطلب من صفحة الدخول، وانت بتحدد له كلمة سر جديدة على طول وتبعتهاله (واتساب أو مكالمة).</p>
        <span className="apl-sp" />
        <span className="apl-count is-hot">{pendingRequests.length.toLocaleString('ar-EG')} طلب مفتوح</span>
      </div>
      {pendingRequests.length === 0 && <p className="apl-empty"><Icon name="checkCircle" />مفيش طلبات مفتوحة دلوقتي.</p>}
      <div className="apl-cards">
        {pendingRequests.map((request) => {
          const student = findStudentByEmail(request.email);
          return (
            <article key={request.id} className={`apl-card ${student ? '' : 'is-warn'}`}>
              <header className="apl-who"><i>{String(student?.name || request.email || 'ط').trim().charAt(0)}</i><span><b>{student?.name || 'مش لاقيين الطالب'}</b><small dir="ltr">{request.email}</small></span></header>
              <dl>
                {student?.phone && <div><dt>الموبايل</dt><dd dir="ltr"><a href={`https://wa.me/2${String(student.phone).replace(/\D/g, '').replace(/^2?/, '')}`} target="_blank" rel="noreferrer">{student.phone}</a></dd></div>}
                <div><dt>الطلب</dt><dd>{ms(request.createdAt) ? new Date(ms(request.createdAt)).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—'}</dd></div>
              </dl>
              {!student && <p className="apl-note is-bad"><Icon name="alert" />مفيش طالب بالإيميل ده. راجع الإيميل أو حساب الطالب الأول.</p>}
              <footer>
                <button type="button" className="apl-btn apl-btn--ok" disabled={busyId === request.id || !student} onClick={() => setPasswordForRequest(request)}><Icon name="key" />حدد كلمة سر جديدة</button>
                <button type="button" className="apl-btn apl-btn--danger" disabled={busyId === request.id} onClick={() => rejectRequest(request)}><Icon name="close" />رفض</button>
              </footer>
            </article>
          );
        })}
      </div>
      {completedRequests.length > 0 && (
        <section className="apl-section">
          <h3><Icon name="clock" />آخر الطلبات المقفولة</h3>
          <div className="apl-mini">
            {completedRequests.map((request) => (
              <div key={request.id}><span dir="ltr">{request.email}</span><em className={request.status === 'completed' ? 'is-ok' : 'is-bad'}>{request.status === 'completed' ? 'اتنفّذ' : 'اترفض'}</em></div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
