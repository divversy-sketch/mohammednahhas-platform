# Nahhas Pro architecture

This version keeps the legacy `App.jsx` working while moving high-risk UI pieces into feature modules.

## Active feature modules

- `features/lectures/` lecture player, zoom/cinema controls, watermark motion, video performance CSS.
- `features/student/` mobile bottom navigation and student-facing shell components.
- `features/messaging/` reserved for desktop-only messaging UI.
- `features/exams/` reserved for exam runner/review components.
- `features/admin/` reserved for admin dashboard sections.
- `shared/` cross-feature utilities and visual helpers.

## Migration rule

Do not add new large JSX blocks directly into `App.jsx`. Add the feature under `src/features/<domain>` and only wire it from `App.jsx`.
