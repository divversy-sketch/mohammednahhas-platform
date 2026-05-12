# تقرير بداية واجهة V2

هذه النسخة تبدأ مسار تغيير التصميم بالكامل مع الحفاظ على نفس المنطق الحالي للمشروع.

## ما تم تنفيذه

- إضافة ملف تصميم مركزي جديد:
  - `src/styles/v2-redesign.css`
- استيراد CSS الأساسي من `src/main.jsx` لضمان تحميل Tailwind وطبقة V2 معًا.
- إضافة Design System ثابت داخل:
  - `src/ui/theme/tokens.js`
  - `src/ui/components/Button.jsx`
  - `src/ui/components/Card.jsx`
  - `src/ui/components/MetricCard.jsx`
  - `src/ui/components/StatusBadge.jsx`
  - `src/ui/components/TableShell.jsx`
  - `src/ui/layouts/PageShell.jsx`
- تحديث شكل Admin shell بدون تغيير منطق Firebase أو الصلاحيات:
  - `src/admin/parts/AdminDashboard.jsx`
  - `src/admin/components/AdminHeader.jsx`
  - `src/admin/components/AdminSidebar.jsx`
- تحديث شكل Student shell بدون تغيير بيانات الطالب أو الامتحانات:
  - `src/student/parts/StudentDashboard.jsx`

## مبدأ التنفيذ

- لم يتم لمس قواعد Firebase.
- لم يتم لمس Cloudinary.
- لم يتم تغيير API أو business logic.
- لم يتم تغيير أسماء collections أو بنية البيانات.
- التغيير مركز في UI/UX وطبقة التصميم فقط.

## شكل الواجهة الجديد

- Glassmorphism أخف وأنضف.
- Topbar أكثر حداثة.
- Sidebar بتفاعل أفضل.
- ألوان ثابتة للطالب والأدمن.
- Cards وجداول وفورمات بتنسيق موحد.
- Design tokens قابلة للتطوير لاحقًا.

## المرحلة التالية المقترحة داخل نفس فرع V2

- إعادة بناء صفحات الأدمن صفحة صفحة باستخدام مكونات `src/ui` الجديدة.
- إعادة بناء صفحات الطالب صفحة صفحة باستخدام `PageShell`, `Card`, `MetricCard`, `TableShell`.
- عدم حذف الواجهة القديمة إلا بعد اكتمال اختبار كل صفحة.

## أوامر الاختبار

```bash
npm install
npm run build
npm run dev
```

لو التصميم ظهر سليم، يتم عمل commit باسم:

```bash
git add .
git commit -m "Start V2 UI redesign with stable design system"
git push
```
