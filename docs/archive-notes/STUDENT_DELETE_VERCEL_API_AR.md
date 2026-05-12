# حذف الطالب من المنصة و Firebase Authentication عبر Vercel API

## الهدف
تم إضافة مسار مجاني يعمل على Vercel بدل Firebase Cloud Functions لحذف الطالب نهائيًا من:

- Firebase Authentication
- Firestore `users/{studentId}`
- البيانات المرتبطة بالطالب داخل المنصة

مع أرشفة نسخة من بيانات الطالب قبل الحذف داخل:

```txt
deleted_users/{studentId}
```

## الملفات التي تمت إضافتها/تعديلها

```txt
api/admin-delete-student.js
src/admin/services/adminSecureFunctions.js
src/admin/parts/AdminDashboard.jsx
```

## طريقة العمل
عند ضغط الأدمن على زر حذف الطالب:

1. تظهر رسالة تأكيد قوية.
2. الواجهة ترسل الطلب إلى:
   ```txt
   /api/admin-delete-student
   ```
3. السيرفر يتحقق من توكن الأدمن.
4. السيرفر يتأكد أن الحساب موجود في `admins/{uid}` وله:
   ```js
   active: true
   role: "admin"
   ```
5. يتم أرشفة بيانات الطالب في `deleted_users`.
6. يتم حذف المستخدم من Firebase Authentication.
7. يتم حذف وثيقة الطالب من `users`.
8. يتم حذف السجلات المرتبطة مثل النتائج والمشاهدات والاشتراكات.
9. يتم تسجيل العملية في `admin_audit_logs`.

## المتغيرات المطلوبة في Vercel
نفس متغيرات Firebase Admin التي أضفتها سابقًا:

```txt
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

## بيانات يتم تنظيفها
المسار يبحث عن الطالب في الحقول الشائعة:

```txt
studentId
userId
uid
```

داخل مجموعات مثل:

```txt
exam_results
examResults
homework_results
assignment_submissions
student_mistakes
video_views
video_notes
enrollments
lessonProgress
lessonUnlockOverrides
payment_requests
password_reset_requests
notifications
```

## ملاحظات مهمة
- الحذف من Firebase Auth لا يمكن تنفيذه من المتصفح مباشرة، لذلك تم استخدام Vercel API.
- الحساب لا يحتاج Firebase Blaze.
- لا تضع ملف service account داخل المشروع أو GitHub.
- بعد رفع التعديل إلى GitHub، اعمل Redeploy من Vercel.
