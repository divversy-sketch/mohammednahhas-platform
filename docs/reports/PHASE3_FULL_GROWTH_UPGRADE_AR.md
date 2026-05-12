# Phase 3 — تطوير شامل بعد ضبط الـ Owner

## ما تم تنفيذه

### 1. Cloudinary Signed Upload
- إضافة API endpoint جديد: `api/cloudinary-signature.js`.
- إضافة تحقق Firebase Auth قبل إصدار توقيع الرفع.
- تقييد مجلدات الرفع داخل `nahhas-platform`.
- تحديث `src/services/cloudinaryUpload.js` ليستخدم signed upload افتراضيًا.
- الإبقاء على unsigned fallback اختياريًا فقط عبر `VITE_CLOUDINARY_ALLOW_UNSIGNED_FALLBACK=true`، ولا يُنصح به في الإنتاج.

### 2. تحسين طلبات الدفع
- بحث داخل طلبات الدفع بالاسم، الإيميل، رقم العملية، والملاحظات.
- فلاتر حسب الحالة، طريقة الدفع، والفترة الزمنية.
- عدادات مالية أوضح.
- تصدير CSV للنتائج الحالية بعد الفلترة.
- زيادة حد القراءة إلى آخر 200 طلب بدل 100.

### 3. تحسين الأداء
- إضافة حدود قراءة واضحة لاستعلامات الطالب في `studentDashboard.listeners.js`.
- تقليل خطر تحميل collections كبيرة بالكامل عند الطالب.
- الإبقاء على الفرز داخل الواجهة لتقليل الحاجة لفهارس Firestore جديدة في هذه المرحلة.

### 4. اختبارات E2E حقيقية
- إضافة Playwright config.
- إضافة smoke tests للصفحة العامة ومسار الأدمن.
- إضافة أوامر:
  - `npm run e2e:playwright`
  - `npm run e2e:playwright:report`

### 5. تنظيف هيكل المشروع
- نقل ملفات التقارير والملاحظات من root إلى `docs/archive-notes`.
- إضافة تقرير المرحلة داخل `docs/reports`.
- ترك root أنظف لملفات التشغيل الأساسية.

### 6. PWA Cache Refresh
- تحديث نسخة الـ Service Worker لإجبار المتصفح على التقاط نسخة جديدة بدل الكاش القديم.

## متغيرات البيئة المطلوبة للإنتاج

على Vercel/API runtime:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

في متغيرات Vite:

```env
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_SIGNATURE_ENDPOINT=/api/cloudinary-signature
VITE_CLOUDINARY_ALLOW_UNSIGNED_FALLBACK=false
```

## أوامر التشغيل

```bash
npm install
npm run build
npm run e2e:playwright
```

## ملاحظات مهمة

- لم يتم إزالة `database.rules.json` أو تعديل Realtime Database rules؛ لأن Realtime Database لا يستطيع قراءة Firestore admins document مباشرة.
- لو Cloudinary signed upload لم يعمل، راجع متغيرات Cloudinary على Vercel أولًا.
- لو ظهر خطأ فهرس Firestore بعد إضافة limits مستقبلًا، اتبع رابط إنشاء الفهرس الذي يظهر في console.
