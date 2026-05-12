# تشغيل تغيير كلمة السر عبر Vercel API مجانًا

تم نقل أوامر تغيير كلمة السر ورفض طلبات تغيير كلمة السر من Firebase Cloud Functions إلى Vercel Serverless API حتى يعمل المشروع بدون ترقية Firebase إلى Blaze.

## الملفات الجديدة

- `api/_firebaseAdmin.js`
- `api/admin-set-student-password.js`
- `api/admin-password-request-status.js`

## الملفات المعدلة

- `src/admin/services/adminSecureFunctions.js`
- `package.json`

## متغيرات البيئة المطلوبة على Vercel

يجب إضافة القيم التالية داخل Vercel Project Settings > Environment Variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

قيمة `FIREBASE_PRIVATE_KEY` يجب أن تكون كاملة مع `-----BEGIN PRIVATE KEY-----` و `-----END PRIVATE KEY-----`، ويفضل ترك علامات `\n` كما هي.

## طريقة النشر

لا تستخدم:

```bash
npm run deploy:functions
```

استخدم نشر Vercel فقط:

```bash
npm install
npm run build
git add .
git commit -m "Use Vercel API for password reset"
git push origin main
```

بعد النشر جرّب:

- رفض طلب تغيير كلمة السر.
- تعيين كلمة سر جديدة لطالب.

## ملاحظات أمان

- كلمة السر الجديدة لا يتم تخزينها في Firestore.
- الطلب يتم تنفيذه من السيرفر باستخدام Firebase Admin SDK.
- السيرفر يتحقق من توكن الأدمن، ثم يتحقق من مستند الأدمن داخل collection `admins`.
- يتم تسجيل العمليات في `admin_audit_logs`.
