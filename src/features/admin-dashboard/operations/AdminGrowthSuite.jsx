import { AdminGrowthSuite as AdminGrowthSuiteLegacy } from './legacy/AdminGrowthSuiteLegacy.jsx';

// Phase 6 boundary file for Growth operations.
export function AdminGrowthSuite(props) {
  return <AdminGrowthSuiteLegacy {...props} />;
}

export default AdminGrowthSuite;
export { AdminGrowthSuiteLegacy };
