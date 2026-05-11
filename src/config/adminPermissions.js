export const OWNER_EMAIL = 'mido16280@gmail.com';

export const ADMIN_ROLE_LABELS = Object.freeze({
  owner: 'مالك المنصة',
  manager: 'مدير عام',
  exams_supervisor: 'مشرف امتحانات',
  students_supervisor: 'مشرف طلاب',
  content_supervisor: 'مشرف محتوى',
  finance_supervisor: 'مشرف اشتراكات ودفع',
  support: 'دعم فني',
});

export const ADMIN_TAB_LABELS = Object.freeze({
  dashboard: 'Dashboard شامل',
  follow_up: 'المتابعة والتقارير',
  users: 'طلبات الانضمام',
  all_users: 'الطلاب',
  password_resets: 'تغيير كلمات السر',
  payments: 'الاشتراكات والدفع',
  subscriptions_legacy: 'أكواد الاشتراك',
  security_center: 'مركز الحماية',
  app_convert: 'تحويل App',
  question_bank: 'بنك الأسئلة',
  smart_exam_engine: 'محرك الامتحانات الذكي',
  student_reports: 'تقارير الطلاب',
  student_groups: 'المجموعات والدفعات',
  messages_center: 'رسائل الطلاب',
  finance_dashboard: 'اللوحة المالية',
  video_security: 'حماية الفيديوهات',
  platform_settings: 'إعدادات المنصة',
  admin_roles: 'صلاحيات الأدمن',
  audit_logs: 'سجل الإدارة',
  notifications_admin: 'الإشعارات',
  assignments: 'الواجبات',
  exams: 'الامتحانات والنتائج',
  smart_hw: 'الواجب الذكي QR',
  content: 'المحتوى',
  courses: 'الكورسات التعليمية',
  mistakes_admin: 'بنك الأخطاء',
});

export const ADMIN_TABS = Object.freeze(Object.entries(ADMIN_TAB_LABELS));

export const ROLE_TAB_ACCESS = Object.freeze({
  owner: Object.keys(ADMIN_TAB_LABELS),
  manager: Object.keys(ADMIN_TAB_LABELS).filter((tab) => !['admin_roles'].includes(tab)),
  exams_supervisor: ['dashboard', 'follow_up', 'exams', 'question_bank', 'smart_exam_engine', 'security_center', 'video_security', 'student_reports', 'mistakes_admin'],
  students_supervisor: ['dashboard', 'follow_up', 'users', 'all_users', 'student_reports', 'student_groups', 'messages_center', 'notifications_admin', 'password_resets'],
  content_supervisor: ['dashboard', 'content', 'courses', 'assignments', 'smart_hw', 'question_bank', 'notifications_admin'],
  finance_supervisor: ['dashboard', 'payments', 'subscriptions_legacy', 'finance_dashboard', 'all_users'],
  support: ['dashboard', 'users', 'all_users', 'messages_center', 'password_resets', 'notifications_admin'],
});

export const ROLE_PERMISSIONS = Object.freeze({
  owner: ['all'],
  manager: ['manage_users', 'manage_exams', 'manage_content', 'manage_subscriptions', 'manage_homework', 'manage_messages', 'manage_settings', 'read_reports'],
  exams_supervisor: ['manage_exams', 'manage_question_bank', 'manage_exam_results', 'manage_security', 'read_reports'],
  students_supervisor: ['manage_users', 'manage_messages', 'manage_notifications', 'read_reports'],
  content_supervisor: ['manage_content', 'manage_courses', 'manage_homework', 'manage_question_bank', 'manage_notifications'],
  finance_supervisor: ['manage_subscriptions', 'manage_payments', 'read_reports'],
  support: ['manage_messages', 'manage_notifications', 'read_users', 'read_reports'],
});

export const getRolePermissions = (role = 'support') => ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.support;
export const getRoleTabs = (role = 'support') => ROLE_TAB_ACCESS[role] || ROLE_TAB_ACCESS.support;

export const isOwnerEmail = (email = '') => String(email || '').trim().toLowerCase() === OWNER_EMAIL;

export const buildOwnerAdminProfile = (user = {}) => ({
  uid: user.uid,
  email: user.email || OWNER_EMAIL,
  active: true,
  role: 'admin',
  adminRole: 'owner',
  adminRoleLabel: ADMIN_ROLE_LABELS.owner,
  permissions: ROLE_PERMISSIONS.owner,
  allowedTabs: ROLE_TAB_ACCESS.owner,
  isOwner: true,
});

export const normalizeAdminProfile = (user = {}, adminData = {}) => {
  if (isOwnerEmail(user?.email || adminData?.email)) return buildOwnerAdminProfile(user);
  const adminRole = adminData.adminRole || 'support';
  return {
    uid: user.uid,
    email: user.email || adminData.email || '',
    ...adminData,
    role: 'admin',
    adminRole,
    adminRoleLabel: ADMIN_ROLE_LABELS[adminRole] || adminData.adminRoleLabel || 'مساعد',
    permissions: Array.isArray(adminData.permissions) && adminData.permissions.length ? adminData.permissions : getRolePermissions(adminRole),
    allowedTabs: Array.isArray(adminData.allowedTabs) && adminData.allowedTabs.length ? adminData.allowedTabs : getRoleTabs(adminRole),
    isOwner: false,
  };
};

export const canAccessAdminTab = (adminProfile, tab) => {
  if (!tab) return false;
  if (isOwnerEmail(adminProfile?.email) || adminProfile?.adminRole === 'owner' || adminProfile?.permissions?.includes('all')) return true;
  return (adminProfile?.allowedTabs || []).includes(tab);
};


export const ADMIN_ACTION_PERMISSIONS = Object.freeze({
  'students.read': ['read_users', 'manage_users'],
  'students.edit': ['manage_users'],
  'students.ban': ['manage_users', 'manage_security'],
  'students.delete': ['manage_users'],
  'payments.approve': ['manage_payments', 'manage_subscriptions'],
  'payments.export': ['read_finance', 'manage_payments', 'manage_subscriptions'],
  'exams.edit': ['manage_exams'],
  'exams.delete': ['manage_exams'],
  'results.edit': ['manage_exam_results', 'manage_exams'],
  'content.edit': ['manage_content', 'manage_courses'],
  'questionBank.edit': ['manage_question_bank', 'manage_exams'],
  'notifications.send': ['manage_notifications', 'manage_messages'],
  'messages.reply': ['manage_messages'],
  'settings.edit': ['manage_settings'],
  'security.view': ['manage_security'],
  'audit.view': ['manage_security', 'read_reports'],
  'data.export': ['export_data', 'read_reports'],
});
