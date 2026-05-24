import { doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';

import { db } from '@services/firebase';
import { validateEgyptianPhones } from '@shared/utils/phone';
import { FloatingArabicBackground } from '@features/home/HomeWidgets';
import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '@services/firebaseContentUpload';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import { downloadXlsx } from '@shared/utils/exportData.js';
import { platformNotify, platformConfirm, platformPrompt, sendSystemNotification, safeNumber, VIDEO_EXAM_UNLOCK_PERCENT, getQuestionMaxScore, calculateDetailedExamMetrics } from '@shared/core/platformShared.jsx';
import { normalizeImagePlacement, defaultImagePlacement } from '@shared/utils/imagePlacement.js';
import { adminSecureFunctions } from '@admin/services/adminSecureFunctions.js';
import { confirmSensitiveAction } from '@admin/services/adminAudit.js';

export const createExamSecurityActions = (ctx) => {
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

  const handleApproveSecurityContinue = async (result) => {
    if (!result?.id) return;
    if (!platformConfirm(`السماح للطالب ${result.studentName || ''} باستكمال الامتحان بنفس الإجابات والوقت المتبقي؟`)) return;

    const fullSeconds = safeNumber(result.totalTime, 60) * 60;
    const savedRemainingTime = safeNumber(result.remainingTime, fullSeconds);
    const safeRemainingTime = savedRemainingTime > 0 ? savedRemainingTime : fullSeconds;
    const payload = {
      status: 'in_progress',
      adminDecision: 'continue',
      adminSecurityAction: 'continue',
      securityReleased: true,
      resumeApproved: true,
      resumeApprovedAt: serverTimestamp(),
      remainingTime: safeRemainingTime,
      currentQIndex: safeNumber(result.currentQIndex, 0),
      answers: result.answers || {},
      adminApprovedBy: user.email || user.uid,
      adminApprovedAt: serverTimestamp(),
      antiCheatLog: [
        ...(result.antiCheatLog || []),
        { type: 'admin_allowed_continue', at: new Date().toISOString(), admin: user.email || user.uid }
      ]
    };
    await updateDoc(doc(db, 'exam_results', result.id), payload);
    const updated = { ...result, ...payload, remainingTime: safeRemainingTime, currentQIndex: safeNumber(result.currentQIndex, 0), answers: result.answers || {} };
    setExamResults(prev => prev.map(r => r.id === result.id ? updated : r));
    if (viewingResult?.id === result.id) setViewingResult(updated);
    platformNotify('تم السماح للطالب باستكمال الامتحان. عندما يدخل نفس الامتحان سيظهر له زر الاستكمال ويكمل من نفس الإجابات والوقت المتبقي.');
  };

  const handleApproveSecurityRestart = async (result) => {
    if (!result?.id) return;
    if (!platformConfirm(`السماح للطالب ${result.studentName || ''} بإعادة الامتحان من البداية؟ سيتم مسح الإجابات الحالية وإرجاع الوقت كاملًا.`)) return;
    const fullSeconds = safeNumber(result.totalTime, 60) * 60;
    const payload = {
      status: 'in_progress',
      adminDecision: 'restart',
      adminSecurityAction: 'restart',
      securityReleased: true,
      answers: {},
      remainingTime: fullSeconds,
      currentQIndex: 0,
      antiCheatWarnings: 0,
      restartCount: increment(1),
      adminApprovedBy: user.email || user.uid,
      adminApprovedAt: serverTimestamp(),
      antiCheatLog: [
        ...(result.antiCheatLog || []),
        { type: 'admin_allowed_restart', at: new Date().toISOString(), admin: user.email || user.uid }
      ]
    };
    await updateDoc(doc(db, 'exam_results', result.id), payload);
    const updated = { ...result, ...payload, restartCount: safeNumber(result.restartCount, 0) + 1 };
    setExamResults(prev => prev.map(r => r.id === result.id ? updated : r));
    if (viewingResult?.id === result.id) setViewingResult(updated);
    platformNotify('تم السماح للطالب بإعادة الامتحان من البداية. عندما يدخل نفس الامتحان سيبدأ بمحاولة جديدة.');
  };

  return {
    handleApproveSecurityContinue,
    handleApproveSecurityRestart
  };
};

export default createExamSecurityActions;
