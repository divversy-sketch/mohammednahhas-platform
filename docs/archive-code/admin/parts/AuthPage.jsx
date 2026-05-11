import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { User, GraduationCap, Lock, Mail, ChevronRight, Loader2, Phone } from '../../shared/icons/lucide-shim.jsx';
import { motion } from 'framer-motion';
import { auth, db } from '../../services/firebase';


import { GradeOptions } from '../../shared/constants/grades';
import { normalizeEgyptPhone, validateEgyptianPhones } from '../../shared/utils/phone';
import { ModernLogo, FloatingArabicBackground } from '../../features/home/HomeWidgets';


import { platformNotify, WhatsAppContactButton } from '../../shared/core/platformShared.jsx';


export const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
        if (!formData.name.trim()) {
            platformNotify("من فضلك اكتب اسم الطالب.");
            setLoading(false);
            return;
        }
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        if (!validation.ok) {
            platformNotify(validation.message);
            setLoading(false);
            return;
        }
    }

    try {
      if (isRegister) {
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        await updateProfile(userCred.user, { displayName: formData.name.trim() });
        await setDoc(doc(db, 'users', userCred.user.uid), { 
            name: formData.name.trim(), email: formData.email.trim(), grade: formData.grade, phone: validation.normalizedStudentPhone, 
            parentPhone: validation.normalizedParentPhone, role: 'student', status: 'pending', 
            subscriptionStatus: 'free', subscriptionExpiry: null, createdAt: new Date() 
        });
        platformNotify("تم إنشاء الحساب! انتظر تفعيل الأدمن.");
      } else { await signInWithEmailAndPassword(auth, formData.email, formData.password); }
    } catch (error) { platformNotify("حدث خطأ: " + error.message); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if(!formData.email) { platformNotify("من فضلك اكتب الإيميل الأول."); return; }
    try { await sendPasswordResetEmail(auth, formData.email); platformNotify("تم إرسال رابط استعادة كلمة السر."); } catch (error) { platformNotify("حدث خطأ: " + error.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-['Cairo'] relative overflow-hidden" dir="rtl">
      <FloatingArabicBackground />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative z-10 my-10 overflow-y-auto max-h-[90vh] border border-white/50 scrollbar-hide">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-4 md:mb-6 flex items-center gap-1 font-bold"><ChevronRight size={18} /> العودة</button>
        <div className="flex justify-center mb-4"><ModernLogo /></div>
        <h2 className="text-2xl md:text-3xl font-bold font-arabic text-slate-800 mb-2 text-center">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6">
          {isRegister && (
            <>
              <div className="relative"><User className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="text" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={18} /><select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none focus:border-amber-500 outline-none transition text-sm md:text-base" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></div>
            </>
          )}
          <div className="relative"><Mail className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="email" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="البريد" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="password" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          {!isRegister && (<div className="text-left"><button type="button" onClick={handleForgotPassword} className="text-xs text-amber-600 font-bold hover:underline">نسيت كلمة السر؟</button></div>)}
          <button disabled={loading} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/50 transition mt-2 flex justify-center">{loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'تسجيل' : 'دخول')}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="mt-4 md:mt-6 text-amber-800 font-bold hover:underline w-full text-center block text-sm">{isRegister ? 'تسجيل الدخول' : 'حساب جديد'}</button>
      </motion.div>
      <WhatsAppContactButton />
    </div>
  );
};

export default AuthPage;
