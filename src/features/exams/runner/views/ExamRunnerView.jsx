import ExamDashboardView from '@features/exams/components/ExamDashboardView.jsx';
import ExamRunnerQuestionsView from '@features/exams/runner/components/ExamRunnerQuestionsView.jsx';

export function ExamRunnerView({ ctx }) {
  const {
    exam, user, activeView, isSubmitted, timeLeft, score, mcqQuestions,
    flatQuestions, answers, onClose, setActiveView, confirmSubmit, totalQs,
    percentage, solvedQs, correctQs, wrongQs, essayAnswered, essayQuestions,
    antiCheatWarnings, branchStats, setActiveBranchTab, wmPositions, isOnline,
    lastLocalSaveAt, showAntiCheatChoice, showSubmitConfirm, handleSubmit,
    setShowSubmitConfirm, activeBranchTab, uniqueBranches, displayQuestions,
    flagged, currentQIndex, setCurrentQIndex, currentQObj, handleAnswer,
    setFlagged, handleEssayImageUpload, fileDialogBypassRef,
  } = ctx;

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
    <ExamRunnerQuestionsView
      exam={exam}
      user={user}
      isSubmitted={isSubmitted}
      wmPositions={wmPositions}
      isOnline={isOnline}
      lastLocalSaveAt={lastLocalSaveAt}
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
