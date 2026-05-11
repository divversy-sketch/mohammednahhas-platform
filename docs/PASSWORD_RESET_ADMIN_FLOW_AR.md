# تطوير نظام تغيير كلمة السر من لوحة الأدمن

تم تنفيذ مسار بديل عن إيميلات Firebase الافتراضية لأن رابط إعادة تعيين كلمة السر قد لا يصل أحيانًا لبعض الإيميلات.

## ما الذي تغير؟

### 1) صفحة تسجيل الدخول
- زر نسيان كلمة السر أصبح يرسل طلبًا للإدارة داخل Firestore في مجموعة:
  - `password_reset_requests`
- الطالب لا يحتاج أن يكون مسجل دخول حتى يرسل الطلب.
- تظهر له رسالة واضحة أن الطلب وصل للإدارة.

### 2) لوحة الإدارة
تمت إضافة تبويب جديد في القائمة:
- `تغيير كلمات السر`

داخل هذا التبويب يستطيع الأدمن:
- رؤية طلبات تغيير كلمة السر المفتوحة.
- معرفة هل الإيميل مطابق لطالب موجود أم لا.
- تعيين كلمة سر جديدة للطالب.
- رفض الطلب.

### 3) تغيير كلمة السر الحقيقي
تغيير كلمة السر يتم عبر Cloud Function جديدة:
- `adminSetStudentPassword`

هذه الدالة تستخدم Firebase Admin SDK وتغير كلمة السر فعليًا في Firebase Authentication، وليس فقط داخل Firestore.

### 4) الحماية والتتبع
- لا يتم تخزين كلمة السر الجديدة كنص داخل Firestore.
- يتم تسجيل العملية في:
  - `admin_audit_logs`
- يتم تعليم طلب تغيير كلمة السر أنه `completed` بعد التنفيذ.

## ملفات تم تعديلها/إضافتها

- `src/shared/platformParts/AuthPage.jsx`
- `src/admin/components/AdminSidebar.jsx`
- `src/admin/parts/AdminDashboard.jsx`
- `src/admin/parts/AdminDashboardTabs.jsx`
- `src/admin/parts/AdminPasswordResetRequestsPanel.jsx`
- `src/admin/services/adminSecureFunctions.js`
- `src/admin/hooks/useAdminDashboardData.js`
- `src/admin/services/adminDashboard.listeners.js`
- `src/config/collections.js`
- `functions/index.js`
- `firestore.rules`

## مهم جدًا عند النشر

بعد رفع النسخة، يجب نشر Cloud Functions و Firestore Rules:

```bash
npm run deploy:functions
npm run deploy:rules
npm run deploy:hosting
```

بدون نشر `functions` لن يستطيع الأدمن تغيير كلمة السر فعليًا من اللوحة.

## الاختبارات

تم تشغيل:

```bash
npm run build
npm run security:smoke
node -c functions/index.js
```

والنتيجة ناجحة.
