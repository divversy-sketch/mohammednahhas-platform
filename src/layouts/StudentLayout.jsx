import AppErrorBoundary from '../student/parts/AppErrorBoundary.jsx';
import AppProviders from './AppProviders.jsx';
import PlatformPerformanceBooster from '../student/parts/PlatformPerformanceBooster.jsx';

export default function StudentLayout({ children, user }) {
  return (
    <AppErrorBoundary>
      <AppProviders user={user} performanceBooster={<PlatformPerformanceBooster />}>
        {children}
      </AppProviders>
    </AppErrorBoundary>
  );
}
