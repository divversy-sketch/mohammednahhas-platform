import ExamWatermarkLayer from '@features/exams/components/ExamWatermarkLayer.jsx';
import ExamSecurityHoldOverlay from '@features/exams/components/ExamSecurityHoldOverlay.jsx';
import ExamSubmitConfirmDialog from '@features/exams/components/ExamSubmitConfirmDialog.jsx';
import ExamTopBar from '@features/exams/components/ExamTopBar.jsx';
import ExamQuestionNavigator from '@features/exams/components/ExamQuestionNavigator.jsx';
import ExamQuestionPanel from '@features/exams/components/ExamQuestionPanel.jsx';
import { ConnectionStatusBanner } from '@shared/ui/ConnectionStatusBanner.jsx';
import { platformNotify } from '@shared/core/platformShared.jsx';

export const ExamRunnerQuestionsView = (props) => {
  const {
    exam, user, isSubmitted, wmPositions, isOnline, lastLocalSaveAt, showAntiCheatChoice, onClose,
    showSubmitConfirm, onSubmit, onCancelSubmit, timeLeft, activeBranchTab, uniqueBranches, onDashboard,
    onConfirmSubmit, onBranchChange, displayQuestions, flatQuestions, answers, flagged, currentQIndex,
    onSelectQuestion, currentQObj, onAnswer, onFlagToggle, onImageUpload, onFileDialogOpen, onPrevious, onNext
  } = props;
  const answeredCount = displayQuestions.filter((question) => {
    const value = answers?.[question.id];
    return value !== undefined && value !== '' && value !== null;
  }).length;
  const progress = displayQuestions.length ? Math.round((answeredCount / displayQuestions.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 font-['Cairo'] no-select" dir="rtl">
      {!isSubmitted && <ExamWatermarkLayer positions={wmPositions} user={user} />}
      {!isSubmitted && <ConnectionStatusBanner isOnline={isOnline} lastLocalSaveAt={lastLocalSaveAt} />}
      {showAntiCheatChoice && <ExamSecurityHoldOverlay onClose={onClose} />}
      {showSubmitConfirm && <ExamSubmitConfirmDialog onSubmit={onSubmit} onCancel={onCancelSubmit} />}

      <ExamTopBar exam={exam} isSubmitted={isSubmitted} timeLeft={timeLeft} activeBranchTab={activeBranchTab} uniqueBranches={uniqueBranches} onDashboard={onDashboard} onSubmit={onConfirmSubmit} onBranchChange={onBranchChange} onFullscreen={() => document.documentElement.requestFullscreen?.().catch(() => platformNotify('لو ملء الشاشة لم يعمل، افتح المنصة من المتصفح مباشرة وليس داخل تطبيق خارجي.'))} />

      {!isSubmitted && (
        <div className="relative z-50 border-b border-slate-200/70 bg-white/70 px-3 py-3 backdrop-blur md:px-6">
          <div className="mx-auto flex max-w-[1700px] items-center gap-4 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
            <span className="whitespace-nowrap text-xs font-black text-slate-600 md:text-sm">التقدم في الامتحان</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-indigo-500 to-violet-600 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            <span className="min-w-10 text-left text-sm font-black text-indigo-600">{progress}%</span>
            <span className="hidden text-xs font-bold text-emerald-600 md:block">✓ تم حفظ إجاباتك تلقائيًا</span>
          </div>
        </div>
      )}

      <div className="relative z-40 flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <ExamQuestionNavigator displayQuestions={displayQuestions} flatQuestions={flatQuestions} answers={answers} flagged={flagged} isSubmitted={isSubmitted} currentQIndex={currentQIndex} onSelectQuestion={onSelectQuestion} />
        <ExamQuestionPanel exam={exam} question={currentQObj} flatQuestions={flatQuestions} displayQuestions={displayQuestions} answers={answers} flagged={flagged} currentQIndex={currentQIndex} isSubmitted={isSubmitted} onAnswer={onAnswer} onFlagToggle={onFlagToggle} onImageUpload={onImageUpload} onFileDialogOpen={onFileDialogOpen} onPrevious={onPrevious} onNext={onNext} />
      </div>
    </div>
  );
};

export default ExamRunnerQuestionsView;
