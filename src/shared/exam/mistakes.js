// بنك الأخطاء: every saved mistake keeps (or recovers) the reading passage it belongs to,
// so the student sees the text again when reviewing or re-taking the question.

const clean = (v) => String(v || '').trim();

/** Passage of a saved mistake: stored with it, or found again in the original exam. */
export function mistakePassage(mistake, exams = []) {
  const q = mistake?.question || {};
  if (clean(q.blockText)) return clean(q.blockText);
  if (!q.id) return '';
  const pool = mistake?.examId ? exams.filter((e) => e.id === mistake.examId) : exams.filter((e) => !mistake?.examTitle || e.title === mistake.examTitle);
  for (const exam of pool.length ? pool : exams) {
    for (const block of exam?.questions || []) {
      if ((block?.subQuestions || []).some((s) => s?.id === q.id)) return clean(block.text);
    }
  }
  return '';
}

/** Up to `limit` distinct mistakes, grouped so questions that share a passage sit under it. */
export function buildMistakesExam(mistakes = [], exams = [], limit = 20) {
  const seen = new Set();
  const unique = [];
  [...mistakes].sort(() => 0.5 - Math.random()).forEach((m) => {
    const key = m?.question?.id || m?.question?.text;
    if (!key || seen.has(key) || unique.length >= limit) return;
    seen.add(key);
    unique.push(m);
  });
  const blocks = new Map();
  unique.forEach((m) => {
    const passage = mistakePassage(m, exams);
    const { blockText: _ignored, studentAnswerText: _a, correctAnswerText: _c, ...question } = m.question || {};
    if (!blocks.has(passage)) blocks.set(passage, []);
    blocks.get(passage).push(question);
  });
  return {
    id: 'custom_mistakes_exam',
    title: 'امتحان نقاط الضعف (بنك الأخطاء)',
    duration: Math.max(5, unique.length * 2),
    allowReviewImmediately: true,
    questions: [...blocks.entries()].map(([text, subQuestions]) => ({ text, subQuestions })),
  };
}
