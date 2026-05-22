# خطة فصل الملف: `src/features/product/ProductExperienceSuite.jsx`

**الحجم:** 20.8 KB  
**القسم:** 05_shared_components  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `Panel`
- `AdminGlobalSearch`
- `AdminLiveClassesPanel`
- `StudentLiveClassesPanel`
- `StudentExamReviewCenter`
- `StudentCertificatePanel`
- `AdminCertificatesPanel`
- `AdminCommandQuickActions`
- `asText`
- `dateText`
- `percentOf`
- `excelDownload`
- `certificateCode`
- `fakeQrDataUri`
- `recipientCount`
- `exportCsv`

## الملفات المقترح فصلها منه
- `ProductSuiteHeader.jsx`
- `StudentLiveClassesPanel.jsx`
- `StudentExamReviewCenter.jsx`
- `StudentCertificatePanel.jsx`

## عدد الاستيرادات
7 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
