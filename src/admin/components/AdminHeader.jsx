import { signOut } from 'firebase/auth';
import AdminNeoIcon from './AdminNeoIcon.jsx';
import { auth } from '../../services/firebase';
import { GradeOptions } from '../../shared/constants/grades';
import { getAdminPageMeta } from '../v2/adminPageMeta.js';

export default function AdminHeader({ activeTab, adminProfile, adminGradeFilter, setAdminGradeFilter, onMenuClick }) {
  const meta = getAdminPageMeta(activeTab);
  const role = adminProfile?.adminRoleLabel || adminProfile?.adminRole || 'إدارة المنصة';
  const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="admin-neo-header">
      <button type="button" className="admin-neo-header__mobile" onClick={onMenuClick} aria-label="فتح أقسام الإدارة"><AdminNeoIcon name="menu" size={22} /></button>
      <div>
        <span className="admin-neo-kicker">{meta.eyebrow}</span>
        <h1>{meta.title}</h1>
        <p>{meta.description || 'مساحة عمل منظمة لإدارة المنصة بسرعة ووضوح.'}</p>
      </div>
      <div className="admin-neo-header__actions">
        <span className="admin-neo-header__pill"><AdminNeoIcon name="shieldAlert" size={17} /> {role}</span>
        <span className="admin-neo-header__pill"><AdminNeoIcon name="calendar" size={17} /> {today}</span>
        <select className="admin-neo-grade-select" value={adminGradeFilter} onChange={(event) => setAdminGradeFilter(event.target.value)} aria-label="فلترة المرحلة الدراسية">
          <option value="all">كل المراحل</option>
          <GradeOptions />
        </select>
        <button type="button" onClick={() => signOut(auth)} className="admin-neo-logout"><AdminNeoIcon name="logout" size={18} /> خروج</button>
      </div>
    </header>
  );
}
