# خطة فصل الملف: `src/features/courses/modules/StudentCoursesHub.jsx`

**الحجم:** 19.0 KB  
**القسم:** 03_student_dashboard  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `ImgInput`
- `StudentCoursesHub`
- `ytId`
- `pct`
- `clean`
- `randomCode`
- `userLabel`
- `userIdOf`
- `isEnrolled`
- `courseProgress`
- `pr`
- `er`
- `over`
- `can`
- `saveP`
- `openExam`

## الملفات المقترح فصلها منه
- `StudentCoursesHeader.jsx`
- `StudentCoursesGrid.jsx`
- `StudentCourseCard.jsx`
- `StudentCourseProgressPanel.jsx`

## عدد الاستيرادات
12 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
