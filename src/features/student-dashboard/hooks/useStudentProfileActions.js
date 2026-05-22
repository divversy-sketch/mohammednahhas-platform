import { platformNotify } from '@shared/core/platformShared.jsx';
import { buildStudentProfileUpdatePayload, updateStudentProfile } from '@features/students';

export function useStudentProfileActions({ user, userData, editFormData }) {
  const handleUpdateMyProfile = async (event) => {
    event.preventDefault();
    const { payload, isGradeChange, error } = buildStudentProfileUpdatePayload({ editFormData, userData });
    if (error) return platformNotify(error);

    await updateStudentProfile({ userId: user.uid, payload });
    platformNotify(isGradeChange ? 'تم حفظ رقم الهاتف وإرسال طلب تغيير المرحلة إلى الأدمن.' : 'تم تحديث رقم الهاتف بنجاح.');
  };

  return { handleUpdateMyProfile };
}
