# Runbook التشغيل النهائي

## قبل أي Merge

```bash
npm ci
npm run final:ultimate
```

## قبل النشر

```bash
npm run build
npm run performance:budget
npm run security:audit
```

## بعد النشر

```bash
E2E_BASE_URL="https://your-production-domain.com" E2E_SKIP_WEBSERVER=true npm run e2e:playwright
```

## قواعد لا نكسرها

- لا تضيف منطق API طويل داخل page/component.
- أي Feature جديدة تبدأ من `src/features/_template`.
- أي استيراد من Feature ثانية يكون من `index.js` وليس من ملف داخلي.
- لا تستخدم `npm audit fix --force` على main.
- لا ترفع `.env` أو مفاتيح Firebase Admin.
