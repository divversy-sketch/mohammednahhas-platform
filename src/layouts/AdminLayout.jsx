import AppErrorBoundary from '../admin/parts/AppErrorBoundary.jsx';
import AppProviders from './AppProviders.jsx';
import PlatformPerformanceBooster from '../admin/parts/PlatformPerformanceBooster.jsx';

export default function AdminLayout({ children, user }) {
  return (
    <AppErrorBoundary>
      <AppProviders user={user} performanceBooster={<PlatformPerformanceBooster />}>
        {children}
      </AppProviders>
    </AppErrorBoundary>
  );
}
