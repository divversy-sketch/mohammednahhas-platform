# خطة فصل الملف: `src/features/student-dashboard/components/home/cards/StudentUnifiedHomeDashboard.jsx`

**الحجم:** 13.2 KB  
**القسم:** 03_student_dashboard  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `StudentUnifiedHomeDashboard`

## الملفات المقترح فصلها منه
- `StudentUnifiedHomeDashboardView.jsx`
- `useStudentUnifiedHomeDashboardController.js`
- `StudentUnifiedHomeDashboardParts.jsx`

## عدد الاستيرادات
8 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
