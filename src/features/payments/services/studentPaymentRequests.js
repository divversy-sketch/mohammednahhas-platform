import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';

export function validateStudentPaymentDraft(paymentDraft = {}) {
  if (!paymentDraft.amount || Number(paymentDraft.amount) <= 0) {
    return 'اكتب قيمة التحويل أولاً.';
  }

  if (!paymentDraft.transactionId?.trim()) {
    return 'اكتب رقم العملية أو آخر 4 أرقام من الوصل.';
  }

  return null;
}

export async function createStudentPaymentRequest({ user, userData, paymentDraft }) {
  return addDoc(collection(db, 'payment_requests'), {
    userId: user.uid,
    studentId: user.uid,
    studentName: userData?.name || user.displayName || user.email || 'طالب',
    studentEmail: user.email || userData?.email || '',
    grade: userData?.grade || '',
    amount: Number(paymentDraft.amount || 0),
    method: paymentDraft.method,
    transactionId: paymentDraft.transactionId.trim(),
    note: paymentDraft.note.trim(),
    status: 'pending',
    days: 30,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
