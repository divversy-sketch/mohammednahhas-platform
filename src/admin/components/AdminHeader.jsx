import { signOut } from 'firebase/auth';
import AdminNeoIcon from './AdminNeoIcon.jsx';
import { auth } from '../../services/firebase';
import { GradeOptions } from '../../shared/constants/grades';
import { getAdminPageMeta } from '../v2/adminPageMeta.js';

export default function AdminHeader({ activeTab, adminGradeFilter, setAdminGradeFilter, onMenuClick }) {
  const meta = getAdminPageMeta(activeTab);

  return (
    <header className="admin-neo-header">
      <button type="button" className="admin-neo-header__mobile" onClick={onMenuClick} aria-label="فتح القائمة"><AdminNeoIcon name="menu" size={21} /></button>
      <div className="admin-neo-header__title">
        <span className="admin-neo-kicker">لوحة الإدارة</span>
        <h1>{meta.title}</h1>
      </div>
      <div className="admin-neo-header__actions">
        <label className="admin-neo-grade-filter">
          <AdminNeoIcon name="graduation" size={16} />
          <select className="admin-neo-grade-select" value={adminGradeFilter} onChange={(event) => setAdminGradeFilter(event.target.value)} aria-label="فلترة المرحلة الدراسية">
            <option value="all">كل المراحل</option>
            <GradeOptions />
          </select>
        </label>
        <button type="button" onClick={() => signOut(auth)} className="admin-neo-logout" title="تسجيل الخروج"><AdminNeoIcon name="logout" size={17} /><span>خروج</span></button>
      </div>
    </header>
  );
}
