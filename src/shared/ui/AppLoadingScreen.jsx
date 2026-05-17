import { BookOpen, GraduationCap, Sparkles } from '../icons/lucide-shim.jsx';

const loaderStyles = `
@keyframes nahhas-loader-spin { to { transform: rotate(360deg); } }
@keyframes nahhas-loader-float { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-7px) scale(1.02); } }
@keyframes nahhas-loader-shimmer { 0% { transform: translateX(115%); opacity:.15; } 35%,60% { opacity:.75; } 100% { transform: translateX(-115%); opacity:.15; } }
@keyframes nahhas-loader-progress { 0% { transform: translateX(115%); } 100% { transform: translateX(-115%); } }
.nahhas-loading-page {
  background:
    radial-gradient(circle at 22% 25%, rgba(45,212,191,.18), transparent 30%),
    radial-gradient(circle at 76% 42%, rgba(250,204,21,.16), transparent 28%),
    linear-gradient(135deg, #f7fbff 0%, #eef7f8 46%, #f8fafc 100%);
}
.nahhas-loader-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  animation: nahhas-loader-float 4.5s ease-in-out infinite;
}
.nahhas-loader-card::before {
  content: "";
  position: absolute;
  inset: -3px;
  z-index: -2;
  border-radius: 2rem;
  background: conic-gradient(from 0deg, rgba(34,211,238,.98), rgba(45,212,191,.78), rgba(250,204,21,.92), rgba(34,211,238,.98));
  animation: nahhas-loader-spin 5.5s linear infinite;
}
.nahhas-loader-card::after {
  content: "";
  position: absolute;
  inset: 2px;
  z-index: -1;
  border-radius: 1.85rem;
  background: rgba(255,255,255,.96);
}
.nahhas-loader-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 25%, rgba(255,255,255,.75), transparent 75%);
  animation: nahhas-loader-shimmer 3.4s ease-in-out infinite;
}
.nahhas-loader-orbit {
  position: absolute;
  inset: -13px;
  border-radius: 999px;
  border: 1px solid rgba(34,211,238,.35);
  box-shadow: 0 0 30px rgba(34,211,238,.16);
  animation: nahhas-loader-spin 6s linear infinite;
}
.nahhas-loader-progress-line {
  position: relative;
  overflow: hidden;
}
.nahhas-loader-progress-line::after {
  content: "";
  position: absolute;
  inset: 0;
  width: 45%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, #22d3ee, #facc15, transparent);
  animation: nahhas-loader-progress 1.6s ease-in-out infinite;
}
`;

export const AppLoadingScreen = ({
  title = 'منصة النحاس التعليمية',
  message = 'جاري التحميل...',
  variant = 'student'
}) => {
  const isAdmin = variant === 'admin';
  const finalMessage = message || (isAdmin ? 'جاري تحميل لوحة الإدارة...' : 'جاري تحميل واجهة الطالب...');

  return (
    <div className="nahhas-loading-page relative flex h-screen items-center justify-center overflow-hidden font-['Cairo']" dir="rtl">
      <style>{loaderStyles}</style>
      <div className="pointer-events-none absolute right-[12%] top-[18%] h-36 w-36 rounded-full border border-cyan-300/20" />
      <div className="pointer-events-none absolute left-[16%] bottom-[18%] h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[30%] bottom-[26%] h-32 w-32 rounded-full bg-yellow-300/10 blur-3xl" />

      <div className="nahhas-loader-card w-[90%] max-w-md rounded-[2rem] border border-white/70 p-8 text-center shadow-[0_34px_110px_rgba(15,23,42,.14)]">
        <div className="nahhas-loader-sheen" />

        <div className="relative mx-auto mb-6 grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-cyan-300 via-teal-300 to-yellow-300 text-slate-950 shadow-[0_0_70px_rgba(34,211,238,.25)]">
          <span className="nahhas-loader-orbit" />
          <div className="grid h-20 w-20 place-items-center rounded-[1.45rem] bg-slate-950 text-cyan-100 shadow-inner">
            {isAdmin ? <Sparkles className="h-9 w-9" /> : <BookOpen className="h-9 w-9" />}
          </div>
          <span className="absolute -left-2 -top-2 grid h-10 w-10 place-items-center rounded-2xl bg-white text-yellow-500 shadow-xl">
            <GraduationCap className="h-5 w-5" />
          </span>
        </div>

        <h2 className="mb-2 text-2xl font-black text-slate-950 md:text-3xl">{title}</h2>
        <p className="font-bold text-slate-500">{finalMessage}</p>

        <div className="nahhas-loader-progress-line mx-auto mt-6 h-2 w-52 rounded-full bg-slate-200/80" />

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-black text-teal-700">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,.7)]" />
          يتم تجهيز تجربة تعليمية أنيقة
        </div>
      </div>
    </div>
  );
};

export const RouteLoadingScreen = ({ mode }) => (
  <AppLoadingScreen
    title="منصة النحاس التعليمية"
    message={mode === 'admin' ? 'جاري تحميل لوحة الإدارة...' : 'جاري تحميل واجهة الطالب...'}
    variant={mode}
  />
);

export default AppLoadingScreen;
