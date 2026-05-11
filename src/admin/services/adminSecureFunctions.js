import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase.js';

const callAdminFunction = async (name, payload = {}) => {
  const fn = httpsCallable(functions, name);
  const result = await fn(payload);
  return result.data || { ok: true };
};

export const adminSecureFunctions = {
  deleteStudentAccount: (studentId) => callAdminFunction('deleteStudentAccount', { studentId }),
  setStudentStatus: (studentId, status) => callAdminFunction('setStudentStatus', { studentId, status }),
  createSubscriptionCode: (payload) => callAdminFunction('createSubscriptionCode', payload),
  approvePaymentRequest: (requestId, durationDays = 30) => callAdminFunction('approvePaymentRequest', { requestId, durationDays }),
  rejectPaymentRequest: (requestId, reason = '') => callAdminFunction('rejectPaymentRequest', { requestId, reason }),
  deleteExam: (examId) => callAdminFunction('deleteExam', { examId }),
  setExamPublishedState: (examId, isPublished) => callAdminFunction('setExamPublishedState', { examId, isPublished }),
  updateResultScore: (resultId, payload) => callAdminFunction('updateResultScore', { resultId, payload }),
  deleteAdminDocument: (collectionName, docId) => callAdminFunction('deleteAdminDocument', { collectionName, docId }),
  setStudentPassword: (studentId, newPassword, requestId = '') => callAdminFunction('adminSetStudentPassword', { studentId, newPassword, requestId }),
  updatePasswordResetRequestStatus: (requestId, status) => callAdminFunction('updatePasswordResetRequestStatus', { requestId, status })
};

export default adminSecureFunctions;
