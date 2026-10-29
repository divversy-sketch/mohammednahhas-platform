import { parseExamText } from '@shared/exam/parseExamText.js';
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

export const createExamBuilderActions = (ctx) => {
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

  const parseExam = async () => {
    if (!String(examBuilder.title || '').trim()) return platformNotify("اكتب اسم الامتحان");
    if (!bulkText.trim()) return platformNotify("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return platformNotify("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return platformNotify("يرجى تحديد وقت البدء والانتهاء");
    if (new Date(examBuilder.endTime).getTime() <= new Date(examBuilder.startTime).getTime()) return platformNotify("وقت الانتهاء لازم يكون بعد وقت البدء");
    if (!(Number(examBuilder.duration) > 0)) return platformNotify("اكتب مدة الامتحان بالدقايق");

    const { blocks: finalBlocks } = parseExamText(bulkText);
    if (finalBlocks.length === 0) return platformNotify("لم يتم التعرف على الأسئلة بشكل صحيح. افصل بين كل سؤال بسطر فارغ، واستخدم #فرع: للفروع و #مقالي: للسؤال المقالي.");

    await addDoc(collection(db, 'exams'), { 
        title: examBuilder.title, grade: examBuilder.grade, duration: examBuilder.duration, 
        startTime: examBuilder.startTime, endTime: examBuilder.endTime, accessCode: examBuilder.accessCode, 
        isPremium: examBuilder.isPremium,
        examImageUrl: examBuilder.examImageUrl || '',
        imagePlacement: normalizeImagePlacement(examBuilder.imagePlacement),
        accessRule: {
          enabled: !!examBuilder.accessRule?.enabled && !!examBuilder.accessRule?.requiredExamId,
          requiredExamId: examBuilder.accessRule?.requiredExamId || '',
          requiredPercentage: Math.min(100, Math.max(0, safeNumber(examBuilder.accessRule?.requiredPercentage, 70))),
          visibilityWhenLocked: 'locked',
          useBestAttempt: examBuilder.accessRule?.useBestAttempt !== false,
          allowAdminOverride: true
        },
        questions: finalBlocks, createdAt: serverTimestamp() 
    });

    await addDoc(collection(db, 'notifications'), { text: `امتحان جديد: ${examBuilder.title}`, grade: examBuilder.grade, audience: examBuilder.grade || 'all', createdAt: serverTimestamp() });
    setBulkText("");
    if (typeof setExamBuilder === 'function') setExamBuilder((prev) => ({ ...prev, title: '', accessCode: '', startTime: '', endTime: '', examImageUrl: '', accessRule: { ...(prev.accessRule || {}), enabled: false, requiredExamId: '' } }));
    platformNotify(`تم نشر الامتحان بنجاح!`);
  };

  return {
    parseExam
  };
};

export default createExamBuilderActions;
