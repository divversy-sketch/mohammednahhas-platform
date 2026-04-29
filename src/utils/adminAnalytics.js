// src/utils/adminAnalytics.js
// أدوات تحليل لوحة الأدمن — آمنة ومستقلة

export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getDateMs(value) {
  if (!value) return 0;
  if (value?.seconds) return value.seconds * 1000;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function isSameMonth(ms, now = Date.now()) {
  const a = new Date(ms);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function getResultPercentage(result = {}) {
  if (safeNumber(result.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
  const total = safeNumber(result.totalPossible || result.total, 0);
  const score = safeNumber(result.totalScore || result.score, 0);
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export function buildAdminOverview({
  users = [],
  results = [],
  paymentRequests = [],
  liveSessions = [],
  content = [],
  mistakes = []
} = {}) {
  const safeUsers = Array.isArray(users) ? users : [];
  const safeResults = Array.isArray(results) ? results : [];
  const safePayments = Array.isArray(paymentRequests) ? paymentRequests : [];
  const safeSessions = Array.isArray(liveSessions) ? liveSessions : [];
  const safeContent = Array.isArray(content) ? content : [];
  const safeMistakes = Array.isArray(mistakes) ? mistakes : [];

  const students = safeUsers.filter((u) => !u.isAdmin && u.role !== "admin");
  const completedResults = safeResults.filter((r) => r.status === "completed");
  const thisMonthResults = completedResults.filter((r) =>
    isSameMonth(getDateMs(r.submittedAt || r.createdAt))
  );

  const activeStudents = new Set(
    completedResults
      .filter((r) => isSameMonth(getDateMs(r.submittedAt || r.createdAt)))
      .map((r) => r.studentId || r.userId)
      .filter(Boolean)
  ).size;

  const avgScore = completedResults.length
    ? Math.round(
        completedResults.reduce((sum, r) => sum + getResultPercentage(r), 0) /
          completedResults.length
      )
    : 0;

  const pendingPayments = safePayments.filter((p) => p.status === "pending").length;
  const activeSessions = safeSessions.filter(
    (s) => s.status !== "ended" && s.deleted !== true && s.isDeleted !== true
  ).length;

  const weakStudents = completedResults
    .map((r) => ({
      studentId: r.studentId || r.userId || "",
      studentName: r.studentName || r.userName || "طالب",
      examTitle: r.examTitle || r.title || "امتحان",
      percentage: getResultPercentage(r),
      submittedAt: r.submittedAt || r.createdAt || null
    }))
    .filter((r) => r.percentage < 60)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 8);

  const branchMap = {};
  completedResults.forEach((r) => {
    const stats = r.branchStats || r.performanceAnalysis?.branchStats || {};
    Object.entries(stats).forEach(([branch, data]) => {
      branchMap[branch] = branchMap[branch] || {
        branch,
        wrong: 0,
        correct: 0,
        total: 0,
        possible: 0,
        earned: 0
      };
      branchMap[branch].wrong += safeNumber(data.wrong, 0);
      branchMap[branch].correct += safeNumber(data.correct, 0);
      branchMap[branch].total += safeNumber(data.total, 0);
      branchMap[branch].possible += safeNumber(data.possible, 0);
      branchMap[branch].earned += safeNumber(data.earned, 0);
    });
  });

  safeMistakes.forEach((m) => {
    const branch = m.question?.branch || m.branch || "عام";
    branchMap[branch] = branchMap[branch] || {
      branch,
      wrong: 0,
      correct: 0,
      total: 0,
      possible: 0,
      earned: 0
    };
    branchMap[branch].wrong += 1;
    branchMap[branch].total += 1;
  });

  const weakBranches = Object.values(branchMap)
    .map((b) => ({
      ...b,
      percentage:
        b.possible > 0
          ? Math.round((b.earned / b.possible) * 100)
          : b.total > 0
            ? Math.round((b.correct / b.total) * 100)
            : 0
    }))
    .filter((b) => b.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.percentage - b.percentage)
    .slice(0, 8);

  const recentResults = completedResults
    .slice()
    .sort(
      (a, b) =>
        getDateMs(b.submittedAt || b.createdAt) -
        getDateMs(a.submittedAt || a.createdAt)
    )
    .slice(0, 8);

  return {
    totalStudents: students.length,
    activeStudents,
    totalResults: completedResults.length,
    thisMonthResults: thisMonthResults.length,
    avgScore,
    pendingPayments,
    activeSessions,
    contentCount: safeContent.length,
    weakStudents,
    weakBranches,
    recentResults
  };
}

export function buildSubscriptionSummary(users = [], paymentRequests = []) {
  const safeUsers = Array.isArray(users) ? users : [];
  const safePayments = Array.isArray(paymentRequests) ? paymentRequests : [];

  const now = Date.now();
  const active = safeUsers.filter((u) => {
    const end = getDateMs(u.subscriptionEnd || u.expiresAt || u.endDate);
    return u.subscriptionStatus === "active" || (end && end > now);
  }).length;

  const expired = safeUsers.filter((u) => {
    const end = getDateMs(u.subscriptionEnd || u.expiresAt || u.endDate);
    return u.subscriptionStatus === "expired" || (end && end <= now);
  }).length;

  const pending = safePayments.filter((p) => p.status === "pending").length;

  return {
    active,
    expired,
    pending,
    totalPaymentRequests: safePayments.length
  };
}
