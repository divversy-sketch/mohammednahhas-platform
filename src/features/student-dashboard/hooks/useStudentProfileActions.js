import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@services/firebase';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { buildStudentProfileUpdatePayload, updateStudentProfile } from '@features/students';

export function useStudentProfileActions({ user, userData, editFormData }) {
  const handleUpdateMyProfile = async (event) => {
    event?.preventDefault?.();
    const { payload, isGradeChange, error } = buildStudentProfileUpdatePayload({ editFormData, userData });
    if (error) return platformNotify(error);

    const phoneChanged = payload.phone !== (userData?.phone || '');
    if (!phoneChanged && !isGradeChange) return platformNotify('مفيش تعديل جديد تحفظه.');

    try {
      await updateStudentProfile({ userId: user.uid, payload: { ...payload, updatedAt: serverTimestamp() } });
    } catch (err) {
      console.warn('profile update failed:', err?.message);
      return platformNotify('ما قدرناش نحفظ التعديل. اتأكد من النت وجرّب تاني.');
    }

    // بيظهر للأدمن في «التنبيهات» (طلب منفصل: لو قواعد Firebase لسه ما اتحدثتش ما يبوّظش الحفظ نفسه).
    setDoc(doc(db, 'users', user.uid), {
      profileUpdatedAt: serverTimestamp(),
      profileChange: {
        fields: [phoneChanged && 'phone', isGradeChange && 'grade'].filter(Boolean),
        oldPhone: phoneChanged ? (userData?.phone || '') : null,
        newPhone: phoneChanged ? payload.phone : null,
        requestedGrade: isGradeChange ? payload.requestedGrade : null,
      },
    }, { merge: true }).catch(() => {});

    platformNotify(isGradeChange ? 'اتحفظ، وطلب تغيير الصف راح للمستر يوافق عليه.' : 'رقم الموبايل اتحدث واتبعت للمستر.');
    return null;
  };

  return { handleUpdateMyProfile };
}
