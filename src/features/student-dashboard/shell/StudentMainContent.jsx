import StudentHomeTab from './tabs/StudentHomeTab.jsx';
import StudentPerformanceTab from './tabs/StudentPerformanceTab.jsx';
import StudentSubscriptionTab from './tabs/StudentSubscriptionTab.jsx';
import StudentMistakesBankTab from './tabs/StudentMistakesBankTab.jsx';
import StudentCoursesTab from './tabs/StudentCoursesTab.jsx';
import StudentReviewQuizTab from './tabs/StudentReviewQuizTab.jsx';
import StudentLearningPathTab from './tabs/StudentLearningPathTab.jsx';
import StudentRemediationTab from './tabs/StudentRemediationTab.jsx';
import StudentMessagesTab from './tabs/StudentMessagesTab.jsx';
import StudentSupportTab from './tabs/StudentSupportTab.jsx';
import StudentVideosTab from './tabs/StudentVideosTab.jsx';
import StudentFilesTab from './tabs/StudentFilesTab.jsx';
import StudentHtmlsTab from './tabs/StudentHtmlsTab.jsx';
import StudentInteractiveExamsTab from './tabs/StudentInteractiveExamsTab.jsx';
import StudentExamsTab from './tabs/StudentExamsTab.jsx';
import StudentAssignmentsTab from './tabs/StudentAssignmentsTab.jsx';
import StudentSmartHomeworkResultsTab from './tabs/StudentSmartHomeworkResultsTab.jsx';
import StudentSettingsTab from './tabs/StudentSettingsTab.jsx';

export default function StudentMainContent({ ctx }) {
  return (
    <div className="nh-page-body">
      <StudentHomeTab ctx={ctx} />
      <StudentPerformanceTab ctx={ctx} />
      <StudentSubscriptionTab ctx={ctx} />
      <StudentMistakesBankTab ctx={ctx} />
      <StudentCoursesTab ctx={ctx} />
      <StudentReviewQuizTab ctx={ctx} />
      <StudentLearningPathTab ctx={ctx} />
      <StudentRemediationTab ctx={ctx} />
      <StudentMessagesTab ctx={ctx} />
      <StudentSupportTab ctx={ctx} />
      <StudentVideosTab ctx={ctx} />
      <StudentFilesTab ctx={ctx} />
      <StudentHtmlsTab ctx={ctx} />
      <StudentInteractiveExamsTab ctx={ctx} />
      <StudentExamsTab ctx={ctx} />
      <StudentAssignmentsTab ctx={ctx} />
      <StudentSmartHomeworkResultsTab ctx={ctx} />
      <StudentSettingsTab ctx={ctx} />
    </div>
  );
}
