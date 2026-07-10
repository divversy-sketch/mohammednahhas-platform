import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@services/firebase';
import SmartHomeworkScanner from '@features/homework/SmartHomeworkScanner.jsx';
import '@styles/pages/student-neo.css';
import PlatformLogo from '../../../../shared/ui/PlatformLogo.jsx';

const SecureVideoPlayer = lazy(() => import('@features/video-security/player/SecureVideoPlayer.jsx'));
const InteractiveViewer = lazy(() => import('@features/content/InteractiveViewer'));
const ExamPreStartPanel = lazy(() => import('@features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.ExamPreStartPanel })));

const LazyPanelFallback = () => (
  <div className="student-neo-loader" dir="rtl">
    <span />
    جاري تجهيز المساحة المطلوبة...
  </div>
);

const LazyPanel = ({ children }) => <Suspense fallback={<LazyPanelFallback />}>{children}</Suspense>;

const Icon = ({ name, size = 22 }) => {
  const paths = {
    home: 'M4 12.4 12 5l8 7.4V20a1 1 0 0 1-1 1h-4.8v-5.6H9.8V21H5a1 1 0 0 1-1-1v-7.6Z M8 21h8',
    learn: 'M4 5.8C6.6 4.5 9 4.5 12 6.4c3-1.9 5.4-1.9 8-.6v13.1c-2.6-1.3-5-1.3-8 .6-3-1.9-5.4-1.9-8-.6V5.8Z M12 6.4v13.1',
    video: 'M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 17.5v-11Z M10 9l5 3-5 3V9Z',
    exam: 'M7 3.5h7.5L18 7v13.5H7V3.5Z M14 3.5V8h4 M10 12h5 M10 16h4 M8.5 12l.7.7 1.3-1.6',
    file: 'M7 3.5h7.2L18 7.3v13.2H7V3.5Z M14 3.5V8h4 M10 12h5 M10 16h5',
    chart: 'M4 20h16 M7 17v-5 M12 17V7 M17 17v-8 M6 8l4-4 4 3 4-5',
    crown: 'M4 8.5l4.1 3.7L12 5l3.9 7.2L20 8.5 18.2 19H5.8L4 8.5Z M7 21h10',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9.8 9.3a2.4 2.4 0 0 1 4.4 1.2c0 1.6-1.6 2.1-2.1 3.2 M12 17h.01',
    user: 'M19.5 21a7.5 7.5 0 0 0-15 0 M12 12.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z',
    bell: 'M18 8.4a6 6 0 1 0-12 0c0 6.7-2.8 7.1-2.8 8.8h17.6c0-1.7-2.8-2.1-2.8-8.8Z M10 21h4',
    menu: 'M4 7h16 M4 12h16 M4 17h16',
    close: 'M6 6l12 12 M18 6 6 18',
    moon: 'M21 14.8A8.5 8.5 0 0 1 9.2 3a7 7 0 1 0 11.8 11.8Z',
    sun: 'M12 4V2m0 20v-2 M4.93 4.93 3.52 3.52m16.96 16.96-1.41-1.41 M4 12H2m20 0h-2 M4.93 19.07l-1.41 1.41M20.48 3.52l-1.41 1.41 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    logout: 'M10 17l5-5-5-5 M15 12H3 M21 4v16h-8',
    spark: 'M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z',
    check: 'M20 6 9 17l-5-5',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
    message: 'M4 5h16v11H8l-4 4V5Z',
    download: 'M12 3v11 M12 14l5-5 M12 14l-5-5 M5 21h14',
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
    install: 'M12 3v10 M12 13l4-4 M12 13 8 9 M5 15v3.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V15',
    trophy: 'M8 4h8v3a4 4 0 0 1-8 0V4Z M6 5H4v1a4 4 0 0 0 4 4 M18 5h2v1a4 4 0 0 1-4 4 M12 11v5 M9 21h6 M8 16h8',
    calendar: 'M7 3v3 M17 3v3 M4 8h16 M5 5h14v15H5V5Z M8 12h3 M13 12h3 M8 16h3',
    shield: 'M12 3l7 3v5c0 4.6-2.8 8.2-7 10-4.2-1.8-7-5.4-7-10V6l7-3Z'
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.spark} />
    </svg>
  );
};

function StudentStudyIllustration() {
  return (
    <svg className="student-neo-study-illustration" viewBox="0 0 220 180" role="img" aria-label="طالب يذاكر">
      <defs>
        <linearGradient id="studentNeoSkin" x1="0" x2="1"><stop offset="0" stopColor="#ffd7a8" /><stop offset="1" stopColor="#f4a261" /></linearGradient>
        <linearGradient id="studentNeoShirt" x1="0" x2="1"><stop offset="0" stopColor="#45ccff" /><stop offset="1" stopColor="#36e2bf" /></linearGradient>
        <linearGradient id="studentNeoBook" x1="0" x2="1"><stop offset="0" stopColor="#f5b820" /><stop offset="1" stopColor="#ffdf7b" /></linearGradient>
      </defs>
      <circle cx="110" cy="90" r="78" fill="currentColor" opacity="0.06" />
      <path d="M58 143c18-20 86-20 104 0v18H58v-18Z" fill="url(#studentNeoShirt)" />
      <circle cx="110" cy="70" r="33" fill="url(#studentNeoSkin)" />
      <path d="M78 68c4-28 22-41 52-33 16 4 24 16 22 31-12-8-28-10-44-6-13 3-23 6-30 8Z" fill="#172033" />
      <path d="M90 80c5 8 34 8 40 0" stroke="#753f24" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".55" />
      <path d="M40 113c24-13 47-13 70 2v42c-23-14-46-14-70-2v-42Z" fill="url(#studentNeoBook)" />
      <path d="M110 115c23-15 46-15 70-2v42c-24-12-47-12-70 2v-42Z" fill="#ffffff" opacity=".9" />
      <path d="M110 115v42 M55 126h38 M55 138h30 M127 126h36 M127 138h29" stroke="#102240" strokeWidth="3" strokeLinecap="round" opacity=".4" />
      <circle cx="58" cy="38" r="9" fill="#f5b820" opacity=".85" />
      <path d="M170 36l5 11 11 5-11 5-5 11-5-11-11-5 11-5 5-11Z" fill="#45ccff" opacity=".8" />
    </svg>
  );
}


function ArabicStudySceneIllustration() {
  return (
    <svg className="student-neo-study-scene" viewBox="0 0 420 280" role="img" aria-label="طالب يذاكر أمام كتب بطابع عربي">
      <defs>
        <linearGradient id="neoSceneBg" x1="0" x2="1">
          <stop offset="0" stopColor="#f5b820" stopOpacity="0.18" />
          <stop offset="1" stopColor="#45ccff" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="neoDesk" x1="0" x2="1">
          <stop offset="0" stopColor="#8c5a2b" />
          <stop offset="1" stopColor="#bb7b36" />
        </linearGradient>
        <linearGradient id="neoRobe" x1="0" x2="1">
          <stop offset="0" stopColor="#36e2bf" />
          <stop offset="1" stopColor="#45ccff" />
        </linearGradient>
        <linearGradient id="neoSkin2" x1="0" x2="1">
          <stop offset="0" stopColor="#ffd7a8" />
          <stop offset="1" stopColor="#f0a36a" />
        </linearGradient>
      </defs>
      <rect x="18" y="16" width="384" height="248" rx="36" fill="url(#neoSceneBg)" />
      <path d="M76 61h70c14 0 26 12 26 26v70H50V87c0-14 12-26 26-26Z" fill="#fff" opacity="0.88" />
      <path d="M246 54h112c12 0 22 10 22 22v88H224V76c0-12 10-22 22-22Z" fill="#fff" opacity="0.82" />
      <path d="M55 88h112M55 108h82M55 128h92M250 84h98M250 104h66M250 124h88" stroke="#a7b6ca" strokeWidth="8" strokeLinecap="round" opacity="0.48" />
      <path d="M84 182h252l22 46H62l22-46Z" fill="url(#neoDesk)" />
      <circle cx="205" cy="108" r="34" fill="url(#neoSkin2)" />
      <path d="M173 105c6-31 26-46 59-39 20 4 29 18 28 35-14-9-32-12-52-8-14 3-25 7-35 12Z" fill="#182236" />
      <path d="M177 154c10-18 64-18 74 0v40h-74v-40Z" fill="url(#neoRobe)" />
      <path d="M150 154l42 18 26-14 44 14-4 52H154l-4-45Z" fill="#16b29b" opacity="0.95" />
      <path d="M124 178c34-18 70-18 106 0v52c-36-17-72-17-106 0v-52Z" fill="#f5b820" />
      <path d="M230 178c34-18 70-18 106 0v52c-36-17-72-17-106 0v-52Z" fill="#fff" opacity="0.94" />
      <path d="M230 178v52M146 194h54M146 210h40M250 194h58M250 210h44" stroke="#102240" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
      <rect x="92" y="147" width="28" height="10" rx="5" fill="#f5b820" opacity="0.92" />
      <rect x="300" y="145" width="34" height="10" rx="5" fill="#45ccff" opacity="0.78" />
      <path d="M338 34l7 16 16 7-16 7-7 16-7-16-16-7 16-7 7-16Z" fill="#45ccff" opacity="0.74" />
      <circle cx="96" cy="42" r="10" fill="#f5b820" opacity="0.86" />
      <path d="M279 34h28c5 0 9 4 9 9v10h-46V43c0-5 4-9 9-9Z" fill="#f5b820" opacity="0.2" />
      <path d="M280 41h26M285 49h16" stroke="#b68312" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatDate = (value) => {
  if (!value) return 'غير محدد';
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return 'غير محدد';
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return 'غير محدد';
  }
};

const firstValue = (item, keys, fallback = '') => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

const getFileUrl = (item) => firstValue(item, ['url', 'fileUrl', 'downloadUrl', 'link', 'href', 'contentUrl'], '');
const getContentTitle = (item, fallback = 'محتوى بدون عنوان') => firstValue(item, ['title', 'name', 'lessonTitle', 'fileName'], fallback);
const getContentText = (item) => firstValue(item, ['description', 'desc', 'summary', 'body', 'notes'], 'جاهز للفتح من حسابك.');
const getOrderValue = (item, fallbackIndex = 0) => safeNumber(firstValue(item, ['order', 'sortOrder', 'lessonOrder', 'position', 'index', 'rank'], fallbackIndex), fallbackIndex);
const getResultPercent = (result) => {
  const direct = firstValue(result, ['percentage', 'percent', 'scorePercentage'], null);
  if (direct !== null) return safeNumber(direct, 0);
  const total = safeNumber(result?.total || result?.totalScore || result?.maxScore, 0);
  return total > 0 ? Math.round((safeNumber(result?.score, 0) / total) * 100) : safeNumber(result?.score, 0);
};

const tabs = [
  { key: 'home', label: 'الصفحة الرئيسية', icon: 'home' },
  { key: 'lectures', label: 'التعلم', icon: 'learn' },
  { key: 'files', label: 'المكتبة', icon: 'file' },
  { key: 'exams', label: 'الاختبارات', icon: 'exam' },
  { key: 'assignments', label: 'الواجبات', icon: 'target' },
  { key: 'performance', label: 'التقدم', icon: 'chart' },
  { key: 'subscription', label: 'الاشتراك', icon: 'crown' },
  { key: 'support', label: 'الدعم', icon: 'message' },
  { key: 'profile', label: 'حسابي', icon: 'user' }
];

const tabAliases = {
  videos: 'lectures',
  htmls: 'lectures',
  interactiveExams: 'lectures',
  courses: 'lectures',
  messages: 'support',
  settings: 'profile',
  reviewQuiz: 'performance',
  learningPath: 'performance',
  remediation: 'performance',
  mistakesBank: 'performance',
  smartHomeworkResults: 'assignments',
  support: 'support',
  subscription: 'subscription'
};

function getSuggestedAction(ctx) {
  const sortedLessons = [
    ...(ctx.videos || []).map((item, index) => ({ ...item, __kind: 'video', __order: getOrderValue(item, index), __index: index })),
    ...(ctx.htmls || []).map((item, index) => ({ ...item, __kind: 'html', __order: getOrderValue(item, index + 10000), __index: index })),
    ...(ctx.interactiveExams || []).map((item, index) => ({ ...item, __kind: 'interactive', __order: getOrderValue(item, index + 20000), __index: index }))
  ].sort((a, b) => a.__order - b.__order || a.__index - b.__index);

  const weakResults = (ctx.examResults || [])
    .filter((result) => String(result.status || 'completed') === 'completed')
    .map((result) => ({ ...result, __percent: getResultPercent(result) }))
    .filter((result) => result.__percent < 60)
    .sort((a, b) => a.__percent - b.__percent);

  if (weakResults.length) {
    const weak = weakResults[0];
    const exam = (ctx.exams || []).find((item) => item.id === weak.examId) || {};
    return {
      icon: 'target',
      title: exam.title || weak.examTitle || weak.title || 'راجع امتحان الدرجة الأقل',
      text: `درجتك هنا ${Math.round(weak.__percent)}%. راجع الدرس المرتبط وخد محاولة أهدى، وهتلاحظ فرقًا واضحًا في مستواك.`,
      button: 'ابدأ خطة التحسين',
      action: () => ctx.setActiveTab?.('performance')
    };
  }

  const nextLesson = sortedLessons.find((lesson) => {
    if (lesson.__kind === 'video' && ctx.getVideoWatchPercent) return safeNumber(ctx.getVideoWatchPercent(lesson), 0) < 80;
    return !lesson.completed && !lesson.isCompleted && !lesson.opened && !lesson.viewed;
  }) || sortedLessons[0];

  if (nextLesson) {
    return {
      icon: nextLesson.__kind === 'video' ? 'video' : 'learn',
      title: getContentTitle(nextLesson, 'الدرس التالي'),
      text: 'هذا أفضل درس تبدأ به الآن حسب ترتيب الإدارة وخط سيرك الحالي داخل المنصة.',
      button: nextLesson.__kind === 'video' ? 'افتح الدرس' : 'افتح المحتوى',
      action: () => {
        if (nextLesson.__kind === 'video') return ctx.handlePremiumClick ? ctx.handlePremiumClick(() => ctx.setPlayingVideo?.(nextLesson)) : ctx.setPlayingVideo?.(nextLesson);
        return ctx.setPlayingHtml?.(nextLesson);
      }
    };
  }

  const nextExam = (ctx.exams || []).find((exam) => ctx.getExamAccessState ? ctx.getExamAccessState(exam)?.allowed : true);
  if (nextExam) {
    return {
      icon: 'exam',
      title: nextExam.title || 'اختبار جاهز للحل',
      text: 'اختبار مناسب لوقتك الحالي — خطوة ذكية تثبّت فهمك وتكشف لك ما تحتاج مراجعته.',
      button: 'دخول الاختبار',
      action: () => ctx.startExamWithCode?.(nextExam)
    };
  }

  return {
    icon: 'spark',
    title: 'ابدأ من مكتبة التعلم',
    text: 'ابدأ من هنا، ومع كل درس تنجزه ستشعر أن الطريق صار أوضح وأسهل.',
    button: 'افتح التعلم',
    action: () => ctx.setActiveTab?.('lectures')
  };
}

function ArabicLettersField() {
  const letters = ['ن', 'ح', 'و', 'ص', 'ر', 'ف', 'ب', 'ل', 'ا', 'غ', 'ة', 'ق', 'ا', 'ع', 'د', 'ة'];
  return (
    <div className="student-neo-letters" aria-hidden="true">
      {letters.map((letter, index) => <span key={`${letter}-${index}`}>{letter}</span>)}
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <article className="student-neo-stat">
      <div className="student-neo-stat__icon"><Icon name={icon} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}

function EmptyState({ title, text, icon = 'spark' }) {
  return (
    <div className="student-neo-empty">
      <div><Icon name={icon} size={34} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function NeoButton({ children, onClick, href, tone = 'primary', disabled = false, type = 'button' }) {
  const className = `student-neo-btn student-neo-btn--${tone}${disabled ? ' is-disabled' : ''}`;
  if (href && !disabled) return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
  return <button type={type} disabled={disabled} onClick={onClick} className={className}>{children}</button>;
}

function InstallButton({ installPrompt }) {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const query = window.matchMedia?.('(display-mode: standalone)');
    const check = () => setIsStandalone(query?.matches || window.navigator?.standalone === true);
    check();
    query?.addEventListener?.('change', check);
    return () => query?.removeEventListener?.('change', check);
  }, []);

  const handleInstall = async () => {
    if (typeof installPrompt === 'function') return installPrompt();
    if (installPrompt?.prompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      return null;
    }
    if (typeof window !== 'undefined') window.alert('للتثبيت: من قائمة المتصفح اختر Install app أو Add to Home Screen.');
    return null;
  };

  if (isStandalone) return null;
  return (
    <button className="student-neo-install-btn" type="button" onClick={handleInstall} aria-label="تثبيت التطبيق">
      <Icon name="install" />
      <span>ثبّت التطبيق</span>
    </button>
  );
}

function Topbar({ ctx, theme, setTheme, currentTab, mobileOpen, setMobileOpen }) {
  const name = ctx.userData?.name || ctx.user?.displayName || 'طالب المنصة';
  const tabLabel = tabs.find((tab) => tab.key === currentTab)?.label || 'الصفحة الرئيسية';
  return (
    <header className="student-neo-topbar">
      <button className="student-neo-icon-btn student-neo-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="فتح القائمة">
        <Icon name={mobileOpen ? 'close' : 'menu'} />
      </button>
      <div className="student-neo-topbar__title student-neo-topbar__title--brand">
        <PlatformLogo variant="full" size="sm" strong />
        <h1>{tabLabel}</h1>
      </div>
      <div className="student-neo-topbar__actions">
        <InstallButton installPrompt={ctx.installPrompt} />
        <button className="student-neo-theme-switch" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="تبديل الوضع">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          <span>{theme === 'dark' ? 'نهاري' : 'ليلي'}</span>
        </button>
        <button className="student-neo-notify" onClick={() => ctx.setShowNotifications?.(true)}>
          <Icon name="bell" />
          {ctx.unseenNotificationCount > 0 && <b>{ctx.unseenNotificationCount}</b>}
        </button>
        <div className="student-neo-avatar">
          <StudentStudyIllustration />
          <span>{name}</span>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ ctx, active, setActive, open, setOpen }) {
  const name = ctx.userData?.name || ctx.user?.displayName || 'طالب المنصة';
  const grade = ctx.userData?.grade || 'الصف الدراسي';
  return (
    <aside className={`student-neo-sidebar ${open ? 'is-open' : ''}`}>
      <div className="student-neo-brand student-neo-brand--logo">
        <PlatformLogo variant="full" size="sm" strong />
        <strong>بوابة الطالب</strong>
      </div>
      <div className="student-neo-profile-card">
        <div className="student-neo-profile-card__art"><StudentStudyIllustration /></div>
        <h2>{`أهلًا يا ${name}`}</h2>
        <p>كمل بهدوء… كل درس تنجزه اليوم يقربك من النتيجة اللي تتمناها.</p>
        <span>{grade}</span>
      </div>
      <nav className="student-neo-nav" aria-label="تنقل الطالب">
        {tabs.map((tab) => (
          <button key={tab.key} className={active === tab.key ? 'is-active' : ''} onClick={() => { setActive(tab.key); setOpen(false); }}>
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <button className="student-neo-logout" onClick={() => signOut(auth)}>
        <Icon name="logout" />
        تسجيل الخروج
      </button>
    </aside>
  );
}

function MobileNav({ active, setActive }) {
  const mobileTabs = tabs.slice(0, 5);
  return (
    <nav className="student-neo-bottom-nav" aria-label="تنقل سريع">
      {mobileTabs.map((tab) => (
        <button key={tab.key} className={active === tab.key ? 'is-active' : ''} onClick={() => setActive(tab.key)}>
          <Icon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function NotificationsModal({ ctx }) {
  if (!ctx.showNotifications) return null;
  return (
    <div className="student-neo-modal-backdrop" onClick={() => ctx.setShowNotifications?.(false)}>
      <section className="student-neo-modal" onClick={(event) => event.stopPropagation()}>
        <div className="student-neo-modal__head">
          <div>
            <span>مركز التنبيهات</span>
            <h2>إشعارات المنصة</h2>
          </div>
          <button onClick={() => ctx.setShowNotifications?.(false)}><Icon name="close" /></button>
        </div>
        <div className="student-neo-list">
          {(ctx.notifications || []).length ? (ctx.notifications || []).map((notification, index) => (
            <article className="student-neo-notification" key={notification.id || index}>
              <strong>{notification.title || 'تنبيه جديد'}</strong>
              <p>{notification.body || notification.text || notification.message || 'لديك تحديث جديد داخل المنصة.'}</p>
              <small>{formatDate(notification.createdAt)}</small>
            </article>
          )) : <EmptyState icon="bell" title="لا توجد إشعارات الآن" text="أول ما يظهر جديد، هتلاقيه هنا فورًا." />}
        </div>
      </section>
    </div>
  );
}

function HomeView({ ctx }) {
  const next = getSuggestedAction(ctx);
  const recentVideos = [...(ctx.videos || [])].sort((a, b) => getOrderValue(a) - getOrderValue(b)).slice(0, 3);
  const recentNotifications = (ctx.recentNotificationItems || ctx.notifications || []).slice(0, 3);
  return (
    <div className="student-neo-section student-neo-section--home">
      <section className="student-neo-hero-card">
        <div className="student-neo-hero-card__content">
          <span className="student-neo-kicker">خطة مذاكرتك اليوم</span>
          <h2>جاهز تكسب درس جديد؟ خطوة صغيرة النهارده تفرق في الامتحان بكرة.</h2>
          <p>شد حيلك وابدأ من خطوتك التالية — كل إنجاز بسيط اليوم يبني ثقة أكبر ونتيجة أجمل غدًا.</p>
          <div className="student-neo-hero-card__actions">
            <NeoButton onClick={() => next?.action ? next.action() : ctx.setActiveTab?.('lectures')}><Icon name={next?.icon || 'spark'} />{next?.button || 'ابدأ المذاكرة'}</NeoButton>
            <NeoButton tone="ghost" onClick={() => ctx.setShowFocusMode?.(true)}><Icon name="shield" /> وضع التركيز</NeoButton>
          </div>
        </div>
        <div className="student-neo-focus-card">
          <div className="student-neo-focus-card__art">
            <ArabicStudySceneIllustration />
          </div>
          <div className="student-neo-focus-card__body">
            <span>الخطوة المقترحة</span>
            <h3>{next?.title || 'ابدأ من التعلم'}</h3>
            <p>{next?.text || 'افتح أحدث محتوى متاح لك.'}</p>
            <NeoButton tone="secondary" onClick={() => next?.action?.()}>{next?.button || 'ابدأ الآن'}</NeoButton>
          </div>
        </div>
      </section>

      <div className="student-neo-stats-grid">
        <StatCard icon="video" label="دروس ومحاضرات" value={(ctx.videos || []).length + (ctx.htmls || []).length + (ctx.interactiveExams || []).length} hint={`${ctx.completedVideoCount || 0} فيديو مكتمل`} />
        <StatCard icon="exam" label="اختبارات" value={(ctx.exams || []).length} hint={`متوسطك ${Math.round(ctx.averageScore || 0)}%`} />
        <StatCard icon="target" label="واجبات مطلوبة" value={ctx.pendingAssignmentsCount || 0} hint="تابعها قبل ما تتراكم" />
        <StatCard icon="crown" label="الاشتراك" value={ctx.isPremium ? 'VIP' : 'Free'} hint={ctx.isPremium ? `${ctx.subscriptionDaysLeft ?? '—'} يوم متبقي` : 'يمكنك الترقية'} />
      </div>

      <div className="student-neo-two-cols">
        <section className="student-neo-panel">
          <div className="student-neo-panel__head"><h3>الدروس حسب ترتيب الإدارة</h3><button onClick={() => ctx.setActiveTab?.('lectures')}>عرض الكل</button></div>
          <div className="student-neo-card-list">
            {recentVideos.length ? recentVideos.map((item) => <LectureCard key={item.id || getContentTitle(item)} item={item} ctx={ctx} compact />) : <EmptyState icon="video" title="لا توجد دروس بعد" text="أول درس يتضاف من الإدارة هيظهر هنا تلقائيًا." />}
          </div>
        </section>
        <section className="student-neo-panel">
          <div className="student-neo-panel__head"><h3>آخر التنبيهات</h3><button onClick={() => ctx.setShowNotifications?.(true)}>فتح</button></div>
          <div className="student-neo-card-list">
            {recentNotifications.length ? recentNotifications.map((item, index) => (
              <article className="student-neo-mini-row" key={item.id || index}>
                <Icon name="bell" />
                <div><strong>{item.title || 'تنبيه جديد'}</strong><p>{item.body || item.text || item.message || 'تحديث جديد داخل حسابك.'}</p></div>
              </article>
            )) : <EmptyState icon="bell" title="لا توجد إشعارات" text="هدوء جميل… لحد ما الأدمن يقرر يحمّسنا شوية." />}
          </div>
        </section>
      </div>
    </div>
  );
}

function LectureCard({ item, ctx, compact = false, type = 'video' }) {
  const title = getContentTitle(item, type === 'html' ? 'درس تفاعلي' : 'محاضرة');
  const text = getContentText(item);
  const watchPercent = type === 'video' && ctx.getVideoWatchPercent ? ctx.getVideoWatchPercent(item) : null;
  const locked = ctx.isBannedContent || (!ctx.isPremium && item?.isPremium);
  const open = () => {
    if (locked) return ctx.handlePremiumClick?.(() => {});
    if (type === 'html' || type === 'interactive') return ctx.setPlayingHtml?.(item);
    return ctx.handlePremiumClick ? ctx.handlePremiumClick(() => ctx.setPlayingVideo?.(item)) : ctx.setPlayingVideo?.(item);
  };
  return (
    <article className={`student-neo-content-card ${compact ? 'is-compact' : ''}`}>
      <div className="student-neo-content-card__media">
        <Icon name={type === 'video' ? 'video' : 'learn'} size={30} />
        {item?.isPremium && <b>VIP</b>}
      </div>
      <div className="student-neo-content-card__body">
        <h3>{title}</h3>
        <p>{text}</p>
        {watchPercent !== null && (
          <div className="student-neo-progress"><span style={{ width: `${Math.min(100, Math.max(0, watchPercent))}%` }} /><em>{watchPercent}%</em></div>
        )}
        <div className="student-neo-content-card__actions">
          <NeoButton onClick={open} disabled={locked && !ctx.handlePremiumClick}>{locked ? 'مغلق' : 'فتح الآن'}</NeoButton>
          {type === 'video' && item?.linkedExamId && <NeoButton tone="ghost" onClick={() => ctx.openLinkedExamFromVideo?.(item)}>اختبار الدرس</NeoButton>}
        </div>
      </div>
    </article>
  );
}

function LecturesView({ ctx }) {
  const videos = [...(ctx.videos || [])].sort((a, b) => getOrderValue(a) - getOrderValue(b));
  const htmls = [...(ctx.htmls || [])].sort((a, b) => getOrderValue(a) - getOrderValue(b));
  const interactive = [...(ctx.interactiveExams || [])].sort((a, b) => getOrderValue(a) - getOrderValue(b));
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="مكتبة التعلم" title="ابدأ من الدرس المناسب الآن" text="كل درس هنا خطوة جديدة تقرّبك من الفهم السهل والحل بثقة أكبر." />
      <ContentGroup title="الفيديوهات والمحاضرات" icon="video" count={videos.length}>{videos.map((item) => <LectureCard key={item.id || getContentTitle(item)} item={item} ctx={ctx} />)}</ContentGroup>
      <ContentGroup title="الدروس التفاعلية" icon="learn" count={htmls.length + interactive.length}>
        {htmls.map((item) => <LectureCard key={item.id || getContentTitle(item)} item={item} ctx={ctx} type="html" />)}
        {interactive.map((item) => <LectureCard key={item.id || getContentTitle(item)} item={item} ctx={ctx} type="interactive" />)}
      </ContentGroup>
      {!videos.length && !htmls.length && !interactive.length && <EmptyState icon="learn" title="لا يوجد محتوى مرفوع حاليًا" text="أول فيديو أو درس يتضاف من الإدارة هيظهر هنا بتصميمه الجديد." />}
    </div>
  );
}

function ContentGroup({ title, icon, count, children }) {
  if (!count) return null;
  return (
    <section className="student-neo-content-group">
      <div className="student-neo-content-group__head"><Icon name={icon} /><h3>{title}</h3><span>{count}</span></div>
      <div className="student-neo-grid-cards">{children}</div>
    </section>
  );
}

function FilesView({ ctx }) {
  const files = ctx.filesAndLinks || [];
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="المكتبة" title="مراجعك المهمة في مكان واحد" text="هنا ستجد كل ما تحتاجه من ملفات وروابط مرتبة لتصل للمعلومة بسرعة وراحة." />
      <div className="student-neo-grid-cards student-neo-grid-cards--files">
        {files.map((item) => {
          const url = getFileUrl(item);
          return (
            <article className="student-neo-file-card" key={item.id || getContentTitle(item)}>
              <div><Icon name="file" size={30} /></div>
              <h3>{getContentTitle(item, 'ملف دراسي')}</h3>
              <p>{getContentText(item)}</p>
              <NeoButton href={url} disabled={!url} tone="secondary"><Icon name="download" /> فتح الملف</NeoButton>
            </article>
          );
        })}
      </div>
      {!files.length && <EmptyState icon="file" title="لا توجد ملفات متاحة" text="عند رفع مذكرات أو روابط، هتظهر هنا فورًا." />}
    </div>
  );
}

function ExamsView({ ctx }) {
  const exams = ctx.exams || [];
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="الاختبارات" title="اختبر نفسك واطمئن على مستواك" text="حل الاختبارات المتاحة وراقب تطورك خطوة بخطوة حتى تصل لأفضل نتيجة." />
      <div className="student-neo-table-cards">
        {exams.map((exam) => {
          const access = ctx.getExamAccessState ? ctx.getExamAccessState(exam) : { allowed: true };
          const previous = (ctx.examResults || []).find((result) => result.examId === exam.id);
          return (
            <article className="student-neo-exam-card" key={exam.id || exam.title}>
              <div className="student-neo-exam-card__icon"><Icon name="exam" /></div>
              <div>
                <h3>{exam.title || 'امتحان بدون عنوان'}</h3>
                <p>{exam.description || `من ${formatDate(exam.startTime)} إلى ${formatDate(exam.endTime)}`}</p>
                {previous && <small>آخر حالة: {previous.status || 'محاولة مسجلة'} {previous.score !== undefined ? `— الدرجة ${previous.score}` : ''}</small>}
              </div>
              <NeoButton onClick={() => ctx.startExamWithCode?.(exam)} disabled={ctx.isBannedExam || !access.allowed}>
                {ctx.isBannedExam ? 'محظور' : access.allowed ? 'دخول الامتحان' : 'مغلق'}
              </NeoButton>
            </article>
          );
        })}
      </div>
      {!exams.length && <EmptyState icon="exam" title="لا توجد امتحانات الآن" text="أول امتحان يتنشر من الإدارة هيظهر هنا مباشرة." />}
    </div>
  );
}

function AssignmentsView({ ctx }) {
  const assignments = ctx.assignments || [];
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="الواجبات" title="أنجز واجباتك في وقتها" text="تابع المطلوب منك أولًا بأول، وخلّص واجباتك بهدوء قبل موعد التسليم." />
      <div className="student-neo-grid-cards">
        {assignments.map((assignment) => {
          const submission = (ctx.assignmentSubmissions || []).find((item) => item.assignmentId === assignment.id);
          return (
            <article className="student-neo-assignment-card" key={assignment.id || assignment.title}>
              <div className="student-neo-status-pill"><Icon name={submission ? 'check' : 'clock'} /> {submission ? 'تم التسليم' : 'مطلوب'}</div>
              <h3>{assignment.title || 'واجب جديد'}</h3>
              <p>{assignment.description || assignment.instructions || 'افتح تفاصيل الواجب من المنصة.'}</p>
              <small>آخر موعد: {formatDate(assignment.dueDate || assignment.deadline)}</small>
              <NeoButton onClick={() => assignment.id ? ctx.setScanningHwId?.(assignment.id) : null} tone="secondary">فتح الواجب</NeoButton>
            </article>
          );
        })}
      </div>
      {!assignments.length && <EmptyState icon="target" title="لا توجد واجبات" text="استمتع بالهدوء المؤقت، غالبًا مش هيطول." />}
    </div>
  );
}

function PerformanceView({ ctx }) {
  const results = ctx.examResults || [];
  const weak = ctx.weakBranches || [];
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="التقدم" title="نتائجك وخطة التحسين" text="نظرة واضحة على مستواك ونقاط المراجعة المطلوبة." />
      <div className="student-neo-stats-grid">
        <StatCard icon="chart" label="متوسط الدرجات" value={`${Math.round(ctx.averageScore || 0)}%`} />
        <StatCard icon="trophy" label="اختبارات مكتملة" value={(ctx.completedExamResults || []).length} />
        <StatCard icon="video" label="إنجاز الفيديوهات" value={`${ctx.videoCompletionPercent || 0}%`} />
        <StatCard icon="target" label="نقاط تحتاج مراجعة" value={weak.length || 0} />
      </div>
      <div className="student-neo-two-cols">
        <section className="student-neo-panel">
          <div className="student-neo-panel__head"><h3>آخر النتائج</h3></div>
          <div className="student-neo-card-list">
            {results.slice(0, 8).map((result) => (
              <article className="student-neo-mini-row" key={result.id || `${result.examId}-${result.submittedAt}`}>
                <Icon name="exam" />
                <div><strong>{result.examTitle || result.title || 'امتحان'}</strong><p>الحالة: {result.status || 'مسجل'} — النتيجة: {result.percentage ?? result.percent ?? result.score ?? '—'}</p></div>
              </article>
            ))}
            {!results.length && <EmptyState icon="chart" title="لا توجد نتائج بعد" text="ابدأ أول امتحان، وهنحسب لك الصورة كاملة." />}
          </div>
        </section>
        <section className="student-neo-panel">
          <div className="student-neo-panel__head"><h3>خطة التحسين</h3></div>
          <div className="student-neo-chips">
            {weak.length ? weak.slice(0, 12).map((item, index) => <span key={`${item}-${index}`}>{String(item?.name || item?.branch || item)}</span>) : <span>لا توجد نقاط ضعف واضحة حاليًا</span>}
          </div>
          <NeoButton tone="ghost" onClick={() => ctx.startMistakesExam?.()}>ابدأ اختبار بنك الأخطاء</NeoButton>
        </section>
      </div>
    </div>
  );
}

function SubscriptionView({ ctx }) {
  const draft = ctx.paymentDraft || {};
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="الاشتراك" title="الباقة والدفع" text="اشحن كود الاشتراك أو أرسل طلب دفع للإدارة." />
      <div className="student-neo-two-cols">
        <section className="student-neo-panel student-neo-plan-card">
          <Icon name="crown" size={38} />
          <h3>{ctx.isPremium ? 'أنت مشترك VIP' : 'الباقة المجانية'}</h3>
          <p>{ctx.isPremium ? `متبقي تقريبًا ${ctx.subscriptionDaysLeft ?? '—'} يوم.` : 'يمكنك الترقية للوصول الكامل للمحتوى المدفوع.'}</p>
          <div className="student-neo-field-row">
            <input value={ctx.subscriptionCodeInput || ''} onChange={(event) => ctx.setSubscriptionCodeInput?.(event.target.value)} placeholder="أدخل كود الاشتراك" />
            <NeoButton onClick={ctx.handleChargeSubscriptionCode} disabled={ctx.isCharging}>{ctx.isCharging ? 'جاري الشحن...' : 'شحن'}</NeoButton>
          </div>
        </section>
        <section className="student-neo-panel">
          <h3>طلب دفع</h3>
          <div className="student-neo-form-grid">
            <input value={draft.amount || ''} onChange={(event) => ctx.setPaymentDraft?.({ ...draft, amount: event.target.value })} placeholder="المبلغ" />
            <input value={draft.method || ''} onChange={(event) => ctx.setPaymentDraft?.({ ...draft, method: event.target.value })} placeholder="طريقة الدفع" />
            <textarea value={draft.note || ''} onChange={(event) => ctx.setPaymentDraft?.({ ...draft, note: event.target.value })} placeholder="ملاحظات أو رقم العملية" />
          </div>
          <NeoButton onClick={ctx.handleSubmitPaymentRequest} disabled={ctx.isSendingPayment}>{ctx.isSendingPayment ? 'جاري الإرسال...' : 'إرسال الطلب'}</NeoButton>
        </section>
      </div>
    </div>
  );
}

function SupportView({ ctx }) {
  const draft = ctx.supportDraft || {};
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="الدعم" title="تواصل مع الإدارة" text="اكتب مشكلتك بوضوح، وسيتم حفظها داخل نظام الدعم." />
      <section className="student-neo-panel student-neo-support-panel">
        <div className="student-neo-form-grid">
          <input value={draft.title || ''} onChange={(event) => ctx.setSupportDraft?.({ ...draft, title: event.target.value })} placeholder="عنوان الرسالة" />
          <textarea value={draft.message || ''} onChange={(event) => ctx.setSupportDraft?.({ ...draft, message: event.target.value })} placeholder="اكتب التفاصيل هنا" />
        </div>
        <NeoButton onClick={ctx.handleSendSupportTicket} disabled={ctx.isSendingSupport}>{ctx.isSendingSupport ? 'جاري الإرسال...' : 'إرسال للدعم'}</NeoButton>
      </section>
    </div>
  );
}

function ProfileView({ ctx }) {
  const form = ctx.editFormData || {};
  return (
    <div className="student-neo-section">
      <SectionHeader kicker="حسابي" title="بيانات الطالب" text="تعديل سريع لبياناتك الأساسية." />
      <section className="student-neo-panel">
        <div className="student-neo-form-grid">
          <input value={form.name || ''} onChange={(event) => ctx.setEditFormData?.({ ...form, name: event.target.value })} placeholder="الاسم" />
          <input value={form.phone || ''} onChange={(event) => ctx.setEditFormData?.({ ...form, phone: event.target.value })} placeholder="رقم الطالب" />
          <input value={form.parentPhone || ''} onChange={(event) => ctx.setEditFormData?.({ ...form, parentPhone: event.target.value })} placeholder="رقم ولي الأمر" />
          <input value={form.grade || ''} onChange={(event) => ctx.setEditFormData?.({ ...form, grade: event.target.value })} placeholder="الصف" />
        </div>
        <div className="student-neo-profile-actions">
          <NeoButton onClick={ctx.handleUpdateMyProfile}>حفظ البيانات</NeoButton>
          <NeoButton tone="ghost" onClick={() => signOut(auth)}>تسجيل الخروج</NeoButton>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ kicker, title, text }) {
  return (
    <div className="student-neo-section-head">
      <span>{kicker}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function ActiveView({ active, ctx }) {
  switch (active) {
    case 'lectures': return <LecturesView ctx={ctx} />;
    case 'files': return <FilesView ctx={ctx} />;
    case 'exams': return <ExamsView ctx={ctx} />;
    case 'assignments': return <AssignmentsView ctx={ctx} />;
    case 'performance': return <PerformanceView ctx={ctx} />;
    case 'subscription': return <SubscriptionView ctx={ctx} />;
    case 'support': return <SupportView ctx={ctx} />;
    case 'profile': return <ProfileView ctx={ctx} />;
    case 'home':
    default: return <HomeView ctx={ctx} />;
  }
}

export const StudentDashboardMainView = ({ ctx }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('studentNeoTheme') || 'dark';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem('studentNeoTheme', theme);
  }, [theme]);

  const active = useMemo(() => {
    const requested = ctx.activeTab || 'home';
    const normalized = tabAliases[requested] || requested;
    return tabs.some((tab) => tab.key === normalized) ? normalized : 'home';
  }, [ctx.activeTab]);

  const setActive = (key) => ctx.setActiveTab?.(key);

  return (
    <LazyPanel>
      <div className={`student-neo-shell student-neo-shell--${theme}`} data-theme={theme} dir="rtl">
        <ArabicLettersField />
        {mobileOpen && <button className="student-neo-mobile-overlay" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)} />}
        <Sidebar ctx={ctx} active={active} setActive={setActive} open={mobileOpen} setOpen={setMobileOpen} />
        <main className="student-neo-main">
          <Topbar ctx={ctx} theme={theme} setTheme={setTheme} currentTab={active} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          <ActiveView active={active} ctx={{ ...ctx, setActiveTab: setActive }} />
        </main>
        <MobileNav active={active} setActive={setActive} />
        <NotificationsModal ctx={ctx} />
        {ctx.playingVideo && <LazyPanel><SecureVideoPlayer video={ctx.playingVideo} user={ctx.user} userName={ctx.userData?.name} onClose={() => ctx.setPlayingVideo?.(null)} onProgress={ctx.handleVideoProgress} /></LazyPanel>}
        {ctx.playingHtml && <LazyPanel><InteractiveViewer content={ctx.playingHtml} user={ctx.userData} onClose={() => ctx.setPlayingHtml?.(null)} /></LazyPanel>}
        {ctx.preExam && (
          <LazyPanel>
            <ExamPreStartPanel
              exam={ctx.preExam}
              results={ctx.examResults}
              previousExam={ctx.preExam.accessRule?.requiredExamId ? (ctx.exams || []).find((exam) => exam.id === ctx.preExam.accessRule.requiredExamId) : null}
              previousPercent={(() => {
                const previousResults = ctx.preExam.accessRule?.requiredExamId ? (ctx.examResults || []).filter((result) => result.examId === ctx.preExam.accessRule.requiredExamId && result.status === 'completed') : [];
                return previousResults.length ? Math.max(...previousResults.map((result) => Number(result.percentage ?? result.percent ?? result.scorePercentage ?? result.score ?? 0))) : null;
              })()}
              onStart={() => { const target = ctx.preExam; ctx.setPreExam?.(null); ctx.startExamWithCode?.(target); }}
              onClose={() => ctx.setPreExam?.(null)}
            />
          </LazyPanel>
        )}
        {ctx.scanningHwId && <LazyPanel><SmartHomeworkScanner hwId={ctx.scanningHwId} user={ctx.user} onClose={() => ctx.setScanningHwId?.(null)} /></LazyPanel>}
      </div>
    </LazyPanel>
  );
};

export default StudentDashboardMainView;
