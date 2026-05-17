import { ADMIN_TABS, canAccessAdminTab, ADMIN_ROLE_LABELS } from '../../config/adminPermissions';
import {
  Activity, BarChart3, Bell, BookOpen, Bot, BrainCircuit, ClipboardList, CreditCard,
  Crown, FileText, GraduationCap, Headphones, KeyRound, Layout, Lock, Megaphone,
  MessageCircle, PlayCircle, QrCode, Search, Settings, Shield, ShieldAlert, Sparkles,
  Target, Trophy, Upload, Users, Video, WalletCards
} from '../../shared/icons/lucide-shim.jsx';

export { ADMIN_TABS };

const TAB_ICON = {
  dashboard: Activity,
  follow_up: BarChart3,
  users: UserPendingIcon,
  all_users: Users,
  password_resets: KeyRound,
  payments: WalletCards,
  subscriptions_legacy: Crown,
  security_center: ShieldAlert,
  app_convert: Upload,
  question_bank: ClipboardList,
  smart_exam_engine: BrainCircuit,
  student_reports: BarChart3,
  student_groups: GraduationCap,
  messages_center: MessageCircle,
  finance_dashboard: CreditCard,
  video_security: Lock,
  platform_settings: Settings,
  admin_roles: Shield,
  audit_logs: Search,
  notifications_admin: Bell,
  assignments: FileText,
  exams: Trophy,
  smart_hw: QrCode,
  content: PlayCircle,
  courses: BookOpen,
  mistakes_admin: Target,
};

const GROUPS = [
  {
    label: 'لوحة القيادة',
    hint: 'المؤشرات والتنبيهات',
    tabs: ['dashboard', 'follow_up', 'student_reports'],
  },
  {
    label: 'إدارة الطلاب',
    hint: 'الطلبات والحسابات',
    tabs: ['users', 'all_users', 'password_resets', 'student_groups'],
  },
  {
    label: 'المحتوى والتعلم',
    hint: 'الدروس والكورسات',
    tabs: ['courses', 'content', 'assignments', 'smart_hw', 'video_security'],
  },
  {
    label: 'التقييم والذكاء',
    hint: 'امتحانات وتحليلات',
    tabs: ['exams', 'question_bank', 'smart_exam_engine', 'mistakes_admin', 'security_center'],
  },
  {
    label: 'المال والاشتراكات',
    hint: 'دفع وباقات',
    tabs: ['payments', 'subscriptions_legacy', 'finance_dashboard'],
  },
  {
    label: 'التواصل والتشغيل',
    hint: 'رسائل وإعدادات',
    tabs: ['messages_center', 'notifications_admin', 'platform_settings', 'admin_roles', 'audit_logs', 'app_convert'],
  },
];

function UserPendingIcon(props) {
  return <Users {...props} />;
}

function getTabLabel(tab) {
  return ADMIN_TABS.find(([key]) => key === tab)?.[1] || tab;
}

function AdminNavButton({ tab, label, active, onClick }) {
  const Icon = TAB_ICON[tab] || Layout;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`v2-admin-nav-row ${active ? 'is-active' : ''}`}
      role="tab"
      aria-selected={active}
    >
      <span className="v2-admin-nav-icon"><Icon size={18} /></span>
      <span className="v2-admin-nav-label">{label}</span>
      <span className="v2-admin-nav-light" />
    </button>
  );
}

export default function AdminSidebar({ activeTab, setActiveTab, adminProfile }) {
  const visibleTabs = ADMIN_TABS.filter(([tab]) => canAccessAdminTab(adminProfile, tab));
  const visibleMap = new Map(visibleTabs);
  const renderedTabs = new Set();
  const adminRole = adminProfile?.adminRole || 'manager';
  const roleLabel = adminProfile?.adminRoleLabel || ADMIN_ROLE_LABELS[adminRole] || 'مدير المنصة';

  const grouped = GROUPS.map((group) => ({
    ...group,
    items: group.tabs
      .filter((tab) => visibleMap.has(tab))
      .map((tab) => {
        renderedTabs.add(tab);
        return [tab, visibleMap.get(tab)];
      }),
  })).filter((group) => group.items.length);

  const extraTabs = visibleTabs.filter(([tab]) => !renderedTabs.has(tab));

  return (
    <aside className="v2-admin-side-rail nh-animated-border" aria-label="أقسام لوحة الإدارة">
      <div className="v2-admin-brand-block">
        <div className="v2-admin-brand-logo"><Sparkles size={26} /></div>
        <div className="min-w-0">
          <p className="v2-admin-brand-title">منصة النحاس التعليمية</p>
          <p className="v2-admin-brand-sub">لوحة تحكم الإدارة</p>
        </div>
      </div>

      <div className="v2-admin-role-card">
        <span className="v2-admin-role-icon"><Shield size={18} /></span>
        <div>
          <p>مرحباً بك</p>
          <strong>{roleLabel}</strong>
        </div>
      </div>

      <div className="v2-admin-nav-search">
        <Search size={16} />
        <span>تنقل سريع بين الأقسام</span>
      </div>

      <div className="v2-admin-nav-scroll" role="tablist" aria-label="تبويبات الإدارة">
        {grouped.map((group) => (
          <section key={group.label} className="v2-admin-nav-group">
            <div className="v2-admin-nav-group-head">
              <span>{group.label}</span>
              <small>{group.hint}</small>
            </div>
            <div className="v2-admin-nav-list">
              {group.items.map(([tab, label]) => (
                <AdminNavButton
                  key={tab}
                  tab={tab}
                  label={label}
                  active={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                />
              ))}
            </div>
          </section>
        ))}
        {extraTabs.length > 0 && (
          <section className="v2-admin-nav-group">
            <div className="v2-admin-nav-group-head">
              <span>أقسام إضافية</span>
              <small>حسب الصلاحيات</small>
            </div>
            <div className="v2-admin-nav-list">
              {extraTabs.map(([tab, label]) => (
                <AdminNavButton
                  key={tab}
                  tab={tab}
                  label={label || getTabLabel(tab)}
                  active={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="v2-admin-side-footer">
        <Bot size={16} />
        <span>نظام إدارة ذكي — بدون لغبطة التابات القديمة</span>
      </div>
    </aside>
  );
}
