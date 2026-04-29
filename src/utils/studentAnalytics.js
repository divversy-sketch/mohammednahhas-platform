// src/utils/studentAnalytics.js
// تحليل نتائج الطالب بدقة — بدون AI

export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// إصلاح مهم:
// الخاطئة = إجمالي الأسئلة المحسوبة - الصحيحة
// لا يتم احتساب المقالي كخطأ تلقائيًا.
export function calculateResultStats({ total = 0, correct = 0 }) {
  const safeTotal = safeNumber(total, 0);
  const safeCorrect = safeNumber(correct, 0);

  const wrong = Math.max(0, safeTotal - safeCorrect);

  const percentage =
    safeTotal > 0 ? Math.round((safeCorrect / safeTotal) * 100) : 0;

  return {
    total: safeTotal,
    correct: safeCorrect,
    wrong,
    percentage
  };
}

export function getResultPercentage(result = {}) {
  if (safeNumber(result.percentage, -1) >= 0) {
    return safeNumber(result.percentage, 0);
  }

  const total =
    safeNumber(result.totalPossible, 0) ||
    safeNumber(result.total, 0);

  const score =
    safeNumber(result.totalScore, 0) ||
    safeNumber(result.score, 0);

  return total > 0 ? Math.round((score / total) * 100) : 0;
}

// تحليل الفروع بدقة.
// يعتمد على wrong الموجود لو متاح.
// ولو مش متاح يحسبه من total - correct.
export function analyzeBranches(branchStats = {}) {
  const branches = Object.entries(branchStats || {}).map(([branch, data]) => {
    const total = safeNumber(data.total, 0);
    const correct = safeNumber(data.correct, 0);

    const possible = safeNumber(data.possible, 0);
    const earned = safeNumber(data.earned, 0);

    const wrong =
      data.wrong !== undefined
        ? safeNumber(data.wrong, 0)
        : Math.max(0, total - correct);

    const percentage =
      possible > 0
        ? Math.round((earned / possible) * 100)
        : total > 0
          ? Math.round((correct / total) * 100)
          : 0;

    return {
      branch,
      total,
      correct,
      wrong,
      possible,
      earned,
      percentage
    };
  });

  return branches.sort((a, b) => a.percentage - b.percentage);
}

// الفروع الضعيفة فقط.
// شرط مهم: لا ننصح الطالب بمراجعة فرع ليس به أخطاء.
export function getWeakBranches(branches = []) {
  return (Array.isArray(branches) ? branches : [])
    .filter((b) => safeNumber(b.wrong, 0) > 0)
    .filter((b) => safeNumber(b.percentage, 100) < 80)
    .sort((a, b) => a.percentage - b.percentage);
}

export function getStrongBranches(branches = []) {
  return (Array.isArray(branches) ? branches : [])
    .filter((b) => safeNumber(b.total, 0) > 0 || safeNumber(b.possible, 0) > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
}

export function generateAdvice({ branches = [] } = {}) {
  const weak = getWeakBranches(branches);

  if (weak.length === 0) {
    return [
      "أداؤك ممتاز. استمر على نفس المستوى وراجع الأسئلة التي أخذت منك وقتًا أطول."
    ];
  }

  return weak.slice(0, 3).map((b) => {
    return `راجع فرع ${b.branch}: نسبتك ${b.percentage}% وبه ${b.wrong} أخطاء تحتاج تصحيح.`;
  });
}

export function buildStudentAnalytics({ results = [], mistakes = [] } = {}) {
  const completed = (Array.isArray(results) ? results : [])
    .filter((r) => r.status === "completed");

  const totalExams = completed.length;

  const average =
    totalExams > 0
      ? Math.round(
          completed.reduce((sum, r) => sum + getResultPercentage(r), 0) /
            totalExams
        )
      : 0;

  const latest =
    completed
      .slice()
      .sort((a, b) => {
        const aTime =
          a.submittedAt?.seconds
            ? a.submittedAt.seconds * 1000
            : new Date(a.submittedAt || a.createdAt || 0).getTime();

        const bTime =
          b.submittedAt?.seconds
            ? b.submittedAt.seconds * 1000
            : new Date(b.submittedAt || b.createdAt || 0).getTime();

        return bTime - aTime;
      })[0] || null;

  const mergedBranchStats = {};

  completed.forEach((result) => {
    const stats =
      result.branchStats ||
      result.performanceAnalysis?.branchStats ||
      {};

    Object.entries(stats).forEach(([branch, data]) => {
      if (!mergedBranchStats[branch]) {
        mergedBranchStats[branch] = {
          total: 0,
          correct: 0,
          wrong: 0,
          possible: 0,
          earned: 0
        };
      }

      mergedBranchStats[branch].total += safeNumber(data.total, 0);
      mergedBranchStats[branch].correct += safeNumber(data.correct, 0);
      mergedBranchStats[branch].wrong += safeNumber(data.wrong, 0);
      mergedBranchStats[branch].possible += safeNumber(data.possible, 0);
      mergedBranchStats[branch].earned += safeNumber(data.earned, 0);
    });
  });

  const branches = analyzeBranches(mergedBranchStats);
  const weakBranches = getWeakBranches(branches);
  const strongBranches = getStrongBranches(branches);

  return {
    totalExams,
    average,
    latest,
    latestPercentage: latest ? getResultPercentage(latest) : 0,
    branches,
    weakBranches,
    strongBranches,
    advice: generateAdvice({ branches }),
    mistakeCount: Array.isArray(mistakes) ? mistakes.length : 0
  };
}

export function buildStudyPlan({ analytics = {}, mistakes = [] } = {}) {
  const plan = [];

  const weakBranches = Array.isArray(analytics.weakBranches)
    ? analytics.weakBranches
    : [];

  weakBranches.slice(0, 3).forEach((branch, index) => {
    plan.push({
      id: `weak-${index}`,
      title: `مراجعة ${branch.branch}`,
      description: `ابدأ بمراجعة القاعدة ثم حل تدريب قصير. عندك ${branch.wrong} أخطاء في هذا الفرع.`,
      priority: index === 0 ? "عالية" : "متوسطة"
    });
  });

  if (Array.isArray(mistakes) && mistakes.length > 0) {
    plan.push({
      id: "mistakes",
      title: "ذاكر أخطائي",
      description: `راجع ${mistakes.length} خطأ محفوظ ثم أعد الاختبار عليهم.`,
      priority: "عالية"
    });
  }

  if (plan.length === 0) {
    plan.push({
      id: "maintain",
      title: "حافظ على مستواك",
      description: "حل اختبارًا قصيرًا اليوم وراجع آخر درس.",
      priority: "خفيفة"
    });
  }

  return plan.slice(0, 4);
}
