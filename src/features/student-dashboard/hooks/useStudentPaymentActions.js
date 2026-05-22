import { useState } from 'react';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { createStudentPaymentRequest, validateStudentPaymentDraft } from '@features/payments';

const initialPaymentDraft = { amount: '', method: 'vodafone_cash', transactionId: '', note: '' };

export function useStudentPaymentActions({ user, userData }) {
  const [paymentDraft, setPaymentDraft] = useState(initialPaymentDraft);
  const [isSendingPayment, setIsSendingPayment] = useState(false);

  const handleSubmitPaymentRequest = async (event) => {
    event.preventDefault();
    const validationMessage = validateStudentPaymentDraft(paymentDraft);
    if (validationMessage) return platformNotify(validationMessage);
    setIsSendingPayment(true);
    try {
      await createStudentPaymentRequest({ user, userData, paymentDraft });
      setPaymentDraft(initialPaymentDraft);
      platformNotify('تم إرسال طلب الدفع للإدارة. سيتم تفعيل الاشتراك بعد المراجعة.');
    } catch (error) {
      console.error('payment request error:', error);
      platformNotify('تعذر إرسال طلب الدفع الآن. حاول مرة أخرى.');
    } finally {
      setIsSendingPayment(false);
    }
  };

  return { paymentDraft, setPaymentDraft, isSendingPayment, handleSubmitPaymentRequest };
}
