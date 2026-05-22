import { AdminGrowthSuite as AdminGrowthSuiteRuntime } from './runtime/AdminGrowthSuiteRuntime.jsx';

// Phase 6 boundary file for Growth operations.
export function AdminGrowthSuite(props) {
  return <AdminGrowthSuiteRuntime {...props} />;
}

export default AdminGrowthSuite;
export { AdminGrowthSuiteRuntime };
