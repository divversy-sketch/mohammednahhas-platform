import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Crown,
  FileText,
  Flame,
  GraduationCap,
  Lightbulb,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getResultPercentage = (result) => {
  const total = safeNumber(result?.totalPossible ?? result?.total, 0);
  const score = safeNumber(result?.totalScore ?? result?.score, 0);
  if (safeNumber(result?.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
  return total > 0 ? Math.round((score / total) * 100) : 0;
};

const getGradeBadge = (percentage) => {
  if (percentage >= 85) return { text: 'ممتاز', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (percentage >= 70) return { text: 'جيد جدًا', tone: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (percentage >= 50) return { text: 'جيد', tone: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { text: 'يحتاج تركيز', tone: 'bg-red-50 text-red-700 border-red-200' };
};

const normalizeBranchStats = (userResults = [], mistakes = []) => {
  const branchStats = {};

  (userResults || []).forEach((result) => {
    const stats = result?.branchStats || result?.performanceAnalysis?.branchStats || result?.branchAnalysis || {};
    Object.entries(stats).forEach(([branchName, stat]) => {
      const branch = branchName || 'عام';
      branchStats[branch] = branchStats[branch] || {
        branch,
        earned: 0,
        possible: 0,
        correct: 0,
        wrong: 0,
        total: 0,
        attempts: 0,
      };

      branchStats[branch].earned += safeNumber(stat?.earned ?? stat?.score, 0);
      branchStats[branch].possible += safeNumber(stat?.possible ?? stat?.totalPossible ?? stat?.total, 0);
      branchStats[branch].correct += safeNumber(stat?.correct, 0);
      branchStats[branch].wrong += safeNumber(stat?.wrong, 0);
      branchStats[branch].total += safeNumber(stat?.total, 0);
      branchStats[branch].attempts += 1;
    });
  });

  (mistakes || []).forEach((mistake) => {
    const branch = mistake?.question?.branch || mistake?.branch || 'عام';
    branchStats[branch] = branchStats[branch] || {
      branch,
      earned: 0,
      possible: 0,
      correct: 0,
      wrong: 0,
      total: 0,
      attempts: 0,
    };
    branchStats[branch].wrong += 1;
    branchStats[branch].total += 1;
  });

  return Object.values(branchStats).map((item) => {
    const percentage = item.possible > 0
      ? Math.round((item.earned / item.possible) * 100)
      : item.total > 0
        ? Math.max(0, 100 - Math.min(100, item.wrong * 12))
        : 0;

    return {
      ...item,
      percentage,
      priority: Math.max(0, 100 - percentage) + item.wrong * 3,
    };
  });
};

const buildStudyPlan = ({ weakBranches = [], mistakes = [], content = [] }) => {
  const planBranches = weakBranches.length > 0
    ? weakBranches.slice(0, 4)
    : normalizeBranchStats([], mistakes).sort((a, b) => b.wrong - a.wrong).slice(0, 4);

  if (planBranches.length === 0) {
    return [
      { day: 'اليوم 1', title: 'حل تدريب قصير', note: 'اختار أي فرع درستَه مؤخرًا وحل عليه 10 أسئلة.' },
      { day: 'اليوم 2', title: 'مراجعة درس سابق', note: 'راجع ملخص الدرس وسجل 3 نقاط مهمة.' },
      { day: 'اليوم 3', title: 'امتحان سريع', note: 'اختبر نفسك في وقت محدد ثم راجع الإجابات.' },
    ];
  }

  return planBranches.map((branchInfo, index) => {
    const relatedContent = (content || []).find((item) => {
      const branch = String(item?.branch || '').trim();
      const title = String(item?.title || '').trim();
      return branch === branchInfo.branch || title.includes(branchInfo.branch);
    });

    return {
      day: `اليوم ${index + 1}`,
      title: `مراجعة ${branchInfo.branch}`,
      note: relatedContent?.title
        ? `ابدأ بـ "${relatedContent.title}" ثم حل أسئلة من بنك الأخطاء.`
        : `راجع القاعدة الأساسية في ${branchInfo.branch} ثم حل 10 أسئلة قصيرة.`,
    };
  });
};

const StatCard = ({ icon: Icon, label, value, hint, tone = 'amber' }) => {
  const tones = {
    amber: 'from-amber-50 to-white border-amber-100 text-amber-700',
    emerald: 'from-emerald-50 to-white border-emerald-100 text-emerald-700',
    blue: 'from-blue-50 to-white border-blue-100 text-blue-700',
    red: 'from-red-50 to-white border-red-100 text-red-700',
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-3xl border bg-gradient-to-br ${tones[tone] || tones.amber} p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black opacity-70">{label}</p>
          <p className="mt-1 text-3xl font-black">{value}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
          <Icon size={24} />
        </div>
      </div>
      {hint && <p className="mt-3 text-xs font-bold text-slate-500">{hint}</p>}
    </motion.div>
  );
};

const BranchRow = ({ branch, index }) => {
  const color = branch.percentage >= 70 ? 'bg-emerald-500' : branch.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
            {index + 1}
          </span>
          <p className="font-black text-slate-800">{branch.branch}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {branch.percentage}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, branch.percentage))}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>أخطاء: {branch.wrong}</span>
        <span>محاولات: {branch.attempts || 0}</span>
      </div>
    </div>
  );
};

export default function HomeDashboard({
  userData = {},
  examResults = [],
  mistakes = [],
  content = [],
  videos = [],
  filesAndLinks = [],
  isPremium = false,
  isBannedContent = false,
  getGradeLabel = (grade) => grade || '',
  setActiveTab = () => {},
  onStartMistakesExam = null,
}) {
  const insights = useMemo(() => {
    const completedResults = (examResults || []).filter((result) => result?.status !== 'in_progress' && result?.status !== 'security_hold');
    const percentages = completedResults.map(getResultPercentage).filter((value) => Number.isFinite(value));
    const average = percentages.length > 0
      ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
      : 0;

    const bestResult = completedResults
      .map((result) => ({ ...result, percentage: getResultPercentage(result) }))
      .sort((a, b) => b.percentage - a.percentage)[0];

    const branchStats = normalizeBranchStats(completedResults, mistakes);
    const weakBranches = branchStats
      .filter((branch) => branch.percentage < 75 || branch.wrong > 0)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 4);

    const strongBranches = branchStats
      .filter((branch) => branch.percentage >= 75)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    const plan = buildStudyPlan({ weakBranches, mistakes, content });
    const badge = getGradeBadge(average);

    return {
      completedCount: completedResults.length,
      average,
      bestResult,
      weakBranches,
      strongBranches,
      mistakesCount: (mistakes || []).length,
      plan,
      badge,
    };
  }, [examResults, mistakes, content]);

  const firstName = String(userData?.name || 'طالب').split(' ')[0];

  return (
    <section className="space-y-6" dir="rtl">
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-6 shadow-sm md:p-8">
        <div className="absolute -left-14 -top-14 h-40 w-40 rounded-full bg-amber-200/30 blur-2xl" />
        <div className="absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-blue-200/30 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm">
                {getGradeLabel(userData?.grade)}
              </span>
              {isPremium ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-4 py-2 text-xs font-black text-amber-700 shadow-sm">
                  <Crown size={14} /> حساب VIP
                </span>
              ) : (
                <button
                  onClick={() => setActiveTab('subscription')}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                >
                  ترقية الحساب
                </button>
              )}
            </div>
            <h1 className="text-3xl font-black leading-relaxed text-slate-900 md:text-4xl">
              منور يا {firstName} 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-slate-600">
              دي شاشة متابعة مستواك. هتلاقي أهم أرقامك، الفروع اللي محتاجة مراجعة، وخطة مذاكرة بسيطة مبنية على نتائجك وأخطائك.
            </p>
          </div>

          <div className={`rounded-3xl border px-6 py-4 text-center shadow-sm ${insights.badge.tone}`}>
            <p className="text-xs font-black opacity-80">تقييمك الحالي</p>
            <p className="mt-1 text-3xl font-black">{insights.badge.text}</p>
            <p className="mt-1 text-sm font-black">متوسطك {insights.average}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BarChart3} label="متوسط النتائج" value={`${insights.average}%`} hint="محسوب من الامتحانات المكتملة" tone="blue" />
        <StatCard icon={ClipboardList} label="امتحانات مكتملة" value={insights.completedCount} hint="كل محاولة مكتملة بتقوي التحليل" tone="emerald" />
        <StatCard icon={XCircle} label="أخطاء للمراجعة" value={insights.mistakesCount} hint="استخدم زر ذاكر أخطائي" tone="red" />
        <StatCard icon={Trophy} label="أفضل نتيجة" value={insights.bestResult ? `${insights.bestResult.percentage}%` : '—'} hint={insights.bestResult?.examTitle || insights.bestResult?.title || 'ابدأ أول امتحان'} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
                <Target className="text-amber-600" /> تحليل مستواك
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-500">الفروع مرتبة حسب احتياجها للمراجعة.</p>
            </div>
            <button
              onClick={() => setActiveTab('mistakes_bank')}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
            >
              فتح بنك الأخطاء
            </button>
          </div>

          {insights.weakBranches.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {insights.weakBranches.map((branch, index) => (
                <BranchRow key={branch.branch} branch={branch} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-center">
              <CheckCircle className="mx-auto mb-3 text-emerald-600" size={42} />
              <p className="text-xl font-black text-emerald-800">مستواك مستقر حاليًا</p>
              <p className="mt-2 text-sm font-bold text-emerald-700">كمل حل ومراجعة عشان التحليل يبقى أدق.</p>
            </div>
          )}

          {insights.strongBranches.length > 0 && (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <p className="mb-2 flex items-center gap-2 font-black text-blue-800">
                <Flame size={18} /> نقاط قوتك
              </p>
              <div className="flex flex-wrap gap-2">
                {insights.strongBranches.map((branch) => (
                  <span key={branch.branch} className="rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
                    {branch.branch} - {branch.percentage}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm md:p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <RefreshCw className="text-amber-600" /> ذاكر أخطائي
          </h2>
          <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
            راجع الأسئلة اللي غلطت فيها، وبعدها ابدأ امتحان سريع مبني عليها.
          </p>

          <div className="my-5 rounded-3xl bg-white p-5 text-center shadow-sm">
            <p className="text-xs font-black text-slate-500">عدد الأسئلة المتاحة للمراجعة</p>
            <p className="mt-1 text-5xl font-black text-amber-600">{insights.mistakesCount}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setActiveTab('mistakes_bank')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <BookOpen size={18} /> مراجعة بنك الأخطاء
            </button>
            <button
              onClick={() => {
                if (typeof onStartMistakesExam === 'function') onStartMistakesExam();
                else setActiveTab('mistakes_bank');
              }}
              disabled={insights.mistakesCount === 0}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 font-black text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlayCircle size={18} /> ابدأ امتحان من أخطائي
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <Lightbulb className="text-amber-600" /> خطة مذاكرة مقترحة
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">خطة قصيرة تتغير حسب نتائجك وأخطائك.</p>
          </div>
          <button
            onClick={() => setActiveTab('exams')}
            className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200 md:block"
          >
            الامتحانات
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {insights.plan.map((item, index) => (
            <div key={`${item.day}-${index}`} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm">{item.day}</span>
              <h3 className="mt-3 font-black text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-600">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => !isBannedContent && setActiveTab('videos')}
          className={`rounded-3xl border border-blue-100 bg-white p-6 text-right shadow-sm transition ${isBannedContent ? 'cursor-not-allowed opacity-50 grayscale' : 'hover:border-blue-300'}`}
        >
          <PlayCircle className="mb-4 text-blue-600" size={34} />
          <h3 className="text-xl font-black text-slate-900">المحاضرات</h3>
          <p className="mt-1 text-3xl font-black text-blue-600">{videos.length}</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => !isBannedContent && setActiveTab('files')}
          className={`rounded-3xl border border-amber-100 bg-white p-6 text-right shadow-sm transition ${isBannedContent ? 'cursor-not-allowed opacity-50 grayscale' : 'hover:border-amber-300'}`}
        >
          <FileText className="mb-4 text-amber-600" size={34} />
          <h3 className="text-xl font-black text-slate-900">الملفات</h3>
          <p className="mt-1 text-3xl font-black text-amber-600">{filesAndLinks.length}</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setActiveTab('exams')}
          className="rounded-3xl border border-emerald-100 bg-white p-6 text-right shadow-sm transition hover:border-emerald-300"
        >
          <GraduationCap className="mb-4 text-emerald-600" size={34} />
          <h3 className="text-xl font-black text-slate-900">الامتحانات</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">ابدأ اختبار جديد</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setActiveTab('achievements')}
          className="rounded-3xl border border-purple-100 bg-white p-6 text-right shadow-sm transition hover:border-purple-300"
        >
          <Sparkles className="mb-4 text-purple-600" size={34} />
          <h3 className="text-xl font-black text-slate-900">إنجازاتي</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">تابع تقدمك</p>
        </motion.button>
      </div>
    </section>
  );
}
