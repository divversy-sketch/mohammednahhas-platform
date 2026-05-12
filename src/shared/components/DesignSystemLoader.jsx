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
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
};

export default DesignSystemLoader;
