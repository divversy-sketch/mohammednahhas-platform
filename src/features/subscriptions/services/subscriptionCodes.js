import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../services/firebase';

export function validateSubscriptionCode(code) {
  return code?.trim() ? null : 'أدخل الكود أولاً';
}

export async function redeemStudentSubscriptionCode(code) {
  const redeemCode = httpsCallable(functions, 'redeemSubscriptionCode');
  const result = await redeemCode({ code: code.trim() });
  return result.data?.days || 0;
}
