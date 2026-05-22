import { safeNumber, getResultPercentage, VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';

export function getStudentContentBuckets(content = []) {
  return {
    videos: content.filter((item) => item.type === 'video'),
    filesAndLinks: content.filter((item) => item.type === 'file' || item.type === 'link'),
    htmls: content.filter((item) => item.type === 'html'),
    interactiveExams: content.filter((item) => item.type === 'interactive_exam'),
  };
}

export function getStudentAssignmentSummary({ assignments = [], assignmentSubmissions = [] }) {
  const submittedAssignmentIds = new Set((assignmentSubmissions || []).map((item) => item.assignmentId));
  const pendingAssignments = (assignments || []).filter((item) => !submittedAssignmentIds.has(item.id));
  return { submittedAssignmentIds, pendingAssignments, pendingAssignmentsCount: pendingAssignments.length };
}

export function getStudentPerformanceSummary({ examResults = [] }) {
  const completedExamResults = (examResults || []).filter((item) => item.status === 'completed');
  const averageScore = completedExamResults.length > 0
    ? Math.round(completedExamResults.reduce((sum, item) => sum + getResultPercentage(item), 0) / completedExamResults.length)
    : 0;
  return { completedExamResults, averageScore };
}

export function getVideoCompletionSummary({ videos = [], getVideoWatchPercent }) {
  const completedVideoCount = (videos || []).filter((item) => getVideoWatchPercent(item) >= VIDEO_EXAM_UNLOCK_PERCENT).length;
  const videoCompletionPercent = videos.length > 0 ? Math.round((completedVideoCount / videos.length) * 100) : 0;
  return { completedVideoCount, videoCompletionPercent };
}

export function getSubscriptionDaysLeft({ isPremium, subscriptionExpiry, now = Date.now() }) {
  const subscriptionExpiryDate = subscriptionExpiry?.toDate ? subscriptionExpiry.toDate() : null;
  if (!isPremium || !subscriptionExpiryDate) return null;
  return Math.max(0, Math.ceil((subscriptionExpiryDate.getTime() - now) / (1000 * 60 * 60 * 24)));
}

export function getWeakBranches({ completedExamResults = [] }) {
  const totals = {};
  completedExamResults.slice(0, 8).forEach((result) => {
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
      wrong: data.wrong,
    }))
    .filter((item) => item.pct < 75 || item.wrong > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
}
