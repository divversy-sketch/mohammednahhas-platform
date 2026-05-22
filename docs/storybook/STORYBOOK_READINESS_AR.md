# جاهزية Storybook

تم إضافة Storybook-ready stories داخل:

```text
src/ui/components/__stories__
```

الأمر الحالي:

```bash
npm run storybook:check
```

يتأكد أن ملفات القصص موجودة وصالحة كبداية. لم يتم إضافة حزم Storybook نفسها حتى لا نكبر المشروع أو نضيف dependencies ثقيلة بدون قرار من الفريق.

لو حبيت تشغيل Storybook فعليًا لاحقًا:

```bash
npx storybook@latest init
npm run storybook
```

بعدها استخدم نفس ملفات القصص الموجودة كنقطة بداية.
