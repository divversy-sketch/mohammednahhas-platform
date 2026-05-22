import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);
const EXCLUDED = new Set(['node_modules', 'dist', '.git', 'reports']);

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) output.push(full);
  }
  return output;
}

test('source code does not contain obvious committed private keys', () => {
  const offenders = [];
  for (const file of walk(path.join(ROOT, 'src'))) {
    const text = fs.readFileSync(file, 'utf8');
    if (/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) offenders.push(path.relative(ROOT, file));
    if (/firebase-adminsdk.*private_key/i.test(text)) offenders.push(path.relative(ROOT, file));
  }
  assert.deepEqual(offenders, []);
});

test('environment example documents required Firebase client keys', () => {
  const envExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
  for (const key of [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ]) {
    assert.match(envExample, new RegExp(`^${key}=`, 'm'));
  }
});
