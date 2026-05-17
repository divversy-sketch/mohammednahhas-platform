
import { signOut } from 'firebase/auth';
import { LogOut, ShieldAlert } from '../../shared/icons/lucide-shim.jsx';
import { auth } from '../../services/firebase';
import { GradeOptions } from '../../shared/constants/grades';

export default function AdminHeader({ adminGradeFilter, setAdminGradeFilter }) {
  return (
    <header className="v2-topbar flex justify-between items-center mb-8 glass-panel p-4 md:p-5 rounded-3xl relative z-10 mx-4">
      <div className="flex items-center gap-3 pr-1"><ShieldAlert className="text-amber-600"/> <div><p className="v2-kicker w-fit mb-1">مركز التحكم</p><h1 className="v2-page-title text-2xl md:text-3xl font-black font-arabic v2-gradient-text">لوحة تحكم النحاس</h1></div></div>
      <div className="flex gap-4 items-center">
        <select className="bg-white/90 border border-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-bold shadow-sm cursor-pointer hidden md:block" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
          <option value="all">كل المراحل الدراسية</option>
          <GradeOptions />
        </select>
        <button onClick={() => signOut(auth)} className="text-red-600 font-black px-4 py-3 flex gap-2 hover:bg-red-50 rounded-2xl transition border border-red-100 bg-white/70"><LogOut /> خروج</button>
      </div>
    </header>
  );
}
