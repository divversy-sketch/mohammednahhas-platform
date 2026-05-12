# رفيقك في العربي - المرحلة الأولى

تم تنفيذ:
- تغيير فكرة المساعد إلى: رفيقك في العربي.
- لوحة أدمن لإضافة شرح المستر داخل `lesson_explanations`.
- رفع أسئلة كثيرة مرة واحدة من CSV داخل `rafiq_question_bank`.
- واجهة طالب تسأل من شرح المستر فقط.
- لو المعلومة غير موجودة، يتم تسجيل السؤال في `rafiq_unanswered_questions`.
- اختبار سريع بعد الشرح من الأسئلة المرفوعة المرتبطة بالنقطة.

تنسيق CSV المقترح:

```csv
grade,lesson,branch,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,tags
1sec,النعت,نحو,"حدد النعت في الجملة","الطالب","المجتهد","في","الفصل",B,"النعت يصف المنعوت",easy,"نعت,منعوت"
```

أوامر الرفع:

```bash
npm run build
git add .
git commit -m "Add Rafiq Arabic lesson assistant phase 1"
git push origin main
```
