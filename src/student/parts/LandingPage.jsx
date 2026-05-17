import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  PlayCircle,
  Video,
  Facebook,
  Code,
  DownloadCloud,
  BookOpen,
  BrainCircuit,
  BarChart3,
  Trophy,
  MessageCircle,
  Star,
  Clock,
  Target,
  Layers,
  Sparkles,
  CheckCircle,
  GraduationCap,
  FileText
} from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import { ModernLogo } from '../../features/home/HomeWidgets';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { WhatsAppContactButton } from '../../shared/core/platformShared.jsx';

const StatCard = ({ icon: Icon, value, label, hint, tone = 'amber' }) => (
  <div className={`nh-landing-stat nh-landing-stat--${tone} nh-animated-border`}>
    <span className="nh-landing-stat__icon"><Icon size={28} /></span>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{hint}</small>
    </div>
  </div>
);

const FeaturePill = ({ icon: Icon, children }) => (
  <span className="nh-landing-pill">
    <Icon size={17} />
    {children}
  </span>
);

const PublicListCard = ({ title, icon: Icon, empty, items, type, onOpen, color = 'amber' }) => (
  <section className={`nh-landing-content-card nh-landing-content-card--${color} nh-animated-border`}>
    <div className="nh-landing-section-head">
      <div>
        <small>{type}</small>
        <h3>{title}</h3>
      </div>
      <span><Icon size={28} /></span>
    </div>
    <div className="nh-landing-content-list">
      {items.length > 0 ? items.map((item, i) => (
        <button key={i} type="button" onClick={() => onOpen(item)} className="nh-landing-content-row">
          <span className="nh-landing-content-row__icon"><Icon size={20} /></span>
          <span className="nh-landing-content-row__text">{item.title}</span>
          <span className="nh-landing-content-row__action">فتح</span>
        </button>
      )) : <p className="nh-landing-empty">{empty}</p>}
    </div>
  </section>
);

export const LandingPage = ({ onAuthClick, installPrompt }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'content'), where('isPublic', '==', true)),
      (snap) => setPublicContent(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setPublicContent([])
    );
    return unsub;
  }, []);

  const openFacebook = () => window.open('https://www.facebook.com/share/17aiUQWKf5/', '_blank');
  const videos = publicContent.filter((c) => c.type === 'video');
  const interactive = publicContent.filter((c) => c.type === 'html');

  return (
    <div className="nh-landing-page min-h-screen" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <div className="nh-landing-bg" aria-hidden="true">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <WhatsAppContactButton />

      <header className="nh-landing-topbar nh-animated-border">
        <div className="nh-landing-brand">
          <ModernLogo />
          <div>
            <strong>منصة النحاس التعليمية</strong>
            <span>تعلّم بذكاء .. تميّز بثقة</span>
          </div>
        </div>
        <nav className="nh-landing-nav" aria-label="روابط المنصة">
          <a href="#features">المميزات</a>
          <a href="#public-content">المحتوى المجاني</a>
          <button type="button" onClick={openFacebook} className="nh-landing-icon-btn" aria-label="Facebook"><Facebook size={19} /></button>
          {installPrompt && (
            <button type="button" onClick={installPrompt} className="nh-landing-install"><DownloadCloud size={18} /> تثبيت</button>
          )}
          <button type="button" onClick={onAuthClick} className="nh-landing-login">دخول الطالب</button>
        </nav>
      </header>

      <main className="nh-landing-main">
        <section className="nh-landing-hero nh-animated-border">
          <div className="nh-landing-visual" aria-hidden="true">
            <div className="nh-landing-monitor nh-animated-border">
              <span className="monitor-play"><PlayCircle size={86} /></span>
              <span className="monitor-spark s1"><Sparkles size={18} /></span>
              <span className="monitor-spark s2"><Star size={18} /></span>
            </div>
            <div className="nh-landing-books">
              <span className="book book-1" />
              <span className="book book-2" />
              <span className="book book-3" />
            </div>
            <div className="nh-landing-cap"><GraduationCap size={54} /></div>
          </div>

          <div className="nh-landing-hero-copy">
            <div className="nh-landing-badge"><Star size={17} /> مسارك المثالي</div>
            <h1>اللغة العربية <span>لعبتك</span></h1>
            <p>منصة تعليمية متكاملة للمرحلة الإعدادية والثانوية، تجمع الشرح والاختبارات والملفات والمتابعة الذكية في تجربة واحدة.</p>
            <div className="nh-landing-pills" id="features">
              <FeaturePill icon={BookOpen}>مناهج شاملة</FeaturePill>
              <FeaturePill icon={BrainCircuit}>اختبارات ذكية</FeaturePill>
              <FeaturePill icon={BarChart3}>متابعة مستمرة</FeaturePill>
            </div>
            <div className="nh-landing-actions">
              <button type="button" onClick={onAuthClick} className="nh-landing-primary"><PlayCircle size={20} /> استكمال التعلم</button>
              <button type="button" onClick={onAuthClick} className="nh-landing-secondary"><Clock size={20} /> متابعة من آخر درس</button>
            </div>
            <div className="nh-landing-progress nh-animated-border">
              <div><span>تقدمك الحالي</span><strong>65%</strong></div>
              <i><b style={{ width: '65%' }} /></i>
            </div>
          </div>
        </section>

        <section className="nh-landing-stats" aria-label="إحصائيات المنصة">
          <StatCard icon={Trophy} value="8" label="إنجازات" hint="شارات وتحديات" tone="amber" />
          <StatCard icon={BookOpen} value="36" label="درس" hint="شرح منظم" tone="sky" />
          <StatCard icon={BrainCircuit} value="12" label="اختبار" hint="قياس مستواك" tone="violet" />
          <StatCard icon={MessageCircle} value="24/7" label="دعم" hint="متابعة مستمرة" tone="emerald" />
        </section>

        <section className="nh-landing-journey nh-animated-border">
          <div className="nh-landing-section-head">
            <div>
              <small>تعلم بنظام واضح</small>
              <h2>كل ما تحتاجه في لوحة واحدة</h2>
            </div>
            <span><Target size={30} /></span>
          </div>
          <div className="nh-landing-journey-grid">
            {[
              { icon: Video, title: 'محاضرات مرتبة', text: 'شاهد الدروس بجودة واضحة وخطوات سهلة.' },
              { icon: FileText, title: 'ملفات وملازم', text: 'ملخصات وملفات مراجعة قابلة للوصول السريع.' },
              { icon: CheckCircle, title: 'اختبارات قصيرة', text: 'تدريب مستمر ونتائج تساعدك تعرف مستواك.' },
              { icon: Layers, title: 'مسار تعليمي', text: 'انتقال ذكي بين الدرس والواجب والمراجعة.' }
            ].map((item) => (
              <article key={item.title} className="nh-landing-mini-card nh-animated-border">
                <span><item.icon size={28} /></span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="public-content" className="nh-landing-content-grid">
          <PublicListCard
            title="فيديوهات للجميع"
            type="مشاهدة مجانية"
            icon={Video}
            empty="لا توجد فيديوهات عامة حالياً"
            items={videos}
            onOpen={setPlayingVideo}
            color="sky"
          />
          <PublicListCard
            title="تفاعلي للجميع"
            type="تجربة تفاعلية"
            icon={Code}
            empty="لا يوجد محتوى تفاعلي عام حالياً"
            items={interactive}
            onOpen={setPlayingHtml}
            color="violet"
          />
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
