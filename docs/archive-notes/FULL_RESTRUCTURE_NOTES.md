# Full restructure batch

تم تطبيق تقسيم إضافي آمن على النسخة المستقرة:

- `src/App.jsx` ملف دخول صغير.
- `src/app/AppRoot.jsx` ما زال هو الجذر الرئيسي، لكن تم نقل مكونات كبيرة خارجه.
- `src/features/home/HomeWidgets.jsx` لمكونات الصفحة الرئيسية والمساعد.
- `src/features/study/PomodoroFocusMode.jsx` لوضع التركيز.
- `src/features/content/InteractiveViewer.jsx` لعارض المحتوى التفاعلي.
- `src/features/homework/SmartHomeworkScanner.jsx` لتسليم/تصحيح الواجب الذكي.

الهدف من هذه الدفعة: تقليل حجم `AppRoot.jsx` بشكل واضح بدون تغيير السلوك.
