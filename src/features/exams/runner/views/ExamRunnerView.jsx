import { lazy, Suspense, useEffect, useMemo, useRef } from 'react';
import { burstConfetti } from '@v2/ui/kit.jsx';
import CinemaExam from '@v2/exam/CinemaExam.jsx';
import { setUpdateBlocked } from '@v2/device/liveUpdate.js';

const ExamReview = lazy(() => import('@v2/student/ExamReview.jsx'));

// v2: the runner keeps its own layout; .nx-bridge maps its Tailwind colours to the platform theme (light/dark).
export function ExamRunnerView({ ctx }) {
  return <div className="nx nx-bridge nx-exam-host" dir="rtl"><ExamRunnerScreens ctx={ctx} /></div>;
}

function ExamRunnerScreens({ ctx }) {
  const {
    exam, user, isSubmitted, timeLeft, score, mcqQuestions,
    flatQuestions, answers, onClose, setActiveView, confirmSubmit,
    percentage, setActiveBranchTab, wmPositions, isOnline,
    lastLocalSaveAt, showAntiCheatChoice, showSubmitConfirm, handleSubmit, submissionError, submitting,
    setShowSubmitConfirm, activeBranchTab, uniqueBranches, displayQuestions,
    flagged, currentQIndex, setCurrentQIndex, currentQObj, handleAnswer,
    setFlagged, handleEssayImageUpload, fileDialogBypassRef, isReviewMode, existingResult,
  } = ctx;

  // celebrate a good result once, right after submitting (not when reopening an old result)
  const wasSubmitted = useRef(isSubmitted);
  useEffect(() => {
    if (!wasSubmitted.current && isSubmitted && Number(percentage) >= 75) burstConfetti(Number(percentage) >= 90 ? 70 : 42);
    wasSubmitted.current = isSubmitted;
  }, [isSubmitted, percentage]);

  // ممنوع التحديث التلقائي يعيد تحميل الصفحة والطالب بيمتحن.
  useEffect(() => {
    if (isSubmitted || isReviewMode) return undefined;
    setUpdateBlocked('exam');
    return () => setUpdateBlocked(null);
  }, [isSubmitted, isReviewMode]);

  // After submitting (or when reopening a saved attempt): the score right away, the full review once the exam window closes.
  const submittedAt = useMemo(() => (isSubmitted ? new Date() : null), [isSubmitted]);
  const result = useMemo(() => (existingResult ? existingResult : {
    answers, score, total: mcqQuestions?.length || 0, percentage, status: 'completed',
    timeTaken: Math.max(0, Number(exam.duration || 0) * 60 - Number(timeLeft || 0)),
    submittedAt: submittedAt || new Date(),
  }), [existingResult, answers, score, mcqQuestions, percentage, exam.duration, timeLeft, submittedAt]);
  if (isSubmitted) {
    const reviewExam = isReviewMode ? { ...exam, allowReviewImmediately: true } : exam;
    return <Suspense fallback={null}><ExamReview exam={reviewExam} result={result} onClose={onClose} /></Suspense>;
  }

  return (
    <CinemaExam
      exam={exam}
      user={user}
      isSubmitted={isSubmitted}
      wmPositions={wmPositions}
      isOnline={isOnline}
      lastLocalSaveAt={lastLocalSaveAt}
      submissionError={submissionError}
      submitting={submitting}
      showAntiCheatChoice={showAntiCheatChoice}
      onClose={onClose}
      showSubmitConfirm={showSubmitConfirm}
      onSubmit={() => handleSubmit(false)}
      onCancelSubmit={() => setShowSubmitConfirm(false)}
      timeLeft={timeLeft}
      activeBranchTab={activeBranchTab}
      uniqueBranches={uniqueBranches}
      onDashboard={() => setActiveView('dashboard')}
      onConfirmSubmit={confirmSubmit}
      onBranchChange={setActiveBranchTab}
      displayQuestions={displayQuestions}
      flatQuestions={flatQuestions}
      answers={answers}
      flagged={flagged}
      currentQIndex={currentQIndex}
      onSelectQuestion={setCurrentQIndex}
      currentQObj={currentQObj}
      onAnswer={handleAnswer}
      onFlagToggle={(questionId) => setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }))}
      onImageUpload={handleEssayImageUpload}
      onFileDialogOpen={() => { fileDialogBypassRef.current = true; }}
      onPrevious={() => setCurrentQIndex((p) => p - 1)}
      onNext={() => setCurrentQIndex((p) => p + 1)}
    />
  );
}
