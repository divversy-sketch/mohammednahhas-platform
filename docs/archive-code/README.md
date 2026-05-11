# Archived code

This folder contains legacy duplicated files removed from the active `src` tree to reduce source bloat and avoid accidental imports.

Active entry points are now:

- `src/student/app/StudentApp.jsx`
- `src/admin/app/AdminApp.jsx`
- shared platform components under `src/shared/platformParts`

Do not import files from this archive back into production code. If a missing feature is discovered here, move only the needed component logic into the active split structure.
