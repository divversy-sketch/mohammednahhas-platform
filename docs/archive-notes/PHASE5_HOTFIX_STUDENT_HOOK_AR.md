# إصلاح Phase 5 - useStudentDashboardData

تم إصلاح خطأ شاشة الطالب:

```txt
ReferenceError: useStudentDashboardData is not defined
```

السبب: أثناء فصل بيانات الطالب في Hook مستقل، تم إنشاء الملف:

```txt
src/student/hooks/useStudentDashboardData.js
```

لكن ملف:

```txt
src/student/parts/StudentDashboard.jsx
```

كان يستخدم الـ hook بدون استيراده.

الإصلاح: إضافة import واضح:

```js
import { useStudentDashboardData } from '../hooks/useStudentDashboardData.js';
```

بعد الرفع، اختبر:

```txt
/student
/admin
```
