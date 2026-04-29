# تقسيم App.jsx

تم تحويل `src/App.jsx` إلى ملف دخول صغير يقوم بتصدير التطبيق من `src/app/AppRoot.jsx`.

## الملفات التي تم فصلها في هذه المرحلة

- `src/app/AppRoot.jsx`: جسم التطبيق الرئيسي كما هو مع الحفاظ على السلوك.
- `src/shared/components/DesignSystemLoader.jsx`: تحميل الخطوط و Tailwind و CSS العام.
- `src/shared/constants/grades.jsx`: خيارات الصفوف وتسميات الصفوف.
- `src/shared/utils/phone.js`: دوال تنسيق والتحقق من أرقام الهاتف المصرية.

## الهدف

هذه مرحلة تقسيم آمنة تحافظ على البناء الحالي، وتجهز المشروع لنقل الداشبورد، الامتحانات، الفيديو، والرسائل إلى features مستقلة تدريجيًا بدون كسر build.
