import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message) => {
  console.error(`Source health check failed: ${message}`);
  process.exit(1);
};

const forbiddenActiveFiles = [
  'src/student/StudentApp.jsx',
  'src/admin/AdminApp.jsx',
  'src/student/parts/ExamRunner.jsx',
  'src/admin/parts/ExamRunner.jsx',
  'src/student/parts/AuthPage.jsx',
  'src/admin/parts/AuthPage.jsx'
];
for (const file of forbiddenActiveFiles) {
  if (fs.existsSync(path.join(root, file))) {
    fail(`${file} should stay archived or removed from active source.`);
  }
}

if (read('index.html').includes('cdn.tailwindcss.com')) {
  fail('Tailwind CDN is still present in index.html. Use the local Vite/Tailwind pipeline.');
}

const main = read('src/main.jsx');
if (!main.includes('import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY')) {
  fail('App Check site key should be read from VITE_RECAPTCHA_V3_SITE_KEY.');
}

const vite = read('vite.config.js');
for (const chunk of ['vendor-firebase', 'vendor-ui', 'vendor-charts', 'vendor-pdf']) {
  if (!vite.includes(chunk)) fail(`vite.config.js is missing ${chunk} manual chunk.`);
}

console.log('Source health checks passed.');
