# Backup & Migration Runbook

Generated: 2026-05-11T21:39:53.813Z

## Collections to include in scheduled backups
- users
- exam_results
- examResults
- attempts
- payment_requests
- subscription_codes
- student_messages
- notifications
- announcements
- courses
- content
- lessonProgress
- video_views
- admin_audit_logs
- system_errors
- performance_metrics

## Safe release flow
1. Export Firestore backup from Firebase console or gcloud before destructive migrations.
2. Run `npm run migrate:plan` and save the output.
3. Run `npm run firestore:performance` to catch heavy reads before deploy.
4. Deploy to preview and run `npm run postdeploy:qa`.
5. Keep legacy collections read-only for one release before deleting or archiving.

## gcloud example
```bash
gcloud firestore export gs://YOUR_BACKUP_BUCKET/nahhas-$(date +%F)
```
