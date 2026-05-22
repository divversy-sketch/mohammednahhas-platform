# UI Components Catalog

Use this catalog as the lightweight Storybook alternative until a full Storybook setup is added.

## Source of Truth

Shared visual primitives live in:

```text
src/ui
src/shared/ui
src/components/common
```

`src/components/common` should stay a compatibility/export layer. New reusable UI should be created in `src/ui` first.

## Required States for Reusable Components

Every reusable component should document or expose these states where relevant:

- Default
- Loading
- Disabled
- Empty
- Error
- Success
- Mobile layout

## Suggested Review Checklist

- Does the component receive data via props?
- Does it avoid direct Firebase/API calls?
- Does it avoid feature-specific text unless it lives inside that feature?
- Can it be reused by public/student/admin screens without side effects?
