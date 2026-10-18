// Student app, v2 · «السينما». Top navigation over a moving poster on tablet/desktop, frosted tab bar on phones,
// a banner on every inner page, and search on Ctrl/⌘K.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';
import { Segmented } from '../ui/kit.jsx';
import { useDevice, useOnline } from '../device/useDevice.js';
import { haptic, onBackButton } from '../device/native.js';
import { usePrefs } from '../prefs.js';
import { SECTIONS, SUBS, parseRoute, routeTitle } from './nav.js';
import { examBuckets } from './insights.js';
import { CommandPalette, NotificationsSheet } from './parts.jsx';
import { ExamPreStartPanel, InteractiveViewer, Overlay, SecureVideoPlayer, SmartHomeworkScanner, EmbedFallback } from './embeds.jsx';
import HomeView from './views/HomeView.jsx';
import { CinemaNav, CinemaPhoneTop, PageHero } from './cinema.jsx';
import '../styles/cinema.css';
import '../styles/student.css';

const LearnView = lazy(() => import('./views/LearnView.jsx'));
const ExamsView = lazy(() => import('./views/ExamsView.jsx'));
const ProgressView = lazy(() => import('./views/ProgressView.jsx'));
const AccountView = lazy(() => import('./views/AccountView.jsx'));


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
    <div className="nx nx-app cx-app" dir="rtl" data-section={route.section}>
      {!online && <div className="nx-offline" role="status"><Icon name="wifiOff" size={14} /> مفيش إنترنت دلوقتي. اللي اتحمّل هيفضل ظاهر، وهنكمّل أول ما النت يرجع.</div>}
      <div className="nx-main">
        {phone
          ? <CinemaPhoneTop ctx={ctx} route={route} title={SECTIONS.find((s) => s.key === route.section)?.title || title} onSearch={() => setSearchOpen(true)} onBell={bell} go={go} />
          : <CinemaNav ctx={ctx} route={route} go={go} badges={badges} theme={theme} toggleTheme={toggleTheme} onSearch={() => setSearchOpen(true)} onBell={bell} device={device} />}
        <main className={`nx-content ${route.section === 'home' ? 'cx-home-content' : ''}`} id="nx-main">
          {route.section !== 'home' && <PageHero route={route} title={title} />}
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
