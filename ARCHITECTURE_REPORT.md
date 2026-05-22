# Architecture Report

Generated: 2026-05-22T17:13:57.932Z

## Summary

- Source files scanned: 422
- Feature folders: 28
- Feature folders without index.js: 0
- Compatibility/legacy files remaining: 64
- Legacy import references found: 69

## Top files by size

| Size KB | File |
|---:|---|
| 26.5 | `src/features/courses/modules/AdminCoursesManager.jsx` |
| 24.4 | `src/features/student-dashboard/shell/legacy/StudentDashboardLegacy.jsx` |
| 23.3 | `src/features/admin-dashboard/operations/legacy/AdminGrowthSuiteLegacy.jsx` |
| 22.8 | `src/features/admin-dashboard/tabs/split/AdminExamResultsTab.jsx` |
| 21.4 | `src/features/exams/runner/legacy/ExamRunnerLegacy.jsx` |
| 21.1 | `src/features/admin-dashboard/tabs/split/AdminExamManageTab.jsx` |
| 21 | `src/features/admin-dashboard/operations/views/AdminGrowthSuiteLegacyView.jsx` |
| 20.8 | `src/features/product/ProductExperienceSuite.jsx` |
| 19.8 | `src/features/question-bank/components/QuestionBankManager.jsx` |
| 19.4 | `src/features/review/ReviewQuizSystem.jsx` |
| 19.2 | `src/features/admin-dashboard/tabs/split/AdminContentTab.jsx` |
| 19 | `src/features/courses/modules/StudentCoursesHub.jsx` |
| 18.9 | `src/features/admin-dashboard/controllers/useAdminDashboardController.jsx` |
| 18.1 | `src/features/studentSuccess/StudentSuccessAdminSuite.jsx` |
| 16.8 | `src/features/video-security/player/legacy/SecureVideoPlayerLegacy.jsx` |
| 15.6 | `src/features/admin-dashboard/tabs/split/AdminSubscriptionsLegacyTab.jsx` |
| 14.9 | `src/features/admin-dashboard/tabs/legacy/AdminDashboardTabsLegacy.jsx` |
| 14.6 | `src/features/exams/admin/editor/AdminFullExamEditorModal.jsx` |
| 14 | `src/features/admin-dashboard/tabs/users/AdminAllUsersTab.jsx` |
| 14 | `src/features/student-dashboard/shell/tabs/StudentExamsTab.jsx` |
| 13.7 | `src/shared/core/debugTools.jsx` |
| 13.4 | `src/features/admin-dashboard/controllers/actions/contentActions.jsx` |
| 13.2 | `src/features/student-dashboard/components/home/cards/StudentUnifiedHomeDashboard.jsx` |
| 13 | `src/features/admin-dashboard/analytics/AdminProDashboard.jsx` |
| 13 | `src/features/exams/components/ExamDashboardView.jsx` |
| 12.6 | `src/features/platformUpgrade/AdminPlatformUpgradeCenter.jsx` |
| 11.7 | `src/features/admin-dashboard/analytics/AdminPerformanceAnalytics.jsx` |
| 11.7 | `src/features/admin-dashboard/controllers/actions/examEditorActions.jsx` |
| 11.5 | `src/features/homework/AdminSmartHomeworkManager.jsx` |
| 11.5 | `src/features/student-dashboard/shell/tabs/StudentVideosTab.jsx` |

## Feature folders missing index.js

- None

## Legacy import references

- `src/admin/modals/AdminReviewExamOverlay.jsx` -> `../../shared/platformParts/ExamRunner.jsx`
- `src/features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx` -> `../../../../admin/parts/StudentAssignmentsPanel.jsx`
- `src/features/admin-dashboard/operations/AdminGrowthSuite.jsx` -> `./legacy/AdminGrowthSuiteLegacy.jsx`
- `src/features/admin-dashboard/pages/AdminDashboard.jsx` -> `./legacy/AdminDashboardLegacy.jsx`
- `src/features/admin-dashboard/tabs/AdminDashboardTabs.jsx` -> `./legacy/AdminDashboardTabsLegacy.jsx`
- `src/features/admin-dashboard/tabs/legacy/AdminDashboardTabsLegacy.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminAssignmentsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminAuditLogsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminContentTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminCoursesTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminDashboardTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminExamManageTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminExamResultsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminExamViewNavTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminFinanceDashboardTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminFollowUpTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminMessagesCenterTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminMistakesTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminNotificationsAdminTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminNotificationsGrowthTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminNotificationsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminPasswordResetsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminPaymentsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminPendingUsersTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminPlatformSettingsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminQuestionBankTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminRolesTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminSecurityCenterTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminSmartExamEngineTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminSmartHomeworkTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminStudentGroupsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminStudentReportsTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminSubscriptionsLegacyTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminUsersTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/admin-dashboard/tabs/split/AdminVideoSecurityTab.jsx` -> `@admin/parts/AdminOperationsSuite.jsx`
- `src/features/exams/runner/ExamRunner.jsx` -> `./legacy/ExamRunnerLegacy.jsx`
- `src/features/student-dashboard/shell/StudentDashboard.jsx` -> `./legacy/StudentDashboardLegacy.jsx`
- `src/features/student-dashboard/shell/legacy/StudentDashboardLegacy.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentAssignmentsTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentCoursesTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentExamsTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentFilesTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentHomeTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentHtmlsTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentInteractiveExamsTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentLearningPathTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentMessagesTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentMistakesBankTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentPerformanceTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentRemediationTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentReviewQuizTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentSettingsTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentSmartHomeworkResultsTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentSubscriptionTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentSupportTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/student-dashboard/shell/tabs/StudentVideosTab.jsx` -> `@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx`
- `src/features/video-security/player/SecureVideoPlayer.jsx` -> `./legacy/SecureVideoPlayerLegacy.jsx`
- `src/layouts/AdminLayout.jsx` -> `../admin/parts/AppErrorBoundary.jsx`
- `src/layouts/AdminLayout.jsx` -> `../admin/parts/PlatformPerformanceBooster.jsx`
- `src/layouts/PublicLayout.jsx` -> `../student/parts/AppErrorBoundary.jsx`
- `src/layouts/StudentLayout.jsx` -> `../student/parts/AppErrorBoundary.jsx`
- `src/layouts/StudentLayout.jsx` -> `../student/parts/PlatformPerformanceBooster.jsx`
- `src/pages/admin/AccessDeniedPage.jsx` -> `../../admin/parts/AdminAccessDenied.jsx`
- `src/pages/admin/DashboardPage.jsx` -> `../../admin/parts/AdminDashboard.jsx`
- `src/pages/admin/DashboardPage.jsx` -> `../../admin/parts/AdminDashboard.jsx`
- `src/pages/public/AuthPage.jsx` -> `../../shared/platformParts/AuthPage.jsx`
- `src/pages/public/LandingPage.jsx` -> `../../student/parts/LandingPage.jsx`
- `src/pages/student/DashboardPage.jsx` -> `../../student/parts/StudentDashboard.jsx`
- `src/pages/student/DashboardPage.jsx` -> `../../student/parts/StudentDashboard.jsx`

> ملاحظة: وجود wrappers قديمة مقبول مؤقتًا، لكن التطوير الجديد يجب أن يعتمد على `features` و`@ui`.
