import { lazy, useState, useMemo } from 'react';

import { doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';


import { db } from '@services/firebase';


import { validateEgyptianPhones } from '@shared/utils/phone';
import { FloatingArabicBackground } from '@features/home/HomeWidgets';


import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '@services/firebaseContentUpload';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import { downloadXlsx } from '@shared/utils/exportData.js';
import { platformNotify, platformConfirm, platformPrompt, sendSystemNotification, safeNumber, VIDEO_EXAM_UNLOCK_PERCENT, getQuestionMaxScore, calculateDetailedExamMetrics } from '@shared/core/platformShared.jsx';
import { normalizeImagePlacement, defaultImagePlacement } from '@shared/utils/imagePlacement.js';
import { DebugPanel } from '@shared/core/debugTools.jsx';
import { useBrowserBackTab } from '@shared/hooks/useBrowserBackTab.js';


import { useAdminDashboardData } from '@admin/hooks/useAdminDashboardData.js';
import AdminHeader from '@admin/components/AdminHeader.jsx';
import AdminSidebar from '@admin/components/AdminSidebar.jsx';
import AdminLazyFallback from '@admin/dashboard/AdminLazyFallback.jsx';


import { adminSecureFunctions } from '@features/admin-dashboard/services/adminSecureFunctions.js';
import { logAdminAction } from '@features/admin-dashboard/services/adminAudit.js';
import { useAdminDashboardActions } from './actions/useAdminDashboardActions.jsx';




const AdminDashboardTabs = lazy(() => import('@admin/parts/AdminDashboardTabs.jsx'));
const AdminDashboardModals = lazy(() => import('@admin/parts/AdminDashboardModals.jsx'));
const AdminPasswordResetRequestsPanel = lazy(() => import('@admin/parts/AdminPasswordResetRequestsPanel.jsx'));


export const useAdminDashboardController = ({ user, adminProfile }) => {
  const userData = { ...(user || {}), ...(adminProfile || {}) };
  const [adminReviewExamData, setAdminReviewExamData] = useState(null);
  const [adminReviewResult, setAdminReviewResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [adminExamView, setAdminExamView] = useState('manage');
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); 
  const [newContent, setNewContent] = useState({ title: '', url: '', thumbnailUrl: '', imagePlacement: defaultImagePlacement, type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [examBuilder, setExamBuilder] = useState({
    title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '', isPremium: false, examImageUrl: '', imagePlacement: defaultImagePlacement,
    accessRule: { enabled: false, requiredExamId: '', requiredPercentage: 70, visibilityWhenLocked: 'locked', useBestAttempt: true, allowAdminOverride: true }
  });
  const [bulkText, setBulkText] = useState('');
  const [viewingResult, setViewingResult] = useState(null); 
  const [resultsFilter, setResultsFilter] = useState('all');
  const [essayScoreDrafts, setEssayScoreDrafts] = useState({});
  const [essayMaxDrafts, setEssayMaxDrafts] = useState({});
  const [newAnnouncement, setNewAnnouncement] = useState(""); 
  const [newStudentNotification, setNewStudentNotification] = useState({ title: '', text: '', grade: 'all', clickUrl: '/' }); 
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const [autoReplies, setAutoReplies] = useState([]);
  const [newAutoReply, setNewAutoReply] = useState({ keywords: '', response: '', isActive: true });
  const [newQuote, setNewQuote] = useState({ text: '', source: '' });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);
  const [studentHistoryData, setStudentHistoryData] = useState([]);

  const [editingExamTime, setEditingExamTime] = useState(null);
  const [newEndTime, setNewEndTime] = useState('');

  const [editingFullExam, setEditingFullExam] = useState(null);
  const [examEditMode, setExamEditMode] = useState('direct');
  const [recalculateAfterExamEdit, setRecalculateAfterExamEdit] = useState(true);
  const [examEditDraft, setExamEditDraft] = useState({
    title: '', grade: '3sec', duration: 60, startTime: '', endTime: '',
    accessCode: '', isPremium: false, questionsText: '', examImageUrl: '', imagePlacement: defaultImagePlacement,
    accessRule: { enabled: false, requiredExamId: '', requiredPercentage: 70, visibilityWhenLocked: 'locked', useBestAttempt: true, allowAdminOverride: true }
  });
  const [examOverrideDraft, setExamOverrideDraft] = useState({ examId: '', studentId: '', reason: '' });

  const examEditQuestionsPreview = useMemo(() => {
    try {
      const blocks = JSON.parse(examEditDraft.questionsText || '[]');
      if (!Array.isArray(blocks)) return [];
      return blocks.flatMap((block, blockIndex) =>
        (Array.isArray(block?.subQuestions) ? block.subQuestions : []).map((q, questionIndex) => ({
          ...q,
          blockIndex,
          questionIndex,
          blockText: block?.text || ''
        }))
      );
    } catch (error) {
      return [];
    }
  }, [examEditDraft.questionsText]);

  const updateQuestionInExamDraft = (blockIndex, questionIndex, updates) => {
    try {
      const blocks = JSON.parse(examEditDraft.questionsText || '[]');
      if (!Array.isArray(blocks) || !blocks[blockIndex]?.subQuestions?.[questionIndex]) return;
      blocks[blockIndex].subQuestions[questionIndex] = {
        ...blocks[blockIndex].subQuestions[questionIndex],
        ...updates
      };
      setExamEditDraft(prev => ({
        ...prev,
        questionsText: JSON.stringify(blocks, null, 2)
      }));
    } catch (error) {
      platformNotify('لا يمكن تعديل الأسئلة الآن لأن صيغة الأسئلة غير سليمة.');
    }
  };

  const [editingFullContent, setEditingFullContent] = useState(null);
  const [contentEditMode, setContentEditMode] = useState('direct');
  const [contentEditDraft, setContentEditDraft] = useState({
    title: '', url: '', type: 'video', videoSection: 'explanation',
    grade: '3sec', isPremium: false, isPublic: false, allowedEmailsText: '',
    linkedExamId: '', estimatedDurationMinutes: '', branch: '', thumbnailUrl: '', imagePlacement: defaultImagePlacement
  });

  const [newSmartHw, setNewSmartHw] = useState({ title: '', answerKey: '', grade: '3sec', bookName: '' });

  // أكواد الاشتراك
  const [codeGenCount, setCodeGenCount] = useState(10);
  const [codeGenDays, setCodeGenDays] = useState(30);

  const {
    pendingUsers, activeUsersList, contentList, messagesList, examsList, examResults, examAccessOverrides,
    announcements, quotesList, smartHomeworks, hwResults, subscriptionCodes,
    assignments, assignmentSubmissions, mistakes, videoViews, passwordResetRequests,
    setPendingUsers, setActiveUsersList, setContentList, setMessagesList, setExamsList,
    setExamResults, setAnnouncements, setQuotesList, setSmartHomeworks, setHwResults,
    setSubscriptionCodes, setPasswordResetRequests, setExamAccessOverrides
  } = useAdminDashboardData();


  const audit = (action, details = {}) => logAdminAction(action, details, userData);

  // تحديث حالة زر الرجوع للموبايل للأدمن
  useBrowserBackTab({ activeTab, setActiveTab, fallbackTab: 'users' });

   const {
    updateStudentStatusSafely,
    handleApprove,
    handleReject,
    handleChangeUserStatus,
    handleToggleSubscription,
    generateSubscriptionCodes,
    handleDeleteCode,
    copyUnusedSubscriptionCodes,
    exportSubscriptionCodesCSV,
    extendPremiumForAll,
    handleDeleteUser,
    handleDeleteMessage,
    handleDeleteExam,
    handleDeleteAnnouncement,
    handleDeleteResult,
    openAdminResultReview,
    openFullExamEditor,
    recalculateExamResultsAfterAnswerEdit,
    saveFullExamEdit,
    openFullContentEditor,
    saveFullContentEdit,
    handleApproveSecurityContinue,
    handleApproveSecurityRestart,
    deleteDocsByCollection,
    handleDeleteAllResults,
    handleDeleteAllContent,
    handleDeleteAllExams,
    handleDeleteAllHomework,
    handleDeleteAllMistakes,
    getEssayDraftKey,
    handleSaveEssayGrade,
    sendWhatsAppToParent,
    openStudentProfile,
    handleUpdateExamTime,
    handleCreateSmartHw,
    handleReplyMessage,
    handleAddAnnouncement,
    handleSendStudentNotification,
    handleUpdateUser,
    generateAdminPassword,
    handleSendResetPassword,
    approveGrade,
    rejectGrade,
    handleImageUpload,
    handleVideoThumbnailSelect,
    handleExamImageSelect,
    handleFileSelect,
    handleAddContent,
    handleDeleteContent,
    parseExam,
    toggleLeaderboard,
    handleAddAutoReply,
    toggleAutoReply,
    deleteAutoReply,
    handleAddQuote,
    deleteQuote
  } = useAdminDashboardActions({
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
  });


  const filteredPendingUsers = pendingUsers.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredActiveUsers = activeUsersList.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredContentList = contentList.filter(c => adminGradeFilter === 'all' || c.grade === adminGradeFilter);

  const gatedExamsList = examsList.filter((exam) => !!exam.accessRule?.enabled);
  const openExamAccessOverride = async () => {
    if (!examOverrideDraft.examId || !examOverrideDraft.studentId) return platformNotify('اختر الامتحان والطالب أولاً.');
    const selectedExam = examsList.find((exam) => exam.id === examOverrideDraft.examId);
    const selectedStudent = activeUsersList.find((student) => student.id === examOverrideDraft.studentId || student.uid === examOverrideDraft.studentId);
    if (!selectedExam || !selectedStudent) return platformNotify('بيانات الامتحان أو الطالب غير مكتملة.');
    const overrideId = `${examOverrideDraft.examId}_${examOverrideDraft.studentId}`;
    await setDoc(doc(db, 'exam_access_overrides', overrideId), {
      examId: examOverrideDraft.examId,
      examTitle: selectedExam.title || '',
      studentId: examOverrideDraft.studentId,
      studentName: selectedStudent.name || selectedStudent.displayName || selectedStudent.email || 'طالب',
      studentEmail: selectedStudent.email || '',
      allowed: true,
      reason: examOverrideDraft.reason?.trim() || 'فتح استثنائي من الإدارة',
      createdBy: userData.uid || user?.uid || userData.email || 'admin',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    await audit('exam_access_override_granted', { title: 'فتح امتحان استثنائي لطالب', severity: 'warning', targetCollection: 'exam_access_overrides', targetDocId: overrideId, targetUserId: selectedStudent.id || examOverrideDraft.studentId, targetEmail: selectedStudent.email || '', meta: { examId: examOverrideDraft.examId, examTitle: selectedExam.title || '', reason: examOverrideDraft.reason?.trim() || 'فتح استثنائي من الإدارة' } });
    platformNotify('تم فتح الامتحان للطالب استثنائيًا.');
  };

  const revokeExamAccessOverride = async (override) => {
    if (!override?.id) return;
    if (!platformConfirm('هل تريد إلغاء الفتح الاستثنائي لهذا الطالب؟')) return;
    await updateDoc(doc(db, 'exam_access_overrides', override.id), {
      allowed: false,
      revokedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await audit('exam_access_override_revoked', { title: 'إلغاء فتح امتحان استثنائي', severity: 'warning', targetCollection: 'exam_access_overrides', targetDocId: override.id, targetUserId: override.studentId || '', targetEmail: override.studentEmail || '', meta: { examId: override.examId, examTitle: override.examTitle || '' } });
    platformNotify('تم إلغاء الاستثناء.');
  };

  const filteredExamsList = examsList.filter(e => adminGradeFilter === 'all' || e.grade === adminGradeFilter);
    const filteredExamResultsForAdmin = examResults.filter(result => {
      const exam = examsList.find(e => e.id === result.examId);
      if (adminGradeFilter !== 'all' && exam?.grade && exam.grade !== adminGradeFilter) return false;
      if (resultsFilter === 'essay_pending') return !!result.hasEssay && getUnreviewedEssayCount(result, exam) > 0;
      if (resultsFilter === 'cheating_alerts') return safeNumber(result.antiCheatWarnings, 0) > 0 || result.status === 'cheated';
      return true;
  });

  const dashboardContext = {
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
    updateStudentStatusSafely,
    handleApprove,
    handleReject,
    handleChangeUserStatus,
    handleToggleSubscription,
    generateSubscriptionCodes,
    handleDeleteCode,
    copyUnusedSubscriptionCodes,
    exportSubscriptionCodesCSV,
    extendPremiumForAll,
    handleDeleteUser,
    handleDeleteMessage,
    handleDeleteExam,
    handleDeleteAnnouncement,
    handleDeleteResult,
    openAdminResultReview,
    openFullExamEditor,
    recalculateExamResultsAfterAnswerEdit,
    saveFullExamEdit,
    openFullContentEditor,
    saveFullContentEdit,
    handleApproveSecurityContinue,
    handleApproveSecurityRestart,
    deleteDocsByCollection,
    handleDeleteAllResults,
    handleDeleteAllContent,
    handleDeleteAllExams,
    handleDeleteAllHomework,
    handleDeleteAllMistakes,
    getEssayDraftKey,
    handleSaveEssayGrade,
    sendWhatsAppToParent,
    openStudentProfile,
    handleUpdateExamTime,
    handleCreateSmartHw,
    handleReplyMessage,
    handleAddAnnouncement,
    handleSendStudentNotification,
    handleUpdateUser,
    handleSendResetPassword,
    AdminPasswordResetRequestsPanel,
    openExamAccessOverride,
    revokeExamAccessOverride,
    approveGrade,
    rejectGrade,
    handleFileSelect,
    handleVideoThumbnailSelect,
    handleExamImageSelect,
    handleAddContent,
    handleDeleteContent,
    parseExam,
    toggleLeaderboard,
    handleAddAutoReply,
    toggleAutoReply,
    deleteAutoReply,
    handleAddQuote,
    deleteQuote,
    filteredPendingUsers,
    filteredActiveUsers,
    filteredContentList,
    filteredExamsList,
    pendingUsers,
    activeUsersList,
    contentList,
    messagesList,
    examsList,
    examResults,
    examAccessOverrides,
    gatedExamsList,
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
    setPasswordResetRequests
  };



  return {
    userData,
    activeTab,
    setActiveTab,
    adminGradeFilter,
    setAdminGradeFilter,
    dashboardContext
  };
};

export default useAdminDashboardController;
