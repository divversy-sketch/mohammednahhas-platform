import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { ADMIN_TABS, canAccessAdminTab } from '../../config/adminPermissions';
import { BarChart3, BookOpen, ClipboardList, FileText, Layout, LogOut, Megaphone, PlayCircle, Settings, ShieldCheck, User, Users } from '../../shared/icons/lucide-shim.jsx';

export { ADMIN_TABS };

const ADMIN_NAV = [
  ['dashboard', 'لوحة التحكم', Layout],
  ['all_users', 'الطلاب', Users],
  ['users', 'طلبات الطلاب', User],
  ['courses', 'الكورسات', BookOpen],
  ['content', 'المحاضرات', PlayCircle],
  ['exams', 'الاختبارات', ClipboardList],
  ['assignments', 'الواجبات', ShieldCheck],
  ['files', 'الملفات', FileText],
  ['performance', 'التحليلات', BarChart3],
  ['announcements', 'الإعلانات', Megaphone],
  ['settings', 'الإعدادات', Settings],
];

function firstAllowedTarget(tab) {
  if (tab === 'students') return 'all_users';
  return tab;
}

export default function AdminSidebar({ activeTab, setActiveTab, adminProfile }) {
  const visible = ADMIN_NAV.filter(([tab]) => {
    const target = firstAllowedTarget(tab);
    return canAccessAdminTab(adminProfile, target) || target === 'files' || target === 'performance';
  });

  return (
    <aside className="nh-admin-sidebar" aria-label="قائمة الإدارة">
      <div className="nh-text-sidebar__header">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-400 shadow-[0_0_35px_rgba(139,92,246,.45)]" />
        <div className="nh-admin-brand">
          <span className="nh-text-sidebar__name">منصة النحاس</span>
          <span className="nh-text-sidebar__sub">لوحة الإدارة</span>
        </div>
      </div>

      <nav className="nh-admin-nav">
        {visible.map(([tab, label, Icon]) => {
          const target = firstAllowedTarget(tab);
          const active = activeTab === target || (target === 'all_users' && activeTab === 'students');
          return (
            <button key={tab} type="button" onClick={() => setActiveTab?.(target)} className={active ? 'is-active' : ''}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="nh-admin-profile">
        <p className="text-xs font-black text-slate-400">مدير المنصة</p>
        <p className="mt-1 text-lg font-black text-white">{adminProfile?.name || adminProfile?.email || 'المدير'}</p>
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><span className="block h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-sky-400" /></div>
      </div>

      <button type="button" onClick={() => signOut(auth)} className="nh-nav-item nh-nav-item--logout">
        <LogOut size={17} />
        <span>تسجيل الخروج</span>
      </button>
    </aside>
  );
}
