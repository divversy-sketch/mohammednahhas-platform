import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { User, GraduationCap, Lock, Mail, ChevronRight, Loader2, Phone, ShieldCheck, Sparkles, BookOpen, MessageSquare } from '@shared/icons/lucide-shim.jsx';
import { motion } from 'framer-motion';
import { auth, db } from '../../../services/firebase';
import { GradeOptions } from '@shared/constants/grades.jsx';
import { normalizeEgyptPhone, validateEgyptianPhones } from '@shared/utils/phone.js';
import { ModernLogo } from '@features/home/HomeWidgets.jsx';
import { platformNotify, WhatsAppContactButton } from '@shared/core/platformShared.jsx';
import { GlowFrame } from '@ui/components';

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

const Field = ({ icon: Icon, children }) => (
  <div className="nh-input-wrap">
    <Icon size={19} />
    {children}
  </div>
);

const AuthBenefit = ({ icon: Icon, title, text }) => (
  <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
    <Icon className="mb-3 text-cyan-300" size={26} />
    <p className="font-black text-white">{title}</p>
    <p className="mt-1 text-xs font-bold leading-6 text-slate-300">{text}</p>
  </div>
);

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
            name: formData.name.trim(), email: formData.email.trim(), grade: formData.grade, phone: validation.normalizedStudentPhone,
            parentPhone: validation.normalizedParentPhone, role: 'student', status: 'pending',
            subscriptionStatus: 'free', subscriptionExpiry: null, createdAt: new Date()
        });
        platformNotify('تم إنشاء الحساب! انتظر تفعيل الأدمن.');
      } else { await signInWithEmailAndPassword(auth, formData.email, formData.password); }
    } catch (error) { platformNotify(getFriendlyAuthError(error)); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    const email = String(formData.email || '').trim().toLowerCase();
    if(!email) { platformNotify('من فضلك اكتب الإيميل الأول.'); return; }
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
      platformNotify('تم إرسال طلب تغيير كلمة السر للإدارة. سيتم التواصل معك بعد الموافقة.', 'success');
    } catch (error) {
      platformNotify('تعذر إرسال الطلب الآن، تواصل مع الإدارة عبر واتساب.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nh-page flex min-h-screen items-center justify-center px-4 py-8 font-['Cairo']" dir="rtl">
      <div className="nh-shell-grid" />
      <WhatsAppContactButton />

      <div className="nh-container grid items-center gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <motion.section initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5 }} className="hidden lg:block">
          <span className="nh-chip"><Sparkles size={16} /> دخول بتجربة جديدة بالكامل</span>
          <h1 className="mt-5 text-5xl font-black leading-[1.18] text-white">
            منصة واحدة للمذاكرة،
            <span className="block bg-gradient-to-l from-cyan-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">والتقييم، والمتابعة.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-bold leading-8 text-slate-300">
            صفحة الدخول الجديدة ليست فورم عادي؛ هي بوابة واضحة للطالب، وتعرض حالة التسجيل ورسائل المنصة من الإعدادات الحقيقية.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <AuthBenefit icon={BookOpen} title="دروسك" text="بعد الدخول تظهر المحاضرات من محتوى المنصة." />
            <AuthBenefit icon={ShieldCheck} title="حساب آمن" text="بيانات الدخول والتسجيل مرتبطة بـ Firebase." />
            <AuthBenefit icon={MessageSquare} title="تواصل سريع" text="الدعم وطلب كلمة السر واضحين للطالب." />
          </div>
        </motion.section>

        <motion.div initial={{ opacity: 0, y: 24, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .55 }}>
          <GlowFrame tone={isRegister ? 'purple' : 'student'} intensity="normal">
            <section className="relative max-h-[92vh] overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950/82 p-5 shadow-2xl backdrop-blur-2xl md:p-7">
              <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />

              <div className="relative z-10">
                <button onClick={onBack} className="mb-5 flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-slate-300 transition hover:bg-white/10">
                  <ChevronRight size={18} /> العودة
                </button>

                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ModernLogo />
                    <div>
                      <p className="text-xs font-black text-cyan-200">{platformSettings.platformName || 'منصة النحاس التعليمية'}</p>
                      <h2 className="text-2xl font-black text-white md:text-3xl">{isRegister ? 'إنشاء حساب طالب' : 'تسجيل الدخول'}</h2>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-amber-200">{isRegister ? 'مراجعة الإدارة' : 'دخول مباشر'}</span>
                </div>

                {platformSettings.welcomeMessage && (
                  <div className="mb-4 rounded-3xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm font-bold leading-7 text-cyan-50">
                    {platformSettings.welcomeMessage}
                  </div>
                )}

                {isRegister && platformSettings.registrationOpen === false && (
                  <div className="mb-4 rounded-3xl border border-red-300/20 bg-red-500/15 p-3 text-center text-sm font-black text-red-100">
                    التسجيل مغلق حاليًا من الإدارة
                  </div>
                )}

                <div className="mb-5 grid grid-cols-2 rounded-3xl border border-white/10 bg-white/5 p-1">
                  <button type="button" onClick={() => setIsRegister(false)} className={`rounded-[1.35rem] px-4 py-3 text-sm font-black transition ${!isRegister ? 'bg-cyan-300 text-slate-950 shadow-lg' : 'text-slate-300'}`}>دخول</button>
                  <button type="button" onClick={() => setIsRegister(true)} className={`rounded-[1.35rem] px-4 py-3 text-sm font-black transition ${isRegister ? 'bg-amber-300 text-slate-950 shadow-lg' : 'text-slate-300'}`}>حساب جديد</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {isRegister && (
                    <>
                      <Field icon={User}><input required type="text" className="nh-input" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></Field>
                      <Field icon={Phone}><input required type="tel" className="nh-input" placeholder="رقم هاتف الطالب" value={formData.phone} onChange={e => setFormData({...formData, phone: normalizeEgyptPhone(e.target.value)})} /></Field>
                      <Field icon={Phone}><input required type="tel" className="nh-input" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: normalizeEgyptPhone(e.target.value)})} /></Field>
                      <Field icon={GraduationCap}><select className="nh-input nh-select" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></Field>
                    </>
                  )}

                  <Field icon={Mail}><input required type="email" className="nh-input" placeholder="البريد الإلكتروني" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></Field>
                  <Field icon={Lock}><input required type="password" className="nh-input" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></Field>

                  {!isRegister && (
                    <div className="text-left">
                      <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-xs font-black text-cyan-200 hover:underline disabled:opacity-50">
                        طلب تغيير كلمة السر من الإدارة
                      </button>
                    </div>
                  )}

                  <button disabled={loading} className="nh-btn-primary mt-2 w-full py-4 text-base disabled:cursor-wait disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'إرسال طلب التسجيل' : 'دخول الطالب')}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs font-bold leading-6 text-slate-400">
                  {isRegister ? 'بعد التسجيل سيتم مراجعة الحساب من الإدارة قبل فتح المحتوى.' : 'لو نسيت كلمة السر اكتب الإيميل واضغط طلب تغيير كلمة السر.'}
                </p>
              </div>
            </section>
          </GlowFrame>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
