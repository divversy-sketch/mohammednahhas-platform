# تقرير الفصل الشامل للـ Frontend Architecture — Phase 3

تم تنفيذ فصل إضافي أعمق على نسخة Phase 2 بحيث يصبح التعامل مع المشروع أسهل عند تطوير جزء محدد بدون لمس باقي المنصة.

## 1) مبدأ الفصل الجديد

- الصفحة لم تعد المكان الوحيد الذي يحمل المنطق والـ UI والـ side effects معًا.
- تم نقل منطق الطالب إلى feature مستقلة باسم `student-dashboard`.
- تم تحويل الملفات القديمة إلى wrappers فقط للحفاظ على التوافق مع أي imports قديمة.
- تم توحيد مصدر الـ UI Components بحيث يكون `src/ui/components` هو المصدر الأساسي، و `src/components/common` مجرد re-export حتى لا يبقى عندنا نسختين فعليتين من نفس الزر/الكارت/المودال.

## 2) فصل لوحة الطالب بالكامل داخل Feature مستقلة

تم إنشاء:

```text
src/features/student-dashboard/
  pages/
    StudentDashboardPage.jsx
  hooks/
    useStudentDashboardData.js
    useStudentSubscriptionActions.js
    useStudentPaymentActions.js
    useStudentSupportActions.js
    useStudentProfileActions.js
    useBrowserBackTab.js
  services/
    studentDashboard.listeners.js
  selectors.js
  components/
    PerformanceOverview.jsx
    chrome/
      StudentV2Chrome.jsx
    dashboard/
      StudentDailyCommandCenter.jsx
    home/
      StudentHomeCards.jsx
    layout/
      StudentLayoutParts.jsx
```

وبذلك أي تعديل في لوحة الطالب له مكان واضح:

- تعديل بيانات الطالب: `useStudentProfileActions.js`
- طلبات الدفع: `useStudentPaymentActions.js`
- تذاكر الدعم: `useStudentSupportActions.js`
- أكواد الاشتراك: `useStudentSubscriptionActions.js`
- اشتراكات Firebase الخاصة بلوحة الطالب: `services/studentDashboard.listeners.js`
- الحسابات المشتقة مثل تقسيم المحتوى ومتوسط الأداء: `selectors.js`

## 3) فصل منطق الطالب عن التصميم

تم إخراج المنطق التالي من ملف واجهة الطالب:

- شحن كود الاشتراك.
- إرسال طلب دفع.
- إرسال تذكرة دعم.
- تحديث بيانات الطالب.
- منطق زر الرجوع في المتصفح.
- تقسيم المحتوى إلى فيديوهات/ملفات/HTML/امتحانات تفاعلية.
- حساب ملخص الواجبات.
- حساب متوسط الأداء.
- حساب تقدم الفيديوهات.
- حساب الأيام المتبقية للاشتراك.
- استخراج نقاط الضعف من نتائج الامتحانات.

## 4) فصل منطق دخول الامتحان

تم إنشاء:

```text
src/features/exams/utils/studentExamAccess.js
```

ويحتوي على:

```text
resolveStudentExamAccessState
```

المسؤول عن قواعد فتح/قفل الامتحان حسب:

- الامتحان المطلوب السابق.
- نسبة النجاح المطلوبة.
- أفضل محاولة سابقة.
- استثناءات الأدمن.

وبذلك تعديل قواعد فتح امتحان لن يحتاج تعديل تصميم لوحة الطالب.

## 5) توحيد الـ UI Components

تم توحيد المصدر الأساسي للمكونات المشتركة هنا:

```text
src/ui/components/
```

والملفات التالية في `src/components/common` أصبحت re-export فقط:

- Button
- Card
- Modal
- ConfirmDialog
- TableShell
- StatusBadge
- EmptyState
- SkeletonBlock
- SearchInput
- FilterSelect
- FormField
- DataToolbar
- PaginationBar
- ResponsiveDataCards
- MetricCard
- ActionMenu
- MobileQuickActions

كده لو غيرنا شكل `Button` أو `Card` التغيير يطبق على المنصة كلها من مكان واحد، مش لفّة على الصفحات وكأننا بندوّر على ريموت التكييف.

## 6) الحفاظ على التوافق القديم

تم ترك wrappers في المسارات القديمة مثل:

```text
src/student/parts/StudentDashboard.jsx
src/student/hooks/useStudentDashboardData.js
src/student/services/studentDashboard.listeners.js
src/student/components/home/StudentHomeCards.jsx
src/student/components/layout/StudentLayoutParts.jsx
src/student/v2/StudentV2Chrome.jsx
```

هذه الملفات لا تحمل منطقًا جديدًا، فقط تعيد التصدير من feature الجديدة.

الغرض: أي import قديم لن ينكسر الآن، ومع الوقت يمكن تحويل imports تدريجيًا للمسارات الجديدة.

## 7) تحسين الـ aliases

تم التأكد من دعم alias جديد:

```text
@config/*
```

بجانب aliases الموجودة:

```text
@app/*
@layouts/*
@pages/*
@components/*
@features/*
@shared/*
@services/*
@styles/*
@ui/*
```

## 8) فصل عام للـ Browser Tab History

تم إنشاء hook مشترك:

```text
src/shared/hooks/useBrowserBackTab.js
```

ويستخدم الآن في:

- الطالب.
- الأدمن.

بدل تكرار نفس useEffect في أكثر من مكان.

## 9) اختبارات التشغيل

تم تشغيل:

```bash
npm run build
npm run source:health
```

والنتيجة:

```text
Build: Passed
Source health: Passed
```

## 10) أين أطور كل جزء؟

| الجزء | المكان |
|---|---|
| لوحة الطالب | `src/features/student-dashboard` |
| الدفع | `src/features/payments` |
| الاشتراكات والأكواد | `src/features/subscriptions` |
| الدعم | `src/features/support` |
| الطلاب وبيانات الطالب | `src/features/students` |
| قواعد فتح الامتحانات | `src/features/exams/utils/studentExamAccess.js` |
| UI مشترك | `src/ui/components` |
| Layouts | `src/layouts` |
| الصفحات حسب الدور | `src/pages/public`, `src/pages/student`, `src/pages/admin` |
| Hooks مشتركة | `src/shared/hooks` |
| Firebase services عامة | `src/services` |

## 11) توصية المرحلة التالية

الملفان الأكبر المتبقيان هما:

```text
src/admin/parts/AdminDashboard.jsx
src/admin/parts/AdminDashboardTabs.jsx
```

تم بالفعل فصل جزء من منطق الرجوع للأدمن، لكن لو أردنا فصلًا أكثر صرامة للأدمن في مرحلة لاحقة، الأفضل تقسيمه إلى workspaces:

```text
src/features/admin-dashboard/
  users/
  payments/
  content/
  exams/
  reports/
  settings/
```

مع نقل كل handlers الخاصة بالأدمن إلى services/use-cases مستقلة. لم يتم تفتيت كل JSX للأدمن في هذه المرحلة لتقليل خطر كسر لوحة الإدارة الكبيرة، لكن البنية أصبحت جاهزة لذلك.
