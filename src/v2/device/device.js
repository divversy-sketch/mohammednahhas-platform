// Device detection for the v2 shells.
// platform: ios | android | web       → shape language (navigation style, dialogs, toasts, haptics)
// form:     phone | tablet | desktop  → layout (tab bar, navigation rail, sidebar)
// Both are written to <html data-platform data-form> so CSS can react without re-rendering.

const listeners = new Set();
let current = null;

const getCapacitor = () => (typeof window !== 'undefined' ? window.Capacitor : undefined);

export function detectPlatform() {
  if (typeof window === 'undefined') return 'web';
  const forced = new URLSearchParams(window.location.search).get('nxPlatform');
  if (forced && ['ios', 'android', 'web'].includes(forced)) return forced;
  const cap = getCapacitor();
  const capPlatform = cap?.getPlatform?.();
  if (capPlatform === 'ios' || capPlatform === 'android') return capPlatform;
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'web';
}

export function detectForm() {
  if (typeof window === 'undefined') return 'desktop';
  const forced = new URLSearchParams(window.location.search).get('nxForm');
  if (forced && ['phone', 'tablet', 'desktop'].includes(forced)) return forced;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  // a phone turned sideways is still a phone
  if (coarse && Math.min(w, h) < 520) return 'phone';
  if (w < 700) return 'phone';
  if (w < 1100 || (coarse && w < 1366)) return 'tablet';
  return 'desktop';
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(getCapacitor()?.isNativePlatform?.())
    || window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator?.standalone === true;
}

function read() {
  return {
    platform: detectPlatform(),
    form: detectForm(),
    native: Boolean(getCapacitor()?.isNativePlatform?.()),
    standalone: isStandalone(),
  };
}

function apply(state) {
  const root = document.documentElement;
  root.dataset.platform = state.platform;
  root.dataset.form = state.form;
  root.dataset.native = state.native ? 'true' : 'false';
  root.dataset.standalone = state.standalone ? 'true' : 'false';
}

export function getDevice() {
  if (!current) current = read();
  return current;
}

let started = false;
export function startDeviceWatcher() {
  if (started || typeof window === 'undefined') return getDevice();
  started = true;
  current = read();
  apply(current);
  let frame = 0;
  const onResize = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const next = read();
      if (next.form !== current.form || next.platform !== current.platform || next.standalone !== current.standalone) {
        current = next;
        apply(current);
        listeners.forEach((fn) => fn(current));
      }
    });
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
  return current;
}

export function subscribeDevice(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
