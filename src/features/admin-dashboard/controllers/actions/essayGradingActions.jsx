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

export const createEssayGradingActions = (ctx) => {
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

  const getEssayDraftKey = (resultId, questionId) => `${resultId}__${questionId}`;

  const handleSaveEssayGrade = async (resultDoc, question, questions) => {
      const draftKey = getEssayDraftKey(resultDoc.id, question.id);
      const rawScoreValue = essayScoreDrafts[draftKey] ?? resultDoc.essayScores?.[question.id] ?? '';
      const rawMaxValue = essayMaxDrafts[draftKey] ?? resultDoc.essayMaxScores?.[question.id] ?? '';

      const scoreValue = Number(rawScoreValue);
      const maxValue = Number(rawMaxValue);

      if (rawScoreValue === '' || rawMaxValue === '' || Number.isNaN(scoreValue) || Number.isNaN(maxValue)) {
          return platformNotify("من فضلك أدخل الدرجة والدرجة النهائية لهذا السؤال.");
      }
      if (maxValue <= 0) {
          return platformNotify("الدرجة النهائية يجب أن تكون أكبر من صفر.");
      }
      if (scoreValue < 0 || scoreValue > maxValue) {
          return platformNotify("درجة الطالب يجب أن تكون بين صفر والدرجة النهائية.");
      }

      const nextEssayScores = { ...(resultDoc.essayScores || {}), [question.id]: scoreValue };
      const nextEssayMaxScores = { ...(resultDoc.essayMaxScores || {}), [question.id]: maxValue };

      const mcqQuestions = questions.filter((q) => q.type !== 'essay');
      const essayQuestions = questions.filter((q) => q.type === 'essay');

      const fallbackMcqScore = mcqQuestions.reduce((sum, q) => (
          resultDoc.answers?.[q.id] === q.correctIdx ? sum + 1 : sum
      ), 0);
      const mcqScore = typeof resultDoc.mcqScore === 'number' ? resultDoc.mcqScore : fallbackMcqScore;

      const essayTotal = essayQuestions.reduce((sum, q) => sum + Number(nextEssayScores[q.id] || 0), 0);
      const essayMaxTotal = essayQuestions.reduce((sum, q) => sum + Number(nextEssayMaxScores[q.id] || 0), 0);

      const reviewedEssayCount = essayQuestions.filter((q) => (
          nextEssayScores[q.id] !== undefined && nextEssayMaxScores[q.id] !== undefined
      )).length;

      const payload = {
          essayScores: nextEssayScores,
          essayMaxScores: nextEssayMaxScores,
          reviewedEssayCount,
          hasEssay: essayQuestions.length > 0,
          score: mcqScore + essayTotal,
          total: mcqQuestions.length + essayMaxTotal,
          essayReviewedAt: serverTimestamp()
      };

      try {
          await updateDoc(doc(db, 'exam_results', resultDoc.id), payload);
          const nextViewingResult = { ...resultDoc, ...payload };
          setViewingResult(nextViewingResult);
          setExamResults((prev) => prev.map((res) => res.id === resultDoc.id ? nextViewingResult : res));
          platformNotify("تم حفظ تصحيح السؤال المقالي بنجاح.");
      } catch (error) {
          console.error("Error saving essay grade:", error);
          platformNotify("حدث خطأ أثناء حفظ التصحيح.");
      }
  };


  return {
    getEssayDraftKey,
    handleSaveEssayGrade
  };
};

export default createEssayGradingActions;
