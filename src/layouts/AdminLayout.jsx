import AppErrorBoundary from '../shared/core/AppErrorBoundary.jsx';
import AppProviders from './AppProviders.jsx';
import PlatformPerformanceBooster from '../shared/core/PlatformPerformanceBooster.jsx';

export default function AdminLayout({ children, user }) {
  return (
    <AppErrorBoundary area="admin">
      <AppProviders user={user} performanceBooster={<PlatformPerformanceBooster />}>
        {children}
      </AppProviders>
    </AppErrorBoundary>
  );
}
