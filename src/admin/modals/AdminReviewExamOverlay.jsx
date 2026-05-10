import React from 'react';
import ExamRunner from '../../shared/platformParts/ExamRunner.jsx';

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
