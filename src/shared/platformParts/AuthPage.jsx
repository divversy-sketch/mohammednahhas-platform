import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { User, GraduationCap, Lock, Mail, ChevronRight, Loader2, Phone, PlayCircle } from '../icons/lucide-shim.jsx';
import { motion } from 'framer-motion';
import { auth, db } from '../../services/firebase';


import { GradeOptions } from '../constants/grades';
import { normalizeEgyptPhone, validateEgyptianPhones } from '../utils/phone';
import { ModernLogo, FloatingArabicBackground } from '../../features/home/HomeWidgets';
import ThemeToggle from '../ui/ThemeToggle.jsx';


import { platformNotify, WhatsAppContactButton } from '../core/platformShared.jsx';



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

export const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });
  const [platformSettings, setPlatformSettings] = useState({ registrationOpen: true, platformName: 'منصة النحاس التعليمية', welcomeMessage: '' });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'platform_settings', 'main'), (snap) => {
      if (snap.exists()) setPlatformSettings((prev) => ({ ...prev, ...snap.data() }));
    }, () => {});
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
    } catch (error) { platformNotify(getFriendlyAuthError(error)); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    const email = String(formData.email || '').trim().toLowerCase();
    if(!email) { platformNotify("من فضلك اكتب الإيميل الأول."); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, 'password_reset_requests'), {
        email,
        name: formData.name?.trim() || '',
        status: 'pending',
        source: 'auth_page',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      platformNotify("تم إرسال طلب تغيير كلمة السر للإدارة. سيتم التواصل معك بعد الموافقة.", 'success');
    } catch (error) {
      platformNotify("تعذر إرسال الطلب الآن، تواصل مع الإدارة عبر واتساب.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nh-auth-page min-h-screen flex items-center justify-center p-4 md:p-8 font-['Cairo'] relative overflow-hidden" dir="rtl">
      <FloatingArabicBackground />

      <div className="absolute top-5 left-5 z-20 flex gap-3">
        <button onClick={onBack} className="nh-theme-toggle">العودة</button>
        <ThemeToggle />
      </div>

      <div className="absolute top-6 right-6 z-20 hidden md:flex items-center gap-3">
        <ModernLogo />
        <div>
          <h1 className="text-2xl font-black text-[var(--nh-text)]">منصة النحاس التعليمية</h1>
          <p className="text-sm font-bold text-[var(--nh-muted)]">تعلّم بذكاء .. تميّز بثقة</p>
        </div>
      </div>

      <div className="relative z-10 grid w-full max-w-7xl items-center gap-7 lg:grid-cols-[.9fr_1.08fr_.8fr]">
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: .45 }}
          className="hidden lg:block"
        >
          <div className="relative min-h-[520px] rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl nh-animated-border overflow-hidden">
            <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute left-6 bottom-8 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative flex h-full flex-col justify-center gap-8">
              <div className="mx-auto flex h-64 w-80 items-center justify-center rounded-[2rem] border border-amber-300/20 bg-slate-950 shadow-2xl">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 shadow-[0_0_50px_rgba(245,158,11,.35)]">
                  <PlayCircle size={78} />
                </div>
              </div>
              <div className="mx-auto flex items-end gap-3">
                <div className="h-14 w-28 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg" />
                <div className="h-20 w-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 shadow-lg" />
                <div className="h-11 w-28 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 shadow-lg" />
              </div>
              <p className="text-center text-sm font-black text-[var(--nh-muted)]">محتوى تعليمي موثوق · تجربة تعلم تفاعلية · متابعة ذكية</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: .38 }}
          className="nh-auth-card nh-animated-border rounded-[2.3rem] border p-5 md:p-8 shadow-2xl relative z-10 my-10 max-h-[92vh] overflow-y-auto"
        >
          <div className="flex justify-center mb-5 md:hidden"><ModernLogo /></div>
          <div className="text-center mb-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-300">
              {isRegister ? 'إنشاء حساب طالب' : 'تسجيل الدخول'}
            </p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black text-[var(--nh-text)]">
              {isRegister ? 'ابدأ رحلتك معنا' : 'مرحباً بعودتك 👋'}
            </h2>
            <p className="mt-2 text-sm md:text-base font-bold text-[var(--nh-muted)] leading-7">
              {isRegister ? 'املأ بياناتك وسيتم تفعيل الحساب من الإدارة.' : 'سجّل دخولك للوصول إلى محتواك التعليمي وإدارة تقدمك الأكاديمي.'}
            </p>
            {platformSettings.welcomeMessage && <p className="mt-2 text-sm text-amber-300 font-bold leading-6">{platformSettings.welcomeMessage}</p>}
          </div>

          {isRegister && platformSettings.registrationOpen === false && <div className="mb-4 bg-red-500/10 border border-red-400/20 text-red-300 rounded-2xl p-3 text-sm font-black text-center">التسجيل مغلق حاليًا من الإدارة</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4">
            {isRegister && (
              <>
                <div className="relative"><User className="absolute top-3.5 right-4 text-amber-400" size={18} /><input required type="text" className="w-full py-3 pr-12 pl-4 rounded-2xl border outline-none transition text-sm md:text-base" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="relative"><Phone className="absolute top-3.5 right-4 text-amber-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-2xl border outline-none transition text-sm md:text-base" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
                <div className="relative"><Phone className="absolute top-3.5 right-4 text-amber-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-2xl border outline-none transition text-sm md:text-base" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: normalizeEgyptPhone(e.target.value)})} /></div>
                <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-amber-400" size={18} /><select className="w-full py-3 pr-12 pl-4 rounded-2xl border appearance-none outline-none transition text-sm md:text-base" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></div>
              </>
            )}
            <div className="relative"><Mail className="absolute top-3.5 right-4 text-amber-400" size={18} /><input required type="email" className="w-full py-3 pr-12 pl-4 rounded-2xl border outline-none transition text-sm md:text-base" placeholder="البريد الإلكتروني" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="relative"><Lock className="absolute top-3.5 right-4 text-amber-400" size={18} /><input required type="password" className="w-full py-3 pr-12 pl-4 rounded-2xl border outline-none transition text-sm md:text-base" placeholder="كلمة المرور" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
            {!isRegister && (
              <div className="flex items-center justify-between gap-3 text-xs font-black">
                <label className="flex items-center gap-2 text-[var(--nh-muted)]"><span className="inline-block h-5 w-5 rounded-md bg-amber-500 shadow" /> تذكرني</label>
                <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-amber-400 hover:text-amber-300 disabled:opacity-50">طلب تغيير كلمة السر</button>
              </div>
            )}
            <button disabled={loading} className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 text-slate-950 py-3.5 rounded-2xl font-black hover:shadow-lg hover:shadow-amber-500/30 transition mt-2 flex justify-center">
              {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'إنشاء الحساب' : 'تسجيل الدخول')}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-xs font-black text-[var(--nh-muted)]">أو</span><span className="h-px flex-1 bg-white/10" /></div>
          <button onClick={() => setIsRegister(!isRegister)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-black text-[var(--nh-text)] hover:border-amber-300/50 transition">
            {isRegister ? 'لديك حساب؟ تسجيل الدخول' : 'إنشاء حساب جديد'}
          </button>
          <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-center">
            <p className="text-sm font-black text-emerald-300">منصتك التعليمية الآمنة</p>
            <p className="text-xs font-bold text-[var(--nh-muted)] mt-1">نستخدم أحدث تقنيات الحماية لبياناتك وخصوصيتك.</p>
          </div>
        </motion.div>

        <div className="nh-auth-side hidden lg:block space-y-4">
          <h3 className="text-xl font-black text-[var(--nh-text)] text-center">خيارات أخرى</h3>
          <button onClick={() => setIsRegister(false)} className="nh-animated-border w-full rounded-3xl border p-5 text-right bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center justify-between gap-4">
              <GraduationCap className="text-purple-300" size={36}/>
              <div className="flex-1"><p className="font-black text-[var(--nh-text)]">دخول كطالب</p><p className="text-sm font-bold text-[var(--nh-muted)] leading-6">ابدأ رحلتك وتابع الدروس والاختبارات والنتائج.</p></div>
            </div>
          </button>
          <button onClick={handleForgotPassword} className="nh-animated-border w-full rounded-3xl border p-5 text-right bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center justify-between gap-4">
              <Lock className="text-sky-300" size={34}/>
              <div className="flex-1"><p className="font-black text-[var(--nh-text)]">طلب تغيير حساب</p><p className="text-sm font-bold text-[var(--nh-muted)] leading-6">اطلب مساعدة الإدارة في استعادة أو تعديل الحساب.</p></div>
            </div>
          </button>
        </div>
      </div>
      <WhatsAppContactButton />
    </div>
  );
};

export default AuthPage;
