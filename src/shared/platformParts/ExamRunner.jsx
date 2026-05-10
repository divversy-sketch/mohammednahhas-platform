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
} from '../icons/lucide-shim.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, savePushTokenForUser, setupForegroundPushListener } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import MobileStudentBottomNav from '../../features/student/MobileStudentBottomNav';
import MobileExamHelperStyles from '../components/MobileExamHelperStyles';
import DesignSystemLoader from '../components/DesignSystemLoader';
import { GradeOptions, getGradeLabel } from '../constants/grades';
import { normalizeEgyptPhone, isValidEgyptPhone, validateEgyptianPhones } from '../utils/phone';
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
} from '../core/platformShared.jsx';
import { isActiveAdminSnapshot, getInitialRouteMode, navigatePlatform, DebugCollector, DebugPanel } from '../core/debugTools.jsx';
import { makeExamAutosaveKey, readLocalExamBackup, writeLocalExamBackupToStorage, flattenExamQuestions } from '../exam/examState.js';
import ExamDashboardView from '../../features/exam/components/ExamDashboardView.jsx';
import ExamWatermarkLayer from '../../features/exam/components/ExamWatermarkLayer.jsx';
import ExamSecurityHoldOverlay from '../../features/exam/components/ExamSecurityHoldOverlay.jsx';
import ExamSubmitConfirmDialog from '../../features/exam/components/ExamSubmitConfirmDialog.jsx';
import ExamTopBar from '../../features/exam/components/ExamTopBar.jsx';
import ExamQuestionNavigator from '../../features/exam/components/ExamQuestionNavigator.jsx';
import ExamQuestionPanel from '../../features/exam/components/ExamQuestionPanel.jsx';
import { ConnectionStatusBanner, useOnlineStatus } from '../ui/ConnectionStatusBanner.jsx';




export const ExamRunner = ({ exam, user, onClose, isReviewMode = false, existingResult = null }) => {
  const [activeView, setActiveView] = useState(isReviewMode || existingResult ? 'dashboard' : 'questions');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const autosaveKey = makeExamAutosaveKey(user, exam);
  const localExamBackup = readLocalExamBackup(autosaveKey);
  const [answers, setAnswers] = useState(existingResult?.answers || exam.resumeData?.answers || localExamBackup?.answers || {});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(safeNumber(existingResult?.remainingTime ?? exam.resumeData?.remainingTime ?? localExamBackup?.remainingTime, exam.duration * 60));
  const [isCheating, setIsCheating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode || existingResult !== null);
  const [score, setScore] = useState(existingResult?.score || 0);
  const [startTime, setStartTime] = useState(Date.now());
  const [wmPositions, setWmPositions] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [activeBranchTab, setActiveBranchTab] = useState('الكل');
  const [antiCheatWarnings, setAntiCheatWarnings] = useState(existingResult?.antiCheatWarnings || exam.resumeData?.antiCheatWarnings || 0);
  const [antiCheatLog, setAntiCheatLog] = useState(existingResult?.antiCheatLog || exam.resumeData?.antiCheatLog || []);

  const [showAntiCheatChoice, setShowAntiCheatChoice] = useState(false);
  const [securityLockReason, setSecurityLockReason] = useState('');
  const [lastLocalSaveAt, setLastLocalSaveAt] = useState('');
  const isOnline = useOnlineStatus();

  const fileDialogBypassRef = useRef(false);
  const antiCheatWarningsRef = useRef(existingResult?.antiCheatWarnings || exam.resumeData?.antiCheatWarnings || 0);
  const stateRefs = useRef({ isSubmitted, showSubmitConfirm, isCheating, showAntiCheatChoice });

  const flatQuestions = useMemo(() => (
    flattenExamQuestions({ exam, isReviewMode, existingResult })
  ), [exam, isReviewMode, existingResult]);

  const uniqueBranches = useMemo(() => ['الكل', ...new Set(flatQuestions.map(q => q.branch))], [flatQuestions]);

  const displayQuestions = useMemo(() => {
    if (!isSubmitted || activeBranchTab === 'الكل') return flatQuestions;
    return flatQuestions.filter(q => q.branch === activeBranchTab);
  }, [flatQuestions, isSubmitted, activeBranchTab]);

  const mcqQuestions = useMemo(() => flatQuestions.filter(q => q.type !== 'essay'), [flatQuestions]);
  const essayQuestions = useMemo(() => flatQuestions.filter(q => q.type === 'essay'), [flatQuestions]);

  useEffect(() => {
    if (isSubmitted) setCurrentQIndex(0);
  }, [activeBranchTab, isSubmitted]);

  useEffect(() => {
    stateRefs.current = { isSubmitted, showSubmitConfirm, isCheating, showAntiCheatChoice };
  }, [isSubmitted, showSubmitConfirm, isCheating, showAntiCheatChoice]);

  useEffect(() => {
    if (isReviewMode) return;

    const updatePositions = () => {
      const newPos = [...Array(6)].map(() => ({
        top: Math.floor(Math.random() * 90) + '%',
        left: Math.floor(Math.random() * 90) + '%'
      }));
      setWmPositions(newPos);
    };

    updatePositions();
    const interval = setInterval(updatePositions, 6000);
    return () => clearInterval(interval);
  }, [isReviewMode]);

  useEffect(() => {
    const restoreBypass = () => {
      setTimeout(() => {
        fileDialogBypassRef.current = false;
      }, 1200);
    };

    window.addEventListener('focus', restoreBypass);
    return () => window.removeEventListener('focus', restoreBypass);
  }, []);


  const writeLocalExamBackup = (nextAnswers = answers, extra = {}) => {
    if (isReviewMode || isSubmitted || exam.id === 'custom_mistakes_exam') return;
    const didSaveLocally = writeLocalExamBackupToStorage({
      autosaveKey,
      exam,
      user,
      answers: nextAnswers,
      timeLeft: extra.remainingTime ?? timeLeft,
      currentQIndex: extra.currentQIndex ?? currentQIndex,
      antiCheatWarnings: antiCheatWarningsRef.current,
      antiCheatLog
    });
    if (didSaveLocally) setLastLocalSaveAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const saveExamProgress = async (extra = {}) => {
    writeLocalExamBackup(answers, extra);
    if (!exam.attemptId || exam.id === 'custom_mistakes_exam') return;
    try {
      await setDoc(doc(db, 'exam_results', exam.attemptId), {
        examId: exam.id,
        studentId: user.uid,
        studentName: user.displayName,
        answers,
        remainingTime: timeLeft,
        currentQIndex,
        totalTime: exam.duration,
        status: extra.status || 'in_progress',
        antiCheatWarnings: antiCheatWarningsRef.current,
        antiCheatLog,
        lastSavedAt: serverTimestamp(),
        ...extra
      }, { merge: true });
    } catch (e) {
      console.warn('Could not save exam progress:', e?.message);
    }
  };

  const continueAfterSecurityWarning = async () => {
    setShowAntiCheatChoice(false);
    setSecurityLockReason('');
    await saveExamProgress({ status: 'in_progress', securityDecision: 'continue', continuedAt: serverTimestamp() });
  };

  const restartAfterSecurityWarning = async () => {
    const restartEvent = { type: 'student_restart_after_security_warning', warningNumber: antiCheatWarningsRef.current, at: new Date().toISOString() };
    const nextLog = [...antiCheatLog, restartEvent];
    setAnswers({});
    setFlagged({});
    setCurrentQIndex(0);
    setScore(0);
    setTimeLeft(exam.duration * 60);
    setStartTime(Date.now());
    setAntiCheatWarnings(0);
    antiCheatWarningsRef.current = 0;
    setAntiCheatLog(nextLog);
    setShowAntiCheatChoice(false);
    setSecurityLockReason('');
    if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
      try {
        await setDoc(doc(db, 'exam_results', exam.attemptId), {
          examId: exam.id,
          studentId: user.uid,
          studentName: user.displayName,
          answers: {},
          remainingTime: exam.duration * 60,
          currentQIndex: 0,
          status: 'in_progress',
          antiCheatWarnings: 0,
          antiCheatLog: nextLog,
          restartCount: increment(1),
          restartedAfterSecurityAt: serverTimestamp(),
          lastSavedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not restart attempt:', e?.message);
      }
    }
  };

  const handleCheatingRef = useRef();
  handleCheatingRef.current = async (eventType = 'focus_or_visibility_lost') => {
    const { isSubmitted, isCheating } = stateRefs.current;
    if (fileDialogBypassRef.current || isReviewMode || isSubmitted || isCheating) return;

    const nextWarning = antiCheatWarningsRef.current + 1;
    antiCheatWarningsRef.current = nextWarning;
    const event = { type: eventType, warningNumber: nextWarning, at: new Date().toISOString() };
    const nextLog = [...antiCheatLog, event];
    setAntiCheatWarnings(nextWarning);
    setAntiCheatLog(nextLog);

    if (nextWarning < 3) {
      platformNotify(`تنبيه رقم ${nextWarning}: تم رصد حركة غير آمنة داخل الامتحان. عند التكرار للمرة الثالثة سيتم إيقاف المحاولة مؤقتًا لحين مراجعة الأدمن، والأدمن وحده يقرر السماح بالاستكمال أو إعادة الامتحان.`);
      await saveExamProgress({ antiCheatWarnings: nextWarning, antiCheatLog: nextLog });
      return;
    }

    setSecurityLockReason(eventType);
    setShowAntiCheatChoice(true);
    await saveExamProgress({
      status: 'security_hold',
      adminDecision: null,
      adminSecurityAction: 'pending',
      resumeApproved: false,
      antiCheatWarnings: nextWarning,
      antiCheatLog: nextLog,
      securityHoldAt: serverTimestamp(),
      securityReason: eventType
    });
  };

  useEffect(() => {
    if (isReviewMode) return;

    const handleBeforeUnload = (e) => {
      if (!stateRefs.current.isSubmitted) {
        e.preventDefault();
        e.returnValue = "هل أنت متأكد؟ الخروج سيمنعك من العودة للامتحان!";
        return e.returnValue;
      }
    };

    const handleAntiCheat = () => {
      const { showSubmitConfirm, isSubmitted, showAntiCheatChoice } = stateRefs.current;
      if (fileDialogBypassRef.current || showAntiCheatChoice) return;
      if (!showSubmitConfirm && !isSubmitted) handleCheatingRef.current('focus_or_visibility_lost');
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !fileDialogBypassRef.current) handleAntiCheat();
    };

    const blockContextMenu = (e) => {
      e.preventDefault();
      if (!stateRefs.current.isSubmitted && !stateRefs.current.showAntiCheatChoice) handleCheatingRef.current('right_click_attempt');
    };

    const handleBlockedClipboard = (e) => {
      if (fileDialogBypassRef.current || stateRefs.current.isSubmitted) return;
      e.preventDefault();
      handleCheatingRef.current(e.type === 'paste' ? 'paste_attempt' : 'copy_or_cut_attempt');
    };

    const handleExamKeyDown = (e) => {
      if (fileDialogBypassRef.current || stateRefs.current.isSubmitted) return;
      const key = String(e.key || '').toLowerCase();
      if (key === 'printscreen' || ((e.ctrlKey || e.metaKey) && ['c','v','x','p','s','u'].includes(key))) {
        e.preventDefault();
        handleCheatingRef.current('blocked_keyboard_shortcut');
      }
    };

    const handleFullScreenExit = () => {
      if (!document.fullscreenElement && !stateRefs.current.isSubmitted && !stateRefs.current.showAntiCheatChoice) handleCheatingRef.current('fullscreen_exit');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleAntiCheat);
    window.addEventListener("pagehide", handleAntiCheat);
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('copy', handleBlockedClipboard);
    document.addEventListener('cut', handleBlockedClipboard);
    document.addEventListener('paste', handleBlockedClipboard);
    document.addEventListener('keydown', handleExamKeyDown);
    document.addEventListener('fullscreenchange', handleFullScreenExit);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleAntiCheat);
      window.removeEventListener("pagehide", handleAntiCheat);
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('copy', handleBlockedClipboard);
      document.removeEventListener('cut', handleBlockedClipboard);
      document.removeEventListener('paste', handleBlockedClipboard);
      document.removeEventListener('keydown', handleExamKeyDown);
      document.removeEventListener('fullscreenchange', handleFullScreenExit);
    };
  }, [isReviewMode, mcqQuestions.length, exam.attemptId, exam.id, exam.duration, startTime, user.uid, user.displayName, showAntiCheatChoice]);

  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    if (timeLeft > 0 && !isCheating) {
      const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitted, isCheating, isReviewMode]);

  const handleAnswer = (qId, value) => {
    if (!isReviewMode && !isSubmitted && !showAntiCheatChoice) {
      setAnswers((prev) => {
        const nextAnswers = { ...prev, [qId]: value };
        writeLocalExamBackup(nextAnswers);
        if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
          setDoc(doc(db, 'exam_results', exam.attemptId), {
            answers: nextAnswers,
            remainingTime: timeLeft,
            currentQIndex,
            status: 'in_progress',
            lastSavedAt: serverTimestamp()
          }, { merge: true }).catch((e) => console.warn('answer autosave blocked:', e?.message));
        }
        return nextAnswers;
      });
    }
  };


  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    writeLocalExamBackup();
    const interval = setInterval(() => writeLocalExamBackup(), 5000);
    return () => clearInterval(interval);
  }, [answers, timeLeft, currentQIndex, isSubmitted, isReviewMode, autosaveKey]);

  useEffect(() => {
    if (!isOnline || isReviewMode || isSubmitted || !exam.attemptId || exam.id === 'custom_mistakes_exam') return;
    const backup = readLocalExamBackup(autosaveKey);
    if (!backup?.answers) return;
    setDoc(doc(db, 'exam_results', exam.attemptId), {
      answers: backup.answers,
      remainingTime: backup.remainingTime,
      currentQIndex: backup.currentQIndex,
      localDraftSyncedAt: serverTimestamp(),
      lastSavedAt: serverTimestamp(),
      status: 'in_progress'
    }, { merge: true }).catch((e) => console.warn('local backup sync failed:', e?.message));
  }, [isOnline, isReviewMode, isSubmitted, autosaveKey, exam.attemptId, exam.id]);

  const handleEssayImageUpload = async (qId, file) => {
    if (!file) return;
    try {
      const uploaded = await uploadToCloudinary(file, { kind: 'image', folder: 'nahhas-platform/essay-answers' });
      const previousAnswer = answers[qId];
      const currentText = typeof previousAnswer === 'object' ? previousAnswer?.text || '' : '';
      handleAnswer(qId, {
        text: currentText,
        image: uploaded.url,
        fileName: file.name,
        cloudinaryPublicId: uploaded.publicId,
      });
    } catch (err) {
      platformNotify(err?.message || 'فشل رفع الصورة على Cloudinary.');
    } finally {
      fileDialogBypassRef.current = false;
    }
  };

  const calculateScore = () => {
    let rawScore = 0;
    mcqQuestions.forEach((q) => {
      if (answers[q.id] === q.correctIdx) rawScore++;
    });
    return rawScore;
  };

  const confirmSubmit = () => setShowSubmitConfirm(true);

  const handleSubmit = async (auto = false) => {
    setShowSubmitConfirm(false);
    const finalScore = calculateScore();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const finalMetrics = calculateDetailedExamMetrics(exam, answers);
    const finalBranchStats = Object.fromEntries(
      Object.entries(finalMetrics.branchStats || {}).map(([branch, stat]) => [branch, {
        earned: safeNumber(stat.earned, 0),
        possible: safeNumber(stat.possible, 0),
        answered: safeNumber(stat.answered, 0),
        total: safeNumber(stat.total, 0),
        correct: safeNumber(stat.correct, 0),
        wrong: safeNumber(stat.wrong, 0),
        essay: safeNumber(stat.essay, 0),
        percentage: safeNumber(stat.possible, 0) > 0 ? Math.round((safeNumber(stat.earned, 0) / safeNumber(stat.possible, 0)) * 100) : 0
      }])
    );

    setScore(finalScore);
    setIsSubmitted(true);
    setActiveView('dashboard');

    const batch = writeBatch(db);

    mcqQuestions.forEach((q) => {
      const studentAns = answers[q.id];
      const isAnswered = studentAns !== undefined;
      const isCorrect = studentAns === q.correctIdx;

      if (isAnswered && !isCorrect) {
        const mistakeRef = doc(collection(db, 'student_mistakes'));
        batch.set(mistakeRef, {
          userId: user.uid,
          examTitle: exam.title,
          question: {
            ...q,
            studentAnswerText: q.options?.[studentAns],
            correctAnswerText: q.options?.[q.correctIdx]
          },
          timestamp: serverTimestamp()
        });
      }
    });

    if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
      const attemptRef = doc(db, 'exam_results', exam.attemptId);
      batch.set(attemptRef, {
        examId: exam.id,
        examTitle: exam.title || '',
        grade: exam.grade || '',
        studentId: user.uid,
        studentName: user.displayName || 'طالب',
        score: finalScore,
        mcqScore: finalScore,
        total: mcqQuestions.length,
        totalPossible: finalMetrics.totalPossible || mcqQuestions.length,
        answers,
        status: 'completed',
        timeTaken,
        totalTime: exam.duration,
        hasEssay: essayQuestions.length > 0,
        sourceVideoId: exam.sourceVideoId || null,
        startedFromVideo: !!exam.sourceVideoId,
        antiCheatWarnings,
        antiCheatLog,
        branchStats: finalBranchStats,
        weakBranches: Object.entries(finalBranchStats).map(([branch, stat]) => ({
          branch,
          percentage: stat.percentage,
          wrong: stat.wrong,
          correct: stat.correct,
          total: stat.total,
          possible: stat.possible,
          earned: stat.earned
        })).sort((a,b) => a.percentage - b.percentage),
        performanceAnalysis: {
          percentage: finalMetrics.percentage || (mcqQuestions.length > 0 ? Math.round((finalScore / mcqQuestions.length) * 100) : 0),
          totalScore: finalMetrics.totalScore || finalScore,
          totalPossible: finalMetrics.totalPossible || mcqQuestions.length,
          branchStats: finalBranchStats
        },
        percentage: finalMetrics.percentage || (mcqQuestions.length > 0 ? Math.round((finalScore / mcqQuestions.length) * 100) : 0),
        submittedAt: serverTimestamp()
      }, { merge: true });
    }

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error saving results or mistakes", err);
    }
  };

  if (flatQuestions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-['Cairo']">
        عفواً، لا توجد أسئلة.
        <button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button>
      </div>
    );
  }

  const currentQObj = displayQuestions[currentQIndex];
  if (!currentQObj) return null;

  if (isCheating) {
    return (
      <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']">
        <div>
          <AlertOctagon size={80} className="mx-auto mb-4" />
          <h1>تم رصد محاولة غش!</h1>
          <p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك من الامتحانات القادمة.</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const totalQs = flatQuestions.length;
  const solvedQs = flatQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null).length;
  const unsolvedQs = totalQs - solvedQs;
  const correctQs = score;
  const wrongQs = mcqQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== q.correctIdx).length;
  const percentage = mcqQuestions.length > 0 ? Math.round((score / mcqQuestions.length) * 100) : 0;
  const essayAnswered = essayQuestions.filter((q) => {
    const val = answers[q.id];
    if (typeof val === 'object') return !!(val?.text?.trim() || val?.image);
    return !!val;
  }).length;

  const branchStats = {};
  flatQuestions.forEach((q) => {
    const b = q.branch;
    if (!branchStats[b]) branchStats[b] = { total: 0, solved: 0, correct: 0, wrong: 0, unsolved: 0, essay: 0 };
    branchStats[b].total++;
    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null;
    if (isAnswered) branchStats[b].solved++;
    else branchStats[b].unsolved++;

    if (q.type === 'essay') {
      branchStats[b].essay++;
    } else if (answers[q.id] === q.correctIdx) {
      branchStats[b].correct++;
    } else if (answers[q.id] !== undefined) {
      branchStats[b].wrong++;
    }
  });

  const canReview = exam.id === 'custom_mistakes_exam' || Date.now() > new Date(exam.endTime).getTime();
  if (activeView === 'dashboard') {
    return (
      <ExamDashboardView
        exam={exam}
        user={user}
        isSubmitted={isSubmitted}
        timeLeft={timeLeft}
        score={score}
        mcqQuestions={mcqQuestions}
        flatQuestions={flatQuestions}
        answers={answers}
        onClose={onClose}
        setActiveView={setActiveView}
        confirmSubmit={confirmSubmit}
        totalQs={totalQs}
        percentage={percentage}
        solvedQs={solvedQs}
        correctQs={correctQs}
        wrongQs={wrongQs}
        essayAnswered={essayAnswered}
        essayQuestions={essayQuestions}
        antiCheatWarnings={antiCheatWarnings}
        branchStats={branchStats}
        canReview={canReview}
        setActiveBranchTab={setActiveBranchTab}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
      {!isSubmitted && <ExamWatermarkLayer positions={wmPositions} user={user} />}
      {!isSubmitted && <ConnectionStatusBanner isOnline={isOnline} lastLocalSaveAt={lastLocalSaveAt} />}

      {showAntiCheatChoice && <ExamSecurityHoldOverlay onClose={onClose} />}

      {showSubmitConfirm && (
        <ExamSubmitConfirmDialog
          onSubmit={() => handleSubmit(false)}
          onCancel={() => setShowSubmitConfirm(false)}
        />
      )}

      <ExamTopBar
        exam={exam}
        isSubmitted={isSubmitted}
        timeLeft={timeLeft}
        activeBranchTab={activeBranchTab}
        uniqueBranches={uniqueBranches}
        onDashboard={() => setActiveView('dashboard')}
        onSubmit={confirmSubmit}
        onBranchChange={setActiveBranchTab}
        onFullscreen={() => document.documentElement.requestFullscreen?.().catch(() => platformNotify('لو ملء الشاشة لم يعمل، افتح المنصة من المتصفح مباشرة وليس داخل تطبيق خارجي.'))}
      />

      <div className="flex-1 flex overflow-hidden relative z-50">
        <ExamQuestionNavigator
          displayQuestions={displayQuestions}
          flatQuestions={flatQuestions}
          answers={answers}
          flagged={flagged}
          isSubmitted={isSubmitted}
          currentQIndex={currentQIndex}
          onSelectQuestion={setCurrentQIndex}
        />

        <ExamQuestionPanel
          question={currentQObj}
          flatQuestions={flatQuestions}
          displayQuestions={displayQuestions}
          answers={answers}
          flagged={flagged}
          currentQIndex={currentQIndex}
          isSubmitted={isSubmitted}
          onAnswer={handleAnswer}
          onFlagToggle={(questionId) => setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }))}
          onImageUpload={handleEssayImageUpload}
          onFileDialogOpen={() => { fileDialogBypassRef.current = true; }}
          onPrevious={() => setCurrentQIndex((p) => p - 1)}
          onNext={() => setCurrentQIndex((p) => p + 1)}
        />
      </div>
    </div>
  );
};

export default ExamRunner;
