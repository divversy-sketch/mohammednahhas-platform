import React from 'react';
import { InlineTabs } from '@shared/core/platformShared.jsx';
import { AdminReviewQuizPanel } from '@features/review/ReviewQuizSystem.jsx';
import AdminCommandCenter from '@admin/components/AdminCommandCenter.jsx';
import AdminStudentSuccessSuite from '@features/studentSuccess/StudentSuccessAdminSuite.jsx';
import { AdminGlobalSearch } from '@features/product/ProductExperienceSuite.jsx';
import LeaderboardPanel from '@features/leaderboard/components/LeaderboardPanel.jsx';
import { AdminPerformanceAnalytics, AdminProDashboard, AdminQuestionDeepAnalytics } from '@features/admin-dashboard/analytics';

export default function AdminDashboardOverviewTab({
  activeUsersList,
  examsList,
  contentList,
  assignments,
  examResults,
  messagesList,
  setActiveTab,
  assignmentSubmissions,
  videoViews,
  subscriptionCodes,
  hwResults,
  adminGradeFilter,
}) {
  return (
<InlineTabs
              defaultTab="overview"
              tabs={[
                { key: 'overview', label: 'متابعة اليوم', content: <div className="space-y-6"><AdminGlobalSearch users={activeUsersList} exams={examsList} content={contentList} assignments={assignments} examResults={examResults} supportTickets={messagesList} onNavigate={setActiveTab} /><AdminCommandCenter users={activeUsersList} exams={examsList} examResults={examResults} onNavigate={setActiveTab} /></div> },
                { key: 'success', label: 'خطط الطلاب', content: <AdminStudentSuccessSuite variant="dashboard" users={activeUsersList} exams={examsList} examResults={examResults} content={contentList} assignments={assignments} assignmentSubmissions={assignmentSubmissions} videoViews={videoViews} /> },
                { key: 'kpis', label: 'مؤشرات المنصة', content: <AdminProDashboard users={activeUsersList} exams={examsList} results={examResults} content={contentList} subscriptionCodes={subscriptionCodes} hwResults={hwResults} adminGradeFilter={adminGradeFilter} /> },
                { key: 'performance', label: 'تحليل الأداء', content: <AdminPerformanceAnalytics examResults={examResults} examsList={examsList} users={activeUsersList} adminGradeFilter={adminGradeFilter} /> },
                { key: 'questions', label: 'تحليل الأسئلة', content: <AdminQuestionDeepAnalytics examsList={examsList} examResults={examResults} /> },
                { key: 'leaderboard', label: 'لوحة الشرف', content: <LeaderboardPanel examResults={examResults} users={activeUsersList} gradeFilter={adminGradeFilter} /> },
                { key: 'review_quiz', label: 'أسئلة المراجعة', content: <AdminReviewQuizPanel /> }
              ]}
            />
  );
}
