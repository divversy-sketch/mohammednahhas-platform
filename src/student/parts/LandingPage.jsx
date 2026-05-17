import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  BarChart3,
  BookMarked,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  DownloadCloud,
  FileText,
  GraduationCap,
  Library,
  NotebookPen,
  PenSquare,
  Play,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Wand2,
} from 'lucide-react';

import { db } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { WhatsAppContactButton } from '../../shared/core/platformShared.jsx';

const navItems = ['الرئيسية', 'الدروس', 'المسارات', 'الاختبارات', 'المدونة', 'المكتبة', 'عن المنصة'];

const features = [
  {
    icon: ShieldCheck,
    title: 'تعلم آمن وموثوق',
    text: 'محتوى منظم ومراجع من متخصصين في اللغة العربية.',
  },
  {
    icon: Target,
    title: 'مسارات مخصصة',
    text: 'اختر مستواك وامشِ بخطة تعلم تناسبك.',
  },
  {
    icon: BarChart3,
    title: 'تابع تقدمك',
    text: 'تقارير تفصيلية تساعدك تعرف نقاط قوتك وتطورك.',
  },
  {
    icon: GraduationCap,
    title: 'محتوى شامل',
    text: 'دروس، ملخصات، اختبارات، وفيديوهات تفاعلية.',
  },
];

const interactiveTools = [
  { icon: Wand2, title: 'بطاقات ذكية', text: 'مراجعة فعالة بأسلوب الاختبار الذكي.' },
  { icon: Trophy, title: 'تحديات أسبوعية', text: 'اختبر نفسك واجمع شارات التميز.' },
  { icon: FileText, title: 'ملاحظاتك', text: 'دون ملاحظاتك وراجعها في أي وقت.' },
];

const fallbackVideos = [
  { title: 'الأدب: نصوص وشعر', tag: 'الثانوية', time: '16:30', tone: 'from-cyan-500/30 to-blue-700/40' },
  { title: 'النحو: المبتدأ والخبر', tag: 'المتوسطة', time: '22:10', tone: 'from-emerald-500/30 to-teal-700/40' },
  { title: 'البلاغة العربية', tag: 'الثانوية', time: '18:45', tone: 'from-amber-500/30 to-orange-700/40' },
];

const teacherAvatarSrc = '/teacher-avatar.jpg';

const landingGlowStyles = `
@keyframes nahhas-border-spin { to { transform: rotate(360deg); } }
@keyframes nahhas-pulse-line { 0%,100% { opacity:.55; filter: blur(.2px); } 50% { opacity:1; filter: blur(0); } }
@keyframes nahhas-surface-pulse { 0%,100% { box-shadow: 0 0 0 1px rgba(96,232,255,.24), 0 0 0 0 rgba(96,232,255,.1), 0 22px 70px rgba(8,145,178,.18);} 50% { box-shadow: 0 0 0 1px rgba(96,232,255,.38), 0 0 0 12px rgba(96,232,255,.04), 0 28px 90px rgba(8,145,178,.28);} }
.nahhas-glow-card { position: relative; isolation: isolate; overflow: hidden; }
.nahhas-glow-card::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -2;
  border-radius: inherit;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(34,211,238,.98) 52deg, rgba(250,204,21,.92) 122deg, transparent 176deg, rgba(20,184,166,.88) 240deg, transparent 360deg);
  animation: nahhas-border-spin 5.8s linear infinite;
}
.nahhas-glow-card::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: inherit;
  background: var(--nahhas-glow-bg, #fff);
}
.nahhas-soft-glow { box-shadow: 0 0 0 1px rgba(45,212,191,.12), 0 22px 70px rgba(15,118,110,.16); }
.nahhas-hero-media-ring { position: absolute; inset: 0; border-radius: 4rem; border: 10px solid rgba(103,232,249,.68); box-shadow: 0 0 80px rgba(45,212,191,.35); animation: nahhas-pulse-line 3.2s ease-in-out infinite; }
.nahhas-hero-video-box { animation: nahhas-surface-pulse 3.4s ease-in-out infinite; }
`;

function getInteractiveVisual(item, fallbackIcon) {
  const title = `${item?.title || ''} ${item?.description || ''} ${item?.caption || ''}`;

  if (/امتحان|اختبار|اسئلة|أسئلة/.test(title)) {
    return { Icon: ClipboardCheck, tint: 'text-amber-500', bg: 'from-amber-100 to-yellow-50' };
  }
  if (/مراجعة|ملخص|شهرية|نهائية|تجميع/.test(title)) {
    return { Icon: BookOpenCheck, tint: 'text-cyan-600', bg: 'from-cyan-100 to-sky-50' };
  }
  if (/كتابة|تعبير|تطبيق|نشاط/.test(title)) {
    return { Icon: PenSquare, tint: 'text-emerald-600', bg: 'from-emerald-100 to-teal-50' };
  }
  if (/مذكرة|ملاحظات|ملف/.test(title)) {
    return { Icon: NotebookPen, tint: 'text-violet-600', bg: 'from-violet-100 to-fuchsia-50' };
  }

  return { Icon: fallbackIcon || BookMarked, tint: 'text-cyan-600', bg: 'from-cyan-100 to-slate-50' };
}

function ContentCard({ item, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nahhas-glow-card nahhas-soft-glow group relative min-h-[168px] overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white text-right shadow-[0_18px_45px_rgba(15,23,42,.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,118,110,.18)]"
      style={{ '--nahhas-glow-bg': '#ffffff' }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.tone || 'from-teal-500/20 to-slate-900/25'}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.75),transparent_26%),linear-gradient(135deg,rgba(3,7,18,.15),rgba(3,7,18,.45))]" />
      <div className="relative flex h-full min-h-[168px] flex-col justify-between p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-black backdrop-blur">{item.time || 'مشاهدة'}</span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white ring-1 ring-white/20 transition group-hover:scale-110">
            <Play size={18} fill="currentColor" />
          </span>
        </div>
        <div>
          <h4 className="line-clamp-2 text-lg font-black drop-shadow">{item.title}</h4>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
            <span>{item.tag || 'عام'}</span>
            <span className="h-1 w-1 rounded-full bg-white/60" />
            <span>درس تفاعلي</span>
          </div>
        </div>
      </div>
    </button>
  );
}

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

  const publicVideos = useMemo(() => publicContent.filter((item) => item.type === 'video'), [publicContent]);
  const publicInteractive = useMemo(() => publicContent.filter((item) => item.type === 'html'), [publicContent]);
  const visibleVideos = publicVideos.length ? publicVideos.slice(0, 3) : fallbackVideos;
  const featuredVideo = publicVideos.find((item) => item.isLandingFeatured || item.featured || item.showOnLandingHero) || publicVideos[0] || null;
  const visibleInteractive = publicInteractive.length ? publicInteractive.slice(0, 3) : interactiveTools;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7fb] font-['Cairo','Tajawal',system-ui,sans-serif] text-slate-900" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <WhatsAppContactButton />
      <style>{landingGlowStyles}</style>

      <section className="relative isolate overflow-hidden bg-[#061224] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_38%,rgba(45,212,191,.22),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(245,158,11,.16),transparent_24%),linear-gradient(180deg,#071426,#030814)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="absolute right-[8%] top-40 hidden h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_30px_8px_rgba(251,191,36,.25)] md:block" />

        <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-amber-300 to-teal-400 text-3xl font-black text-slate-950 shadow-[0_0_42px_rgba(45,212,191,.32)] ring-2 ring-cyan-200/25">
              <img src={teacherAvatarSrc} alt="صورة المدرس" className="absolute inset-0 hidden h-full w-full object-cover" onLoad={(e) => e.currentTarget.classList.remove('hidden')} onError={(e) => e.currentTarget.classList.add('hidden')} />
              <span className="relative z-10">ن</span>
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">منصة النحاس</p>
              <p className="text-xs font-bold text-cyan-100/70">تعلم بذكاء .. تميز بثقة</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-black text-white/80 lg:flex">
            {navItems.map((item, index) => (
              <button key={item} type="button" className={`relative transition hover:text-white ${index === 0 ? 'text-white' : ''}`}>
                {item}
                {index === 0 && <span className="absolute -bottom-6 right-0 h-0.5 w-full rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,.8)]" />}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {installPrompt && (
              <button
                type="button"
                onClick={installPrompt}
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/85 backdrop-blur transition hover:bg-white/10 md:flex"
              >
                <DownloadCloud size={17} /> تثبيت
              </button>
            )}
            <button onClick={onAuthClick} type="button" className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-50">
              دخول الطالب
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative order-2 min-h-[420px] lg:order-1">
            <div className="absolute left-2 top-0 hidden md:block">
              <div className="nahhas-glow-card relative grid h-40 w-40 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_30%,rgba(45,212,191,.18),rgba(2,6,23,.82))] shadow-[0_0_90px_rgba(45,212,191,.18)]" style={{ '--nahhas-glow-bg': 'radial-gradient(circle_at_50%_30%,rgba(8,47,73,.92),rgba(2,6,23,.96))' }}>
                <img src={teacherAvatarSrc} alt="صورة المدرس" className="absolute inset-[9px] hidden h-[calc(100%-18px)] w-[calc(100%-18px)] rounded-full object-cover" onLoad={(e) => e.currentTarget.classList.remove('hidden')} onError={(e) => e.currentTarget.classList.add('hidden')} />
                <div className="absolute inset-[9px] rounded-full bg-gradient-to-br from-cyan-300/20 to-transparent" />
                <span className="relative z-10 text-5xl font-black text-cyan-100">ن</span>
              </div>
            </div>

            <div className="absolute right-2 top-5 h-[350px] w-[350px] rounded-[4rem] bg-teal-500/10"><span className="nahhas-hero-media-ring" /></div>
            <div className="absolute right-16 top-24 h-28 w-64 rounded-full bg-amber-400/20 blur-3xl" />

            <button
              type="button"
              onClick={() => (featuredVideo ? setPlayingVideo(featuredVideo) : onAuthClick())}
              className="nahhas-glow-card nahhas-hero-video-box absolute right-12 top-28 w-[420px] max-w-[90vw] rounded-[2.15rem] border border-cyan-300/20 bg-gradient-to-br from-[#0a1527] via-[#071325] to-[#03101d] p-6 text-right shadow-[0_35px_120px_rgba(0,0,0,.55)]"
              style={{ '--nahhas-glow-bg': 'linear-gradient(135deg,#0a1527,#071325 45%,#03101d)' }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-cyan-300/15 px-4 py-1.5 text-sm font-black text-cyan-100 ring-1 ring-cyan-200/30 shadow-[0_0_22px_rgba(103,232,249,.15)]">
                  {featuredVideo ? 'فيديو مميز' : 'درس تفاعلي'}
                </span>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
              </div>

              <div className="grid min-h-[220px] place-items-center rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle,rgba(96,232,255,.22),transparent_34%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] shadow-[inset_0_0_60px_rgba(96,232,255,.06)] ring-1 ring-cyan-200/10">
                <span className="grid h-24 w-24 place-items-center rounded-full bg-cyan-300 text-slate-950 shadow-[0_0_65px_rgba(103,232,249,.65)] transition hover:scale-105">
                  <Play size={34} fill="currentColor" />
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <p className="line-clamp-1 text-base font-black text-white">{featuredVideo?.title || 'اختر فيديو عام من لوحة الأدمن ليظهر هنا'}</p>
                <div className="h-3.5 w-4/5 rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-amber-300 shadow-[0_0_20px_rgba(96,232,255,.45)]" />
                </div>
              </div>
            </button>

            <div className="absolute right-0 top-20 rounded-2xl border border-white/10 bg-white/8 p-3 text-sm font-black text-white shadow-2xl backdrop-blur">
              <div className="flex items-center gap-2"><PlayCircle size={18} className="text-cyan-200" /> دروس تفاعلية</div>
            </div>
            <div className="absolute left-8 top-32 rounded-2xl border border-white/10 bg-white/8 p-3 text-sm font-black text-white shadow-2xl backdrop-blur">
              <div className="flex items-center gap-2"><BarChart3 size={18} className="text-amber-300" /> تقارير أداء</div>
            </div>
            <div className="absolute right-2 bottom-8 hidden rounded-2xl border border-white/10 bg-white/8 p-3 text-sm font-black text-white shadow-2xl backdrop-blur md:block">
              <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-300" /> اختبارات ذكية</div>
            </div>
          </div>

          <div className="order-1 text-center lg:order-2 lg:text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-black text-amber-100">
              <Star size={17} fill="currentColor" className="text-amber-300" /> من الإعدادي إلى الثانوية
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.2] tracking-tight md:text-6xl">
              أتقن <span className="bg-gradient-to-r from-cyan-200 to-teal-300 bg-clip-text text-transparent">اللغة العربية</span>
              <br /> وتفوّق في دراستك.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-bold leading-8 text-slate-300 md:mx-0 md:text-lg">
              منصة تعليمية متكاملة تقدم لك دروسًا تفاعلية، اختبارات ذكية، ومتابعة أداء تساعدك على الوصول لأفضل النتائج.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <button onClick={onAuthClick} type="button" className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-300 px-8 py-4 text-lg font-black text-slate-950 shadow-[0_20px_60px_rgba(251,191,36,.22)] transition hover:-translate-y-1 sm:w-auto">
                ابدأ التعلم الآن <Rocket size={20} className="transition group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 md:grid-cols-2 md:px-6 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group relative overflow-hidden rounded-[1.6rem] border border-cyan-200/15 bg-white/[.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,.18)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-200/35">
              <span className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-200/20">
                <Icon size={25} />
              </div>
              <h3 className="text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <div className="nahhas-glow-card rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)]" style={{ '--nahhas-glow-bg': '#ffffff' }}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black">محتوى تفاعلي <Sparkles className="inline text-cyan-500" size={20} /></h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {visibleInteractive.map((tool, index) => {
                const isAdminItem = Boolean(tool?.id || tool?.type === 'html');
                const title = tool.title || 'محتوى تفاعلي';
                const text = tool.description || tool.caption || tool.text || 'محتوى تفاعلي من لوحة الأدمن.';
                const fallbackIcon = isAdminItem ? BookMarked : tool.icon;
                const { Icon, tint, bg } = getInteractiveVisual(tool, fallbackIcon);
                return (
                  <button
                    key={tool.id || title || index}
                    type="button"
                    onClick={() => (isAdminItem ? setPlayingHtml(tool) : publicInteractive[0] ? setPlayingHtml(publicInteractive[0]) : onAuthClick())}
                    className="nahhas-glow-card rounded-[1.45rem] border border-slate-200 bg-slate-50 p-4 text-center transition hover:-translate-y-1 hover:border-cyan-200 hover:bg-cyan-50/50"
                    style={{ '--nahhas-glow-bg': '#f8fafc' }}
                  >
                    <div className={`mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${bg} ${tint} shadow-[0_10px_25px_rgba(15,23,42,.06)]`}>
                      <Icon size={24} strokeWidth={2.2} />
                    </div>
                    <h3 className="font-black leading-8 text-slate-900">{title}</h3>
                    <p className="mt-2 line-clamp-3 text-xs font-bold leading-6 text-slate-500">{text}</p>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={onAuthClick} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-teal-700 transition hover:border-teal-200 hover:bg-teal-50">
              استكشف جميع الأدوات <ChevronLeft size={18} />
            </button>
          </div>

          <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black">دروس فيديوهات مميزة</h2>
              <button type="button" onClick={onAuthClick} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-200">عرض الكل</button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {visibleVideos.map((video, index) => (
                <ContentCard key={video.id || video.title || index} item={video} onClick={() => (video.type === 'video' ? setPlayingVideo(video) : onAuthClick())} />
              ))}
            </div>
          </div>
        </section>

        <section className="nahhas-glow-card relative overflow-hidden rounded-[1.8rem] bg-[#062b2f] p-6 text-white shadow-[0_25px_80px_rgba(15,118,110,.2)] md:p-8" style={{ '--nahhas-glow-bg': '#062b2f' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(45,212,191,.25),transparent_24%),radial-gradient(circle_at_85%_50%,rgba(251,191,36,.2),transparent_22%)]" />
          <div className="relative flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-right">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10 text-amber-300 ring-1 ring-white/15">
                <Library size={34} />
              </div>
              <div>
                <h2 className="text-2xl font-black md:text-3xl">طوّر لغتك، واصنع مستقبلك</h2>
                <p className="mt-2 font-bold text-cyan-50/75">تعلم اليوم، وتفوّق غدًا. ابدأ رحلتك التعليمية مع منصة النحاس.</p>
              </div>
            </div>
            <button onClick={onAuthClick} type="button" className="rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-300 px-8 py-4 font-black text-slate-950 shadow-xl transition hover:-translate-y-1">
              اشترك الآن
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
