import { BookOpen, GraduationCap, PlayCircle, BarChart3, Trophy, Sparkles } from '../icons/lucide-shim.jsx';

export const AppLoadingScreen = ({
  title = 'منصة النحاس التعليمية',
  message = 'جاري التحميل...',
  variant = 'student'
}) => {
  const isAdmin = variant === 'admin';

  return (
    <div className="h-screen live-loading-screen flex items-center justify-center font-['Cairo'] relative overflow-hidden" dir="rtl">
      <div className="absolute right-[8%] top-[18%] hidden lg:block opacity-60 animate-pulse-slow">
        <GraduationCap size={92} className="text-amber-400/70" />
      </div>
      <div className="absolute left-[10%] bottom-[12%] hidden lg:block opacity-60 animate-pulse-slow">
        <BookOpen size={112} className="text-sky-300/50" />
      </div>
      <div className="live-loader-card nh-animated-border w-[92%] max-w-5xl rounded-[2.4rem] border p-5 md:p-9 shadow-2xl overflow-hidden">
        <div className="grid items-center gap-8 lg:grid-cols-[.95fr_1.05fr]">
          <div className="relative hidden lg:flex min-h-[330px] items-center justify-center">
            <div className="absolute h-60 w-60 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl">
              <div className="mb-5 flex h-44 w-64 items-center justify-center rounded-[1.5rem] border border-amber-300/25 bg-slate-950 shadow-inner">
                <PlayCircle size={84} className="text-amber-300 drop-shadow-lg" />
              </div>
              <div className="flex items-end gap-3">
                <div className="h-14 w-24 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600" />
                <div className="h-20 w-24 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-700" />
                <div className="h-10 w-24 rounded-xl bg-gradient-to-r from-sky-400 to-blue-700" />
              </div>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <div className="mx-auto lg:mx-0 mb-5 flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-amber-300 to-orange-600 text-slate-950 shadow-2xl shadow-amber-500/25 animate-pulse-slow">
              <Sparkles size={34} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-[var(--nh-text)]">{title}</h1>
            <p className="mt-3 text-base md:text-lg font-bold text-[var(--nh-muted)]">
              {message || (isAdmin ? 'جاري تحميل لوحة الإدارة...' : 'جاري تحميل واجهة الطالب...')}
            </p>
            <div className="my-7 h-px bg-gradient-to-l from-transparent via-amber-400/60 to-transparent" />
            <p className="text-amber-300 font-black mb-3">جاري التحميل...</p>
            <div className="flex items-center gap-4">
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10 border border-white/10">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-l from-amber-300 via-orange-500 to-amber-400 shadow-[0_0_22px_rgba(245,158,11,.55)]" />
              </div>
              <span className="text-amber-300 font-black">68%</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                [PlayCircle, 'دروس تفاعلية'],
                [Trophy, 'اختبارات ذكية'],
                [BookOpen, 'ملازم شاملة'],
                [BarChart3, 'متابعة مستمرة'],
              ].map(([Icon, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center">
                  <Icon size={22} className="mx-auto mb-2 text-amber-300" />
                  <p className="text-xs font-black text-[var(--nh-text)]">{label}</p>
                </div>
              ))}
            </div>
          </div>
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
