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

export const createSubscriptionActions = (ctx) => {
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

  const handleToggleSubscription = async (user) => {
      const isCurrentlyPremium = user.subscriptionStatus === 'premium';
      if (isCurrentlyPremium) {
          if(platformConfirm("تحويل الطالب لباقة مجانية؟")) {
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'free', subscriptionExpiry: null });
              await audit('subscription_cancelled', { title: 'إلغاء اشتراك VIP', targetUserId: user.id, targetEmail: user.email || '', before: { subscriptionStatus: user.subscriptionStatus }, after: { subscriptionStatus: 'free' } });
          }
      } else {
          const days = platformPrompt("كم يوم تريد تفعيل الباقة لهذا الطالب؟", "30");
          if (days && !isNaN(days)) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + parseInt(days));
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'premium', subscriptionExpiry: expiryDate });
              await audit('subscription_activated', { title: `تفعيل اشتراك VIP لمدة ${days} يوم`, targetUserId: user.id, targetEmail: user.email || '', after: { subscriptionStatus: 'premium', days: Number(days), subscriptionExpiry: expiryDate.toISOString() } });
              platformNotify(`تم تفعيل الطالب لمدة ${days} يوم.`);
          }
      }
  };

  const generateSubscriptionCodes = async () => {
      if(!codeGenCount || !codeGenDays) return;
      if(platformConfirm(`هل أنت متأكد من توليد ${codeGenCount} كود جديد لمدة ${codeGenDays} يوم؟`)) {
          for(let i=0; i<Number(codeGenCount); i++) {
              const codeString = 'NAHAS-' + Math.random().toString(36).substring(2,8).toUpperCase();
              await adminSecureFunctions.createSubscriptionCode({
                  code: codeString,
                  days: parseInt(codeGenDays),
                  durationDays: parseInt(codeGenDays),
                  type: 'subscription'
              });
          }
          await audit('subscription_codes_generated', { title: `توليد ${codeGenCount} كود اشتراك`, targetCollection: 'subscription_codes', meta: { count: Number(codeGenCount), days: Number(codeGenDays) } });
          platformNotify("تم توليد الأكواد بنجاح!");
      }
  };

  const handleDeleteCode = async (id) => {
      if(platformConfirm("حذف هذا الكود؟")) await adminSecureFunctions.deleteAdminDocument('subscription_codes', id);
  };

  const copyUnusedSubscriptionCodes = async () => {
      const unused = subscriptionCodes.filter(c => !c.used).map(c => `${c.code} - ${c.days} يوم`).join('\n');
      if (!unused) return platformNotify('لا توجد أكواد غير مستخدمة للنسخ.');
      await navigator.clipboard.writeText(unused);
      platformNotify('تم نسخ الأكواد غير المستخدمة.');
  };

  const exportSubscriptionCodesCSV = async () => {
      const rows = [['code','days','status','usedBy','usedAt']];
      subscriptionCodes.forEach(c => {
          rows.push([
              c.code || '',
              c.days || '',
              c.used ? 'used' : 'unused',
              c.usedBy || '',
              c.usedAt?.toDate ? c.usedAt.toDate().toLocaleString('ar-EG') : ''
          ]);
      });
      await downloadXlsx(`subscription_codes_${new Date().toISOString().slice(0,10)}.xlsx`, rows);
      platformNotify('تم تجهيز ملف Excel لأكواد الاشتراك.');
  };

  const extendPremiumForAll = async () => {
      const days = platformPrompt('كم يوم تريد إضافتها لكل طلاب VIP الحاليين؟', '7');
      if (!days || Number.isNaN(Number(days))) return;
      if (!platformConfirm(`سيتم إضافة ${days} يوم لكل طلاب VIP الحاليين. هل أنت متأكد؟`)) return;
      const batch = writeBatch(db);
      activeUsersList.filter(u => u.subscriptionStatus === 'premium').forEach(u => {
          let expiry = u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : new Date();
          if (expiry < new Date()) expiry = new Date();
          expiry.setDate(expiry.getDate() + Number(days));
          batch.update(doc(db, 'users', u.id), { subscriptionExpiry: expiry, subscriptionStatus: 'premium' });
      });
      await batch.commit();
      await audit('bulk_subscriptions_extended', { title: `تمديد اشتراكات VIP ${days} يوم`, severity: 'warning', meta: { days: Number(days), affected: activeUsersList.filter(u => u.subscriptionStatus === 'premium').length } });
      platformNotify('تم تمديد اشتراكات VIP الحالية.');
  };


  return {
    handleToggleSubscription,
    generateSubscriptionCodes,
    handleDeleteCode,
    copyUnusedSubscriptionCodes,
    exportSubscriptionCodesCSV,
    extendPremiumForAll
  };
};

export default createSubscriptionActions;
