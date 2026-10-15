// Student app, v2. One tree, four presentations chosen by <html data-platform data-form>:
// iPhone (large title + frosted tab bar), Android (Material app bar + navigation bar),
// tablet (navigation rail) and desktop (sidebar + search + Ctrl/⌘K).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@services/firebase';
import { getGradeLabel } from '@shared/constants/grades';
import logoLight from '@assets/nahhas-logo-transparent.webp';
import logoDark from '@assets/nahhas-logo-dark.webp';
import { Icon } from '../ui/Icon.jsx';
import { IconButton, Segmented, formatNumber } from '../ui/kit.jsx';
import { useDevice, useOnline } from '../device/useDevice.js';
import { haptic, onBackButton } from '../device/native.js';
import { usePrefs } from '../prefs.js';
import { SECTIONS, SUBS, parseRoute, routeTitle } from './nav.js';
import { examBuckets } from './insights.js';
import { CommandPalette, NotificationsSheet } from './parts.jsx';
import { ExamPreStartPanel, InteractiveViewer, Overlay, SecureVideoPlayer, SmartHomeworkScanner, EmbedFallback } from './embeds.jsx';
import HomeView from './views/HomeView.jsx';
import '../styles/student.css';

const LearnView = lazy(() => import('./views/LearnView.jsx'));
const ExamsView = lazy(() => import('./views/ExamsView.jsx'));
const ProgressView = lazy(() => import('./views/ProgressView.jsx'));
const AccountView = lazy(() => import('./views/AccountView.jsx'));

const firstName = (name) => String(name || 'طالب').trim().split(/\s+/)[0];

function Avatar({ ctx, size }) {
  const name = ctx.userData?.name || 'طالب';
  const photo = ctx.userData?.photoURL || ctx.user?.photoURL;
  return <span className={`nx-avatar ${size === 'l' ? 'nx-avatar--l' : ''}`} aria-hidden="true">{photo ? <img src={photo} alt="" loading="lazy" /> : name.trim().charAt(0)}</span>;
}

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > threshold));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); };
  }, [threshold]);
  return scrolled;
}

/* ───── phone: iPhone and Android headers ───── */
function PhoneTop({ ctx, route, device, theme, title, onSearch, onBell, go }) {
  const scrolled = useScrolled(route.section === 'home' ? 70 : 24);
  const isHome = route.section === 'home';
  const actions = (
    <>
      <IconButton icon="search" label="بحث" plain onClick={onSearch} />
      <IconButton icon="bell" label="الإشعارات" plain badge={ctx.unseenNotificationCount || null} onClick={onBell} />
    </>
  );
  if (device.platform === 'ios') {
    return (
      <header className={`nx-top ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nx-top__bar">
          <div className="nx-top__side">
            {isHome ? <img className="nx-top__logo" src={theme === 'dark' ? logoDark : logoLight} alt="منصة النحاس" style={{ height: 30, opacity: scrolled ? 0 : 1, transition: 'opacity .2s' }} />
              : <button type="button" className="nx-sec__more" style={{ fontSize: 'var(--nx-fs-m)' }} onClick={() => go('home')}><Icon name="chevronRight" />الرئيسية</button>}
          </div>
          <div className="nx-top__title">{isHome ? `أهلاً ${firstName(ctx.userData?.name)}` : title}</div>
          <div className="nx-top__side nx-top__side--end">{actions}</div>
        </div>
        {!isHome && <h1 className="nx-top__large" style={{ opacity: scrolled ? 0 : 1 }}>{title}</h1>}
      </header>
    );
  }
  return (
    <header className={`nx-top ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nx-top__bar">
        {isHome
          ? <img className="nx-top__logo" src={theme === 'dark' ? logoDark : logoLight} alt="منصة النحاس" />
          : <IconButton icon="arrowRight" label="رجوع" plain onClick={() => go('home')} />}
        <div className="nx-top__title">{isHome ? '' : title}</div>
        <div className="nx-top__actions">
          {actions}
          <button type="button" className="nx-iconbtn nx-iconbtn--plain" aria-label="حسابي" onClick={() => go('account:profile')}><Avatar ctx={ctx} /></button>
        </div>
      </div>
    </header>
  );
}

function TabBar({ route, go, badges }) {
  return (
    <nav className="nx nx-tabbar" aria-label="التنقل الرئيسي">
      {SECTIONS.map((s) => (
        <button key={s.key} type="button" className="nx-tab" aria-current={route.section === s.key ? 'page' : undefined} onClick={() => go(s.key)}>
          <span className="nx-tab__pill"><Icon name={s.icon} /></span>
          <span>{s.label}</span>
          {badges[s.key] ? <span className="nx-dot" aria-label={`${badges[s.key]} جديد`} /> : null}
        </button>
      ))}
    </nav>
  );
}

/* ───── tablet: navigation rail ───── */
function Rail({ route, go, badges, theme, toggleTheme }) {
  return (
    <nav className="nx-rail" aria-label="التنقل الرئيسي">
      <img className="nx-rail__mark" src={theme === 'dark' ? logoDark : logoLight} alt="منصة النحاس" />
      {SECTIONS.map((s) => (
        <button key={s.key} type="button" className="nx-tab" aria-current={route.section === s.key ? 'page' : undefined} onClick={() => go(s.key)}>
          <span className="nx-tab__pill"><Icon name={s.icon} />{badges[s.key] ? <span className="nx-dot" /> : null}</span>
          <span>{s.label}</span>
        </button>
      ))}
      <span className="nx-rail__spacer" />
      <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'} plain onClick={toggleTheme} />
    </nav>
  );
}

/* ───── desktop: sidebar ───── */
function Sidebar({ ctx, route, go, badges, theme, toggleTheme }) {
  return (
    <aside className="nx-side" aria-label="التنقل الرئيسي">
      <img className="nx-side__logo" src={theme === 'dark' ? logoDark : logoLight} alt="منصة النحاس" />
      {SECTIONS.map((s) => {
        const active = route.section === s.key;
        return (
          <div key={s.key}>
            <button type="button" className="nx-navitem" aria-current={active && (!SUBS[s.key] || s.key === 'home') ? 'page' : undefined}
              style={active && SUBS[s.key] ? { color: 'var(--nx-ink)', fontWeight: 600 } : undefined} onClick={() => go(s.key)}>
              <Icon name={s.icon} />{s.title}
              {badges[s.key] ? <span className="nx-chip nx-chip--copper">{formatNumber(badges[s.key])}</span> : null}
            </button>
            {active && (SUBS[s.key] || []).map((sub) => (
              <button key={sub.key} type="button" className="nx-navitem nx-navitem--sub" aria-current={route.sub === sub.key ? 'page' : undefined} onClick={() => go(`${s.key}:${sub.key}`)}>
                {sub.label}
              </button>
            ))}
          </div>
        );
      })}
      <div className="nx-side__foot">
        <button type="button" className="nx-navitem" onClick={toggleTheme}><Icon name={theme === 'dark' ? 'sun' : 'moon'} />{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</button>
        <div className="nx-me">
          <Avatar ctx={ctx} />
          <div className="nx-me__txt"><b>{ctx.userData?.name}</b><span>{getGradeLabel(ctx.userData?.grade)}</span></div>
          <IconButton icon="logout" label="تسجيل الخروج" plain onClick={() => signOut(auth)} />
        </div>
      </div>
    </aside>
  );
}

function DeskBar({ ctx, device, title, section, onSearch, onBell, go }) {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  return (
    <header className="nx-deskbar">
      <div className="nx-deskbar__title">
        <small>{section === 'home' ? new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }) : SECTIONS.find((s) => s.key === section)?.title}</small>
        <b>{section === 'home' ? `أهلاً يا ${firstName(ctx.userData?.name)}` : title}</b>
      </div>
      <button type="button" className="nx-search" onClick={onSearch} aria-label="بحث">
        <Icon name="search" /><span>دوّر على درس أو امتحان</span>
        {device.form === 'desktop' && <span className="nx-kbd">{mac ? '⌘' : 'Ctrl'} K</span>}
      </button>
      <IconButton icon="bell" label="الإشعارات" badge={ctx.unseenNotificationCount || null} onClick={onBell} />
      {device.form === 'tablet' && <button type="button" className="nx-iconbtn nx-iconbtn--plain" aria-label="حسابي" onClick={() => go('account:profile')}><Avatar ctx={ctx} /></button>}
    </header>
  );
}

function SubNav({ route, go, counts }) {
  const subs = SUBS[route.section];
  if (!subs || route.section === 'home') return null;
  return (
    <div className="nx-subnav">
      <Segmented label={SECTIONS.find((s) => s.key === route.section)?.title} value={route.sub} onChange={(sub) => go(`${route.section}:${sub}`)}
        items={subs.map((s) => ({ ...s, icon: undefined, count: counts[`${route.section}:${s.key}`] }))} />
    </div>
  );
}

export default function StudentAppV2({ ctx }) {
  const device = useDevice();
  const online = useOnline();
  const { theme, toggleTheme } = usePrefs();
  const [searchOpen, setSearchOpen] = useState(false);
  const route = useMemo(() => parseRoute(ctx.activeTab), [ctx.activeTab]);
  const routeRef = useRef(route);
  routeRef.current = route;
  const title = routeTitle(route);

  // Navigation goes through browser history so the back gesture / Android back button walks back through pages.
  const go = useCallback((key, { replace = false } = {}) => {
    const next = parseRoute(key);
    if (next.key === routeRef.current.key) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    haptic('select');
    try {
      const state = { ...(window.history.state || {}), nxTab: next.key };
      if (replace || next.section === routeRef.current.section) window.history.replaceState(state, '');
      else window.history.pushState(state, '');
    } catch { /* history blocked in some webviews */ }
    ctx.setActiveTab(next.key);
    window.scrollTo({ top: 0 });
  }, [ctx]);

  useEffect(() => {
    try { window.history.replaceState({ ...(window.history.state || {}), nxTab: routeRef.current.key }, ''); } catch { /* ignore */ }
    const onPop = (event) => {
      const tab = event.state?.nxTab;
      ctx.setActiveTab(tab || 'home');
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Android back: overlays first (they register later), then pages, then minimise from Home.
  useEffect(() => onBackButton(() => {
    if (ctx.playingVideo) { ctx.setPlayingVideo(null); return true; }
    if (ctx.playingHtml) { ctx.setPlayingHtml(null); return true; }
    if (ctx.preExam) { ctx.setPreExam(null); return true; }
    if (ctx.scanningHwId) { ctx.setScanningHwId(null); return true; }
    if (routeRef.current.section !== 'home') { go('home', { replace: true }); return true; }
    return false;
  }), [ctx, go]);

  // Ctrl/⌘ + K opens search everywhere; "/" too when not typing.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(e.target?.tagName || '') || e.target?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearchOpen((v) => !v); }
      else if (e.key === '/' && !typing) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const buckets = useMemo(() => examBuckets(ctx), [ctx.exams, ctx.examResults]); // eslint-disable-line react-hooks/exhaustive-deps
  const badges = {
    exams: buckets.open.length + (ctx.pendingAssignmentsCount || 0),
    progress: 0,
    account: 0,
    learn: 0,
    home: 0,
  };
  const counts = {
    'exams:open': buckets.open.length,
    'exams:upcoming': buckets.upcoming.length,
    'exams:homework': ctx.pendingAssignmentsCount || 0,
    'progress:mistakes': (ctx.mistakes || []).length,
  };

  const openRow = (row) => {
    if (row.kind === 'video') ctx.handlePremiumClick(() => ctx.setPlayingVideo(row.item));
    else if (row.kind === 'html') ctx.handlePremiumClick(() => ctx.setPlayingHtml(row.item));
    else if (row.kind === 'file') {
      const url = row.item.url || row.item.fileUrl || row.item.downloadUrl || row.item.link;
      if (url) window.open(url, '_blank', 'noopener'); else go('learn:files');
    } else if (row.kind === 'exam') go('exams:open');
    else if (row.kind === 'homework') go('exams:homework');
  };

  const view = (() => {
    const props = { ctx, route, go, buckets };
    switch (route.section) {
      case 'learn': return <LearnView {...props} />;
      case 'exams': return <ExamsView {...props} />;
      case 'progress': return <ProgressView {...props} />;
      case 'account': return <AccountView {...props} />;
      default: return <HomeView {...props} />;
    }
  })();

  const phone = device.form === 'phone';
  const bell = () => {
    ctx.setShowNotifications(true);
    if (ctx.setHasNewNotif) ctx.setHasNewNotif(false);
  };

  return (
    <div className="nx nx-app" dir="rtl" data-section={route.section}>
      {!online && <div className="nx-offline" role="status"><Icon name="wifiOff" size={14} /> مفيش إنترنت دلوقتي. اللي اتحمّل هيفضل ظاهر، وهنكمّل أول ما النت يرجع.</div>}
      {device.form === 'desktop' && <Sidebar ctx={ctx} route={route} go={go} badges={badges} theme={theme} toggleTheme={toggleTheme} />}
      {device.form === 'tablet' && <Rail route={route} go={go} badges={badges} theme={theme} toggleTheme={toggleTheme} />}
      <div className="nx-main">
        {phone
          ? <PhoneTop ctx={ctx} route={route} device={device} theme={theme} title={SECTIONS.find((s) => s.key === route.section)?.title || title} onSearch={() => setSearchOpen(true)} onBell={bell} go={go} />
          : <DeskBar ctx={ctx} device={device} title={title} section={route.section} onSearch={() => setSearchOpen(true)} onBell={bell} go={go} />}
        <main className="nx-content" id="nx-main">
          <SubNav route={route} go={go} counts={counts} />
          <div className="nx-page" key={route.key}>
            <Suspense fallback={<EmbedFallback />}>{view}</Suspense>
          </div>
        </main>
      </div>
      {phone && <TabBar route={route} go={go} badges={badges} />}

      <NotificationsSheet ctx={ctx} open={Boolean(ctx.showNotifications)} onClose={() => ctx.setShowNotifications(false)} />
      <CommandPalette ctx={ctx} open={searchOpen} onClose={() => setSearchOpen(false)} onOpenRow={openRow} />

      {ctx.playingVideo && <Overlay><SecureVideoPlayer video={ctx.playingVideo} user={ctx.user} userName={ctx.userData?.name} onClose={() => ctx.setPlayingVideo(null)} onProgress={ctx.handleVideoProgress} /></Overlay>}
      {ctx.playingHtml && <Overlay><InteractiveViewer content={ctx.playingHtml} user={ctx.userData} onClose={() => ctx.setPlayingHtml(null)} /></Overlay>}
      {ctx.preExam && (
        <Overlay>
          <div className="nx-bridge">
            <ExamPreStartPanel
              exam={ctx.preExam}
              results={ctx.examResults}
              previousExam={ctx.preExam.accessRule?.requiredExamId ? (ctx.exams || []).find((exam) => exam.id === ctx.preExam.accessRule.requiredExamId) : null}
              previousPercent={(() => {
                const requiredId = ctx.preExam.accessRule?.requiredExamId;
                const previous = requiredId ? (ctx.examResults || []).filter((r) => r.examId === requiredId && r.status === 'completed') : [];
                return previous.length ? Math.max(...previous.map((r) => Number(r.percentage ?? r.percent ?? r.scorePercentage ?? r.score ?? 0))) : null;
              })()}
              onStart={() => { const target = ctx.preExam; ctx.setPreExam(null); ctx.startExamWithCode(target); }}
              onClose={() => ctx.setPreExam(null)}
            />
          </div>
        </Overlay>
      )}
      {ctx.scanningHwId && <Overlay><SmartHomeworkScanner hwId={ctx.scanningHwId} user={ctx.user} onClose={() => ctx.setScanningHwId(null)} /></Overlay>}
    </div>
  );
}
