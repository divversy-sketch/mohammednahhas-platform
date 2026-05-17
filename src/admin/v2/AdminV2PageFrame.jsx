import { Bell, BookOpen, BarChart3, ChevronRight, CreditCard, FileText, GraduationCap, KeyRound, MessageCircle, PlayCircle, Send, Settings, Shield, Sparkles, Target, Trophy, Users, WalletCards } from '../../shared/icons/lucide-shim.jsx';
import { Button, Card, MetricCard, PageShell, StatusBadge } from '../../ui/components/index.js';
import { getAdminPageMeta } from './adminPageMeta.js';

function compactNumber(value) {
  return Number(value || 0).toLocaleString('ar-EG');
}

function AdminPremiumDashboardScene({ stats = {}, onNavigate }) {
  const kpi = [
    { label: 'إجمالي الطلاب', value: compactNumber(stats.students), hint: 'نمو مستمر', icon: <Users size={22} />, tone: 'blue' },
    { label: 'المحاضرات النشطة', value: compactNumber(stats.content), hint: 'محتوى منشور', icon: <PlayCircle size={22} />, tone: 'violet' },
    { label: 'الامتحانات', value: compactNumber(stats.exams), hint: 'تقييمات جاهزة', icon: <FileText size={22} />, tone: 'orange' },
    { label: 'تنبيهات متابعة', value: compactNumber(stats.alerts), hint: 'تحتاج مراجعة', icon: <Bell size={22} />, tone: 'red' },
  ];

  const actions = [
    { label: 'إضافة كورس', icon: <BookOpen size={20} />, tab: 'courses', tone: 'sky' },
    { label: 'إضافة محاضرة', icon: <PlayCircle size={20} />, tab: 'content', tone: 'violet' },
    { label: 'إضافة طالب', icon: <UserPlus size={20} />, tab: 'all_users', tone: 'emerald' },
    { label: 'إرسال إشعار', icon: <Send size={20} />, tab: 'notifications_admin', tone: 'amber' },
  ];

  return (
    <div className="nh-admin-premium-scene">
      <div className="nh-admin-kpi-strip">
        {kpi.map((item) => (
          <button key={item.label} type="button" className={`nh-premium-kpi nh-premium-kpi--${item.tone}`} onClick={() => onNavigate?.('dashboard')}>
            <span className="nh-premium-kpi__icon">{item.icon}</span>
            <span className="nh-premium-kpi__body">
              <small>{item.label}</small>
              <strong>{item.value}</strong>
              <em>{item.hint}</em>
            </span>
          </button>
        ))}
      </div>

      <div className="nh-admin-analytics-grid">
        <section className="nh-admin-chart nh-animated-border">
          <div className="nh-admin-panel-head">
            <div>
              <small>نظرة عامة على الأداء</small>
              <h3>حركة المنصة آخر 30 يوم</h3>
            </div>
            <span>آخر 30 يوم</span>
          </div>
          <div className="nh-fake-chart" aria-hidden="true">
            <i style={{height:'32%'}}/><i style={{height:'46%'}}/><i style={{height:'38%'}}/><i style={{height:'58%'}}/><i style={{height:'53%'}}/><i style={{height:'72%'}}/><i style={{height:'64%'}}/><i style={{height:'78%'}}/><i style={{height:'61%'}}/><i style={{height:'84%'}}/>
            <svg viewBox="0 0 620 180" preserveAspectRatio="none">
              <path d="M0 138 C80 118 110 94 170 108 C240 126 270 64 340 78 C420 94 440 34 520 48 C570 54 590 78 620 60" />
              <path d="M0 160 C80 146 120 132 180 140 C250 152 290 96 350 112 C410 128 455 82 520 96 C575 108 600 124 620 110" />
            </svg>
          </div>
        </section>

        <section className="nh-admin-quick-actions nh-animated-border">
          <div className="nh-admin-panel-head">
            <div>
              <small>إجراءات سريعة</small>
              <h3>اختصارات الإدارة</h3>
            </div>
            <BarChart3 size={22} />
          </div>
          <div className="nh-admin-actions-grid">
            {actions.map((action) => (
              <button key={action.label} type="button" className={`nh-admin-action nh-admin-action--${action.tone}`} onClick={() => onNavigate?.(action.tab)}>
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}



const adminNavGroups = [
  {
    label: 'إدارة الطلاب',
    items: [
      { key: 'users', label: 'طلبات التسجيل', icon: <Users size={17} /> },
      { key: 'all_users', label: 'الطلاب', icon: <Users size={17} /> },
      { key: 'student_reports', label: 'تقارير الطلاب', icon: <BarChart3 size={17} /> },
      { key: 'password_resets', label: 'كلمات السر', icon: <KeyRound size={17} /> },
    ],
  },
  {
    label: 'المحتوى والتعلم',
    items: [
      { key: 'courses', label: 'الكورسات', icon: <BookOpen size={17} /> },
      { key: 'content', label: 'المحاضرات والملفات', icon: <FileText size={17} /> },
      { key: 'assignments', label: 'الواجبات', icon: <FileText size={17} /> },
      { key: 'smart_hw', label: 'الواجب الذكي', icon: <Sparkles size={17} /> },
    ],
  },
  {
    label: 'التقييم والماليات',
    items: [
      { key: 'exams', label: 'الامتحانات', icon: <Trophy size={17} /> },
      { key: 'question_bank', label: 'بنك الأسئلة', icon: <Target size={17} /> },
      { key: 'payments', label: 'المدفوعات', icon: <CreditCard size={17} /> },
      { key: 'finance_dashboard', label: 'الماليات', icon: <WalletCards size={17} /> },
    ],
  },
  {
    label: 'التواصل والتحكم',
    items: [
      { key: 'messages_center', label: 'الرسائل', icon: <MessageCircle size={17} /> },
      { key: 'notifications_admin', label: 'الإشعارات', icon: <Bell size={17} /> },
      { key: 'platform_settings', label: 'الإعدادات', icon: <Settings size={17} /> },
      { key: 'admin_roles', label: 'الصلاحيات', icon: <Shield size={17} /> },
    ],
  },
];

function AdminWorkspaceNavigator({ activeTab, onNavigate }) {
  return (
    <div className="nh-admin-section-map nh-animated-border" dir="rtl">
      <div className="nh-admin-section-map__head">
        <span><Sparkles size={16} /> خريطة التبويبات</span>
        <small>وصول سريع ومنظم بدل الزحمة القديمة</small>
      </div>
      <div className="nh-admin-section-map__groups">
        {adminNavGroups.map((group) => (
          <section key={group.label} className="nh-admin-nav-group">
            <strong>{group.label}</strong>
            <div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={activeTab === item.key ? 'is-active' : ''}
                  onClick={() => onNavigate?.(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AdminQuickTile({ icon, label, hint, onClick, tone = 'amber' }) {
  return (
    <button type="button" onClick={onClick} className={`v2-admin-quick-tile is-${tone}`}>
      <span className="v2-admin-quick-icon">{icon}</span>
      <span className="v2-admin-quick-text">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </button>
  );
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
    { key: 'courses', label: 'إضافة كورس', hint: 'تنظيم المناهج', icon: <BookOpen size={22} />, tone: 'sky' },
    { key: 'content', label: 'إضافة محاضرة', hint: 'فيديو أو ملف', icon: <PlayCircle size={22} />, tone: 'violet' },
    { key: 'all_users', label: 'إضافة طالب', hint: 'إدارة الحسابات', icon: <Users size={22} />, tone: 'emerald' },
    { key: 'notifications_admin', label: 'إرسال إشعار', hint: 'تنبيه الطلاب', icon: <Send size={22} />, tone: 'amber' },
    { key: 'finance_dashboard', label: 'تقرير المبيعات', hint: 'إيرادات وباقات', icon: <CreditCard size={22} />, tone: 'cyan' },
    { key: 'exams', label: 'إدارة امتحان', hint: 'نتائج وتصحيح', icon: <Trophy size={22} />, tone: 'rose' },
  ];

  return (
    <PageShell
      eyebrow={meta.eyebrow}
      title={meta.title}
      description={meta.description}
      actions={adminName ? <StatusBadge tone="warning">{adminName}</StatusBadge> : null}
    >
      {isDashboard && (
        <div className="v2-admin-dashboard-intro grid grid-cols-1 gap-4 xl:grid-cols-[1.18fr_0.82fr]">
          <Card className="v2-admin-hero-card overflow-hidden text-white nh-animated-border">
            <div className="v2-admin-hero-art" aria-hidden="true">
              <span className="orb orb-1" />
              <span className="orb orb-2" />
              <span className="line line-1" />
              <span className="line line-2" />
            </div>
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="v2-admin-hero-kicker mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black"><Sparkles size={14} /> لوحة القيادة</p>
                <h2 className="text-3xl font-black leading-tight md:text-5xl">كل مؤشرات المنصة في مكان واحد</h2>
                <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-200">
                  واجهة إدارة أوضح، تبويبات مفهومة، وأزرار وصول سريع بدل متاهة “فين الزر يا جماعة؟”.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="v2-admin-hero-chip"><Shield size={15} /> صلاحيات آمنة</span>
                  <span className="v2-admin-hero-chip"><Target size={15} /> متابعة دقيقة</span>
                  <span className="v2-admin-hero-chip"><MessageCircle size={15} /> تواصل أسرع</span>
                </div>
              </div>
              <div className="v2-admin-hero-score">
                <span>معدل النظام</span>
                <strong>98%</strong>
                <small>جاهزية وتشغيل</small>
              </div>
            </div>
          </Card>

          <Card className="v2-admin-health-card nh-animated-border">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[var(--nh-muted)]">حالة التشغيل</p>
                <h3 className="text-2xl font-black text-[var(--nh-text)]">مستقرة</h3>
              </div>
              <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300"><Shield size={24} /></div>
            </div>
            <div className="space-y-3 text-sm font-bold text-[var(--nh-muted)]">
              <div className="v2-admin-health-row"><span>صلاحيات الأدمن</span><StatusBadge tone="success">مفعلة</StatusBadge></div>
              <div className="v2-admin-health-row"><span>طلبات تحتاج مراجعة</span><StatusBadge tone={Number(stats.alerts || 0) ? 'warning' : 'success'}>{compactNumber(stats.alerts)}</StatusBadge></div>
              <div className="v2-admin-health-row"><span>واجهة التحكم</span><StatusBadge tone="info">Premium V2</StatusBadge></div>
            </div>
          </Card>
        </div>
      )}

      <div className="v2-admin-metric-grid grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="إجمالي الطلاب" value={compactNumber(stats.students)} hint="طلاب نشطون داخل المنصة" icon={<Users size={22} />} tone="amber" />
        <MetricCard label="الامتحانات" value={compactNumber(stats.exams)} hint="امتحانات منشأة ومفعلة" icon={<FileText size={22} />} tone="sky" />
        <MetricCard label="المحتوى" value={compactNumber(stats.content)} hint="دروس وملفات تعليمية" icon={<GraduationCap size={22} />} tone="teal" />
        <MetricCard label="تنبيهات متابعة" value={compactNumber(stats.alerts)} hint="طلبات ونتائج تحتاج مراجعة" icon={<Bell size={22} />} tone="red" />
      </div>

      {isDashboard && (
        <Card className="v2-admin-actions-card nh-animated-border p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-amber-300">إجراءات سريعة</p>
              <h3 className="text-xl font-black text-[var(--nh-text)]">أقرب الطرق لأهم مهام الأدمن</h3>
            </div>
            <StatusBadge tone="warning">مختصرات</StatusBadge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <AdminQuickTile
                key={action.key}
                icon={action.icon}
                label={action.label}
                hint={action.hint}
                tone={action.tone}
                onClick={() => onNavigate?.(action.key)}
              />
            ))}
          </div>
        </Card>
      )}

      {!isDashboard && <AdminWorkspaceNavigator activeTab={activeTab} onNavigate={onNavigate} />}

      <Card className="v2-admin-workspace p-4 md:p-5 nh-animated-border nh-admin-inner-workspace">
        <div className="mb-4 flex flex-col gap-3 border-b border-[var(--nh-line)] pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black text-amber-300">القسم الحالي</p>
            <h2 className="text-xl font-black text-[var(--nh-text)]">{meta.title}</h2>
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
