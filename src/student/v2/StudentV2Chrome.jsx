import { signOut } from 'firebase/auth';
import {
  Bell,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  Code,
  Crown,
  DownloadCloud,
  FileCheck,
  FileText,
  Headphones,
  LogOut,
  Menu,
  MessageSquare,
  PlayCircle,
  Settings,
  Target,
  User,
  X,
  Sparkles,
  Trophy,
  Clock3,
  ShieldCheck,
} from '../../shared/icons/lucide-shim.jsx';
import { ModernLogo } from '../../features/home/HomeWidgets.jsx';

const navGroups = [
  {
    label: 'الرئيسية',
    items: [
      { tab: 'home', label: 'لوحة المتابعة', icon: User },
      { tab: 'subscription', label: 'الباقة والاشتراك', icon: Crown, tone: 'red' },
    ],
  },
  {
    label: 'التعلم',
    permission: 'content',
    items: [
      { tab: 'courses', label: 'الكورسات التعليمية', icon: BookOpen },
      { tab: 'learning_path', label: 'مساري التعليمي', icon: Target, tone: 'blue' },
      { tab: 'remediation', label: 'العلاج الذكي', icon: BrainCircuit, tone: 'red' },
      { tab: 'videos', label: 'المحاضرات', icon: PlayCircle },
      { tab: 'files', label: 'الملفات والروابط', icon: FileText },
      { tab: 'htmls', label: 'محتوى تفاعلي', icon: Code, tone: 'purple' },
    ],
  },
  {
    label: 'التواصل',
    permission: 'content',
    items: [
      { tab: 'student_messages', label: 'رسائلي', icon: MessageSquare, tone: 'emerald' },
      { tab: 'support', label: 'الدعم الفني', icon: MessageSquare, tone: 'sky' },
    ],
  },
  {
    label: 'الاختبارات',
    permission: 'exam',
    items: [
      { tab: 'exams', label: 'الامتحانات', icon: ClipboardList },
      { tab: 'assignments', label: 'الواجبات وبنك الأخطاء', icon: FileCheck, alias: ['assignments', 'smart_hw_results', 'mistakes_bank'], action: 'learningHub' },
    ],
  },
  {
    label: 'الحساب',
    items: [
      { tab: 'settings', label: 'ملفي الشخصي والأداء', icon: Settings, alias: ['settings', 'performance'] },
    ],
  },
];

function getItemTone(item, active) {
  if (!active) return 'text-slate-600 hover:bg-white hover:text-teal-700 hover:border-teal-100';
  const tone = item.tone || 'teal';
  const tones = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200 shadow-sm',
    red: 'bg-red-50 text-red-700 border-red-200 shadow-sm',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
    sky: 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm',
  };
  return tones[tone] || tones.teal;
}

export function StudentV2Sidebar({
  activeTab,
  setActiveTab,
  mobileMenu,
  setMobileMenu,
  setLearningHubTab,
  isBannedContent,
  isBannedExam,
  auth,
  studentName,
  isPremium,
}) {
  const canShowGroup = (group) => {
    if (group.permission === 'content') return !isBannedContent;
    if (group.permission === 'exam') return !isBannedExam;
    return true;
  };

  const goTo = (item) => {
    if (item.action === 'learningHub') setLearningHubTab?.('assignments');
    setActiveTab(item.tab);
    setMobileMenu(false);
  };

  return (
    <aside className={`v2-student-sidebar v2-student-nav fixed top-0 bottom-0 right-0 z-40 w-80 p-5 transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} border-l border-white/70 flex flex-col`}>
      <div className="flex items-center justify-between rounded-3xl bg-white/75 p-3 shadow-sm border border-white/70 mb-5">
        <div className="flex items-center gap-3">
          <ModernLogo />
          <div>
            <h1 className="text-xl font-black text-slate-950">منصة النحاس</h1>
            <p className="text-xs font-bold text-slate-500">{studentName || 'طالب'} · {isPremium ? 'VIP' : 'Free'}</p>
          </div>
        </div>
        <button onClick={() => setMobileMenu(false)} className="md:hidden rounded-2xl bg-slate-100 p-2 text-slate-700"><X /></button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-5">
        {navGroups.filter(canShowGroup).map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">{group.label}</p>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = [item.tab, ...(item.alias || [])].includes(activeTab);
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => goTo(item)}
                    className={`v2-student-nav-item flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition ${getItemTone(item, active)}`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => signOut(auth)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 font-black text-red-600 transition hover:bg-red-100">
        <LogOut size={18} /> خروج
      </button>
    </aside>
  );
}

export function StudentV2Topbar({
  installPrompt,
  setShowFocusMode,
  setShowNotifications,
  unseenNotificationCount,
  isPremium,
  subscriptionExpiry,
  setMobileMenu,
}) {
  const expiryLabel = subscriptionExpiry?.toDate ? subscriptionExpiry.toDate().toLocaleDateString('ar-EG') : null;

  return (
    <>
      <div className="v2-mobile-topbar md:hidden flex justify-between items-center mb-5 glass-panel p-4 rounded-3xl shadow-sm">
        <div>
          <h1 className="font-black text-lg text-slate-900">منصة النحاس</h1>
          <p className="text-xs font-bold text-slate-500">لوحة الطالب</p>
        </div>
        <button onClick={() => setMobileMenu(true)} className="p-2 bg-slate-100 rounded-2xl"><Menu /></button>
      </div>

      <div className="v2-student-toolbar v2-card rounded-3xl p-3 md:p-4 flex flex-wrap justify-between items-center gap-3 mb-6 relative">
        <div className="flex flex-wrap gap-2">
          {installPrompt && (
            <button onClick={installPrompt} className="v2-toolbar-btn bg-emerald-600 hover:bg-emerald-700 text-white">
              <DownloadCloud size={18}/><span className="hidden md:inline">تثبيت التطبيق</span>
            </button>
          )}
          <button onClick={() => setShowFocusMode(true)} className="v2-toolbar-btn bg-slate-900 hover:bg-slate-950 text-white">
            <Headphones size={18}/><span className="hidden md:inline">وضع التركيز</span>
          </button>
          <button onClick={() => setShowNotifications(true)} className="v2-toolbar-btn relative bg-white hover:bg-teal-50 text-slate-800 border border-slate-100">
            <Bell size={18}/><span className="hidden md:inline">الإشعارات</span>
            {unseenNotificationCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{unseenNotificationCount}</span>}
          </button>
        </div>
        {isPremium && (
          <span className="hidden md:flex bg-teal-50 text-teal-700 px-4 py-2 rounded-2xl text-xs font-black items-center gap-2 border border-teal-100">
            <Crown size={15}/> VIP {expiryLabel ? `حتى ${expiryLabel}` : 'مفعل'}
          </span>
        )}
      </div>
    </>
  );
}

export function StudentV2Hero({
  userData,
  isPremium,
  videosCount,
  examsCount,
  averageScore,
  pendingAssignmentsCount,
  completedVideoCount,
  setActiveTab,
}) {
  return (
    <section className="v2-student-hero mb-6 overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 p-6 md:p-8 text-white shadow-2xl relative">
      <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_15%_20%,rgba(20,184,166,.45),transparent_26rem),radial-gradient(circle_at_90%_10%,rgba(245,158,11,.28),transparent_24rem)]" />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr] items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-teal-100 backdrop-blur">
            <Sparkles size={14}/> تجربة الطالب V2
          </span>
          <h2 className="mt-5 text-3xl md:text-5xl font-black leading-tight">أهلًا {userData?.name || 'يا بطل'}، خلّي يومك الدراسي منظم.</h2>
          <p className="mt-4 max-w-2xl text-sm md:text-base leading-8 text-slate-200">تابع محاضراتك، امتحاناتك، واجباتك، واشتراكك من واجهة واحدة حديثة بدون تغيير أي منطق في المنصة.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setActiveTab('courses')} className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5">ابدأ التعلم</button>
            <button onClick={() => setActiveTab('exams')} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-black text-white backdrop-blur transition hover:bg-white/15">افتح الامتحانات</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <HeroMetric icon={<BookOpen size={18}/>} label="محاضرات" value={videosCount} />
          <HeroMetric icon={<ClipboardList size={18}/>} label="امتحانات" value={examsCount} />
          <HeroMetric icon={<Trophy size={18}/>} label="المتوسط" value={averageScore ? `${averageScore}%` : '—'} />
          <HeroMetric icon={<Clock3 size={18}/>} label="واجبات معلقة" value={pendingAssignmentsCount} />
          <div className="col-span-2 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-teal-100">حالة الحساب</p>
                <p className="mt-1 text-lg font-black">{isPremium ? 'اشتراك VIP مفعل' : 'اشتراك مجاني'}</p>
              </div>
              <ShieldCheck className="text-teal-200" />
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-teal-300" style={{ width: `${Math.min(100, completedVideoCount * 10)}%` }} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-2 text-teal-100">{icon}</div>
      <p className="text-xs font-black text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export function StudentV2SectionTitle({ badge, title, description, action }) {
  return (
    <div className="v2-student-section-title mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {badge && <span className="v2-kicker">{badge}</span>}
        <h2 className="mt-3 text-2xl md:text-3xl font-black text-slate-950">{title}</h2>
        {description && <p className="mt-2 text-sm font-bold leading-7 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
