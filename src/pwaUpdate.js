import { startLiveUpdates } from './v2/device/liveUpdate.js';

// تسجيل الـ Service Worker + تشغيل التحديث التلقائي.
// قبل كده: تغيير الـ Service Worker كان بيعمل reload فوري حتى لو الطالب في نص امتحان،
// وفي نفس الوقت الملف sw.js ما كانش بيتغير أبدًا فالتحديث ما كانش بيتكشف أصلًا.
// دلوقتي الكشف بيتم من /version.json (liveUpdate.js) والتحديث بيستنى لحظة آمنة.
export function registerPWAUpdate() {
  startLiveUpdates();

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      setInterval(() => { registration.update().catch(() => {}); }, 60 * 60 * 1000);
    } catch (error) {
      console.warn('SW registration failed:', error);
    }
  });
}
