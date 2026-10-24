// إعداد تطبيق الأندرويد.
//
// وضع التحديث المباشر: اكتب رابط موقعك في ملف .env هكذا
//     CAP_SERVER_URL=https://اسم-موقعك.vercel.app
// وبعدها `npm run apk` مرة واحدة فقط. من بعدها أي تحديث يترفع على GitHub ويتنشر على الموقع
// بيظهر في التطبيق لوحده من غير ما تبني APK جديد.
// من غير الرابط ده التطبيق بيشتغل بنسخة مدمجة جواه (محتاجة APK جديد مع كل تحديث).
import fs from 'node:fs';

function readEnv(key) {
  if (process.env[key]) return process.env[key].trim();
  try {
    const line = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : '';
  } catch { return ''; }
}

const liveUrl = readEnv('CAP_SERVER_URL').replace(/\/+$/, '');
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
    allowNavigation: [new URL(liveUrl).host, '*.firebaseapp.com', '*.googleapis.com', '*.cloudinary.com'],
    errorPath: 'offline.html', // لو النت فصل والموقع ما فتحش
  }
  : undefined;
