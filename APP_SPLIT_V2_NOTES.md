# App Split V2 - files only

استبدل/أضف الملفات بنفس المسارات داخل مشروعك:

- `src/app/AppRoot.jsx`
- `src/features/messages/StudentMessages.jsx`

ما تم:
- فصل مكونات رسائل الطلاب من AppRoot.
- نقل AdminStudentMessaging و StudentMessagesPanel و StudentAdminMessagePopup إلى feature مستقل.
- تقليل AppRoot بحوالي 300 سطر بدون تغيير السلوك.

بعد النسخ شغل:

```bash
npm run build
```
