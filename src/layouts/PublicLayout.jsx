import AppErrorBoundary from '../shared/core/AppErrorBoundary.jsx';

export default function PublicLayout({ children }) {
  return <AppErrorBoundary area="public">{children}</AppErrorBoundary>;
}
