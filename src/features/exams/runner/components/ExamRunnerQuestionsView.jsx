import ExamWatermarkLayer from '@features/exams/components/ExamWatermarkLayer.jsx';
import ExamSecurityHoldOverlay from '@features/exams/components/ExamSecurityHoldOverlay.jsx';
import ExamSubmitConfirmDialog from '@features/exams/components/ExamSubmitConfirmDialog.jsx';
import ExamTopBar from '@features/exams/components/ExamTopBar.jsx';
import ExamQuestionNavigator from '@features/exams/components/ExamQuestionNavigator.jsx';
import ExamQuestionPanel from '@features/exams/components/ExamQuestionPanel.jsx';
import { ConnectionStatusBanner } from '@shared/ui/ConnectionStatusBanner.jsx';
import { platformNotify } from '@shared/core/platformShared.jsx';

export const ExamRunnerQuestionsView = ({
  exam,
  user,
  isSubmitted,
  wmPositions,
  isOnline,
  lastLocalSaveAt,
  showAntiCheatChoice,
  onClose,
  showSubmitConfirm,
  onSubmit,
  onCancelSubmit,
  timeLeft,
  activeBranchTab,
  uniqueBranches,
  onDashboard,
  onConfirmSubmit,
  onBranchChange,
  displayQuestions,
  flatQuestions,
  answers,
  flagged,
  currentQIndex,
  onSelectQuestion,
  currentQObj,
  onAnswer,
  onFlagToggle,
  onImageUpload,
  onFileDialogOpen,
  onPrevious,
  onNext
}) => (
  <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
    {!isSubmitted && <ExamWatermarkLayer positions={wmPositions} user={user} />}
    {!isSubmitted && <ConnectionStatusBanner isOnline={isOnline} lastLocalSaveAt={lastLocalSaveAt} />}

    {showAntiCheatChoice && <ExamSecurityHoldOverlay onClose={onClose} />}

    {showSubmitConfirm && (
      <ExamSubmitConfirmDialog
        onSubmit={onSubmit}
        onCancel={onCancelSubmit}
      />
    )}

    <ExamTopBar
      exam={exam}
      isSubmitted={isSubmitted}
      timeLeft={timeLeft}
      activeBranchTab={activeBranchTab}
      uniqueBranches={uniqueBranches}
      onDashboard={onDashboard}
      onSubmit={onConfirmSubmit}
      onBranchChange={onBranchChange}
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
        onSelectQuestion={onSelectQuestion}
      />

      <ExamQuestionPanel
        exam={exam}
        question={currentQObj}
        flatQuestions={flatQuestions}
        displayQuestions={displayQuestions}
        answers={answers}
        flagged={flagged}
        currentQIndex={currentQIndex}
        isSubmitted={isSubmitted}
        onAnswer={onAnswer}
        onFlagToggle={onFlagToggle}
        onImageUpload={onImageUpload}
        onFileDialogOpen={onFileDialogOpen}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  </div>
);

export default ExamRunnerQuestionsView;
