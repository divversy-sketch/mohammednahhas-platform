# Feature Guide

## إضافة Feature جديدة

1. انسخ القالب من:

```text
src/features/_template
```

2. غيّر الاسم والمخرجات العامة في `index.js`.
3. ضع منطق API داخل `services`.
4. ضع الـ state orchestration داخل `hooks`.
5. ضع UI الصغيرة داخل `components`.
6. لا تستورد من Feature أخرى من ملفات داخلية. استخدم `@features/<name>` أو `@features/<name>/index.js`.

## مثال

```text
features/reports/
  components/ReportsTable.jsx
  hooks/useReportsFilters.js
  services/reportsService.js
  utils/reportFormatters.js
  constants/reportTabs.js
  index.js
```

## متى نستخدم shared؟

استخدم `shared` فقط للكود العام جدًا الذي لا ينتمي لدومين محدد، مثل:

- formatters عامة
- constants عامة
- notification helpers عامة
- hooks عامة لا تعرف شيئًا عن الطالب أو الأدمن
