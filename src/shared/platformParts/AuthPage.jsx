import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { GradeOptions } from '../constants/grades';
import { normalizeEgyptPhone, validateEgyptianPhones } from '../utils/phone';
import { platformNotify } from '../core/platformShared.jsx';
import { openPlatformWhatsApp } from '../core/platform/media.js';
import { Icon, KhatamStar } from '@v2/ui/Icon.jsx';
import { Button, IconButton } from '@v2/ui/kit.jsx';
import { usePrefs } from '@v2/prefs.js';
import '@v2/styles/auth.css';
import nahhasLogo from '../../assets/nahhas-logo-transparent.webp';
import nahhasLogoDark from '../../assets/nahhas-logo-dark.webp';


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

function Field({ icon, label, ...props }) {
  return (
    <label className="nx-field">
      <span>{label}</span>
      <span className="nx-input"><Icon name={icon} />{props.children || <input {...props} />}</span>
    </label>
  );
}

export const AuthPage = ({ onBack, initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(() => initialMode === 'register');
  const { theme, toggleTheme } = usePrefs();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });
  const [platformSettings, setPlatformSettings] = useState({ registrationOpen: true, platformName: 'منصة النحاس التعليمية', welcomeMessage: '' });

  useEffect(() => {
    setIsRegister(initialMode === 'register');
  }, [initialMode]);



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

  const set = (patch) => setFormData((prev) => ({ ...prev, ...patch }));
  const closed = isRegister && platformSettings.registrationOpen === false;

  return (
    <div className="nx ax" dir="rtl">
      <aside className="ax-story">
        <div className="lx-mesh" aria-hidden="true"><i /><i /><i /></div>
        <KhatamStar className="ax-story__star" />
        <div className="ax-story__top">
          <button type="button" className="ax-back" onClick={onBack}><Icon name="chevronRight" />الرئيسية</button>
          <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'} plain onClick={toggleTheme} />
        </div>
        <div className="ax-story__copy">
          <img src={nahhasLogoDark} alt="منصة النحاس" className="ax-story__logo" />
          <h1>{isRegister ? <>ابدأ <span className="cal lx-sheen">صح</span> من النهارده</> : <>أهلاً بيك <span className="cal lx-sheen">تاني</span></>}</h1>
          <p>{isRegister ? 'سجّل بياناتك، وبعد موافقة الإدارة هتلاقي محاضرات صفّك وامتحاناته مستنياك.' : 'كمّل من مكان ما وقفت: المحاضرة اللي ما خلصتهاش، والامتحان اللي جاي، ومستواك.'}</p>
          <ul className="ax-points">
            <li><Icon name="shield" />حسابك محمي وبيتراجع من الإدارة</li>
            <li><Icon name="chart" />مستواك ونقط ضعفك قدامك على طول</li>
            <li><Icon name="users" />ولي الأمر يتابع برقم موبايله</li>
          </ul>
        </div>
      </aside>

      <main className="ax-main">
        <section className="ax-card">
          <img src={theme === 'dark' ? nahhasLogoDark : nahhasLogo} alt="منصة النحاس" className="ax-card__logo" />
          <div className="ax-card__head">
            <h2>{isRegister ? 'حساب طالب جديد' : 'تسجيل الدخول'}</h2>
            <p className="muted">{platformSettings.welcomeMessage || (isRegister ? 'البيانات دي بتوصل للإدارة عشان تفعّل حسابك.' : 'ادخل بالإيميل وكلمة السر.')}</p>
          </div>

          <div className="ax-tabs" role="tablist" aria-label="نوع العملية">
            <button type="button" role="tab" aria-selected={!isRegister} onClick={() => setIsRegister(false)}>دخول</button>
            <button type="button" role="tab" aria-selected={isRegister} onClick={() => setIsRegister(true)}>حساب جديد</button>
            <span className="ax-tabs__thumb" style={{ transform: isRegister ? 'translateX(-100%)' : 'none' }} aria-hidden="true" />
          </div>

          {closed && <div className="ax-alert" role="alert"><Icon name="lock" />التسجيل مقفول دلوقتي من الإدارة. كلّمهم على واتساب لو محتاج حساب.</div>}

          <form onSubmit={handleSubmit} className="ax-form" key={isRegister ? 'r' : 'l'}>
            {isRegister && (
              <>
                <Field icon="user" label="اسم الطالب ثلاثي" required type="text" autoComplete="name" value={formData.name} onChange={(e) => set({ name: e.target.value })} />
                <div className="ax-row">
                  <Field icon="phone" label="موبايل الطالب" required type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={formData.phone} onChange={(e) => set({ phone: normalizeEgyptPhone(e.target.value) })} placeholder="01xxxxxxxxx" />
                  <Field icon="phone" label="موبايل ولي الأمر" required type="tel" inputMode="tel" dir="ltr" value={formData.parentPhone} onChange={(e) => set({ parentPhone: normalizeEgyptPhone(e.target.value) })} placeholder="01xxxxxxxxx" />
                </div>
                <Field icon="grade" label="الصف">
                  <select value={formData.grade} onChange={(e) => set({ grade: e.target.value })}><GradeOptions /></select>
                </Field>
              </>
            )}
            <Field icon="mail" label="الإيميل" required type="email" inputMode="email" autoComplete="email" dir="ltr" value={formData.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" />
            <label className="nx-field">
              <span>كلمة السر</span>
              <span className="nx-input">
                <Icon name="lock" />
                <input required type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} dir="ltr" value={formData.password} onChange={(e) => set({ password: e.target.value })} minLength={6} />
                <button type="button" className="nx-iconbtn nx-iconbtn--plain" aria-label={showPassword ? 'اخفي كلمة السر' : 'اظهر كلمة السر'} onClick={() => setShowPassword((v) => !v)}><Icon name="eye" /></button>
              </span>
              {isRegister && <small>٦ حروف أو أرقام على الأقل.</small>}
            </label>

            {!isRegister && (
              <button type="button" onClick={handleForgotPassword} disabled={loading} className="ax-link">نسيت كلمة السر؟ ابعت طلب للإدارة</button>
            )}

            <Button type="submit" variant="pri" size="l" block disabled={loading || closed} iconEnd={loading ? undefined : 'arrowLeft'} haptics="medium">
              {loading ? <span className="nx-spinner" style={{ width: 22, height: 22, borderWidth: 2.5 }} /> : isRegister ? 'اعمل الحساب' : 'ادخل'}
            </Button>
          </form>

          <button type="button" className="ax-help" onClick={() => openPlatformWhatsApp()}><Icon name="whatsapp" />محتاج مساعدة؟ كلّم الإدارة على واتساب</button>
        </section>
      </main>
    </div>
  );
};

export default AuthPage;
