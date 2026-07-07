# تحديث الواجهة العامة 2026

تم استبدال تصميم الصفحة الرئيسية وصفحات تسجيل الدخول وإنشاء الحساب بالكامل بتجربة جديدة.

## الملفات المعدلة

- `src/student/parts/LandingPage.jsx`
- `src/shared/platformParts/AuthPage.jsx`
- `src/pages/public/LoginPage.jsx`
- `src/pages/public/RegisterPage.jsx`
- `src/pages/LoginPage.jsx`
- `src/pages/RegisterPage.jsx`
- `src/pages/LandingPage.jsx`
- `src/styles/pages/landing.css`
- `src/styles/pages/auth.css`
- `src/shared/icons/lucide-shim.jsx`
- `src/student/app/StudentApp.jsx`
- `src/app/routing/appModes.js`

## ما تم تنفيذه

- تصميم جديد بالكامل للصفحة الرئيسية.
- تصميم جديد بالكامل لتسجيل الدخول وإنشاء الحساب.
- دعم الوضع الليلي والنهاري مع حفظ الاختيار في `localStorage`.
- خلفية متحركة بحروف عربية ناعمة.
- أنيميشن دخول سلس باستخدام `framer-motion`.
- تغيير الأيقونات المستخدمة في الواجهات العامة وإصلاح مسارات SVG المهمة داخل `lucide-shim`.
- فتح `/login` مباشرة على تسجيل الدخول.
- فتح `/register` مباشرة على إنشاء الحساب.
- الحفاظ على منطق Firebase/Auth/Firestore كما هو بدون كسر التدفق القديم.

## ملاحظة اختبار

لم يتم تشغيل build داخل هذه البيئة لأن `node_modules` غير موجودة، وده مقصود حسب طلب عدم تضمينها. عندك محليًا شغّل:

```bash
npm run build
npm run dev
```
