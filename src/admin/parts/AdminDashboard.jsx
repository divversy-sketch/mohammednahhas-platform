import { useState, useEffect, useMemo, lazy, Suspense } from 'react';

import { doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';


import { db } from '../../services/firebase';


import { validateEgyptianPhones } from '../../shared/utils/phone';
import { FloatingArabicBackground } from '../../features/home/HomeWidgets';


import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '../../services/firebaseContentUpload';
import { platformNotify, platformConfirm, platformPrompt, sendSystemNotification, safeNumber, VIDEO_EXAM_UNLOCK_PERCENT, getQuestionMaxScore, calculateDetailedExamMetrics } from '../../shared/core/platformShared.jsx';
import { DebugPanel } from '../../shared/core/debugTools.jsx';


import { useAdminDashboardData } from '../hooks/useAdminDashboardData.js';
import AdminHeader from '../components/AdminHeader.jsx';
import AdminSidebar from '../components/AdminSidebar.jsx';


import { adminSecureFunctions } from '../services/adminSecureFunctions.js';




const AdminDashboardTabs = lazy(() => import('./AdminDashboardTabs.jsx'));
const AdminDashboardModals = lazy(() => import('./AdminDashboardModals.jsx'));
const AdminPasswordResetRequestsPanel = lazy(() => import('./AdminPasswordResetRequestsPanel.jsx'));

const AdminLazyFallback = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-600 shadow-sm">
    جاري تحميل أدوات الإدارة...
  </div>
);

export const AdminDashboard = ({ user, adminProfile }) => {
  const userData = { ...(user || {}), ...(adminProfile || {}) };
  const [adminReviewExamData, setAdminReviewExamData] = useState(null);
  const [adminReviewResult, setAdminReviewResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [adminExamView, setAdminExamView] = useState('manage');
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [examBuilder, setExamBuilder] = useState({
    title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '', isPremium: false,
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
    accessCode: '', isPremium: false, questionsText: '',
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
    linkedExamId: '', estimatedDurationMinutes: '', branch: ''
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

  // تحديث حالة زر الرجوع للموبايل للأدمن
  useEffect(() => {
      window.history.pushState({ tab: activeTab }, '');
      const handlePopState = (e) => {
          if (e.state && e.state.tab) { setActiveTab(e.state.tab); } 
          else { setActiveTab('users'); }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // بيانات لوحة الإدارة الحية انتقلت إلى useAdminDashboardData.

  const updateStudentStatusSafely = async (id, status) => {
    try {
      await adminSecureFunctions.setStudentStatus(id, status);
    } catch (error) {
      console.warn('setStudentStatus callable failed; trying Firestore admin fallback:', error?.message);
      await updateDoc(doc(db, 'users', id), { status, updatedAt: serverTimestamp() });
    }
  };

  const handleApprove = async (id) => {
    await updateStudentStatusSafely(id, 'active');
    sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح.");
  };

  const handleReject = async (id) => {
      await updateStudentStatusSafely(id, 'blocked');
  };
  
  const handleChangeUserStatus = async (id, newStatus) => {
      await updateStudentStatusSafely(id, newStatus);
  };

  const handleToggleSubscription = async (user) => {
      const isCurrentlyPremium = user.subscriptionStatus === 'premium';
      if (isCurrentlyPremium) {
          if(platformConfirm("تحويل الطالب لباقة مجانية؟")) {
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'free', subscriptionExpiry: null });
          }
      } else {
          const days = platformPrompt("كم يوم تريد تفعيل الباقة لهذا الطالب؟", "30");
          if (days && !isNaN(days)) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + parseInt(days));
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'premium', subscriptionExpiry: expiryDate });
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

  const exportSubscriptionCodesCSV = () => {
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
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscription_codes_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
      platformNotify('تم تمديد اشتراكات VIP الحالية.');
  };


  const handleDeleteUser = async (id) => {
    if (!id) return;
    const student = activeUsersList.find((u) => u.id === id) || pendingUsers.find((u) => u.id === id) || {};
    const label = student.name || student.email || id;
    const confirmed = platformConfirm(`تحذير مهم: سيتم حذف الطالب "${label}" من المنصة ومن Firebase Authentication.\n\nسيتم أرشفة نسخة في deleted_users وحذف بياناته المرتبطة مثل النتائج والمشاهدات والاشتراكات. هل أنت متأكد؟`);
    if (!confirmed) return;
    try {
      const result = await adminSecureFunctions.deleteStudentAccount(id, { archiveBeforeDelete: true, deleteRelatedData: true });
      platformNotify(`تم حذف الطالب من المنصة ومن Firebase Auth. تم حذف ${result?.relatedDeletedCount || 0} سجل مرتبط.`, 'success');
    } catch (error) {
      platformNotify(error?.message || 'تعذر حذف الطالب الآن.', 'error');
    }
  };
  const handleDeleteMessage = async (id) => { if(platformConfirm("حذف الرسالة؟")) await adminSecureFunctions.deleteAdminDocument('messages', id); };
  const handleDeleteExam = async (id) => {
    if (!platformConfirm("حذف الامتحان؟")) return;
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
    platformNotify('تم حذف النتيجة.');
  };

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

  const openFullExamEditor = (exam) => {
    const hasResults = examResults.some(r => r.examId === exam.id);
    setEditingFullExam({ ...exam, hasResults });
    setExamEditMode(hasResults ? 'clone' : 'direct');
    setRecalculateAfterExamEdit(hasResults);
    setExamEditDraft({
      title: exam.title || '',
      grade: exam.grade || '3sec',
      duration: safeNumber(exam.duration, 60),
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      accessCode: exam.accessCode || '',
      isPremium: !!exam.isPremium,
      questionsText: JSON.stringify(exam.questions || [], null, 2),
      accessRule: {
        enabled: !!exam.accessRule?.enabled,
        requiredExamId: exam.accessRule?.requiredExamId || '',
        requiredPercentage: safeNumber(exam.accessRule?.requiredPercentage, 70),
        visibilityWhenLocked: 'locked',
        useBestAttempt: exam.accessRule?.useBestAttempt !== false,
        allowAdminOverride: exam.accessRule?.allowAdminOverride !== false
      }
    });
  };


  const recalculateExamResultsAfterAnswerEdit = async (examId, updatedExam) => {
    const resultsQuery = query(collection(db, 'exam_results'), where('examId', '==', examId));
    const snap = await getDocs(resultsQuery);

    if (snap.empty) {
      platformNotify('تم تعديل الامتحان، ولا توجد نتائج قديمة لإعادة تصحيحها.');
      return { updated: 0 };
    }

    let updatedCount = 0;
    let batch = writeBatch(db);
    let batchOps = 0;

    for (const resultDoc of snap.docs) {
      const result = resultDoc.data();
      const answers = result.answers || {};
      const essayGrades = result.essayGrades || result.essayScores || result.manualEssayGrades || {};

      const metrics = calculateDetailedExamMetrics(updatedExam, answers, essayGrades);
      const branchRows = Object.entries(metrics.branchStats || {}).map(([branch, data]) => {
        const pct = data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 1)) * 100) : 0;
        return {
          branch,
          earned: safeNumber(data.earned, 0),
          possible: safeNumber(data.possible, 0),
          percentage: pct,
          correct: safeNumber(data.correct, 0),
          wrong: safeNumber(data.wrong, 0),
          answered: safeNumber(data.answered, 0),
          total: safeNumber(data.total, 0),
          essay: safeNumber(data.essay, 0)
        };
      }).sort((a, b) => a.percentage - b.percentage);

      const weakBranches = branchRows.filter(b => b.percentage < 70);
      const mcqScore = metrics.questions
        .filter(q => q.type !== 'essay')
        .reduce((sum, q) => sum + (answers[q.id] === q.correctIdx ? getQuestionMaxScore(q) : 0), 0);

      batch.update(resultDoc.ref, {
        score: metrics.totalScore,
        mcqScore,
        total: metrics.totalPossible,
        percentage: metrics.percentage,
        branchStats: metrics.branchStats,
        branchAnalysis: branchRows,
        weakBranches,
        performanceAnalysis: {
          percentage: metrics.percentage,
          totalScore: metrics.totalScore,
          totalPossible: metrics.totalPossible,
          weakBranches,
          recalculatedBecause: 'exam_answers_edited',
          recalculatedAt: new Date().toISOString()
        },
        examTitle: updatedExam.title,
        examVersionAtRecalculation: safeNumber(updatedExam.version, 1) + 1,
        recalculatedAt: serverTimestamp(),
        recalculatedByAdmin: true
      });

      updatedCount += 1;
      batchOps += 1;

      if (batchOps >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchOps = 0;
      }
    }

    if (batchOps > 0) await batch.commit();

    return { updated: updatedCount };
  };

  const saveFullExamEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingFullExam) return;
    if (!examEditDraft.title.trim()) return platformNotify('اكتب عنوان الامتحان.');
    if (!examEditDraft.accessCode.trim()) return platformNotify('اكتب كود الامتحان.');
    if (!examEditDraft.startTime || !examEditDraft.endTime) return platformNotify('حدد وقت البداية والنهاية.');

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(examEditDraft.questionsText || '[]');
      if (!Array.isArray(parsedQuestions)) throw new Error('questions must be array');
    } catch (err) {
      return platformNotify('صيغة الأسئلة غير صحيحة. يجب أن تكون JSON Array. لو مش متأكد، لا تعدل جزء الأسئلة.');
    }

    const payload = {
      title: examEditDraft.title.trim(),
      grade: examEditDraft.grade,
      duration: safeNumber(examEditDraft.duration, 60),
      startTime: examEditDraft.startTime,
      endTime: examEditDraft.endTime,
      accessCode: examEditDraft.accessCode.trim(),
      isPremium: !!examEditDraft.isPremium,
      accessRule: {
        enabled: !!examEditDraft.accessRule?.enabled && !!examEditDraft.accessRule?.requiredExamId,
        requiredExamId: examEditDraft.accessRule?.requiredExamId || '',
        requiredPercentage: Math.min(100, Math.max(0, safeNumber(examEditDraft.accessRule?.requiredPercentage, 70))),
        visibilityWhenLocked: 'locked',
        useBestAttempt: examEditDraft.accessRule?.useBestAttempt !== false,
        allowAdminOverride: true
      },
      questions: parsedQuestions,
      updatedAt: serverTimestamp()
    };

    if (examEditMode === 'direct') {
      if (editingFullExam.hasResults && !platformConfirm('هذا الامتحان له نتائج سابقة. التعديل المباشر قد يغير شكل المراجعة والتحليل للنتائج القديمة. هل تريد التعديل المباشر فعلاً؟')) return;
      await updateDoc(doc(db, 'exams', editingFullExam.id), {
        ...payload,
        version: increment(1),
        lastEditMode: 'direct',
        answersLastEditedAt: serverTimestamp()
      });

      if (editingFullExam.hasResults && recalculateAfterExamEdit) {
        const recalc = await recalculateExamResultsAfterAnswerEdit(editingFullExam.id, { ...editingFullExam, ...payload });
        platformNotify(`تم تعديل الامتحان مباشرة وإعادة تصحيح ${recalc.updated} نتيجة قديمة تلقائيًا.`);
      } else {
        platformNotify('تم تعديل الامتحان مباشرة.');
      }
    } else {
      await addDoc(collection(db, 'exams'), {
        ...payload,
        title: payload.title.includes('نسخة') ? payload.title : `${payload.title} - نسخة جديدة`,
        originalExamId: editingFullExam.id,
        clonedFrom: editingFullExam.id,
        version: safeNumber(editingFullExam.version, 1) + 1,
        createdAt: serverTimestamp(),
        source: 'clone_edit'
      });
      platformNotify('تم إنشاء نسخة جديدة من الامتحان بنجاح. النتائج القديمة محفوظة كما هي.');
    }

    setEditingFullExam(null);
  };

  const openFullContentEditor = (item) => {
    const allowedEmailsText = Array.isArray(item.allowedEmails) ? item.allowedEmails.join(', ') : (item.allowedEmails || '');
    setEditingFullContent(item);
    setContentEditMode('direct');
    setContentEditDraft({
      title: item.title || '',
      url: item.url || item.file || '',
      type: item.type || 'video',
      videoSection: item.videoSection || 'explanation',
      grade: item.grade || '3sec',
      isPremium: !!item.isPremium,
      isPublic: !!item.isPublic,
      allowedEmailsText,
      linkedExamId: item.linkedExamId || '',
      estimatedDurationMinutes: item.estimatedDurationMinutes || '',
      branch: item.branch || ''
    });
  };

  const saveFullContentEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingFullContent) return;
    if (!contentEditDraft.title.trim()) return platformNotify('اكتب عنوان المحتوى.');
    if (!contentEditDraft.url.trim()) return platformNotify('أدخل رابط المحتوى.');
    if (contentEditDraft.type === 'video' && contentEditDraft.linkedExamId && safeNumber(contentEditDraft.estimatedDurationMinutes, 0) <= 0) {
      return platformNotify('لو الفيديو مربوط بامتحان لازم تكتب مدة الفيديو بالدقائق.');
    }

    const allowedEmails = contentEditDraft.allowedEmailsText
      ? contentEditDraft.allowedEmailsText.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    const payload = {
      title: contentEditDraft.title.trim(),
      url: contentEditDraft.url.trim(),
      file: contentEditDraft.url.trim(),
      type: contentEditDraft.type,
      videoSection: contentEditDraft.type === 'video' ? contentEditDraft.videoSection : '',
      grade: contentEditDraft.grade,
      isPremium: !!contentEditDraft.isPremium,
      isPublic: !!contentEditDraft.isPublic,
      allowedEmails,
      branch: contentEditDraft.branch || '',
      linkedExamId: contentEditDraft.type === 'video' ? (contentEditDraft.linkedExamId || '') : '',
      estimatedDurationMinutes: contentEditDraft.type === 'video' ? safeNumber(contentEditDraft.estimatedDurationMinutes, 0) : 0,
      videoExamUnlockPercent: contentEditDraft.type === 'video' && contentEditDraft.linkedExamId ? VIDEO_EXAM_UNLOCK_PERCENT : 0,
      updatedAt: serverTimestamp()
    };

    if (contentEditMode === 'direct') {
      await updateDoc(doc(db, 'content', editingFullContent.id), { ...payload, version: increment(1), lastEditMode: 'direct' });
      platformNotify('تم تعديل المحتوى مباشرة.');
    } else {
      await addDoc(collection(db, 'content'), {
        ...payload,
        title: payload.title.includes('نسخة') ? payload.title : `${payload.title} - نسخة جديدة`,
        originalContentId: editingFullContent.id,
        clonedFrom: editingFullContent.id,
        version: safeNumber(editingFullContent.version, 1) + 1,
        createdAt: serverTimestamp(),
        source: 'clone_edit'
      });
      platformNotify('تم إنشاء نسخة جديدة من المحتوى.');
    }

    setEditingFullContent(null);
  };

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

  const handleUpdateExamTime = async (e) => {
      e.preventDefault();
      if (!newEndTime) return;
      try {
          await updateDoc(doc(db, 'exams', editingExamTime.id), { endTime: newEndTime });
          platformNotify("تم تمديد وقت الامتحان بنجاح!");
          setEditingExamTime(null);
          setNewEndTime('');
      } catch (error) { console.error("Error updating exam time:", error); platformNotify("حدث خطأ أثناء تعديل الوقت."); }
  };

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

  const handleUpdateUser = async (e) => { 
      e.preventDefault(); 
      if(!editingUser) return; 

      const validation = validateEgyptianPhones(editingUser.phone, editingUser.parentPhone);
      if (!validation.ok) return platformNotify(validation.message);

      await updateDoc(doc(db, 'users', editingUser.id), { 
          name: editingUser.name?.trim(), phone: validation.normalizedStudentPhone, parentPhone: validation.normalizedParentPhone, grade: editingUser.grade 
      }); 
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
          try { await navigator.clipboard?.writeText(newPassword); } catch (_) {}
          platformNotify(`تم تغيير كلمة السر. الكلمة الجديدة: ${newPassword} — تم نسخها إن أمكن.`, 'success');
      } catch (error) {
          platformNotify(error?.message || 'فشل تغيير كلمة السر من السيرفر.', 'error');
      }
  };
  
  const approveGrade = async (user) => {
      if (!user.requestedGrade) return;
      await updateDoc(doc(db, 'users', user.id), { grade: user.requestedGrade, requestedGrade: null, gradeUpdateStatus: null });
      platformNotify(`تم تغيير مرحلة الطالب ${user.name} بنجاح.`);
  };

  const rejectGrade = async (user) => {
      await updateDoc(doc(db, 'users', user.id), { requestedGrade: null, gradeUpdateStatus: null });
      platformNotify(`تم رفض طلب تغيير المرحلة للطالب ${user.name}.`);
  };

  const handleFileSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploading(true);
      setUploadProgress(1);
      try {
          // صفحة المحتوى العام منفصلة عن الكورسات:
          // HTML صغير مثل 120KB يتم حفظه كنص داخل Firestore ويفتح داخل المنصة فورًا.
          // باقي الملفات تترفع على Firebase Storage. الكورسات فقط تستخدم Cloudinary.
          const autoType = detectContentType(file);
          const uploaded = autoType === 'html'
            ? await readHtmlFileAsInlineContent(file)
            : await uploadToFirebaseContent(file, {
                folder: newContent.type || 'general',
                onProgress: (percent) => setUploadProgress(percent)
            });
          setNewContent({
              ...newContent,
              url: uploaded.url,
              htmlContent: uploaded.htmlContent || '',
              fileName: uploaded.name,
              fileSize: uploaded.size,
              mimeType: uploaded.mimeType,
              firebaseStoragePath: uploaded.path,
              storageProvider: uploaded.storageProvider || 'firebase',
              type: autoType === 'html' ? 'html' : (newContent.type === 'video' && autoType !== 'video' ? autoType : (newContent.type || autoType))
          });
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 2000);
      } catch (err) {
          platformNotify(err?.message || 'فشل تجهيز/رفع الملف.');
      } finally {
          setIsUploading(false);
          e.target.value = null;
      }
  };

  const handleAddContent = async (e) => { 
      e.preventDefault(); 
      const allowedEmailsArray = newContent.allowedEmails 
        ? newContent.allowedEmails.split(',').map(email => email.trim()) 
        : [];

      if (!newContent.title.trim()) return platformNotify('اكتب عنوان المحتوى أولاً.');
      if (!newContent.url.trim()) return platformNotify('أضف رابط المحتوى أو ارفع ملفاً.');
      if (newContent.type === 'video' && newContent.linkedExamId && safeNumber(newContent.estimatedDurationMinutes, 0) <= 0) {
          return platformNotify('مهم: أدخل مدة الفيديو بالدقائق حتى يتم فتح امتحان الفيديو بعد مشاهدة 75% بدقة، خصوصًا مع YouTube.');
      }

      const contentData = { 
          ...newContent, 
          title: newContent.title.trim(),
          url: newContent.url.trim(),
          file: newContent.url.trim(), 
          allowedEmails: allowedEmailsArray,
          linkedExamId: newContent.type === 'video' ? (newContent.linkedExamId || '') : '',
          estimatedDurationMinutes: newContent.type === 'video' ? safeNumber(newContent.estimatedDurationMinutes, 0) : 0,
          videoExamUnlockPercent: newContent.type === 'video' && newContent.linkedExamId ? VIDEO_EXAM_UNLOCK_PERCENT : 0,
          storageProvider: newContent.storageProvider || (newContent.firebaseStoragePath ? 'firebase' : ''),
          firebaseStoragePath: newContent.firebaseStoragePath || '',
          mimeType: newContent.mimeType || '',
          fileName: newContent.fileName || '',
          fileSize: newContent.fileSize || 0,
          htmlContent: newContent.type === 'html' ? (newContent.htmlContent || '') : '',
          createdAt: new Date() 
      };
      
      await addDoc(collection(db, 'content'), contentData);
      
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), { text: `تم إضافة درس جديد: ${newContent.title}`, grade: newContent.grade, createdAt: serverTimestamp() });
      } 
      
      platformNotify("تم النشر!"); 
      setNewContent({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '', storageProvider: '', firebaseStoragePath: '', mimeType: '', fileName: '', fileSize: 0, htmlContent: '' });
  }; 
  
  const handleDeleteContent = async (id) => { 
      if(platformConfirm("حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id)); 
  };

  const parseExam = async () => {
    if (!bulkText.trim()) return platformNotify("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return platformNotify("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return platformNotify("يرجى تحديد وقت البدء والانتهاء");

    const lines = bulkText.split('\n').map(l => l.trim());
    const blocks = [];
    let currentBlock = { text: '', subQuestions: [] };
    let currentQuestion = null;
    let currentBranch = 'عام';
    let isReadingPassage = false;

    const pushCurrentQuestion = () => {
        if (!currentQuestion) return;

        if (currentQuestion.type === 'essay') {
            currentBlock.subQuestions.push({
                id: currentQuestion.id,
                type: 'essay',
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch,
                modelAnswer: currentQuestion.modelAnswer || ''
            });
            currentQuestion = null;
            return;
        }

        if (currentQuestion.text?.trim() && currentQuestion.options.length >= 2) {
            if (currentQuestion.correctIdx < 0) currentQuestion.correctIdx = 0;
            currentBlock.subQuestions.push({
                ...currentQuestion,
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch
            });
        }
        currentQuestion = null;
    };

    const pushCurrentBlock = () => {
        pushCurrentQuestion();
        if (currentBlock.text.trim() || currentBlock.subQuestions.length > 0) {
            blocks.push({
                text: currentBlock.text.trim(),
                subQuestions: currentBlock.subQuestions
            });
        }
        currentBlock = { text: '', subQuestions: [] };
    };

    lines.forEach((line) => {
        if (!line) {
            pushCurrentQuestion();
            return;
        }

        const branchMatch = line.match(/^#\s*(?:فرع|الفرع)\s*:\s*(.+)$/);
        if (branchMatch) {
            pushCurrentQuestion();
            currentBranch = branchMatch[1].trim() || 'عام';
            return;
        }

        if (line === 'بداية القطعة') {
            pushCurrentBlock();
            isReadingPassage = true;
            return;
        }

        if (line === 'نهاية القطعة') {
            isReadingPassage = false;
            return;
        }

        if (line === 'حذف القطعة') {
            pushCurrentBlock();
            isReadingPassage = false;
            return;
        }

        if (isReadingPassage) {
            currentBlock.text += (currentBlock.text ? '\n' : '') + line;
            return;
        }

        const essayMatch = line.match(/^#?\s*(?:مقالي|essay)\s*[:：\-\)\.]?\s*(.+)$/i);
        if (essayMatch) {
            pushCurrentQuestion();
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'essay',
                text: (essayMatch[1] || '').trim(),
                branch: currentBranch,
                modelAnswer: ''
            };
            return;
        }

        const isCorrect = line.startsWith('*');
        const cleanLine = isCorrect ? line.slice(1).trim() : line.trim();

        if (!currentQuestion) {
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'mcq',
                text: cleanLine.replace(/^(س|سؤال)\s*[:：-]\s*/i, ''),
                options: [],
                correctIdx: -1,
                branch: currentBranch
            };
            return;
        }

        if (currentQuestion.type === 'essay') {
            if (cleanLine.startsWith('نموذج:') || cleanLine.startsWith('إجابة نموذجية:')) {
                currentQuestion.modelAnswer = cleanLine.replace('نموذج:', '').replace('إجابة نموذجية:', '').trim();
            } else {
                currentQuestion.text += '\n' + cleanLine;
            }
            return;
        }

        currentQuestion.options.push(cleanLine);
        if (isCorrect) currentQuestion.correctIdx = currentQuestion.options.length - 1;

        if (currentQuestion.options.length >= 4) {
            pushCurrentQuestion();
        }
    });

    pushCurrentBlock();

    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return platformNotify("لم يتم التعرف على الأسئلة بشكل صحيح. افصل بين كل سؤال بسطر فارغ، واستخدم #فرع: للفروع و #مقالي: للسؤال المقالي.");

    await addDoc(collection(db, 'exams'), { 
        title: examBuilder.title, grade: examBuilder.grade, duration: examBuilder.duration, 
        startTime: examBuilder.startTime, endTime: examBuilder.endTime, accessCode: examBuilder.accessCode, 
        isPremium: examBuilder.isPremium,
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

    await addDoc(collection(db, 'notifications'), { text: `امتحان جديد: ${examBuilder.title}`, grade: examBuilder.grade, createdAt: serverTimestamp() });
    setBulkText(""); 
    platformNotify(`تم نشر الامتحان بنجاح!`);
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
    await addDoc(collection(db, 'admin_audit_logs'), {
      action: 'exam_access_override_granted',
      examId: examOverrideDraft.examId,
      studentId: examOverrideDraft.studentId,
      reason: examOverrideDraft.reason?.trim() || 'فتح استثنائي من الإدارة',
      createdAt: serverTimestamp()
    }).catch(() => null);
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
    await addDoc(collection(db, 'admin_audit_logs'), {
      action: 'exam_access_override_revoked',
      examId: override.examId,
      studentId: override.studentId,
      createdAt: serverTimestamp()
    }).catch(() => null);
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

  return (
    <div className="min-h-screen bg-slate-100 font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      <DebugPanel user={user} />
      <FloatingArabicBackground />

      <Suspense fallback={<AdminLazyFallback />}>
        <AdminDashboardModals ctx={dashboardContext} />
      </Suspense>

      <AdminHeader adminGradeFilter={adminGradeFilter} setAdminGradeFilter={setAdminGradeFilter} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-6 relative z-10">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} adminProfile={adminProfile} />

        <Suspense fallback={<AdminLazyFallback />}>
          <AdminDashboardTabs ctx={dashboardContext} />
        </Suspense>
      </div>
    </div>
  );
};

export default AdminDashboard;
