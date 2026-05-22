import { getResultPercentage, safeNumber } from '@shared/core/platformShared.jsx';

export function resolveStudentExamAccessState({ exam, exams = [], examResults = [], examAccessOverrides = [], studentId }) {
  const rule = exam?.accessRule;
  if (!rule?.enabled || !rule.requiredExamId) return { allowed: true, locked: false };

  const override = (examAccessOverrides || []).find((item) => item.examId === exam.id && item.studentId === studentId && item.allowed !== false);
  if (override && rule.allowAdminOverride !== false) {
    return { allowed: true, locked: false, override: true, message: 'مفتوح لك باستثناء من الإدارة.' };
  }

  const requiredExam = exams.find((item) => item.id === rule.requiredExamId);
  const attempts = examResults.filter((result) => result.examId === rule.requiredExamId && result.status === 'completed');
  const percentages = attempts.map((result) => {
    if (result.percentage !== undefined) return safeNumber(result.percentage, 0);
    return getResultPercentage(result);
  });
  const bestPercentage = percentages.length ? Math.max(...percentages) : null;
  const requiredPercentage = Math.min(100, Math.max(0, safeNumber(rule.requiredPercentage, 70)));

  if (bestPercentage !== null && bestPercentage >= requiredPercentage) {
    return { allowed: true, locked: false, bestPercentage, requiredPercentage };
  }

  const requiredTitle = requiredExam?.title || 'الامتحان السابق';
  const message = bestPercentage === null
    ? `يجب حل ${requiredTitle} أولًا بنسبة ${requiredPercentage}% أو أكثر.`
    : `يجب اجتياز ${requiredTitle} بنسبة ${requiredPercentage}% أو أكثر. درجتك الحالية: ${bestPercentage}%.`;

  return { allowed: false, locked: true, bestPercentage, requiredPercentage, requiredTitle, message };
}
