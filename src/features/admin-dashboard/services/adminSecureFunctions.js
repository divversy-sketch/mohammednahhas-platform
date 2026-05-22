import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../../services/firebase.js';

const callAdminFunction = async (name, payload = {}) => {
  const fn = httpsCallable(functions, name);
  const result = await fn(payload);
  return result.data || { ok: true };
};

const callVercelAdminApi = async (path, payload = {}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('يجب تسجيل الدخول أولاً.');
  }

  const token = await currentUser.getIdToken(true);
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || 'فشل تنفيذ العملية من السيرفر.');
  }

  return data || { ok: true };
};

export const adminSecureFunctions = {
  // Student deletion uses Vercel Serverless API to delete the Firebase Auth user without requiring Firebase Blaze/Cloud Functions.
  deleteStudentAccount: (studentId, options = {}) => callVercelAdminApi('/api/admin-delete-student', { studentId, ...options }),
  setStudentStatus: (studentId, status) => callAdminFunction('setStudentStatus', { studentId, status }),
  createSubscriptionCode: (payload) => callAdminFunction('createSubscriptionCode', payload),
  approvePaymentRequest: (requestId, durationDays = 30) => callAdminFunction('approvePaymentRequest', { requestId, durationDays }),
  rejectPaymentRequest: (requestId, reason = '') => callAdminFunction('rejectPaymentRequest', { requestId, reason }),
  deleteExam: (examId) => callAdminFunction('deleteExam', { examId }),
  setExamPublishedState: (examId, isPublished) => callAdminFunction('setExamPublishedState', { examId, isPublished }),
  updateResultScore: (resultId, payload) => callAdminFunction('updateResultScore', { resultId, payload }),
  deleteAdminDocument: (collectionName, docId) => callAdminFunction('deleteAdminDocument', { collectionName, docId }),

  // Password reset flow uses Vercel Serverless API so it works on the free Firebase Spark plan.
  setStudentPassword: (studentId, newPassword, requestId = '') => callVercelAdminApi('/api/admin-set-student-password', { studentId, newPassword, requestId }),
  updatePasswordResetRequestStatus: (requestId, status) => callVercelAdminApi('/api/admin-password-request-status', { requestId, status }),
  updateStudentSubscription: (studentId, subscriptionStatus, durationDays = 30) => callAdminFunction('updateStudentSubscription', { studentId, subscriptionStatus, durationDays }),
  banStudent: (studentId, banType, reason = '') => callAdminFunction('banStudent', { studentId, banType, reason }),
  sendInternalNotification: (payload) => callAdminFunction('sendInternalNotification', payload),
  replySupportTicket: (ticketId, reply, status = 'answered') => callAdminFunction('replySupportTicket', { ticketId, reply, status }),
  recordSystemMigrationReport: (title, report = {}) => callAdminFunction('recordSystemMigrationReport', { title, report })
};

export default adminSecureFunctions;
