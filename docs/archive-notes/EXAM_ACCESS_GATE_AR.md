# ميزة شروط فتح الامتحان والاستثناء الإداري

تم إضافة نظام يتيح للأدمن ربط امتحان جديد بنتيجة امتحان سابق.

## الفكرة

عند إنشاء أو تعديل امتحان يمكن تفعيل: **شروط فتح الامتحان**.

الأدمن يحدد:

- الامتحان السابق المطلوب اجتيازه.
- النسبة المطلوبة مثل 70%.
- اعتماد أفضل محاولة للطالب.

الطالب سيشاهد الامتحان في صفحة الامتحانات، لكنه سيظهر مقفولًا إذا لم يحقق الشرط، مع رسالة توضح السبب والنسبة الحالية.

## مثال

- امتحان الشهر: الطالب حصل على 50%.
- الامتحان الشامل يحتاج 70% في امتحان الشهر.

النتيجة: الامتحان الشامل يظهر للطالب مقفولًا برسالة توضح أنه يحتاج 70% أو أكثر.

## الاستثناء الإداري

تم إضافة لوحة داخل إدارة الامتحانات باسم: **فتح امتحان استثنائي لطالب**.

من خلالها يستطيع الأدمن اختيار:

- الامتحان المقفول.
- الطالب.
- سبب الاستثناء اختياري.

بعد الفتح الاستثنائي يستطيع الطالب دخول الامتحان حتى لو لم يحقق النسبة المطلوبة.

يمكن أيضًا إلغاء الاستثناء من نفس اللوحة.

## قاعدة البيانات

تم إضافة مجموعة Firestore جديدة:

```txt
exam_access_overrides
```

كل مستند فيها يحتوي على:

```js
{
  examId,
  examTitle,
  studentId,
  studentName,
  studentEmail,
  allowed: true,
  reason,
  createdBy,
  createdAt,
  updatedAt
}
```

## قواعد Firestore

تم إضافة قاعدة تسمح:

- للأدمن بإنشاء/تعديل/حذف الاستثناءات.
- للطالب بقراءة الاستثناءات الخاصة به فقط.

## ملفات تم تعديلها

```txt
src/config/collections.js
src/admin/hooks/useAdminDashboardData.js
src/admin/services/adminDashboard.listeners.js
src/admin/parts/AdminDashboard.jsx
src/admin/parts/AdminDashboardTabs.jsx
src/admin/parts/AdminDashboardModals.jsx
src/admin/modals/AdminFullExamEditorModal.jsx
src/student/hooks/useStudentDashboardData.js
src/student/services/studentDashboard.listeners.js
src/student/parts/StudentDashboard.jsx
firestore.rules
```

## أوامر التشغيل

بعد فك الضغط:

```bash
npm install
npm run build
npm run security:smoke
```

ثم ارفع على GitHub ليتم النشر على Vercel.

ولو تستخدم Firebase Rules:

```bash
npm run deploy:rules
```

