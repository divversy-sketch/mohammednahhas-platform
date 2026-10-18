#!/usr/bin/env node
// Builds an installable Android APK from the current code.
//   npm run apk          → android/app/build/outputs/apk/debug/app-debug.apk (installs directly on any phone)
//   npm run apk:release  → unsigned release build (sign it before uploading to Google Play)
// Needs: Node 20+, JDK 21 and the Android SDK (installing Android Studio gives you both).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const release = process.argv.includes('--release');
const root = process.cwd();
const isWin = process.platform === 'win32';
const run = (cmd, args, cwd = root) => {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  if (r.status !== 0) { console.error(`\nفشل الأمر: ${cmd} ${args.join(' ')}`); process.exit(r.status || 1); }
};

if (!fs.existsSync(path.join(root, '.env')) && !process.env.VITE_FIREBASE_API_KEY) {
  console.warn('تنبيه: ملف .env مش موجود، والتطبيق مش هيعرف يتصل بـ Firebase.');
}
if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT && !fs.existsSync(path.join(root, 'android', 'local.properties'))) {
  console.warn('تنبيه: مش لاقي Android SDK. ثبّت Android Studio أو حدد ANDROID_HOME.');
}

run('npm', ['run', 'build']);
run('npx', ['cap', 'sync', 'android']);
const gradlew = isWin ? 'gradlew.bat' : './gradlew';
if (!isWin) fs.chmodSync(path.join(root, 'android', 'gradlew'), 0o755);
run(gradlew, [release ? 'assembleRelease' : 'assembleDebug'], path.join(root, 'android'));

const out = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', release ? 'release' : 'debug');
const apk = fs.existsSync(out) ? fs.readdirSync(out).find((f) => f.endsWith('.apk')) : null;
if (apk) {
  const dest = path.join(root, release ? 'NahhasPlatform-release-unsigned.apk' : 'NahhasPlatform.apk');
  fs.copyFileSync(path.join(out, apk), dest);
  console.log(`\nتمام! الملف جاهز: ${dest}`);
} else {
  console.log(`\nخلص البناء. دوّر على ملف الـ APK في: ${out}`);
}
