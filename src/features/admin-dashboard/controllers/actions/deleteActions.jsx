import { doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';

import { db } from '@services/firebase';
import { validateEgyptianPhones } from '@shared/utils/phone';
import { FloatingArabicBackground } from '@features/home/HomeWidgets';
import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '@services/firebaseContentUpload';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import { downloadXlsx } from '@shared/utils/exportData.js';
import { platformNotify, platformConfirm, platformPrompt, sendSystemNotification, safeNumber, VIDEO_EXAM_UNLOCK_PERCENT, getQuestionMaxScore, calculateDetailedExamMetrics } from '@shared/core/platformShared.jsx';
import { normalizeImagePlacement, defaultImagePlacement } from '@shared/utils/imagePlacement.js';
import { adminSecureFunctions } from '@features/admin-dashboard/services/adminSecureFunctions.js';
import { confirmSensitiveAction } from '@features/admin-dashboard/services/adminAudit.js';

export const createAdminDeleteActions = (ctx) => {
  const {
    adminReviewExamData,
    setAdminReviewExamData,
    adminReviewResult,
    setAdminReviewResult,
    activeTab,
    setActiveTab,
    adminExamView,
    setAdminExamView,
    adminGradeFilter,
    setAdminGradeFilter,
    newContent,
    setNewContent,
    editingUser,
    setEditingUser,
    replyTexts,
    setReplyTexts,
    examBuilder,
    setExamBuilder,
    examOverrideDraft,
    setExamOverrideDraft,
    bulkText,
    setBulkText,
    viewingResult,
    setViewingResult,
    resultsFilter,
    setResultsFilter,
    essayScoreDrafts,
    setEssayScoreDrafts,
    essayMaxDrafts,
    setEssayMaxDrafts,
    newAnnouncement,
    setNewAnnouncement,
    newStudentNotification,
    setNewStudentNotification,
    showLeaderboard,
    setShowLeaderboard,
    autoReplies,
    setAutoReplies,
    newAutoReply,
    setNewAutoReply,
    newQuote,
    setNewQuote,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    viewingStudentProfile,
    setViewingStudentProfile,
    studentHistoryData,
    setStudentHistoryData,
    editingExamTime,
    setEditingExamTime,
    newEndTime,
    setNewEndTime,
    editingFullExam,
    setEditingFullExam,
    examEditMode,
    setExamEditMode,
    recalculateAfterExamEdit,
    setRecalculateAfterExamEdit,
    examEditDraft,
    setExamEditDraft,
    editingFullContent,
    setEditingFullContent,
    contentEditMode,
    setContentEditMode,
    contentEditDraft,
    setContentEditDraft,
    newSmartHw,
    setNewSmartHw,
    codeGenCount,
    setCodeGenCount,
    codeGenDays,
    setCodeGenDays,
    userData,
    adminProfile,
    examEditQuestionsPreview,
    updateQuestionInExamDraft,
    pendingUsers,
    activeUsersList,
    contentList,
    messagesList,
    examsList,
    examResults,
    examAccessOverrides,
    announcements,
    quotesList,
    smartHomeworks,
    hwResults,
    subscriptionCodes,
    assignments,
    assignmentSubmissions,
    mistakes,
    videoViews,
    passwordResetRequests,
    setPendingUsers,
    setActiveUsersList,
    setContentList,
    setMessagesList,
    setExamsList,
    setExamResults,
    setExamAccessOverrides,
    setAnnouncements,
    setQuotesList,
    setSmartHomeworks,
    setHwResults,
    setSubscriptionCodes,
    setPasswordResetRequests,
    audit
  } = ctx;

  const handleDeleteUser = async (id) => {
    if (!id) return;
    const student = activeUsersList.find((u) => u.id === id) || pendingUsers.find((u) => u.id === id) || {};
    const label = student.name || student.email || id;
    const confirmed = confirmSensitiveAction(`تحذير مهم: سيتم حذف الطالب "${label}" من المنصة ومن Firebase Authentication.\n\nسيتم أرشفة نسخة في deleted_users وحذف بياناته المرتبطة مثل النتائج والمشاهدات والاشتراكات.`, { confirmText: 'حذف' });
    if (!confirmed) return;
    try {
      const result = await adminSecureFunctions.deleteStudentAccount(id, { archiveBeforeDelete: true, deleteRelatedData: true });
      await audit('student_deleted', { title: 'حذف طالب من المنصة', severity: 'critical', targetUserId: id, targetEmail: student.email || '', before: { name: student.name || '', status: student.status || '', subscriptionStatus: student.subscriptionStatus || '' }, meta: { relatedDeletedCount: result?.relatedDeletedCount || 0 } });
      platformNotify(`تم حذف الطالب من المنصة ومن Firebase Auth. تم حذف ${result?.relatedDeletedCount || 0} سجل مرتبط.`, 'success');
    } catch (error) {
      platformNotify(error?.message || 'تعذر حذف الطالب الآن.', 'error');
    }
  };
  const handleDeleteMessage = async (id) => { if(platformConfirm("حذف الرسالة؟")) await adminSecureFunctions.deleteAdminDocument('messages', id); };
  const handleDeleteExam = async (id) => {
    const exam = examsList.find((e) => e.id === id) || {};
    if (!confirmSensitiveAction(`حذف الامتحان "${exam.title || id}" وكل نتائجه المرتبطة؟`, { confirmText: 'حذف' })) return;
    try {
      await adminSecureFunctions.deleteExam(id);
    } catch (error) {
      console.warn('deleteExam callable failed; trying Firestore admin fallback:', error?.message);
      const batch = writeBatch(db);
      batch.delete(doc(db, 'exams', id));
      const related = await getDocs(query(collection(db, 'exam_results'), where('examId', '==', id)));
      related.forEach((resultDoc) => batch.delete(resultDoc.ref));
      await batch.commit();
    }
    await audit('exam_deleted', { title: 'حذف امتحان وسجلاته', severity: 'critical', targetCollection: 'exams', targetDocId: id, before: { title: exam.title || '', grade: exam.grade || '' } });
    platformNotify('تم حذف الامتحان وسجلاته المرتبطة.');
  };
  const handleDeleteAnnouncement = async (id) => { if(platformConfirm("حذف الإعلان؟")) await adminSecureFunctions.deleteAdminDocument('announcements', id); };
  const handleDeleteResult = async (resultId) => {
    if (!platformConfirm("حذف النتيجة؟")) return;
    try {
      await adminSecureFunctions.deleteAdminDocument('exam_results', resultId);
    } catch (error) {
      console.warn('delete result callable failed; trying direct Firestore delete:', error?.message);
      await deleteDoc(doc(db, 'exam_results', resultId));
    }
    await audit('exam_result_deleted', { title: 'حذف نتيجة امتحان', severity: 'warning', targetCollection: 'exam_results', targetDocId: resultId });
    platformNotify('تم حذف النتيجة.');
  };

  const deleteDocsByCollection = async (collectionName, confirmMessage, successMessage) => {
    if (!platformConfirm(confirmMessage)) return;
    const snap = await getDocs(collection(db, collectionName));
    const refs = snap.docs.map((d) => doc(db, collectionName, d.id));
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    platformNotify(successMessage);
  };

  const handleDeleteAllResults = async () => {
    await deleteDocsByCollection('exam_results', 'تحذير خطير: سيتم حذف جميع نتائج الامتحانات لكل الطلاب. هل أنت متأكد؟', 'تم حذف جميع النتائج بنجاح.');
  };
  const handleDeleteAllContent = async () => {
    await deleteDocsByCollection('content', 'سيتم حذف كل محتوى صفحة المحتوى. هل أنت متأكد؟', 'تم حذف كل المحتوى.');
  };
  const handleDeleteAllExams = async () => {
    if (!platformConfirm('سيتم حذف كل الامتحانات وكل نتائجها. هل أنت متأكد؟')) return;
    const refs = [];
    for (const name of ['exams', 'exam_results']) {
      const snap = await getDocs(collection(db, name));
      snap.docs.forEach((d) => refs.push(doc(db, name, d.id)));
    }
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    platformNotify('تم حذف كل الامتحانات ونتائجها.');
  };
  const handleDeleteAllHomework = async () => {
    if (!platformConfirm('سيتم حذف كل الواجبات وتسليماتها والواجبات الذكية ونتائجها. هل أنت متأكد؟')) return;
    const refs = [];
    for (const name of ['assignments', 'assignment_submissions', 'smart_homeworks', 'homework_results']) {
      const snap = await getDocs(collection(db, name));
      snap.docs.forEach((d) => refs.push(doc(db, name, d.id)));
    }
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
    platformNotify('تم حذف كل الواجبات وسجلاتها.');
  };
  const handleDeleteAllMistakes = async () => {
    await deleteDocsByCollection('student_mistakes', 'سيتم حذف بنك الأخطاء لكل الطلاب. هل أنت متأكد؟', 'تم حذف بنك الأخطاء بالكامل.');
  };

  return {
    handleDeleteUser,
    handleDeleteMessage,
    handleDeleteExam,
    handleDeleteAnnouncement,
    handleDeleteResult,
    deleteDocsByCollection,
    handleDeleteAllResults,
    handleDeleteAllContent,
    handleDeleteAllExams,
    handleDeleteAllHomework,
    handleDeleteAllMistakes
  };
};

export default createAdminDeleteActions;
