import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const mustContain = (file, patterns) => {
  const text = read(file);
  const missing = patterns.filter((pattern) => !text.includes(pattern));
  if (missing.length) {
    throw new Error(`${file} is missing: ${missing.join(', ')}`);
  }
};

mustContain('firestore.rules', [
  'function adminDoc()',
  'match /admins/{adminId}',
  'match /admin_audit_logs/{docId}',
  'allow create, update, delete: if false',
  'match /live_sessions/{document=**} { allow read, write: if false; }',
  'match /ai_usage/{document=**} { allow read, write: if false; }'
]);

mustContain('functions/index.js', [
  'async function assertAdmin(context)',
  'exports.deleteStudentAccount',
  'exports.setStudentStatus',
  'exports.createSubscriptionCode',
  'exports.approvePaymentRequest',
  'exports.rejectPaymentRequest',
  'exports.deleteExam',
  'admin_audit_logs'
]);

mustContain('src/admin/services/adminSecureFunctions.js', [
  'httpsCallable',
  'deleteStudentAccount',
  'setStudentStatus',
  'approvePaymentRequest',
  'rejectPaymentRequest',
  'deleteExam'
]);

const firebaseJson = JSON.parse(read('firebase.json'));
if (firebaseJson.database) {
  throw new Error('firebase.json still contains Realtime Database config, but this project does not use it.');
}

console.log('Security smoke checks passed.');
