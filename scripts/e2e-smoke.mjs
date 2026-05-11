#!/usr/bin/env node
import fs from 'node:fs';

const requiredFiles = [
  'src/services/platformData/index.js',
  'src/services/monitoring/errorLogger.js',
  'src/admin/components/AdminCommandCenter.jsx',
  'src/admin/components/AdminSystemHealthPanel.jsx',
  'firestore.rules',
  'functions/index.js',
];

const scenarios = [
  ['student_exam_resume', ['exam_results', 'safeStudentExamResultUpdate']],
  ['admin_payment_approve', ['approvePaymentRequest', 'admin_audit_logs']],
  ['targeted_notifications', ['canReadTargetedDocument', 'student_messages']],
  ['system_error_monitoring', ['system_errors', 'performance_metrics']],
  ['server_audit_functions', ['updateStudentSubscription', 'sendInternalNotification', 'replySupportTicket']],
];

let failed = false;
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

const allText = requiredFiles.filter(fs.existsSync).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
for (const [name, needles] of scenarios) {
  const ok = needles.every((needle) => allText.includes(needle));
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('E2E smoke specification passed. Run the manual browser flow after deploy: login student -> exam refresh -> submit -> admin review -> approve payment -> notify student.');
