// مصدر واحد لحساب نتيجة الامتحان — الطالب والأدمن والتسليم والتصحيح كلهم بيحسبوا من هنا.
// قبل كده: التسليم كان بيقارن الإجابة بـ === (لو الإجابة الصح متسجلة "2" نص والطالب اختار 2 رقم تتحسب غلط)،
// و«الدرجة» كانت عدد الأسئلة الصح بينما «النسبة» بالدرجات، والمقالي اللي لسه ماتصححش كان بيتحسب صفر.
import { getQuestionMaxScore } from '@shared/core/platform/metrics.js';

const num = (v, d = 0) => (v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : d);

export function isAnswered(q, a) {
  if (q?.type === 'essay') return !!(a && ((typeof a === 'string' && a.trim()) || a.text || a.image));
  return a !== undefined && a !== null && a !== '';
}

/** رقم الاختيار الصح، مهما كان متسجل إزاي (رقم / نص رقم / نص الإجابة / حرف). */
export function correctIndexOf(q) {
  const opts = Array.isArray(q?.options) ? q.options : [];
  const c = q?.correctIdx ?? q?.correctIndex ?? q?.correct ?? q?.answerIndex;
  if (c !== undefined && c !== null && c !== '' && Number.isFinite(Number(c))) return Number(c);
  const text = String(c ?? q?.correctAnswer ?? q?.answer ?? '').trim();
  if (!text) return null;
  const byText = opts.findIndex((o) => String(o?.text ?? o ?? '').trim() === text);
  if (byText >= 0) return byText;
  const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
  const li = letters.indexOf(text.replace(/[()\s.]/g, ''));
  if (li >= 0 && li < opts.length) return li;
  const latin = 'abcdef'.indexOf(text.toLowerCase());
  return latin >= 0 && latin < opts.length ? latin : null;
}

/** هل إجابة الطالب هي الصح؟ (بيقبل رقم أو نص رقم أو نص الاختيار نفسه) */
export function isCorrectAnswer(q, a) {
  if (!isAnswered(q, a)) return false;
  const c = correctIndexOf(q);
  if (c === null) return false;
  if (Number.isFinite(Number(a))) return Number(a) === c;
  const opts = Array.isArray(q?.options) ? q.options : [];
  return String(opts[c]?.text ?? opts[c] ?? '').trim() === String(a).trim();
}

/**
 * يحسب نتيجة محاولة.
 * questions: الأسئلة المفرودة (extractAllQuestions / flattenExamQuestions)
 * result: { answers, essayScores, essayMaxScores, essayGrades }
 */
export function scoreAttempt(questions = [], result = {}) {
  const answers = result.answers || {};
  const essayScores = result.essayScores || {};
  const essayMax = result.essayMaxScores || {};
  const essayGrades = result.essayGrades || result.manualEssayGrades || {};
  const items = questions.map((q) => {
    const a = answers[q.id];
    const answered = isAnswered(q, a);
    let state;
    let earned = 0;
    const max = q.type === 'essay' ? num(essayMax[q.id], num(essayGrades[q.id]?.max, getQuestionMaxScore(q))) : getQuestionMaxScore(q);
    if (q.type === 'essay') {
      const s = essayScores[q.id] ?? essayGrades[q.id]?.score;
      if (!answered) state = 'skipped';
      else if (s === undefined || s === null || s === '') state = 'pending';
      else { earned = Math.min(num(s), max); state = earned >= max ? 'right' : earned > 0 ? 'partial' : 'wrong'; }
    } else if (!answered) state = 'skipped';
    else if (isCorrectAnswer(q, a)) { state = 'right'; earned = max; }
    else state = 'wrong';
    return { q, answer: a, answered, state, earned, max };
  });
  const count = (s) => items.filter((it) => it.state === s).length;
  const sum = (list, k) => list.reduce((s, it) => s + it[k], 0);
  const mcq = items.filter((it) => it.q.type !== 'essay');
  const pendingItems = items.filter((it) => it.state === 'pending');
  const earned = sum(items, 'earned');
  const possible = sum(items, 'max');
  const gradedPossible = possible - sum(pendingItems, 'max');
  const branches = {};
  items.forEach((it) => {
    const b = it.q.branch || 'عام';
    const s = (branches[b] ||= { earned: 0, possible: 0, answered: 0, total: 0, correct: 0, wrong: 0, essay: 0 });
    s.earned += it.earned; s.possible += it.max; s.total += 1;
    if (it.answered) s.answered += 1;
    if (it.q.type === 'essay') s.essay += 1;
    if (it.state === 'right') s.correct += 1;
    if (it.state === 'wrong') s.wrong += 1;
  });
  Object.values(branches).forEach((s) => { s.percentage = s.possible ? Math.round((s.earned / s.possible) * 100) : 0; });
  return {
    items,
    right: count('right'), wrong: count('wrong'), skipped: count('skipped'), pending: count('pending'), partial: count('partial'),
    mcqRight: mcq.filter((it) => it.state === 'right').length, mcqTotal: mcq.length, mcqEarned: sum(mcq, 'earned'), mcqPossible: sum(mcq, 'max'),
    essayTotal: items.length - mcq.length,
    earned, possible, gradedPossible,
    // النسبة الرسمية: على الامتحان كله
    percentage: possible ? Math.round((earned / possible) * 100) : 0,
    // على اللي اتصحح بس (لما فيه مقالي لسه بيتصحح)
    gradedPercentage: gradedPossible ? Math.round((earned / gradedPossible) * 100) : 0,
    branches,
  };
}

/** الحقول اللي تتخزن في exam_results — نفس الحساب في كل مكان. */
export function scoreFields(stats) {
  return {
    score: stats.earned,
    total: stats.possible,
    totalPossible: stats.possible,
    percentage: stats.percentage,
    mcqScore: stats.mcqEarned,
    correctCount: stats.right,
    wrongCount: stats.wrong,
    skippedCount: stats.skipped,
    pendingEssays: stats.pending,
    scoringVersion: 2,
  };
}

/**
 * يصحح نتيجة متخزنة (حتى القديمة اللي اتحسبت غلط) من الامتحان والإجابات — للعرض، من غير ما يكتب في قاعدة البيانات.
 * flatten: دالة بتفرد أسئلة الامتحان (extractAllQuestions).
 */
export function rescoreResult(result, exam, flatten) {
  if (!result || !exam || !result.answers || typeof flatten !== 'function') return result;
  if (['in_progress', 'started', 'active'].includes(result.status)) return result;
  const questions = flatten(exam);
  if (!questions.length) return result;
  const st = scoreAttempt(questions, result);
  return { ...result, ...scoreFields(st), branchStats: st.branches, gradedPercentage: st.gradedPercentage, rescored: true };
}
