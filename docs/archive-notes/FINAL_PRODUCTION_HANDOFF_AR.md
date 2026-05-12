# التسليم النهائي للإنتاج

## حالة النسخة
هذه النسخة هي نسخة تثبيت نهائية بعد مراحل:

- تنظيف تضخم الكود.
- تثبيت الامتحانات والـ autosave.
- دمج تطويرات الدفع والكورسات وبنك الأسئلة والإشعارات داخل الأقسام الأصلية.
- تقوية الأمان والصلاحيات.
- إضافة Audit Log للعمليات الحساسة.
- توحيد طبقة البيانات.
- إضافة مراقبة الأخطاء والأداء.
- إضافة أدوات QA و Backup/Migration.
- إصلاح شاشة البداية البيضاء الناتجة عن نقص استيراد `installGlobalErrorLogger`.
- تثبيت أيقونات `lucide-shim.jsx` الناقصة مثل `Activity` و `TrendingDown`.

## أوامر الفحص قبل الرفع

```powershell
npm install
npm run source:health
npm run production:ready
```

ولو أردت تشغيلها خطوة خطوة:

```powershell
npm run source:health
npm run cleanup:report
npm run firestore:performance
npm run e2e:smoke
npm run e2e:real
npm run backup:plan
npm run postdeploy:qa
npm run build
npm run security:smoke
npm run bundle:report
```

## أوامر الرفع

```powershell
git status
git add .
git commit -m "Finalize production-ready platform hardening"
git push
```

## اختبار سريع بعد النشر

جرّب من رابط الإنتاج:

1. طالب يسجل دخول.
2. يفتح Dashboard الطالب.
3. يدخل كورس.
4. يدخل امتحان ويعمل refresh أثناء الامتحان.
5. يكمل ويسلّم الامتحان.
6. يظهر له الناتج.
7. يرسل طلب دفع.
8. الأدمن يقبل الدفع.
9. الطالب يظهر له الاشتراك مفعل.
10. الأدمن يرسل إشعار.
11. الطالب يستقبل الإشعار.
12. الطالب يفتح تذكرة دعم.
13. الأدمن يرد ويغلق التذكرة.
14. الأدمن يفتح إعدادات المنصة ثم System Health.

## ملاحظات مهمة

- لا تنقل أي ملف من `src` للأرشيف إلا لو `source:health` طلبه بالاسم.
- لا تستبدل `src/shared/icons/lucide-shim.jsx` بملف export عام؛ الملف يحتوي أيقونات مخصصة.
- لو ظهرت شاشة بيضاء، افتح Console وابحث عن أول `ReferenceError`.
- تحذير `VITE_RECAPTCHA_V3_SITE_KEY is missing` لا يوقف المنصة، لكنه يعني أن App Check غير مفعل في هذه البيئة.

## نقطة الرجوع الآمنة

قبل أي تطوير جديد، اعمل tag للنسخة المستقرة:

```powershell
git tag stable-production-ready
git push origin stable-production-ready
```

