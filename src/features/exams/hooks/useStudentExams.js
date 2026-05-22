import { useMemo } from 'react';

export const useStudentExams = ({ exams = [], examResults = [], examAccessOverrides = [] } = {}) => useMemo(() => ({
  exams,
  examResults,
  examAccessOverrides,
  completedExamResults: examResults.filter((result) => result.status === 'completed'),
  inProgressExamResults: examResults.filter((result) => result.status === 'in_progress')
}), [exams, examResults, examAccessOverrides]);

export default useStudentExams;
