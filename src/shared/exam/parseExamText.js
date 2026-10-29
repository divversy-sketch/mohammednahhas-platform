// تحويل نص الأسئلة (اللي الأدمن بيكتبه في «إنشاء امتحان») لأسئلة.
// نفس القواعد القديمة بالظبط، بس دلوقتي بيرجّع كمان تحذيرات عشان المعاينة تبيّن
// الأسئلة اللي هتتشال أو اللي مالهاش إجابة صح قبل النشر (قبل كده كانت بتختفي من غير ما حد يعرف).

export function parseExamText(bulkText = '') {
  const lines = String(bulkText).split('\n').map((l) => l.trim());
  const blocks = [];
  const warnings = [];
  let currentBlock = { text: '', subQuestions: [] };
  let currentQuestion = null;
  let currentBranch = 'عام';
  let isReadingPassage = false;
  let seq = 0;
  const newId = () => Date.now() + Math.random() + (seq += 1) / 1e6;

  const pushCurrentQuestion = () => {
    if (!currentQuestion) return;
    if (currentQuestion.type === 'essay') {
      currentBlock.subQuestions.push({
        id: currentQuestion.id,
        type: 'essay',
        text: currentQuestion.text.trim(),
        branch: currentQuestion.branch || currentBranch,
        modelAnswer: currentQuestion.modelAnswer || '',
      });
      currentQuestion = null;
      return;
    }
    const text = currentQuestion.text?.trim();
    if (text && currentQuestion.options.length >= 2) {
      if (currentQuestion.correctIdx < 0) {
        warnings.push({ type: 'no_correct', line: currentQuestion.line, text, message: 'مفيش إجابة عليها * — هتتحسب الاختيار الأول صح' });
        currentQuestion.correctIdx = 0;
      }
      const { line, ...q } = currentQuestion; // eslint-disable-line no-unused-vars
      currentBlock.subQuestions.push({ ...q, text, branch: currentQuestion.branch || currentBranch });
    } else if (text) {
      warnings.push({ type: 'dropped', line: currentQuestion.line, text, message: `اختيارات أقل من ٢ (${currentQuestion.options.length}) — السؤال ده مش هيتنشر` });
    }
    currentQuestion = null;
  };

  const pushCurrentBlock = () => {
    pushCurrentQuestion();
    if (currentBlock.text.trim() || currentBlock.subQuestions.length > 0) {
      blocks.push({ text: currentBlock.text.trim(), subQuestions: currentBlock.subQuestions });
    }
    currentBlock = { text: '', subQuestions: [] };
  };

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (!line) { pushCurrentQuestion(); return; }

    const branchMatch = line.match(/^#\s*(?:فرع|الفرع)\s*:\s*(.+)$/);
    if (branchMatch) { pushCurrentQuestion(); currentBranch = branchMatch[1].trim() || 'عام'; return; }

    if (line === 'بداية القطعة') { pushCurrentBlock(); isReadingPassage = true; return; }
    if (line === 'نهاية القطعة') { isReadingPassage = false; return; }
    if (line === 'حذف القطعة') { pushCurrentBlock(); isReadingPassage = false; return; }
    if (isReadingPassage) { currentBlock.text += (currentBlock.text ? '\n' : '') + line; return; }

    const essayMatch = line.match(/^#?\s*(?:مقالي|essay)\s*[:：\-).]?\s*(.+)$/i);
    if (essayMatch) {
      pushCurrentQuestion();
      currentQuestion = { id: newId(), type: 'essay', text: (essayMatch[1] || '').trim(), branch: currentBranch, modelAnswer: '', line: lineNo };
      return;
    }

    const isCorrect = line.startsWith('*');
    const cleanLine = isCorrect ? line.slice(1).trim() : line.trim();

    if (!currentQuestion) {
      currentQuestion = { id: newId(), type: 'mcq', text: cleanLine.replace(/^(س|سؤال)\s*[:：-]\s*/i, ''), options: [], correctIdx: -1, branch: currentBranch, line: lineNo };
      return;
    }

    if (currentQuestion.type === 'essay') {
      if (cleanLine.startsWith('نموذج:') || cleanLine.startsWith('إجابة نموذجية:')) {
        currentQuestion.modelAnswer = cleanLine.replace('نموذج:', '').replace('إجابة نموذجية:', '').trim();
      } else {
        currentQuestion.text += `\n${cleanLine}`;
      }
      return;
    }

    currentQuestion.options.push(cleanLine);
    if (isCorrect) currentQuestion.correctIdx = currentQuestion.options.length - 1;
    if (currentQuestion.options.length >= 4) pushCurrentQuestion();
  });

  pushCurrentBlock();
  if (isReadingPassage) warnings.push({ type: 'open_passage', message: 'فيه «بداية القطعة» من غير «نهاية القطعة» — الأسئلة اللي بعدها اتحسبت جزء من النص' });

  const finalBlocks = blocks.filter((b) => b.subQuestions.length > 0);
  const all = finalBlocks.flatMap((b) => b.subQuestions);
  const branches = {};
  all.forEach((q) => { branches[q.branch] = (branches[q.branch] || 0) + 1; });
  return {
    blocks: finalBlocks,
    warnings,
    stats: {
      total: all.length,
      mcq: all.filter((q) => q.type !== 'essay').length,
      essay: all.filter((q) => q.type === 'essay').length,
      passages: finalBlocks.filter((b) => b.text).length,
      branches,
    },
  };
}
