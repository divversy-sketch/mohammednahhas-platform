// Thin wrappers over native capabilities. Each one degrades quietly on the web.
import { detectPlatform } from './device.js';

const isNative = () => Boolean(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.());

// Plugin modules are fetched only inside the Android/iOS app, so the website never downloads them.
const loaded = {};
let loading = null;
export function loadNativePlugins() {
  if (!isNative()) return Promise.resolve(loaded);
  if (!loading) {
    loading = Promise.allSettled([
      import('@capacitor/haptics').then((m) => { loaded.Haptics = m.Haptics; }),
      import('@capacitor/status-bar').then((m) => { loaded.StatusBar = m.StatusBar; }),
      import('@capacitor/app').then((m) => { loaded.App = m.App; }),
    ]).then(() => loaded);
  }
  return loading;
}
const plugins = () => loaded;

/** Light tap feedback: native haptics in the app, a short vibration on Android browsers. */
export function haptic(kind = 'light') {
  try {
    if (document.documentElement.dataset.haptics === 'off') return;
    const { Haptics } = plugins();
    if (isNative() && Haptics) {
      if (kind === 'success' || kind === 'warning' || kind === 'error') {
        Haptics.notification?.({ type: kind.toUpperCase() });
      } else if (kind === 'select') {
        Haptics.selectionChanged?.();
      } else {
        Haptics.impact?.({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' });
      }
      return;
    }
    if (detectPlatform() === 'android' && navigator.vibrate) {
      navigator.vibrate(kind === 'success' ? [10, 40, 18] : kind === 'error' ? [30, 50, 30] : 8);
    }
  } catch { /* haptics are a nicety */ }
}

/** Match the status bar and browser chrome to the current screen colour. */
export function setChromeColor(color, darkContent) {
  try {
    let meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
    const { StatusBar } = plugins();
    if (isNative() && StatusBar) {
      StatusBar.setStyle?.({ style: darkContent ? 'LIGHT' : 'DARK' });
      if (detectPlatform() === 'android') StatusBar.setBackgroundColor?.({ color });
    }
  } catch { /* not critical */ }
}

const backHandlers = [];
let backBound = false;

/**
 * Android hardware back: the most recently registered handler runs first.
 * A handler returns true when it consumed the press (closed a sheet, went up a level).
 * When nothing consumes it on the root screen, the app is minimised instead of closed.
 */
export function onBackButton(handler) {
  backHandlers.push(handler);
  if (!backBound && isNative()) {
    backBound = true;
    loadNativePlugins().then(({ App }) => {
      App?.addListener?.('backButton', () => {
        for (let i = backHandlers.length - 1; i >= 0; i -= 1) {
          if (backHandlers[i]()) return;
        }
        App.minimizeApp?.();
      });
    });
  }
  return () => {
    const index = backHandlers.lastIndexOf(handler);
    if (index >= 0) backHandlers.splice(index, 1);
  };
}

/** Let a closing sheet also respond to the browser back gesture (iOS swipe, Android back in Chrome). */
export function pushOverlayState(key) {
  try {
    window.history.pushState({ ...(window.history.state || {}), nxOverlay: key }, '');
  } catch { /* ignore */ }
}
