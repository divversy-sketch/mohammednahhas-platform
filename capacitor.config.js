// إعداد تطبيق الأندرويد.
//
// وضع التحديث المباشر (الافتراضي): التطبيق بيفتح الموقع المنشور، فأي تعديل يتنشر على Vercel
// بيوصل للطلبة لوحده من غير APK جديد. الرابط في app-update.json (أو CAP_SERVER_URL في .env).
import fs from 'node:fs';

function readEnv(key) {
  if (process.env[key]) return process.env[key].trim();
  try {
    const line = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : '';
  } catch { return ''; }
}

// الرابط بييجي من .env (CAP_SERVER_URL)، ولو مش موجود (زي البناء على GitHub) بييجي من app-update.json.
// يعني التطبيق دايمًا «تحديث مباشر» إلا لو طلبت نسخة مدمجة صراحةً بـ CAP_BUNDLED=1.
function readDefaultUrl() {
  try { return String(JSON.parse(fs.readFileSync('app-update.json', 'utf8')).liveUrl || '').trim(); } catch { return ''; }
}
const bundledOnly = readEnv('CAP_BUNDLED') === '1';
const liveUrl = bundledOnly ? '' : (readEnv('CAP_SERVER_URL') || readDefaultUrl()).replace(/\/+$/, '');
const live = /^https:\/\/[^/\s]+/i.test(liveUrl);
const dark = '#0B0908';

// ملحوظة: الـ CLI بيقرأ الإعدادات كـ named exports (مش export default).
export const appId = 'com.nahhas.platform';
export const appName = 'NahhasPlatform';
export const webDir = 'dist';
export const backgroundColor = dark;
export const android = { allowMixedContent: false };
// الشريط العلوي والسفلي: الصفحة بتترسم تحتهم والمساحات الآمنة بتتحسب تلقائي على كل الإصدارات.
export const plugins = {
  SystemBars: { insetsHandling: 'css', style: 'DARK', initialViewportFitValueHint: 'cover' },
};
export const server = live
  ? {
    url: liveUrl,
    cleartext: false,
    allowNavigation: [new URL(liveUrl).host, '*.vercel.app', '*.firebaseapp.com', '*.web.app', '*.googleapis.com', '*.cloudinary.com'],
    errorPath: 'offline.html', // لو النت فصل والموقع ما فتحش
  }
  : undefined;
