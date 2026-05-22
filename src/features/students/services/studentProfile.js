import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { isValidEgyptPhone, normalizeEgyptPhone } from '../../../shared/utils/phone';

export function buildStudentProfileUpdatePayload({ editFormData, userData }) {
  const normalizedPhone = normalizeEgyptPhone(editFormData.phone);

  if (!isValidEgyptPhone(normalizedPhone)) {
    return {
      error: 'رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015'
    };
  }

  if (normalizedPhone === normalizeEgyptPhone(editFormData.parentPhone)) {
    return { error: 'لا يمكن أن يكون رقم الطالب هو نفسه رقم ولي الأمر.' };
  }

  const payload = { phone: normalizedPhone };
  const isGradeChange = editFormData.grade !== userData?.grade;

  if (isGradeChange) {
    payload.requestedGrade = editFormData.grade;
    payload.gradeUpdateStatus = 'pending';
  }

  return { payload, isGradeChange };
}

export async function updateStudentProfile({ userId, payload }) {
  return updateDoc(doc(db, 'users', userId), payload);
}
