# تقرير إعادة هيكلة Frontend Architecture

## ما تم تنفيذه

تم تنظيم الواجهة إلى طبقات واضحة بدون تغيير منطق المنصة الأساسي:

```text
src/
  layouts/              # أغلفة Public / Student / Admin + AppProviders
  pages/                # صفحات مقسمة حسب نوع المستخدم
    public/
    student/
    admin/
  components/
    common/             # مداخل موحدة لمكونات UI المشتركة
    student/dashboard/  # أجزاء لوحة الطالب بأسماء واضحة
    admin/              # مداخل لمكونات الإدارة
  features/
    exams/
    lectures/
    payments/
    students/
    notifications/
    support/
  shared/config/        # خرائط الرحلات ومراكز العمل
```

## فصل الواجهات حسب نوع المستخدم

- `src/pages/public` لصفحات الزائر وتسجيل الدخول.
- `src/pages/student` للوحة الطالب.
- `src/pages/admin` للوحة الأدمن وحالات رفض الوصول.
- `src/layouts/PublicLayout.jsx`, `StudentLayout.jsx`, `AdminLayout.jsx` تفصل Providers والأغلفة عن الصفحات.

## تقسيم صفحة الطالب إلى Components صغيرة

تمت إضافة مداخل واضحة قابلة للاستخدام مباشرة:

- `StudentHeader`
- `StudentStats`
- `ContinueLearningCard`
- `TodayPlan`
- `Notifications`
- `QuickActions`

المداخل موجودة في:

```text
src/components/student/dashboard/
```

وهي تربط الأجزاء الموجودة حاليًا بدل نسخها، حتى لا يزيد التكرار.

## فصل المنطق عن التصميم

التطبيق الآن يدخل من `pages`، والـ wrappers العامة موجودة في `layouts`، ومصادر البيانات الأساسية بقيت في hooks مثل:

- `src/student/hooks/useStudentDashboardData.js`
- `src/admin/hooks/useAdminDashboardData.js`
- `src/student/hooks/useStudentSession.js`
- `src/admin/hooks/useAdminSession.js`

## توحيد UI Components

تم إنشاء `src/components/common` كمخرج ثابت للمكونات المشتركة الموجودة في `src/ui/components` مثل:

- Button
- Card
- Modal
- TableShell
- StatusBadge
- EmptyState
- SkeletonBlock
- FormField
- SearchInput
- PaginationBar

أي صفحة جديدة تستخدم `components/common` بدل إنشاء نسخة جديدة من نفس المكون.

## فصل Features

تمت إضافة مداخل مستقلة للوظائف عالية التأثير:

- `features/exams`
- `features/lectures`
- `features/payments`
- `features/students`
- `features/notifications`
- `features/support`

هذه الملفات تعمل كـ public API لكل feature، بحيث لا تحتاج الصفحات لاستيراد ملفات داخلية كثيرة.

## إعادة ترتيب رحلة المستخدم

تم تعريف رحلات واضحة في:

```text
src/shared/config/navigationJourneys.js
```

رحلة الطالب:

```text
الرئيسية → المحاضرات → الامتحانات → الأداء → الاشتراك والدعم
```

مراكز عمل الأدمن:

```text
لوحة القيادة → الطلاب → المدفوعات → المحتوى → الامتحانات → التقارير → الإعدادات
```

## ملاحظات مهمة

- لم يتم حذف ملفات منطقية قد تؤثر على التشغيل.
- تم استخدام re-export / wrapper files لتقليل خطر كسر الـ imports.
- يمكن في مرحلة لاحقة نقل منطق الدفع والدعم من `StudentDashboard.jsx` إلى hooks مستقلة بدون تغيير واجهة الصفحة.
