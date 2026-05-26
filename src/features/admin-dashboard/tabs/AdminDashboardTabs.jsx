import AdminDashboardTabsLegacy from './legacy/AdminDashboardTabsLegacy.jsx';

// Phase 6 boundary file.
// Active tab implementations are now organized under tabs/* for incremental extraction.
export default function AdminDashboardTabs(props) {
  return <AdminDashboardTabsLegacy {...props} />;
}
