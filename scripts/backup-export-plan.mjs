#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const docsDir = path.join(process.cwd(), 'docs');
fs.mkdirSync(docsDir, { recursive: true });
const collections = ['users','exam_results','examResults','attempts','payment_requests','subscription_codes','student_messages','notifications','announcements','courses','content','lessonProgress','video_views','admin_audit_logs','system_errors','performance_metrics'];
const report = [
  '# Backup & Migration Runbook',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Collections to include in scheduled backups',
  ...collections.map((c) => `- ${c}`),
  '',
  '## Safe release flow',
  '1. Export Firestore backup from Firebase console or gcloud before destructive migrations.',
  '2. Run `npm run migrate:plan` and save the output.',
  '3. Run `npm run firestore:performance` to catch heavy reads before deploy.',
  '4. Deploy to preview and run `npm run postdeploy:qa`.',
  '5. Keep legacy collections read-only for one release before deleting or archiving.',
  '',
  '## gcloud example',
  '```bash',
  'gcloud firestore export gs://YOUR_BACKUP_BUCKET/nahhas-$(date +%F)',
  '```',
  ''
].join('\n');
fs.writeFileSync(path.join(docsDir, 'BACKUP_MIGRATION_RUNBOOK.md'), report, 'utf8');
console.log(report);
