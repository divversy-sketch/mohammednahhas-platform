# Nahhas App.jsx Split - V1

## What changed

- `src/App.jsx` is now a tiny entry file that exports `src/app/AppRoot.jsx`.
- The previous large application body was moved to `src/app/AppRoot.jsx`.
- Extracted safe independent pieces:
  - `src/shared/components/DesignSystemLoader.jsx`
  - `src/shared/constants/grades.jsx`
  - `src/shared/utils/phone.js`
- Added architecture notes in `src/app/architecture.md`.

## Important

This is the first safe split of `App.jsx`. It avoids changing feature behavior and prepares the app for the next splits: admin, student, exams, lectures, messaging.
