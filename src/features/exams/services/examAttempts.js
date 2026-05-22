import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@services/firebase';

export const consumeExamAttemptContinueDecision = (previousResult, options = {}) => setDoc(doc(db, 'exam_results', previousResult.id), {
  status: 'in_progress',
  adminDecision: 'continue_consumed',
  resumeApproved: false,
  adminSecurityAction: 'continue_consumed',
  resumedAfterAdminApprovalAt: serverTimestamp(),
  lastSavedAt: serverTimestamp(),
  sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
}, { merge: true });

export const consumeExamAttemptRestartDecision = (previousResult, options = {}, exam = {}) => setDoc(doc(db, 'exam_results', previousResult.id), {
  status: 'in_progress',
  resumeApproved: false,
  adminDecision: 'restart_consumed',
  answers: {},
  remainingTime: (exam.duration || 0) * 60,
  currentQIndex: 0,
  antiCheatWarnings: 0,
  restartedByAdminDecisionAt: serverTimestamp(),
  sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
}, { merge: true });

export const createStudentExamAttempt = ({ exam, user, options = {} }) => addDoc(collection(db, 'exam_results'), {
  examId: exam.id,
  studentId: user.uid,
  studentName: user.displayName,
  status: 'in_progress',
  adminDecision: null,
  resumeApproved: false,
  sourceVideoId: options.sourceVideoId || null,
  startedFromVideo: !!options.skipCode,
  submittedAt: serverTimestamp()
});
