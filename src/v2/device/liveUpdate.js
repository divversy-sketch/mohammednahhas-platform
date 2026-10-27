// التحديث التلقائي للتطبيق والموقع.
//
// المشكلة اللي بيحلها: تطبيق الأندرويد بيفضل شغال في الخلفية أيام، فالطالب بيرجع لنفس الكود القديم
// اللي كان فاتحه حتى لو اتنشر تحديث جديد على الموقع.
//
// الحل: كل بناء ليه بصمة (__NX_BUILD_ID__) ومعاها ملف /version.json على الموقع.
// التطبيق بيقارن البصمتين: أول ما يفتح، كل ما يرجع من الخلفية، وكل ٥ دقايق.
// لو فيه نسخة أجدد:
//   - لو الطالب راجع من الخلفية → بيتحدث على طول قبل ما يلاحظ.
//   - لو شغال قدامه → شريط صغير «تحديث الآن»، ولو ما ضغطش بيتحدث أول ما يرجع للتطبيق.
//   - مستحيل يتحدث وهو بيمتحن أو بيتفرج على فيديو أو بيكتب في خانة.

const CURRENT = typeof __NX_BUILD_ID__ !== 'undefined' ? __NX_BUILD_ID__ : '';
const CHECK_EVERY_MS = 5 * 60 * 1000;
const TRIED_KEY = 'nx-update-tried';

let latest = null;
let started = false;
let hiddenSince = 0;
let busyTimer = 0;

function storage() {
  try { return window.sessionStorage; } catch { return null; }
}

/** شاشات ممنوع تتقطع: الامتحان، فيديو شغال، أو حد بيكتب. */
export function isBusy() {
  try {
    if (document.documentElement.dataset.nxBusy) return true;
    const media = document.querySelectorAll('video, audio');
    for (const m of media) if (!m.paused && !m.ended) return true;
    const a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return true;
  } catch { /* ignore */ }
  return false;
}

/** الشاشات الحساسة بتنادي دي عشان تمنع التحديث وهي مفتوحة. */
export function setUpdateBlocked(reason) {
  try {
    if (reason) document.documentElement.dataset.nxBusy = reason;
    else delete document.documentElement.dataset.nxBusy;
  } catch { /* ignore */ }
}

async function fetchLatest() {
  const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data?.build === 'string' ? data.build : null;
}

function hasUpdate() {
  return Boolean(latest && CURRENT && latest !== CURRENT);
}

async function reloadNow({ manual = false } = {}) {
  const s = storage();
  // حماية من اللف: لو جربنا نحدّث لنفس النسخة قبل كده والموقع لسه بيرجّع القديم (كاش)، ما نعيدش تلقائي.
  if (!manual && s?.getItem(TRIED_KEY) === latest) return;
  s?.setItem(TRIED_KEY, latest || '');
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    await reg?.update?.();
  } catch { /* ignore */ }
  window.location.reload();
}

function removeBanner() {
  document.getElementById('nx-update-banner')?.remove();
}

function showBanner() {
  if (document.getElementById('nx-update-banner')) return;
  const bar = document.createElement('div');
  bar.id = 'nx-update-banner';
  bar.dir = 'rtl';
  bar.setAttribute('role', 'status');
  bar.style.cssText = [
    'position:fixed', 'left:12px', 'right:12px', 'z-index:2147483000',
    'bottom:calc(env(safe-area-inset-bottom, 0px) + 84px)', 'margin:auto', 'max-width:520px',
    'display:flex', 'align-items:center', 'gap:12px', 'justify-content:space-between',
    'padding:12px 14px', 'border-radius:16px', 'background:#16110E', 'color:#fff',
    'border:1px solid rgba(217,119,6,.55)', 'box-shadow:0 18px 40px rgba(0,0,0,.35)',
    "font-family:'Almarai','Readex Pro',system-ui,sans-serif",
  ].join(';');
  bar.innerHTML = `
    <div style="min-width:0">
      <div style="font-weight:800;font-size:14px">فيه تحديث جديد للمنصة</div>
      <div style="opacity:.75;font-size:12px;margin-top:2px">هيتحدث لوحده أول ما ترجع للتطبيق، أو اضغط دلوقتي.</div>
    </div>
    <div style="display:flex;gap:6px;flex-shrink:0">
      <button type="button" data-act="later" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:9px 12px;font:inherit;font-size:13px;cursor:pointer">بعدين</button>
      <button type="button" data-act="now" style="background:#D97706;color:#fff;border:0;border-radius:12px;padding:9px 14px;font:inherit;font-weight:800;font-size:13px;cursor:pointer">تحديث الآن</button>
    </div>`;
  bar.addEventListener('click', (e) => {
    const act = e.target?.closest?.('button')?.dataset?.act;
    if (act === 'now') reloadNow({ manual: true });
    if (act === 'later') removeBanner();
  });
  document.body.appendChild(bar);
}

// لو الطالب مشغول، نستنى لحد ما يخلص وبعدين نعرض الشريط.
function offerWhenFree() {
  clearInterval(busyTimer);
  if (!isBusy()) { showBanner(); return; }
  removeBanner();
  busyTimer = setInterval(() => {
    if (!hasUpdate()) { clearInterval(busyTimer); return; }
    if (!isBusy()) { clearInterval(busyTimer); showBanner(); }
  }, 15000);
}

async function check() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  try {
    const found = await fetchLatest();
    if (!found) return;
    latest = found;
    if (!hasUpdate()) { storage()?.removeItem(TRIED_KEY); return; }
    if (document.visibilityState === 'hidden') return; // هيتحدث عند الرجوع
    offerWhenFree();
  } catch { /* offline or the site is down: try again later */ }
}

// رجوع من الخلفية: لو فيه نسخة أجدد ومفيش امتحان، نحدّث فورًا (الطالب لسه ما بدأش يتعامل مع الشاشة).
async function onResume() {
  const away = hiddenSince ? Date.now() - hiddenSince : 0;
  hiddenSince = 0;
  await check();
  if (hasUpdate() && !isBusy() && (away > 3000 || document.getElementById('nx-update-banner'))) {
    reloadNow();
  }
}

export function startLiveUpdates() {
  if (started || typeof window === 'undefined' || import.meta.env.DEV || !CURRENT) return;
  started = true;

  setTimeout(check, 4000);
  setInterval(check, CHECK_EVERY_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hiddenSince = Date.now();
    else onResume();
  });
  window.addEventListener('online', check);

  // جوه تطبيق الأندرويد: أحداث الخلفية/الرجوع من Capacitor نفسه (أدق من visibilitychange على بعض الأجهزة).
  try {
    const App = window.Capacitor?.isNativePlatform?.() ? window.Capacitor?.Plugins?.App : null;
    App?.addListener?.('pause', () => { hiddenSince = Date.now(); });
    App?.addListener?.('resume', () => { onResume(); });
  } catch { /* web */ }
}

/** للعرض في صفحة الجهاز. */
export function getBuildInfo() {
  return { current: CURRENT, latest, hasUpdate: hasUpdate() };
}

export function checkForUpdateNow() {
  return check().then(() => getBuildInfo());
}
