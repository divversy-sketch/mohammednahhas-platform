# Hotfix Runtime Errors

تم إصلاح الأخطاء الظاهرة في لوحة الأدمن وصفحة الطالب:

1. `Clock is not defined`
   - تم إضافة استيراد أيقونة `Clock` داخل:
   - `src/features/admin-dashboard/tabs/users/AdminAllUsersTab.jsx`

2. `growthTabs is not defined`
   - تم نقل/إضافة تعريف `growthTabs` والدوال المساعدة الخاصة بها داخل ملف الـ Growth Suite الفعلي:
   - `src/features/admin-dashboard/operations/legacy/AdminGrowthSuiteLegacy.jsx`
   - تمت إضافة: `statusLabel`, `toInputDate`, `parseCsvLine`, `excelDownload`

3. `useMemo(...) is not a function`
   - كان سببها استدعاء نتيجة `useMemo` كأنها دالة في:
   - `src/features/student-dashboard/hooks/useStudentVideoProgress.js`
   - تم تحويلها للصيغة الصحيحة مع dependencies.

4. متغيرات ناقصة في سياق صفحة الطالب
   - تم إرجاع `getStoredLocalVideoProgress` من hook الفيديو.
   - تم تعريف `weakBranches` من `smartWeakBranches` داخل:
   - `src/features/student-dashboard/shell/legacy/StudentDashboardLegacy.jsx`

تم اختبار المشروع بالأمر:

```bash
npm run build
```

والبناء تم بنجاح.
