# New Feature Template

استخدم هذا الشكل لأي Feature جديدة:

```text
src/features/feature-name/
  components/
    FeatureCard.jsx
    FeatureTable.jsx
  hooks/
    useFeatureData.js
    useFeatureFilters.js
  services/
    featureService.js
  utils/
    featureFormatters.js
  constants/
    featureConfig.js
  index.js
```

## Checklist

- [ ] يوجد `index.js` يصدّر public API فقط.
- [ ] لا يوجد import من `admin/parts` أو `student/parts`.
- [ ] لا يوجد API logic داخل JSX كبير.
- [ ] UI المشترك من `@ui`.
- [ ] الملف الواحد أقل من 20KB قدر الإمكان.
