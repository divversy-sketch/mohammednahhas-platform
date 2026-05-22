import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const envExample = path.join(ROOT, '.env.example');
const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

if (!fs.existsSync(envExample)) {
  console.error('❌ Missing .env.example');
  process.exit(1);
}

const content = fs.readFileSync(envExample, 'utf8');
const missing = requiredKeys.filter((key) => !new RegExp(`^${key}=`, 'm').test(content));

if (missing.length) {
  console.error('❌ Missing required environment keys in .env.example:');
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

const trackedEnvFiles = ['.env', '.env.local'].filter((file) => fs.existsSync(path.join(ROOT, file)));
const secretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /firebase-adminsdk/i,
  /private_key/i,
  /service_account/i
];

const suspicious = [];
for (const file of trackedEnvFiles) {
  const fileContent = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const pattern of secretPatterns) {
    if (pattern.test(fileContent)) suspicious.push(`${file}: ${pattern}`);
  }
}

if (suspicious.length) {
  console.warn('⚠️ Potential real secrets were found in local env files. Do not commit these files:');
  for (const item of suspicious) console.warn(`- ${item}`);
}

console.log('✅ Environment contract guard passed.');
