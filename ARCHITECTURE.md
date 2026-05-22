# Frontend Architecture

هذه النسخة تعتمد هيكلة Feature-Based Modular Architecture.

## الطبقات الأساسية

```text
src/
  app/                 # app bootstrap + routing modes
  layouts/             # layouts حسب نوع المستخدم
  pages/               # page entries فقط
  features/            # كل domain مستقل
  ui/                  # المصدر الواحد للـ UI primitives
  shared/              # utilities/constants/hook عامة جدًا
  services/            # تكاملات عامة مثل Firebase/Cloudinary
```

## قاعدة مهمة

الصفحة لا تحمل منطق طويل. الصفحة تركّب Layout + Feature Page/Shell فقط.

```jsx
// صحيح
import { StudentDashboardShell } from '@features/student-dashboard';

export default function StudentDashboardPage(props) {
  return <StudentDashboardShell {...props} />;
}
```

```jsx
// ممنوع في التطوير الجديد
// صفحة فيها fetch + filters + state + modals + UI كبير في ملف واحد
```

## حدود الـ Feature

كل Feature تملك ملفاتها:

```text
features/payments/
  components/
  hooks/
  services/
  utils/
  constants/
  index.js
```

ويتم الاستيراد من `index.js` عندما يكون الاستيراد من خارج الـ feature.

## وضع Legacy

المسارات القديمة مثل `src/admin`, `src/student`, `src/shared/platformParts` متروكة كـ compatibility wrappers فقط. التطوير الجديد لا يضيف ملفات فيها.
