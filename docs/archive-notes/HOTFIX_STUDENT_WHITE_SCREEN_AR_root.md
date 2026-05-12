# Hotfix شاشة الطالب البيضاء

تم إصلاح خطأ:

```txt
Uncaught ReferenceError: AppErrorBoundary is not defined
```

السبب: أثناء فصل كود الإدارة والطالب، ظل `StudentApp.jsx` يستخدم مكون `AppErrorBoundary` بدون تعريفه داخل ملف الطالب.

الإصلاح:
- إضافة `AppErrorBoundary` داخل `src/student/app/StudentApp.jsx`.
- إعادة تشغيل `npm run build` بنجاح.
- إنتاج نسخة `dist` جديدة.

أوامر النشر المقترحة:

```bash
npm install
npm run build
git add .
git commit -m "Fix student white screen after app split"
git push origin main
```
