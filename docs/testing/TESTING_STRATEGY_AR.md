# استراتيجية الاختبارات النهائية

هذه النسخة تحتوي على طبقات فحص متعددة حتى لا يعود المشروع للتشابك القديم.

## أوامر مهمة

```bash
npm run test:unit
npm run test:architecture
npm run test:security
npm run test:all
npm run e2e:playwright
npm run final:ultimate
```

## ما الذي تغطيه الاختبارات؟

- **Unit tests**: أدوات صغيرة حساسة مثل مؤقت الامتحان، تتبع الفيديو، فلاتر بنك الأسئلة، وأرقام الهاتف.
- **Architecture tests**: وجود `index.js` لكل Feature، حجم الملفات، وعدم زيادة legacy imports.
- **Security static tests**: التأكد من عدم وجود private keys واضحة داخل `src`، وأن `.env.example` موثق.
- **E2E Playwright**: تحميل الصفحة العامة ومسارات الطالب/الأدمن بدون crash، مع سيناريوهات حقيقية عند توفير بيانات دخول.

## تشغيل سيناريوهات حقيقية

```bash
E2E_STUDENT_EMAIL="student@example.com" E2E_STUDENT_PASSWORD="password" \
E2E_ADMIN_EMAIL="admin@example.com" E2E_ADMIN_PASSWORD="password" \
npm run e2e:playwright
```

لو بيانات الدخول غير موجودة، الاختبارات الحساسة يتم تخطيها بدل ما تكسر CI.
