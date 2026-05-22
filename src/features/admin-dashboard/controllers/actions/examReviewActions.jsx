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

export const createExamReviewActions = (ctx) => {
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

  const openAdminResultReview = async (result) => {
    try {
      let examData = null;

      if (result.examId) {
        const cachedExam = examsList.find(e => e.id === result.examId);
        if (cachedExam) {
          examData = cachedExam;
        } else {
          const examSnap = await getDoc(doc(db, 'exams', result.examId));
          if (examSnap.exists()) examData = { id: examSnap.id, ...examSnap.data() };
        }
      }

      if (!examData) {
        return platformNotify('لم يتم العثور على الامتحان الأصلي لهذه النتيجة. قد يكون الامتحان محذوفًا.');
      }

      const reviewExam = {
        ...examData,
        attemptId: result.id,
        title: `${examData.title || result.examTitle || 'مراجعة امتحان'} - مراجعة الأدمن`,
        endTime: examData.endTime || new Date(Date.now() - 1000).toISOString()
      };

      const reviewUser = {
        uid: result.studentId,
        displayName: result.studentName || 'طالب',
        email: result.studentEmail || ''
      };

      setAdminReviewExamData({ exam: reviewExam, user: reviewUser });
      setAdminReviewResult(result);
    } catch (error) {
      console.error('open admin result review error:', error);
      platformNotify('تعذر فتح مراجعة الامتحان.');
    }
  };

  return {
    openAdminResultReview
  };
};

export default createExamReviewActions;
