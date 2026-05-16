import { NeonAdminCommandCenter } from '../../features/premium/NeonLearningOS.jsx';

export default function AdminCommandCenter({
  users = [],
  exams = [],
  examResults = [],
  paymentRequests = [],
  supportTickets = [],
  systemErrors = [],
  content = [],
  assignments = [],
  assignmentSubmissions = [],
  onNavigate,
}) {
  return (
    <NeonAdminCommandCenter
      users={users}
      exams={exams}
      examResults={examResults}
      paymentRequests={paymentRequests}
      supportTickets={supportTickets}
      systemErrors={systemErrors}
      content={content}
      assignments={assignments}
      assignmentSubmissions={assignmentSubmissions}
      onNavigate={onNavigate}
    />
  );
}
