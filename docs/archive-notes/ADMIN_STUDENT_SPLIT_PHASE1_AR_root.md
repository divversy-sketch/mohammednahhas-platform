# فصل لوحة الإدارة عن واجهة الطالب - المرحلة الأولى

تم تنفيذ فصل عملي داخل نفس مشروع Vite/React، بحيث لا يبدأ التطبيق بتحميل لوحة الإدارة وواجهة الطالب من نفس الملف الرئيسي مباشرة.

## ما تم تغييره

- تم تحويل `src/app/AppRoot.jsx` إلى موجّه خفيف فقط.
- تم إنشاء ملف مستقل لواجهة الإدارة:
  - `src/admin/AdminApp.jsx`
- تم إنشاء ملف مستقل لواجهة الطالب:
  - `src/student/StudentApp.jsx`
- أصبح تحميل الإدارة والطالب يتم بنظام lazy loading حسب المسار:
  - `/admin` يحمل ملف الإدارة فقط.
  - `/student` أو `/` يحمل ملف الطالب فقط.
- تم الحفاظ على فحص الأدمن من Firestore عبر:
  - `admins/{uid}`
  - `role = admin`
  - `active = true`
- تم حذف إعداد Realtime Database من `firebase.json` لأن Realtime Database غير مفعّل عندك.

## نتيجة البناء

تم تشغيل:

```bash
npm run build
```

والبناء تم بنجاح. خرجت chunks منفصلة تقريبًا:

- `AdminApp-*.js`
- `StudentApp-*.js`
- `vendor-firebase-*.js`
- `vendor-react-*.js`
- `vendor-ui-*.js`

## الملفات المهمة

- `src/app/AppRoot.jsx`
- `src/admin/AdminApp.jsx`
- `src/student/StudentApp.jsx`
- `firestore.rules`
- `storage.rules`
- `firebase.json`

## أوامر الرفع المناسبة

طالما Realtime Database غير مفعّل، لا تستخدم:

```bash
firebase deploy --only database
```

استخدم:

```bash
npm run build
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only hosting
```

أو لو لا تريد رفع Storage الآن:

```bash
npm run build
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

## ملاحظة مهمة

هذا فصل مرحلي قوي داخل نفس المشروع. الخطوة التالية لاحقًا ستكون فصل نهائي إلى مشروعين أو تطبيقين مستقلين بالكامل:

- تطبيق طالب مستقل
- تطبيق إدارة مستقل

لكن المرحلة الحالية تقلل التحميل الأول وتفصل المسارات وتمنع الطالب من الدخول للإدارة بناءً على `admins/{uid}`.
