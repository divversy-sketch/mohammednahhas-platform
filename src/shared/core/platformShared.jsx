import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, BrainCircuit, PenTool } from '../icons/lucide-shim.jsx';

export const platformNotify = (message, type = 'info') => {
  const text = typeof message === 'string' ? message : String(message || '');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nahhas-toast', { detail: { message: text, type } }));
  }
  return undefined;
};

export const platformConfirm = (message) => {
  // Central wrapper so the remaining destructive actions have one upgrade point.
  // The student-facing validation messages now use platformNotify instead of blocking alerts.
  return window.confirm(message);
};

export const platformPrompt = (message, defaultValue = '') => {
  return window.prompt(message, defaultValue);
};

export const ToastCenter = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (event) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const payload = { id, type: event.detail?.type || 'info', message: event.detail?.message || '' };
      setItems(prev => [payload, ...prev].slice(0, 4));
      window.setTimeout(() => setItems(prev => prev.filter(item => item.id !== id)), 3600);
    };
    window.addEventListener('nahhas-toast', onToast);
    return () => window.removeEventListener('nahhas-toast', onToast);
  }, []);
  return (
    <div className="fixed top-4 left-4 z-[10000] space-y-3 w-[min(92vw,380px)]" dir="rtl">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className={`rounded-2xl border p-4 shadow-2xl font-black ${item.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : item.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-950 border-slate-800 text-white'}`}
          >
            {item.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const formatWatchTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return 'أقل من ثانية';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    let res = [];
    if (h > 0) res.push(`${h} ساعة`);
    if (m > 0) res.push(`${m} دقيقة`);
    if (s > 0 || res.length === 0) res.push(`${s} ثانية`);
    return res.join(' و ');
};

export const requestNotificationPermission = () => {
  // Browser push notifications are paused for now to avoid VAPID prompts.
  // In-app Firestore notifications still work inside the platform.
  return;
};

export const sendSystemNotification = () => {
  // System notifications are disabled temporarily for better UX/performance.
  return;
};

export const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const PLATFORM_WHATSAPP_NUMBER = '201500076322';

export const openPlatformWhatsApp = (text = 'السلام عليكم، محتاج أتواصل مع إدارة منصة النحاس.') => {
    window.open(`https://wa.me/${PLATFORM_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
};

export const WhatsAppContactButton = ({ compact = false }) => (
    <button
        type="button"
        onClick={() => openPlatformWhatsApp()}
        className={compact
            ? "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-black shadow-lg flex items-center gap-2 transition"
            : "fixed bottom-5 left-5 z-[999] bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 transition transform hover:-translate-y-1"}
        title="التواصل مع الإدارة عبر واتساب"
    >
        <MessageCircle size={20}/> واتساب الإدارة
    </button>
);


export const renderBracketHighlightedText = (text = '') => {
    const source = String(text || '');
    if (!source) return null;

    return source.split(/(\[[^\]]+\])/g).map((part, idx) => {
        const isHighlighted = /^\[[^\]]+\]$/.test(part);
        const cleanPart = isHighlighted ? part.slice(1, -1) : part;

        const renderedLines = cleanPart.split('\n').map((line, lineIdx, arr) => (
            <React.Fragment key={`${idx}-${lineIdx}`}>
                {line}
                {lineIdx !== arr.length - 1 && <br />}
            </React.Fragment>
        ));

        if (!isHighlighted) {
            return <React.Fragment key={idx}>{renderedLines}</React.Fragment>;
        }

        return (
            <mark
                key={idx}
                className="bg-yellow-200 text-yellow-950 px-2 py-1 rounded-lg border border-yellow-400 shadow-sm font-black"
                title="موضع السؤال داخل القطعة"
            >
                {renderedLines}
            </mark>
        );
    });
};

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


export const generatePDF = (type, data) => {
    if (!window.html2pdf) return platformNotify("جاري تحميل نظام الطباعة... يرجى الانتظار ثوانٍ والمحاولة مرة أخرى.");
    const percentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
    const date = new Date().toLocaleDateString('ar-EG');
    const element = document.createElement('div');
    let answersTable = '';
    if (data.questions && data.answers) {
        answersTable = `
        <div style="margin-top: 30px; page-break-before: always;">
            <h3 style="background: #eee; padding: 10px; border-right: 5px solid #d97706; font-family: 'Cairo', sans-serif;">تفاصيل الإجابات</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 15px; font-family: 'Cairo', sans-serif;">
                <thead>
                    <tr style="background-color: #f3f4f6; color: #333;">
                        <th style="border: 1px solid #ddd; padding: 10px; width: 5%;">#</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">السؤال</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الفرع</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">إجابتك</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">الصح</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.questions.map((q, i) => {
                        const branchName = q.branch || 'عام';

                        if (q.type === 'essay') {
                            const essayAnswer = data.answers?.[q.id];
                            const studentEssayText = typeof essayAnswer === 'object'
                                ? (essayAnswer?.text || (essayAnswer?.image ? 'تم رفع صورة إجابة' : 'لم يجب'))
                                : (essayAnswer || 'لم يجب');
                            const modelEssayAnswer = q.modelAnswer || 'سؤال مقالي - يحتاج مراجعة يدوية';
                            return `
                            <tr style="background-color: #eff6ff;">
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentEssayText}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; color: #1d4ed8;">${modelEssayAnswer}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><span style="color:#1d4ed8">📝 مقالي</span></td>
                            </tr>`;
                        }

                        const studentAnsIdx = data.answers[q.id];
                        const correctAnsIdx = q.correctIdx;
                        const isCorrect = studentAnsIdx === correctAnsIdx;
                        const studentAnsText = studentAnsIdx !== undefined ? q.options?.[studentAnsIdx] || 'لم يجب' : 'لم يجب';
                        const correctAnsText = q.options?.[correctAnsIdx] || 'غير محدد';
                        return `
                        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; color: green;">${correctAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${isCorrect ? '<span style="color:green">✔ صحيح</span>' : '<span style="color:red">✘ خطأ</span>'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    const header = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl; color: #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="text-align: right;"><h1 style="margin: 0; color: #d97706; font-size: 28px;">منصة النحاس التعليمية</h1><p style="margin: 5px 0 0; color: #666;">للغة العربية - أ/ محمد النحاس</p></div>
            <div style="text-align: left;"><p style="margin: 0; font-weight: bold;">تقرير نتيجة امتحان</p><p style="margin: 5px 0 0; color: #666;">${date}</p></div>
        </div>
        <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <table style="width: 100%; font-size: 18px; font-family: 'Cairo', sans-serif;">
                <tr><td style="padding: 10px; font-weight: bold; width: 20%;">اسم الطالب:</td><td style="padding: 10px;">${data.studentName}</td><td style="padding: 10px; font-weight: bold; width: 20%;">الامتحان:</td><td style="padding: 10px;">${data.examTitle || 'اختبار عام'}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; vertical-align: middle;">الدرجة:</td><td style="padding: 10px;"><div style="display: inline-block; border: 3px solid #d97706; border-radius: 8px; padding: 5px 20px; font-weight: bold; color: #d97706; direction: ltr; font-family: sans-serif; font-size: 20px; background: #fffbeb;">${data.score} / ${data.total}</div></td><td style="padding: 10px; font-weight: bold; vertical-align: middle;">النسبة:</td><td style="padding: 10px; font-size: 20px; font-weight: bold;">${percentage}%</td></tr>
                <tr><td style="padding: 10px; font-weight: bold;">الحالة:</td><td style="padding: 10px;" colspan="3"><span style="background: ${data.status === 'cheated' ? '#fee2e2' : '#dcfce7'}; color: ${data.status === 'cheated' ? '#991b1b' : '#166534'}; padding: 5px 15px; border-radius: 20px; font-size: 14px;">${data.status === 'cheated' ? 'تم إلغاؤه (غش)' : percentage >= 50 ? 'ناجح' : 'راسب'}</span></td></tr>
            </table>
        </div>
        ${answersTable}
        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;"><p style="font-size: 14px; color: #999;">تم استخراج هذا التقرير آلياً من منصة النحاس التعليمية</p></div>
      </div>`;
    element.innerHTML = header;
    const opt = { margin: 0.5, filename: `تقرير_${data.studentName}_${date}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
};

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


export const InlineTabs = ({ tabs = [], defaultTab }) => {
  const visibleTabs = tabs.filter(Boolean);
  const [activeKey, setActiveKey] = useState(defaultTab || visibleTabs[0]?.key);
  const current = visibleTabs.find(tab => tab.key === activeKey) || visibleTabs[0];
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.some(tab => tab.key === activeKey)) {
      setActiveKey(visibleTabs[0].key);
    }
  }, [activeKey, visibleTabs.map(tab => tab.key).join('|')]);
  if (!visibleTabs.length) return null;
  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border border-slate-100 rounded-2xl p-2 shadow-sm overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveKey(tab.key)}
              className={`px-4 py-2.5 rounded-xl font-black text-sm transition whitespace-nowrap ${current?.key === tab.key ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div>{current?.content}</div>
    </div>
  );
};

export const TabPaneCard = ({ children, className = '' }) => (
  <div className={`glass-panel p-4 md:p-6 rounded-2xl ${className}`}>{children}</div>
);

export const getQuestionMaxScore = (q) => safeNumber(q?.maxScore ?? q?.mark ?? q?.points, q?.type === 'essay' ? 10 : 1);

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


export const StudentLocalAdvice = ({ metrics = {}, content = [] }) => {
  const branches = Object.entries(metrics?.branchStats || {}).map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 0)) * 100) : 0, wrong: safeNumber(data.wrong, 0) })).sort((a,b)=>a.pct-b.pct);
  const weakBranches = branches.filter(b => b.pct < 70).slice(0, 3);
  const recommendations = getReviewRecommendations(metrics?.branchStats || {}, content || []);
  return <div className="mt-5 bg-slate-900/70 border border-slate-700 rounded-3xl p-5 text-slate-100"><div className="flex items-center gap-2 mb-4"><BrainCircuit className="text-amber-400"/><h3 className="font-black text-xl">تحليل ذكي داخلي</h3></div><p className="text-sm text-slate-300 mb-4">التحليل مبني على إجابات الطالب ونسب الفروع داخل المنصة فقط، داخليًا.</p>{weakBranches.length===0?<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 font-bold">ممتاز يا بطل. لا توجد فروع أقل من 70%. راجع الأخطاء الفردية وحافظ على مستواك.</div>:<div className="space-y-3">{weakBranches.map((b,idx)=>{const rec=recommendations.find(r=>r.branch===b.branch);return <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2"><p className="font-black text-red-300">راجع فرع: {b.branch}</p><span className="text-xs bg-red-500/20 text-red-200 px-3 py-1 rounded-full font-bold">{b.pct}%</span></div><p className="text-sm text-slate-200 leading-relaxed">عندك {b.wrong} أخطاء في هذا الفرع. ابدأ بمراجعة القاعدة، ثم حل أسئلة قصيرة، وبعدها ارجع لبنك الأخطاء.</p>{rec?.title && <p className="text-xs text-amber-200 mt-2">اقتراح مراجعة: {rec.title}</p>}</div>})}</div>}</div>;
};
export const StudentLocalHomeCoach = ({ userResults = [], content = [] }) => { const branchStats={}; (userResults||[]).slice(0,10).forEach(r=>{const stats=r?.branchStats||r?.performanceAnalysis?.branchStats||r?.branchAnalysis||{}; Object.entries(stats).forEach(([branch,d])=>{branchStats[branch]=branchStats[branch]||{earned:0,possible:0,wrong:0}; branchStats[branch].earned+=safeNumber(d.earned,0); branchStats[branch].possible+=safeNumber(d.possible,d.total||0); branchStats[branch].wrong+=safeNumber(d.wrong,0);});}); return <StudentLocalAdvice metrics={{branchStats}} content={content}/>; };
export const LocalQuestionExplanation = ({ question, answers }) => { if(!question||question.type==='essay') return null; const selectedIdx=answers?.[question.id]; const correctIdx=safeNumber(question.correctIdx,0); const selectedText=selectedIdx!==undefined?question.options?.[selectedIdx]:'لم يتم اختيار إجابة'; const correctText=question.options?.[correctIdx]||'غير محدد'; const isCorrect=selectedIdx===correctIdx; return <div className={`mb-6 rounded-2xl p-4 border ${isCorrect?'bg-emerald-50 border-emerald-200 text-emerald-800':'bg-amber-50 border-amber-200 text-amber-900'}`}><h4 className="font-black mb-2">شرح المنصة بدون النظام</h4><p className="text-sm font-bold">إجابتك: {selectedText}</p><p className="text-sm font-bold">الإجابة الصحيحة: {correctText}</p>{question.explanation?<p className="text-sm mt-2 leading-relaxed">الشرح: {question.explanation}</p>:<p className="text-xs mt-2 opacity-80">راجع قاعدة هذا السؤال من فرع {question.branch || 'الدرس'} ثم أعد حل أسئلة مشابهة.</p>}</div>; };
export const LocalEssayReviewBox = ({ question, answer }) => { const answerText=typeof answer==='object'?answer?.text:answer; const hasAnswer=!!String(answerText||'').trim()||!!answer?.image; return <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4"><h4 className="font-black text-purple-800 flex items-center gap-2"><PenTool size={18}/> مراجعة مقالي بدون النظام</h4><p className="text-sm text-purple-700 mt-2">{hasAnswer?'تم حفظ إجابتك المقالية. التصحيح النهائي يتم من الأدمن حاليًا لحين تفعيل خطة النظام المدفوعة.':'لا توجد إجابة مقالية محفوظة لهذا السؤال.'}</p>{question?.modelAnswer&&<p className="text-xs text-slate-600 mt-2"><b>نموذج إجابة:</b> {question.modelAnswer}</p>}</div>; };

