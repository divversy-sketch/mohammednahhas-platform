import { useState, useEffect, useRef, useMemo } from 'react';

import { doc, setDoc, collection, serverTimestamp, writeBatch, increment } from 'firebase/firestore';

import { db } from '@services/firebase';


import { uploadToCloudinary } from '@services/cloudinaryUpload';

import { platformNotify, safeNumber, calculateDetailedExamMetrics } from '@shared/core/platformShared.jsx';

import { makeExamAutosaveKey, readLocalExamBackup, writeLocalExamBackupToStorage, clearLocalExamBackup, flattenExamQuestions } from '@shared/exam/examState.js';
import { useOnlineStatus } from '@shared/ui/ConnectionStatusBanner.jsx';
import { ExamEmptyState, ExamCheatingScreen } from '@features/exams/runner/components/ExamRunnerStateScreens.jsx';
import { ExamRunnerView } from '@features/exams/runner/views/ExamRunnerView.jsx';



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
  const [startTime, setStartTime] = useState(() => {
    const savedStart = existingResult?.startedAt?.toDate?.()?.getTime?.() || existingResult?.startedAtMillis || exam.resumeData?.startedAt?.toDate?.()?.getTime?.() || exam.resumeData?.startedAtMillis || (localExamBackup?.startedAt ? new Date(localExamBackup.startedAt).getTime() : null);
    return Number.isFinite(savedStart) && savedStart > 0 ? savedStart : Date.now();
  });
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
      antiCheatLog,
      startedAt: new Date(startTime).toISOString()
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
        startedAtMillis: startTime,
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
    const freshStartTime = Date.now();
    setStartTime(freshStartTime);
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
          startedAtMillis: freshStartTime,
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
            startedAtMillis: startTime,
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
      status: 'in_progress',
      startedAtMillis: startTime
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
      clearLocalExamBackup(autosaveKey);
      platformNotify(auto ? 'انتهى الوقت وتم تسليم الامتحان تلقائيًا. تم حفظ الإجابات.' : 'تم تسليم الامتحان وحفظ النتيجة بنجاح.');
    } catch (err) {
      console.error("Error saving results or mistakes", err);
      writeLocalExamBackup(answers, { status: 'completed_locally', submittedLocallyAt: new Date().toISOString() });
      platformNotify('تعذر رفع النتيجة للسيرفر الآن. تم حفظ نسخة محلية، لا تغلق الجهاز وحاول الاتصال بالإنترنت.');
    }
  };

  if (flatQuestions.length === 0) return <ExamEmptyState onClose={onClose} />;

  const currentQObj = displayQuestions[currentQIndex];
  if (!currentQObj) return null;

  if (isCheating) return <ExamCheatingScreen />;

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

  return <ExamRunnerView ctx={{
    exam, user, activeView, isSubmitted, timeLeft, score, mcqQuestions,
    flatQuestions, answers, onClose, setActiveView, confirmSubmit, totalQs,
    percentage, solvedQs, correctQs, wrongQs, essayAnswered, essayQuestions,
    antiCheatWarnings, branchStats, setActiveBranchTab, wmPositions, isOnline,
    lastLocalSaveAt, showAntiCheatChoice, showSubmitConfirm, handleSubmit,
    setShowSubmitConfirm, activeBranchTab, uniqueBranches, displayQuestions,
    flagged, currentQIndex, setCurrentQIndex, currentQObj, handleAnswer,
    setFlagged, handleEssayImageUpload, fileDialogBypassRef,
  }} />;
};

export default ExamRunner;
