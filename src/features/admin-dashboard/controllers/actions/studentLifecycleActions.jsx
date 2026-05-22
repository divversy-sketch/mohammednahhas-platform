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

export const createStudentLifecycleActions = (ctx) => {
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

  const updateStudentStatusSafely = async (id, status) => {
    try {
      await adminSecureFunctions.setStudentStatus(id, status);
    } catch (error) {
      console.warn('setStudentStatus callable failed; trying Firestore admin fallback:', error?.message);
      await updateDoc(doc(db, 'users', id), { status, updatedAt: serverTimestamp() });
    }
  };

  const handleApprove = async (id) => {
    const student = pendingUsers.find((u) => u.id === id) || activeUsersList.find((u) => u.id === id) || {};
    await updateStudentStatusSafely(id, 'active');
    await audit('student_approved', { title: 'تفعيل طالب', targetUserId: id, targetEmail: student.email || '', after: { status: 'active' } });
    sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح.");
  };

  const handleReject = async (id) => {
      const student = pendingUsers.find((u) => u.id === id) || activeUsersList.find((u) => u.id === id) || {};
      if (!confirmSensitiveAction(`تأكيد حظر/رفض الطالب: ${student.name || student.email || id}`, { confirmText: 'حظر' })) return;
      await updateStudentStatusSafely(id, 'blocked');
      await audit('student_rejected_or_blocked', { title: 'رفض أو حظر طالب', severity: 'warning', targetUserId: id, targetEmail: student.email || '', before: { status: student.status || 'pending' }, after: { status: 'blocked' } });
  };
  
  const handleChangeUserStatus = async (id, newStatus) => {
      const student = activeUsersList.find((u) => u.id === id) || pendingUsers.find((u) => u.id === id) || {};
      if (String(newStatus || '').startsWith('banned') && !confirmSensitiveAction(`تأكيد تغيير حالة الطالب ${student.name || student.email || id} إلى ${newStatus}`, { confirmText: 'تأكيد' })) return;
      await updateStudentStatusSafely(id, newStatus);
      await audit('student_status_changed', { title: 'تغيير حالة طالب', severity: String(newStatus || '').startsWith('banned') ? 'warning' : 'info', targetUserId: id, targetEmail: student.email || '', before: { status: student.status || '' }, after: { status: newStatus } });
  };

  const sendWhatsAppToParent = (result) => {
      const student = activeUsersList.find(u => u.id === result.studentId);
      if (!student || !student.parentPhone) return platformNotify("لا يوجد رقم ولي أمر مسجل لهذا الطالب!");
      let phone = student.parentPhone.trim();
      if (phone.startsWith('0')) phone = '20' + phone.substring(1);
      const examName = examsList.find(e => e.id === result.examId)?.title || 'اختبار';
      const message = `مرحباً ولي أمر الطالب/ة: *${result.studentName}* 🎓\n\nنحيط سيادتكم علماً بنتيجة امتحان: *${examName}*\nالدرجة التي حصل عليها: *${result.score}* من *${result.total}* 📊\n\nمع خالص تحيات إدارة منصة النحاس - أ/ محمد النحاس.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  };

  const openStudentProfile = async (student) => {
      setViewingStudentProfile(student);
      try {
          const q = query(collection(db, 'video_views'), where('userId', '==', student.id));
          const snap = await getDocs(q);
          const history = snap.docs.map(d => d.data());
          history.sort((a, b) => (b.viewedAt?.seconds || 0) - (a.viewedAt?.seconds || 0));
          setStudentHistoryData(history);
      } catch (error) { console.error("Error fetching history:", error); }
  };

  const handleUpdateUser = async (e) => { 
      e.preventDefault(); 
      if(!editingUser) return; 

      const validation = validateEgyptianPhones(editingUser.phone, editingUser.parentPhone);
      if (!validation.ok) return platformNotify(validation.message);

      await updateDoc(doc(db, 'users', editingUser.id), { 
          name: editingUser.name?.trim(), phone: validation.normalizedStudentPhone, parentPhone: validation.normalizedParentPhone, grade: editingUser.grade 
      }); 
      await audit('student_profile_updated', { title: 'تعديل بيانات طالب', targetUserId: editingUser.id, targetEmail: editingUser.email || '', before: { name: editingUser.originalName || editingUser.name || '', grade: editingUser.originalGrade || '' }, after: { name: editingUser.name?.trim(), phone: validation.normalizedStudentPhone, grade: editingUser.grade } });
      setEditingUser(null); 
  };
  
  const generateAdminPassword = () => {
      const random = Math.random().toString(36).slice(2, 8).toUpperCase();
      const tail = Math.floor(1000 + Math.random() * 9000);
      return `Nahas@${random}${tail}`;
  };

  const handleSendResetPassword = async (studentOrEmail, requestId = '') => {
      const student = typeof studentOrEmail === 'object'
        ? studentOrEmail
        : activeUsersList.find(u => String(u.email || '').trim().toLowerCase() === String(studentOrEmail || '').trim().toLowerCase());

      if (!student?.id) {
          platformNotify('لم يتم العثور على الطالب داخل قائمة الطلاب.', 'error');
          return;
      }

      const suggestedPassword = generateAdminPassword();
      const newPassword = platformPrompt(`اكتب كلمة السر الجديدة للطالب ${student.name || student.email}`, suggestedPassword);
      if (!newPassword) return;
      if (String(newPassword).length < 8) {
          platformNotify('كلمة السر يجب ألا تقل عن 8 حروف/أرقام.', 'error');
          return;
      }

      try {
          await adminSecureFunctions.setStudentPassword(student.id, newPassword, requestId);
          await audit('student_password_reset', { title: 'تغيير كلمة سر طالب', severity: 'critical', targetUserId: student.id, targetEmail: student.email || '', meta: { requestId: requestId || '' } });
          platformNotify('تم تغيير كلمة السر بنجاح. شاركها مع الطالب من قناة آمنة ولا تحفظها داخل المنصة.', 'success');
      } catch (error) {
          platformNotify(error?.message || 'فشل تغيير كلمة السر من السيرفر.', 'error');
      }
  };
  
  const approveGrade = async (user) => {
      if (!user.requestedGrade) return;
      await updateDoc(doc(db, 'users', user.id), { grade: user.requestedGrade, requestedGrade: null, gradeUpdateStatus: null });
      await audit('student_grade_request_approved', { title: 'قبول تغيير مرحلة طالب', targetUserId: user.id, targetEmail: user.email || '', before: { grade: user.grade }, after: { grade: user.requestedGrade } });
      platformNotify(`تم تغيير مرحلة الطالب ${user.name} بنجاح.`);
  };

  const rejectGrade = async (user) => {
      await updateDoc(doc(db, 'users', user.id), { requestedGrade: null, gradeUpdateStatus: null });
      await audit('student_grade_request_rejected', { title: 'رفض تغيير مرحلة طالب', targetUserId: user.id, targetEmail: user.email || '', meta: { requestedGrade: user.requestedGrade || '' } });
      platformNotify(`تم رفض طلب تغيير المرحلة للطالب ${user.name}.`);
  };

  return {
    updateStudentStatusSafely,
    handleApprove,
    handleReject,
    handleChangeUserStatus,
    sendWhatsAppToParent,
    openStudentProfile,
    handleUpdateUser,
    generateAdminPassword,
    handleSendResetPassword,
    approveGrade,
    rejectGrade
  };
};

export default createStudentLifecycleActions;
