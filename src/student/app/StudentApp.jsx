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



const ExamRunner = ({ exam, user, onClose, isReviewMode = false, existingResult = null }) => {
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


class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'حدث خطأ غير متوقع' };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-['Cairo']" dir="rtl">
          <div className="max-w-lg w-full bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border-t-8 border-red-500 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={64}/>
            <h1 className="text-2xl font-black mb-2">هذا الجزء تحت الصيانة حاليًا</h1>
            <p className="text-slate-600 mb-4">نقوم بتحديث هذا الجزء من المنصة الآن. برجاء إعادة تحميل الصفحة أو المحاولة بعد قليل.</p>
            <details className="bg-slate-100 text-slate-600 p-3 rounded-xl text-sm mb-6 text-right">
              <summary className="cursor-pointer font-bold">تفاصيل تقنية للإدارة</summary>
              <code className="block text-red-700 mt-2 break-all text-left" dir="ltr">{this.state.message}</code>
            </details>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800">إعادة تحميل الصفحة</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


const PerformanceOverview = ({ examResults = [], content = [] }) => {
  const metrics = useMemo(() => {
    const completed = examResults.filter((r) => r?.status === 'completed');
    const avg = completed.length
      ? Math.round(
          completed.reduce((acc, item) => {
            const fallback = item?.total ? (safeNumber(item.score, 0) / safeNumber(item.total, 1)) * 100 : 0;
            return acc + safeNumber(item?.percentage, fallback);
          }, 0) / completed.length
        )
      : 0;
    return { completed, avg };
  }, [examResults]);

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800"><BarChart3/> تحليل الأداء</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">الاختبارات المكتملة</p><p className="text-3xl font-black text-blue-600">{metrics.completed.length}</p></div>
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">متوسط الأداء</p><p className="text-3xl font-black text-emerald-600">{metrics.avg}%</p></div>
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">محتوى متاح للمراجعة</p><p className="text-3xl font-black text-amber-600">{content.length}</p></div>
      </div>
    </div>
  );
};

const PlatformPerformanceBooster = () => {
  useEffect(() => {
    if (import.meta.env.PROD) console.debug = () => {};
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        try { sessionStorage.setItem('platform_warmup', String(Date.now())); } catch(e) {}
      });
    }
  }, []);
  return null;
};
























const PaymentRequestStudentPanel = ({ user, userData }) => {
  const [method, setMethod] = useState('vodafone_cash');
  const [plan, setPlan] = useState('monthly');
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const planDays = plan === 'monthly' ? 30 : plan === 'quarter' ? 90 : plan === 'yearly' ? 365 : 30;

  useEffect(() => {
    if (!user?.uid) return;
    const qRef = query(collection(db, 'payment_requests'), where('userId', '==', user.uid));
    const unsub = onSnapshot(qRef, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(rows);
    }, (error) => {
      console.warn('payment requests listener blocked:', error?.message);
      setRequests([]);
    });
    return () => unsub();
  }, [user?.uid]);

  const submitRequest = async () => {
    if (!transactionRef.trim()) return platformNotify('اكتب رقم العملية أو آخر 4 أرقام.');
    if (!amount || safeNumber(amount, 0) <= 0) return platformNotify('اكتب المبلغ المدفوع.');

    setLoading(true);
    try {
      await addDoc(collection(db, 'payment_requests'), {
        userId: user.uid,
        studentName: userData?.name || user?.displayName || user?.email || 'طالب',
        studentEmail: user?.email || '',
        grade: userData?.grade || '',
        method,
        plan,
        durationDays: planDays,
        amount: safeNumber(amount, 0),
        transactionRef: transactionRef.trim(),
        note: note.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: ''
      });
      setAmount('');
      setTransactionRef('');
      setNote('');
      platformNotify('تم إرسال طلب التفعيل للإدارة. سيتم المراجعة قريبًا.');
    } catch (error) {
      console.error('payment request error:', error);
      platformNotify('تعذر إرسال طلب الدفع. راجع الاتصال أو الصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><CreditCard className="text-emerald-600"/> طلب تفعيل اشتراك</h2>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4 text-sm text-emerald-800 font-bold leading-relaxed">
        بعد الدفع خارج المنصة، اكتب رقم العملية هنا وسيتم تفعيل اشتراكك بعد مراجعة الإدارة.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <select className="border rounded-xl p-3" value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="vodafone_cash">Vodafone Cash</option>
          <option value="instapay">InstaPay</option>
          <option value="bank_transfer">تحويل بنكي</option>
          <option value="manual">دفع يدوي</option>
        </select>

        <select className="border rounded-xl p-3" value={plan} onChange={e=>setPlan(e.target.value)}>
          <option value="monthly">شهري - 30 يوم</option>
          <option value="quarter">3 شهور - 90 يوم</option>
          <option value="yearly">سنوي - 365 يوم</option>
        </select>

        <input className="border rounded-xl p-3" type="number" placeholder="المبلغ المدفوع" value={amount} onChange={e=>setAmount(e.target.value)} />
        <input className="border rounded-xl p-3" placeholder="رقم العملية / آخر 4 أرقام" value={transactionRef} onChange={e=>setTransactionRef(e.target.value)} />
      </div>

      <textarea className="w-full border rounded-xl p-3 mb-3" placeholder="ملاحظة اختيارية للإدارة..." value={note} onChange={e=>setNote(e.target.value)} />

      <button disabled={loading} onClick={submitRequest} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50">
        {loading ? 'جاري الإرسال...' : 'إرسال طلب التفعيل'}
      </button>

      {requests.length > 0 && (
        <div className="mt-5">
          <h3 className="font-black text-slate-800 mb-2">طلباتي السابقة</h3>
          <div className="space-y-2">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="bg-white border rounded-xl p-3 flex justify-between items-center gap-3">
                <div>
                  <p className="font-bold text-slate-800">{req.method} - {req.amount} جنيه</p>
                  <p className="text-xs text-slate-500">رقم العملية: {req.transactionRef}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-black ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {req.status === 'approved' ? 'تم التفعيل' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LeaderboardPanel = ({ examResults = [], users = [], currentUserId = null, gradeFilter = 'all' }) => {
  const rows = useMemo(() => {
    const map = {};
    (examResults || []).filter(r => r.status === 'completed').forEach(r => {
      const id = r.studentId || r.userId || r.uid;
      if (!id) return;
      const userInfo = (users || []).find(u => u.id === id || u.uid === id) || {};
      if (gradeFilter !== 'all' && userInfo.grade && userInfo.grade !== gradeFilter) return;
      map[id] = map[id] || {
        userId: id,
        name: r.studentName || userInfo.name || userInfo.email || 'طالب',
        grade: userInfo.grade || r.grade || '',
        exams: 0,
        totalPct: 0,
        bestPct: 0
      };
      const pct = getResultPercentage(r);
      map[id].exams += 1;
      map[id].totalPct += pct;
      map[id].bestPct = Math.max(map[id].bestPct, pct);
    });
    return Object.values(map).map(x => ({
      ...x,
      avgPct: x.exams ? Math.round(x.totalPct / x.exams) : 0,
      points: Math.round((x.exams ? x.totalPct / x.exams : 0) + Math.min(x.exams * 2, 20) + x.bestPct * 0.2)
    })).sort((a,b) => b.points - a.points).slice(0, 50);
  }, [examResults, users, gradeFilter]);

  const myRank = currentUserId ? rows.findIndex(r => r.userId === currentUserId) + 1 : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-yellow-500">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Trophy className="text-yellow-500"/> لوحة الشرف</h2>
        {myRank > 0 && <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-black">ترتيبك #{myRank}</span>}
      </div>
      <div className="space-y-3">
        {rows.slice(0, 10).map((row, idx) => (
          <div key={row.userId} className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${row.userId === currentUserId ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-500' : 'bg-slate-700'}`}>{idx + 1}</div>
              <div>
                <p className="font-black text-slate-800">{row.name}</p>
                <p className="text-xs text-slate-500">{getGradeLabel(row.grade)} • {row.exams} امتحان</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-yellow-600">{row.points}</p>
              <p className="text-xs text-slate-500">متوسط {row.avgPct}%</p>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-center py-10 text-slate-400 font-bold">لا توجد نتائج كافية بعد.</p>}
      </div>
    </div>
  );
};


const StudentSmartPerformanceReport = ({ userResults = [], content = [] }) => {
  userResults = Array.isArray(userResults) ? userResults : [];
  content = Array.isArray(content) ? content : [];
  const completed = useMemo(() => (userResults || []).filter(r => r.status === 'completed').sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)), [userResults]);
  const latest = completed[0];

  const trend = useMemo(() => completed.slice(0, 5).reverse().map((r, idx) => ({
    label: r.examTitle || `امتحان ${idx + 1}`,
    pct: getResultPercentage(r)
  })), [completed]);

  const branchSummary = useMemo(() => {
    const map = {};
    completed.forEach(r => {
      const branchRows = Array.isArray(r.branchAnalysis)
        ? r.branchAnalysis
        : Object.entries(r.branchStats || {}).map(([branch, data]) => ({
            branch,
            percentage: data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 1)) * 100) : 0,
            wrong: safeNumber(data.wrong, 0),
            correct: safeNumber(data.correct, 0)
          }));
      branchRows.forEach(b => {
        map[b.branch] = map[b.branch] || { branch: b.branch, totalPct: 0, count: 0, wrong: 0, correct: 0 };
        map[b.branch].totalPct += safeNumber(b.percentage, 0);
        map[b.branch].count += 1;
        map[b.branch].wrong += safeNumber(b.wrong, 0);
        map[b.branch].correct += safeNumber(b.correct, 0);
      });
    });
    return Object.values(map).map(b => ({ ...b, avg: b.count ? Math.round(b.totalPct / b.count) : 0 })).sort((a,b) => a.avg - b.avg);
  }, [completed]);

  const recommendations = useMemo(() => {
    return branchSummary.slice(0, 3).map(b => {
      const related = (content || []).find(c => (c.branch || '').trim() === b.branch || (c.title || '').includes(b.branch));
      return { branch: b.branch, avg: b.avg, title: related?.title || `راجع فرع ${b.branch}`, type: related?.type || 'مراجعة' };
    });
  }, [branchSummary, content]);

  if (!completed.length) {
    return (
      <div className="glass-panel rounded-2xl p-5 text-center text-slate-500">
        <BrainCircuit size={44} className="mx-auto mb-3 text-amber-500"/>
        <p className="font-bold">سيظهر تقريرك الذكي بعد أول امتحان مكتمل.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-amber-500">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><BrainCircuit className="text-amber-600"/> تقريرك الذكي</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs text-amber-700 font-bold">آخر نتيجة</p><p className="text-3xl font-black text-amber-800">{getResultPercentage(latest)}%</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs text-blue-700 font-bold">عدد الامتحانات</p><p className="text-3xl font-black text-blue-800">{completed.length}</p></div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs text-red-700 font-bold">أضعف فرع</p><p className="text-xl font-black text-red-800">{branchSummary[0]?.branch || 'لا يوجد'}</p></div>
      </div>

      <h3 className="font-black text-slate-800 mb-2">تطور آخر 5 امتحانات</h3>
      <div className="flex items-end gap-2 h-32 bg-slate-50 border rounded-2xl p-3 mb-5">
        {trend.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="w-full bg-amber-500 rounded-t-xl" style={{ height: `${Math.max(8, item.pct)}%` }} title={item.label}></div>
            <span className="text-[10px] font-bold text-slate-500">{item.pct}%</span>
          </div>
        ))}
      </div>

      <h3 className="font-black text-slate-800 mb-2">خطة مراجعة مقترحة</h3>
      <div className="space-y-2">
        {recommendations.map((r, idx) => (
          <div key={idx} className="bg-white border rounded-xl p-3 flex justify-between items-center gap-3">
            <div>
              <p className="font-black text-slate-800">{r.branch} <span className="text-red-600">({r.avg}%)</span></p>
              <p className="text-xs text-slate-500">{r.title}</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold">{r.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StudentDashboard = ({ user, userData, installPrompt }) => {
  userData = userData || {
    name: user?.displayName || user?.email?.split('@')?.[0] || 'طالب',
    email: user?.email || '',
    grade: '1sec',
    phone: '',
    parentPhone: '',
    role: 'student',
    status: 'pending',
    subscriptionStatus: 'free',
    subscriptionExpiry: null
  };
  userData.name = userData?.name || user?.displayName || user?.email?.split('@')?.[0] || 'طالب';
  userData.grade = userData?.grade || '1sec';
  const [activeTab, setActiveTab] = useState('home');
  const [videoSectionTab, setVideoSectionTab] = useState('recorded');
  const [lectureInnerTab, setLectureInnerTab] = useState('explanation');
  const [learningHubTab, setLearningHubTab] = useState('assignments');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [content, setContent] = useState([]);  
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [hwResults, setHwResults] = useState([]); 
  const [assignments, setAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [videoViews, setVideoViews] = useState([]);
  const [reviewingExam, setReviewingExam] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [pushStatus, setPushStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', parentPhone: '', grade: '' });
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [scanningHwId, setScanningHwId] = useState(null);
  
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
      window.history.pushState({ tab: activeTab }, '');
      const handlePopState = (e) => {
          if (e.state && e.state.tab) {
              setActiveTab(e.state.tab);
              setMobileMenu(false);
          } else {
              setActiveTab('home');
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);

  }, [activeTab]);

  useEffect(() => {
    if(!userData) return;
    const urlParams = new URLSearchParams(window.location.search);
    const hwParam = urlParams.get('hw');
    if (hwParam) { setScanningHwId(hwParam); window.history.replaceState({}, document.title, window.location.pathname); }

    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', userData?.grade)), s => {
        const allContent = s.docs.map(d=>({id:d.id,...d.data()}));
        const visibleContent = allContent.filter(c => { if (!c.allowedEmails || c.allowedEmails.length === 0) return true; return c.allowedEmails.includes(user.email); });
        setContent(visibleContent);
    }, error => { console.warn('content listener blocked:', error?.message); setContent([]); });

    const unsubExams = onSnapshot(query(collection(db, 'exams'), where('grade', '==', userData?.grade)), s => setExams(s.docs.map(d=>({id:d.id,...d.data()}))), error => { console.warn('exams listener blocked:', error?.message); setExams([]); });
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => {
        const rows = s.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        setExamResults(rows);
    }, error => { console.warn('exam_results listener blocked:', error?.message); setExamResults([]); });
    const unsubHwResults = onSnapshot(query(collection(db, 'homework_results'), where('studentId', '==', user.uid)), s => {
        const results = s.docs.map(d=>({id:d.id,...d.data()})); results.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)); setHwResults(results);
    }, error => { console.warn('homework_results listener blocked:', error?.message); setHwResults([]); });
    const unsubMistakes = onSnapshot(query(collection(db, 'student_mistakes'), where('userId', '==', user.uid)), s => {
        const rows = s.docs.map(d => ({id: d.id, ...d.data()})); rows.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)); setMistakes(rows);
    }, error => { console.warn('student_mistakes listener blocked:', error?.message); setMistakes([]); });
    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData?.grade]), limit(10)), s => {
        const newNotifs = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNotifications(newNotifs);
        if(newNotifs.length > 0) {
          setHasNewNotif(true);
          const latest = newNotifs[0];
          if(latest.text) sendSystemNotification(latest.title || "تنبيه جديد 🔔", latest.text);
        }
    }, error => { console.warn('notifications listener blocked:', error?.message); setNotifications([]); });

    const unsubAssignments = onSnapshot(query(collection(db, 'assignments'), where('grade', '==', userData?.grade)), s => {
        const rows = s.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAssignments(rows);
    }, error => { console.warn('assignments listener blocked:', error?.message); setAssignments([]); });

    const unsubAssignmentSubs = onSnapshot(query(collection(db, 'assignment_submissions'), where('studentId', '==', user.uid)), s => {
        const rows = s.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        setAssignmentSubmissions(rows);
    }, error => { console.warn('assignment_submissions listener blocked:', error?.message); setAssignmentSubmissions([]); });

    const unsubVideoViews = onSnapshot(query(collection(db, 'video_views'), where('userId', '==', user.uid)), s => {
        setVideoViews(s.docs.map(d=>({id:d.id,...d.data()})));
    }, error => { console.warn('video_views listener blocked:', error?.message); setVideoViews([]); });

    setEditFormData({ name: userData?.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData?.grade });

    return () => { unsubContent(); unsubExams(); unsubResults(); unsubHwResults(); unsubMistakes(); unsubNotif(); unsubAssignments(); unsubAssignmentSubs(); unsubVideoViews(); };
  }, [userData, user]);


  const enableMobilePushNotifications = async () => {
    setPushStatus('disabled');
    platformNotify('إشعارات المتصفح متوقفة مؤقتًا. ستظهر تنبيهات المنصة داخل حساب الطالب فقط.');
  };

  const isPremium = userData.subscriptionStatus === 'premium' && (!userData?.subscriptionExpiry || userData?.subscriptionExpiry.toDate() > new Date());
  
  const startMistakesExam = () => {
      if (mistakes.length === 0) return platformNotify("ليس لديك أي أخطاء مسجلة بعد! استمر في التميز 👏");
      const shuffledMistakes = [...mistakes].sort(() => 0.5 - Math.random()).slice(0, 20);
      const generatedExam = {
          id: 'custom_mistakes_exam', title: 'امتحان نقاط الضعف (بنك الأخطاء) 🏦', duration: shuffledMistakes.length * 2, 
          questions: [ { text: 'أجب عن هذه الأسئلة التي أخطأت بها سابقاً:', subQuestions: shuffledMistakes.map(m => m.question) } ]
      };
      setActiveExam(generatedExam);
  };

  const handleChargeSubscriptionCode = async (e) => {
      e.preventDefault();
      if(!subscriptionCodeInput.trim()) return platformNotify("أدخل الكود أولاً");
      setIsCharging(true);
      try {
          const qStr = query(collection(db, 'subscription_codes'), where('code', '==', subscriptionCodeInput.trim()));
          const snap = await getDocs(qStr);
          if(snap.empty) { platformNotify("الكود غير صحيح أو غير موجود."); setIsCharging(false); return; }
          
          const codeDoc = snap.docs[0];
          const codeData = codeDoc.data();
          if(codeData.used) { platformNotify("عفواً، هذا الكود تم استخدامه من قبل."); setIsCharging(false); return; }

          const days = codeData.days;
          let newExpiry = new Date();
          if(isPremium && userData?.subscriptionExpiry) {
              newExpiry = userData?.subscriptionExpiry.toDate();
          }
          newExpiry.setDate(newExpiry.getDate() + days);

          const batch = writeBatch(db);
          batch.update(doc(db, 'users', user.uid), { subscriptionStatus: 'premium', subscriptionExpiry: newExpiry });
          batch.update(doc(db, 'subscription_codes', codeDoc.id), { used: true, usedBy: user.displayName, usedById: user.uid, usedAt: serverTimestamp() });
          
          await batch.commit();
          platformNotify(`تم شحن الكود بنجاح! تم تفعيل اشتراكك لمدة ${days} يوم.`);
          setSubscriptionCodeInput('');
      } catch (err) { console.error(err); platformNotify("حدث خطأ أثناء الشحن"); }
      setIsCharging(false);
  };

  const videos = content.filter(c => c.type === 'video');
  const filesAndLinks = content.filter(c => c.type === 'file' || c.type === 'link');
  const htmls = content.filter(c => c.type === 'html');
  const interactiveExams = content.filter(c => c.type === 'interactive_exam');

  const handlePremiumClick = (callback) => {
      if(!isPremium) {
          platformNotify("عفواً يا بطل، هذا المحتوى مخصص للطلاب المشتركين في الباقة المدفوعة (VIP). يرجى شحن حسابك أو التواصل مع المستر لترقية حسابك!");
          setActiveTab('subscription');
      } else {
          callback();
      }
  };

  const getVideoWatchPercent = (videoItem) => {
      const match = videoViews.find(v => v.videoId === videoItem.id);
      if (!match) return 0;
      if (safeNumber(match.watchedPercent, -1) >= 0) return safeNumber(match.watchedPercent, 0);
      const durationSeconds = safeNumber(videoItem.durationSeconds, safeNumber(videoItem.estimatedDurationMinutes, 0) * 60);
      return durationSeconds > 0 ? Math.min(100, Math.round((safeNumber(match.watchedSeconds, 0) / durationSeconds) * 100)) : 0;
  };

  const canOpenLinkedExam = (videoItem) => {
      if (!videoItem?.linkedExamId) return false;
      return getVideoWatchPercent(videoItem) >= VIDEO_EXAM_UNLOCK_PERCENT;
  };

  const openLinkedExamFromVideo = (videoItem) => {
      if (!videoItem?.linkedExamId) return;
      const watchPercent = getVideoWatchPercent(videoItem);
      if (watchPercent < VIDEO_EXAM_UNLOCK_PERCENT) {
          return platformNotify(`امتحان الفيديو سيفتح بعد مشاهدة ${VIDEO_EXAM_UNLOCK_PERCENT}% من الفيديو. شاهدت الآن ${watchPercent}%.`);
      }
      const linkedExam = exams.find(e => e.id === videoItem.linkedExamId);
      if (!linkedExam) return platformNotify('الامتحان المرتبط بهذا الفيديو غير موجود حالياً أو لم يتم نشره.');
      startExamWithCode(linkedExam, { skipCode: true, sourceVideoId: videoItem.id });
  };

  const handleVideoProgress = (videoId, percent, watchedSeconds) => {
      setVideoViews(prev => {
          const others = prev.filter(v => v.videoId !== videoId);
          return [...others, { videoId, watchedPercent: percent, watchedSeconds }];
      });
  };


  const latestVideoActivity = (() => {
      const views = Array.isArray(videoViews) ? videoViews : [];
      const byView = [...views].sort((a, b) => {
          const bTime = safeNumber(b?.viewedAt?.seconds, safeNumber(b?.updatedAt, safeNumber(b?.lastPositionSeconds, safeNumber(b?.watchedSeconds, 0))));
          const aTime = safeNumber(a?.viewedAt?.seconds, safeNumber(a?.updatedAt, safeNumber(a?.lastPositionSeconds, safeNumber(a?.watchedSeconds, 0))));
          return bTime - aTime;
      })[0];
      let localActivity = null;
      try {
          const raw = user?.uid ? localStorage.getItem('nahhas-latest-video-' + user.uid) : '';
          localActivity = raw ? JSON.parse(raw) : null;
      } catch (e) {}
      const picked = byView || localActivity;
      if (!picked) return null;
      const videoId = picked.videoId;
      const videoItem = videos.find(v => v.id === videoId) || (localActivity?.videoId === videoId ? videos.find(v => v.id === localActivity.videoId) : null);
      if (!videoItem) return null;
      const watchedSeconds = safeNumber(picked.lastPositionSeconds, safeNumber(picked.watchedSeconds, safeNumber(localActivity?.watchedSeconds, 0)));
      const percent = Math.max(0, Math.min(100, getVideoWatchPercent(videoItem)));
      return {
          video: videoItem,
          watchedSeconds,
          percent,
          isCompleted: percent >= 95
      };
  })();

  const latestCompletedResult = examResults.find(r => r.status === 'completed') || examResults[0] || null;
  const inProgressExamResult = examResults.find(r => ['in_progress', 'security_hold'].includes(r.status));
  const inProgressExam = inProgressExamResult ? exams.find(e => e.id === inProgressExamResult.examId) : null;
  const submittedAssignmentIds = new Set((assignmentSubmissions || []).map(s => s.assignmentId));
  const pendingAssignments = (assignments || []).filter(a => !submittedAssignmentIds.has(a.id));
  const pendingAssignmentsCount = pendingAssignments.length;
  const completedVideoCount = (videos || []).filter(v => getVideoWatchPercent(v) >= VIDEO_EXAM_UNLOCK_PERCENT).length;
  const videoCompletionPercent = videos.length > 0 ? Math.round((completedVideoCount / videos.length) * 100) : 0;
  const completedExamResults = (examResults || []).filter(r => r.status === 'completed');
  const averageScore = completedExamResults.length > 0
      ? Math.round(completedExamResults.reduce((sum, r) => sum + getResultPercentage(r), 0) / completedExamResults.length)
      : 0;
  const unseenNotificationCount = 0;
  const recentNotificationItems = [];

  const smartWeakBranches = (() => {
      const totals = {};
      completedExamResults.slice(0, 8).forEach(result => {
          const stats = result.performanceAnalysis?.branchStats || result.branchStats || result.branchAnalysis || {};
          Object.entries(stats).forEach(([branch, data]) => {
              totals[branch] = totals[branch] || { earned: 0, possible: 0, wrong: 0 };
              totals[branch].earned += safeNumber(data.earned, 0);
              totals[branch].possible += safeNumber(data.possible, safeNumber(data.total, 0));
              totals[branch].wrong += safeNumber(data.wrong, 0);
          });
      });
      return Object.entries(totals)
          .map(([branch, data]) => ({
              branch,
              pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0,
              wrong: data.wrong
          }))
          .filter(item => item.pct < 75 || item.wrong > 0)
          .sort((a, b) => a.pct - b.pct)
          .slice(0, 3);
  })();

  const nextStudyAction = (() => {
      if (latestVideoActivity && !latestVideoActivity.isCompleted) {
          return {
              title: 'استكمل آخر محاضرة',
              text: latestVideoActivity.video?.title || 'محاضرة محفوظة',
              action: () => setPlayingVideo(latestVideoActivity.video),
              button: 'استكمال الآن',
              icon: <Play size={18} fill="currentColor" />,
              tone: 'from-amber-400 to-orange-500 text-slate-950'
          };
      }
      if (inProgressExam) {
          return {
              title: 'استكمل امتحانك',
              text: inProgressExam.title || 'امتحان محفوظ',
              action: () => startExamWithCode(inProgressExam, { skipCode: true }),
              button: 'دخول الامتحان',
              icon: <ClipboardList size={18} />,
              tone: 'from-blue-500 to-indigo-600 text-white'
          };
      }
      if (pendingAssignments[0]) {
          return {
              title: 'عندك واجب مطلوب',
              text: pendingAssignments[0].title || 'واجب جديد',
              action: () => setActiveTab('assignments'),
              button: 'فتح الواجبات',
              icon: <QrCode size={18} />,
              tone: 'from-emerald-500 to-teal-600 text-white'
          };
      }
      return {
          title: 'ابدأ خطوة جديدة',
          text: videos[0]?.title || 'افتح المحاضرات المتاحة لك',
          action: () => setActiveTab('videos'),
          button: 'فتح المحاضرات',
          icon: <PlayCircle size={18} />,
          tone: 'from-slate-900 to-slate-700 text-white'
      };
  })();

  const StudentContinueCard = () => {
      const currentTitle = latestVideoActivity?.video?.title || inProgressExam?.title || pendingAssignments[0]?.title || 'ابدأ مذاكرتك التالية';
      const currentSubtitle = latestVideoActivity
          ? ('آخر موضع مشاهدة: ' + formatWatchTime(Math.round(latestVideoActivity.watchedSeconds || 0)))
          : inProgressExam
            ? 'عندك محاولة امتحان محفوظة تقدر تكملها.'
            : pendingAssignments[0]
              ? 'ابدأ الواجب المطلوب قبل تراكم المهام.'
              : 'كل أدواتك المهمة جاهزة بضغطة واحدة.';
      return (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 text-white rounded-3xl p-5 md:p-6 shadow-xl overflow-hidden relative border border-white/10">
            <div className="absolute -left-16 -top-16 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"></div>
            <div className="absolute right-8 bottom-4 opacity-10"><GraduationCap size={130}/></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="min-w-0">
                <p className="text-amber-200 text-sm font-bold mb-2 flex items-center gap-2"><Sparkles size={16}/> أكمل من حيث توقفت</p>
                <h3 className="text-2xl md:text-3xl font-black leading-relaxed truncate md:whitespace-normal">{currentTitle}</h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{currentSubtitle}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button onClick={nextStudyAction.action} className={`bg-gradient-to-r ${nextStudyAction.tone} px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition flex items-center justify-center gap-2`}>
                  {nextStudyAction.icon} {nextStudyAction.button}
                </button>
                <button onClick={() => setActiveTab('settings')} className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-2xl font-bold hover:bg-white/15 transition flex items-center justify-center gap-2"><BarChart3 size={18}/> أدائي</button>
              </div>
            </div>
            {latestVideoActivity && (
              <div className="relative z-10 mt-5">
                <div className="h-3 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: String(Math.min(100, latestVideoActivity.percent || 0)) + '%' }} /></div>
                <p className="text-xs text-amber-100 mt-2 font-bold">نسبة المشاهدة: {latestVideoActivity.percent || 0}%</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
            <button onClick={() => setActiveTab('settings')} className="text-right bg-white rounded-3xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition"><p className="text-xs font-bold text-blue-600 mb-1">متوسط أدائك</p><p className="text-3xl font-black text-slate-900">{completedExamResults.length ? String(averageScore) + '%' : '—'}</p><p className="text-xs text-slate-500 mt-1">{latestCompletedResult?.examTitle || 'ابدأ أول امتحان لتظهر النتائج'}</p></button>
            <button onClick={() => setActiveTab('assignments')} className="text-right bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition"><p className="text-xs font-bold text-emerald-600 mb-1">واجبات مطلوبة</p><p className="text-3xl font-black text-slate-900">{pendingAssignmentsCount}</p><p className="text-xs text-slate-500 mt-1">{pendingAssignments[0]?.title || 'لا توجد واجبات معلقة'}</p></button>
          </div>
        </section>
      );
  };

  const StudentSmartDashboard = () => (
    <section className="glass-panel rounded-3xl p-5 md:p-6 border border-white/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><BrainCircuit className="text-amber-600"/> لوحة الطالب الذكية</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('videos')} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">المحاضرات</button>
          <button onClick={() => setActiveTab('exams')} className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">الامتحانات</button>
          <button onClick={() => setActiveTab('assignments')} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">الواجبات</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">تقدم المحاضرات</p><p className="text-3xl font-black text-blue-700 mt-1">{videoCompletionPercent}%</p><p className="text-xs text-slate-400 mt-1">{completedVideoCount}/{videos.length} مكتملة</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">متوسط الامتحانات</p><p className="text-3xl font-black text-emerald-700 mt-1">{completedExamResults.length ? averageScore + '%' : '—'}</p><p className="text-xs text-slate-400 mt-1">{completedExamResults.length} امتحان مكتمل</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">واجبات مطلوبة</p><p className="text-3xl font-black text-amber-700 mt-1">{pendingAssignmentsCount}</p><p className="text-xs text-slate-400 mt-1">تابعها قبل المحاضرة القادمة</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold">نتائج مسجلة</p><p className="text-3xl font-black text-purple-700 mt-1">{examResults.length}</p><p className="text-xs text-slate-400 mt-1">سجل امتحاناتك</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-950 text-white rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl"></div>
          <p className="text-amber-200 text-sm font-bold mb-2">خطة اليوم المقترحة</p>
          <h3 className="text-xl md:text-2xl font-black mb-2">{nextStudyAction.title}</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">{nextStudyAction.text}</p>
          <button onClick={nextStudyAction.action} className={`bg-gradient-to-r ${nextStudyAction.tone} px-5 py-3 rounded-2xl font-black shadow flex items-center gap-2 w-full sm:w-auto justify-center`}>{nextStudyAction.icon} {nextStudyAction.button}</button>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-slate-100">
          <h3 className="font-black text-slate-800 flex items-center gap-2 mb-3"><Target className="text-red-500"/> ركز على</h3>
          {smartWeakBranches.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-700 text-sm font-bold leading-relaxed">أداؤك مستقر. راجع آخر أخطائك وحافظ على الاستمرارية.</div>
          ) : (
            <div className="space-y-2">
              {smartWeakBranches.map(item => (
                <div key={item.branch} className="bg-red-50/70 border border-red-100 rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2"><span className="font-black text-red-800">{item.branch}</span><span className="text-xs bg-white text-red-700 px-2 py-1 rounded-full font-bold">{item.pct}%</span></div>
                  <p className="text-xs text-red-600 mt-1">{item.wrong} أخطاء تحتاج مراجعة.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const StudentNotificationCenter = () => (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Bell className="text-amber-600"/> مركز الإشعارات</h3>
            <p className="text-sm text-slate-500 mt-1">المحاضرات والامتحانات والواجبات في مكان واحد، والتواصل عبر واتساب فقط.</p>
          </div>
          <button onClick={() => { setShowNotifications(true); setHasNewNotif(false); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition">عرض الكل</button>
        </div>
        <div className="space-y-2">
          {recentNotificationItems.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 text-center text-slate-500 font-bold">لا توجد إشعارات جديدة حاليًا.</div>
          ) : recentNotificationItems.map((n, i) => (
            <div key={n.id || i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Bell size={17}/></div>
              <div className="min-w-0"><p className="font-black text-slate-800 truncate">{n.title || 'تنبيه جديد'}</p><p className="text-sm text-slate-600 leading-relaxed">{n.text || n.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 flex items-center gap-2 mb-2"><Bell className="text-amber-600"/> تنبيهات داخل المنصة</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">لأي استفسار أو مشكلة في التفعيل استخدم واتساب الإدارة فقط، بدون رسائل داخلية أو إشعارات داخل المنصة.</p>
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl p-3 text-sm font-black">النظام الداخلي للتنبيهات يعمل بدون طلب صلاحيات من المتصفح.</div>
      </div>
    </section>
  );

  const StudentCompactHome = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button onClick={()=> !isBannedContent && setActiveTab('videos')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">المحاضرات</p><p className="text-3xl font-black text-blue-700">{videos.length}</p></div><PlayCircle className="text-blue-200 w-14 h-14"/></button>
      <button onClick={()=> !isBannedExam && setActiveTab('exams')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">الامتحانات</p><p className="text-3xl font-black text-amber-700">{exams.length}</p></div><ClipboardList className="text-amber-200 w-14 h-14"/></button>
      <button onClick={()=> setActiveTab('settings')} className="text-right bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition"><div><p className="text-sm text-slate-500 font-bold">نتائجي</p><p className="text-3xl font-black text-emerald-700">{examResults.length}</p></div><Target className="text-emerald-200 w-14 h-14"/></button>
    </div>
  );

  const handleUpdateMyProfile = async (e) => {
      e.preventDefault();

      const normalizedPhone = normalizeEgyptPhone(editFormData.phone);
      if (!isValidEgyptPhone(normalizedPhone)) {
          return platformNotify("رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015");
      }

      if (normalizedPhone === normalizeEgyptPhone(editFormData.parentPhone)) {
          return platformNotify("لا يمكن أن يكون رقم الطالب هو نفسه رقم ولي الأمر.");
      }

      const payload = { phone: normalizedPhone };

      if (editFormData.grade !== userData?.grade) {
          payload.requestedGrade = editFormData.grade;
          payload.gradeUpdateStatus = 'pending';
      }

      await updateDoc(doc(db, 'users', user.uid), payload);
      platformNotify(editFormData.grade !== userData?.grade ? "تم حفظ رقم الهاتف وإرسال طلب تغيير المرحلة إلى الأدمن." : "تم تحديث رقم الهاتف بنجاح.");
  };
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  if (showFocusMode) return <PomodoroFocusMode onClose={() => setShowFocusMode(false)} />;
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  const isBannedAll = userData.status === 'banned_all';
  const isBannedExam = userData.status === 'banned_exam' || userData.status === 'banned_cheating'; 
  const isBannedContent = userData.status === 'banned_content';

  if(userData.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  if (isBannedAll) return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6"><Ban size={80} className="text-red-600 mb-4" /><h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2><p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p><button onClick={()=>signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">تسجيل الخروج</button></div>
  );

  const startExamWithCode = async (exam, options = {}) => {
    if (isBannedExam) return platformNotify("أنت محظور من دخول الامتحانات.");

    const previousResult = examResults.find(r => r.examId === exam.id);
    const openExamFromSavedResult = (result, resumeData = null) => {
      setActiveExam({
        ...exam,
        attemptId: result.id,
        resumeData: resumeData || result,
        sourceVideoId: result.sourceVideoId || options.sourceVideoId || null
      });
    };

    if (previousResult) {
        const hasAdminContinueApproval = previousResult.adminDecision === 'continue';
        const hasAdminRestartApproval = previousResult.adminDecision === 'restart';

        if (previousResult.status === 'completed') {
          platformNotify(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`);
          return;
        }

        if (hasAdminContinueApproval && ['security_hold', 'in_progress', 'cheated'].includes(previousResult.status)) {
          const approvedResume = {
            ...previousResult,
            status: 'in_progress',
            answers: previousResult.answers || {},
            remainingTime: safeNumber(previousResult.remainingTime, exam.duration * 60),
            currentQIndex: safeNumber(previousResult.currentQIndex, 0),
            antiCheatWarnings: safeNumber(previousResult.antiCheatWarnings, 0),
            antiCheatLog: previousResult.antiCheatLog || []
          };

          await setDoc(doc(db, 'exam_results', previousResult.id), {
            status: 'in_progress',
            adminDecision: 'continue_consumed',
            resumeApproved: false,
            adminSecurityAction: 'continue_consumed',
            resumedAfterAdminApprovalAt: serverTimestamp(),
            lastSavedAt: serverTimestamp(),
            sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
          }, { merge: true });

          openExamFromSavedResult({ ...previousResult, ...approvedResume, adminDecision: 'continue_consumed' }, approvedResume);
          return;
        }

        if (hasAdminRestartApproval && ['security_hold', 'in_progress', 'cheated'].includes(previousResult.status)) {
          const freshResume = {
            answers: {},
            remainingTime: exam.duration * 60,
            currentQIndex: 0,
            antiCheatWarnings: 0,
            antiCheatLog: previousResult.antiCheatLog || []
          };

          await setDoc(doc(db, 'exam_results', previousResult.id), {
            answers: {},
            remainingTime: exam.duration * 60,
            currentQIndex: 0,
            score: 0,
            total: 0,
            status: 'in_progress',
            adminDecision: 'restart_consumed',
            resumeApproved: false,
            antiCheatWarnings: 0,
            restartedByAdminDecisionAt: serverTimestamp(),
            sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
          }, { merge: true });

          openExamFromSavedResult({ ...previousResult, ...freshResume, status: 'in_progress', adminDecision: 'restart_consumed' }, freshResume);
          return;
        }

        if (previousResult.status === 'security_hold') {
          platformNotify('تم إيقاف محاولتك مؤقتًا بسبب تنبيهات الأمان. انتظر موافقة الأدمن على الاستكمال أو الإعادة.');
          return;
        }

        if (previousResult.status === 'in_progress') {
          platformNotify('لديك محاولة غير مكتملة. لا يمكن الاستكمال إلا بعد موافقة الأدمن من لوحة النتائج.');
          return;
        }

        if (previousResult.status === 'cheated') {
          platformNotify('هذه المحاولة مسجلة كمخالفة أمان. لا يمكن إعادة الامتحان أو استكماله إلا إذا سمح الأدمن من لوحة النتائج.');
          return;
        }
    }

    const now = new Date(); const start = new Date(exam.startTime); const end = new Date(exam.endTime);
    if (now < start) return platformNotify(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return platformNotify("عفواً، انتهى وقت الامتحان.");
    const code = options.skipCode ? exam.accessCode : platformPrompt("أدخل كود الامتحان:");
    if (options.skipCode || code === exam.accessCode) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), {
              examId: exam.id,
              studentId: user.uid,
              studentName: user.displayName,
              score: 0,
              total: 0,
              status: 'in_progress',
              adminDecision: null,
              resumeApproved: false,
              sourceVideoId: options.sourceVideoId || null,
              startedFromVideo: !!options.skipCode,
              submittedAt: serverTimestamp()
            });
            setActiveExam({ ...exam, attemptId: attemptRef.id, sourceVideoId: options.sourceVideoId || null });
        } catch (error) { console.error("Error creating attempt record:", error); platformNotify("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى."); }
    } else { platformNotify("كود خاطئ!"); }
  };

  const studentFirstName = String(userData?.name || user?.displayName || 'طالب').split(' ')[0];
  const StudentTopGreeting = () => (
    <section className="student-sticky-hero bg-white/95 backdrop-blur-xl border border-amber-100 rounded-3xl shadow-xl p-4 md:p-5 mb-6 overflow-hidden relative">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-arabic flex flex-wrap items-center gap-2">
            منور يا <span className="text-amber-600">{studentFirstName}</span> 👋
            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-sans">{getGradeLabel(userData?.grade)}</span>
            {isPremium ? (
              <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><Crown size={14}/> حساب VIP</span>
            ) : (
              <button className="bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 transition" onClick={()=>setActiveTab('subscription')}>مجاني (رقي حسابك)</button>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center min-w-[220px]">
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100"><p className="text-xl font-black text-amber-700">{videos.length}</p><p className="text-[11px] text-amber-800 font-bold">محاضرة</p></div>
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100"><p className="text-xl font-black text-blue-700">{exams.length}</p><p className="text-[11px] text-blue-800 font-bold">امتحان</p></div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100"><p className="text-xl font-black text-emerald-700">{examResults.length}</p><p className="text-[11px] text-emerald-800 font-bold">نتيجة</p></div>
        </div>
      </div>
    </section>
  );

  const LearningHubTabs = () => (
    <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm mb-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button onClick={() => { setLearningHubTab('assignments'); setActiveTab('assignments'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'assignments' ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-50 text-emerald-700'}`}>الواجبات</button>
        <button onClick={() => { setLearningHubTab('history'); setActiveTab('smart_hw_results'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'smart_hw_results' ? 'bg-blue-600 text-white shadow' : 'bg-blue-50 text-blue-700'}`}>سجل الواجبات</button>
        <button onClick={() => { setLearningHubTab('mistakes'); setActiveTab('mistakes_bank'); }} className={`px-5 py-3 rounded-2xl font-black transition ${activeTab === 'mistakes_bank' ? 'bg-red-600 text-white shadow' : 'bg-red-50 text-red-700'}`}>بنك الأخطاء</button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">

      <MobileStudentBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={user} userName={userData?.name} onClose={() => setPlayingVideo(null)} onProgress={handleVideoProgress} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} />}
      {/* النظام امتحانات الطلاب متوقفة مؤقتًا  */}
      <FloatingArabicBackground />
      
      <aside className={`fixed top-0 bottom-0 right-0 z-40 bg-white/95 backdrop-blur-xl w-72 p-6 shadow-xl transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} border-l border-slate-200 flex flex-col`}>
        <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
                <ModernLogo />
                <h1 className="text-2xl font-bold font-arabic text-amber-800">النحاس</h1>
            </div>
            <button onClick={() => setMobileMenu(false)} className="md:hidden"><X /></button>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto pr-2">
          <button onClick={() => {setActiveTab('home'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='home'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><User/> الرئيسية</button>
          
          <button onClick={() => {setActiveTab('subscription'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='subscription'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><Crown/> الباقة والاشتراك</button>

          {!isBannedContent && (
              <>
                <div onClick={() => {setActiveTab('courses'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='courses'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><BookOpen/> الكورسات التعليمية</div>
                <div onClick={() => {setActiveTab('videos'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='videos'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><PlayCircle/> المحاضرات</div>
                <div onClick={() => {setActiveTab('files'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='files'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><FileText/> الملفات و الروابط</div>
                <div onClick={() => {setActiveTab('htmls'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='htmls'?'bg-purple-100 text-purple-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-purple-600'}`}><Code/> محتوى تفاعلي</div>
              </>
          )}
          {!isBannedExam && (
              <>
                <div onClick={() => {setActiveTab('exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='exams'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><ClipboardList/> الامتحانات</div>
                <div onClick={() => {setLearningHubTab('assignments'); setActiveTab('assignments'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${['assignments','smart_hw_results','mistakes_bank'].includes(activeTab)?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><FileCheck/> الواجبات وبنك الأخطاء</div>
              </>
          )}
          <button onClick={() => {setActiveTab('settings'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${['settings','performance'].includes(activeTab)?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><Settings/> ملفي الشخصي والأداء</button>
        </div>
        <div className="mt-auto pt-6"><button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-500 font-bold hover:bg-red-50 w-full p-4 rounded-xl transition"><LogOut/> خروج</button></div>
      </aside>

      <main className="p-4 md:p-10 relative z-10 min-h-screen md:pr-72 w-full transition-all">
        <div className="md:hidden flex justify-between items-center mb-6 glass-panel p-4 rounded-2xl shadow-sm"><h1 className="font-bold text-lg text-slate-800">منصة النحاس</h1><button onClick={() => setMobileMenu(true)} className="p-2 bg-slate-100 rounded-lg"><Menu /></button></div>
        <div className="flex justify-between items-center mb-6 relative">
            <div className="flex gap-2">
                {installPrompt && ( <button onClick={installPrompt} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition flex items-center gap-2"><DownloadCloud size={18}/><span className="hidden md:inline">تثبيت التطبيق</span></button> )}
                <button onClick={() => setShowFocusMode(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-bold shadow-lg transition flex items-center gap-2"><Headphones size={18}/><span className="hidden md:inline">التركيز</span></button>
            </div>
            <div className="flex items-center gap-3">
                {isPremium && <span className="hidden md:flex bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold items-center gap-1 border border-amber-200"><Crown size={14}/> VIP صالح حتى: {userData?.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</span>}
            </div>
        </div>

        <StudentTopGreeting />
        {activeTab === 'home' && <div className="mb-6"><WisdomBox /></div>}

        {activeTab === 'home' && (
            <div className="space-y-8 page-soft-enter">
                <StudentContinueCard />
                <StudentSmartDashboard />
                <StudentCompactHome />
                                <Announcements />
                <PWAInstallBox installPrompt={installPrompt} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div whileHover={{ scale: 1.01 }} onClick={()=> !isBannedContent && setActiveTab('videos')} className={`bg-gradient-to-br from-blue-950 via-blue-800 to-sky-700 text-white p-7 rounded-[2rem] relative overflow-hidden cursor-pointer shadow-xl group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <div className="relative z-10"><p className="text-sky-200 font-black text-sm mb-2">مركز المحاضرات</p><h3 className="text-3xl font-black mb-3">المحاضرات والمساحات الأونلاين</h3><p className="text-blue-100 leading-relaxed text-sm">كل الشرح، التدريبات، المراجعات، والمحاضرات المباشرة داخل تبويبات منظمة.</p><div className="flex gap-3 mt-5"><span className="bg-white/15 px-4 py-2 rounded-2xl font-bold">{videos.length} فيديو</span></div></div><PlayCircle className="absolute -bottom-8 -left-8 text-white/10 w-52 h-52 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.01 }} onClick={()=> setActiveTab('settings')} className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 text-white p-7 rounded-[2rem] relative overflow-hidden cursor-pointer shadow-xl group">
                        <div className="relative z-10"><p className="text-emerald-200 font-black text-sm mb-2">النتائج والتطور</p><h3 className="text-3xl font-black mb-3">نتائجك وتحليل أدائك</h3><p className="text-emerald-100 leading-relaxed text-sm">تابع متوسطك، سجل امتحاناتك، ونقاط الضعف من مكان واحد داخل ملفك.</p><div className="flex gap-3 mt-5"><span className="bg-white/15 px-4 py-2 rounded-2xl font-bold">{examResults.length} نتيجة</span><span className="bg-white/15 px-4 py-2 rounded-2xl font-bold">{completedExamResults.length ? averageScore + '%' : '—'} متوسط</span></div></div><BarChart3 className="absolute -bottom-8 -left-8 text-white/10 w-52 h-52 group-hover:scale-110 transition"/>
                    </motion.div>
                </div>
                <Leaderboard />
                <PerformanceOverview examResults={examResults} content={content} />
            </div>
        )}


        {activeTab === 'performance' && (
            <div className="space-y-6">
                <PerformanceOverview examResults={examResults} content={content} />
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3/> سجل الامتحانات</h2>
                    <div className="space-y-3">
                        {examResults.length === 0 ? <p className="text-slate-500 text-center py-8 bg-white rounded-xl border">لم يتم تسجيل نتائج بعد.</p> : examResults.map(result => {
                            const pct = getResultPercentage(result);
                            const badge = getGradeBadge(pct);
                            return <div key={result.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div><p className="font-bold text-slate-800">{result.examTitle || 'امتحان'}</p><p className="text-xs text-slate-500">{result.submittedAt?.toDate?.().toLocaleString('ar-EG') || 'بدون تاريخ'}</p></div>
                                <div className="flex items-center gap-2"><span className={`px-3 py-1 rounded-full border text-xs font-bold ${badge.tone}`}>{badge.text}</span><span className="font-black text-slate-800">{result.score}/{result.total} - {pct}%</span></div>
                            </div>;
                        })}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'subscription' && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <Crown size={64} className={`mx-auto mb-4 ${isPremium ? 'text-amber-500' : 'text-slate-300'}`} />
                    <h2 className="text-3xl font-bold font-arabic text-slate-800 mb-2">حالة اشتراكك</h2>
                    {isPremium ? (
                        <p className="text-green-600 font-bold text-lg bg-green-50 inline-block px-4 py-2 rounded-full border border-green-200">أنت الآن على الباقة المدفوعة (VIP). صالحة حتى: {userData?.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</p>
                    ) : (
                        <p className="text-slate-500 font-bold text-lg">حسابك الآن مجاني. اشحن لتتمكن من فتح كل الفيديوهات والامتحانات المغلقة.</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Key className="text-amber-500"/> شحن بكود (كارت)</h3>
                        <p className="text-slate-500 text-sm mb-6">إذا اشتريت كارت شحن أو حصلت على كود من السنتر، اكتبه هنا لتفعيل اشتراكك فوراً.</p>
                        <form onSubmit={handleChargeSubscriptionCode} className="flex flex-col gap-3">
                            <input 
                                className="border-2 border-slate-200 p-4 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:border-amber-500 outline-none" 
                                placeholder="مثال: NAHAS-XXXXXX"
                                value={subscriptionCodeInput}
                                onChange={e=>setSubscriptionCodeInput(e.target.value.toUpperCase())}
                            />
                            <button disabled={isCharging} className="bg-amber-600 text-white font-bold py-4 rounded-xl hover:bg-amber-700 shadow-lg flex justify-center items-center">
                                {isCharging ? <Loader2 className="animate-spin" /> : 'اشحن الكود الآن'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-500">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="text-blue-500"/> شحن فودافون كاش / إنستا باي</h3>
                        <p className="text-slate-500 text-sm mb-4">للشحن اليدوي، قم بتحويل قيمة الاشتراك إلى أحد الأرقام التالية:</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 text-center">
                            <p className="font-bold text-lg text-blue-900 font-mono">010XXXXXXXX</p>
                            <p className="text-xs text-slate-400 mt-1">(فودافون كاش - إنستا باي)</p>
                        </div>
                        <p className="text-sm font-bold text-slate-700 mb-4">بعد التحويل، أرسل صورة الوصل على الواتساب مع إيميلك ليتم التفعيل.</p>
                        <button onClick={() => window.open("https://wa.me/201500076322", "_blank")} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 shadow-lg flex items-center justify-center gap-2">
                            <Phone size={20}/> إرسال الوصل واتساب
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'mistakes_bank' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs />
              <div className="glass-panel p-4 md:p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold font-arabic text-red-700 flex items-center gap-3"><BrainCircuit size={32} className="text-red-500" /> بنك أخطاء الطالب 🏦</h2>
                        <p className="text-slate-500 mt-2 text-sm md:text-lg">كل سؤال أخطأت فيه سيتم تسجيله هنا لتتمكن من مراجعته والتدرب عليه.</p>
                    </div>
                    <button onClick={startMistakesExam} className="bg-red-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold shadow-xl shadow-red-500/30 hover:bg-red-700 transition flex items-center gap-2 transform hover:scale-105 w-full md:w-auto justify-center"><Target size={20}/> امتحان من أخطائي</button>
                </div>
                {mistakes.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm"><Trophy size={64} className="mx-auto text-amber-400 mb-4 opacity-80" /><h3 className="text-2xl font-bold text-slate-700">ممتاز جداً يا بطل! 👏</h3><p className="text-slate-500 mt-2">بنك الأخطاء الخاص بك فارغ تماماً. استمر على هذا المستوى.</p></div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-bold flex items-center gap-2 text-sm md:text-base">
                            <AlertOctagon /> لديك {mistakes.length} سؤال في بنك الأخطاء. يجب مراجعتها جيداً قبل الامتحان النهائي!
                        </div>
                        {mistakes.map(m => (
                            <div key={m.id} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-red-300 transition relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">من امتحان: {m.examTitle}</div>
                                {m.question.blockText && <div className="mt-6 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-slate-800 leading-relaxed whitespace-pre-wrap"><p className="text-xs font-black text-amber-700 mb-2">القطعة المرتبطة بالسؤال</p>{renderBracketHighlightedText(m.question.blockText)}</div>}
                                <h3 className="text-lg md:text-xl font-bold text-slate-800 mt-6 md:mt-4 mb-4 leading-relaxed font-sans">{renderBracketHighlightedText(m.question.text)}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs text-red-500 font-bold mb-1">إجابتك الخاطئة كانت:</p><p className="font-bold text-slate-800">{m.question.studentAnswerText || 'غير معروف'}</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold mb-1">الإجابة الصحيحة هي:</p><p className="font-bold text-green-800">{m.question.correctAnswerText || 'غير معروف'}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
        )}

          {activeTab === 'courses' && !isBannedContent && <StudentCoursesHub user={user} userData={userData} exams={exams} onStartExam={startExamWithCode} />}

          {activeTab === 'videos' && !isBannedContent && (
            <div className="space-y-6">
                <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setVideoSectionTab('recorded')} className={`px-6 py-3 rounded-2xl font-black whitespace-nowrap transition ${videoSectionTab === 'recorded' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600'}`}>المحاضرات المسجلة</button>
                        
                    </div>
                    {videoSectionTab === 'recorded' && <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button onClick={() => setLectureInnerTab('explanation')} className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${lectureInnerTab === 'explanation' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>شرح الدروس</button>
                        <button onClick={() => setLectureInnerTab('exercises')} className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${lectureInnerTab === 'exercises' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>حل التدريبات</button>
                        <button onClick={() => setLectureInnerTab('reviews')} className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${lectureInnerTab === 'reviews' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>المراجعات النهائية</button>
                    </div>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {videos.filter(v => videoSectionTab === 'recorded' && (v.videoSection || 'explanation') === lectureInnerTab).length === 0 ? (
                         <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                             <PlayCircle className="mx-auto text-slate-300 w-16 h-16 mb-4"/>
                             <p className="text-slate-500 font-bold">لا توجد فيديوهات في هذا القسم حالياً.</p>
                         </div>
                    ) : videos.filter(v => videoSectionTab === 'recorded' && (v.videoSection || 'explanation') === lectureInnerTab).map(v => {
                        const watchPercent = getVideoWatchPercent(v);
                        return (
                        <div key={v.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative group">
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative" onClick={() => handlePremiumClick(() => setPlayingVideo(v))}>
                                {v.isPremium && !isPremium ? <Lock className="text-slate-400 w-16 h-16 opacity-80" /> : <PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span>
                                {v.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                            </div>
                            <div className="p-4 space-y-3">
                                <h3 className={`font-bold text-lg ${v.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{v.title}</h3>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${watchPercent}%` }} /></div>
                                <div className="flex items-center justify-between text-xs text-slate-500"><span>المشاهدة</span><span>{watchPercent}%</span></div>
                                {v.linkedExamId && (
                                  <div className="space-y-2">
                                    {watchPercent >= VIDEO_EXAM_UNLOCK_PERCENT ? (
                                      <button
                                        onClick={() => openLinkedExamFromVideo(v)}
                                        className="w-full py-2 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                                      >
                                        ابدأ امتحان الفيديو الآن
                                      </button>
                                    ) : (
                                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                        <p className="text-xs font-bold text-slate-600">
                                          شاهد {Math.max(0, VIDEO_EXAM_UNLOCK_PERCENT - watchPercent)}% إضافية لفتح امتحان الفيديو
                                        </p>
                                        <button
                                          onClick={() => handlePremiumClick(() => setPlayingVideo(v))}
                                          className="mt-2 w-full py-2 rounded-xl font-bold text-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        >
                                          استكمال مشاهدة الفيديو
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        )}

        {activeTab === 'files' && !isBannedContent && (
            <div className="glass-panel rounded-xl overflow-hidden">
                {filesAndLinks.map(f => (
                    <div key={f.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center border-b last:border-0 hover:bg-white/50 transition gap-4">
                        <div className="flex items-center gap-4">
                            {f.type === 'link' ? (<div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center"><LinkIcon size={16}/></div>) : (<div className="bg-red-100 text-red-600 p-3 rounded-lg font-bold text-xs shadow-sm">PDF</div>)}
                            <div>
                                <h4 className={`font-bold text-lg ${f.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'} flex items-center gap-2`}>
                                    {f.title}
                                    {f.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                </h4>
                                <span className="text-xs text-slate-500">{getGradeLabel(f.grade)}</span>
                            </div>
                        </div>
                        {f.isPremium && !isPremium ? (
                            <button onClick={()=>handlePremiumClick(()=>{})} className="px-4 py-2 rounded-lg font-bold transition shadow-sm bg-slate-100 text-slate-400 flex items-center justify-center gap-2"><Lock size={16}/> مقفل</button>
                        ) : (
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-lg font-bold transition shadow-sm text-center ${f.type === 'link' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{f.type === 'link' ? 'فتح الرابط' : 'تحميل'}</a>
                        )}
                    </div>
                ))}
            </div>
        )}
        
        {activeTab === 'htmls' && !isBannedContent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {htmls.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative" onClick={() => handlePremiumClick(() => setPlayingHtml(h))}>
                        <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center relative group">
                            {h.isPremium && !isPremium ? <Lock className="text-slate-400 w-20 h-20 opacity-80" /> : <Code className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                            {h.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                        </div>
                        <div className="p-4"><h3 className={`font-bold text-lg ${h.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{h.title}</h3><button className={`mt-2 w-full font-bold py-2 rounded-lg transition shadow-sm ${h.isPremium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>{h.isPremium && !isPremium ? 'مقفل' : 'تشغيل'}</button></div>
                    </motion.div>
                ))}
            </div>
        )}

        {activeTab === 'interactive_exams' && !isBannedExam && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:col-span-3 text-amber-800 font-bold">امتحان النظام المخصص متوقف مؤقتًا للطلاب. ستظل الامتحانات التفاعلية المنشورة من الأدمن متاحة هنا.</div>
                
                {interactiveExams.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative" onClick={() => handlePremiumClick(() => setPlayingHtml(h))}>
                        <div className="h-48 bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center relative group">
                            {h.isPremium && !isPremium ? <Lock className="text-slate-400 w-20 h-20 opacity-80" /> : <Sparkles className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                            {h.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                        </div>
                        <div className="p-4"><h3 className={`font-bold text-lg ${h.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{h.title}</h3><button className={`mt-2 w-full font-bold py-2 rounded-lg transition shadow-sm ${h.isPremium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>{h.isPremium && !isPremium ? 'مقفل' : 'بدء الامتحان'}</button></div>
                    </motion.div>
                ))}
            </div>
        )}
        
        {activeTab === 'exams' && !isBannedExam && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {exams.map(e => {
                const prevResult = examResults.find(r => r.examId === e.id);
                const isExamTimeOver = Date.now() > new Date(e.endTime).getTime();
                
                let statusText = null; let statusClass = "";
                const canResumeByAdmin = prevResult && prevResult.adminDecision === 'continue';
                const canRestartByAdmin = prevResult && prevResult.adminDecision === 'restart';
                const waitingAdminDecision = prevResult && ['security_hold', 'in_progress', 'cheated'].includes(prevResult.status) && !canResumeByAdmin && !canRestartByAdmin;
                if (prevResult) {
                    if (prevResult.status === 'completed') { statusText = `تم الحل: ${prevResult.score} درجة`; statusClass = "bg-green-500 text-white"; } 
                    else if (canResumeByAdmin) { statusText = "مسموح بالاستكمال ✅"; statusClass = "bg-blue-600 text-white"; }
                    else if (canRestartByAdmin) { statusText = "مسموح بالإعادة ✅"; statusClass = "bg-amber-600 text-white"; }
                    else if (prevResult.status === 'security_hold') { statusText = "موقوف في انتظار الأدمن 🛡️"; statusClass = "bg-red-600 text-white"; }
                    else if (prevResult.status === 'in_progress') { statusText = "ينتظر موافقة الأدمن ⏳"; statusClass = "bg-yellow-500 text-white"; } 
                    else if (prevResult.status === 'cheated') { statusText = "تم الحظر (غش)"; statusClass = "bg-red-600 text-white"; }
                }

                return (
                  <motion.div whileHover={{scale:1.01}} key={e.id} className={`glass-card p-4 md:p-6 rounded-2xl relative overflow-hidden flex flex-col ${e.isPremium && !isPremium ? 'opacity-70' : ''}`}>
                    {statusText && <div className={`absolute top-0 left-0 text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-br-xl font-bold shadow-md ${statusClass}`}>{statusText}</div>}
                    {e.isPremium && <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</div>}
                    
                    <h3 className={`text-lg md:text-xl font-bold mb-2 mt-4 md:mt-0 ${e.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{e.title}</h3>
                    <div className="flex justify-between text-xs md:text-sm text-slate-500 mb-4"><span>⏳ {e.duration} دقيقة</span><span>📝 {e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)} سؤال</span></div>
                    
                    <div className="mt-auto">
                        {prevResult && prevResult.status === 'completed' ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                                 <button disabled className="flex-1 bg-slate-200 text-slate-500 py-2 md:py-3 rounded-xl font-bold cursor-not-allowed text-xs md:text-sm">تم الانتهاء</button>
                                 {isExamTimeOver ? (
                                    <button onClick={() => setReviewingExam(e)} className="flex-1 bg-blue-100 text-blue-700 py-2 md:py-3 rounded-xl font-bold hover:bg-blue-200 transition shadow-sm text-xs md:text-sm">عرض الأخطاء</button>
                                 ) : (
                                    <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2 md:py-3 rounded-xl font-bold cursor-not-allowed text-[10px] md:text-xs">المراجعة بعد الوقت</button>
                                 )}
                                 <button onClick={() => generatePDF('student', {studentName: user.displayName, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status, examTitle: e.title, questions: e.questions.flatMap(q => q.subQuestions), answers: prevResult.answers })} className="flex-1 bg-green-100 text-green-700 py-2 md:py-3 rounded-xl font-bold hover:bg-green-200 flex items-center justify-center gap-1 transition shadow-sm text-xs md:text-sm"><Download size={14}/> شهادة</button>
                            </div>
                        ) : canResumeByAdmin ? (
                            <button onClick={() => startExamWithCode(e, { skipCode: true })} className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg transition text-sm">
                                <Play size={14}/> استكمال الامتحان بموافقة الأدمن
                            </button>
                        ) : canRestartByAdmin ? (
                            <button onClick={() => startExamWithCode(e, { skipCode: true })} className="w-full bg-amber-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-amber-700 flex items-center justify-center gap-2 shadow-lg transition text-sm">
                                <RefreshCw size={14}/> بدء الامتحان من جديد بموافقة الأدمن
                            </button>
                        ) : waitingAdminDecision ? (
                            <div className="bg-amber-50 text-amber-700 p-2 md:p-3 rounded-xl font-bold text-center border border-amber-200 text-sm">
                                المحاولة محفوظة. انتظر موافقة الأدمن للاستكمال أو الإعادة.
                            </div>
                        ) : prevResult ? (
                            <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-xl font-bold text-center border border-red-200 text-sm">لا يمكن دخول الامتحان</div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500">يبدأ: {new Date(e.startTime).toLocaleString('ar-EG')}</p>
                                {e.isPremium && !isPremium ? (
                                    <button onClick={()=>handlePremiumClick(()=>{})} className="w-full bg-slate-200 text-slate-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed text-sm"><Lock size={16}/> امتحان مقفل (للمشتركين)</button>
                                ) : (
                                    <button onClick={() => startExamWithCode(e)} className="w-full bg-slate-900 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-slate-500/30 transition text-sm"><Lock size={14}/> ابدأ الامتحان</button>
                                )}
                            </div>
                        )}
                    </div>
                  </motion.div>
                )
             })}
          </div>
        )}

        {activeTab === 'assignments' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs />
              <StudentAssignmentsPanel assignments={assignments} submissions={assignmentSubmissions} user={user} userData={userData} />
            </div>
        )}

        {activeTab === 'smart_hw_results' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs />
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                <h2 className="text-xl md:text-2xl font-bold mb-6 font-arabic text-blue-800 flex items-center gap-2"><QrCode/> سجل الواجبات الذكية (QR)</h2>
                {hwResults.length === 0 ? (
                    <p className="text-slate-500 text-center py-10 bg-white rounded-xl border font-bold text-sm md:text-base">لم تقم بتسليم أي واجب ذكي عبر الكاميرا حتى الآن.</p>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            const hwByBook = hwResults.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                            return Object.entries(hwByBook).map(([bookName, hws]) => (
                                <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                                    <h4 className="font-bold text-base md:text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 w-max"><BookOpen size={18}/> كتاب: {bookName}</h4>
                                    <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4 w-max min-w-full">
                                        {hws.map(hw => (
                                            <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-amber-400 transition">
                                                <div className="flex-1">
                                                    <p className="font-bold text-base md:text-lg text-slate-800">{hw.homeworkTitle}</p>
                                                    <p className="text-xs md:text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded text-wrap break-words whitespace-normal">تعليق المصحح: <span className="font-bold text-blue-600">{hw.feedback}</span></p>
                                                </div>
                                                <div className="flex flex-col md:items-end gap-2 flex-shrink-0 border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0">
                                                    <span className="text-lg md:text-xl font-black text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200 w-fit">{hw.score} / {hw.total}</span>
                                                    <span className="text-xs text-slate-400">{hw.submittedAt?.toDate().toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
              </div>
            </div>
        )}

        {activeTab === 'settings' && (
              <div className="space-y-6 max-w-5xl">
                <div className="glass-panel p-4 md:p-6 rounded-2xl"><PerformanceOverview examResults={examResults} content={content} /></div>
                <div className="glass-panel p-4 md:p-6 rounded-xl max-w-2xl">
                <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.name} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير الاسم (تواصل مع الإدارة).</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label><input className="w-full border p-3 rounded-xl" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم ولي الأمر</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.parentPhone} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير رقم ولي الأمر.</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي (يتطلب موافقة الأدمن)</label><select className="w-full border p-3 rounded-xl bg-white" value={editFormData.grade} onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}><GradeOptions /></select></div>
                  <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/40 transition mt-4">حفظ التعديلات</button>
                </form>
                </div>
              </div>
        )}
      </main>
    </div>
  );
};

const LandingPage = ({ onAuthClick, installPrompt }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); 
  const [playingHtml, setPlayingHtml] = useState(null);
  
  useEffect(() => { const u = onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true)), s => setPublicContent(s.docs.map(d=>d.data()))); return u; }, []);
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <div className="min-h-screen font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <WhatsAppContactButton />
      <nav className="relative z-10 flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto glass-panel mt-4 rounded-full mx-2 md:mx-4 shadow-lg">
        <div className="flex items-center gap-2"><ModernLogo /><span className="text-xl md:text-2xl font-bold font-arabic text-amber-800 hidden md:block">منصة النحاس</span></div>
        <div className="flex gap-2 md:gap-4 items-center">
          {installPrompt && ( <button onClick={installPrompt} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition items-center gap-2"><DownloadCloud size={18}/> تثبيت</button> )}
          <button onClick={openFacebook} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50"><Facebook size={20}/></button>
          <button onClick={onAuthClick} className="bg-slate-900 text-white px-4 md:px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-slate-500/50 transition transform hover:-translate-y-0.5 text-sm md:text-base">دخول الطالب</button>
        </div>
      </nav>
      <main className="relative z-10 px-4 mt-10 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">اللغة العربية <span className="text-amber-600">لعبتك</span></h1>
        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">أقوى منصة تعليمية للمرحلة الإعدادية والثانوية.</p>
        <button onClick={onAuthClick} className="bg-amber-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl text-lg md:text-xl font-bold shadow-xl hover:bg-amber-700 transition transform hover:-translate-y-1">اشترك الآن 🚀</button>
        {installPrompt && (<div className="md:hidden mt-6"><button onClick={installPrompt} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto text-sm"><DownloadCloud size={18}/> تثبيت المنصة على هاتفك</button></div>)}
        <div className="my-12 px-2"><WisdomBox /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-10 mb-20 px-2">
          <div className="bg-white/80 backdrop-blur p-4 md:p-6 rounded-3xl border border-white shadow-sm overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700"><Video /> فيديوهات للجميع</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'video').length > 0 ? publicContent.filter(c => c.type === 'video').map((v, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingVideo(v)}>
                     <div className="flex items-center gap-3 overflow-hidden">
                         <PlayCircle className="text-amber-500 shrink-0"/>
                         <span className="font-bold truncate text-sm md:text-base">{v.title}</span>
                     </div>
                     <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0">مشاهدة</span>
                 </div>
               )) : <p className="text-slate-500 text-sm">لا توجد فيديوهات عامة حالياً</p>}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur p-4 md:p-6 rounded-3xl border border-white shadow-sm overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-purple-700"><Code /> تفاعلي للجميع</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'html').length > 0 ? publicContent.filter(c => c.type === 'html').map((h, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingHtml(h)}>
                     <div className="flex items-center gap-3 overflow-hidden">
                         <Code className="text-purple-500 shrink-0"/>
                         <span className="font-bold truncate text-sm md:text-base">{h.title}</span>
                     </div>
                     <span className="text-[10px] md:text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded shrink-0">تشغيل</span>
                 </div>
               )) : <p className="text-slate-500 text-sm">لا يوجد محتوى تفاعلي عام حالياً</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
        if (!formData.name.trim()) {
            platformNotify("من فضلك اكتب اسم الطالب.");
            setLoading(false);
            return;
        }
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        if (!validation.ok) {
            platformNotify(validation.message);
            setLoading(false);
            return;
        }
    }

    try {
      if (isRegister) {
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        await updateProfile(userCred.user, { displayName: formData.name.trim() });
        await setDoc(doc(db, 'users', userCred.user.uid), { 
            name: formData.name.trim(), email: formData.email.trim(), grade: formData.grade, phone: validation.normalizedStudentPhone, 
            parentPhone: validation.normalizedParentPhone, role: 'student', status: 'pending', 
            subscriptionStatus: 'free', subscriptionExpiry: null, createdAt: new Date() 
        });
        platformNotify("تم إنشاء الحساب! انتظر تفعيل الأدمن.");
      } else { await signInWithEmailAndPassword(auth, formData.email, formData.password); }
    } catch (error) { platformNotify("حدث خطأ: " + error.message); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if(!formData.email) { platformNotify("من فضلك اكتب الإيميل الأول."); return; }
    try { await sendPasswordResetEmail(auth, formData.email); platformNotify("تم إرسال رابط استعادة كلمة السر."); } catch (error) { platformNotify("حدث خطأ: " + error.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-['Cairo'] relative overflow-hidden" dir="rtl">
      <FloatingArabicBackground />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative z-10 my-10 overflow-y-auto max-h-[90vh] border border-white/50 scrollbar-hide">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-4 md:mb-6 flex items-center gap-1 font-bold"><ChevronRight size={18} /> العودة</button>
        <div className="flex justify-center mb-4"><ModernLogo /></div>
        <h2 className="text-2xl md:text-3xl font-bold font-arabic text-slate-800 mb-2 text-center">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6">
          {isRegister && (
            <>
              <div className="relative"><User className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="text" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={18} /><select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none focus:border-amber-500 outline-none transition text-sm md:text-base" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></div>
            </>
          )}
          <div className="relative"><Mail className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="email" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="البريد" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="password" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          {!isRegister && (<div className="text-left"><button type="button" onClick={handleForgotPassword} className="text-xs text-amber-600 font-bold hover:underline">نسيت كلمة السر؟</button></div>)}
          <button disabled={loading} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/50 transition mt-2 flex justify-center">{loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'تسجيل' : 'دخول')}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="mt-4 md:mt-6 text-amber-800 font-bold hover:underline w-full text-center block text-sm">{isRegister ? 'تسجيل الدخول' : 'حساب جديد'}</button>
      </motion.div>
      <WhatsAppContactButton />
    </div>
  );
};


function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => 'landing');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
      const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
      if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker registration failed:', error?.message));
          });
      }
  }, []);

  const handleInstallClick = async () => {
      if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { setDeferredPrompt(null); } }
  };

  useEffect(() => {
    if (!auth) return;
    let unsubUserProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (unsubUserProfile) {
        unsubUserProfile();
        unsubUserProfile = null;
      }

      setUser(u);
      setAuthLoading(false);

      if (!u) {
        setUserData(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const adminSnap = await getDoc(doc(db, 'admins', u.uid));
        if (isActiveAdminSnapshot(adminSnap)) {
          navigatePlatform('/admin');
          return;
        }
      } catch (adminError) {
        console.warn('admin access check skipped:', adminError?.message);
      }

      if (getInitialRouteMode() === 'public') {
        navigatePlatform('/student');
      }

      unsubUserProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
        if (docSnap.exists()) {
          const dbUser = docSnap.data();
          setUserData({
            name: dbUser?.name || u.displayName || u.email?.split('@')?.[0] || 'طالب',
            email: dbUser?.email || u.email || '',
            grade: dbUser?.grade || '1sec',
            phone: dbUser?.phone || '',
            parentPhone: dbUser?.parentPhone || '',
            role: dbUser?.role || 'student',
            status: dbUser?.status || 'pending',
            subscriptionStatus: dbUser?.subscriptionStatus || 'free',
            subscriptionExpiry: dbUser?.subscriptionExpiry || null,
            ...dbUser
          });
        } else {
          setUserData({
            name: u.displayName || u.email?.split('@')?.[0] || 'طالب',
            email: u.email || '',
            grade: '1sec',
            phone: '',
            parentPhone: '',
            role: 'student',
            status: 'pending',
            subscriptionStatus: 'free',
            subscriptionExpiry: null
          });
        }
        setLoading(false);
      }, (error) => {
        console.warn('user profile listener blocked:', error?.message);
        setUserData({
          name: u.displayName || u.email?.split('@')?.[0] || 'طالب',
          email: u.email || '',
          grade: '1sec',
          role: 'student',
          status: 'pending',
          subscriptionStatus: 'free',
          subscriptionExpiry: null
        });
        setLoading(false);
      });
    });

    return () => {
      if (unsubUserProfile) unsubUserProfile();
      unsubAuth();
    };
  }, []);

  if (authLoading || (user && loading)) return (
    <div className="h-screen live-loading-screen flex items-center justify-center font-['Cairo']" dir="rtl">
      <div className="live-loader-card bg-white/90 border border-amber-100 rounded-3xl shadow-2xl p-8 w-[88%] max-w-sm text-center relative overflow-hidden">
        <div className="live-loader-orb w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 mx-auto mb-5 flex items-center justify-center text-white shadow-xl relative">
          <GearIcon className="gear-loader-main w-10 h-10" />
          <GearIcon className="gear-loader-small w-5 h-5 absolute -bottom-1 -left-1 text-amber-100" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">منصة النحاس التعليمية</h2>
        <p className="text-slate-500 font-bold">بنجهز تجربتك التعليمية...</p>
      </div>
    </div>
  );

  return (
    <AppErrorBoundary>
      <ToastCenter />
      <AnimatePresence mode='wait'>
        <DesignSystemLoader />
        <DebugCollector user={user} />
        <PlatformPerformanceBooster />
        <MobileExamHelperStyles />
        {!user ? (
          viewMode === 'landing'
            ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={deferredPrompt ? handleInstallClick : null} />
            : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
        ) : (
          <StudentDashboard key="student" user={user} userData={userData} installPrompt={deferredPrompt ? handleInstallClick : null} />
        )}
      </AnimatePresence>
    </AppErrorBoundary>
  );
}

export default App;
