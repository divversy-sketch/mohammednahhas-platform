import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  CheckCircle,
  DownloadCloud,
  Facebook,
  Feather,
  Lightbulb,
  Moon,
  PlayCircle,
  Radio,
  Sparkles,
  Sun,
  Target,
  Video,
  Wand2
} from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';
import SecureVideoPlayer from '@features/video-security/player/SecureVideoPlayer.jsx';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { WhatsAppContactButton } from '../../shared/core/platformShared.jsx';
import '../../styles/pages/landing.css';
import nahhasLogo from '../../assets/nahhas-logo-transparent.png';
import AnimatedLogo from '../../shared/ui/AnimatedLogo.jsx';

const arabicLetters = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'لا', 'ة'];

const gradeNames = {
  '1prep': 'الأول الإعدادي',
  '2prep': 'الثاني الإعدادي',
  '3prep': 'الثالث الإعدادي',
  '1sec': 'الأول الثانوي',
  '2sec': 'الثاني الثانوي',
  '3sec': 'الثالث الثانوي'
};

const contentTypeLabels = {
  video: 'فيديو شرح',
  html: 'نشاط تفاعلي',
  pdf: 'ملف PDF',
  file: 'ملف تدريبي',
  exam: 'تدريب',
  assignment: 'واجب'
};

function ArabicLettersField() {
  return (
    <div className="neo-arabic-field" aria-hidden="true">
      {arabicLetters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          style={{
            '--i': index,
            '--x': `${(index * 10.8) % 112 - 8}%`,
            '--y': `${(index * 17.4) % 108 - 4}%`
          }}
        >
          {letter}
        </span>
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

function NeoLogo({ large = false }) {
  return (
    <AnimatedLogo
      src={nahhasLogo}
      alt="منصة النحاس"
      wrapperClassName={`neo-logo ${large ? 'neo-logo--large' : ''}`}
      imgClassName="neo-logo-image"
    />
  );
}

function typeOfContent(item) {
  const type = String(item?.type || item?.contentType || '').toLowerCase();
  const mime = String(item?.mimeType || '').toLowerCase();
  if (type.includes('video')) return 'video';
  if (type.includes('html') || item?.htmlContent) return 'html';
  if (type.includes('pdf') || mime.includes('pdf')) return 'pdf';
  if (type.includes('exam')) return 'exam';
  if (type.includes('assignment') || type.includes('homework')) return 'assignment';
  return 'file';
}

function formatGrade(value) {
  return gradeNames[value] || value || 'كل الصفوف';
}

const featureCards = [
  { icon: BrainCircuit, title: 'مسار تعلم ذكي', text: 'الطالب لا يرى محتوى عشوائيًا؛ يرى رحلة واضحة من الشرح للتدريب ثم المراجعة.' },
  { icon: Feather, title: 'لغة عربية أخف', text: 'النحو والبلاغة والقراءة تُقدَّم في تجربة تفاعلية حديثة، لا بطريقة تقليدية مُرهِقة.' },
  { icon: Target, title: 'تقدّم واضح للطالب', text: 'كل خطوة داخل المنصة تقرّب الطالب من فهم أعمق، ومذاكرة أهدأ، وثقة أكبر قبل الامتحان.' }
];

const journey = [
  ['01', 'افهم', 'شرح قصير ومباشر قبل القاعدة.'],
  ['02', 'طبّق', 'تدريب متدرج من السهل للنموذج الكامل.'],
  ['03', 'راجع', 'مراجعة ذكية حسب أخطاء الطالب لا حسب المزاج.']
];

export const LandingPage = ({ onAuthClick, onRegisterClick, installPrompt }) => {
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('nahhas-public-theme') : null) || 'light');
  const [publicContent, setPublicContent] = useState([]);
  const [publicFiles, setPublicFiles] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nahhas-public-theme', theme);
      document.documentElement.dataset.publicTheme = theme;
    }
  }, [theme]);

  useEffect(() => {
    const publicQuery = query(collection(db, 'content'), where('isPublic', '==', true), limit(18));
    const unsubscribe = onSnapshot(publicQuery, (snapshot) => {
      setPublicContent(snapshot.docs.map((docSnap) => ({ id: docSnap.id, source: 'content', ...docSnap.data() })));
    }, () => setPublicContent([]));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const filesQuery = query(collection(db, 'files'), where('isPublic', '==', true), limit(12));
    const unsubscribe = onSnapshot(filesQuery, (snapshot) => {
      setPublicFiles(snapshot.docs.map((docSnap) => ({ id: docSnap.id, source: 'files', type: 'file', ...docSnap.data() })));
    }, () => setPublicFiles([]));
    return unsubscribe;
  }, []);

  const liveItems = useMemo(() => [...publicContent, ...publicFiles].filter(Boolean), [publicContent, publicFiles]);
  const highlightedItems = useMemo(() => liveItems.slice(0, 8), [liveItems]);
  const videos = useMemo(() => liveItems.filter((item) => typeOfContent(item) === 'video').slice(0, 4), [liveItems]);
  const interactiveItems = useMemo(() => liveItems.filter((item) => ['html', 'exam', 'assignment'].includes(typeOfContent(item))).slice(0, 4), [liveItems]);
  const fileItems = useMemo(() => liveItems.filter((item) => ['pdf', 'file'].includes(typeOfContent(item))).slice(0, 4), [liveItems]);

  const openFacebook = () => window.open('https://www.facebook.com/share/17aiUQWKf5/', '_blank', 'noopener,noreferrer');
  const goLogin = () => onAuthClick?.('login');
  const goRegister = () => (onRegisterClick || onAuthClick)?.('register');

  const openItem = (item) => {
    const itemType = typeOfContent(item);
    if (itemType === 'video') {
      setPlayingVideo(item);
      return;
    }
    if (itemType === 'html') {
      setPlayingHtml(item);
      return;
    }
    const url = item.url || item.fileUrl || item.downloadURL || item.downloadUrl || item.storageUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`neo-public-page neo-public-${theme}`} dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <ArabicLettersField />
      <div className="neo-noise" aria-hidden="true" />
      <div className="neo-orb neo-orb-one" />
      <div className="neo-orb neo-orb-two" />
      <div className="neo-orb neo-orb-three" />
      <WhatsAppContactButton />

      <header className="neo-public-nav">
        <NeoLogo />
        <nav className="neo-nav-links" aria-label="روابط الصفحة الرئيسية">
          <a href="#experience">التجربة</a>
          <a href="#content">المحتوى المفتوح</a>
          <a href="#journey">رحلة الطالب</a>
        </nav>
        <div className="neo-nav-actions">
          {installPrompt && (
            <button type="button" onClick={installPrompt} className="neo-icon-button neo-install-button">
              <DownloadCloud size={18} />
              <span>ثبّت المنصة</span>
            </button>
          )}
          <button type="button" onClick={openFacebook} className="neo-icon-button" aria-label="Facebook">
            <Facebook size={18} />
          </button>
          <ThemeToggle theme={theme} onToggle={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} />
          <button type="button" onClick={goLogin} className="neo-ghost-button">دخول</button>
        </div>
      </header>

      <main className="neo-public-main">
        <section className="neo-hero-grid" id="experience">
          <motion.div
            className="neo-hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <span className="neo-pill"><Sparkles size={16} /> منصة تعليمية حديثة للغة العربية</span>
            <div className="neo-hero-brand">
              <AnimatedLogo src={nahhasLogo} alt="شعار منصة النحاس" wrapperClassName="neo-hero-brand__logo" imgClassName="neo-hero-brand__image" />
            </div>
            <h1>العربية أوضح، والتعلّم أذكى، والنتيجة أقرب.</h1>
            <p>
              منصة النحاس تمنح الطالب تجربة تعليمية واضحة ومنظمة، تبدأ من فهم القاعدة، ثم التطبيق العملي، ثم المراجعة الذكية بثقة وهدوء.
            </p>
            <div className="neo-hero-actions">
              <button type="button" onClick={goRegister} className="neo-primary-button">
                إنشاء حساب طالب
                <ArrowLeft size={19} />
              </button>
              <button type="button" onClick={goLogin} className="neo-secondary-button">
                تسجيل الدخول
              </button>
            </div>
            <div className="neo-stat-strip">
              <div><strong>{liveItems.length || '—'}</strong><span>عنصر مفتوح من ملفات ومحتوى المنصة</span></div>
              <div><strong>{videos.length || '—'}</strong><span>فيديوهات يمكن تجربتها قبل الدخول</span></div>
              <div><strong>{interactiveItems.length || '—'}</strong><span>تدريبات وأنشطة تفاعلية متاحة</span></div>
            </div>
          </motion.div>

          <motion.div
            className="neo-hero-showcase"
            initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.08 }}
          >
            <div className="neo-showcase-glow" />
            <div className="neo-showcase-topline">
              <span><Radio size={16} /> Live Content</span>
              <strong>من داخل المنصة</strong>
            </div>
            <div className="neo-device-frame">
              <div className="neo-device-bar"><i /><i /><i /></div>
              {(highlightedItems.length ? highlightedItems.slice(0, 3) : [
                { title: 'شرح نص القراءة', type: 'video', grade: '1sec' },
                { title: 'تدريب بلاغة تفاعلي', type: 'html', grade: '2sec' },
                { title: 'مراجعة ليلة الامتحان', type: 'pdf', grade: '3sec' }
              ]).map((item, index) => {
                const itemType = typeOfContent(item);
                const Icon = itemType === 'video' ? Video : itemType === 'html' ? Wand2 : BookOpen;
                return (
                  <button key={item.id || `${item.title}-${index}`} type="button" onClick={() => openItem(item)} className={`neo-learning-card ${index === 0 ? 'active' : ''}`}>
                    <Icon size={22} />
                    <div>
                      <strong>{item.title || item.name || 'محتوى مفتوح'}</strong>
                      <span>{contentTypeLabels[itemType]} · {formatGrade(item.grade)}</span>
                    </div>
                    <CheckCircle size={20} />
                  </button>
                );
              })}
              <div className="neo-mini-board">
                <div>
                  <span>الذكاء هنا في الترتيب</span>
                  <strong>الشرح ← التدريب ← المراجعة</strong>
                </div>
                <Lightbulb size={24} />
              </div>
            </div>
          </motion.div>
        </section>

        <section className="neo-feature-grid" aria-label="مميزات المنصة">
          {featureCards.map(({ icon: Icon, title, text }) => (
            <article className="neo-feature-card" key={title}>
              <div className="neo-feature-icon"><Icon size={23} /></div>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="neo-public-content" id="content">
          <div className="neo-section-heading">
            <span>جرّب المنصة من الداخل</span>
            <h2>نماذج مفتوحة تمنحك إحساس التجربة قبل الدخول</h2>
          </div>
          <div className="neo-content-grid">
            <ContentColumn title="فيديوهات مفتوحة" icon={Video} items={videos} empty="لا توجد فيديوهات عامة حاليًا." onOpen={openItem} />
            <ContentColumn title="أنشطة وتدريبات" icon={Wand2} items={interactiveItems} empty="لا توجد أنشطة عامة حاليًا." onOpen={openItem} />
            <ContentColumn title="ملفات ومراجعات" icon={BookOpen} items={fileItems} empty="لا توجد ملفات عامة حاليًا." onOpen={openItem} wide />
          </div>
        </section>

        <section className="neo-journey" id="journey">
          {journey.map(([step, title, text]) => (
            <article key={step}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

function ContentColumn({ title, icon: Icon, items, empty, onOpen, wide = false }) {
  return (
    <article className={`neo-content-card ${wide ? 'neo-content-card-wide' : ''}`}>
      <h3><Icon size={22} /> {title}</h3>
      <div className="neo-content-list">
        {items.length ? items.map((item) => {
          const itemType = typeOfContent(item);
          return (
            <button key={item.id || item.title || item.name} type="button" onClick={() => onOpen(item)}>
              <PlayCircle size={19} />
              <span>{item.title || item.name || item.fileName || 'محتوى مفتوح'}</span>
              <small>{contentTypeLabels[itemType]}</small>
            </button>
          );
        }) : <p>{empty}</p>}
      </div>
    </article>
  );
}

export default LandingPage;
