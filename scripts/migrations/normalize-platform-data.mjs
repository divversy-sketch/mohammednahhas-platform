#!/usr/bin/env node
/*
  Dry-run migration helper for Nahhas platform data.
  It does not connect to Firebase by default. Use it as a checklist/report runner before running Admin SDK migrations.
*/

const CANONICAL_SCHEMA = {
  users: ['id', 'name', 'email', 'phone', 'grade', 'status', 'subscriptionStatus', 'subscriptionExpiry', 'role'],
  exam_results: ['studentId', 'userId', 'examId', 'answers', 'score', 'totalScore', 'percentage', 'status', 'submittedAt'],
  lessonProgress: ['userId', 'lessonId', 'courseId', 'completed', 'watchedSeconds', 'updatedAt'],
  student_messages: ['targetType', 'targetUserId', 'targetGrade', 'title', 'body', 'status', 'createdAt'],
  notifications: ['target', 'userId', 'grade', 'title', 'body', 'createdAt'],
};

const LEGACY_MAP = {
  examResults: 'exam_results',
  attempts: 'exam_results',
  video_views: 'lessonProgress',
  payment_requests: 'payment_requests',
  courseAccessCodes: 'subscription_codes',
};

function printReport() {
  console.log('Nahhas data normalization dry-run plan');
  console.log('======================================');
  console.log('\nCanonical collections:');
  Object.entries(CANONICAL_SCHEMA).forEach(([name, fields]) => console.log(`- ${name}: ${fields.join(', ')}`));
  console.log('\nLegacy aliases to review/migrate:');
  Object.entries(LEGACY_MAP).forEach(([from, to]) => console.log(`- ${from} -> ${to}`));
  console.log('\nSafe migration order:');
  [
    '1. Export Firestore backup from Firebase console.',
    '2. Run report mode and count documents in legacy/canonical collections.',
    '3. Migrate examResults/attempts into exam_results with both studentId and userId.',
    '4. Normalize users subscriptionStatus/subscriptionExpiry from vip/vipUntil fields.',
    '5. Normalize student_messages targets: targetType, targetUserId, targetGrade.',
    '6. Deploy tightened Firestore rules.',
    '7. Keep legacy collections read-only for one release, then archive.',
  ].forEach((step) => console.log(step));
}

printReport();
