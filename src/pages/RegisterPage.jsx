import { motion } from 'framer-motion';
import { ArrowRight, Building2, Camera, CircleUserRound, GraduationCap, Mail, Phone, User } from 'lucide-react';

export default function RegisterPage({ setCurrentPage }) {
  return (
    <section className="auth-layout register-layout">
      <motion.div className="auth-showcase glow-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <span className="hero-badge"><GraduationCap size={14} /> إنشاء حساب ذكي</span>
        <h2>أنشئ حسابك وابدأ رحلتك</h2>
        <p>
          واجهة تسجيل جديدة بتصميم متوهج، صورة شخصية، أدوار مختلفة، وتفاصيل تبني انطباعًا احترافيًا من أول لحظة.
        </p>
        <div className="auth-showcase-art register-art">
          <div className="avatar-placeholder glow-ring large user-photo">
            <CircleUserRound size={88} />
          </div>
          <div className="feature-token glow-card"><Building2 size={18} /> مؤسسة</div>
          <div className="feature-token glow-card"><User size={18} /> طالب</div>
          <div className="feature-token glow-card"><GraduationCap size={18} /> مدرب</div>
        </div>
      </motion.div>

      <motion.form className="auth-form glow-card big" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <div className="auth-header">
          <div>
            <p className="eyebrow">واجهة إنشاء حساب</p>
            <h3>معلومات التسجيل</h3>
          </div>
          <div className="footer-logo-placeholder glow-ring"><span>LOGO</span></div>
        </div>

        <div className="register-top-grid">
          <div className="upload-box glow-card">
            <Camera size={22} />
            <strong>الصورة الشخصية</strong>
            <p>اسحب أو ارفع الصورة هنا</p>
          </div>
          <div className="fields-grid">
            <label className="field">
              <span>الاسم الكامل</span>
              <div className="field-box"><User size={18} /><input type="text" placeholder="اكتب اسمك" /></div>
            </label>
            <label className="field">
              <span>البريد الإلكتروني</span>
              <div className="field-box"><Mail size={18} /><input type="email" placeholder="name@example.com" /></div>
            </label>
            <label className="field">
              <span>رقم الهاتف</span>
              <div className="field-box"><Phone size={18} /><input type="text" placeholder="05xxxxxxxx" /></div>
            </label>
            <label className="field">
              <span>كلمة المرور</span>
              <div className="field-box"><Mail size={18} /><input type="password" placeholder="••••••••" /></div>
            </label>
          </div>
        </div>

        <div className="role-select-grid">
          <button type="button" className="role-card glow-card active"><GraduationCap size={18} /> طالب</button>
          <button type="button" className="role-card glow-card"><User size={18} /> مدرب</button>
          <button type="button" className="role-card glow-card"><Building2 size={18} /> مؤسسة</button>
        </div>

        <label className="checkbox-line"><input type="checkbox" defaultChecked /> أوافق على الشروط والأحكام وسياسة الخصوصية</label>

        <div className="auth-actions-row">
          <button type="button" className="cta-button wide" onClick={() => setCurrentPage('student')}>
            إنشاء الحساب والدخول
            <ArrowRight size={16} />
          </button>
          <button type="button" className="cta-button ghost wide" onClick={() => setCurrentPage('login')}>
            العودة لتسجيل الدخول
          </button>
        </div>
      </motion.form>
    </section>
  );
}
