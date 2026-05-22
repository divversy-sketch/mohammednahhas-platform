import PublicLayout from '@layouts/PublicLayout.jsx';
import StudentLayout from '@layouts/StudentLayout.jsx';
import AdminLayout from '@layouts/AdminLayout.jsx';

export const publicRoutes = [
  { path: '/', page: 'LandingPage' },
  { path: '/public', page: 'LandingPage' },
  { path: '/login', page: 'LoginPage' },
  { path: '/register', page: 'RegisterPage' },
  { path: '/forgot-password', page: 'ForgotPasswordPage' }
];

export const studentRoutes = [
  '/student', '/student/courses', '/student/lectures', '/student/learning-path',
  '/student/exams', '/student/assignments', '/student/mistakes-bank', '/student/files',
  '/student/payments', '/student/messages', '/student/support', '/student/profile',
  '/student/performance', '/student/settings'
];

export const adminRoutes = [
  '/admin', '/admin/students', '/admin/payments', '/admin/subscriptions',
  '/admin/courses', '/admin/lectures', '/admin/content', '/admin/exams',
  '/admin/results', '/admin/assignments', '/admin/files', '/admin/messages',
  '/admin/support', '/admin/reports', '/admin/settings', '/admin/permissions',
  '/admin/audit-logs', '/admin/security'
];

export function PublicRoute({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}

export function StudentRoute({ children, user }) {
  return <StudentLayout user={user}>{children}</StudentLayout>;
}

export function AdminRoute({ children, user }) {
  return <AdminLayout user={user}>{children}</AdminLayout>;
}

export const routeGuards = Object.freeze({ PublicRoute, StudentRoute, AdminRoute });
