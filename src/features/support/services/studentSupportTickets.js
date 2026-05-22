import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

export function validateSupportDraft(supportDraft = {}) {
  if (!supportDraft.message?.trim()) {
    return 'اكتب تفاصيل المشكلة أولاً.';
  }

  return null;
}

export async function createStudentSupportTicket({ user, userData, supportDraft }) {
  const chatRef = doc(db, 'student_chats', user.uid);

  await setDoc(chatRef, {
    userId: user.uid,
    studentId: user.uid,
    studentName: userData?.name || user.displayName || user.email || 'طالب',
    studentEmail: user.email || userData?.email || '',
    lastMessage: supportDraft.message.trim().slice(0, 180),
    category: supportDraft.category,
    status: 'open',
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return addDoc(collection(db, 'student_chats', user.uid, 'messages'), {
    senderId: user.uid,
    senderRole: 'student',
    senderName: userData?.name || user.displayName || 'طالب',
    category: supportDraft.category,
    text: supportDraft.message.trim(),
    readByAdmin: false,
    createdAt: serverTimestamp(),
  });
}
