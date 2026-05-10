# تحديث نظام الكورسات التعليمية

تمت إضافة نظام كورسات جديد مطابق للخريطة المتفق عليها:

- `courses`
- `courses/{courseId}/modules`
- `courses/{courseId}/modules/{moduleId}/lessons`
- `enrollments`
- `lessonProgress`
- `examResults`
- `lessonUnlockOverrides`

## المضاف

1. تبويب جديد في لوحة الأدمن: **الكورسات التعليمية**.
2. صفحة طالب جديدة: **الكورسات التعليمية**.
3. صورة لكل كورس عبر `coverImage`.
4. صورة/أيقونة لكل درس عبر `lessonImage` و `icon`.
5. فتح الدرس بعد الضغط على صورة الدرس، ثم عرض تبويبات:
   - شرح الدرس
   - ملف PDF
   - الامتحان
6. YouTube IFrame Player API لتتبع المشاهدة.
7. منع التقديم السريع anti-skip.
8. فتح الامتحان بعد مشاهدة 75% من الفيديو.
9. استثناء من الأدمن لطالب محدد عبر `lessonUnlockOverrides`.

## ملاحظة رفع الصور

الكود القديم للأسئلة المقالية لا يستخدم منصة رفع خارجية مجانية مثل Cloudinary أو ImgBB. الموجود حاليًا هو `FileReader.readAsDataURL`، يعني الصورة تتحول Base64 وتتحفظ داخل Firestore. لذلك استخدمت نفس الآلية في صور الكورس والدرس.

هذا حل سريع ومجاني، لكنه مناسب للصور الصغيرة فقط. للإنتاج الأفضل لاحقًا استخدام Firebase Storage أو Cloudinary.
