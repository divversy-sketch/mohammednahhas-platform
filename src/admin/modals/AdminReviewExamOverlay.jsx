
import ExamRunner from '@features/exams/runner/ExamRunner.jsx';

export default function AdminReviewExamOverlay({ adminReviewExamData, adminReviewResult, onClose }) {
  if (!adminReviewExamData || !adminReviewResult) return null;

  return (
    <ExamRunner
      exam={adminReviewExamData.exam}
      user={adminReviewExamData.user}
      existingResult={adminReviewResult}
      isReviewMode={true}
      onClose={onClose}
    />
  );
}
