import React, { useState, useEffect, useRef, useMemo } from 'react';
import {  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail 
} from 'firebase/auth';
import {  doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, 
  onSnapshot, updateDoc, deleteDoc, orderBy, serverTimestamp, writeBatch, limit, increment 
} from 'firebase/firestore';
import { 
  PlayCircle, FileText, LogOut, User, GraduationCap, Quote, CheckCircle, 
  Lock, Mail, ChevronRight, Menu, X, Loader2, AlertTriangle, PlusCircle, 
  Check, Trash2, Eye, ShieldAlert, Video, UploadCloud, Phone, Edit, KeyRound,
  MessageSquare, Send, MessageCircle, Facebook, BookOpen, Feather, Radio, 
  ExternalLink, ClipboardList, Timer, AlertOctagon, Flag, Save, HelpCircle, 
  Reply, Unlock, Layout, Settings, Trophy, Megaphone, Bell, Download, XCircle, 
  Calendar, Clock, FileWarning, Settings as GearIcon, Star, Bot, Power, Upload,
  Users, PenTool, Code, Sparkles, Lamp, Ban, Shield, RefreshCw, Link as LinkIcon, 
  History, Camera, QrCode, FileCheck, MousePointerClick, BarChart3, Layers,
  BrainCircuit, Headphones, DownloadCloud, PenLine, Play, Pause, SkipForward, 
  Target, AlertCircle, Crown, CreditCard, Key, Wand2, WalletCards, Smartphone
} from '../../shared/icons/lucide-shim.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, savePushTokenForUser, setupForegroundPushListener } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import MobileStudentBottomNav from '../../features/student/MobileStudentBottomNav';
import MobileExamHelperStyles from '../../shared/components/MobileExamHelperStyles';
import DesignSystemLoader from '../../shared/components/DesignSystemLoader';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';
import { normalizeEgyptPhone, isValidEgyptPhone, validateEgyptianPhones } from '../../shared/utils/phone';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground, WisdomBox, Announcements, Leaderboard } from '../../features/home/HomeWidgets';
import PomodoroFocusMode from '../../features/study/PomodoroFocusMode';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { AdminCoursesManager, StudentCoursesHub } from '../../features/courses/CourseSystem';
import { uploadToCloudinary } from '../../services/cloudinaryUpload';
import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '../../services/firebaseContentUpload';
import {
  platformNotify,
  platformConfirm,
  platformPrompt,
  ToastCenter,
  formatWatchTime,
  requestNotificationPermission,
  sendSystemNotification,
  getYouTubeID,
  PLATFORM_WHATSAPP_NUMBER,
  openPlatformWhatsApp,
  WhatsAppContactButton,
  renderBracketHighlightedText,
  getQuestionsForExam,
  generatePDF,
  safeNumber,
  getResultPercentage,
  getGradeBadge,
  VIDEO_EXAM_UNLOCK_PERCENT,
  InlineTabs,
  TabPaneCard,
  getQuestionMaxScore,
  extractAllQuestions,
  calculateDetailedExamMetrics,
  getPerformanceInsights,
  getReviewRecommendations,
  StudentLocalAdvice,
  StudentLocalHomeCoach,
  LocalQuestionExplanation,
  LocalEssayReviewBox
} from '../../shared/core/platformShared.jsx';
import { isActiveAdminSnapshot, getInitialRouteMode, navigatePlatform, DebugCollector, DebugPanel } from '../../shared/core/debugTools.jsx';



import AdminPaymentRequestsPanel from './AdminPaymentRequestsPanel.jsx';
import AdminPerformanceAnalytics from './AdminPerformanceAnalytics.jsx';
import AdminProDashboard from './AdminProDashboard.jsx';
import AdminQuestionDeepAnalytics from './AdminQuestionDeepAnalytics.jsx';
import AdvancedAntiCheatInsights from './AdvancedAntiCheatInsights.jsx';
import AssignmentsManager from './AssignmentsManager.jsx';
import ExamRunner from '../../shared/platformParts/ExamRunner.jsx';
import LeaderboardPanel from '../../shared/platformParts/LeaderboardPanel.jsx';
import QuestionBankManager from './QuestionBankManager.jsx';
import SmartSubscriptionManager from './SmartSubscriptionManager.jsx';
import { useAdminDashboardData } from '../hooks/useAdminDashboardData.js';
import AdminHeader from '../components/AdminHeader.jsx';
import AdminSidebar from '../components/AdminSidebar.jsx';

export const AdminDashboard = ({ user }) => {
  const userData = user || {};
  const [adminReviewExamData, setAdminReviewExamData] = useState(null);
  const [adminReviewResult, setAdminReviewResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [adminExamView, setAdminExamView] = useState('manage');
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [examBuilder, setExamBuilder] = useState({ title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '', isPremium: false });
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
    accessCode: '', isPremium: false, questionsText: ''
  });

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
    pendingUsers, activeUsersList, contentList, messagesList, examsList, examResults,
    announcements, quotesList, smartHomeworks, hwResults, subscriptionCodes,
    setPendingUsers, setActiveUsersList, setContentList, setMessagesList, setExamsList,
    setExamResults, setAnnouncements, setQuotesList, setSmartHomeworks, setHwResults,
    setSubscriptionCodes
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

  const handleApprove = async (id) => {
    await updateDoc(doc(db,'users',id), {status:'active'});
    sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح.");
  };

  const handleReject = async (id) => {
      await updateDoc(doc(db,'users',id), {status:'rejected'});
  };
  
  const handleChangeUserStatus = async (id, newStatus) => {
      await updateDoc(doc(db,'users',id), {status: newStatus});
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
          const batch = writeBatch(db);
          for(let i=0; i<codeGenCount; i++) {
              const codeString = 'NAHAS-' + Math.random().toString(36).substring(2,8).toUpperCase();
              const newDocRef = doc(collection(db, 'subscription_codes'));
              batch.set(newDocRef, {
                  code: codeString,
                  days: parseInt(codeGenDays),
                  used: false,
                  usedBy: null,
                  createdAt: serverTimestamp()
              });
          }
          await batch.commit();
          platformNotify("تم توليد الأكواد بنجاح!");
      }
  };

  const handleDeleteCode = async (id) => {
      if(platformConfirm("حذف هذا الكود؟")) await deleteDoc(doc(db, 'subscription_codes', id));
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


  const handleDeleteUser = async (id) => { if(platformConfirm("حذف نهائي؟")) await deleteDoc(doc(db,'users',id)); };
  const handleDeleteMessage = async (id) => { if(platformConfirm("حذف الرسالة؟")) await deleteDoc(doc(db,'messages',id)); };
  const handleDeleteExam = async (id) => { if(platformConfirm("حذف الامتحان؟")) await deleteDoc(doc(db, 'exams', id)); };
  const handleDeleteAnnouncement = async (id) => { if(platformConfirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id)); };
  const handleDeleteResult = async (resultId) => { if(platformConfirm("حذف النتيجة؟")) await deleteDoc(doc(db, 'exam_results', resultId)); };

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
      questionsText: JSON.stringify(exam.questions || [], null, 2)
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

    const safeRemainingTime = safeNumber(result.remainingTime, safeNumber(result.totalTime, 60) * 60);
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
      score: 0,
      total: 0,
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
  
  const handleSendResetPassword = async (email) => { 
      if(platformConfirm(`إرسال رابط تغيير كلمة السر لـ ${email}؟`)) await sendPasswordResetEmail(auth, email); 
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
  const filteredExamsList = examsList.filter(e => adminGradeFilter === 'all' || e.grade === adminGradeFilter);
    const filteredExamResultsForAdmin = examResults.filter(result => {
      const exam = examsList.find(e => e.id === result.examId);
      if (adminGradeFilter !== 'all' && exam?.grade && exam.grade !== adminGradeFilter) return false;
      if (resultsFilter === 'essay_pending') return !!result.hasEssay && getUnreviewedEssayCount(result, exam) > 0;
      if (resultsFilter === 'cheating_alerts') return safeNumber(result.antiCheatWarnings, 0) > 0 || result.status === 'cheated';
      return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      <DebugPanel user={user} />
      <FloatingArabicBackground />

      {editingExamTime && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                  <button onClick={() => setEditingExamTime(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                  <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2"><Calendar size={24}/> تمديد وقت الامتحان</h3>
                  <p className="text-sm text-slate-600 mb-6 font-bold">{editingExamTime.title}</p>
                  <form onSubmit={handleUpdateExamTime}>
                      <label className="block text-sm font-bold mb-2 text-slate-800">تاريخ ووقت الانتهاء الجديد:</label>
                      <input type="datetime-local" className="w-full border-2 border-blue-200 p-3 rounded-xl mb-6 bg-blue-50 focus:border-blue-500 outline-none transition" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50">حفظ التعديل</button>
                  </form>
              </div>
          </div>
      )}


      {adminReviewExamData && adminReviewResult && (
        <ExamRunner
          exam={adminReviewExamData.exam}
          user={adminReviewExamData.user}
          existingResult={adminReviewResult}
          isReviewMode={true}
          onClose={() => {
            setAdminReviewExamData(null);
            setAdminReviewResult(null);
          }}
        />
      )}

      {editingFullExam && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Edit size={22}/> تعديل الامتحان بالكامل</h3>
              <button onClick={() => setEditingFullExam(null)} className="text-slate-400 hover:text-red-600"><X size={26}/></button>
            </div>

            {editingFullExam.hasResults && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-bold leading-relaxed">
                هذا الامتحان له نتائج طلاب سابقة. عند تعديل الإجابات الصحيحة يمكنك إعادة تصحيح نتائج الطلاب تلقائيًا بناءً على الإجابات الجديدة.
              </div>
            )}

            {editingFullExam.hasResults && examEditMode === 'direct' && (
              <label className="mb-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl font-bold cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={recalculateAfterExamEdit}
                  onChange={e => setRecalculateAfterExamEdit(e.target.checked)}
                />
                <span>
                  إعادة تصحيح نتائج الطلاب القديمة تلقائيًا بعد حفظ التعديل
                  <span className="block text-xs font-normal mt-1 text-emerald-700">
                    استخدم هذا الخيار عند تعديل الإجابة الصحيحة أو درجة السؤال. سيعاد حساب الدرجة والفروع والتحليل لكل طالب حل الامتحان.
                  </span>
                </span>
              </label>
            )}

            <form onSubmit={saveFullExamEdit} className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={examEditMode === 'direct'} onChange={() => setExamEditMode('direct')} />
                  تعديل مباشر
                </label>
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={examEditMode === 'clone'} onChange={() => setExamEditMode('clone')} />
                  إنشاء نسخة جديدة آمنة
                </label>
                <label className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 font-bold text-amber-800">
                  <input type="checkbox" checked={examEditDraft.isPremium} onChange={e => setExamEditDraft({...examEditDraft, isPremium: e.target.checked})} />
                  VIP فقط
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border p-3 rounded-xl" placeholder="عنوان الامتحان" value={examEditDraft.title} onChange={e => setExamEditDraft({...examEditDraft, title: e.target.value})} />
                <select className="border p-3 rounded-xl" value={examEditDraft.grade} onChange={e => setExamEditDraft({...examEditDraft, grade: e.target.value})}><GradeOptions/></select>
                <input type="number" className="border p-3 rounded-xl" placeholder="المدة بالدقائق" value={examEditDraft.duration} onChange={e => setExamEditDraft({...examEditDraft, duration: e.target.value})} />
                <input className="border p-3 rounded-xl" placeholder="كود الامتحان" value={examEditDraft.accessCode} onChange={e => setExamEditDraft({...examEditDraft, accessCode: e.target.value})} />
                <input type="datetime-local" className="border p-3 rounded-xl" value={examEditDraft.startTime} onChange={e => setExamEditDraft({...examEditDraft, startTime: e.target.value})} />
                <input type="datetime-local" className="border p-3 rounded-xl" value={examEditDraft.endTime} onChange={e => setExamEditDraft({...examEditDraft, endTime: e.target.value})} />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <label className="block font-black text-slate-800 mb-1">تصحيح الإجابات من داخل المنصة</label>
                    <p className="text-xs text-slate-500">غيّر الإجابة الصحيحة أو درجة السؤال من هنا بدون كتابة كود. المادة/النص والامتحان يظلوا كما هم إلا لو عدلتهم بنفسك.</p>
                  </div>
                  <span className="bg-white border px-3 py-1 rounded-full text-xs font-bold text-slate-600">{examEditQuestionsPreview.length} سؤال</span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {examEditQuestionsPreview.length === 0 ? (
                    <div className="bg-white border border-dashed rounded-xl p-5 text-center text-slate-400 font-bold">
                      لا يمكن عرض محرر الأسئلة لأن صيغة الأسئلة غير مقروءة.
                    </div>
                  ) : examEditQuestionsPreview.map((q, idx) => (
                    <div key={`${q.blockIndex}-${q.questionIndex}-${q.id || idx}`} className="bg-white border rounded-xl p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-[220px]">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-bold">سؤال {idx + 1}</span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">{q.branch || 'عام'}</span>
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span>
                          </div>
                          <p className="font-bold text-slate-800 leading-relaxed">{String(q.text || '').replaceAll('|', ' / ')}</p>
                        </div>
                      </div>

                      {q.type === 'essay' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">درجة السؤال المقالي من</span>
                            <input
                              type="number"
                              min="0"
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.maxScore ?? q.mark ?? 10}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { maxScore: safeNumber(e.target.value, 10), mark: safeNumber(e.target.value, 10) })}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">نموذج إجابة مختصر</span>
                            <input
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.modelAnswer || ''}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { modelAnswer: e.target.value })}
                              placeholder="اختياري"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">الإجابة الصحيحة</span>
                            <select
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.correctIdx ?? 0}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { correctIdx: safeNumber(e.target.value, 0) })}
                            >
                              {(Array.isArray(q.options) ? q.options : []).map((opt, optIdx) => (
                                <option key={optIdx} value={optIdx}>{optIdx + 1} - {opt}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">درجة السؤال</span>
                            <input
                              type="number"
                              min="0"
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.maxScore ?? q.mark ?? 1}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { maxScore: safeNumber(e.target.value, 1), mark: safeNumber(e.target.value, 1) })}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <details className="bg-white border rounded-2xl p-4">
                  <summary className="cursor-pointer font-bold text-slate-700">تعديل متقدم للأسئلة بصيغة JSON</summary>
                  <p className="text-xs text-slate-500 my-2">استخدمه فقط لو عايز تعدل نص السؤال أو الاختيارات أو الفروع بشكل متقدم.</p>
                  <textarea className="w-full border rounded-xl p-3 min-h-[320px] font-mono text-xs text-left direction-ltr" dir="ltr" value={examEditDraft.questionsText} onChange={e => setExamEditDraft({...examEditDraft, questionsText: e.target.value})} />
                </details>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700">حفظ</button>
                <button type="button" onClick={() => setEditingFullExam(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black hover:bg-slate-300">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingFullContent && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Edit size={22}/> تعديل المحتوى بالكامل</h3>
              <button onClick={() => setEditingFullContent(null)} className="text-slate-400 hover:text-red-600"><X size={26}/></button>
            </div>

            <form onSubmit={saveFullContentEdit} className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={contentEditMode === 'direct'} onChange={() => setContentEditMode('direct')} />
                  تعديل مباشر
                </label>
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={contentEditMode === 'clone'} onChange={() => setContentEditMode('clone')} />
                  إنشاء نسخة جديدة
                </label>
                <label className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 font-bold text-amber-800">
                  <input type="checkbox" checked={contentEditDraft.isPremium} onChange={e => setContentEditDraft({...contentEditDraft, isPremium: e.target.checked})} />
                  VIP فقط
                </label>
              </div>

              <input className="border p-3 rounded-xl" placeholder="العنوان" value={contentEditDraft.title} onChange={e => setContentEditDraft({...contentEditDraft, title: e.target.value})} />
              <input className="border p-3 rounded-xl" placeholder="الرابط / رابط الفيديو / رابط الملف" value={contentEditDraft.url} onChange={e => setContentEditDraft({...contentEditDraft, url: e.target.value})} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="border p-3 rounded-xl" value={contentEditDraft.type} onChange={e => setContentEditDraft({...contentEditDraft, type: e.target.value})}>
                  <option value="video">فيديو مدمج</option><option value="file">ملف PDF</option><option value="html">HTML تفاعلي</option><option value="interactive_exam">امتحان تفاعلي</option><option value="link">رابط خارجي</option>
                </select>
                <select className="border p-3 rounded-xl" value={contentEditDraft.grade} onChange={e => setContentEditDraft({...contentEditDraft, grade: e.target.value})}><GradeOptions/></select>
                <input className="border p-3 rounded-xl" placeholder="الفرع" value={contentEditDraft.branch} onChange={e => setContentEditDraft({...contentEditDraft, branch: e.target.value})} />
              </div>

              {contentEditDraft.type === 'video' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <select className="border p-3 rounded-xl bg-white" value={contentEditDraft.videoSection} onChange={e => setContentEditDraft({...contentEditDraft, videoSection: e.target.value})}>
                    <option value="explanation">شرح الدرس</option><option value="exercises">حل التدريبات</option><option value="reviews">مراجعة نهائية</option>
                  </select>
                  <select className="border p-3 rounded-xl bg-white" value={contentEditDraft.linkedExamId} onChange={e => setContentEditDraft({...contentEditDraft, linkedExamId: e.target.value})}>
                    <option value="">بدون امتحان مرتبط</option>
                    {examsList.filter(exam => !contentEditDraft.grade || exam.grade === contentEditDraft.grade).map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                  </select>
                  <input type="number" min="1" className="border p-3 rounded-xl bg-white" placeholder="مدة الفيديو بالدقائق" value={contentEditDraft.estimatedDurationMinutes} onChange={e => setContentEditDraft({...contentEditDraft, estimatedDurationMinutes: e.target.value})} />
                </div>
              )}

              <textarea className="border p-3 rounded-xl min-h-[80px]" placeholder="إيميلات مسموحة مفصولة بفاصلة، أو اتركها فارغة للجميع" value={contentEditDraft.allowedEmailsText} onChange={e => setContentEditDraft({...contentEditDraft, allowedEmailsText: e.target.value})} />
              <label className="flex items-center gap-2 bg-slate-50 border rounded-xl p-3 font-bold"><input type="checkbox" checked={contentEditDraft.isPublic} onChange={e => setContentEditDraft({...contentEditDraft, isPublic: e.target.checked})}/> يظهر للزوار في الصفحة الرئيسية</label>

              <div className="flex flex-col md:flex-row gap-3">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700">حفظ</button>
                <button type="button" onClick={() => setEditingFullContent(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black hover:bg-slate-300">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingStudentProfile && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
              <div className="bg-slate-50 rounded-3xl w-full max-w-6xl h-full md:h-[90vh] shadow-2xl flex flex-col relative overflow-hidden border border-slate-300">
                  <button onClick={() => setViewingStudentProfile(null)} className="absolute top-4 left-4 md:top-6 md:left-6 z-50 bg-red-100 p-2 md:p-3 rounded-full text-red-600 hover:bg-red-200 hover:text-red-700 transition shadow-md border border-red-200"><X size={24}/></button>
                  <div className="bg-white border-b border-slate-200 p-6 pt-16 md:pt-6 flex justify-between items-start flex-shrink-0">
                      <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
                              {viewingStudentProfile.name.charAt(0)}
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                  {viewingStudentProfile.name} 
                                  <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(viewingStudentProfile.grade)}</span>
                                  {viewingStudentProfile.subscriptionStatus === 'premium' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>}
                              </h2>
                              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-sm text-slate-500 font-bold">
                                  <span className="flex items-center gap-1"><Phone size={14}/> {viewingStudentProfile.phone}</span>
                                  <span className="flex items-center gap-1 text-amber-600"><Users size={14}/> ولي الأمر: {viewingStudentProfile.parentPhone}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
                              <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2 border-b pb-2"><PlayCircle/> سجل مشاهدات الفيديوهات</h3>
                              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                  {studentHistoryData.length === 0 ? <p className="text-slate-400 text-center py-10">لم يفتح أي فيديو.</p> : studentHistoryData.map((v, i) => (
                                      <div key={i} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                                          <div>
                                              <p className="font-bold text-slate-800">{v.videoTitle}</p>
                                              <p className="text-xs text-slate-400 mt-1">آخر فتح: {v.viewedAt?.toDate().toLocaleString('ar-EG')}</p>
                                          </div>
                                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold text-center">شاهد لمدة<br/><span className="text-sm">{formatWatchTime(v.watchedSeconds)}</span></div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="flex flex-col gap-6 h-[500px]">
                              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-bold text-lg mb-4 text-emerald-800 flex items-center gap-2 border-b pb-2"><ClipboardList/> نتائج الامتحانات</h3>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                      {(() => {
                                          const sExams = examResults.filter(r => r.studentId === viewingStudentProfile.id);
                                          if (sExams.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بحل أي امتحان.</p>;
                                          return sExams.map(ex => (
                                              <div key={ex.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <p className="font-bold text-slate-700 text-sm">{examsList.find(e => e.id === ex.examId)?.title || 'امتحان محذوف'}</p>
                                                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${ex.status === 'cheated' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{ex.status === 'cheated' ? 'غش 🚫' : `${ex.score}/${ex.total}`}</span>
                                              </div>
                                          ))
                                      })()}
                                  </div>
                              </div>

                              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-bold text-lg mb-4 text-amber-800 flex items-center gap-2 border-b pb-2"><QrCode/> سجل الواجبات</h3>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                      {(() => {
                                          const sHw = hwResults.filter(r => r.studentId === viewingStudentProfile.id);
                                          if (sHw.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بتسليم أي واجب QR.</p>;
                                          return sHw.map(hw => (
                                              <div key={hw.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <div>
                                                      <p className="font-bold text-slate-700 text-sm">{hw.homeworkTitle}</p>
                                                      <p className="text-xs text-slate-400">{hw.bookName}</p>
                                                  </div>
                                                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-bold">{hw.score}/${hw.total}</span>
                                              </div>
                                          ))
                                      })()}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <AdminHeader adminGradeFilter={adminGradeFilter} setAdminGradeFilter={setAdminGradeFilter} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-6 relative z-10">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="md:col-span-3 w-full overflow-hidden">
          {activeTab === 'dashboard' && (
            <InlineTabs
              defaultTab="overview"
              tabs={[
                { key: 'overview', label: 'نظرة عامة', content: <AdminProDashboard users={activeUsersList} exams={examsList} results={examResults} content={contentList} subscriptionCodes={subscriptionCodes} hwResults={hwResults} adminGradeFilter={adminGradeFilter} /> },
                { key: 'performance', label: 'تحليل الأداء', content: <AdminPerformanceAnalytics examResults={examResults} examsList={examsList} users={activeUsersList} adminGradeFilter={adminGradeFilter} /> },
                { key: 'questions', label: 'تحليل الأسئلة', content: <AdminQuestionDeepAnalytics examsList={examsList} examResults={examResults} /> },
                { key: 'leaderboard', label: 'لوحة الشرف', content: <LeaderboardPanel examResults={examResults} users={activeUsersList} gradeFilter={adminGradeFilter} /> }
              ]}
            />
          )}

          {activeTab === 'users' && <div className="glass-panel p-4 md:p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">طلبات الانضمام</h2>{filteredPendingUsers.map(u=><div key={u.id} className="border p-4 mb-2 rounded-lg flex flex-col md:flex-row gap-3 justify-between bg-white/50 backdrop-blur-sm"><div><p className="font-bold">{u.name}</p><p className="text-sm">{u.grade}</p></div><div className="flex gap-2"><button onClick={()=>handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-green-500/50 transition flex-1"><Check className="mx-auto"/></button><button onClick={()=>handleReject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-red-500/50 transition flex-1"><X className="mx-auto"/></button></div></div>)}</div>}

          {activeTab === 'all_users' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                      <h2 className="font-bold font-arabic text-xl">قائمة الطلاب ({filteredActiveUsers.length})</h2>
                      <div className="md:hidden">
                          <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm w-full" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
                              <option value="all">كل المراحل</option><GradeOptions />
                          </select>
                      </div>
                  </div>
                  
                  {editingUser && (
                      <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                              <button onClick={() => setEditingUser(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                              <h3 className="text-xl font-bold mb-6 text-blue-800 flex items-center gap-2 border-b pb-2"><Edit size={24}/> تعديل بيانات الطالب</h3>
                              <form onSubmit={handleUpdateUser} className="space-y-4">
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">اسم الطالب</label><input className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.name || ''} onChange={e=>setEditingUser({...editingUser, name:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف الطالب</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.phone || ''} onChange={e=>setEditingUser({...editingUser, phone: normalizeEgyptPhone(e.target.value)})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف ولي الأمر</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.parentPhone || ''} onChange={e=>setEditingUser({...editingUser, parentPhone: normalizeEgyptPhone(e.target.value)})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">المرحلة الدراسية</label><select className="w-full border-2 border-blue-100 p-3 rounded-xl bg-white focus:border-blue-500 outline-none transition" value={editingUser.grade || '1sec'} onChange={e=>setEditingUser({...editingUser, grade:e.target.value})}><GradeOptions /></select></div>
                                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50 mt-2">حفظ التعديلات</button>
                              </form>
                          </div>
                      </div>
                  )}
                  
                  <div className="grid gap-4">
                      {filteredActiveUsers.map(u=>(
                          <div key={u.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${u.status.startsWith('banned') ? 'bg-red-50 border-red-200' : 'bg-white/50 border-slate-100'}`}>
                              <div className="flex flex-col lg:flex-row justify-between w-full gap-4">
                                  <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                          <p className="font-bold text-lg text-slate-800">{u.name}</p>
                                          <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(u.grade)}</span>
                                          {u.subscriptionStatus === 'premium' ? (
                                              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>
                                          ) : (
                                              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">مجاني</span>
                                          )}
                                          {u.status.startsWith('banned') && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold">محظور</span>}
                                      </div>
                                      <div className="text-sm text-slate-500 space-y-1">
                                          <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> الطالب: {u.phone}</p>
                                          <p className="flex items-center gap-2 font-bold text-amber-700"><Users size={14}/> ولي الأمر: {u.parentPhone}</p>
                                          {u.subscriptionStatus === 'premium' && u.subscriptionExpiry && (
                                              <p className="flex items-center gap-2 text-green-600 font-bold"><Clock size={14}/> ينتهي اشتراكه: {u.subscriptionExpiry.toDate().toLocaleDateString('ar-EG')}</p>
                                          )}
                                      </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                                      <div className="flex flex-wrap gap-2">
                                          <button onClick={() => handleToggleSubscription(u)} className={`flex-1 lg:flex-none px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${u.subscriptionStatus === 'premium' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                                              <Crown size={14}/> {u.subscriptionStatus === 'premium' ? 'إلغاء الباقة' : 'تفعيل باقة VIP'}
                                          </button>
                                          <select className="flex-1 lg:flex-none text-xs border p-2 rounded-lg bg-white font-bold" value={u.status} onChange={(e) => handleChangeUserStatus(u.id, e.target.value)}>
                                              <option value="active">نشط</option><option value="banned_all">حظر شامل</option><option value="banned_exam">حظر امتحانات</option><option value="banned_content">حظر محتوى</option>
                                          </select>
                                      </div>
                                      <div className="flex gap-2 justify-end mt-2">
                                          <button onClick={()=>openStudentProfile(u)} className="flex-1 lg:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold shadow-md flex items-center justify-center gap-2"><FileCheck size={16}/> ملف الطالب</button>
                                          <button onClick={()=>setEditingUser(u)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Edit size={16}/></button>
                                          <button onClick={()=>handleSendResetPassword(u.email)} className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200"><KeyRound size={16}/></button>
                                          <button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>

                              {u.gradeUpdateStatus === 'pending' && (
                                  <div className="w-full bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3 mt-2">
                                      <div className="flex items-center gap-2 text-yellow-800 text-sm font-bold"><RefreshCw size={16} className="animate-spin-slow" /> يريد التحويل إلى: <span className="bg-white px-2 rounded border">{getGradeLabel(u.requestedGrade)}</span></div>
                                      <div className="flex gap-2 w-full md:w-auto"><button onClick={() => approveGrade(u)} className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-green-700">موافقة</button><button onClick={() => rejectGrade(u)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-red-700">رفض</button></div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <AdminPaymentRequestsPanel users={activeUsersList} />
              <SmartSubscriptionManager users={activeUsersList} adminGradeFilter={adminGradeFilter} />
            </div>
          )}

          {activeTab === 'subscriptions_legacy' && (
              <div className="space-y-6">
                  {(() => {
                    const unusedCodes = subscriptionCodes.filter(c => !c.used);
                    const usedCodesList = subscriptionCodes.filter(c => c.used);
                    const premiumStudents = filteredActiveUsers.filter(u => u.subscriptionStatus === 'premium');
                    const expiringSoon = premiumStudents.filter(u => {
                      const d = u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : null;
                      return d && d > new Date() && (d.getTime() - Date.now()) / (1000*60*60*24) <= 7;
                    });
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-sm font-bold text-amber-700">أكواد متاحة</p><p className="text-3xl font-black text-amber-900">{unusedCodes.length}</p></div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-sm font-bold text-emerald-700">أكواد مستخدمة</p><p className="text-3xl font-black text-emerald-900">{usedCodesList.length}</p></div>
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-sm font-bold text-blue-700">طلاب VIP</p><p className="text-3xl font-black text-blue-900">{premiumStudents.length}</p></div>
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-sm font-bold text-red-700">ينتهي خلال 7 أيام</p><p className="text-3xl font-black text-red-900">{expiringSoon.length}</p></div>
                        </div>

                        <div className="glass-panel p-4 md:p-6 rounded-xl border-t-4 border-amber-500">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                            <div>
                              <h2 className="text-xl font-bold flex items-center gap-2 text-amber-700"><Key/> نظام الاشتراكات وكروت الشحن</h2>
                              <p className="text-sm text-slate-500 mt-1">ولّد أكواد، انسخها، صدّرها CSV، وراقب الطلاب المشتركين.</p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-2">
                              <button onClick={copyUnusedSubscriptionCodes} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><ClipboardList size={16}/> نسخ الأكواد الجديدة</button>
                              <button onClick={exportSubscriptionCodesCSV} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={16}/> تصدير CSV</button>
                              <button onClick={extendPremiumForAll} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><Crown size={16}/> تمديد VIP</button>
                            </div>
                          </div>

                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                              <p className="text-sm text-amber-800 font-bold mb-4">هذه الأكواد يمكن طباعتها أو إرسالها للطلاب لتفعيل باقة VIP فورًا عند إدخال الكود من صفحة الاشتراك.</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأكواد المطلوبة</label>
                                      <input type="number" min="1" className="w-full border p-3 rounded-lg" value={codeGenCount} onChange={e=>setCodeGenCount(e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">مدة الاشتراك بالأيام</label>
                                      <input type="number" min="1" className="w-full border p-3 rounded-lg" value={codeGenDays} onChange={e=>setCodeGenDays(e.target.value)} />
                                  </div>
                                  <div className="flex items-end">
                                      <button onClick={generateSubscriptionCodes} className="w-full bg-amber-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-amber-700 transition">توليد الأكواد</button>
                                  </div>
                              </div>
                          </div>

                          {expiringSoon.length > 0 && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
                              <h3 className="font-black text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={18}/> اشتراكات قربت تنتهي</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {expiringSoon.map(s => <div key={s.id} className="bg-white rounded-xl p-3 border"><p className="font-bold">{s.name || s.email}</p><p className="text-xs text-red-600">ينتهي: {s.subscriptionExpiry?.toDate?.().toLocaleDateString('ar-EG')}</p></div>)}
                              </div>
                            </div>
                          )}

                          <div className="overflow-x-auto">
                              <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm text-sm whitespace-nowrap">
                                  <thead className="bg-slate-800 text-white">
                                      <tr>
                                          <th className="p-3 text-right">الكود</th>
                                          <th className="p-3 text-center">المدة</th>
                                          <th className="p-3 text-center">الحالة</th>
                                          <th className="p-3 text-right">استخدم بواسطة</th>
                                          <th className="p-3 text-center">تاريخ الاستخدام</th>
                                          <th className="p-3 text-center">إجراء</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {subscriptionCodes.map((code) => (
                                          <tr key={code.id} className={`border-b ${code.used ? 'bg-red-50 opacity-70' : 'hover:bg-slate-50'}`}>
                                              <td className="p-3 font-mono font-black text-blue-700 select-all">{code.code}</td>
                                              <td className="p-3 text-center font-bold">{code.days} يوم</td>
                                              <td className="p-3 text-center">
                                                  {code.used ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">مُستخدم</span> : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">جديد</span>}
                                              </td>
                                              <td className="p-3 text-slate-600">{code.usedBy || '-'}</td>
                                              <td className="p-3 text-center text-slate-500">{code.usedAt?.toDate ? code.usedAt.toDate().toLocaleString('ar-EG') : '-'}</td>
                                              <td className="p-3 text-center">
                                                  <button onClick={() => navigator.clipboard.writeText(code.code)} className="text-blue-600 hover:bg-blue-100 p-2 rounded ml-1"><ClipboardList size={16}/></button>
                                                  <button onClick={() => handleDeleteCode(code.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                      {subscriptionCodes.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">لم يتم توليد أي أكواد بعد.</td></tr>}
                                  </tbody>
                              </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
              </div>
          )}

          {activeTab === 'smart_hw' && (
              <div className="space-y-6">
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                        <h2 className="text-xl font-bold font-arabic text-blue-700 flex items-center gap-2"><QrCode/> إضافة واجب (للكتاب)</h2>
                        <button onClick={handleDeleteAllHomework} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف كل الواجبات الذكية وسجلاتها</button>
                      </div>
                      <form onSubmit={handleCreateSmartHw} className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">المرحلة الدراسية</label><select className="border p-3 rounded w-full bg-white" value={newSmartHw.grade} onChange={e=>setNewSmartHw({...newSmartHw, grade:e.target.value})}><GradeOptions/></select></div>
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">اسم الكتاب</label><input className="border p-3 rounded w-full" placeholder="مثال: كتاب النحو الجزء الأول" value={newSmartHw.bookName} onChange={e=>setNewSmartHw({...newSmartHw, bookName:e.target.value})} required/></div>
                          </div>
                          <input className="border p-3 rounded" placeholder="اسم الواجب/رقم الصفحة (مثال: تدريبات صفحة 15)" value={newSmartHw.title} onChange={e=>setNewSmartHw({...newSmartHw, title:e.target.value})} required/>
                          <textarea className="border p-3 rounded h-24" placeholder="نموذج الإجابة (مثال: 1-أ, 2-ج, 3-د...)" value={newSmartHw.answerKey} onChange={e=>setNewSmartHw({...newSmartHw, answerKey:e.target.value})} required/>
                          <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/50">توليد رابط للصفحة</button>
                      </form>
                  </div>
                  
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4">الواجبات المضافة</h3>
                      <div className="space-y-6">
                          {(() => {
                              const filteredHw = smartHomeworks.filter(hw => adminGradeFilter === 'all' || hw.grade === adminGradeFilter);
                              if (filteredHw.length === 0) return <p className="text-slate-500">لا توجد واجبات في هذه المرحلة.</p>;
                              const hwByBook = filteredHw.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                              return Object.entries(hwByBook).map(([bookName, hws]) => (
                                  <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                                      <h4 className="font-bold text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 w-max"><BookOpen size={20}/> كتاب: {bookName}</h4>
                                      <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4 w-max min-w-full">
                                          {hws.map(hw => {
                                              const hwLink = `${window.location.origin}/?hw=${hw.id}`;
                                              return (
                                                  <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:border-amber-400 transition">
                                                      <div className="flex-1">
                                                          <p className="font-bold text-lg text-slate-800">{hw.title} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(hw.grade)}</span></p>
                                                          <p className="text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded">الإجابات: <span className="font-mono text-blue-600">{hw.answerKey}</span></p>
                                                          <code className="bg-slate-100 p-2 rounded text-xs break-all border block select-all">{hwLink}</code>
                                                      </div>
                                                      <div className="flex gap-2 items-center flex-shrink-0">
                                                          <button onClick={() => { navigator.clipboard.writeText(hwLink); platformNotify("تم نسخ الرابط!"); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 text-sm h-fit shadow-md">نسخ الرابط</button>
                                                          <button onClick={async () => { if(platformConfirm('هل أنت متأكد من حذف هذه الصفحة؟')) await deleteDoc(doc(db, 'smart_homeworks', hw.id)); }} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18}/></button>
                                                      </div>
                                                  </div>
                                              )
                                          })}
                                      </div>
                                  </div>
                              ));
                          })()}
                      </div>
                  </div>

                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4 text-green-700">نتائج التصحيح اليدوي</h3>
                      <div className="space-y-2 overflow-x-auto">
                          <div className="min-w-max">
                              {hwResults.filter(res => adminGradeFilter === 'all' || res.grade === adminGradeFilter).map(res => (
                                  <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50 mb-2">
                                      <div className="ml-4">
                                          <p className="font-bold">{res.studentName} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600 mx-1">{getGradeLabel(res.grade)}</span></p>
                                          <p className="text-slate-500 text-xs font-bold mt-1">الكتاب: {res.bookName} - {res.homeworkTitle}</p>
                                          <p className="text-sm text-green-600 font-bold mt-1">الدرجة: {res.score}/{res.total}</p>
                                      </div>
                                      <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg text-center flex-shrink-0">
                                          {res.submittedAt?.toDate().toLocaleDateString('ar-EG')}<br/>{res.submittedAt?.toDate().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'question_bank' && <InlineTabs tabs={[{ key: 'bank', label: 'إدارة بنك الأسئلة', content: <QuestionBankManager adminGradeFilter={adminGradeFilter} /> }]} />}

          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <div className="flex justify-end"><button onClick={handleDeleteAllHomework} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Trash2 size={16}/> حذف كل الواجبات وسجلاتها</button></div>
              <InlineTabs tabs={[{ key: 'assignments_admin', label: 'إدارة الواجبات', content: <AssignmentsManager adminGradeFilter={adminGradeFilter} /> }]} />
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setAdminExamView('manage')} className={`px-5 py-3 rounded-2xl font-black ${adminExamView === 'manage' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}>إدارة الامتحانات</button>
              <button onClick={() => setAdminExamView('results')} className={`px-5 py-3 rounded-2xl font-black ${adminExamView === 'results' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>النتائج</button>
            </div>
          )}

          {activeTab === 'exams' && adminExamView === 'manage' && (
              <div className="space-y-8">
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h2 className="text-xl font-bold mb-6 border-b pb-2 font-arabic text-amber-700">إنشاء امتحان</h2>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <input className="border p-2 rounded md:col-span-2" placeholder="العنوان" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/>
                          <input className="border p-2 rounded" placeholder="الكود" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/>
                          <input type="number" className="border p-2 rounded" placeholder="المدة (دقائق)" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/>
                          
                          <select className="border p-2 rounded md:col-span-2" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}>
                              <GradeOptions/>
                          </select>
                          <div className="md:col-span-2 flex items-center bg-amber-50 border border-amber-200 rounded p-2">
                              <input type="checkbox" id="examVip" className="w-5 h-5 ml-2" checked={examBuilder.isPremium} onChange={e=>setExamBuilder({...examBuilder, isPremium: e.target.checked})} />
                              <label htmlFor="examVip" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={16}/> امتحان VIP (مغلق لغير المشتركين)</label>
                          </div>

                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت البدء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, startTime:e.target.value})}/>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت الانتهاء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, endTime:e.target.value})}/>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                          <textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا...&#10;(هام 1: افصل بين كل سؤال والذي يليه بسطر فارغ تماماً، وضع علامة * قبل الإجابة الصحيحة)&#10;(هام 2: لتحديد فرع، اكتب #فرع: اسم_الفرع في سطر لوحده)&#10;(هام 3: للسؤال المقالي اكتب #مقالي: نص السؤال)" value={bulkText} onChange={e=>setBulkText(e.target.value)}/>
                          <button onClick={parseExam} className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-green-500/50 transition">نشر</button>
                      </div>
                  </div>
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                        <h3 className="font-bold font-arabic">الامتحانات الحالية</h3>
                        {examsList.length > 0 && <button onClick={handleDeleteAllExams} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف كل الامتحانات</button>}
                      </div>
                      <div className="overflow-x-auto">
                          <div className="min-w-[600px]">
                              {filteredExamsList.map(exam=>(
                                  <div key={exam.id} className="flex justify-between items-center border-b py-3 last:border-0 hover:bg-slate-50/50 px-2 rounded transition">
                                      <div>
                                          <p className="font-bold flex items-center gap-2">
                                              {exam.title}
                                              {exam.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                          </p>
                                          <p className="text-xs text-slate-500">من: {new Date(exam.startTime).toLocaleString('ar-EG')} | إلى: {new Date(exam.endTime).toLocaleString('ar-EG')}</p>
                                          <p className="text-xs text-slate-400">كود: {exam.accessCode}</p>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => openFullExamEditor(exam)} className="text-emerald-600 p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200" title="تعديل كامل / نسخة جديدة"><Edit size={18}/></button>
                                          <button onClick={() => { setEditingExamTime(exam); setNewEndTime(exam.endTime); }} className="text-blue-600 p-2 bg-blue-100 rounded-lg hover:bg-blue-200" title="تمديد الوقت"><Calendar size={18}/></button>
                                          <button onClick={()=>handleDeleteExam(exam.id)} className="text-red-600 p-2 bg-red-100 rounded-lg hover:bg-red-200" title="حذف"><Trash2 size={18}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          

          {activeTab === 'exams' && adminExamView === 'results' && (
             <div className="glass-panel p-4 md:p-6 rounded-xl">
               <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                 <h2 className="font-bold flex items-center gap-2 font-arabic text-xl"><Layout/> نتائج الامتحانات</h2>
                 {!viewingResult && examResults.length > 0 && (
                     <button onClick={handleDeleteAllResults} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-lg w-full md:w-auto justify-center"><Trash2 size={16}/> حذف جميع النتائج</button>
                 )}
               </div>
               {viewingResult ? (
                   <div className="bg-slate-50 p-4 rounded-xl border">
                       <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                           <button onClick={() => setViewingResult(null)} className="text-sm text-slate-500 underline font-bold text-right">العودة للقائمة</button>
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               const questions = getQuestionsForExam(examData);
                               return (
                                   <div className="flex gap-2">
                                       <button onClick={() => sendWhatsAppToParent(viewingResult)} className="flex-1 md:flex-none justify-center bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-bold hover:bg-green-600 shadow-sm"><MessageCircle size={16}/> واتساب لولي الأمر</button>
                                       <button onClick={() => generatePDF('admin', {...viewingResult, total: viewingResult.total || 0, examTitle: examData?.title, questions: questions, answers: viewingResult.answers })} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm"><Download size={16}/> التقرير</button>
                                   </div>
                               );
                           })()}
                       </div>
                       <h3 className="font-bold text-lg mb-2">إجابات الطالب: {viewingResult.studentName}</h3>
                       {(['security_hold', 'in_progress', 'cheated'].includes(viewingResult.status) && !['continue', 'restart', 'continue_consumed', 'restart_consumed'].includes(viewingResult.adminDecision)) && (
                         <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
                           <p className="font-black mb-2 flex items-center gap-2"><ShieldAlert size={18}/> هذه المحاولة تحتاج قرار الأدمن</p>
                           <p className="text-sm font-bold mb-3">يمكنك السماح للطالب بالاستكمال من نفس الإجابات والوقت المتبقي، أو السماح بإعادة الامتحان من البداية.</p>
                           <div className="flex flex-col md:flex-row gap-2">
                             <button onClick={() => handleApproveSecurityContinue(viewingResult)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">السماح بالاستكمال</button>
                             <button onClick={() => handleApproveSecurityRestart(viewingResult)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700">السماح بالإعادة من البداية</button>
                           </div>
                         </div>
                       )}
                       {viewingResult.hasEssay && (
                           <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl font-bold text-sm">
                               هذا الامتحان يحتوي على أسئلة مقالية، ويمكنك تصحيح كل سؤال يدويًا وتحديد الدرجة النهائية له من نفس الصفحة.
                           </div>
                       )}
                       <div className="space-y-4 mt-4">
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               if(!examData) return <p>بيانات الامتحان محذوفة</p>;
                               const questions = getQuestionsForExam(examData);
                               const groupedQuestions = questions.reduce((acc, q) => { const b = q.branch || 'عام'; if(!acc[b]) acc[b] = []; acc[b].push(q); return acc; }, {});
                               return Object.entries(groupedQuestions).map(([branch, qs]) => (
                                   <div key={branch} className="mb-6">
                                       <h4 className="font-bold text-xl text-amber-700 bg-amber-100 p-2 rounded-lg mb-4">{branch}</h4>
                                       <div className="space-y-4">
                                           {qs.map((q, idx) => (
                                               <div key={idx} className="bg-white p-4 rounded border relative">
                                                   <p className="font-bold mb-2 text-lg md:text-xl text-blue-900 font-sans pr-10">
                                                       {q.text.split('|').map((part, i) => (<React.Fragment key={i}>{part.trim()}{i !== q.text.split('|').length - 1 && <br />}</React.Fragment>))}
                                                   </p>
                                                   {q.type === 'essay' ? (
                                                       <div className="space-y-4">
                                                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                               <p className="font-bold text-slate-800 mb-2">إجابة الطالب النصية</p>
                                                               <p className="whitespace-pre-wrap text-slate-700">
                                                                   {typeof viewingResult.answers?.[q.id] === 'object'
                                                                       ? (viewingResult.answers?.[q.id]?.text || 'لم يكتب الطالب إجابة نصية')
                                                                       : (viewingResult.answers?.[q.id] || 'لم يكتب الطالب إجابة نصية')}
                                                               </p>
                                                           </div>
                                                           {typeof viewingResult.answers?.[q.id] === 'object' && viewingResult.answers?.[q.id]?.image && (
                                                               <div className="bg-white border border-slate-200 rounded-xl p-4">
                                                                   <p className="font-bold text-slate-800 mb-3">الصورة المرفوعة</p>
                                                                   <img src={viewingResult.answers[q.id].image} alt="إجابة مقالية" className="max-h-96 rounded-xl border border-slate-200 mx-auto" />
                                                               </div>
                                                           )}
                                                           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                               <p className="font-bold text-amber-800 mb-3">تصحيح السؤال المقالي</p>
                                                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                   <input
                                                                       type="number"
                                                                       min="0"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="درجة الطالب"
                                                                       value={essayScoreDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayScoreDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <input
                                                                       type="number"
                                                                       min="0.5"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="من كام"
                                                                       value={essayMaxDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayMaxScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayMaxDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <button
                                                                       onClick={() => handleSaveEssayGrade(viewingResult, q, questions)}
                                                                       className="bg-amber-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-amber-700 transition"
                                                                   >
                                                                       حفظ التصحيح
                                                                   </button>
                                                               </div>
                                                               {(viewingResult.essayScores?.[q.id] !== undefined && viewingResult.essayMaxScores?.[q.id] !== undefined) && (
                                                                   <p className="text-sm text-amber-900 mt-3 font-bold">
                                                                       الدرجة المحفوظة: {viewingResult.essayScores[q.id]} / {viewingResult.essayMaxScores[q.id]}
                                                                   </p>
                                                               )}
                                                           </div>
                                                       </div>
                                                   ) : (
                                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                           {q.options.map((opt, oIdx) => {
                                                               const isCorrect = oIdx === q.correctIdx;
                                                               const isSelected = viewingResult.answers[q.id] === oIdx;
                                                               let style = "bg-gray-50 text-gray-500";
                                                               if (isCorrect) style = "bg-green-100 text-green-800 border-green-500 border font-bold md:text-lg";
                                                               if (isSelected && !isCorrect) style = "bg-red-100 text-red-800 border-red-500 border font-bold md:text-lg";
                                                               return <div key={oIdx} className={`p-3 rounded font-sans font-bold ${style}`}>{opt}</div>
                                                           })}
                                                       </div>
                                                   )}
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               ));
                           })()}
                       </div>
                   </div>
               ) : (
                   <div className="overflow-x-auto">
                       <div className="min-w-[600px] space-y-2">
                           {examResults.map(res => (
                               <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50">
                                   <div>
                                       <p className="font-bold flex items-center gap-2">
                                           {res.studentName}
                                           {res.hasEssay && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">مقالي</span>}
                                       </p>
                                       <p className="text-xs text-slate-500">
                                           {res.status==='security_hold'
                                             ? 'موقوف أمنيًا في انتظار قرار الأدمن 🛡️'
                                             : res.status==='cheated'
                                               ? 'غش 🚫'
                                               : res.status==='in_progress'
                                                 ? 'قيد التنفيذ (لم يسلم) ⏳'
                                                 : `درجة: ${res.score}/${res.total}`}
                                       </p>
                                   </div>
                                   <div className="flex gap-2 flex-wrap justify-end">
                                      {(['security_hold', 'in_progress', 'cheated'].includes(res.status) && !['continue', 'restart', 'continue_consumed', 'restart_consumed'].includes(res.adminDecision)) && (
                                        <>
                                          <button onClick={()=>handleApproveSecurityContinue(res)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">السماح بالاستكمال</button>
                                          <button onClick={()=>handleApproveSecurityRestart(res)} className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-amber-700">السماح بالإعادة</button>
                                        </>
                                      )}
                                      {res.status === 'completed' && <button onClick={()=>sendWhatsAppToParent(res)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-200"><MessageCircle size={14}/><span className="hidden md:inline"> إرسال لولي الأمر</span></button>}
                                      <button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold">التفاصيل</button>
                                      <button onClick={()=>openAdminResultReview(res)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Eye size={14}/> مراجعة الامتحان</button>
                                      <button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs font-bold">إعادة</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
             </div>
          )}

          
          
          
          
          

          {activeTab === 'security_center' && (
            <InlineTabs tabs={[{ key: 'anti_cheat', label: 'تنبيهات الحماية', content: <AdvancedAntiCheatInsights examResults={examResults} /> }]} />
          )}

{activeTab === 'courses' && <AdminCoursesManager users={activeUsersList} exams={examsList} adminUser={userData} />}

{activeTab === 'mistakes_admin' && (
  <div className="glass-panel p-4 md:p-6 rounded-xl space-y-4">
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
      <div>
        <h2 className="font-bold font-arabic text-xl">بنك الأخطاء</h2>
        <p className="text-sm text-slate-500 font-bold mt-1">حذف كل أخطاء الطلاب المسجلة مرة واحدة.</p>
      </div>
      <button onClick={handleDeleteAllMistakes} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف بنك الأخطاء بالكامل</button>
    </div>
  </div>
)}

{activeTab === 'content' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                    <h2 className="font-bold font-arabic text-xl">إضافة محتوى</h2>
                    {contentList.length > 0 && <button type="button" onClick={handleDeleteAllContent} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 justify-center"><Trash2 size={16}/> حذف كل المحتوى</button>}
                  </div>
                  <form onSubmit={handleAddContent} className="grid gap-4 mb-6">
                      <input className="border p-3 rounded w-full" placeholder="العنوان" value={newContent.title} onChange={e=>setNewContent({...newContent, title:e.target.value})}/>
                      <input className="border p-3 rounded w-full" placeholder="الرابط (يفضل Google Drive للملفات الكبيرة)" value={newContent.url} onChange={e=>setNewContent({...newContent, url:e.target.value})}/>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition relative">
                          <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                              <Upload size={32} />
                              <span className="text-sm font-bold">اضغط هنا لرفع ملف عام على Firebase</span><span className="text-xs text-emerald-600">يدعم HTML وPDF وأي ملف عام حتى 100MB — والكورسات تظل على Cloudinary</span>
                          </div>
                          {isUploading && (
                              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-xl z-10">
                                  <span className="text-sm font-bold text-amber-600 mb-1">جاري تجهيز/رفع الملف... {uploadProgress}%</span>
                                  <div className="w-3/4 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>
                              </div>
                          )}
                          {!isUploading && uploadProgress === 100 && (<div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl z-10"><span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={20}/> تم اختيار الملف</span></div>)}
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-2">
                          <select className="border p-3 rounded flex-1" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}>
                              <option value="video">فيديو مدمج</option><option value="file">ملف (PDF)</option><option value="html">ملف تفاعلي (HTML)</option><option value="interactive_exam">امتحان تفاعلي (رابط/HTML)</option><option value="link">رابط خارجي (Google Meet, Drive, etc)</option>
                          </select>
                          {newContent.type === 'video' && (
                              <select className="border p-3 rounded flex-1" value={newContent.videoSection} onChange={e=>setNewContent({...newContent, videoSection:e.target.value})}>
                                  <option value="explanation">شرح الدرس</option>
                                  <option value="exercises">حل التدريبات</option>
                                  <option value="reviews">مراجعة نهائية</option>
                              </select>
                          )}
                          <select className="border p-3 rounded flex-1" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select>
                      </div>

                      {newContent.type === 'video' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <div>
                                  <label className="block text-sm font-bold text-blue-800 mb-1">ربط الفيديو بامتحان</label>
                                  <select
                                      className="border p-3 rounded w-full bg-white"
                                      value={newContent.linkedExamId || ''}
                                      onChange={(e) => setNewContent({ ...newContent, linkedExamId: e.target.value })}
                                  >
                                      <option value="">بدون امتحان مرتبط</option>
                                      {examsList
                                          .filter(exam => !newContent.grade || exam.grade === newContent.grade)
                                          .map(exam => (
                                              <option key={exam.id} value={exam.id}>{exam.title}</option>
                                          ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-blue-800 mb-1">مدة الفيديو بالدقائق</label>
                                  <input
                                      type="number"
                                      min="1"
                                      className="border p-3 rounded w-full bg-white"
                                      placeholder="مثال: 30"
                                      value={newContent.estimatedDurationMinutes || ''}
                                      onChange={(e) => setNewContent({ ...newContent, estimatedDurationMinutes: e.target.value })}
                                  />
                              </div>
                              <div className="md:col-span-2 bg-white/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 font-bold leading-relaxed">
                                  عند ربط الفيديو بامتحان لن يظهر زر دخول الامتحان للطالب إلا بعد مشاهدة {VIDEO_EXAM_UNLOCK_PERCENT}% من الفيديو.
                                  مع فيديوهات YouTube يجب إدخال مدة الفيديو يدويًا حتى يتم حساب النسبة بشكل صحيح.
                              </div>
                          </div>
                      )}

                      <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <input type="checkbox" id="vipContent" className="w-5 h-5 ml-3" checked={newContent.isPremium} onChange={e=>setNewContent({...newContent, isPremium:e.target.checked})} />
                          <label htmlFor="vipContent" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={18}/> محتوى VIP (مغلق ومخصص للمشتركين فقط)</label>
                      </div>
                      
                      <div className="border p-3 rounded-lg bg-gray-50">
                          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Lock size={14}/> تخصيص لطلاب محددين (اختياري)</label>
                          <input className="border p-2 rounded w-full text-sm" placeholder="اكتب إيميلات الطلاب مفصولة بفاصلة" value={newContent.allowedEmails} onChange={e=>setNewContent({...newContent, allowedEmails:e.target.value})} />
                          <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لكي يظهر المحتوى للجميع.</p>
                      </div>
                      
                      <div className="flex items-center gap-2"><input type="checkbox" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> <label>عام (يظهر للزوار في الصفحة الرئيسية)</label></div>
                      <button className="bg-amber-600 text-white p-3 rounded font-bold shadow-lg shadow-amber-500/30 w-full md:w-auto">نشر</button>
                  </form>
                  <div className="space-y-2 overflow-x-auto">
                      <div className="min-w-[600px]">
                          {filteredContentList.map(c=>(
                              <div key={c.id} className="flex justify-between border-b p-3 items-center bg-white/50 rounded hover:bg-white transition mb-2">
                                  <div className="flex items-center flex-wrap gap-2">
                                      <span className="font-bold ml-2">{c.title}</span>
                                      {c.type === 'video' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">{c.videoSection === 'exercises' ? 'حل تدريبات' : c.videoSection === 'reviews' ? 'مراجعة' : 'شرح'}</span>}
                                      {c.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                      {c.allowedEmails && c.allowedEmails.length > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1 inline-flex"><Lock size={10}/> خاص</span>}
                                      {c.type === 'interactive_exam' && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">امتحان تفاعلي</span>}
                                      {c.type === 'html' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded">HTML</span>}
                                      {c.type === 'link' && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded">رابط خارجي</span>}
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => openFullContentEditor(c)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded" title="تعديل كامل / نسخة جديدة"><Edit size={18}/></button>
                                      <button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}



          {activeTab === 'notifications' && (
            <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Bell className="text-amber-600"/> إرسال إشعار للطلاب</h2>
                <p className="text-sm text-slate-500 mt-1">الإشعار سيظهر داخل منصة الطالب فقط بدون طلب صلاحيات من المتصفح.</p>
              </div>
              <form onSubmit={handleSendStudentNotification} className="grid gap-4 bg-white border rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="border p-3 rounded-xl" placeholder="عنوان الإشعار مثل: امتحان جديد" value={newStudentNotification.title} onChange={e=>setNewStudentNotification({...newStudentNotification, title:e.target.value})} />
                  <select className="border p-3 rounded-xl" value={newStudentNotification.grade} onChange={e=>setNewStudentNotification({...newStudentNotification, grade:e.target.value})}>
                    <option value="all">كل الطلاب</option>
                    <GradeOptions />
                  </select>
                </div>
                <textarea className="border p-3 rounded-xl min-h-[120px]" placeholder="اكتب نص الإشعار... مثال: تم فتح امتحان فيديو جديد" value={newStudentNotification.text} onChange={e=>setNewStudentNotification({...newStudentNotification, text:e.target.value})} />
                <input className="border p-3 rounded-xl" placeholder="رابط الفتح داخل المنصة / اتركه /" value={newStudentNotification.clickUrl} onChange={e=>setNewStudentNotification({...newStudentNotification, clickUrl:e.target.value})} />
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-sm font-bold">
                  ملاحظة: الإشعار يظهر داخل المنصة فورًا. تم إيقاف Push Notifications مؤقتًا للحفاظ على السلاسة ومنع رسائل VAPID.
                </div>
                <button className="bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 flex items-center justify-center gap-2"><Send size={18}/> إرسال الإشعار</button>
              </form>
              <div className="bg-slate-50 border rounded-2xl p-4">
                <h3 className="font-bold text-slate-700 mb-3">آخر الإشعارات</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {announcements.length === 0 ? <p className="text-slate-400 text-sm">لا توجد تنبيهات عامة بعد.</p> : announcements.slice(0, 10).map(item => <div key={item.id} className="bg-white border rounded-xl p-3 text-sm text-slate-700">{item.text}</div>)}
                </div>
              </div>
            </div>
          )}


          {/* تم حذف صفحة الرد الآلي وإدارة الحكم من لوحة الأدمن */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
