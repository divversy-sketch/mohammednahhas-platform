import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const DEFAULT_PLATFORM_SETTINGS = {
  platformName: 'منصة النحاس التعليمية',
  registrationOpen: true,
  defaultExamGatePercent: 70,
  lessonCompletionWatchPercent: 80,
  showLockedItems: true,
  enableSmartReview: true,
  enableInternalNotifications: true,
};

export const ADMIN_ROLE_PERMISSIONS = {
  owner: ['*'],
  manager: ['students:read', 'students:write', 'exams:read', 'exams:write', 'content:write', 'settings:read'],
  exams_supervisor: ['students:read', 'exams:read', 'exams:write', 'question_bank:write'],
  students_supervisor: ['students:read', 'students:write', 'payments:write', 'notifications:write'],
  content_supervisor: ['content:read', 'content:write', 'courses:write', 'question_bank:read'],
};

export function canAdmin(role = 'manager', permission = '') {
  const permissions = ADMIN_ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

export function buildCourseTree(items = []) {
  const tree = new Map();
  items.forEach((item) => {
    const unit = item.unit || item.branch || 'بدون وحدة';
    const lesson = item.lesson || item.topic || item.title || 'درس غير محدد';
    if (!tree.has(unit)) tree.set(unit, new Map());
    if (!tree.get(unit).has(lesson)) tree.get(unit).set(lesson, []);
    tree.get(unit).get(lesson).push(item);
  });
  return Array.from(tree.entries()).map(([unitTitle, lessonsMap]) => ({
    unitTitle,
    lessons: Array.from(lessonsMap.entries()).map(([lessonTitle, resources]) => ({ lessonTitle, resources })),
  }));
}

export function getBestExamPercentage(results = [], examId, studentId) {
  const attempts = results.filter((r) => r.examId === examId && (r.userId === studentId || r.studentId === studentId));
  if (!attempts.length) return null;
  return Math.max(...attempts.map((r) => Number(r.percentage ?? r.percent ?? r.scorePercentage ?? 0)));
}

export function evaluateExamGate({ exam, studentId, results = [], overrides = [] }) {
  const rule = exam?.accessRule;
  if (!rule?.enabled) return { allowed: true, reason: 'open' };
  const override = overrides.find((o) => (o.examId === exam.id || o.examId === exam.examId) && (o.studentId === studentId || o.userId === studentId) && o.allowed !== false);
  if (override) return { allowed: true, reason: 'admin_override', override };
  const best = getBestExamPercentage(results, rule.requiredExamId, studentId);
  const required = Number(rule.requiredPercentage || 0);
  if (best === null) return { allowed: false, reason: 'not_attempted', currentPercentage: null, requiredPercentage: required };
  if (best >= required) return { allowed: true, reason: 'passed_previous_exam', currentPercentage: best, requiredPercentage: required };
  return { allowed: false, reason: 'low_score', currentPercentage: best, requiredPercentage: required };
}

export function evaluateLessonGate({ lesson, previousLesson, videoViews = [], examResults = [], studentId }) {
  const rule = lesson?.unlockRule;
  if (!rule?.enabled) return { allowed: true, reason: 'open' };
  if (rule.type === 'watch_previous_lesson') {
    const required = Number(rule.requiredWatchPercent || 80);
    const view = videoViews.find((v) => (v.lessonId === previousLesson?.id || v.contentId === previousLesson?.id) && (v.userId === studentId || v.studentId === studentId));
    const percent = Number(view?.watchPercent || view?.progress || 0);
    return percent >= required
      ? { allowed: true, reason: 'watched_previous', currentPercentage: percent, requiredPercentage: required }
      : { allowed: false, reason: 'watch_previous_required', currentPercentage: percent, requiredPercentage: required };
  }
  if (rule.type === 'pass_exam') {
    const best = getBestExamPercentage(examResults, rule.requiredExamId, studentId);
    const required = Number(rule.requiredPercentage || 70);
    return best >= required
      ? { allowed: true, reason: 'passed_exam', currentPercentage: best, requiredPercentage: required }
      : { allowed: false, reason: 'exam_gate_required', currentPercentage: best, requiredPercentage: required };
  }
  return { allowed: true, reason: 'unknown_rule_open' };
}

export function calculateStudentPerformance({ studentId, content = [], videoViews = [], exams = [], results = [], assignments = [], assignmentSubmissions = [] }) {
  const watched = videoViews.filter((v) => v.userId === studentId || v.studentId === studentId);
  const studentResults = results.filter((r) => r.userId === studentId || r.studentId === studentId);
  const studentAssignments = assignmentSubmissions.filter((s) => s.userId === studentId || s.studentId === studentId);
  const avgExam = studentResults.length
    ? Math.round(studentResults.reduce((sum, r) => sum + Number(r.percentage ?? r.percent ?? 0), 0) / studentResults.length)
    : 0;
  return {
    watchedVideos: watched.length,
    totalVideos: content.filter((c) => c.type === 'video').length,
    solvedExams: studentResults.length,
    totalExams: exams.length,
    submittedAssignments: studentAssignments.length,
    totalAssignments: assignments.length,
    averageExamPercentage: avgExam,
    lastActivityAt: [...watched, ...studentResults, ...studentAssignments]
      .map((x) => x.submittedAt || x.updatedAt || x.createdAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null,
  };
}

export function detectWeaknesses({ studentId, results = [], mistakes = [] }) {
  const buckets = new Map();
  mistakes
    .filter((m) => m.userId === studentId || m.studentId === studentId)
    .forEach((m) => {
      const key = m.topic || m.lesson || m.branch || 'غير مصنف';
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

  results
    .filter((r) => r.userId === studentId || r.studentId === studentId)
    .forEach((r) => {
      (r.questionBreakdown || r.wrongQuestions || []).forEach((q) => {
        const key = q.topic || q.lesson || q.branch || 'غير مصنف';
        buckets.set(key, (buckets.get(key) || 0) + 1);
      });
    });

  return Array.from(buckets.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function generateSmartExamFromQuestionBank({ questions = [], branch = 'all', topics = [], difficulty = 'all', count = 20 }) {
  const filtered = questions.filter((q) => {
    const branchOk = branch === 'all' || q.branch === branch;
    const topicOk = !topics.length || topics.includes(q.topic) || (q.tags || []).some((tag) => topics.includes(tag));
    const difficultyOk = difficulty === 'all' || q.difficulty === difficulty;
    return branchOk && topicOk && difficultyOk;
  });
  return filtered
    .map((q) => ({ ...q, _sort: Math.random() }))
    .sort((a, b) => a._sort - b._sort)
    .slice(0, Number(count || 20))
    .map(({ _sort, ...q }) => q);
}

export function buildSmartReviewPlan({ weaknesses = [], content = [], questionBank = [] }) {
  return weaknesses.map((w) => ({
    topic: w.topic,
    reason: `${w.count} أخطاء/مؤشرات ضعف`,
    lessons: content.filter((c) => [c.topic, c.lesson, c.branch, c.title].includes(w.topic)).slice(0, 5),
    practiceQuestions: questionBank.filter((q) => q.topic === w.topic || (q.tags || []).includes(w.topic)).slice(0, 10),
  }));
}

export async function createInternalNotification(db, { userId, title, body, type = 'system', link = '/', createdBy = 'system' }) {
  return addDoc(collection(db, 'internal_notifications'), {
    userId,
    title,
    body,
    type,
    link,
    read: false,
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function writeAdminAuditLog(db, { action, adminId, targetId = '', details = {} }) {
  return addDoc(collection(db, 'admin_audit_logs'), {
    action,
    adminId,
    targetId,
    details,
    createdAt: serverTimestamp(),
  });
}
