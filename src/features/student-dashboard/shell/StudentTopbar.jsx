import { StudentV2Topbar } from '@features/student-dashboard/components/chrome/StudentV2Chrome.jsx';

export default function StudentTopbar({ ctx }) {
  return (
    <StudentV2Topbar
      installPrompt={ctx.installPrompt}
      setShowFocusMode={ctx.setShowFocusMode}
      setShowNotifications={ctx.setShowNotifications}
      unseenNotificationCount={ctx.unseenNotificationCount}
      isPremium={ctx.isPremium}
      subscriptionExpiry={ctx.userData?.subscriptionExpiry}
      setMobileMenu={ctx.setMobileMenu}
    />
  );
}
