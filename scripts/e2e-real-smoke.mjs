#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
fs.mkdirSync(docsDir, { recursive: true });

const criticalNeedles = [
  ['src/shared/platformParts/ExamRunner.jsx', ['studentId', 'submit', 'timeTaken']],
  ['src/shared/platformParts/PaymentRequestStudentPanel.jsx', ['payment_requests', 'userId']],
  ['src/admin/parts/AdminPaymentRequestsPanel.jsx', ['approve', 'reject']],
  ['src/admin/components/AdminSystemHealthPanel.jsx', ['system_errors', 'performance_metrics']],
  ['src/admin/components/AdminCommandCenter.jsx', ['طلبات دفع معلقة', 'تذاكر دعم مفتوحة']],
  ['src/services/platformData/index.js', ['getUnifiedExamResults', 'listenUnifiedStudentMessages']],
];

let failed = false;
const rows = criticalNeedles.map(([file, needles]) => {
  const full = path.join(root, file);
  const text = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  const missing = needles.filter((needle) => !text.includes(needle));
  if (missing.length) failed = true;
  return { file, status: missing.length ? `missing: ${missing.join(', ')}` : 'ok' };
});

const report = [
  '# E2E Real Smoke Specification',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Area | Status |',
  '| --- | --- |',
  ...rows.map((r) => `| ${r.file} | ${r.status} |`),
  '',
  'Manual browser flow after deploy:',
  '1. Student login -> course -> lesson.',
  '2. Exam start -> refresh -> resume -> submit -> result visible.',
  '3. Student sends payment request -> admin approves -> subscription updates.',
  '4. Admin sends notification -> student receives targeted message.',
  '5. Student opens support ticket -> admin replies and closes.',
  '6. Admin checks System Health for errors, metrics, QA and backup reports.',
  ''
].join('\n');
fs.writeFileSync(path.join(docsDir, 'E2E_REAL_SMOKE.md'), report, 'utf8');
console.log(report);
if (failed) process.exit(1);
