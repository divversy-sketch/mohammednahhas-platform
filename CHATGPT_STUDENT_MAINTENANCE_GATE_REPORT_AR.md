# تقرير إضافة أداة بوابة صيانة صفحة الطالب

تمت إضافة أداة تسمح للإدارة بإغلاق دخول الطلاب إلى صفحة الطالب مؤقتًا أثناء تنفيذ التصميم الجديد، مع السماح لطالب/طلاب محددين فقط بالدخول التجريبي لمعاينة التصميم.

## ما الذي تم إضافته؟

### 1. بوابة حماية صفحة الطالب

تمت إضافة مكون:

```text
src/features/platform-maintenance/components/StudentPortalGate.jsx
```

وتم ربطه داخل:

```text
src/student/app/StudentApp.jsx
```

الآن عند تسجيل الطالب الدخول، يتم فحص حالة بوابة الصيانة قبل عرض صفحة الطالب.

إذا كانت الصيانة مفعلة والطالب غير موجود في القائمة المسموحة، تظهر له شاشة:

```text
الموقع تحت الصيانة حاليًا
```

ولا يدخل إلى Dashboard الطالب.

---

### 2. شاشة صيانة للطالب

تمت إضافة:

```text
src/features/platform-maintenance/components/StudentMaintenanceScreen.jsx
```

وتعرض رسالة صيانة بتصميم جديد وإطار Glow Frame.

---

### 3. أداة تحكم للإدارة

تمت إضافة:

```text
src/features/platform-maintenance/components/AdminStudentPortalGateManager.jsx
```

وتم وضعها داخل تبويب إعدادات المنصة في الأدمن:

```text
src/features/admin-dashboard/tabs/split/AdminPlatformSettingsTab.jsx
```

من خلالها يمكن للإدارة:

- تفعيل صيانة صفحة الطالب.
- إيقاف الصيانة وفتح الدخول لكل الطلاب.
- تعديل عنوان رسالة الصيانة.
- تعديل نص رسالة الصيانة.
- إضافة UID لطلاب مسموح لهم بالدخول التجريبي.
- إضافة إيميلات لطلاب مسموح لهم بالدخول التجريبي.

---

### 4. مكان حفظ الإعدادات في Firestore

الإعدادات تحفظ في:

```text
settings/student_portal_gate
```

الحقول الأساسية:

```text
enabled
title
message
allowedStudentIds
allowedStudentEmails
showLoginHint
updatedAt
updatedBy
updatedByEmail
```

---

### 5. Hook وخدمة مستقلة

تمت إضافة:

```text
src/features/platform-maintenance/hooks/useStudentPortalGate.js
src/features/platform-maintenance/services/studentPortalGate.service.js
```

حتى لا يكون منطق الصيانة مكتوبًا مباشرة داخل الواجهة.

---

### 6. تنسيقات CSS

تمت إضافة تنسيقات شاشة الصيانة وأداة الإدارة داخل:

```text
src/styles/nahhas-redesign.css
```

---

## طريقة الاستخدام

1. ادخل لوحة الأدمن.
2. افتح إعدادات المنصة.
3. ستجد كارت باسم:

```text
بوابة صيانة صفحة الطالب
```

4. فعّل الصيانة.
5. أضف حساب الطالب التجريبي في أحد الحقول:
   - UID الطالب.
   - أو إيميل الطالب.
6. اضغط حفظ.

بعد ذلك:

- الطلاب غير المسموح لهم سيرون شاشة الصيانة.
- الطالب الموجود في القائمة المسموحة سيدخل ويرى التصميم الجديد.
- عند انتهاء التصميم، أوقف الصيانة واضغط حفظ، وسيدخل كل الطلاب طبيعي.

---

## فحوصات تمت بعد الإضافة

```text
npm run build ✅
npm run architecture:report ✅
Legacy import references found: 0 ✅
npm run quality:legacy-imports ✅
npm run quality:file-size ✅
```

## ملاحظة مهمة

قراءة مستند `settings/student_portal_gate` مسموحة حاليًا في قواعد Firestore لأن مجموعة `settings` قابلة للقراءة. الكتابة تحتاج صلاحية `manage_settings` حسب القواعد الحالية.

