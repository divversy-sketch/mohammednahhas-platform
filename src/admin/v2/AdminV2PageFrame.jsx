import AdminNeoIcon from '../components/AdminNeoIcon.jsx';
import { getAdminPageMeta } from './adminPageMeta.js';

function compactNumber(value) {
  return Number(value || 0).toLocaleString('ar-EG');
}

function MetricCard({ label, value, hint, icon }) {
  return (
    <article className="admin-neo-metric">
      <div className="admin-neo-metric__icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

export default function AdminV2PageFrame({ activeTab, onNavigate, stats = {}, children }) {
  const isDashboard = activeTab === 'dashboard';

  return (
    <section className="admin-neo-page">
      {isDashboard && (
        <>
          <div className="admin-neo-dashboard-intro">
            <div>
              <span className="admin-neo-kicker">نظرة عامة</span>
              <h2>أهلًا بك في مركز إدارة المنصة</h2>
              <p>تابع أهم الأرقام وانتقل مباشرة إلى أكثر الأقسام استخدامًا.</p>
            </div>
            <div className="admin-neo-quick-actions">
              <button type="button" onClick={() => onNavigate?.('all_users')}><AdminNeoIcon name="users" size={17} /> الطلاب</button>
              <button type="button" onClick={() => onNavigate?.('question_bank')}><AdminNeoIcon name="clipboard" size={17} /> بنك الأسئلة</button>
              <button type="button" onClick={() => onNavigate?.('payments')}><AdminNeoIcon name="card" size={17} /> المدفوعات</button>
            </div>
          </div>
          <div className="admin-neo-metrics">
            <MetricCard label="الطلاب" value={compactNumber(stats.students)} hint="إجمالي الطلاب" icon={<AdminNeoIcon name="users" size={19} />} />
            <MetricCard label="الامتحانات" value={compactNumber(stats.exams)} hint="اختبار منشأ" icon={<AdminNeoIcon name="file" size={19} />} />
            <MetricCard label="المحتوى" value={compactNumber(stats.content)} hint="درس وملف" icon={<AdminNeoIcon name="book" size={19} />} />
            <MetricCard label="تنبيهات" value={compactNumber(stats.alerts)} hint="تحتاج متابعة" icon={<AdminNeoIcon name="bell" size={19} />} />
          </div>
        </>
      )}
      <div className="admin-neo-workspace">{children}</div>
    </section>
  );
}
