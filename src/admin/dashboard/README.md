# Admin Dashboard Split

تم نقل الأجزاء القابلة للعزل إلى ملفات منفصلة تدريجيًا بدون تغيير سلوك لوحة الإدارة:

- `AdminLazyFallback.jsx`: شاشة تحميل موحدة للـ lazy sections.
- `../components/AdminHeader.jsx`: الهيدر.
- `../components/AdminSidebar.jsx`: القائمة الجانبية.
- `../parts/AdminDashboardTabs.jsx`: تبويبات الإدارة.
- `../parts/AdminDashboardModals.jsx`: المودالات.

الملف الرئيسي بقي orchestration layer فقط قدر الإمكان، مع بقاء بعض handlers داخله لتجنب كسر التدفقات القديمة.
