import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarDays,
  Camera,
  LayoutDashboard,
  PlayCircle,
  Shield,
  Sparkles,
  Stars,
  UserCircle2,
} from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import { landingFeatures } from '../data/platformData.js';

export default function LandingPage({ setCurrentPage }) {
  return (
    <div className="page-stack">
      <section className="hero-grid">
        <motion.div
          className="hero-copy glow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="hero-badge"><Sparkles size={14} /> منصة جديدة بالكامل</span>
          <h2>تصميم عالمي مبهر لمنصة تعليمية حديثة</h2>
          <p>
            شاشة رئيسية عصرية، أنميشن كثيف، ضوء متواصل حول الحدود، تبويب ذكي، ونظام كامل للطالب
            والأدمن مع دعم الوضع الليلي والنهاري.
          </p>

          <div className="hero-actions">
            <button className="cta-button" type="button" onClick={() => setCurrentPage('student')}>
              تجربة لوحة الطالب
              <ArrowRight size={16} />
            </button>
            <button className="cta-button ghost" type="button" onClick={() => setCurrentPage('admin')}>
              لوحة الأدمن الجديدة
              <LayoutDashboard size={16} />
            </button>
          </div>

          <div className="metrics-row">
            <div className="mini-metric glow-card">
              <strong>+120</strong>
              <span>عنصر واجهة قابل للتوسعة</span>
            </div>
            <div className="mini-metric glow-card">
              <strong>2</strong>
              <span>وضعان: نهاري / ليلي</span>
            </div>
            <div className="mini-metric glow-card">
              <strong>360°</strong>
              <span>تجربة بصرية متكاملة</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual glow-card"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="visual-orbit orbit-1" />
          <div className="visual-orbit orbit-2" />
          <div className="visual-avatar-card glow-card">
            <div className="avatar-placeholder glow-ring large user-photo">
              <UserCircle2 size={72} />
            </div>
            <div>
              <p className="eyebrow">مكان الصورة الشخصية</p>
              <h3>ترحيب حي بالطالب عند الدخول</h3>
              <span>واجهة ترحيبية متحركة + مؤشرات شخصية + أنيميشن لكل قسم.</span>
            </div>
          </div>
          <div className="floating-icon icon-a"><BrainCircuit size={24} /></div>
          <div className="floating-icon icon-b"><CalendarDays size={24} /></div>
          <div className="floating-icon icon-c"><PlayCircle size={24} /></div>
          <div className="logo-band glow-card">
            <div className="footer-logo-placeholder glow-ring"><span>LOGO</span></div>
            <p>منطقة ثابتة لوضع شعار المنصة في منتصف الشاشة الرئيسية.</p>
          </div>
        </motion.div>
      </section>

      <section className="grid-two-columns">
        <div className="glow-card mosaic-panel">
          <SectionHeader
            eyebrow="تجربة المنصة"
            title="إعادة ابتكار كل تبويب وكل نقطة"
            description="تم بناء نظام بصري جديد بحيث كل بطاقة وكل شاشة تملك شخصية مستقلة وحركة متناسقة."
          />

          <div className="mosaic-grid">
            {landingFeatures.map((item, index) => (
              <div key={item.title} className={`mosaic-card glow-card mosaic-${index + 1}`}>
                <span className="eyebrow">{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="page-stack">
          <div className="glow-card info-panel">
            <SectionHeader
              eyebrow="هوية بصرية"
              title="أماكن مخصصة للشعار والصورة الشخصية"
              description="في البداية والمنتصف والنهاية، بالإضافة إلى دعم صور المستخدم في الواجهة والحساب."
            />
            <div className="identity-grid">
              <div className="identity-card glow-card">
                <Camera size={18} />
                <h4>صورة البروفايل</h4>
                <p>عنصر مخصص للصورة الشخصية في الصفحات الحساسة واللوحات الجانبية.</p>
              </div>
              <div className="identity-card glow-card">
                <BadgeCheck size={18} />
                <h4>شعار البداية</h4>
                <p>منطقة بارزة أعلى المنصة لتثبيت الهوية الرئيسية.</p>
              </div>
              <div className="identity-card glow-card">
                <Stars size={18} />
                <h4>شعار المنتصف والنهاية</h4>
                <p>أماكن ثانوية تدعم الترويج والوضوح وتأكيد الانتماء البصري.</p>
              </div>
            </div>
          </div>

          <div className="glow-card info-panel">
            <SectionHeader
              eyebrow="جودة التنفيذ"
              title="أيقونات جديدة وأنيميشن أقوى"
              description="تم إلغاء الأيقونات القديمة غير العاملة، واستبدالها بحزمة أيقونات حديثة مع حركة ناعمة ومتواصلة."
            />
            <div className="bullet-list">
              <div><Shield size={16} /> حدود مضيئة حول البطاقات والعناصر المهمة.</div>
              <div><Sparkles size={16} /> انتقالات ناعمة بين التبويبات والشاشات.</div>
              <div><BrainCircuit size={16} /> بطاقات معلومات وجرافكس أقرب للمنصات العالمية.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
