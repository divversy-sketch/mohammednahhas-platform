const toDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const percent = (score, total) => {
  const s = Number(score || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return Math.round((s / t) * 100);
};

export const getStudentName = (student = {}) => student.name || student.displayName || student.studentName || student.email || 'طالب';

export const getResultDate = (row = {}) => toDate(row.submittedAt || row.createdAt || row.updatedAt);

export const getResultTitle = (row = {}) => row.examTitle || row.title || row.homeworkTitle || row.assignmentTitle || 'نشاط';

export const isRecent = (date, days = 7) => {
  if (!date) return false;
  return (Date.now() - date.getTime()) <= days * 24 * 60 * 60 * 1000;
};

export function buildStudentInsight({ student = {}, exams = [], results = [], assignments = [], submissions = [], hwResults = [], mistakes = [], videoViews = [] }) {
  const studentId = student.id || student.uid;
  const grade = student.grade;
  const studentResults = results.filter(r => !studentId || r.studentId === studentId || r.userId === studentId);
  const completedResults = studentResults.filter(r => Number(r.total || r.totalScore || 0) > 0);
  const avg = completedResults.length
    ? Math.round(completedResults.reduce((sum, r) => sum + percent(r.score, r.total || r.totalScore), 0) / completedResults.length)
    : 0;
  const studentSubmissions = submissions.filter(s => !studentId || s.studentId === studentId || s.userId === studentId);
  const eligibleAssignments = assignments.filter(a => !grade || !a.grade || a.grade === grade || a.grade === 'all');
  const submittedAssignmentIds = new Set(studentSubmissions.map(s => s.assignmentId));
  const pendingAssignments = eligibleAssignments.filter(a => !submittedAssignmentIds.has(a.id));
  const studentHw = hwResults.filter(h => !studentId || h.studentId === studentId || h.userId === studentId);
  const hwAvg = studentHw.length
    ? Math.round(studentHw.reduce((sum, h) => sum + percent(h.score, h.total), 0) / studentHw.length)
    : 0;
  const studentMistakes = mistakes.filter(m => !studentId || m.userId === studentId || m.studentId === studentId);
  const byBranch = {};
  completedResults.forEach((r) => {
    const stats = r.performanceAnalysis?.branchStats || r.branchStats || r.branchAnalysis || {};
    Object.entries(stats).forEach(([branch, row]) => {
      const score = Number(row.score ?? row.correct ?? row.right ?? 0);
      const total = Number(row.total ?? row.count ?? 0);
      if (!byBranch[branch]) byBranch[branch] = { branch, score: 0, total: 0 };
      byBranch[branch].score += score;
      byBranch[branch].total += total;
    });
  });
  studentMistakes.forEach((m) => {
    const branch = m.question?.branch || m.branch || m.examBranch || 'غير مصنف';
    if (!byBranch[branch]) byBranch[branch] = { branch, score: 0, total: 0 };
    byBranch[branch].total += 1;
  });
  const weakBranches = Object.values(byBranch)
    .map(b => ({ ...b, percentage: percent(b.score, b.total) }))
    .filter(b => b.total > 0)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 5);
  const lastActivityDates = [
    ...studentResults.map(getResultDate),
    ...studentSubmissions.map(getResultDate),
    ...studentHw.map(getResultDate),
    ...videoViews.map(v => toDate(v.viewedAt || v.updatedAt || v.createdAt))
  ].filter(Boolean).sort((a, b) => b - a);
  const lastActivityAt = lastActivityDates[0] || null;
  const riskReasons = [];
  if (completedResults.length >= 2 && avg < 50) riskReasons.push('متوسط الامتحانات منخفض');
  if (pendingAssignments.length >= 2) riskReasons.push('واجبات غير مسلمة');
  if (studentMistakes.length >= 10) riskReasons.push('بنك أخطاء كبير');
  if (!lastActivityAt || !isRecent(lastActivityAt, 7)) riskReasons.push('نشاط ضعيف آخر أسبوع');
  const recommendations = [];
  if (weakBranches[0]) recommendations.push(`مراجعة فرع ${weakBranches[0].branch}`);
  if (studentMistakes.length) recommendations.push('حل اختبار من بنك الأخطاء');
  if (pendingAssignments.length) recommendations.push(`تسليم ${pendingAssignments.length} واجب متأخر`);
  if (!recommendations.length) recommendations.push('الاستمرار على نفس خطة المذاكرة');
  return {
    studentId,
    name: getStudentName(student),
    grade,
    examCount: completedResults.length,
    average: avg,
    hwCount: studentHw.length,
    hwAverage: hwAvg,
    pendingAssignments,
    pendingAssignmentsCount: pendingAssignments.length,
    mistakesCount: studentMistakes.length,
    weakBranches,
    lastActivityAt,
    riskLevel: riskReasons.length >= 3 ? 'high' : riskReasons.length >= 1 ? 'medium' : 'low',
    riskReasons,
    recommendations,
    results: completedResults,
    hwResults: studentHw,
    mistakes: studentMistakes
  };
}

export function buildAdminInsights({ users = [], exams = [], results = [], assignments = [], submissions = [], hwResults = [], mistakes = [], videoViews = [], gradeFilter = 'all' }) {
  const students = users.filter(u => (u.role || 'student') === 'student' && (gradeFilter === 'all' || u.grade === gradeFilter));
  const rows = students.map(student => buildStudentInsight({ student, exams, results, assignments, submissions, hwResults, mistakes, videoViews }));
  const active = rows.filter(r => r.riskLevel === 'low').length;
  const medium = rows.filter(r => r.riskLevel === 'medium').length;
  const high = rows.filter(r => r.riskLevel === 'high').length;
  const avg = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.average, 0) / rows.length) : 0;
  const branchMap = {};
  rows.forEach(row => row.weakBranches.forEach(b => {
    if (!branchMap[b.branch]) branchMap[b.branch] = { branch: b.branch, count: 0, totalPercent: 0 };
    branchMap[b.branch].count += 1;
    branchMap[b.branch].totalPercent += b.percentage;
  }));
  const branches = Object.values(branchMap)
    .map(b => ({ ...b, average: Math.round(b.totalPercent / Math.max(1, b.count)) }))
    .sort((a, b) => b.count - a.count || a.average - b.average);
  const groups = students.reduce((acc, s) => {
    const group = s.studyGroup || s.groupName || 'بدون مجموعة';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});
  return { rows, active, medium, high, average: avg, branches, groups };
}

export function buildParentReportText(student, insight, options = {}) {
  const name = getStudentName(student);
  const weak = insight.weakBranches?.length ? insight.weakBranches.map(b => `${b.branch} (${b.percentage}%)`).join('، ') : 'لا توجد نقاط ضعف واضحة حالياً';
  const actions = insight.recommendations?.join('، ') || 'الاستمرار على الخطة الحالية';
  return `مرحباً ولي أمر الطالب/ة ${name}\n\nتقرير متابعة مختصر من منصة النحاس:\n- متوسط الامتحانات: ${insight.average || 0}%\n- عدد الامتحانات المحلولة: ${insight.examCount || 0}\n- واجبات QR المسلمة: ${insight.hwCount || 0}\n- الواجبات المتأخرة: ${insight.pendingAssignmentsCount || 0}\n- عدد أسئلة بنك الأخطاء: ${insight.mistakesCount || 0}\n- نقاط تحتاج مراجعة: ${weak}\n\nالخطة المقترحة: ${actions}\n\nمع تحيات إدارة المنصة.`;
}

export function buildWhatsAppLink(phone, text) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('0')) p = `20${p.slice(1)}`;
  if (p && !p.startsWith('20') && p.length === 10) p = `20${p}`;
  return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : '';
}
