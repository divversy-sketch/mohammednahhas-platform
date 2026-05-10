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




export const ExamRunner = ({ exam, user, onClose, isReviewMode = false, existingResult = null }) => {
  const [activeView, setActiveView] = useState(isReviewMode || existingResult ? 'dashboard' : 'questions');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const autosaveKey = `nahhas_exam_backup_${user?.uid || 'guest'}_${exam?.attemptId || exam?.id || 'exam'}`;
  const readLocalExamBackup = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(autosaveKey) || 'null');
      return saved && typeof saved === 'object' ? saved : null;
    } catch { return null; }
  };
  const localExamBackup = readLocalExamBackup();
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

  const fileDialogBypassRef = useRef(false);
  const antiCheatWarningsRef = useRef(existingResult?.antiCheatWarnings || exam.resumeData?.antiCheatWarnings || 0);
  const stateRefs = useRef({ isSubmitted, showSubmitConfirm, isCheating, showAntiCheatChoice });

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const flatQuestions = useMemo(() => {
    const flat = [];
    if (exam.questions) {
      let processedBlocks = [...exam.questions];
      if (!isReviewMode && !existingResult) processedBlocks = shuffleArray(processedBlocks);

      processedBlocks.forEach((block) => {
        let subQs = [...(block.subQuestions || [])];
        const hasEssay = subQs.some((q) => q.type === 'essay');
        if (!isReviewMode && !existingResult && !hasEssay) subQs = shuffleArray(subQs);

        subQs.forEach((q) => {
          flat.push({
            ...q,
            type: q.type || 'mcq',
            blockText: block.text || '',
            branch: q.branch || 'عام'
          });
        });
      });
    }
    return flat;
  }, [exam.questions, isReviewMode, existingResult]);

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
    try {
      localStorage.setItem(autosaveKey, JSON.stringify({
        examId: exam.id,
        attemptId: exam.attemptId,
        studentId: user.uid,
        answers: nextAnswers,
        remainingTime: extra.remainingTime ?? timeLeft,
        currentQIndex: extra.currentQIndex ?? currentQIndex,
        antiCheatWarnings: antiCheatWarningsRef.current,
        antiCheatLog,
        savedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('local exam backup failed:', e?.message);
    }
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
          score: 0,
          total: 0,
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
  const detailedMetrics = calculateDetailedExamMetrics(exam, answers);
  const performanceInsights = getPerformanceInsights(detailedMetrics);
  const gradeBadge = getGradeBadge(detailedMetrics.percentage || percentage);

  if (activeView === 'dashboard') {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto p-4 md:p-8 font-['Cairo'] text-slate-200" dir="rtl">
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-700 pb-4 gap-4">
            <div className="text-center md:text-right">
              <h2 className="text-3xl font-black text-white mb-2">{exam.title}</h2>
              {isSubmitted ? (
                <p className="text-lg text-slate-400">الطالب: {user.displayName}</p>
              ) : (
                <p className="text-amber-400 font-bold">⏳ الوقت المتبقي: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isSubmitted ? (
                <>
                  <button
                    onClick={() => generatePDF('student', { studentName: user.displayName, score, total: mcqQuestions.length, status: 'completed', examTitle: exam.title, questions: flatQuestions, answers })}
                    className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
                    title="تحميل التقرير PDF"
                  >
                    <FileText size={20} />
                  </button>
                  <button onClick={onClose} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-600 shadow-lg transition flex items-center gap-2">
                    خروج <LogOut size={18} />
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setActiveView('questions')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    استكمال الامتحان <Play size={18} />
                  </button>
                  <button onClick={confirmSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2">
                    تسليم الآن <CheckCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">عدد الأسئلة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{totalQs}</p>
            </div>
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">{isSubmitted ? 'النتيجة' : 'تم الحل'}</p>
              <p className="text-4xl md:text-5xl font-black text-white">{isSubmitted ? `${percentage}%` : `${solvedQs}/${totalQs}`}</p>
            </div>
            <div className="bg-[#0e7490] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-cyan-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16} /> المحلولة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{solvedQs}</p>
            </div>
            <div className="bg-[#115e59] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-teal-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Check size={16} /> الصحيحة</p>
              <p className="text-4xl md:text-5xl font-black text-teal-50">{correctQs}</p>
            </div>
            <div className="bg-[#831843] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-pink-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><XCircle size={16} /> الخاطئة</p>
              <p className="text-4xl md:text-5xl font-black text-pink-50">{wrongQs}</p>
            </div>
            <div className="bg-[#78350f] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><PenTool size={16} /> المقالي</p>
              <p className="text-4xl md:text-5xl font-black text-amber-50">{essayAnswered}/{essayQuestions.length}</p>
            </div>
          </div>

          {!isSubmitted && (
            <div className="mb-6 bg-slate-800/60 text-slate-200 p-4 rounded-2xl border border-slate-700 text-center font-bold">
              وضع الأمان مفعل: يتم تسجيل الخروج من الصفحة، النسخ/اللصق، كليك يمين، والخروج من ملء الشاشة.
              زر ملء الشاشة موجود الآن بجانب زر التسليم داخل صفحة الأسئلة.
            </div>
          )}

          {antiCheatWarnings > 0 && !isSubmitted && (
            <div className="mb-6 bg-amber-900/30 text-amber-300 p-4 rounded-2xl border border-amber-700 text-center font-bold">
              تم تسجيل {antiCheatWarnings} تنبيه أمان. النظام يعطي تنبيهات قبل أي إجراء نهائي لتجنب ظلم الطالب.
            </div>
          )}

          {isSubmitted && (
            <div className="mb-10 bg-white/5 border border-slate-700 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><BrainCircuit className="text-amber-400"/> المراجعة الذكية</h3>
                <span className={`px-4 py-2 rounded-full border text-sm font-bold ${gradeBadge.tone}`}>{gradeBadge.text} - {detailedMetrics.percentage || percentage}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">إجمالي الدرجة</p><p className="text-2xl font-black text-emerald-300">{detailedMetrics.totalScore}/{detailedMetrics.totalPossible || mcqQuestions.length}</p></div>
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">اختياري</p><p className="text-2xl font-black text-blue-300">{detailedMetrics.mcqCount} سؤال</p></div>
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">مقالي</p><p className="text-2xl font-black text-amber-300">{detailedMetrics.essayCount} سؤال</p></div>
              </div>
              <div className="space-y-2">
                {performanceInsights.map((note, idx) => <div key={idx} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm font-bold">{note}</div>)}
              </div>
              <div className="mt-5">
                <StudentLocalAdvice metrics={detailedMetrics} content={[]} />
              </div>
            </div>
          )}

          {!isSubmitted && (
            <div className="mb-6 bg-blue-900/20 text-blue-300 p-4 rounded-2xl border border-blue-900/40 text-center font-bold">
              زر التسليم أصبح ظاهرًا في أعلى صفحة الأسئلة وأيضًا داخل لوحة التحكم.
            </div>
          )}

          {Object.keys(branchStats).length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-teal-400"><Layers size={28} /> {isSubmitted ? 'ملخص الفروع' : 'أقسام الامتحان'}</h3>
                {(canReview || !isSubmitted) && (
                  <button onClick={() => { setActiveBranchTab('الكل'); setActiveView('questions'); }} className="text-teal-400 bg-teal-900/30 px-4 py-2 rounded-lg font-bold hover:bg-teal-900/50 transition text-sm flex items-center gap-2">
                    مراجعة الامتحان كله <ClipboardList size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(branchStats).map(([branch, stats], idx) => {
                  const branchMcqTotal = flatQuestions.filter(q => q.branch === branch && q.type !== 'essay').length;
                  const bPercent = branchMcqTotal > 0 ? Math.round((stats.correct / branchMcqTotal) * 100) : 100;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!isSubmitted || canReview) {
                          setActiveBranchTab(branch);
                          setActiveView('questions');
                        } else {
                          platformNotify("نموذج الإجابة سيتاح بعد انتهاء وقت الامتحان للجميع.");
                        }
                      }}
                      className={`bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-lg transition group ${(!isSubmitted || canReview) ? 'cursor-pointer hover:border-teal-400 hover:-translate-y-1' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className={`${isSubmitted ? 'text-teal-400' : 'text-blue-400'} text-4xl font-black`}>{bPercent}%</span>
                        <span className="text-xl font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">{branch}</span>
                      </div>
                      <div className="w-full bg-[#0f172a] rounded-full h-2.5 mb-6 overflow-hidden">
                        <div className={`${isSubmitted ? 'bg-teal-400' : 'bg-blue-400'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${bPercent}%` }} />
                      </div>
                      <div className="text-sm mt-4 bg-[#0f172a] p-3 rounded-lg text-slate-300 space-y-1">
                        <div className="flex justify-between"><span>إجمالي</span><span>{stats.total}</span></div>
                        <div className="flex justify-between"><span>صحيحة</span><span className="text-teal-300">{stats.correct}</span></div>
                        <div className="flex justify-between"><span>خاطئة</span><span className="text-pink-300">{stats.wrong}</span></div>
                        <div className="flex justify-between"><span>مقالي</span><span className="text-amber-300">{stats.essay}</span></div>
                      </div>
                      {(canReview || !isSubmitted) && (
                        <div className="mt-4 text-center text-teal-300 text-xs font-bold">
                          اضغط لمراجعة هذا الفرع فقط
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!canReview && isSubmitted && (
            <div className="mt-8 bg-amber-900/30 text-amber-400 p-6 rounded-2xl border border-amber-900 text-center font-bold text-lg flex flex-col items-center gap-3">
              <Clock size={32} />
              نموذج الإجابة والمراجعة سيظهر هنا تلقائياً بعد انتهاء وقت الامتحان للأغلبية.
            </div>
          )}

          {!isSubmitted && (
            <div className="flex justify-end mt-8 border-t border-slate-700 pt-6">
              <button onClick={confirmSubmit} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                <CheckCircle size={20} /> تسليم الامتحان نهائياً
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
      {!isSubmitted && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {wmPositions.map((pos, i) => (
            <div key={i} className="watermark-text" style={{ top: pos.top, left: pos.left }}>
              {user.displayName} - {user.email}
            </div>
          ))}
        </div>
      )}

      {showAntiCheatChoice && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl text-center border-t-8 border-red-500">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2 text-slate-900">تم إيقاف المحاولة مؤقتًا</h3>
            <p className="text-slate-600 mb-5 font-bold leading-relaxed">
              تم رصد أكثر من مخالفة أمان أثناء الامتحان. تم حفظ إجاباتك والوقت المتبقي، ولن يتم تصفيرك تلقائيًا.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-right text-sm text-red-800 mb-6 space-y-2">
              <p><b>القرار الآن عند الأدمن فقط:</b></p>
              <p>يمكن للأدمن من لوحة النتائج أن يسمح لك باستكمال الامتحان بنفس الإجابات والوقت المتبقي.</p>
              <p>أو يسمح بإعادة الامتحان من البداية إذا رأى أن الحالة تستحق ذلك.</p>
              <p className="font-black">نظام الأمان سيظل نشطًا بنفس الصرامة بعد السماح.</p>
            </div>
            <button onClick={onClose} className="bg-slate-900 text-white py-3 px-8 rounded-xl font-bold hover:bg-slate-800 shadow-md transition">
              العودة للمنصة وانتظار قرار الأدمن
            </button>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-t-8 border-amber-500">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-slate-800">هل أنت متأكد من التسليم؟</h3>
            <p className="text-slate-500 mb-8 font-bold">لن يمكنك تعديل إجاباتك بعد ذلك، وسيتم نقلك للوحة النتيجة.</p>
            <div className="flex gap-4">
              <button onClick={() => handleSubmit(false)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition">نعم، سلم الآن</button>
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 shadow-sm transition">تراجع</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row justify-between items-center shadow-md relative z-50 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
          {isSubmitted && (
            <button onClick={() => setActiveView('dashboard')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm">
              <Layout size={16} /> العودة للنتيجة
            </button>
          )}
          <h2 className="font-bold text-lg font-sans text-amber-400 truncate hidden md:block">{exam.title} {isSubmitted ? '(مراجعة الإجابات)' : ''}</h2>
          {!isSubmitted && (
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
              <div className="bg-slate-800 px-4 md:px-6 py-2 rounded-full font-mono shadow-inner border border-slate-700 font-bold text-amber-400 text-base md:text-lg flex items-center gap-2">
                <Timer size={18} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <button
                onClick={() => document.documentElement.requestFullscreen?.().catch(() => platformNotify('لو ملء الشاشة لم يعمل، افتح المنصة من المتصفح مباشرة وليس داخل تطبيق خارجي.'))}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 md:px-4 py-2 rounded-xl font-black transition whitespace-nowrap flex items-center gap-2 shadow-lg"
                title="تفعيل ملء الشاشة"
              >
                <Layout size={18} /> ملء الشاشة
              </button>
              <button onClick={confirmSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 shadow-lg">
                <CheckCircle size={18} /> تسليم
              </button>
            </div>
          )}
        </div>

        {isSubmitted && (
          <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide items-center">
            <button
              onClick={() => setActiveBranchTab('الكل')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === 'الكل' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60'}`}
            >
              مراجعة الامتحان كله
            </button>
            {uniqueBranches.filter(branch => branch !== 'الكل').map((branch, i) => (
              <button
                key={i}
                onClick={() => setActiveBranchTab(branch)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === branch ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {branch}
              </button>
            ))}
          </div>
        )}

        {!isSubmitted && (
          <button onClick={() => setActiveView('dashboard')} className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2">
            <Layout size={18} /> لوحة التحكم
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-50">
        <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto shadow-inner scrollbar-hide">
          <div className="grid grid-cols-1 gap-3">
            {displayQuestions.map((q, idx) => {
              let statusClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent';
              const currentAnswer = answers[q.id];
              const isAnswered = currentAnswer !== undefined && currentAnswer !== '' && currentAnswer !== null;

              if (isSubmitted) {
                if (q.type === 'essay') {
                  statusClass = isAnswered ? 'bg-blue-100 text-blue-700 border-blue-500 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
                } else if (answers[q.id] === q.correctIdx) {
                  statusClass = 'bg-green-100 text-green-700 border-green-500 shadow-sm';
                } else if (isAnswered) {
                  statusClass = 'bg-red-100 text-red-700 border-red-500 shadow-sm';
                } else {
                  statusClass = 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
                }
              } else if (isAnswered) {
                statusClass = q.type === 'essay' ? 'bg-purple-100 text-purple-700 border-purple-400 shadow-sm' : 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm';
              }

              const originalIndex = flatQuestions.findIndex(origQ => origQ.id === q.id) + 1;
              return (
                <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-xl font-bold text-base transition-all relative ${currentQIndex === idx ? 'ring-4 ring-amber-500 ring-offset-2 scale-105 z-10' : ''} ${statusClass}`}>
                  {originalIndex}
                  {flagged[q.id] && !isSubmitted && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-100 w-full p-4 md:p-8 gap-6`}>
          {currentQObj?.blockText && currentQObj.blockText.trim().length > 0 && (
            <div className="flex-1 w-full bg-white p-6 md:p-10 overflow-y-auto rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-xl border-b border-blue-100 pb-4 font-['Cairo']"><FileText size={24} /> نص المراجعة / القراءة:</h3>
              <div className="leading-loose text-lg md:text-xl font-bold text-slate-700 font-['Cairo']">{renderBracketHighlightedText(currentQObj.blockText)}</div>
            </div>
          )}

          <div className={`${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-6 md:p-10 overflow-y-auto flex flex-col shadow-xl rounded-3xl h-full border border-slate-200 relative`}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md font-['Cairo']">سؤال {flatQuestions.findIndex(origQ => origQ.id === currentQObj.id) + 1}</span>
                {currentQObj.branch && currentQObj.branch !== 'عام' && (
                  <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2"><Layers size={16} /> {currentQObj.branch}</span>
                )}
                {currentQObj.type === 'essay' && (
                  <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold border border-purple-100 flex items-center gap-2"><PenTool size={16} /> سؤال مقالي</span>
                )}
              </div>
              {!isSubmitted && <button onClick={() => { setFlagged({ ...flagged, [currentQObj.id]: !flagged[currentQObj.id] }); }} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition shadow-sm ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}><Flag size={16} /> {flagged[currentQObj.id] ? 'محدد للمراجعة' : 'تحديد لمراجعته لاحقاً'}</button>}
            </div>

            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mb-8 shadow-inner text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-loose font-['Cairo'] drop-shadow-sm">
                {String(currentQObj.text || '').split('|').map((part, i) => (
                  <React.Fragment key={i}>
                    {renderBracketHighlightedText(part.trim())}
                    {i !== String(currentQObj.text || '').split('|').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h3>
            </div>

            {isSubmitted && (
              <div className="mb-6">
                <LocalQuestionExplanation question={currentQObj} answers={answers} />
              </div>
            )}

            {currentQObj.type === 'essay' ? (
              <div className="space-y-4">
                {isSubmitted && (
                  <LocalEssayReviewBox question={currentQObj} answer={answers[currentQObj.id]} />
                )}
                {!isSubmitted ? (
                  <>
                    <textarea
                      className="w-full min-h-[180px] border-2 border-slate-200 rounded-2xl p-4 text-lg focus:border-amber-500 outline-none transition"
                      placeholder="اكتب إجابتك المقالية هنا..."
                      value={typeof answers[currentQObj.id] === 'object' ? (answers[currentQObj.id]?.text || '') : (answers[currentQObj.id] || '')}
                      onChange={(e) => {
                        const previousImage = typeof answers[currentQObj.id] === 'object' ? answers[currentQObj.id]?.image : null;
                        const previousFileName = typeof answers[currentQObj.id] === 'object' ? answers[currentQObj.id]?.fileName : null;
                        handleAnswer(currentQObj.id, { text: e.target.value, image: previousImage, fileName: previousFileName });
                      }}
                    />
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50">
                      <label className="cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-700 flex items-center gap-2"><UploadCloud size={18} /> أو ارفع صورة لإجابة مكتوبة يدويًا</p>
                          <p className="text-sm text-slate-500 mt-1">فتح الكاميرا/الملفات لهذا السؤال لا يُعتبر غشًا.</p>
                        </div>
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">اختيار صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onClick={() => { fileDialogBypassRef.current = true; }}
                          onChange={(e) => handleEssayImageUpload(currentQObj.id, e.target.files?.[0])}
                        />
                      </label>
                      {typeof answers[currentQObj.id] === 'object' && answers[currentQObj.id]?.image && (
                        <div className="mt-4">
                          <img src={answers[currentQObj.id].image} alt="إجابة مقالية" className="max-h-64 rounded-xl border border-slate-200 mx-auto" />
                          <p className="text-xs text-slate-500 mt-2">{answers[currentQObj.id]?.fileName || 'تم رفع صورة'}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                      <p className="font-bold text-blue-800 mb-2">إجابتك النصية</p>
                      <p className="whitespace-pre-wrap text-slate-700">
                        {typeof answers[currentQObj.id] === 'object' ? (answers[currentQObj.id]?.text || 'لم يتم إدخال نص') : (answers[currentQObj.id] || 'لم يتم إدخال نص')}
                      </p>
                    </div>
                    {typeof answers[currentQObj.id] === 'object' && answers[currentQObj.id]?.image && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                        <p className="font-bold text-slate-800 mb-2">الصورة المرفوعة</p>
                        <img src={answers[currentQObj.id].image} alt="إجابة مقالية" className="max-h-80 rounded-xl border border-slate-200 mx-auto" />
                      </div>
                    )}
                    {currentQObj.modelAnswer && (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                        <p className="font-bold text-green-800 mb-2">نموذج الإجابة</p>
                        <p className="whitespace-pre-wrap text-slate-700">{currentQObj.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(Array.isArray(currentQObj.options) ? currentQObj.options : []).map((opt, idx) => {
                  let optionClass = 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700';
                  const isSelected = answers[currentQObj.id] === idx;

                  if (isSubmitted) {
                    if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200';
                    else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md';
                    else optionClass = 'border-slate-200 bg-slate-50 opacity-50';
                  } else if (isSelected) {
                    optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.02] ring-2 ring-amber-200';
                  }

                  return (
                    <div key={idx} onClick={() => handleAnswer(currentQObj.id, idx)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && idx === currentQObj.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
                        {(isSubmitted && idx === currentQObj.correctIdx) && <Check size={16} className="text-white" />}
                        {(isSubmitted && isSelected && idx !== currentQObj.correctIdx) && <X size={16} className="text-white" />}
                      </div>
                      <span className="font-['Cairo'] text-xl font-bold leading-relaxed">{opt}</span>
                      {isSubmitted && idx === currentQObj.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
                      {isSubmitted && isSelected && idx !== currentQObj.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {isSubmitted && currentQObj.explanation && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-right">
                <p className="font-bold text-blue-800 mb-2 flex items-center gap-2"><HelpCircle size={18}/> شرح الإجابة</p>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{currentQObj.explanation}</p>
              </div>
            )}

            <div className="mt-auto pt-10 flex justify-between">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex((p) => p - 1)} className="px-8 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm font-['Cairo'] flex items-center gap-2"><ChevronRight size={20} /> السابق</button>
              <button disabled={currentQIndex === displayQuestions.length - 1} onClick={() => setCurrentQIndex((p) => p + 1)} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-lg font-['Cairo'] flex items-center gap-2">التالي <ChevronRight size={20} className="rotate-180" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamRunner;
