# خطة فصل الملف: `src/features/admin-dashboard/analytics/AdminPerformanceAnalytics.jsx`

**الحجم:** 11.7 KB  
**القسم:** 04_admin_dashboard  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `AdminPerformanceAnalytics`
- `getMetricsForResult`

## الملفات المقترح فصلها منه
- `AdminPerformanceAnalyticsView.jsx`
- `useAdminPerformanceAnalyticsController.js`
- `AdminPerformanceAnalyticsParts.jsx`

## عدد الاستيرادات
4 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
