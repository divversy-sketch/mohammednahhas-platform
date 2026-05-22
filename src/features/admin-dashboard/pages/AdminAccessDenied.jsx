
import { signOut } from 'firebase/auth';

import { ShieldAlert } from '../../../shared/icons/lucide-shim.jsx';

import { auth } from '../../../services/firebase';


import { navigatePlatform } from '../../../shared/core/debugTools.jsx';


export const AdminAccessDenied = ({ user }) => (
  <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5 font-['Cairo']" dir="rtl">
    <div className="bg-white text-slate-900 max-w-lg w-full rounded-3xl shadow-2xl p-7 text-center border-t-8 border-red-500">
      <ShieldAlert className="mx-auto text-red-500 mb-4" size={64} />
      <h1 className="text-2xl font-black mb-2">لوحة الإدارة محمية</h1>
      <p className="text-slate-600 font-bold mb-5">هذا الحساب ليس له صلاحية دخول لوحة الإدارة. الطلاب هنا يذاكروا بس، مش يفتحوا غرفة الكنترول.</p>
      <p className="bg-slate-100 rounded-xl p-3 text-xs text-slate-500 break-all mb-5" dir="ltr">{user?.email || 'unknown user'}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => navigatePlatform('/student')} className="bg-amber-600 text-white px-5 py-3 rounded-xl font-black hover:bg-amber-700">الذهاب لواجهة الطالب</button>
        <button onClick={() => signOut(auth)} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black hover:bg-slate-800">تسجيل الخروج</button>
      </div>
    </div>
  </div>
);

export default AdminAccessDenied;
