import { useEffect } from 'react';

const shouldUseLowPerformanceMode = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const nav = navigator;
  const cores = Number(nav.hardwareConcurrency || 8);
  const memory = Number(nav.deviceMemory || 8);
  const saveData = Boolean(nav.connection?.saveData);
  const connection = String(nav.connection?.effectiveType || '').toLowerCase();
  const smallScreen = window.matchMedia?.('(max-width: 768px)').matches;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const slowConnection = ['slow-2g', '2g', '3g'].includes(connection);
  return reducedMotion || saveData || slowConnection || ((cores <= 2 || memory <= 2) && smallScreen);
};

const DesignSystemLoader = () => {
  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = window.localStorage?.getItem('nahhas-theme');
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    const startTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : (prefersLight ? 'light' : 'dark');
    root.dataset.theme = startTheme;
    root.classList.toggle('nahhas-light', startTheme === 'light');
    root.classList.toggle('nahhas-dark', startTheme === 'dark');

    const applyPerformanceMode = () => {
      root.classList.toggle('perf-low', shouldUseLowPerformanceMode());
      root.classList.toggle('is-tab-hidden', document.visibilityState === 'hidden');
    };

    applyPerformanceMode();
    document.addEventListener('visibilitychange', applyPerformanceMode);
    window.addEventListener('resize', applyPerformanceMode, { passive: true });

    // Tailwind should be compiled locally by Vite/PostCSS.
    // Safety fallback: if a deploy/build ships without Tailwind utilities, load the browser CDN
    // so the UI does not degrade into an unstyled skeleton.
    const ensureTailwindFallback = window.setTimeout(() => {
      try {
        const probe = document.createElement('div');
        probe.className = 'hidden p-4 bg-amber-500 text-white rounded-xl';
        probe.style.position = 'absolute';
        probe.style.pointerEvents = 'none';
        probe.style.opacity = '0';
        document.body.appendChild(probe);
        const computed = window.getComputedStyle(probe);
        const tailwindUtilitiesMissing = computed.display !== 'none';
        probe.remove();

        if (tailwindUtilitiesMissing && !document.getElementById('tailwind-cdn-fallback')) {
          const script = document.createElement('script');
          script.id = 'tailwind-cdn-fallback';
          script.src = 'https://cdn.tailwindcss.com';
          script.defer = true;
          document.head.appendChild(script);
          console.warn('Tailwind local CSS was not detected; CDN fallback loaded to preserve UI styling.');
        }
      } catch (error) {
        console.warn('Tailwind fallback check skipped:', error);
      }
    }, 450);

    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link'); link.id = 'cairo-font'; link.rel = 'stylesheet'; link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Aref+Ruqaa:wght@400;700&display=swap"; document.head.appendChild(link);
    }
    if (!document.getElementById('html2pdf-script')) {
        const script = document.createElement('script'); script.id = 'html2pdf-script'; script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"; script.defer = true; document.head.appendChild(script);
    }
    if (!document.getElementById('pwa-manifest')) {
        const manifest = document.createElement('link'); manifest.id = 'pwa-manifest'; manifest.rel = 'manifest'; manifest.href = '/manifest.webmanifest'; document.head.appendChild(manifest);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
        const meta = document.createElement('meta'); meta.name = 'theme-color'; meta.content = '#d97706'; document.head.appendChild(meta);
    }

    return () => {
      window.clearTimeout(ensureTailwindFallback);
      document.removeEventListener('visibilitychange', applyPerformanceMode);
      window.removeEventListener('resize', applyPerformanceMode);
    };
  }, []);

  return (
    <style>{`
      html, body { font-family: 'Cairo', sans-serif; background-color: #f8fafc; direction: rtl; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; text-rendering: optimizeLegibility; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #f1f1f1; } ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #d97706, #b45309); border-radius: 4px; }
      .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: transform 0.16s ease, box-shadow 0.16s ease; will-change: auto; contain: layout paint; }
      .glass-card:hover { transform: translateY(-3px); box-shadow: 0 8px 18px rgba(217, 119, 6, 0.12); border-color: #fbbf24; }
      .text-gradient-gold { background: linear-gradient(45deg, #b45309, #d97706, #fbbf24, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: shine 4s linear infinite; }
      @keyframes shine { to { background-position: 200% center; } }
      @keyframes floatChar { 0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); } 50% { transform: translate3d(0, -20px, 0) rotate(7deg); } }
      .floating-char { animation: floatChar ease-in-out infinite; will-change: transform; }
      @keyframes pulseSlow { 0%, 100% { transform: scale3d(1, 1, 1); opacity: 0.14; } 50% { transform: scale3d(1.06, 1.06, 1); opacity: 0.26; } }
      .animate-pulse-slow { animation: pulseSlow 10s ease-in-out infinite; will-change: transform, opacity; }
      .watermark-text { position: absolute; pointer-events: none; z-index: 9999; color: rgba(0, 0, 0, 0.08); font-weight: 900; font-size: 1.5rem; transform: rotate(-30deg); white-space: nowrap; text-shadow: 0 0 2px rgba(255,255,255,0.5); contain: layout paint; }
      .watermark-video { position: absolute; pointer-events: none; z-index: 9999; color: rgba(255, 255, 255, 0.42); font-weight: 900; font-size: clamp(1rem, 2vw, 1.5rem); text-shadow: 2px 2px 4px rgba(0,0,0,0.8); white-space: nowrap; animation: moveWatermark 58s linear infinite; will-change: transform; transform: translate3d(8vw, 10vh, 0) rotate(-5deg); backface-visibility: hidden; contain: layout paint; }
      .video-smooth-frame { transform: translateZ(0); backface-visibility: hidden; will-change: transform; contain: layout paint; }
      @keyframes moveWatermark { 0% { transform: translate3d(8vw, 10vh, 0) rotate(-5deg); } 25% { transform: translate3d(48vw, 72vh, 0) rotate(5deg); } 50% { transform: translate3d(78vw, 30vh, 0) rotate(-5deg); } 75% { transform: translate3d(12vw, 68vh, 0) rotate(5deg); } 100% { transform: translate3d(8vw, 10vh, 0) rotate(-5deg); } }
      .no-select { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
      @keyframes softEntrance { from { opacity: 0; transform: translate3d(0, 12px, 0) scale(.985); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
      @keyframes softGlow { 0%,100% { box-shadow: 0 18px 45px rgba(217,119,6,.10); } 50% { box-shadow: 0 22px 60px rgba(217,119,6,.18); } }
      @keyframes shimmerLine { 0% { transform: translateX(115%); } 100% { transform: translateX(-115%); } }
      .page-soft-enter { animation: softEntrance .38s cubic-bezier(.2,.8,.2,1) both; }
      .student-sticky-hero { position: sticky; top: .75rem; z-index: 25; animation: softEntrance .36s cubic-bezier(.2,.8,.2,1) both, softGlow 7s ease-in-out infinite; }
      .student-sticky-hero::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; overflow: hidden; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,.32), transparent 80%); transform: translateX(115%); animation: shimmerLine 5.5s ease-in-out infinite; }
      .live-loading-screen { position: relative; overflow: hidden; background: radial-gradient(circle at 50% 38%, #fff7ed 0%, #f8fafc 48%, #e2e8f0 100%); }
      .live-loader-card { animation: softEntrance .42s ease both, softGlow 5s ease-in-out infinite; }
      .live-loader-orb { animation: pulseSlow 2.8s ease-in-out infinite; }

      @keyframes gearSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes gearSpinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      .gear-loader-main { animation: gearSpin 1.15s linear infinite; transform-origin: center; will-change: transform; }
      .gear-loader-small { animation: gearSpinReverse 1.35s linear infinite; transform-origin: center; will-change: transform; }
      @media (max-width: 768px) { .student-sticky-hero { top: .5rem; } }
      .perf-low .student-sticky-hero { animation: softEntrance .25s ease both; }
      .perf-low .student-sticky-hero::after { animation-duration: 8s; opacity: .55; }

      .perf-low body { scroll-behavior: auto; }
      .perf-low .glass-panel, .perf-low .glass-card { backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); box-shadow: 0 3px 12px rgba(0,0,0,0.06) !important; }
      .perf-low .glass-card { transition: transform 160ms ease, box-shadow 160ms ease !important; contain: layout paint; }
      .perf-low .glass-card:hover { transform: translateY(-2px) !important; box-shadow: 0 7px 18px rgba(217,119,6,0.10) !important; }
      .perf-low .text-gradient-gold { animation-duration: 8s !important; }
      .perf-low .floating-char { animation-duration: 32s !important; opacity: 0.075 !important; }
      .perf-low .floating-char:nth-of-type(n+7) { display: none !important; }
      .perf-low .animate-pulse-slow { animation-duration: 16s !important; opacity: 0.6; }
      .perf-low .watermark-video { animation-duration: 94s !important; text-shadow: 1px 1px 2px rgba(0,0,0,0.75); }
      .perf-low iframe, .perf-low video { transform: translateZ(0); backface-visibility: hidden; }
      .is-tab-hidden .floating-char, .is-tab-hidden .animate-pulse-slow, .is-tab-hidden .watermark-video { animation-play-state: paused !important; }
      @media (max-width: 768px) {
        button, .mobile-touch-target { min-height: 44px; }
        input, select, textarea { font-size: 16px !important; }
        .glass-card:hover { transform: none; }
        .student-mobile-grid { grid-template-columns: 1fr !important; }
        .exam-mobile-actions { position: sticky; bottom: 0; background: rgba(255,255,255,0.96); backdrop-filter: none; -webkit-backdrop-filter: none; padding: 0.75rem; border-top: 1px solid #e2e8f0; z-index: 30; }
      }

      /* ─────────────────────────────────────────
         Nahhas premium visual system - dark/light
      ───────────────────────────────────────── */
      :root {
        color-scheme: dark;
        --nh-bg: #07111f;
        --nh-bg-2: #0b1730;
        --nh-surface: rgba(11, 24, 44, 0.82);
        --nh-surface-strong: rgba(8, 17, 32, 0.94);
        --nh-card: rgba(12, 28, 52, 0.78);
        --nh-card-soft: rgba(255, 255, 255, 0.075);
        --nh-text: #f8fafc;
        --nh-muted: #b6c2d3;
        --nh-subtle: #7d8da4;
        --nh-line: rgba(148, 163, 184, 0.22);
        --nh-gold: #f59e0b;
        --nh-gold-2: #f97316;
        --nh-blue: #38bdf8;
        --nh-purple: #a855f7;
        --nh-green: #10b981;
        --nh-danger: #ef4444;
        --nh-shadow: 0 24px 70px rgba(0, 0, 0, .32);
      }
      :root[data-theme="light"] {
        color-scheme: light;
        --nh-bg: #f3f6fb;
        --nh-bg-2: #fff7ed;
        --nh-surface: rgba(255, 255, 255, 0.86);
        --nh-surface-strong: rgba(255, 255, 255, 0.96);
        --nh-card: rgba(255, 255, 255, 0.88);
        --nh-card-soft: rgba(248, 250, 252, 0.92);
        --nh-text: #0f172a;
        --nh-muted: #475569;
        --nh-subtle: #64748b;
        --nh-line: rgba(15, 23, 42, 0.11);
        --nh-shadow: 0 24px 64px rgba(15, 23, 42, .10);
      }
      html, body { background: var(--nh-bg) !important; color: var(--nh-text); }
      body::before {
        content: ''; position: fixed; inset: 0; pointer-events: none; z-index: -2;
        background:
          radial-gradient(circle at 15% 18%, rgba(245,158,11,.18), transparent 28%),
          radial-gradient(circle at 82% 10%, rgba(56,189,248,.12), transparent 30%),
          radial-gradient(circle at 50% 95%, rgba(168,85,247,.12), transparent 32%),
          linear-gradient(135deg, var(--nh-bg), var(--nh-bg-2));
      }
      body::after {
        content: ''; position: fixed; inset: 0; pointer-events: none; z-index: -1; opacity: .24;
        background-image: radial-gradient(circle at 1px 1px, rgba(245, 158, 11, .52) 1px, transparent 0);
        background-size: 38px 38px;
        mask-image: linear-gradient(to bottom, black, transparent 76%);
      }
      .nh-theme-toggle {
        display: inline-flex; align-items: center; gap: .45rem; min-height: 42px; padding: .65rem .9rem;
        border-radius: 999px; border: 1px solid rgba(245,158,11,.35);
        color: var(--nh-text); background: linear-gradient(135deg, rgba(245,158,11,.16), rgba(255,255,255,.07));
        box-shadow: 0 12px 30px rgba(245,158,11,.12); font-weight: 900; transition: .22s ease;
      }
      .nh-theme-toggle:hover { transform: translateY(-2px); border-color: rgba(245,158,11,.8); box-shadow: 0 16px 40px rgba(245,158,11,.22); }
      .nh-theme-toggle--compact span { display: none; }
      @keyframes nhBorderSpin { to { transform: rotate(360deg); } }
      @keyframes nhLightSweep { 0% { transform: translateX(115%); opacity: 0; } 15% { opacity: .9; } 45%,100% { transform: translateX(-115%); opacity: 0; } }
      @keyframes nhPulseGlow { 0%,100% { filter: drop-shadow(0 0 8px rgba(245,158,11,.18)); } 50% { filter: drop-shadow(0 0 18px rgba(245,158,11,.38)); } }
      .nh-animated-border,
      .glass-panel,
      .glass-card,
      .nh-text-sidebar,
      .nh-icon-sidebar,
      .nh-topbar,
      .v2-topbar,
      .v2-admin-command-nav,
      .nh-page-body > section > div,
      .nh-page-body section > div[class*="rounded"],
      .nh-page-body button[class*="rounded"],
      form > div[class*="relative"],
      .live-loader-card {
        position: relative; isolation: isolate; border-color: var(--nh-line) !important;
      }
      .nh-animated-border::before,
      .glass-panel::before,
      .glass-card::before,
      .nh-text-sidebar::before,
      .nh-icon-sidebar::before,
      .nh-topbar::before,
      .v2-topbar::before,
      .v2-admin-command-nav::before,
      .nh-page-body > section > div::before,
      .nh-page-body section > div[class*="rounded"]::before,
      .nh-page-body button[class*="rounded"]::before,
      .live-loader-card::before {
        content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; pointer-events: none; z-index: -1;
        background: conic-gradient(from 180deg, transparent 0 26%, rgba(245,158,11,.95), rgba(56,189,248,.55), rgba(168,85,247,.7), transparent 72% 100%);
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor; mask-composite: exclude;
        animation: nhBorderSpin 8s linear infinite; opacity: .58;
      }
      .nh-animated-border::after,
      .glass-panel::after,
      .glass-card::after,
      .nh-topbar::after,
      .v2-topbar::after,
      .nh-page-body section > div[class*="rounded"]::after,
      .nh-page-body button[class*="rounded"]::after,
      .live-loader-card::after {
        content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 0; overflow: hidden;
        background: linear-gradient(105deg, transparent 18%, rgba(255,255,255,.28), transparent 78%);
        animation: nhLightSweep 6.5s ease-in-out infinite;
        mix-blend-mode: screen;
      }
      .glass-panel, .glass-card, .nh-topbar, .v2-topbar {
        background: var(--nh-surface) !important; color: var(--nh-text) !important;
        box-shadow: var(--nh-shadow) !important; backdrop-filter: blur(18px) saturate(130%) !important;
      }
      .bg-white, .bg-white\/90, .bg-white\/95, .bg-white\/80, .bg-slate-50, .bg-slate-100 {
        background-color: var(--nh-card) !important;
      }
      .text-slate-950, .text-slate-900, .text-slate-800, .text-slate-700 { color: var(--nh-text) !important; }
      .text-slate-600, .text-slate-500, .text-slate-400 { color: var(--nh-muted) !important; }
      .border-slate-100, .border-slate-200, .border-white\/60, .border-white\/70 { border-color: var(--nh-line) !important; }
      input, select, textarea {
        background: var(--nh-card-soft) !important; color: var(--nh-text) !important; border-color: var(--nh-line) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.06); transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
      }
      input:focus, select:focus, textarea:focus {
        border-color: rgba(245,158,11,.9) !important; background: rgba(245,158,11,.08) !important;
        box-shadow: 0 0 0 4px rgba(245,158,11,.15), 0 0 28px rgba(245,158,11,.18) !important;
      }
      .v2-student-shell { background: transparent !important; color: var(--nh-text); }
      .v2-student-main { min-height: 100vh; padding-inline: clamp(.75rem, 2vw, 2rem); }
      .nh-page-body { max-width: 1380px; margin-inline: auto; padding: 1rem 0 5.8rem; }
      .nh-topbar { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin: .85rem auto 1.2rem; padding: .8rem 1rem; border: 1px solid var(--nh-line); border-radius: 28px; }
      .nh-topbar__right, .nh-topbar__left { display: flex; align-items: center; gap: .65rem; }
      .nh-topbar__btn, .nh-topbar__vip {
        display: inline-flex; align-items: center; gap: .45rem; border-radius: 999px; min-height: 42px; padding: .65rem .85rem;
        border: 1px solid var(--nh-line); background: rgba(255,255,255,.06); color: var(--nh-text); font-weight: 900;
      }
      .nh-topbar__btn:hover { border-color: rgba(245,158,11,.7); color: #f59e0b; transform: translateY(-1px); }
      .nh-notif-badge { min-width: 18px; min-height: 18px; padding: 0 .3rem; border-radius: 999px; background: #f59e0b; color: #111827; font-size: 11px; display: inline-grid; place-items: center; font-weight: 900; }
      .nh-text-sidebar {
        position: fixed; inset-block: .65rem; right: .65rem; width: 250px; border-radius: 32px; padding: 1rem; border: 1px solid var(--nh-line);
        background: linear-gradient(180deg, rgba(7,17,31,.96), rgba(10,22,42,.9)) !important; box-shadow: var(--nh-shadow); z-index: 45; overflow: auto;
      }
      :root[data-theme="light"] .nh-text-sidebar { background: rgba(255,255,255,.86) !important; }
      .nh-text-sidebar__header { display: flex; align-items: center; gap: .7rem; padding: .5rem .35rem 1rem; border-bottom: 1px solid var(--nh-line); margin-bottom: .75rem; }
      .nh-text-sidebar__name { display: block; color: var(--nh-text); font-weight: 1000; }
      .nh-text-sidebar__sub { display: block; color: var(--nh-muted); font-size: 12px; font-weight: 800; margin-top: .15rem; }
      .nh-nav-group { padding: .55rem 0; border-bottom: 1px solid rgba(148,163,184,.12); }
      .nh-nav-group__label { display: block; color: var(--nh-subtle); font-size: 11px; font-weight: 1000; margin: 0 .65rem .35rem; }
      .nh-nav-item { width: 100%; display: flex; align-items: center; gap: .7rem; padding: .72rem .8rem; border-radius: 17px; color: var(--nh-muted); font-weight: 900; transition: .2s ease; border: 1px solid transparent; }
      .nh-nav-item:hover { background: rgba(245,158,11,.1); color: var(--nh-text); border-color: rgba(245,158,11,.24); transform: translateX(-2px); }
      .nh-nav-item.is-active { background: linear-gradient(135deg, #f59e0b, #f97316) !important; color: #111827 !important; box-shadow: 0 16px 30px rgba(245,158,11,.26); }
      .nh-nav-item--logout { margin-top: .8rem; color: #fb7185; }
      .nh-icon-sidebar { display: none; }
      @media (min-width: 1024px) { .v2-student-main { margin-right: 270px; } }
      @media (max-width: 1023px) { .nh-text-sidebar { display: none; } .v2-student-main { margin-right: 0; } }
      .v2-admin-shell, .admin-dashboard, [class*="admin"] { color: var(--nh-text); }
      .v2-admin-command-chip {
        display: inline-flex; align-items: center; justify-content: center; padding: .7rem .95rem; margin: .22rem;
        border-radius: 999px; border: 1px solid var(--nh-line); background: var(--nh-card-soft); color: var(--nh-muted); font-weight: 900; transition: .2s ease;
      }
      .v2-admin-command-chip:hover, .v2-admin-command-chip.is-active { background: linear-gradient(135deg, #f59e0b, #f97316) !important; color: #111827 !important; transform: translateY(-1px); }
      .v2-admin-command-scroll { display: flex; flex-wrap: wrap; gap: .2rem; max-height: 190px; overflow: auto; }
      .v2-page-title, .v2-gradient-text { background: linear-gradient(90deg, #fbbf24, #f97316, #38bdf8); -webkit-background-clip: text; color: transparent !important; }
      .live-loading-screen {
        background:
          radial-gradient(circle at 15% 32%, rgba(245,158,11,.16), transparent 30%),
          radial-gradient(circle at 86% 22%, rgba(56,189,248,.11), transparent 30%),
          linear-gradient(135deg, var(--nh-bg), var(--nh-bg-2)) !important;
      }
      .live-loader-card { background: var(--nh-surface-strong) !important; color: var(--nh-text); border-color: var(--nh-line) !important; }
      .student-sticky-hero { background: var(--nh-surface) !important; color: var(--nh-text); }
      .fixed.bottom-5.left-5 { left: 1rem !important; bottom: 1rem !important; z-index: 70 !important; box-shadow: 0 16px 36px rgba(22,163,74,.28) !important; }
      :root[data-theme="light"] .bg-slate-950 { background-color: #0b1730 !important; color: #fff !important; }
      :root[data-theme="light"] .bg-gradient-to-br.from-slate-50,
      :root[data-theme="light"] .from-slate-50 { --tw-gradient-from: rgba(255,255,255,.92) !important; }
      .font-arabic { font-family: 'Cairo', sans-serif; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
};

export default DesignSystemLoader;
