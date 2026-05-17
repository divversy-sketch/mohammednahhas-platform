import { signOut } from 'firebase/auth';
import { Bell, Filter, LogOut, Search, ShieldAlert, Sparkles } from '../../shared/icons/lucide-shim.jsx';
import { auth } from '../../services/firebase';
import { GradeOptions } from '../../shared/constants/grades';
import ThemeToggle from '../../shared/ui/ThemeToggle.jsx';

export default function AdminHeader({ adminGradeFilter, setAdminGradeFilter }) {
  return (
    <header className="v2-admin-premium-topbar nh-animated-border relative z-20 mx-4 mt-4">
      <div className="v2-admin-topbar-title">
        <div className="v2-admin-topbar-logo"><ShieldAlert size={24} /></div>
        <div>
          <p className="v2-admin-eyebrow"><Sparkles size={13} /> مركز التحكم المتقدم</p>
          <h1>لوحة تحكم منصة النحاس</h1>
        </div>
      </div>

      <div className="v2-admin-topbar-search">
        <Search size={17} />
        <span>ابحث عن طالب، كورس، محاضرة...</span>
      </div>

      <div className="v2-admin-topbar-actions">
        <ThemeToggle compact />
        <div className="v2-admin-filter-pill hidden md:flex">
          <Filter size={15} />
          <select value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
            <option value="all">كل المراحل الدراسية</option>
            <GradeOptions />
          </select>
        </div>
        <button type="button" className="v2-admin-icon-action" aria-label="الإشعارات">
          <Bell size={18} />
          <span>12</span>
        </button>
        <button onClick={() => signOut(auth)} className="v2-admin-logout-btn">
          <LogOut size={18} />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
}
