# Student Home Cleanup Patch

التحديث ينظف صفحة الطالب بدون إضافة Features مكررة:

- دمج كارت الاستكمال مع خطة اليوم في لوحة واحدة.
- إزالة كارت تنبيهات Push/VAPID من صفحة الطالب.
- إزالة تكرار أزرار الاستكمال.
- إزالة تكرار كروت المحاضرات/الملفات/الامتحانات من أسفل الصفحة.
- تثبيت مربع الحكمة داخل أول لوحة فقط كعنصر ثابت غير متحرك.
- الحفاظ على التصميم العام والهوية البصرية.

بعد الفك:

```bash
npm run build
git add .
git commit -m "Clean student dashboard duplicates and simplify home"
git push origin main
```
