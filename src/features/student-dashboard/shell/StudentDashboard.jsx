import StudentDashboardLegacy from './legacy/StudentDashboardLegacy.jsx';

// Phase 6 boundary file.
// Keep imports pointed here while new dashboard sections move into controllers/navigation/renderers.
export const StudentDashboard = (props) => <StudentDashboardLegacy {...props} />;
export default StudentDashboard;
