import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function LoadingScreen({ progress, theme }) {
  const ringStyle = {
    background: `conic-gradient(var(--accent) ${progress * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
  };

  return (
    <motion.div
      className="loader-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <div className="loader-shell glow-card">
        <div className="loader-toggle-badge">
          <span>{theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
        </div>

        <div className="loader-ring" style={ringStyle}>
          <div className="loader-core">
            <div className="brand-mark glow-ring large">
              <span>PE</span>
            </div>
            <h2>Professional Platform</h2>
            <p>جاري تجهيز المنصة الجديدة</p>
            <strong>{progress}%</strong>
          </div>
        </div>

        <div className="loader-copy">
          <span className="eyebrow inline"><Sparkles size={14} /> تجربة افتتاحية</span>
          <h3>نظام تحميل دائري في المنتصف حتى اكتمال التشغيل</h3>
          <p>واجهة محسّنة، حركة مستمرة، أيقونات جديدة، وحدود مضيئة في كل أجزاء المنصة.</p>
        </div>
      </div>
    </motion.div>
  );
}
