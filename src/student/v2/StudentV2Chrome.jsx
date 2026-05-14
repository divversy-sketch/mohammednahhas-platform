import { signOut } from 'firebase/auth';
import {
  Bell,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  Code,
  Crown,
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
      { tab: 'quick_review', label: 'مراجعة في السريع', icon: Sparkles, tone: 'purple' },
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
    setMobileMenu?.(false);
  };

  const visibleGroups = navGroups.filter(canShowGroup);

  return (
    <nav className="v2-student-command-nav v2-card rounded-[2rem] p-3 md:p-4 mb-6 sticky top-3 z-30" aria-label="أقسام الطالب">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <ModernLogo />
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-black text-slate-950 truncate">منصة النحاس</h1>
            <p className="text-xs font-bold text-slate-500 truncate">{studentName || 'طالب'} · {isPremium ? 'VIP' : 'Free'}</p>
          </div>
        </div>

        <div className="v2-student-command-scroll" role="tablist" aria-label="تبويبات الطالب">
          {visibleGroups.flatMap((group) => group.items.map((item) => ({ ...item, groupLabel: group.label }))).map((item) => {
            const Icon = item.icon;
            const active = [item.tab, ...(item.alias || [])].includes(activeTab);
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => goTo(item)}
                className={`v2-student-command-chip ${active ? 'is-active' : ''}`}
                title={`${item.groupLabel} - ${item.label}`}
                role="tab"
                aria-selected={active}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <button onClick={() => signOut(auth)} className="v2-student-logout-chip">
          <LogOut size={17} /> خروج
        </button>
      </div>
    </nav>
  );
}

export function StudentV2Topbar({
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
        <span className="rounded-2xl bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 border border-teal-100">الأقسام بالأعلى</span>
      </div>

      <div className="v2-student-toolbar v2-card rounded-3xl p-3 md:p-4 flex flex-wrap justify-between items-center gap-3 mb-6 relative">
        <div className="flex flex-wrap gap-2">
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
            <Sparkles size={14}/> لوحة الطالب
          </span>
          <h2 className="mt-5 text-3xl md:text-5xl font-black leading-tight">أهلًا {userData?.name || 'يا بطل'}، خلّي يومك الدراسي منظم.</h2>
          <p className="mt-4 max-w-2xl text-sm md:text-base leading-8 text-slate-200">تابع محاضراتك وامتحاناتك وواجباتك من مكان واحد.</p>
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

export function StudentV2SectionTitle({ badge, title, action }) {
  return (
    <div className="v2-student-section-title mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {badge && <span className="v2-kicker">{badge}</span>}
        <h2 className="mt-3 text-2xl md:text-3xl font-black text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}
