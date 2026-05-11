#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
fs.mkdirSync(docsDir, { recursive: true });

const checks = [
  ['student-login', 'طالب يسجل دخول من رابط الإنتاج بدون أخطاء console'],
  ['student-course', 'طالب يفتح كورس ودرس وفيديو/ملف'],
  ['exam-refresh', 'طالب يبدأ امتحان، يعمل refresh، يكمل نفس المحاولة'],
  ['exam-submit', 'طالب يسلّم الامتحان وتظهر النتيجة وتحفظ للأدمن'],
  ['payment-request', 'طالب يرسل طلب دفع من قسم الاشتراك'],
  ['payment-approve', 'الأدمن يقبل الدفع ويتفعل الاشتراك تلقائيًا'],
  ['notification-flow', 'الأدمن يرسل إشعار والطالب يستلمه'],
  ['support-flow', 'طالب يفتح تذكرة دعم والأدمن يرد ويغلقها'],
  ['admin-command-center', 'Dashboard الأدمن يظهر الطلبات/الأخطاء/التذاكر بدون تبويب جديد'],
  ['system-health', 'إعدادات المنصة تعرض أخطاء النظام وقياسات الأداء وسجل QA'],
];

const report = [
  '# Post Deploy QA Checklist',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Scenario | Manual check | Status |',
  '| --- | --- | --- |',
  ...checks.map(([key, title]) => `| ${key} | ${title} | pending |`),
  '',
  'Use this after every deploy before announcing the release to students.',
  ''
].join('\n');

fs.writeFileSync(path.join(docsDir, 'POST_DEPLOY_QA.md'), report, 'utf8');
console.log(report);
