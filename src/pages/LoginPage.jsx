import { motion } from 'framer-motion';
import { ArrowRight, CircleUserRound, LockKeyhole, Mail, UserRoundPlus } from 'lucide-react';

export default function LoginPage({ setCurrentPage }) {
  return (
    <section className="auth-layout">
      <motion.div className="auth-showcase glow-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <span className="hero-badge"><UserRoundPlus size={14} /> واجهة دخول جديدة</span>
        <h2>مرحبًا بعودتك</h2>
        <p>
          تصميم دخول أنيق مع هدوء بصري، عناصر متوهجة، مساحة للشعار، وصورة بروفايل واضحة.
        </p>
        <div className="auth-showcase-art">
          <div className="avatar-placeholder glow-ring large user-photo">
            <CircleUserRound size={88} />
          </div>
          <div className="auth-rings ring-a" />
          <div className="auth-rings ring-b" />
        </div>
        <div className="auth-pill-list">
          <span>تجربة سلسة</span>
          <span>وضع نهاري / ليلي</span>
          <span>تأثيرات ترحيبية</span>
        </div>
      </motion.div>

      <motion.form className="auth-form glow-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="auth-header">
          <div className="footer-logo-placeholder glow-ring"><span>LOGO</span></div>
          <div>
            <p className="eyebrow">مكان اللوجو</p>
            <h3>تسجيل الدخول</h3>
          </div>
        </div>

        <label className="field">
          <span>البريد الإلكتروني</span>
          <div className="field-box">
            <Mail size={18} />
            <input type="email" placeholder="name@example.com" />
          </div>
        </label>

        <label className="field">
          <span>كلمة المرور</span>
          <div className="field-box">
            <LockKeyhole size={18} />
            <input type="password" placeholder="••••••••••" />
          </div>
        </label>

        <div className="auth-row">
          <label className="checkbox-line"><input type="checkbox" defaultChecked /> تذكرني</label>
          <button type="button" className="link-button">نسيت كلمة المرور؟</button>
        </div>

        <button type="button" className="cta-button wide" onClick={() => setCurrentPage('student')}>
          الدخول إلى لوحة الطالب
          <ArrowRight size={16} />
        </button>

        <button type="button" className="cta-button ghost wide" onClick={() => setCurrentPage('admin')}>
          الدخول إلى لوحة الأدمن
          <ArrowRight size={16} />
        </button>

        <div className="auth-footer-line">
          <span>ليس لديك حساب؟</span>
          <button type="button" className="link-button" onClick={() => setCurrentPage('register')}>
            إنشاء حساب جديد
          </button>
        </div>
      </motion.form>
    </section>
  );
}
