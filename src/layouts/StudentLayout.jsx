import AppErrorBoundary from '../shared/core/AppErrorBoundary.jsx';
import AppProviders from './AppProviders.jsx';
import PlatformPerformanceBooster from '../shared/core/PlatformPerformanceBooster.jsx';

export default function StudentLayout({ children, user }) {
  return (
    <AppErrorBoundary area="student">
      <AppProviders user={user} performanceBooster={<PlatformPerformanceBooster />}>
        {children}
      </AppProviders>
    </AppErrorBoundary>
  );
}
