export const makeExamAutosaveKey = (user, exam) => (
  `nahhas_exam_backup_${user?.uid || 'guest'}_${exam?.attemptId || exam?.id || 'exam'}`
);

export const readLocalExamBackup = (autosaveKey) => {
  try {
    const saved = JSON.parse(localStorage.getItem(autosaveKey) || 'null');
    return saved && typeof saved === 'object' ? saved : null;
  } catch {
    return null;
  }
};

export const writeLocalExamBackupToStorage = ({ autosaveKey, exam, user, answers, timeLeft, currentQIndex, antiCheatWarnings, antiCheatLog, startedAt }) => {
  try {
    localStorage.setItem(autosaveKey, JSON.stringify({
      examId: exam.id,
      attemptId: exam.attemptId,
      studentId: user.uid,
      answers,
      remainingTime: timeLeft,
      currentQIndex,
      antiCheatWarnings,
      antiCheatLog,
      startedAt: startedAt || new Date().toISOString(),
      savedAt: new Date().toISOString()
    }));
    return true;
  } catch (e) {
    console.warn('local exam backup failed:', e?.message);
    return false;
  }
};


export const clearLocalExamBackup = (autosaveKey) => {
  try {
    localStorage.removeItem(autosaveKey);
    return true;
  } catch (e) {
    console.warn('clear local exam backup failed:', e?.message);
    return false;
  }
};

const hashString = (value = '') => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const seededShuffleArray = (array, seed = '') => {
  const arr = [...array];
  let state = hashString(seed || 'nahhas-exam');
  const nextRandom = () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const flattenExamQuestions = ({ exam, isReviewMode, existingResult }) => {
  const flat = [];
  if (!exam?.questions) return flat;

  let processedBlocks = [...exam.questions];
  if (!isReviewMode && !existingResult) processedBlocks = seededShuffleArray(processedBlocks, `${exam?.attemptId || exam?.id || 'exam'}-blocks`);

  processedBlocks.forEach((block) => {
    let subQs = [...(block.subQuestions || [])];
    const hasEssay = subQs.some((q) => q.type === 'essay');
    if (!isReviewMode && !existingResult && !hasEssay) subQs = seededShuffleArray(subQs, `${exam?.attemptId || exam?.id || 'exam'}-${block?.text || ''}-questions`);

    subQs.forEach((q) => {
      flat.push({
        ...q,
        type: q.type || 'mcq',
        blockText: block.text || '',
        branch: q.branch || 'عام'
      });
    });
  });

  return flat;
};
