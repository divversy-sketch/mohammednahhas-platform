# خطة فصل الملف: `src/shared/core/debugTools.jsx`

**الحجم:** 13.7 KB  
**القسم:** 05_shared_components  
**الحالة:** يحتاج فصل لأنه كبير أو يخلط تصميم الواجهة مع منطق التشغيل.

## الرموز/المكونات الموجودة حاليًا
- `DEBUG_EVENT_NAME`
- `isActiveAdminSnapshot`
- `isAdminIdentity`
- `getInitialRouteMode`
- `navigatePlatform`
- `isDebugAdmin`
- `pushRemoteDebugLog`
- `pushDebugLog`
- `explainDebugError`
- `DebugCollector`
- `DebugPanel`
- `onError`
- `onRejection`
- `loadLogs`
- `onDebug`
- `clearLogs`

## الملفات المقترح فصلها منه
- `debugToolsView.jsx`
- `usedebugToolsController.js`
- `debugToolsParts.jsx`

## عدد الاستيرادات
6 import

## طريقة النقل الآمنة
1. ثبّت اسم الـ export الحالي حتى لا تتكسر الاستيرادات.
2. انقل JSX/Tailwind فقط إلى ملفات View أو Parts.
3. انقل Firestore/actions/hooks إلى ملفات Controller أو hooks.
4. انقل الجداول والكروت والمودالات إلى components صغيرة.
5. بعد كل مجموعة: شغّل build قبل متابعة المجموعة التالية.

> نسخة الملف الأصلية موجودة هنا بامتداد `.original` عشان المبرمج يفكها بدون ما يلمس الملف التشغيلي مباشرة.
