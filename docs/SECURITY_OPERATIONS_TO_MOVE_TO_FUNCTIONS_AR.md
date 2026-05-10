# العمليات التي يفضّل نقلها إلى Cloud Functions

هذه العمليات حساسة، والأفضل أن تنفذ من الخادم بدل المتصفح:

- حذف طالب بالكامل.
- تعطيل أو تفعيل طالب.
- حذف امتحان.
- إنشاء كود اشتراك.
- اعتماد طلب دفع أو اشتراك.
- تعديل درجات نهائية.

تمت إضافة دوال Callable مبدئية في `functions/index.js`:

- `deleteStudentAccount`
- `setStudentStatus`
- `createSubscriptionCode`
- `approvePaymentRequest`
- `deleteExam`

كل دالة تفحص أن صاحب الطلب أدمن من Firestore قبل التنفيذ من خلال:

```txt
admins/{uid}
active = true
role = admin
```

الخطوة القادمة عند الحاجة: تعديل أزرار لوحة الإدارة لتستدعي هذه الدوال بدل تنفيذ الحذف/التعديل مباشرة من الواجهة.
