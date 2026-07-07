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

export default function AdminV2PageFrame({ activeTab, onNavigate, stats = {}, adminName = '', children }) {
  const meta = getAdminPageMeta(activeTab);
  const isDashboard = activeTab === 'dashboard';

  const quickActions = [
    { key: 'all_users', label: 'إدارة الطلاب', icon: <AdminNeoIcon name="users" size={18} />, text: 'بحث وفلاتر وإجراءات' },
    { key: 'payments', label: 'المدفوعات', icon: <AdminNeoIcon name="card" size={18} />, text: 'طلبات وتفعيل اشتراكات' },
    { key: 'content', label: 'المحتوى', icon: <AdminNeoIcon name="book" size={18} />, text: 'دروس وملفات وفيديوهات' },
  ];

  return (
    <section className="admin-neo-page">
      {isDashboard && (
        <div className="admin-neo-hero">
          <div>
            <span className="admin-neo-kicker"><AdminNeoIcon name="spark" size={15} /> مركز تحكم 2026</span>
            <h2>إدارة المنصة بشكل أوضح، أسرع، وأكثر تنظيمًا.</h2>
            <p>كل قسم في مكانه: الطلاب، المحتوى، الاختبارات، الماليات، التواصل، والأمان — بدون تكدس وبدون شكل الداشبورد القديم.</p>
            <div className="admin-neo-hero__actions">
              <button type="button" className="admin-neo-action" onClick={() => onNavigate?.('all_users')}><AdminNeoIcon name="users" size={18} /> افتح الطلاب</button>
              <button type="button" className="admin-neo-action admin-neo-action--ghost" onClick={() => onNavigate?.('content')}><AdminNeoIcon name="book" size={18} /> إدارة المحتوى</button>
            </div>
          </div>
          <div className="admin-neo-hero__side">
            {quickActions.map((action) => (
              <button type="button" className="admin-neo-hero-chip" key={action.key} onClick={() => onNavigate?.(action.key)}>
                <div><strong>{action.label}</strong><span>{action.text}</span></div>
                {action.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="admin-neo-metrics">
        <MetricCard label="الطلاب" value={compactNumber(stats.students)} hint="إجمالي الطلاب النشطين" icon={<AdminNeoIcon name="users" size={23} />} />
        <MetricCard label="الامتحانات" value={compactNumber(stats.exams)} hint="اختبارات منشأة" icon={<AdminNeoIcon name="file" size={23} />} />
        <MetricCard label="المحتوى" value={compactNumber(stats.content)} hint="دروس وملفات" icon={<AdminNeoIcon name="graduation" size={23} />} />
        <MetricCard label="تنبيهات" value={compactNumber(stats.alerts)} hint="تحتاج متابعة" icon={<AdminNeoIcon name="bell" size={23} />} />
      </div>

      <div className="admin-neo-workspace">
        <div className="admin-neo-workspace__head">
          <div>
            <span className="admin-neo-kicker">{meta.eyebrow}</span>
            <h2>{meta.title}</h2>
            <p>{meta.description}</p>
          </div>
          {activeTab !== 'dashboard' && (
            <button type="button" className="admin-neo-action admin-neo-action--ghost" onClick={() => onNavigate?.('dashboard')}>
              العودة للرئيسية <AdminNeoIcon name="chevronRight" size={16} />
            </button>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
