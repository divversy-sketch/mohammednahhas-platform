# Student Dashboard Feature

هذه feature هي مكان تطوير تجربة الطالب بالكامل.

- `pages`: صفحة التجميع الرئيسية.
- `components`: أجزاء UI الخاصة بالطالب فقط.
- `hooks`: منطق الحالة، الأكشنات، والتعامل مع الفورمات.
- `services`: اشتراكات Firebase وعمليات البيانات.
- `selectors.js`: حسابات مشتقة pure functions بدون UI.

أي تعديل في لوحة الطالب يبدأ من هنا وليس من `src/student`؛ لأن `src/student` أصبح compatibility layer فقط.
