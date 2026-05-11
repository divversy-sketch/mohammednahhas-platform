
import { signOut } from 'firebase/auth';
import { LogOut, ShieldAlert } from '../../shared/icons/lucide-shim.jsx';
import { auth } from '../../services/firebase';
import { GradeOptions } from '../../shared/constants/grades';

export default function AdminHeader({ adminGradeFilter, setAdminGradeFilter }) {
  return (
    <header className="flex justify-between items-center mb-8 glass-panel p-4 rounded-xl relative z-10 m-4">
      <div className="flex items-center gap-2"><ShieldAlert className="text-amber-600"/> <h1 className="text-2xl font-bold font-arabic text-slate-800">لوحة تحكم النحاس (الأدمن)</h1></div>
      <div className="flex gap-4 items-center">
        <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm cursor-pointer hidden md:block" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
          <option value="all">كل المراحل الدراسية</option>
          <GradeOptions />
        </select>
        <button onClick={() => signOut(auth)} className="text-red-500 font-bold px-4 py-2 flex gap-2 hover:bg-red-50 rounded-lg transition"><LogOut /> خروج</button>
      </div>
    </header>
  );
}
