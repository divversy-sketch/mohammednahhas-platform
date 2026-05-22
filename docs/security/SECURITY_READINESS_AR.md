# جاهزية الأمان

## الموجود الآن

- فحص static لعدم وجود مفاتيح خاصة داخل `src`.
- فحص `.env.example` للتأكد من توثيق مفاتيح Firebase المطلوبة.
- تقرير `npm audit` غير تدميري في `docs/security/NPM_AUDIT_STATUS.md`.
- عدم استخدام `npm audit fix --force` تلقائيًا لتجنب كسر Firebase أو Firebase Admin.

## قاعدة مهمة

أي تحديث Major في Firebase/Firebase Admin لازم يتم في فرع مستقل ثم تشغيل:

```bash
npm run final:ultimate
npm run e2e:playwright
```

ويتم اختبار:

- تسجيل الدخول.
- صلاحيات الأدمن.
- Firestore read/write.
- Storage upload.
- الامتحانات والدفع وتتبع الفيديو.
