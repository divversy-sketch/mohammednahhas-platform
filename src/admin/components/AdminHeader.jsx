import { signOut } from 'firebase/auth';
import { LogOut, Search, ShieldAlert } from '../../shared/icons/lucide-shim.jsx';
import { auth } from '../../services/firebase';
import { GradeOptions } from '../../shared/constants/grades';

export default function AdminHeader({ adminGradeFilter, setAdminGradeFilter }) {
  return (
    <header className="v2-topbar flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><ShieldAlert size={24}/></span>
        <div><h1 className="text-2xl md:text-3xl font-black text-white">مرحبًا مدير 👑</h1><p className="nh-muted">لوحة التحكم الإدارية</p></div>
      </div>
      <div className="flex flex-1 items-center gap-3 md:max-w-3xl">
        <div className="relative flex-1 hidden sm:block">
          <Search className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400" size={18}/>
          <input className="w-full pr-11 pl-4 py-3" placeholder="ابحث عن طالب، كورس، محاضرة..." />
        </div>
        <select className="hidden lg:block px-4 py-3 font-bold" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
          <option value="all">كل المراحل</option>
          <GradeOptions />
        </select>
        <button onClick={() => signOut(auth)} className="nh-neon-btn secondary"><LogOut size={18}/> خروج</button>
      </div>
    </header>
  );
}
