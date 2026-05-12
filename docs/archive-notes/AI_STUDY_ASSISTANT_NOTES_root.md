# AI Study Assistant Patch

هذا التحديث يضيف مساعد دراسي ذكي للطالب بدون مكتبات جديدة وبدون إعادة تفعيل الإشعارات.

الملفات داخل الحزمة:
- src/app/AppRoot.jsx
- src/shared/constants/navigation.js
- src/features/student/MobileStudentBottomNav.jsx
- باقي src كاملة لتجنب نقص الملفات

ما تم:
- إضافة تبويب/زر "المساعد الدراسي".
- إضافة كارت دخول للمساعد في الصفحة الرئيسية.
- إضافة مساعد شات يعتمد على /api/ai-coach.
- إضافة fallback محلي لو AI عليه ضغط أو المفتاح غير متاح.
- إضافة أسئلة سريعة: خطة مذاكرة، نقاط الضعف، تحسين النتيجة، سبب الأخطاء.

بعد الفك:
npm run build
git add .
git commit -m "Add AI study assistant for students"
git push origin main
