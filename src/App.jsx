import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import LoadingScreen from './components/LoadingScreen.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

const pageMeta = {
  landing: { title: 'الرئيسية', icon: Compass },
  login: { title: 'تسجيل الدخول', icon: LogIn },
  register: { title: 'إنشاء حساب', icon: UserPlus },
  student: { title: 'لوحة الطالب', icon: GraduationCap },
  admin: { title: 'لوحة الأدمن', icon: LayoutDashboard },
};

const quickActions = [
  { key: 'landing', label: 'منصة مبهرة', icon: Sparkles },
  { key: 'login', label: 'دخول حديث', icon: ShieldCheck },
  { key: 'register', label: 'حساب جديد', icon: UserPlus },
  { key: 'student', label: 'تجربة الطالب', icon: BookOpen },
  { key: 'admin', label: 'داشبورد الأدمن', icon: BrainCircuit },
];

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [currentPage, setCurrentPage] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [loaderProgress, setLoaderProgress] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    let frame;
    let mounted = true;
    let progress = 0;

    const step = () => {
      progress += progress < 70 ? 4 : progress < 90 ? 2 : 1;
      if (mounted) setLoaderProgress(Math.min(progress, 100));
      if (progress < 100) {
        frame = window.setTimeout(step, 65);
      } else {
        frame = window.setTimeout(() => {
          if (mounted) setIsLoading(false);
        }, 350);
      }
    };

    step();
    return () => {
      mounted = false;
      clearTimeout(frame);
    };
  }, []);

  const CurrentPage = useMemo(() => {
    switch (currentPage) {
      case 'login':
        return LoginPage;
      case 'register':
        return RegisterPage;
      case 'student':
        return StudentDashboard;
      case 'admin':
        return AdminDashboard;
      case 'landing':
      default:
        return LandingPage;
    }
  }, [currentPage]);

  return (
    <div className="app-shell">
      <AnimatedBackdrop />
      <AnimatePresence>{isLoading && <LoadingScreen progress={loaderProgress} theme={theme} />}</AnimatePresence>

      <header className="global-topbar shell-width">
        <div className="brand-cluster" onClick={() => setCurrentPage('landing')} role="button" tabIndex={0}>
          <div className="brand-mark glow-ring">
            <span>PE</span>
          </div>
          <div>
            <p className="eyebrow">مكان اللوجو</p>
            <h1>منصة الجيل الذكي</h1>
          </div>
        </div>

        <nav className="global-nav">
          {Object.entries(pageMeta).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <button
                key={key}
                type="button"
                className={`nav-pill ${currentPage === key ? 'active' : ''}`}
                onClick={() => setCurrentPage(key)}
              >
                <Icon size={16} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="topbar-actions">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button className="cta-button ghost" type="button" onClick={() => setCurrentPage('student')}>
            <Rocket size={16} />
            دخول تجريبي
          </button>
        </div>
      </header>

      <div className="floating-switcher shell-width glow-card">
        <div>
          <p className="eyebrow">إعادة بناء كاملة</p>
          <h2>تم هدم الواجهة القديمة واستبدالها بنظام تصميم جديد بالكامل</h2>
        </div>
        <div className="quick-action-list">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} type="button" className="quick-action" onClick={() => setCurrentPage(item.key)}>
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="shell-width page-host">
        <CurrentPage setCurrentPage={setCurrentPage} theme={theme} />
      </main>

      <footer className="global-footer shell-width glow-card">
        <div className="footer-logo-placeholder glow-ring">
          <span>LOGO</span>
        </div>
        <div>
          <p className="eyebrow">مكان اللوجو في البداية والوسط والنهاية</p>
          <h3>تم تجهيز الهيكل الجديد ليدعم الهوية البصرية وصورة المستخدم الشخصية بسهولة.</h3>
        </div>
        <button className="cta-button" type="button" onClick={() => setCurrentPage('admin')}>
          الانتقال إلى لوحة الأدمن
          <ArrowRight size={16} />
        </button>
      </footer>
    </div>
  );
}

function AnimatedBackdrop() {
  return (
    <div className="background-stage" aria-hidden="true">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />
      <div className="grid-overlay" />
      <div className="beam beam-a" />
      <div className="beam beam-b" />
    </div>
  );
}
