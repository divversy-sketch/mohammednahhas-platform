# اختبارات Playwright السريعة

الأوامر:

```bash
npm install
npx playwright install
npm run e2e:playwright
```

ولو عايز تختبر نسخة منشورة:

```bash
E2E_BASE_URL=https://your-domain.vercel.app E2E_SKIP_WEBSERVER=true npm run e2e:playwright
```

## اختبارات السيناريوهات الحقيقية

لتشغيل سيناريوهات الطالب/الأدمن الحقيقية، أضف متغيرات البيئة قبل الأمر:

```bash
E2E_STUDENT_EMAIL="student@example.com" E2E_STUDENT_PASSWORD="password" \
E2E_ADMIN_EMAIL="admin@example.com" E2E_ADMIN_PASSWORD="password" \
npm run e2e:playwright
```

لو المتغيرات غير موجودة، الاختبارات الحساسة يتم تخطيها بدل ما تكسر الـ CI.
