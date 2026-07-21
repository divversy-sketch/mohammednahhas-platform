# المرحلة الثالثة: تطبيق الهاتف والحماية والعمل دون إنترنت

تم تجهيز المشروع ليعمل كتطبيق Capacitor مع طبقة حماية أصلية وقائمة مزامنة Offline.

## تجهيز التطبيق لأول مرة

```bash
npm install
npm install @capacitor/android @capacitor/ios @capacitor/app @capacitor/network @capacitor/preferences
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

بعد إنشاء مجلد Android، انقل `ScreenShieldPlugin.java` إلى نفس الحزمة وسجله في `MainActivity` إذا لم يلتقطه Capacitor تلقائيًا. وفي iOS أضف ملف Swift إلى Target التطبيق.

## ما تم تنفيذه

- تفعيل `FLAG_SECURE` في Android لمنع Screenshot وScreen Recording داخل التطبيق.
- طبقة خصوصية عند انتقال التطبيق للخلفية.
- Web fallback صريح لا يدعي منع التصوير داخل المتصفح.
- قاعدة IndexedDB لحفظ العمليات أثناء انقطاع الإنترنت.
- شريط حالة اتصال ومزامنة على الموقع والتطبيق.
- تجهيز أوامر بناء Android وiOS في `package.json`.

## ملاحظة أمنية

الحماية الكاملة من تصوير الشاشة متاحة داخل التطبيق الأصلي فقط. المتصفح لا يسمح بمنع Screenshot بصورة مضمونة.
