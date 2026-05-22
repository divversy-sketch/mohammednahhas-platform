# Import Rules

## Aliases المعتمدة

```js
@app
@layouts
@pages
@components
@features
@shared
@services
@config
@styles
@ui
@admin       // compatibility فقط
@core
@hooks
@utils
@assets
```

## قواعد الاستيراد

- استخدم `@ui` لكل Button/Card/Modal/Table/Empty/Loading.
- استخدم `@features/<feature>` للوصول للـ public API الخاص بالـ feature.
- لا تستورد ملفات داخل `legacy` في تطوير جديد.
- لا تضف ملفات جديدة داخل `src/admin/parts` أو `src/student/parts`.
- لا تنشئ Button/Card/Modal جديدة داخل Feature.

## أمثلة صحيحة

```js
import { Button, Card } from '@ui';
import { PaymentRequestStudentPanel } from '@features/payments';
```

## أمثلة ممنوعة في التطوير الجديد

```js
import Something from '../../admin/parts/Something.jsx';
import Button from '../someFeature/Button.jsx';
import BigLegacyThing from '@features/admin-dashboard/legacy/BigLegacyThing.jsx';
```
