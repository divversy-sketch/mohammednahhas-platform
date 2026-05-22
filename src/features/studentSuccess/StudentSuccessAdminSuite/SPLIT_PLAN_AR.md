# خطة فصل الملف: `src/features/studentSuccess/StudentSuccessAdminSuite.jsx`

**الحجم:** 18.1 KB  
**القسم:** 03_student_dashboard  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `AdminStudentSuccessSuite`
- `ContentProtectionPanel`
- `ExamErrorAnalyticsPanel`
- `LearningPathAdminPanel`
- `ParentPortalPanel`
- `AdvancedAssignmentsPanel`
- `GamificationAndCertificatesPanel`
- `BroadcastEnhancerPanel`
- `dateText`
- `csv`
- `escape`
- `Panel`
- `Metric`
- `getWeakAreas`
- `getAtRiskStudents`
- `exportRows`
- `exportParentReport`

## الملفات المقترح فصلها منه
- `StudentSuccessAdminSuiteView.jsx`
- `useStudentSuccessAdminSuiteController.js`
- `StudentSuccessAdminSuiteParts.jsx`

## عدد الاستيرادات
6 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
