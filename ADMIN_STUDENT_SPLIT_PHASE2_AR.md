# فصل الإدارة والطالب - المرحلة الثانية

تم تنفيذ فصل أعمق داخل نفس مشروع Vite مع الحفاظ على نفس رابط الاستضافة ونفس Firebase.

## ما تم تغييره

- نقل تطبيق الإدارة إلى:
  `src/admin/app/AdminApp.jsx`

- نقل تطبيق الطالب إلى:
  `src/student/app/StudentApp.jsx`

- أصبح ملف التوجيه الرئيسي خفيفًا جدًا:
  `src/app/AppRoot.jsx`

- إزالة مكون `StudentDashboard` بالكامل من ملف الإدارة.

- إزالة مكونات الإدارة الثقيلة من ملف الطالب، مثل:
  - `AdminDashboard`
  - `AdminPaymentRequestsPanel`
  - `QuestionBankManager`
  - `AssignmentsManager`
  - `AdminProDashboard`
  - `AdminPerformanceAnalytics`
  - `AdminQuestionDeepAnalytics`

- حذف مكونات غير مستخدمة بعد الفصل:
  - `LandingPage` من تطبيق الإدارة
  - `AdminAccessDenied` من تطبيق الطالب

- الحفاظ على حماية لوحة الإدارة عبر Firestore:
  `admins/{uid}` مع `active=true` و `role=admin`

- عدم استخدام Realtime Database في `firebase.json` لأن المشروع الحالي لا يعتمد عليه.

## نتيجة البناء

تم تشغيل:

```bash
npm run build
```

والبناء تم بنجاح.

## النتيجة العملية

- فتح `/admin` يحمل تطبيق الإدارة فقط.
- فتح `/student` أو `/` يحمل تطبيق الطالب فقط.
- الطالب لا يحمل كود لوحة الإدارة داخل StudentApp.
- الإدارة لا تحمل كود StudentDashboard داخل AdminApp.

## أوامر الرفع المقترحة

```bash
npm install
npm run build
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

ولو Firebase Storage مستخدم للملفات الصغيرة:

```bash
firebase deploy --only storage
```

## الخطوة التالية المقترحة

المرحلة الثالثة تكون نقل أجزاء داخل `AdminApp.jsx` و `StudentApp.jsx` إلى ملفات أصغر، مثل:

- `src/admin/pages/DashboardOverview.jsx`
- `src/admin/pages/StudentsManager.jsx`
- `src/admin/pages/ExamsManager.jsx`
- `src/student/pages/StudentHome.jsx`
- `src/student/pages/StudentExams.jsx`
- `src/student/pages/StudentCourses.jsx`
- `src/shared/auth/AuthPage.jsx`
- `src/shared/components/ToastCenter.jsx`
