# إصلاح تجربة التنقل V2

## المشكلة
- القائمة الجانبية كانت طويلة ومزعجة، وتحتاج نزول/سحب عشان الوصول للأقسام.
- في واجهة الطالب كان فيه جزء من الناحية اليمنى غير واضح بسبب الـ fixed sidebar ومساحة `padding-right` كبيرة.

## الحل
- تحويل تنقل الأدمن إلى شريط أوامر علوي Sticky داخل الصفحة بدل Sidebar جانبي.
- تحويل تنقل الطالب إلى شريط أقسام علوي Sticky بدل Sidebar ثابت على اليمين.
- إزالة مساحة `md:pr-[21rem]` من محتوى الطالب حتى لا يظهر جزء مقطوع من اليمين.
- إضافة تمرير أفقي خفيف للأقسام على الشاشات الصغيرة، ولفّ تلقائي للأزرار على الشاشات الكبيرة.
- منع أي overflow أفقي عام من `html/body/#root`.

## الملفات المعدلة
- `src/admin/components/AdminSidebar.jsx`
- `src/admin/parts/AdminDashboard.jsx`
- `src/student/v2/StudentV2Chrome.jsx`
- `src/student/parts/StudentDashboard.jsx`
- `src/styles/v2-redesign.css`
- `.npmrc`

## ملاحظات
لم يتم تعديل Firebase أو Cloudinary أو الصلاحيات أو منطق البيانات.
