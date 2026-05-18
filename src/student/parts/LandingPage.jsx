import { useState, useEffect } from 'react';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PlayCircle, Video, Facebook, Code, DownloadCloud } from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { WhatsAppContactButton } from '../../shared/core/platformShared.jsx';

const courses = [
  { title: 'البرمجة بلغة بايثون', tag: 'برمجة', meta: '12 ساعة', rate: '4.9', icon: '</>' },
  { title: 'تصميم واجهات المستخدم UI/UX', tag: 'تصميم', meta: '10 ساعات', rate: '4.8', icon: 'UI' },
  { title: 'التسويق الرقمي من الصفر', tag: 'تسويق', meta: '8 ساعات', rate: '4.9', icon: '↗' },
  { title: 'التصوير الفوتوغرافي الاحترافي', tag: 'إبداع', meta: '6 ساعات', rate: '4.7', icon: '◉' },
];

const benefits = [
  ['شهادات معتمدة', 'تعزز سيرتك المهنية'],
  ['تعلم مرن', 'في أي وقت ومن أي مكان'],
  ['محتوى احترافي', 'من خبراء في المجال'],
  ['دعم مستمر', 'متابعة فنية وتعليمية'],
];

const stats = [
  ['+120K', 'طالب وطالبة'],
  ['+850', 'درس ودورة'],
  ['+250', 'ملف ومصدر'],
  ['+95%', 'رضا الطلاب'],
];

export const LandingPage = ({ onAuthClick, installPrompt }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'content'), where('isPublic', '==', true)),
      (snapshot) => setPublicContent(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );
    return unsubscribe;
  }, []);

  const openFacebook = () => window.open('https://www.facebook.com/share/17aiUQWKf5/', '_blank');
  const publicVideos = publicContent.filter((item) => item.type === 'video').slice(0, 3);
  const publicHtmls = publicContent.filter((item) => item.type === 'html').slice(0, 3);

  return (
    <div className="nh-landing min-h-screen font-['Cairo']" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <WhatsAppContactButton />

      <div className="nh-aurora" aria-hidden="true" />
      <div className="nh-stars" aria-hidden="true" />

      <nav className="nh-landing-nav nh-glow-frame max-w-7xl mx-auto">
        <button onClick={onAuthClick} className="nh-primary-btn">تسجيل الدخول</button>
        <div className="hidden lg:flex items-center gap-7 text-sm font-black text-slate-300">
          <a href="#home" className="text-cyan-200">الرئيسية</a>
          <a href="#courses">الدورات</a>
          <a href="#features">المميزات</a>
          <a href="#public">المحتوى المجاني</a>
          <a href="#testimonials">آراء الطلاب</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openFacebook} className="nh-icon-action" aria-label="Facebook"><Facebook size={18} /></button>
          {installPrompt && <button onClick={installPrompt} className="nh-icon-action hidden sm:inline-flex" aria-label="تثبيت"><DownloadCloud size={18} /></button>}
          <div className="text-right">
            <p className="text-sm font-black text-white">منصة النحاس</p>
            <p className="text-[11px] font-bold text-cyan-200">التعليمية</p>
          </div>
          <div className="nh-logo-mark">N</div>
        </div>
      </nav>

      <main id="home" className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-10 py-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="order-2 lg:order-1 space-y-7 text-center lg:text-right">
            <span className="nh-kicker-dark">منصة النحاس التعليمية</span>
            <h1 className="nh-hero-title">تعلّم اليوم،<br />وابنِ مستقبلك</h1>
            <p className="mx-auto max-w-2xl text-base md:text-xl font-bold leading-9 text-slate-300 lg:mx-0">
              تجربة تعليمية عربية فاخرة تجمع الدروس، الاختبارات، المتابعة الذكية، والجرافيكس المتحرك في واجهة واحدة مريحة للعين على الكمبيوتر والتابلت والهاتف.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
              <button onClick={onAuthClick} className="nh-primary-btn nh-primary-btn--large">ابدأ التعلم الآن</button>
              <a href="#courses" className="nh-secondary-btn">استكشف الدورات</a>
            </div>
            <div id="features" className="grid grid-cols-2 gap-3 pt-2 md:grid-cols-4">
              {benefits.map(([title, text]) => (
                <div key={title} className="nh-mini-card nh-orbit-card">
                  <span className="nh-mini-dot" />
                  <p className="font-black text-white">{title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="nh-hero-visual nh-glow-frame">
              <div className="nh-holo-stage">
                <div className="nh-orbit nh-orbit--one" />
                <div className="nh-orbit nh-orbit--two" />
                <div className="nh-holo-logo">N</div>
                <div className="nh-holo-panel nh-holo-panel--a">درس مباشر</div>
                <div className="nh-holo-panel nh-holo-panel--b">+95%</div>
                <div className="nh-holo-panel nh-holo-panel--c">اختبار ذكي</div>
              </div>
            </div>
          </div>
        </section>

        <section id="courses" className="nh-section-space">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="nh-kicker-dark">دورات مميزة</span>
              <h2 className="nh-section-heading">محتوى مرتب… مش كرنفال أزرار</h2>
              <p className="mt-2 max-w-2xl font-bold text-slate-400">كروت واضحة بإضاءات دائمة، حركة محسوبة، ومعلومات سريعة تساعد الطالب يقرر فورًا.</p>
            </div>
            <button onClick={onAuthClick} className="nh-secondary-btn">عرض كل الدورات</button>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course, index) => (
              <article key={course.title} className="nh-course-card nh-orbit-card" style={{ '--delay': `${index * -2.5}s` }}>
                <div className="nh-course-art"><span>{course.icon}</span></div>
                <span className="nh-course-tag">{course.tag}</span>
                <h3>{course.title}</h3>
                <div className="mt-5 flex items-center justify-between text-sm font-black text-slate-300">
                  <span>{course.meta}</span>
                  <span className="text-amber-300">★ {course.rate}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="nh-stats nh-glow-frame">
          {stats.map(([value, label]) => (
            <div key={label}>
              <p className="text-3xl font-black text-cyan-100">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
            </div>
          ))}
        </section>

        <section id="public" className="nh-section-space grid gap-5 lg:grid-cols-2">
          <PublicContentCard title="فيديوهات مجانية" icon={<Video />} empty="لا توجد فيديوهات عامة حاليًا" items={publicVideos} actionLabel="مشاهدة" onOpen={setPlayingVideo} />
          <PublicContentCard title="محتوى تفاعلي مجاني" icon={<Code />} empty="لا يوجد محتوى تفاعلي عام حاليًا" items={publicHtmls} actionLabel="تشغيل" onOpen={setPlayingHtml} />
        </section>

        <section id="testimonials" className="nh-section-space">
          <h2 className="nh-section-heading text-center">ماذا يقول طلابنا</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {['الواجهة مريحة جدًا وسهّلت عليّ متابعة الدروس.', 'الدروس والاختبارات في مكان واحد… الموضوع بقى منظم.', 'الشكل الجديد تحفة، والضوء المتحرك عامل هيبة محترمة.'].map((text, index) => (
              <div key={text} className="nh-testimonial nh-orbit-card" style={{ '--delay': `${index * -3}s` }}>
                <p>“{text}”</p>
                <strong>طالب في منصة النحاس</strong>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

function PublicContentCard({ title, icon, empty, items, actionLabel, onOpen }) {
  return (
    <div className="nh-public-card nh-orbit-card">
      <h3 className="flex items-center gap-2 text-xl font-black text-white">{icon}{title}</h3>
      <div className="mt-5 space-y-3">
        {items.length > 0 ? items.map((item) => (
          <button key={item.id || item.title} onClick={() => onOpen(item)} className="nh-public-item">
            <span className="flex min-w-0 items-center gap-3"><PlayCircle className="shrink-0 text-cyan-300" size={20} /><span className="truncate">{item.title}</span></span>
            <span>{actionLabel}</span>
          </button>
        )) : <p className="text-sm font-bold text-slate-400">{empty}</p>}
      </div>
    </div>
  );
}

export default LandingPage;
