import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  BookOpen,
  Code,
  DownloadCloud,
  Facebook,
  FileCheck,
  GraduationCap,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
} from '../../shared/icons/lucide-shim.jsx';
import SecureVideoPlayer from '@features/video-security/player/SecureVideoPlayer.jsx';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { ModernLogo } from '../../features/home/HomeWidgets';
import { WhatsAppContactButton } from '../../shared/core/platformShared.jsx';
import { usePublicContent } from '../../features/public';
import { GlowFrame } from '@ui/components';

const heroStats = [
  { label: 'محاضرات منظمة', icon: Video },
  { label: 'امتحانات وواجبات', icon: FileCheck },
  { label: 'متابعة أداء', icon: Target },
  { label: 'محتوى تفاعلي', icon: Code },
];

const platformPillars = [
  {
    title: 'مسار مذاكرة واضح',
    text: 'الطالب يدخل يعرف يبدأ منين، يكمل إيه، ويراجع إيه بدون تشتت.',
    icon: BookOpen,
  },
  {
    title: 'اختبارات مرتبطة بالمحتوى',
    text: 'المحاضرات والامتحانات والواجبات تظهر من بيانات المنصة الحقيقية.',
    icon: ShieldCheck,
  },
  {
    title: 'تجربة ذكية ومتحركة',
    text: 'إطار ضوئي مستمر وحركة ناعمة تعطي إحساس منصة حديثة وليست صفحة تقليدية.',
    icon: Sparkles,
  },
];

const DynamicContentList = ({ title, icon: Icon, items, emptyText, loading, error, actionLabel, onOpen, tone = 'student' }) => (
  <GlowFrame tone={tone} intensity="soft" className="h-full">
    <div className="nh-light-card h-full rounded-[26px] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-cyan-300 shadow-lg">
            <Icon size={22} />
          </span>
          <div>
            <p className="text-xs font-black text-slate-400">من محتوى المنصة</p>
            <h3 className="text-lg md:text-xl font-black text-slate-950">{title}</h3>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{items.length}</span>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? items.slice(0, 5).map((item, index) => (
          <button
            key={item.id || `${item.title}-${index}`}
            type="button"
            onClick={() => onOpen(item)}
            className="nh-dynamic-list-item w-full text-right transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-950">{item.title || item.name || `محتوى رقم ${index + 1}`}</span>
              <span className="mt-1 block truncate text-xs font-bold text-slate-500">{item.description || item.gradeLabel || item.type || 'جاهز للفتح من بيانات المنصة'}</span>
            </span>
            <span className="shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">{actionLabel}</span>
          </button>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
            {loading ? 'جاري تحميل المحتوى من المنصة...' : error ? 'تعذر تحميل المحتوى حاليًا.' : emptyText}
          </div>
        )}
      </div>
    </div>
  </GlowFrame>
);

export const LandingPage = ({ onAuthClick, installPrompt }) => {
  const { videos = [], htmls = [], loading, error } = usePublicContent();
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);
  const openFacebook = () => window.open('https://www.facebook.com/share/17aiUQWKf5/', '_blank');

  return (
    <div className="nh-page font-['Cairo']" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <div className="nh-shell-grid" />
      <WhatsAppContactButton />

      <header className="nh-container relative z-10 pt-4 md:pt-6">
        <GlowFrame intensity="soft" tone="student" className="rounded-[999px]">
          <nav className="flex items-center justify-between gap-3 rounded-[999px] bg-slate-950/70 px-4 py-3 backdrop-blur-2xl md:px-5">
            <button type="button" onClick={onAuthClick} className="flex items-center gap-2 text-right">
              <ModernLogo />
              <span className="hidden text-xl font-black text-white md:block">منصة النحاس التعليمية</span>
            </button>
            <div className="flex items-center gap-2">
              {installPrompt && (
                <button onClick={installPrompt} className="nh-btn-ghost hidden md:inline-flex">
                  <DownloadCloud size={18} /> تثبيت المنصة
                </button>
              )}
              <button onClick={openFacebook} className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg transition hover:-translate-y-0.5">
                <Facebook size={20} />
              </button>
              <button onClick={onAuthClick} className="nh-btn-primary px-4 md:px-5">
                دخول الطالب <ChevronLeft size={18} />
              </button>
            </div>
          </nav>
        </GlowFrame>
      </header>

      <main className="nh-container relative z-10 pb-16 pt-10 md:pt-16">
        <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="nh-chip"><Sparkles size={16} /> تصميم جديد متصل بمحتوى المنصة</span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.18] text-white md:text-7xl">
              العربي مش حفظ وخلاص…
              <span className="block bg-gradient-to-l from-cyan-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">ده رحلة ذكية للطالب.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-slate-300 md:text-xl">
              واجهة جديدة بالكامل تعرض المحاضرات، الامتحانات، والأنشطة من بيانات المنصة مباشرة، مع تجربة بصرية حديثة وإطار ضوئي متحرك في كل جزء مهم.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button onClick={onAuthClick} className="nh-btn-primary text-base">
                ابدأ الآن <Sparkles size={20} />
              </button>
              <a href="#public-content" className="nh-btn-secondary text-base">
                شاهد محتوى متاح <PlayCircle size={20} />
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.08 }}>
            <GlowFrame tone="purple" intensity="normal">
              <div className="nh-glass-card relative overflow-hidden rounded-[28px] p-5 md:p-6">
                <span className="nh-marquee-light right-10 top-10" />
                <div className="relative z-10">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-cyan-200">لوحة الطالب الجديدة</p>
                      <h2 className="text-2xl font-black text-white">ماذا تفعل الآن؟</h2>
                    </div>
                    <GraduationCap className="text-amber-300" size={34} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {heroStats.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="nh-stat-card">
                          <Icon className="mb-4 text-cyan-300" size={26} />
                          <p className="text-sm font-black leading-6 text-white">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 rounded-3xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs font-black text-amber-200">الفكرة الأساسية</p>
                    <p className="mt-1 text-sm font-bold leading-7 text-slate-200">كل كارت في التصميم الجديد يأخذ اسمه وحالته من بيانات المنصة، وليس من نصوص ثابتة.</p>
                  </div>
                </div>
              </div>
            </GlowFrame>
          </motion.div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {platformPillars.map((item) => {
            const Icon = item.icon;
            return (
              <GlowFrame key={item.title} intensity="soft" tone="student">
                <article className="nh-glass-card h-full rounded-[28px] p-5">
                  <Icon className="mb-5 text-cyan-300" size={30} />
                  <h3 className="text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-slate-300">{item.text}</p>
                </article>
              </GlowFrame>
            );
          })}
        </section>

        <section id="public-content" className="mt-14">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="nh-chip"><BookOpen size={16} /> محتوى عام من قاعدة البيانات</span>
              <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">المحتوى المتاح للزائر</h2>
            </div>
            <p className="max-w-xl text-sm font-bold leading-7 text-slate-300">الأسماء هنا يتم سحبها من محتوى المنصة الحقيقي: فيديوهات عامة وأنشطة HTML عامة.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <DynamicContentList
              title="فيديوهات للجميع"
              icon={Video}
              items={videos}
              loading={loading}
              error={error}
              emptyText="لا توجد فيديوهات عامة حاليًا."
              actionLabel="مشاهدة"
              onOpen={setPlayingVideo}
              tone="student"
            />
            <DynamicContentList
              title="أنشطة تفاعلية للجميع"
              icon={Code}
              items={htmls}
              loading={loading}
              error={error}
              emptyText="لا يوجد محتوى تفاعلي عام حاليًا."
              actionLabel="تشغيل"
              onOpen={setPlayingHtml}
              tone="purple"
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
