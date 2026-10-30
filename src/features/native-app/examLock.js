// قفل الامتحان جوه تطبيق الأندرويد (App Pinning) + قفل زرار الرجوع.
// على المتصفح أو على APK قديم ما فيهوش الإضافة: كل الدوال بترجع «مش مدعوم» والامتحان بيشتغل عادي
// بنظام الغش القديم (عشان الطلبة اللي لسه ما نزّلوش الـ APK الجديد ما يتقفلش عليهم الامتحان).
import { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

// وقت التطوير بس: /?nxPreview=exam&nxLock=1 (يوافق) أو nxLock=deny (يرفض) بيحاكي الموبايل.
const devMode = import.meta.env.DEV && typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('nxLock') : null;
const devSim = devMode ? (() => {
  let state = 'none';
  let lastScreenOffAt = 0;
  window.__nxLock = { unpin: () => { state = 'none'; }, screenOff: () => { lastScreenOffAt = Date.now(); } };
  return {
    start: async () => { if (devMode !== 'deny') setTimeout(() => { state = 'pinned'; }, 1200); return { state, active: state !== 'none' }; },
    stop: async () => { state = 'none'; return { state, active: false }; },
    getState: async () => ({ state, active: state !== 'none', lastScreenOffAt }),
  };
})() : null;

const ExamLock = devSim || registerPlugin('ExamLock');

export function isExamLockSupported() {
  if (devSim) return true;
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('ExamLock');
  } catch {
    return false;
  }
}

/** للأدمن: الطالب ده امتحن والشاشة مقفولة ولا لأ. */
export function examLockMode() {
  if (isExamLockSupported()) return 'pinned';
  try { return Capacitor.isNativePlatform() ? 'unavailable' : 'web'; } catch { return 'web'; }
}

export async function getExamLockState() {
  if (!isExamLockSupported()) return 'unsupported';
  try { return (await ExamLock.getState()).state || 'none'; } catch { return 'none'; }
}

/** حالة كاملة من الأندرويد: هل الشاشة اتقفلت (زرار الباور) وإمتى. */
export async function getExamLockInfo() {
  if (!isExamLockSupported()) return null;
  try { return await ExamLock.getState(); } catch { return null; }
}

/**
 * الطالب ساب شاشة الامتحان وبعدين رجع: ده كان قفل شاشة (باور) ولا خروج لتطبيق/تبويب تاني؟
 * بيرجّع true لو أكيد قفل شاشة. على المتصفح أو APK قديم: false (مفيش طريقة نتأكد).
 */
export async function wasScreenTurnedOff(hiddenAt) {
  const info = await getExamLockInfo();
  const off = Number(info?.lastScreenOffAt) || 0;
  // لازم الشاشة تكون اتقفلت في نفس لحظة الخروج (مش قفلة قديمة قبلها)
  return Boolean(off && off >= hiddenAt - 1500 && off - hiddenAt < 4000);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * يطلب تثبيت الشاشة ويستنى الطالب يوافق على رسالة أندرويد.
 * بيرجع true لو اتثبتت فعلًا، false لو رفض أو الوقت خلص.
 */
export async function requestExamLock({ timeoutMs = 25000 } = {}) {
  if (!isExamLockSupported()) return false;
  try {
    const first = await ExamLock.start();
    if (first?.active) return true;
  } catch {
    return false;
  }
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    await wait(600);
    const s = await getExamLockState();
    if (s === 'pinned' || s === 'locked') return true;
  }
  return false;
}

export async function releaseExamLock() {
  if (!isExamLockSupported()) return;
  try { await ExamLock.stop(); } catch { /* ignore */ }
}

/** زرار الرجوع في الأندرويد ما يعملش حاجة طول ما الامتحان شغال. */
export function blockBackButton(onPress) {
  let handle = null;
  let cancelled = false;
  try {
    const App = Capacitor.isNativePlatform() ? Capacitor.Plugins?.App : null;
    const p = App?.addListener?.('backButton', () => onPress?.());
    Promise.resolve(p).then((h) => { if (cancelled) h?.remove?.(); else handle = h; }).catch(() => {});
  } catch { /* web */ }
  return () => { cancelled = true; handle?.remove?.(); };
}

/**
 * جوه الامتحان: بيراقب التثبيت كل ثانية ونص. لو الطالب فكّه بيبلّغ (onBroken)
 * وبيرجّع broken=true عشان الشاشة تتغطى لحد ما يرجّع التثبيت.
 */
export function useExamLockWatch({ enabled, onBroken, bypassRef }) {
  const [broken, setBroken] = useState(false);
  const brokenRef = useRef(false);
  const onBrokenRef = useRef(onBroken);
  onBrokenRef.current = onBroken;

  useEffect(() => {
    if (!enabled || !isExamLockSupported()) return undefined;
    let alive = true;
    const id = setInterval(async () => {
      if (bypassRef?.current) return; // الطالب بيرفع صورة إجابة
      const s = await getExamLockState();
      if (!alive) return;
      const isBroken = s === 'none';
      if (isBroken && !brokenRef.current) onBrokenRef.current?.();
      brokenRef.current = isBroken;
      setBroken(isBroken);
    }, 1500);
    return () => { alive = false; clearInterval(id); };
  }, [enabled, bypassRef]);

  const repin = async () => {
    if (bypassRef) bypassRef.current = true; // رسالة أندرويد بتاخد الفوكس، دي مش محاولة غش
    const ok = await requestExamLock();
    setTimeout(() => { if (bypassRef) bypassRef.current = false; }, 1500);
    if (ok) { brokenRef.current = false; setBroken(false); }
    return ok;
  };

  return { broken: enabled && broken, repin };
}
