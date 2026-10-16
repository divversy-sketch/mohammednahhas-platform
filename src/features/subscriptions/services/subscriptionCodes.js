import { callFunction } from '../../../services/callFunction.js';

export function validateSubscriptionCode(code) {
  return code?.trim() ? null : 'أدخل الكود أولاً';
}

export async function redeemStudentSubscriptionCode(code) {
  const data = await callFunction('redeemSubscriptionCode', { code: code.trim() });
  return data?.days || 0;
}
