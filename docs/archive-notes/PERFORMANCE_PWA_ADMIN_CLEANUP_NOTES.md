# تحديث تنظيف PWA ولوحة الأدمن

هذا التحديث لا يضيف مكونات مكررة. تم تحسين الموجود فقط:

- تعطيل Push Notifications مؤقتًا لمنع رسائل VAPID وتقليل تحميل firebase/messaging.
- الإبقاء على تنبيهات المنصة الداخلية عبر Firestore.
- تحسين manifest و service worker وصفحة offline بدون إضافة زر تثبيت جديد.
- تنظيف index.html من التسجيل المكرر للـ service worker؛ التسجيل الأساسي موجود في src/pwaUpdate.js.
- تحديث نصوص لوحة الأدمن الخاصة بالإشعارات لتوضح أنها داخل المنصة فقط.

## أوامر الرفع

```bash
npm run build
git add .
git commit -m "Clean PWA, pause push notifications, and optimize admin UX"
git push origin main
```
