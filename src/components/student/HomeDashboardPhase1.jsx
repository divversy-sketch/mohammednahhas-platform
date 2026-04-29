// src/components/student/HomeDashboardPhase1.jsx
// شاشة رئيسية للطالب — مرحلة 1
// مكون مستقل. لا يعتمد على AI.

import React, { useMemo } from "react";
import {
  buildStudentAnalytics,
  buildStudyPlan
} from "../../utils/studentAnalytics";
import {
  buildGamificationProfile
} from "../../utils/gamification";
import {
  getMistakesSummary,
  getMistakesRecommendations,
  canBuildMistakesExam,
  buildMistakesExam
} from "../../utils/mistakesEngine";

export default function HomeDashboardPhase1({
  userData = {},
  results = [],
  mistakes = [],
  videoViews = [],
  onStartMistakesExam,
  onGoToExams,
  onGoToContent,
  onGoToMistakes
}) {
  const analytics = useMemo(
    () => buildStudentAnalytics({ results, mistakes }),
    [results, mistakes]
  );

  const plan = useMemo(
    () => buildStudyPlan({ analytics, mistakes }),
    [analytics, mistakes]
  );

  const gamification = useMemo(
    () => buildGamificationProfile({ results, mistakes, videoViews }),
    [results, mistakes, videoViews]
  );

  const mistakesSummary = useMemo(
    () => getMistakesSummary(mistakes),
    [mistakes]
  );

  const mistakesRecommendations = useMemo(
    () => getMistakesRecommendations(mistakes),
    [mistakes]
  );

  const startMistakesExam = () => {
    if (!canBuildMistakesExam(mistakes)) {
      alert("لا توجد أخطاء اختيارية كافية لعمل اختبار الآن.");
      return;
    }

    const exam = buildMistakesExam(mistakes, {
      grade: userData?.grade || "all",
      limit: 20,
      duration: 20
    });

    onStartMistakesExam?.(exam);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white rounded-3xl p-6 shadow-xl">
        <p className="text-sm text-amber-100 mb-1">أهلًا بك</p>
        <h2 className="text-2xl md:text-3xl font-black">
          {userData?.name || userData?.displayName || "طالب منصة النحاس"}
        </h2>
        <p className="mt-2 text-amber-50">
          ركز على أخطائك، وحافظ على تقدمك خطوة بخطوة.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="متوسطك" value={`${analytics.average}%`} />
        <StatCard title="عدد الامتحانات" value={analytics.totalExams} />
        <StatCard title="الأخطاء المتبقية" value={mistakesSummary.remaining} />
        <StatCard title="المستوى" value={gamification.level} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white rounded-3xl p-5 border shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                مستواك الحالي
              </h3>
              <p className="text-sm text-slate-500">
                تحليل مبني على نتائجك وفروعك فقط.
              </p>
            </div>

            <button
              onClick={onGoToExams}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              حل امتحان
            </button>
          </div>

          {analytics.weakBranches.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl p-4 font-bold">
              لا توجد فروع ضعيفة واضحة حاليًا. استمر في الحل والمراجعة.
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.weakBranches.slice(0, 3).map((b) => (
                <div
                  key={b.branch}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-black text-red-800">{b.branch}</p>
                    <span className="text-red-700 font-black">
                      {b.percentage}%
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    عندك {b.wrong} أخطاء في هذا الفرع. راجع القاعدة ثم أعد التدريب.
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl p-5 border shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-2">
            النقاط والشارات
          </h3>

          <div className="bg-amber-50 rounded-2xl p-4 mb-4">
            <div className="flex justify-between font-black text-amber-800 mb-2">
              <span>Level {gamification.level}</span>
              <span>{gamification.xp} XP</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden border border-amber-100">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${gamification.progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {gamification.badges.length === 0 ? (
              <p className="text-sm text-slate-500">
                ابدأ بحل امتحان للحصول على أول شارة.
              </p>
            ) : (
              gamification.badges.slice(0, 4).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3"
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="font-black text-slate-800">{badge.title}</p>
                    <p className="text-xs text-slate-500">{badge.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-3xl p-5 border shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                ذاكر أخطائي
              </h3>
              <p className="text-sm text-slate-500">
                راجع الأخطاء التي وقعت فيها سابقًا.
              </p>
            </div>

            <button
              onClick={startMistakesExam}
              className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
            >
              ابدأ الآن
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat title="الإجمالي" value={mistakesSummary.total} />
            <MiniStat title="متبقي" value={mistakesSummary.remaining} />
            <MiniStat title="متقن" value={mistakesSummary.mastered} />
          </div>

          <div className="space-y-2">
            {mistakesRecommendations.map((note, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl p-3 text-sm text-slate-700 font-bold"
              >
                {note}
              </div>
            ))}
          </div>

          <button
            onClick={onGoToMistakes}
            className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-black"
          >
            فتح بنك الأخطاء
          </button>
        </section>

        <section className="bg-white rounded-3xl p-5 border shadow-sm">
          <h3 className="text-xl font-black text-slate-900 mb-4">
            خطة المذاكرة المقترحة
          </h3>

          <div className="space-y-3">
            {plan.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 bg-slate-50"
              >
                <div className="flex justify-between gap-3">
                  <p className="font-black text-slate-900">{item.title}</p>
                  <span className="text-xs bg-white border rounded-full px-3 py-1 font-bold text-slate-600">
                    {item.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={onGoToContent}
            className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-black"
          >
            ابدأ المذاكرة
          </button>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white border rounded-3xl p-4 shadow-sm text-center">
      <p className="text-xs text-slate-500 font-bold mb-2">{title}</p>
      <p className="text-2xl md:text-3xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MiniStat({ title, value }) {
  return (
    <div className="bg-slate-50 border rounded-2xl p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}
