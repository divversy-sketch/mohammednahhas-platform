export const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

export const getResultPercentage = (result) => {
    const total = safeNumber(result?.total ?? result?.totalPossible, 0);
    if (safeNumber(result?.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
    return total > 0 ? Math.round((safeNumber(result?.score ?? result?.totalScore, 0) / total) * 100) : 0;
};

export const getGradeBadge = (percentage = 0) => {
    const pct = safeNumber(percentage, 0);
    if (pct >= 85) return { text: 'ممتاز', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 70) return { text: 'جيد جدًا', tone: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 50) return { text: 'جيد', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: 'يحتاج مراجعة', tone: 'text-red-700 bg-red-50 border-red-200' };
};

export const VIDEO_EXAM_UNLOCK_PERCENT = 75;

export const getQuestionMaxScore = (q) => safeNumber(q?.maxScore ?? q?.mark ?? q?.points, q?.type === 'essay' ? 10 : 1);

export const getQuestionsForExam = (examData) => {
    if (!examData?.questions) return [];
    const flat = [];
    examData.questions.forEach((block) => {
        const subQuestions = Array.isArray(block?.subQuestions) ? block.subQuestions : [];
        subQuestions.forEach((q) => {
            flat.push({
                ...q,
                blockText: block?.text || '',
                branch: q?.branch || 'عام'
            });
        });
    });
    return flat;
};

export const extractAllQuestions = (exam) => (exam?.questions || []).flatMap(block =>
    (block?.subQuestions || []).map(q => ({ ...q, blockText: block?.text || '', branch: q?.branch || 'عام' }))
);

export const calculateDetailedExamMetrics = (exam, answers = {}, essayGrades = {}) => {
    const questions = extractAllQuestions(exam);
    const branchStats = {};
    let totalScore = 0;
    let totalPossible = 0;
    let mcqCount = 0;
    let essayCount = 0;

    questions.forEach(q => {
        const branch = q.branch || 'عام';
        branchStats[branch] = branchStats[branch] || { earned: 0, possible: 0, answered: 0, total: 0, correct: 0, wrong: 0, essay: 0 };
        const maxScore = getQuestionMaxScore(q);
        totalPossible += maxScore;
        branchStats[branch].possible += maxScore;
        branchStats[branch].total += 1;
        const answerValue = answers[q.id];
        const answered = q.type === 'essay'
            ? !!(answerValue && ((typeof answerValue === 'string' && answerValue.trim()) || answerValue.text || answerValue.image))
            : answerValue !== undefined;
        if (answered) branchStats[branch].answered += 1;

        if (q.type === 'essay') {
            essayCount += 1;
            branchStats[branch].essay += 1;
            const gradeInfo = essayGrades[q.id] || {};
            const earned = safeNumber(gradeInfo.score, 0);
            totalScore += earned;
            branchStats[branch].earned += earned;
        } else {
            mcqCount += 1;
            const isCorrect = answerValue === q.correctIdx;
            if (isCorrect) {
                totalScore += maxScore;
                branchStats[branch].earned += maxScore;
                branchStats[branch].correct += 1;
            } else if (answered) {
                branchStats[branch].wrong += 1;
            }
        }
    });

    return {
        totalScore,
        totalPossible,
        percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
        branchStats,
        mcqCount,
        essayCount,
        questions
    };
};

export const getPerformanceInsights = (metrics) => {
    const branches = Object.entries(metrics?.branchStats || {});
    if (branches.length === 0) return [];
    const enriched = branches.map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0, ...data })).sort((a, b) => b.pct - a.pct);
    const best = enriched[0];
    const worst = enriched[enriched.length - 1];
    const notes = [];
    if (best) notes.push(`أفضل فروعك حالياً: ${best.branch} (${best.pct}%)`);
    if (worst && worst.branch !== best?.branch) notes.push(`أكثر فرع يحتاج مراجعة: ${worst.branch} (${worst.pct}%)`);
    if ((metrics?.essayCount || 0) > 0) notes.push('تأكد من متابعة تصحيح الأسئلة المقالية بعد اعتمادها من الأدمن.');
    if ((metrics?.percentage || 0) >= 85) notes.push('أداء ممتاز جدًا، استمر على نفس المستوى.');
    else if ((metrics?.percentage || 0) >= 70) notes.push('أداؤك جيد جدًا، ركز على الفروع الأضعف لرفع النسبة.');
    else notes.push('راجع بنك الأخطاء والمراجعة الذكية قبل الامتحان التالي.');
    return notes;
};

export const getReviewRecommendations = (branchStats = {}, content = []) => {
    const weakBranches = Object.entries(branchStats)
        .map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0 }))
        .filter(item => item.pct < 70)
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 3);
    return weakBranches.map(item => {
        const related = content.find(c => (c.branch || '').trim() === item.branch || (c.title || '').includes(item.branch));
        return { branch: item.branch, pct: item.pct, title: related?.title || `راجع فرع ${item.branch}` };
    });
};

