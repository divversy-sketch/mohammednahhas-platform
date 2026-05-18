import { useState, useEffect } from 'react';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PlayCircle, Video, Facebook, Code, DownloadCloud, CheckCircle, Clock3, Headphones, GraduationCap } from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';

import { ModernLogo, FloatingArabicBackground, WisdomBox } from '../../features/home/HomeWidgets';

import InteractiveViewer from '../../features/content/InteractiveViewer';

import { WhatsAppContactButton } from '../../shared/core/platformShared.jsx';

const landingFeatures = [
  { title: 'شرح منظم', text: 'دروس مرتبة حسب المرحلة والمستوى', icon: GraduationCap },
  { title: 'تعلّم مرن', text: 'تابع من الموبايل أو الكمبيوتر', icon: Clock3 },
  { title: 'متابعة ذكية', text: 'اختبارات وواجبات تقيس مستواك', icon: CheckCircle },
  { title: 'دعم سريع', text: 'تواصل ومساعدة وقت ما تحتاج', icon: Headphones },
];

const landingStats = [
  ['دروس تفاعلية', 'فيديوهات وملفات منظمة'],
  ['اختبارات ذكية', 'نتائج ومراجعة أخطاء'],
  ['تجربة موبايل', 'تصميم مناسب لكل الأجهزة'],
];

export const LandingPage = ({ onAuthClick, installPrompt }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);

  useEffect(() => {
    const u = onSnapshot(
      query(collection(db, 'content'), where('isPublic', '==', true)),
      (s) => setPublicContent(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return u;
  }, []);

  const openFacebook = () => window.open('https://www.facebook.com/share/17aiUQWKf5/', '_blank');
  const publicVideos = publicContent.filter((c) => c.type === 'video');
  const publicHtml = publicContent.filter((c) => c.type === 'html');

  return (
    <div className="landing-polish min-h-screen font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <WhatsAppContactButton />

      <nav className="landing-nav relative z-10 flex justify-between items-center p-3 md:p-4 max-w-7xl mx-auto glass-panel mt-4 rounded-full mx-2 md:mx-4 shadow-lg">
        <div className="flex items-center gap-2 md:gap-3">
          <ModernLogo />
          <div className="hidden sm:block text-right leading-tight">
            <span className="block text-lg md:text-2xl font-black font-arabic text-amber-900">منصة النحاس</span>
            <span className="text-xs md:text-sm font-bold text-slate-500">تعلم عربي بشكل أذكى</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-sm font-black text-slate-600">
          <a href="#home" className="landing-link">الرئيسية</a>
          <a href="#free" className="landing-link">محتوى مجاني</a>
          <a href="#features" className="landing-link">المميزات</a>
          <a href="#start" className="landing-link">ابدأ الآن</a>
        </div>
        <div className="flex gap-2 md:gap-3 items-center">
          {installPrompt && (
            <button onClick={installPrompt} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/20 transition items-center gap-2">
              <DownloadCloud size={18} /> تثبيت
            </button>
          )}
          <button onClick={openFacebook} className="landing-social-btn bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50" aria-label="Facebook">
            <Facebook size={20} />
          </button>
          <button onClick={onAuthClick} className="landing-login-btn bg-slate-900 text-white px-4 md:px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-slate-500/50 transition transform hover:-translate-y-0.5 text-sm md:text-base">
            دخول الطالب
          </button>
        </div>
      </nav>

      <main id="home" className="relative z-10 px-4 mt-10 max-w-7xl mx-auto">
        <section className="landing-hero grid items-center gap-8 md:gap-10 lg:grid-cols-[1.05fr_0.95fr] text-center lg:text-right">
          <div className="space-y-6">
            <span className="landing-badge">منصة تعليمية للمرحلة الإعدادية والثانوية</span>
            <h1 className="landing-title text-4xl md:text-7xl font-black text-slate-900 leading-tight">
              اللغة العربية <span className="text-amber-600">لعبتك</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-9 font-bold">
              نفس روح التصميم الحالي، لكن بترتيب أوضح، ألوان أهدى، كروت أنضف، وحركة خفيفة تخلي المنصة حية من غير ما تدوّخ الطالب قبل الحصة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button id="start" onClick={onAuthClick} className="landing-cta bg-amber-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl text-lg md:text-xl font-bold shadow-xl hover:bg-amber-700 transition transform hover:-translate-y-1">
                اشترك الآن 🚀
              </button>
              <a href="#free" className="landing-ghost-btn px-8 md:px-10 py-3 md:py-4 rounded-2xl text-lg md:text-xl font-bold transition">
                جرّب المحتوى المجاني
              </a>
            </div>
            {installPrompt && (
              <div className="md:hidden mt-6">
                <button onClick={installPrompt} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto text-sm">
                  <DownloadCloud size={18} /> تثبيت المنصة على هاتفك
                </button>
              </div>
            )}
          </div>

          <div className="landing-hero-card glass-panel rounded-[2rem] p-5 md:p-7 shadow-xl">
            <div className="landing-orb" aria-hidden="true" />
            <div className="relative z-10">
              <WisdomBox />
              <div id="features" className="grid grid-cols-2 gap-3 mt-5">
                {landingFeatures.map(({ title, text, icon: Icon }) => (
                  <div key={title} className="landing-feature-card">
                    <Icon size={22} />
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-stats-grid my-10 md:my-14 grid gap-4 md:grid-cols-3">
          {landingStats.map(([title, text]) => (
            <div key={title} className="landing-stat-card glass-panel rounded-3xl p-5 text-right">
              <p className="text-xl font-black text-slate-900">{title}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{text}</p>
            </div>
          ))}
        </section>

        <div id="free" className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-10 mb-20 px-2">
          <PublicContentPanel title="فيديوهات للجميع" color="blue" icon={<Video />} empty="لا توجد فيديوهات عامة حالياً" items={publicVideos} onOpen={setPlayingVideo} actionLabel="مشاهدة" itemIcon={<PlayCircle className="text-amber-500 shrink-0" />} />
          <PublicContentPanel title="تفاعلي للجميع" color="purple" icon={<Code />} empty="لا يوجد محتوى تفاعلي عام حالياً" items={publicHtml} onOpen={setPlayingHtml} actionLabel="تشغيل" itemIcon={<Code className="text-purple-500 shrink-0" />} />
        </div>
      </main>
    </div>
  );
};

function PublicContentPanel({ title, color, icon, empty, items, onOpen, actionLabel, itemIcon }) {
  return (
    <div className="landing-content-panel bg-white/80 backdrop-blur p-4 md:p-6 rounded-3xl border border-white shadow-sm overflow-hidden">
      <h3 className={`text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 ${color === 'blue' ? 'text-blue-700' : 'text-purple-700'}`}>{icon} {title}</h3>
      <div className="space-y-4">
        {items.length > 0 ? items.map((item, i) => (
          <button key={item.id || i} className="landing-content-item flex w-full items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 text-right" onClick={() => onOpen(item)}>
            <span className="flex items-center gap-3 overflow-hidden">
              {itemIcon}
              <span className="font-bold truncate text-sm md:text-base">{item.title}</span>
            </span>
            <span className={`text-[10px] md:text-xs px-2 py-1 rounded shrink-0 ${color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{actionLabel}</span>
          </button>
        )) : <p className="text-slate-500 text-sm">{empty}</p>}
      </div>
    </div>
  );
}

export default LandingPage;
