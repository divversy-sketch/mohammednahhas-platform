# تطوير نظام الواجب الذكي QR

تم تنفيذ تطوير شامل لنظام الواجب QR:

- نقل تصحيح الواجب إلى Cloud Function باسم `correctSmartHomework` بدل التصحيح من المتصفح.
- إزالة اعتماد الطالب على `VITE_GEMINI_API_KEY`، وبذلك لا يظهر مفتاح Gemini داخل ملفات الواجهة.
- حفظ نموذج الإجابة في مسار خاص:
  `smart_homeworks/{homeworkId}/private/answerKey`
- إبقاء بيانات الواجب العامة فقط في `smart_homeworks` حتى يقرأها الطالب بدون نموذج الإجابة.
- تعديل Firestore Rules بحيث لا يستطيع الطالب إنشاء نتائج QR مباشرة من المتصفح.
- حفظ نتائج الواجب في document ثابت:
  `homework_results/{homeworkId}_{studentId}`
- إضافة نظام محاولات، ومنع التكرار حسب `maxAttempts` إلا إذا كان `allowResubmit` مفعّلًا.
- إضافة إعدادات: بداية الإتاحة، نهاية الإتاحة، عدد المحاولات، إظهار/إخفاء النتيجة، إظهار/إخفاء التعليق.
- توليد QR داخل لوحة الأدمن، مع زر نسخ الرابط وزر تحميل QR.
- حذف واجب QR يحذف الواجب ونتائجه ومفتاح الإجابة الخاص به.
- إدخال أخطاء الطالب تلقائيًا في `student_mistakes` من نتائج الأسئلة الخاطئة.
- ضغط الصورة من واجهة الطالب قبل إرسالها للـ Cloud Function لتقليل الحجم.
- إصلاح ظهور ماسح واجب QR داخل لوحة الطالب بعد قراءة `?hw=HOMEWORK_ID`.

## مهم قبل التشغيل

اضبط مفتاح Gemini للـ Cloud Functions بإحدى الطريقتين:

```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
firebase deploy --only functions,firestore:rules,hosting
```

أو لو تستخدم متغيرات بيئة في Functions Gen/Node:

```bash
firebase deploy --only functions,firestore:rules,hosting
```

مع وجود `GEMINI_API_KEY` في بيئة النشر.

## ملاحظة على الواجبات القديمة

الواجبات القديمة التي كان فيها `answerKey` داخل document العام ستظل تعمل لأن الـ Cloud Function بها fallback. لكن الأفضل إعادة إنشاء الواجبات القديمة من لوحة الأدمن الجديدة حتى ينتقل نموذج الإجابة للمسار الخاص.
