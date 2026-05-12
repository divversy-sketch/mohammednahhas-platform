# تحديث قواعد المالك بدون إيميل ثابت

تم تطبيق خطوة الأمان التالية بعد التأكد من وجود مستند المالك في Firestore.

## ما تم تعديله

- إزالة الاعتماد على الإيميل الثابت من `firestore.rules`.
- جعل مصدر صلاحية الأدمن هو مستند:

```txt
admins/{uid}
```

- اعتبار المستخدم Owner إذا كان مستنده يحتوي على:

```txt
active: true
role: "admin"
adminRole: "owner"
permissions: ["all"]
```

- تحديث `database.rules.json` لإزالة الإيميل الثابت أيضًا.

## تحذير مهم

قبل نشر `database.rules.json` على Realtime Database، تأكد أن لديك مستند/عقدة مقابلة داخل Realtime Database في:

```txt
admins/{uid}
```

بنفس القيم، لأن قواعد Realtime Database لا تستطيع قراءة مستندات Firestore.

إذا كنت لا تستخدم Realtime Database للإدارة، انشر Firestore rules فقط أولًا.

## أوامر النشر الآمنة

```bash
firebase deploy --only firestore:rules
```

ثم اختبر لوحة الأدمن.

بعد التأكد، يمكن نشر باقي القواعد حسب الاستخدام.
