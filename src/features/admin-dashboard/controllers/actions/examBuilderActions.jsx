import { parseExamText } from '@shared/exam/parseExamText.js';
import { buildNotification } from '@shared/notifications/notify.js';
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

  // extra: حقول «مين يشوف الامتحان» (audience, audienceKeys) من صفحة إنشاء الامتحان
  const parseExam = async (extraArg = {}) => {
    const extra = extraArg && typeof extraArg.preventDefault === 'function' ? {} : (extraArg || {});
    if (extra.audienceKeys && !extra.audienceKeys.length) return platformNotify("اختار مين يشوف الامتحان (مفيش ولا طالب متحدد)");
    if (!String(examBuilder.title || '').trim()) return platformNotify("اكتب اسم الامتحان");
    if (!bulkText.trim()) return platformNotify("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return platformNotify("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return platformNotify("يرجى تحديد وقت البدء والانتهاء");
    if (new Date(examBuilder.endTime).getTime() <= new Date(examBuilder.startTime).getTime()) return platformNotify("وقت الانتهاء لازم يكون بعد وقت البدء");
    if (!(Number(examBuilder.duration) > 0)) return platformNotify("اكتب مدة الامتحان بالدقايق");

    const { blocks: finalBlocks } = parseExamText(bulkText);
    if (finalBlocks.length === 0) return platformNotify("لم يتم التعرف على الأسئلة بشكل صحيح. افصل بين كل سؤال بسطر فارغ، واستخدم #فرع: للفروع و #مقالي: للسؤال المقالي.");

    const audienceFields = extra.audienceKeys ? { audience: extra.audience, audienceKeys: extra.audienceKeys } : {};
    const examRef = await addDoc(collection(db, 'exams'), { 
        ...audienceFields,
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

    // إشعارات تلقائية لنفس الطلبة: امتحان جديد + تذكير قبل ما يفتح بساعة + المراجعة اتفتحت بعد ما يقفل
    const target = extra.audienceKeys ? audienceFields : { audience: examBuilder.grade || 'all', grade: examBuilder.grade };
    const link = { kind: 'exam', id: examRef.id };
    const start = new Date(examBuilder.startTime).getTime();
    const end = new Date(examBuilder.endTime).getTime();
    const when = new Date(start).toLocaleString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
    const notes = [
      buildNotification({ ...target, category: 'exam', title: `امتحان جديد: ${examBuilder.title}`, body: `بيفتح ${when} ولمدة ${examBuilder.duration} دقيقة. جهّز نفسك.`, link, source: 'auto_exam_new' }),
    ];
    if (start - Date.now() > 70 * 60e3) notes.push(buildNotification({ ...target, category: 'reminder', priority: 'high', title: `فاضل ساعة على «${examBuilder.title}»`, body: 'الامتحان بيفتح كمان ساعة. خلّي النت والشحن تمام.', link, sendAt: new Date(start - 60 * 60e3), source: 'auto_exam_reminder' }));
    notes.push(buildNotification({ ...target, category: 'result', title: `مراجعة «${examBuilder.title}» اتفتحت`, body: 'شوف درجتك وإجاباتك والتصحيح.', link, sendAt: new Date(end + 60e3), source: 'auto_exam_review' }));
    await Promise.all(notes.map((n) => addDoc(collection(db, 'notifications'), n).catch(() => null)));
    setBulkText("");
    if (typeof setExamBuilder === 'function') setExamBuilder((prev) => ({ ...prev, title: '', accessCode: '', startTime: '', endTime: '', examImageUrl: '', accessRule: { ...(prev.accessRule || {}), enabled: false, requiredExamId: '' } }));
    platformNotify(`تم نشر الامتحان بنجاح!`);
  };

  return {
    parseExam
  };
};

export default createExamBuilderActions;
