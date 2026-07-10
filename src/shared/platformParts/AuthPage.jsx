import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BrainCircuit,
  ChevronRight,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Moon,
  Phone,
  Shield,
  Sparkles,
  Sun,
  User
} from '../icons/lucide-shim.jsx';
import { auth, db } from '../../services/firebase';
import { GradeOptions } from '../constants/grades';
import { normalizeEgyptPhone, validateEgyptianPhones } from '../utils/phone';
import { platformNotify, WhatsAppContactButton } from '../core/platformShared.jsx';
import '../../styles/pages/landing.css';
import '../../styles/pages/auth.css';

const arabicLetters = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'س', 'ش', 'ص', 'ض', 'ط', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'لا'];

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

function ArabicLettersField() {
  return (
    <div className="neo-arabic-field neo-auth-letters" aria-hidden="true">
      {arabicLetters.map((letter, index) => (
        <span key={`${letter}-${index}`} style={{ '--i': index, '--x': `${(index * 8.2) % 108 - 8}%`, '--y': `${(index * 13.7) % 104 - 2}%` }}>{letter}</span>
      ))}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button type="button" onClick={onToggle} className="neo-theme-toggle" aria-label="تبديل الوضع النهاري والليلي">
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span>{isDark ? 'نهاري' : 'ليلي'}</span>
    </button>
  );
}

function AuthInput({ icon: Icon, ...props }) {
  return (
    <label className="neo-auth-input">
      <Icon size={18} />
      <input {...props} />
    </label>
  );
}

export const AuthPage = ({ onBack, initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(() => initialMode === 'register');
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('nahhas-public-theme') : null) || 'light');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });
  const [platformSettings, setPlatformSettings] = useState({ registrationOpen: true, platformName: 'منصة النحاس التعليمية', welcomeMessage: '' });

  useEffect(() => {
    setIsRegister(initialMode === 'register');
  }, [initialMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('nahhas-public-theme', theme);
  }, [theme]);

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
          name: formData.name.trim(),
          email: formData.email.trim(),
          grade: formData.grade,
          phone: validation.normalizedStudentPhone,
          parentPhone: validation.normalizedParentPhone,
          role: 'student',
          status: 'pending',
          subscriptionStatus: 'free',
          subscriptionExpiry: null,
          createdAt: new Date()
        });
        platformNotify('تم إنشاء الحساب. انتظر تفعيل الإدارة.', 'success');
      } else {
        await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
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
      platformNotify('اكتب الإيميل أولًا حتى نرسل الطلب للإدارة.');
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
        updatedAt: serverTimestamp()
      });
      platformNotify('تم إرسال طلب تغيير كلمة السر للإدارة. سيتم التواصل معك بعد المراجعة.', 'success');
    } catch (error) {
      platformNotify('تعذر إرسال الطلب الآن، تواصل مع الإدارة عبر واتساب.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const headline = isRegister ? 'افتح بوابة الطالب الجديدة.' : 'ارجع لمساحتك الدراسية.';
  const subtitle = isRegister
    ? 'سجّل بياناتك الأساسية، وبعد موافقة الإدارة تبدأ رحلة منظمة مبنية على الصف والمحتوى المتاح لك.'
    : 'كل درس وواجب واختبار في لوحة واحدة واضحة — لأن المتاهات مكانها الروايات مش منصة تعليمية.';

  return (
    <div className={`neo-public-page neo-auth-page neo-public-${theme}`} dir="rtl">
      <ArabicLettersField />
      <div className="neo-orb neo-orb-one" />
      <div className="neo-orb neo-orb-two" />
      <WhatsAppContactButton />

      <header className="neo-auth-header">
        <button type="button" onClick={onBack} className="neo-back-button">
          <ChevronRight size={18} />
          الصفحة الرئيسية
        </button>
        <ThemeToggle theme={theme} onToggle={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} />
      </header>

      <main className="neo-auth-shell">
        <motion.aside
          className="neo-auth-story"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <span className="neo-pill"><Sparkles size={16} /> بوابة الطالب الجديدة</span>
          <h1>{headline}</h1>
          <p>{subtitle}</p>
          <div className="neo-auth-points">
            <div><Shield size={20} /><span>حسابات محمية ومراجعة من الإدارة</span></div>
            <div><BrainCircuit size={20} /><span>متابعة ذكية لمستوى الطالب</span></div>
            <div><KeyRound size={20} /><span>استعادة كلمة السر بطلب مباشر</span></div>
          </div>
        </motion.aside>

        <motion.section
          className="neo-auth-card"
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.08 }}
        >
          <div className="neo-auth-card-head">
            <div className="neo-logo compact"><span className="neo-logo-mark">ن</span></div>
            <div>
              <span>{platformSettings.platformName || (isRegister ? 'إنشاء حساب' : 'تسجيل الدخول')}</span>
              <h2>{isRegister ? 'حساب طالب جديد' : 'مرحبًا بعودتك'}</h2>
            </div>
          </div>

          {platformSettings.welcomeMessage && <p className="neo-auth-message">{platformSettings.welcomeMessage}</p>}
          {isRegister && platformSettings.registrationOpen === false && <div className="neo-auth-alert">التسجيل مغلق حاليًا من الإدارة.</div>}

          <div className="neo-auth-tabs" role="tablist" aria-label="اختيار نوع العملية">
            <button type="button" className={!isRegister ? 'active' : ''} onClick={() => setIsRegister(false)}>دخول</button>
            <button type="button" className={isRegister ? 'active' : ''} onClick={() => setIsRegister(true)}>حساب جديد</button>
          </div>

          <form onSubmit={handleSubmit} className="neo-auth-form">
            {isRegister && (
              <>
                <AuthInput icon={User} required type="text" placeholder="اسم الطالب ثلاثي" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <AuthInput icon={Phone} required type="tel" placeholder="رقم هاتف الطالب" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: normalizeEgyptPhone(e.target.value) })} />
                <AuthInput icon={Phone} required type="tel" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: normalizeEgyptPhone(e.target.value) })} />
                <label className="neo-auth-input">
                  <GraduationCap size={18} />
                  <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })}>
                    <GradeOptions />
                  </select>
                </label>
              </>
            )}
            <AuthInput icon={Mail} required type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <AuthInput icon={Lock} required type="password" placeholder="كلمة السر" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />

            {!isRegister && (
              <button type="button" onClick={handleForgotPassword} disabled={loading} className="neo-forgot-button">
                طلب تغيير كلمة السر من الإدارة
              </button>
            )}

            <button disabled={loading} className="neo-primary-button neo-auth-submit">
              {loading ? <Loader2 className="animate-spin" /> : <>{isRegister ? 'إنشاء الحساب' : 'الدخول للمنصة'} <ArrowLeft size={19} /></>}
            </button>
          </form>
        </motion.section>
      </main>
    </div>
  );
};

export default AuthPage;
