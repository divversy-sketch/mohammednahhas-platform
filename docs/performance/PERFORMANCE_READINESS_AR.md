# جاهزية الأداء

## الموجود الآن

- `vite` مقسم vendor chunks لـ React/Firebase/UI/PDF.
- `npm run performance:budget` يفحص أحجام مخرجات `dist/assets` بعد البناء.
- التقرير يكتب في:
  `docs/performance/BUNDLE_BUDGET_REPORT.md`

## الميزانيات الحالية

- أكبر JS chunk: 450KB.
- أكبر CSS chunk: 150KB.
- PDF worker: 1500KB.
- إجمالي assets: 3200KB.

أي تجاوز يعني أن Feature جديدة غالبًا دخلت بدون lazy loading أو استوردت مكتبة كبيرة مباشرة.
