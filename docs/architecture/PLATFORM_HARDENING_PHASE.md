# مرحلة تقوية المنصة

تم تنفيذ المرحلة داخل الأقسام الموجودة بدون إضافة تبويبات جديدة.

## ما تم إضافته

1. طبقة بيانات موحدة `src/services/platformData` للتعامل مع collections القديمة والجديدة.
2. قواعد خصوصية أقوى للرسائل والإشعارات، بحيث يقرأ الطالب الرسائل العامة أو رسائله أو رسائل مرحلته فقط.
3. Cloud Functions للعمليات الحساسة مع Audit Log سيرفر.
4. صلاحيات أفعال منفصلة عن صلاحيات التبويبات.
5. Error Monitoring يسجل أخطاء الواجهة في `system_errors`.
6. Performance Metrics في `performance_metrics`.
7. Migration plan لتوحيد البيانات القديمة والجديدة.
8. E2E smoke specification لحماية المسارات الأساسية.
9. Command Center داخل Dashboard الأدمن بدل تبويب جديد.
10. System Health داخل إعدادات المنصة بدل تبويب جديد.

## تشغيل الفحوصات

```bash
npm run source:health
npm run e2e:smoke
npm run build
npm run production:check
```

## ملاحظات نشر

- بعد نشر Cloud Functions، استخدم العمليات الحساسة من السيرفر كلما أمكن.
- قبل تشغيل أي migration حقيقية، اعمل Firestore export من Firebase Console.
- قواعد Firestore الجديدة قد تحتاج فهارس للـ queries التي تستخدم `orderBy(createdAt)`.
