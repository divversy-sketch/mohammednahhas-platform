import { useState } from 'react';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { createStudentSupportTicket, validateSupportDraft } from '@features/support';

const initialSupportDraft = { category: 'exam', message: '' };

export function useStudentSupportActions({ user, userData }) {
  const [supportDraft, setSupportDraft] = useState(initialSupportDraft);
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  const handleSendSupportTicket = async (event) => {
    event.preventDefault();
    const validationMessage = validateSupportDraft(supportDraft);
    if (validationMessage) return platformNotify(validationMessage);
    setIsSendingSupport(true);
    try {
      await createStudentSupportTicket({ user, userData, supportDraft });
      setSupportDraft(initialSupportDraft);
      platformNotify('تم إرسال تذكرة الدعم. هتظهر للإدارة في مركز الرسائل.');
    } catch (error) {
      console.error('support ticket error:', error);
      platformNotify('تعذر إرسال تذكرة الدعم الآن. حاول مرة أخرى.');
    } finally {
      setIsSendingSupport(false);
    }
  };

  return { supportDraft, setSupportDraft, isSendingSupport, handleSendSupportTicket };
}
