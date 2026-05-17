import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { User, GraduationCap, Lock, Mail, ChevronRight, Loader2, Phone } from '../icons/lucide-shim.jsx';
import { motion } from 'framer-motion';
import { auth, db } from '../../services/firebase';

import { GradeOptions } from '../constants/grades';
import { normalizeEgyptPhone, validateEgyptianPhones } from '../utils/phone';
import { FloatingArabicBackground } from '../../features/home/HomeWidgets';

import { platformNotify, WhatsAppContactButton } from '../core/platformShared.jsx';

const teacherAvatarSrc = '/teacher-avatar.jpg';

const getFriendlyAuthError = (error) => {
  const code = error?.code || '';
  const messages = {
    'auth/invalid-email': 'الإيميل مكتوب بطريقة غير صحيحة.',
    'auth/user-not-found': 'لا يوجد حساب بهذا الإيميل.',
    'auth/wrong-password': 'كلمة السر غير صحيحة.',
    'auth/invalid-credential': 'بيانات الدخول غير صحيحة. راجع الإيميل وكلمة السر.',
    'auth/email-already-in-use': 'هذا الإيميل مسجل بالفعل. جرّب تسجيل الدخول بدل إنشاء حساب جديد.',
    'auth/weak-password': 'كلمة السر ضعيفة. استخدم 6 أحرف أو أكثر.',
    'auth/too-many-requests': 'تمت محاولات كثيرة. انتظر قليلًا ثم جرّب مرة أخرى.',
    'auth/network-request-failed': 'مشكلة في الاتصال بالإنترنت. تأكد من الشبكة ثم أعد المحاولة.'
  };
  return messages[code] || 'حدث خطأ غير متوقع. جرّب مرة أخرى أو تواصل مع الإدارة.';
};

const authGlowStyles = `
@keyframes nahhas-auth-spin { to { transform: rotate(360deg); } }
@keyframes nahhas-auth-breathe { 0%,100% { opacity:.72; transform: translateY(0px); } 50% { opacity:1; transform: translateY(-2px); } }
@keyframes nahhas-auth-shell-glow { 0%,100% { box-shadow: 0 30px 90px rgba(15,23,42,.12), 0 0 0 1px rgba(34,211,238,.12);} 50% { box-shadow: 0 34px 110px rgba(8,145,178,.18), 0 0 0 1px rgba(34,211,238,.24);} }
.nahhas-auth-shell { position: relative; isolation: isolate; overflow: hidden; animation: nahhas-auth-shell-glow 3.2s ease-in-out infinite; }
.nahhas-auth-shell::before {
  content: "";
  position: absolute;
  inset: -3px;
  z-index: -2;
  border-radius: 2rem;
  background: conic-gradient(from 0deg, rgba(34,211,238,.95), rgba(45,212,191,.85), rgba(250,204,21,.88), rgba(34,211,238,.96), rgba(14,165,233,.85), rgba(34,211,238,.95));
  animation: nahhas-auth-spin 5.6s linear infinite;
}
.nahhas-auth-shell::after {
  content: "";
  position: absolute;
  inset: 2px;
  z-index: -1;
  border-radius: 1.85rem;
  background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,251,255,.97));
}
.nahhas-auth-input:focus-within {
  border-color: rgba(34,211,238,.72) !important;
  box-shadow: 0 0 0 4px rgba(34,211,238,.10), 0 0 28px rgba(45,212,191,.14);
}
.nahhas-auth-logo-glow { animation: nahhas-auth-breathe 3.5s ease-in-out infinite; }
`;

export const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });
  const [platformSettings, setPlatformSettings] = useState({ registrationOpen: true, platformName: 'منصة النحاس التعليمية', welcomeMessage: '' });

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'platform_settings', 'main'),
      (snap) => {
        if (snap.exists()) setPlatformSettings((prev) => ({ ...prev, ...snap.data() }));
      },
      () => {}
    );
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      if (platformSettings.registrationOpen === false) {
        platformNotify('التسجيل مغلق حاليًا من إدارة المنصة. تواصل مع الإدارة للتفعيل.');
        setLoading(false);
        return;
      }
      if (!formData.name.trim()) {
        platformNotify('من فضلك اكتب اسم الطالب.');
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
          name: formData.name.trim(),
          email: formData.email.trim(),
          grade: formData.grade,
          phone: validation.normalizedStudentPhone,
          parentPhone: validation.normalizedParentPhone,
          role: 'student',
          status: 'pending',
          subscriptionStatus: 'free',
          subscriptionExpiry: null,
          createdAt: new Date(),
        });
        platformNotify('تم إنشاء الحساب! انتظر تفعيل الأدمن.');
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
    } catch (error) {
      platformNotify(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = String(formData.email || '').trim().toLowerCase();
    if (!email) {
      platformNotify('من فضلك اكتب الإيميل الأول.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'password_reset_requests'), {
        email,
        name: formData.name?.trim() || '',
        status: 'pending',
        source: 'auth_page',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      platformNotify('تم إرسال طلب تغيير كلمة السر للإدارة. سيتم التواصل معك بعد الموافقة.', 'success');
    } catch (error) {
      platformNotify('تعذر إرسال الطلب الآن، تواصل مع الإدارة عبر واتساب.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7fb] p-4 font-['Cairo']" dir="rtl">
      <style>{authGlowStyles}</style>
      <FloatingArabicBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="nahhas-auth-shell my-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/50 p-6 shadow-[0_28px_90px_rgba(15,23,42,.13)] scrollbar-hide md:p-8"
        >
          <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 md:mb-6">
            <ChevronRight size={18} /> العودة
          </button>

          <div className="nahhas-auth-logo-glow mb-4 flex justify-center">
            <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-amber-300 to-teal-400 text-4xl font-black text-slate-950 shadow-[0_0_55px_rgba(45,212,191,.22)] ring-2 ring-cyan-200/35">
              <img src={teacherAvatarSrc} alt="شعار المنصة" className="absolute inset-0 hidden h-full w-full object-cover" onLoad={(e) => e.currentTarget.classList.remove('hidden')} onError={(e) => e.currentTarget.classList.add('hidden')} />
              <span className="relative z-10">ن</span>
            </div>
          </div>

          <h2 className="mb-2 text-center font-arabic text-2xl font-black text-slate-800 md:text-3xl">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
          <p className="text-center text-sm font-bold text-slate-500">{platformSettings.welcomeMessage || 'بوابة الدخول لمنصة النحاس التعليمية بنفس روح الصفحة الرئيسية.'}</p>
          {isRegister && platformSettings.registrationOpen === false && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-sm font-black text-red-700">التسجيل مغلق حاليًا من الإدارة</div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 md:mt-6 md:gap-4">
            {isRegister && (
              <>
                <div className="nahhas-auth-input relative rounded-xl border border-slate-200 bg-slate-50 transition"><User className="absolute right-4 top-3.5 text-slate-400" size={18} /><input required type="text" className="w-full rounded-xl border-0 bg-transparent py-3 pl-4 pr-12 text-sm outline-none transition focus:bg-white/50 md:text-base" placeholder="الاسم ثلاثي" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="nahhas-auth-input relative rounded-xl border border-slate-200 bg-slate-50 transition"><Phone className="absolute right-4 top-3.5 text-slate-400" size={18} /><input required type="tel" className="w-full rounded-xl border-0 bg-transparent py-3 pl-4 pr-12 text-sm outline-none transition focus:bg-white/50 md:text-base" placeholder="رقم هاتفك" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: normalizeEgyptPhone(e.target.value) })} /></div>
                <div className="nahhas-auth-input relative rounded-xl border border-slate-200 bg-slate-50 transition"><Phone className="absolute right-4 top-3.5 text-slate-400" size={18} /><input required type="tel" className="w-full rounded-xl border-0 bg-transparent py-3 pl-4 pr-12 text-sm outline-none transition focus:bg-white/50 md:text-base" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: normalizeEgyptPhone(e.target.value) })} /></div>
                <div className="nahhas-auth-input relative rounded-xl border border-slate-200 bg-slate-50 transition"><GraduationCap className="absolute right-4 top-3.5 text-slate-400" size={18} /><select className="w-full appearance-none rounded-xl border-0 bg-transparent py-3 pl-4 pr-12 text-sm outline-none transition focus:bg-white/50 md:text-base" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })}><GradeOptions /></select></div>
              </>
            )}

            <div className="nahhas-auth-input relative rounded-xl border border-slate-200 bg-slate-50 transition"><Mail className="absolute right-4 top-3.5 text-slate-400" size={18} /><input required type="email" className="w-full rounded-xl border-0 bg-transparent py-3 pl-4 pr-12 text-sm outline-none transition focus:bg-white/50 md:text-base" placeholder="البريد" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="nahhas-auth-input relative rounded-xl border border-slate-200 bg-slate-50 transition"><Lock className="absolute right-4 top-3.5 text-slate-400" size={18} /><input required type="password" className="w-full rounded-xl border-0 bg-transparent py-3 pl-4 pr-12 text-sm outline-none transition focus:bg-white/50 md:text-base" placeholder="كلمة السر" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>

            {!isRegister && (
              <div className="text-left">
                <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-xs font-bold text-teal-700 hover:underline disabled:opacity-50">
                  طلب تغيير كلمة السر من الإدارة
                </button>
              </div>
            )}

            <button disabled={loading} className="mt-2 flex justify-center rounded-xl bg-gradient-to-l from-[#FACC15] to-[#FDE047] py-3 font-black text-slate-950 shadow-[0_16px_34px_rgba(250,204,21,.28)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(250,204,21,.34)]">
              {loading ? <Loader2 className="animate-spin" /> : isRegister ? 'تسجيل' : 'دخول'}
            </button>
          </form>

          <button onClick={() => setIsRegister(!isRegister)} className="mt-4 block w-full text-center text-sm font-bold text-teal-700 hover:underline md:mt-6">
            {isRegister ? 'تسجيل الدخول' : 'حساب جديد'}
          </button>
        </motion.div>
      </div>

      <WhatsAppContactButton />
    </div>
  );
};

export default AuthPage;
