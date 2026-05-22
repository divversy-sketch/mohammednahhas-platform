import AppErrorBoundary from '../student/parts/AppErrorBoundary.jsx';

export default function PublicLayout({ children }) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
