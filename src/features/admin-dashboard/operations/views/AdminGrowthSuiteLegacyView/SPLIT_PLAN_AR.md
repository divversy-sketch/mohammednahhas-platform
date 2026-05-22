# خطة فصل الملف: `src/features/admin-dashboard/operations/views/AdminGrowthSuiteLegacyView.jsx`

**الحجم:** 21.0 KB  
**القسم:** 04_admin_dashboard  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `AdminGrowthSuiteLegacyView`
- `renderPayments`
- `renderCourses`
- `renderQuestions`
- `renderAnalytics`
- `renderNotifications`
- `renderMobile`
- `renderSupport`
- `renderActive`

## الملفات المقترح فصلها منه
- `AdminGrowthHeader.jsx`
- `AdminGrowthStatsGrid.jsx`
- `AdminGrowthChartsPanel.jsx`
- `AdminGrowthStudentsTable.jsx`

## عدد الاستيرادات
8 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
