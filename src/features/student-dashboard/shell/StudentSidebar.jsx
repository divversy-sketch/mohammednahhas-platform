import { StudentV2Sidebar } from '@features/student-dashboard/components/chrome/StudentV2Chrome.jsx';

export default function StudentSidebar({ ctx }) {
  return (
    <StudentV2Sidebar
      activeTab={ctx.activeTab}
      setActiveTab={ctx.setActiveTab}
      mobileMenu={ctx.mobileMenu}
      setMobileMenu={ctx.setMobileMenu}
      setLearningHubTab={ctx.setLearningHubTab}
      isBannedContent={ctx.isBannedContent}
      isBannedExam={ctx.isBannedExam}
      auth={ctx.studentAuth}
      studentName={ctx.userData?.name}
      isPremium={ctx.isPremium}
    />
  );
}
