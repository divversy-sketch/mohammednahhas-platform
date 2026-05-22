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

export const createCommunicationActions = (ctx) => {
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

  const handleCreateSmartHw = async (e) => {
      e.preventDefault();
      if (!newSmartHw.title || !newSmartHw.answerKey || !newSmartHw.bookName) return platformNotify("أكمل البيانات (الاسم، الإجابة، والكتاب)");
      await addDoc(collection(db, 'smart_homeworks'), { ...newSmartHw, createdAt: serverTimestamp() });
      setNewSmartHw(prev => ({ ...prev, title: '', answerKey: '' }));
      platformNotify("تم إنشاء الواجب! يمكنك نسخ الرابط الآن.");
  };

  const handleReplyMessage = async (msgId) => {
    const text = replyTexts[msgId];
    if (!text?.trim()) return;
    await updateDoc(doc(db, 'messages', msgId), { adminReply: text });
    setReplyTexts(prev => ({ ...prev, [msgId]: '' }));
    platformNotify("تم إرسال الرد!");
  };
  
  const handleAddAnnouncement = async () => {
      if(!newAnnouncement.trim()) return;
      await addDoc(collection(db, 'announcements'), { text: newAnnouncement, createdAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), { text: `تنبيه هام: ${newAnnouncement}`, grade: 'all', createdAt: serverTimestamp() });
      setNewAnnouncement("");
      platformNotify("تم نشر الإعلان");
  };

  const handleSendStudentNotification = async (e) => {
      e?.preventDefault?.();
      if(!newStudentNotification.text.trim()) return platformNotify('اكتب نص الإشعار أولاً');
      const title = newStudentNotification.title?.trim() || 'تنبيه من منصة النحاس';
      await addDoc(collection(db, 'notifications'), {
        title,
        text: newStudentNotification.text.trim(),
        body: newStudentNotification.text.trim(),
        grade: newStudentNotification.grade || 'all',
        clickUrl: newStudentNotification.clickUrl || '/',
        pushStatus: 'pending',
        createdAt: serverTimestamp(),
        source: 'admin_manual'
      });
      setNewStudentNotification({ title: '', text: '', grade: newStudentNotification.grade || 'all', clickUrl: '/' });
      platformNotify('تم حفظ الإشعار وسيتم إرساله كتطبيق/موبايل للطلاب المفعّلين للإشعارات بعد تفعيل Cloud Function');
  };

  const toggleLeaderboard = async () => {
      await setDoc(doc(db, 'settings', 'leaderboard_config'), { show: !showLeaderboard }, { merge: true });
      setShowLeaderboard(!showLeaderboard);
  };

  const handleAddAutoReply = async () => { platformNotify('تم حذف نظام الرد الآلي نهائيًا.'); };
  const toggleAutoReply = async () => {};
  const deleteAutoReply = async () => {};
  const handleAddQuote = async () => {
      if(!newQuote.text || !newQuote.source) return platformNotify("أكمل البيانات");
      await addDoc(collection(db, 'quotes'), { ...newQuote, createdAt: serverTimestamp() });
      setNewQuote({ text: '', source: '' });
  };
  const deleteQuote = async (id) => { if(platformConfirm("حذف هذه الحكمة؟")) await deleteDoc(doc(db, 'quotes', id)); };


  return {
    handleCreateSmartHw,
    handleReplyMessage,
    handleAddAnnouncement,
    handleSendStudentNotification,
    toggleLeaderboard,
    handleAddAutoReply,
    toggleAutoReply,
    deleteAutoReply,
    handleAddQuote,
    deleteQuote
  };
};

export default createCommunicationActions;
