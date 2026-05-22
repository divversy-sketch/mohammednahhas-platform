import AppLoadingScreen from '@shared/ui/AppLoadingScreen.jsx';
import { useStudentPortalGate } from '../hooks/useStudentPortalGate.js';
import StudentMaintenanceScreen from './StudentMaintenanceScreen.jsx';

export default function StudentPortalGate({ user, children }) {
  const { gate, loading, shouldBlockStudent } = useStudentPortalGate(user);

  if (loading) {
    return (
      <AppLoadingScreen
        title="منصة النحاس التعليمية"
        message="جاري التحقق من حالة فتح منصة الطالب..."
        variant="student"
      />
    );
  }

  if (shouldBlockStudent) {
    return <StudentMaintenanceScreen gate={gate} user={user} />;
  }

  return children;
}
