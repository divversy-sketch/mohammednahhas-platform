# Final Architecture Summary

Generated: 2026-05-22T17:53:08.984Z

## Health Snapshot

- Source files scanned: 423
- Frozen legacy import count: 130
- Largest source file: 27123 bytes — src/features/courses/modules/AdminCoursesManager.jsx
- File hard limit used by guard: 30KB

## Largest Files

- 27123 bytes — `src/features/courses/modules/AdminCoursesManager.jsx`
- 24976 bytes — `src/features/student-dashboard/shell/legacy/StudentDashboardLegacy.jsx`
- 23837 bytes — `src/features/admin-dashboard/operations/legacy/AdminGrowthSuiteLegacy.jsx`
- 23310 bytes — `src/features/admin-dashboard/tabs/split/AdminExamResultsTab.jsx`
- 21901 bytes — `src/features/exams/runner/legacy/ExamRunnerLegacy.jsx`
- 21632 bytes — `src/features/admin-dashboard/tabs/split/AdminExamManageTab.jsx`
- 21515 bytes — `src/features/admin-dashboard/operations/views/AdminGrowthSuiteLegacyView.jsx`
- 21327 bytes — `src/features/product/ProductExperienceSuite.jsx`
- 20260 bytes — `src/features/question-bank/components/QuestionBankManager.jsx`
- 19818 bytes — `src/features/review/ReviewQuizSystem.jsx`
- 19662 bytes — `src/features/admin-dashboard/tabs/split/AdminContentTab.jsx`
- 19419 bytes — `src/features/courses/modules/StudentCoursesHub.jsx`
- 19377 bytes — `src/features/admin-dashboard/controllers/useAdminDashboardController.jsx`
- 18552 bytes — `src/features/studentSuccess/StudentSuccessAdminSuite.jsx`
- 17251 bytes — `src/features/video-security/player/legacy/SecureVideoPlayerLegacy.jsx`
- 15986 bytes — `src/features/admin-dashboard/tabs/split/AdminSubscriptionsLegacyTab.jsx`
- 15297 bytes — `src/features/admin-dashboard/tabs/legacy/AdminDashboardTabsLegacy.jsx`
- 14963 bytes — `src/features/exams/admin/editor/AdminFullExamEditorModal.jsx`
- 14322 bytes — `src/features/student-dashboard/shell/tabs/StudentExamsTab.jsx`
- 14285 bytes — `src/features/admin-dashboard/tabs/users/AdminAllUsersTab.jsx`
- 14071 bytes — `src/shared/core/debugTools.jsx`
- 13742 bytes — `src/features/admin-dashboard/controllers/actions/contentActions.jsx`
- 13473 bytes — `src/features/student-dashboard/components/home/cards/StudentUnifiedHomeDashboard.jsx`
- 13336 bytes — `src/features/exams/components/ExamDashboardView.jsx`
- 13275 bytes — `src/features/admin-dashboard/analytics/AdminProDashboard.jsx`

## Legacy Policy

Legacy imports are frozen by baseline. New work should reduce them, not increase them. Use feature barrels and aliases instead.

## Required Checks

Run before delivery:

```bash
npm run final:check
```
