// src/utils/mistakesEngine.js
// محرك "ذاكر أخطائي" — آمن ومستقل
// لا يستخدم AI ولا يرسل أي طلبات خارجية.

export function safeText(value = "", fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeMistake(mistake = {}) {
  const question = mistake.question || mistake;

  const options = safeArray(question.options);

  const correctIdx =
    typeof question.correctIdx === "number"
      ? question.correctIdx
      : typeof mistake.correctIdx === "number"
        ? mistake.correctIdx
        : 0;

  const text = safeText(
    question.text || mistake.text,
    "سؤال غير متاح"
  );

  const branch = safeText(
    question.branch || mistake.branch,
    "عام"
  );

  const id = safeText(
    mistake.id || question.id,
    `${branch}-${text}`.replace(/\s+/g, "-").slice(0, 120)
  );

  return {
    id,
    originalId: mistake.id || question.id || "",
    branch,
    examTitle: safeText(mistake.examTitle || question.examTitle, "امتحان سابق"),
    text,
    options,
    correctIdx,
    correctAnswerText: safeText(
      question.correctAnswerText ||
        mistake.correctAnswerText ||
        options[correctIdx],
      ""
    ),
    studentAnswerText: safeText(
      question.studentAnswerText || mistake.studentAnswerText,
      ""
    ),
    explanation: safeText(question.explanation || mistake.explanation, ""),
    mastered: Boolean(mistake.mastered),
    createdAt: mistake.createdAt || mistake.timestamp || null,
    raw: mistake
  };
}

export function normalizeMistakes(mistakes = []) {
  return safeArray(mistakes)
    .map(normalizeMistake)
    .filter((m) => m.text && m.text !== "سؤال غير متاح");
}

export function groupMistakesByBranch(mistakes = []) {
  return normalizeMistakes(mistakes).reduce((groups, mistake) => {
    const branch = mistake.branch || "عام";
    if (!groups[branch]) groups[branch] = [];
    groups[branch].push(mistake);
    return groups;
  }, {});
}

export function getMistakesSummary(mistakes = []) {
  const normalized = normalizeMistakes(mistakes);
  const grouped = groupMistakesByBranch(normalized);

  const branches = Object.entries(grouped)
    .map(([branch, items]) => ({
      branch,
      total: items.length,
      mastered: items.filter((m) => m.mastered).length,
      remaining: items.filter((m) => !m.mastered).length
    }))
    .sort((a, b) => b.remaining - a.remaining || b.total - a.total);

  return {
    total: normalized.length,
    mastered: normalized.filter((m) => m.mastered).length,
    remaining: normalized.filter((m) => !m.mastered).length,
    branches,
    topBranch: branches[0] || null
  };
}

export function getMistakesRecommendations(mistakes = []) {
  const summary = getMistakesSummary(mistakes);

  if (summary.total === 0) {
    return [
      "لا توجد أخطاء محفوظة حتى الآن. حل امتحانًا جديدًا لتبدأ المنصة في بناء بنك أخطائك."
    ];
  }

  if (summary.remaining === 0) {
    return [
      "رائع جدًا. أخطاؤك السابقة أصبحت متقنة. حافظ على مستواك بحل اختبار قصير جديد."
    ];
  }

  const notes = [];

  if (summary.topBranch) {
    notes.push(
      `ابدأ بفرع ${summary.topBranch.branch} لأن به ${summary.topBranch.remaining} أخطاء تحتاج مراجعة.`
    );
  }

  notes.push("راجع السؤال، ثم سبب الخطأ، ثم أعد الحل بدون النظر للإجابة.");
  notes.push("أي خطأ تحله صح أكثر من مرة اعتبره متقنًا وانقله من قائمة المراجعة.");

  return notes;
}

export function buildMistakesExam(mistakes = [], options = {}) {
  const normalized = normalizeMistakes(mistakes)
    .filter((m) => !m.mastered)
    .filter((m) => m.options.length >= 2);

  const limit = Number(options.limit || 20);
  const selected = normalized.slice(0, limit);

  return {
    id: "custom_mistakes_exam",
    title: options.title || "اختبار ذاكر أخطائي",
    duration: Number(options.duration || 20),
    grade: options.grade || "all",
    source: "student_mistakes",
    questions: [
      {
        text: "أسئلة من أخطائك السابقة",
        subQuestions: selected.map((m, index) => ({
          id: m.id || `mistake-${index + 1}`,
          text: m.text,
          type: "mcq",
          branch: m.branch || "عام",
          options: m.options,
          correctIdx: m.correctIdx,
          explanation:
            m.explanation ||
            (m.correctAnswerText
              ? `الإجابة الصحيحة: ${m.correctAnswerText}`
              : "راجع القاعدة المرتبطة بهذا السؤال.")
        }))
      }
    ]
  };
}

export function canBuildMistakesExam(mistakes = []) {
  return normalizeMistakes(mistakes).some(
    (m) => !m.mastered && m.options.length >= 2
  );
}

export function filterMistakesByBranch(mistakes = [], branch = "الكل") {
  const normalized = normalizeMistakes(mistakes);
  if (!branch || branch === "الكل") return normalized;
  return normalized.filter((m) => m.branch === branch);
}

export function sortMistakesForReview(mistakes = []) {
  return normalizeMistakes(mistakes).sort((a, b) => {
    if (a.mastered !== b.mastered) return a.mastered ? 1 : -1;
    return String(a.branch).localeCompare(String(b.branch), "ar");
  });
}
