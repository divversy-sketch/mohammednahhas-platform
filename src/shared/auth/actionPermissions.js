import { isOwnerEmail } from '../../config/adminPermissions';
const ACTION_PERMISSION_MAP = Object.freeze({
  'students.read': ['all', 'read_users', 'manage_users'],
  'students.edit': ['all', 'manage_users'],
  'students.ban': ['all', 'manage_users', 'manage_security'],
  'students.delete': ['all', 'manage_users'],
  'payments.read': ['all', 'read_finance', 'manage_payments', 'manage_subscriptions'],
  'payments.approve': ['all', 'manage_payments', 'manage_subscriptions'],
  'payments.export': ['all', 'read_finance', 'manage_payments', 'manage_subscriptions'],
  'exams.edit': ['all', 'manage_exams'],
  'exams.delete': ['all', 'manage_exams'],
  'results.edit': ['all', 'manage_exam_results', 'manage_exams'],
  'content.edit': ['all', 'manage_content', 'manage_courses'],
  'questionBank.edit': ['all', 'manage_question_bank', 'manage_exams'],
  'notifications.send': ['all', 'manage_notifications', 'manage_messages'],
  'messages.reply': ['all', 'manage_messages'],
  'settings.edit': ['all', 'manage_settings'],
  'security.view': ['all', 'manage_security'],
  'audit.view': ['all', 'manage_security', 'read_reports'],
  'data.export': ['all', 'export_data', 'read_reports'],
});

export function getAdminPermissions(admin = {}) {
  const permissions = Array.isArray(admin.permissions) ? admin.permissions : [];
  const rolePermissions = Array.isArray(admin.rolePermissions) ? admin.rolePermissions : [];
  return [...new Set([...permissions, ...rolePermissions])];
}

export function canPerformAdminAction(admin = {}, action) {
  if (!action) return false;
  const permissions = getAdminPermissions(admin);
  if (isOwnerEmail(admin.email) || admin.isOwner === true || permissions.includes('all')) return true;
  const needed = ACTION_PERMISSION_MAP[action] || [];
  return needed.some((permission) => permissions.includes(permission));
}

export function requireAdminAction(admin = {}, action) {
  if (!canPerformAdminAction(admin, action)) {
    throw new Error('هذا الحساب لا يملك صلاحية تنفيذ هذا الإجراء.');
  }
  return true;
}

export { ACTION_PERMISSION_MAP };
