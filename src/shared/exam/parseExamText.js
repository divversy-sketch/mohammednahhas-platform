// تحويل نص الأسئلة (اللي الأدمن بيكتبه في «إنشاء امتحان») لأسئلة.
// نفس القواعد القديمة بالظبط، بس دلوقتي بيرجّع كمان تحذيرات عشان المعاينة تبيّن
// الأسئلة اللي هتتشال أو اللي مالهاش إجابة صح قبل النشر (قبل كده كانت بتختفي من غير ما حد يعرف).
//
// السؤال المقالي بيتعرف بأي طريقة من دول:
//   #مقالي: نص السؤال      مقالي: نص السؤال      سؤال مقالي: نص السؤال      (مقالي) نص السؤال
//   نص السؤال (مقالي)      #مقالي  ← لوحدها في سطر، والسؤال في السطور اللي بعدها
//   وأي سؤال مالوش اختيارات خالص (سؤال وبعده سطر فاضي) بيتحسب مقالي لوحده.
// الإجابة النموذجية: سطر بيبدأ بـ «نموذج:» أو «الإجابة النموذجية:» أو «الإجابة:» تحت السؤال المقالي.

// كلمة «مقالي/مقال/essay» في أول السطر (مع # أو أقواس أو «سؤال» قبلها)، وبعدها لازم فاصل أو نهاية السطر
// (عشان «مقالة عن الوطن» ما تتفهمش علامة).
const ESSAY_HEAD = /^[#\s]*[([]?\s*(?:سؤال\s+)?(?:مقالي|مقال|essay)(?=[\s:：\-–.)\]]|$)\s*[)\]]?\s*[:：\-–.)]*\s*(.*)$/i;
const ESSAY_TAIL = /^(.+?)\s*[-–(\[]\s*(?:مقالي|مقال|essay)\s*[)\]]?\s*$/i;
const MODEL_ANSWER = /^(?:نموذج|الإجابة النموذجية|الاجابة النموذجية|إجابة نموذجية|اجابة نموذجية|الإجابة|الاجابة)\s*[:：]\s*(.*)$/;

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
      if (!currentQuestion.text.trim()) {
        warnings.push({ type: 'dropped', line: currentQuestion.line, message: 'علامة «مقالي» من غير نص سؤال بعدها — اتشالت' });
        currentQuestion = null;
        return;
      }
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
    // سؤال من غير اختيارات (أو سطر واحد بس) ومن غير *: ده سؤال مقالي اتكتب من غير علامة
    if (text && currentQuestion.options.length < 2 && currentQuestion.correctIdx < 0) {
      const full = [text, ...currentQuestion.options].join('\n').trim();
      warnings.push({ type: 'auto_essay', line: currentQuestion.line, text, message: 'مالوش اختيارات، فاتحسب سؤال مقالي' });
      currentBlock.subQuestions.push({ id: currentQuestion.id, type: 'essay', text: full, branch: currentQuestion.branch || currentBranch, modelAnswer: '' });
      currentQuestion = null;
      return;
    }
    if (text && currentQuestion.options.length >= 2) {
      if (currentQuestion.correctIdx < 0) {
        warnings.push({ type: 'no_correct', line: currentQuestion.line, text, message: 'مفيش إجابة عليها * — هتتحسب الاختيار الأول صح' });
        currentQuestion.correctIdx = 0;
      }
      const { line, ...q } = currentQuestion; // eslint-disable-line no-unused-vars
      currentBlock.subQuestions.push({ ...q, text, branch: currentQuestion.branch || currentBranch });
    } else if (text) {
      warnings.push({ type: 'dropped', line: currentQuestion.line, text, message: `عليه * بس اختياراته أقل من ٢ (${currentQuestion.options.length}) — السؤال ده مش هيتنشر. لو مقالي اكتب قبله #مقالي` });
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

    // سطر إجابة نموذجية تحت سؤال مقالي
    if (currentQuestion?.type === 'essay') {
      const model = line.match(MODEL_ANSWER);
      if (model) { currentQuestion.modelAnswer = model[1].trim(); return; }
    }

    const essayHead = line.match(ESSAY_HEAD);
    const essayTail = !essayHead && line.match(ESSAY_TAIL);
    if (essayHead || essayTail) {
      pushCurrentQuestion();
      currentQuestion = { id: newId(), type: 'essay', text: ((essayHead ? essayHead[1] : essayTail[1]) || '').trim(), branch: currentBranch, modelAnswer: '', line: lineNo };
      return;
    }

    const isCorrect = line.startsWith('*');
    const cleanLine = isCorrect ? line.slice(1).trim() : line.trim();

    if (!currentQuestion) {
      currentQuestion = { id: newId(), type: 'mcq', text: cleanLine.replace(/^(س|سؤال)\s*[:：-]\s*/i, ''), options: [], correctIdx: -1, branch: currentBranch, line: lineNo };
      return;
    }

    if (currentQuestion.type === 'essay') {
      currentQuestion.text = currentQuestion.text ? `${currentQuestion.text}\n${cleanLine}` : cleanLine;
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
