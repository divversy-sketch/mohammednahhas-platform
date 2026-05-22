# خطة فصل الملف: `src/features/student-dashboard/shell/tabs/StudentExamsTab.jsx`

**الحجم:** 14.0 KB  
**القسم:** 03_student_dashboard  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `StudentExamsTab`
- `LazyPanelFallback`
- `LazyPanel`

## الملفات المقترح فصلها منه
- `StudentExamsTabView.jsx`
- `useStudentExamsTabController.js`
- `StudentExamsTabParts.jsx`

## عدد الاستيرادات
18 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
