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

export const writeLocalExamBackupToStorage = ({ autosaveKey, exam, user, answers, timeLeft, currentQIndex, antiCheatWarnings, antiCheatLog }) => {
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
      savedAt: new Date().toISOString()
    }));
    return true;
  } catch (e) {
    console.warn('local exam backup failed:', e?.message);
    return false;
  }
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
  if (!isReviewMode && !existingResult) processedBlocks = shuffleArray(processedBlocks);

  processedBlocks.forEach((block) => {
    let subQs = [...(block.subQuestions || [])];
    const hasEssay = subQs.some((q) => q.type === 'essay');
    if (!isReviewMode && !existingResult && !hasEssay) subQs = shuffleArray(subQs);

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
