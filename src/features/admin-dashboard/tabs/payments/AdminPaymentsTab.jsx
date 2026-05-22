import AdminPaymentRequestsPanel from '@features/payments/admin/AdminPaymentRequestsPanel.jsx';
import SmartSubscriptionManager from '@features/subscriptions/admin/SmartSubscriptionManager.jsx';
import AdminGrowthSuite from '../../operations/AdminGrowthSuite.jsx';

export default function AdminPaymentsTab({ ctx }) {
  return (
    <div className="space-y-6">
      <AdminPaymentRequestsPanel users={ctx.activeUsersList} />
      <SmartSubscriptionManager users={ctx.activeUsersList} adminGradeFilter={ctx.adminGradeFilter} />
      <AdminGrowthSuite
        initialTab="payments"
        compact
        users={ctx.activeUsersList}
        exams={ctx.examsList}
        examResults={ctx.examResults}
        content={ctx.contentList}
        assignments={ctx.assignments}
        assignmentSubmissions={ctx.assignmentSubmissions}
        subscriptionCodes={ctx.subscriptionCodes}
        notifications={ctx.announcements}
        userData={ctx.userData}
      />
    </div>
  );
}
