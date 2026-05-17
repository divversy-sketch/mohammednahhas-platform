import { Bell, BookOpen, ChevronRight, CreditCard, FileText, GraduationCap, Shield, Users } from '../../shared/icons/lucide-shim.jsx';
import { Button, Card, MetricCard, PageShell, StatusBadge } from '../../ui/components/index.js';
import { getAdminPageMeta } from './adminPageMeta.js';

function compactNumber(value) {
  return Number(value || 0).toLocaleString('ar-EG');
}

export default function AdminV2PageFrame({
  activeTab,
  onNavigate,
  stats = {},
  adminName = '',
  children,
}) {
  const meta = getAdminPageMeta(activeTab);
  const isDashboard = activeTab === 'dashboard';

  const quickActions = [
    { key: 'all_users', label: 'الطلاب', icon: <Users size={16} /> },
    { key: 'payments', label: 'المدفوعات', icon: <CreditCard size={16} /> },
    { key: 'exams', label: 'الامتحانات', icon: <FileText size={16} /> },
    { key: 'courses', label: 'الكورسات', icon: <BookOpen size={16} /> },
  ];

  return (
    <PageShell
      eyebrow={meta.eyebrow}
      title={meta.title}
      description=""
      actions={(
        <>
          {adminName ? <StatusBadge tone="warning">{adminName}</StatusBadge> : null}
        </>
      )}
    >
      {isDashboard && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="v2-admin-hero-card overflow-hidden text-white">
            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="v2-admin-hero-kicker mb-3 inline-flex rounded-full px-3 py-1 text-xs font-black">لوحة القيادة</p>
                <h2 className="text-3xl font-black md:text-4xl">كل مؤشرات المنصة في مكان واحد</h2>
                <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-200">

                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm font-black">
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => onNavigate?.(action.key)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white transition hover:bg-white/20"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-white/90">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-500">حالة التشغيل</p>
                <h3 className="text-2xl font-black text-slate-950">مستقرة</h3>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><Shield size={24} /></div>
            </div>
            <div className="space-y-3 text-sm font-bold text-slate-600">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><span>صلاحيات الأدمن</span><StatusBadge tone="success">مفعلة</StatusBadge></div>
              
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="الطلاب" value={compactNumber(stats.students)} hint="إجمالي الطلاب النشطين" icon={<Users size={22} />} tone="amber" />
        <MetricCard label="الامتحانات" value={compactNumber(stats.exams)} hint="امتحانات منشأة" icon={<FileText size={22} />} tone="sky" />
        <MetricCard label="المحتوى" value={compactNumber(stats.content)} hint="دروس وملفات" icon={<GraduationCap size={22} />} tone="teal" />
        <MetricCard label="تنبيهات متابعة" value={compactNumber(stats.alerts)} hint="طلبات ونتائج تحتاج مراجعة" icon={<Bell size={22} />} tone="red" />
      </div>

      <Card className="v2-admin-workspace p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">{meta.title}</h2>
            
          </div>
          {activeTab !== 'dashboard' && (
            <Button type="button" variant="soft" className="px-4 py-2" onClick={() => onNavigate?.('dashboard')}>
              العودة للوحة القيادة <ChevronRight size={16} />
            </Button>
          )}
        </div>
        {children}
      </Card>
    </PageShell>
  );
}
