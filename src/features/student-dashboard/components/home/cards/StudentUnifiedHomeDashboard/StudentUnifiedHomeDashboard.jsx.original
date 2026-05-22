import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target, Star, Users } from '@shared/icons/lucide-shim.jsx';
import { formatWatchTime } from '@shared/core/platformShared.jsx';
import { db } from '@services/firebase.js';
import { ContinueWatchingCard } from './ContinueWatchingCard.jsx';
import { ContentRatingCard } from './ContentRatingCard.jsx';
import { GroupPerformanceCard } from './GroupPerformanceCard.jsx';

export function StudentUnifiedHomeDashboard({
  userData,
  isPremium,
  nextStudyAction,
  latestVideoActivity,
  inProgressExam,
  nextOpenExam,
  pendingAssignments,
  pendingAssignmentsCount,
  videoCompletionPercent,
  completedVideoCount,
  videos,
  exams,
  filesAndLinks,
  htmls,
  completedExamResults,
  averageScore,
  examResults,
  subscriptionDaysLeft,
  smartWeakBranches,
  recentNotificationItems,
  unseenNotificationCount,
  setActiveTab,
  setShowNotifications,
  setHasNewNotif,
  isBannedContent,
  isBannedExam,
  userId,
}) {
  const firstName = String(userData?.name || 'بطل').split(' ')[0];
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null ? 'VIP مفعل' : `${subscriptionDaysLeft} يوم متبقي`)
    : 'فعّل الباقة';
  const focusItems = smartWeakBranches?.length
    ? smartWeakBranches.map((item) => `${item.branch} · ${item.pct}%`)
    : ['راجع آخر محاضرة', 'حل امتحان قصير', 'راجع أخطاءك'];

  const mainActions = [
    { key: 'videos', label: 'المحاضرات', value: videos.length, hint: `${completedVideoCount}/${videos.length || 0} مكتملة`, icon: PlayCircle, tone: 'from-blue-600 to-sky-600', locked: isBannedContent },
    { key: 'courses', label: 'الكورسات', value: 'افتح', hint: 'المباشر والكورسات', icon: BookOpen, tone: 'from-indigo-600 to-blue-800', locked: isBannedContent },
    { key: 'exams', label: 'الامتحانات', value: exams.length, hint: `${completedExamResults.length} مكتملة`, icon: ClipboardList, tone: 'from-amber-500 to-orange-600', locked: isBannedExam },
    { key: 'assignments', label: 'الواجبات', value: pendingAssignmentsCount, hint: pendingAssignments?.[0]?.title || 'لا يوجد معلق', icon: FileCheck, tone: 'from-emerald-500 to-teal-700', locked: isBannedExam },
    { key: 'files', label: 'الملفات', value: filesAndLinks.length, hint: 'ملفات وروابط', icon: FileText, tone: 'from-rose-500 to-red-700', locked: isBannedContent },
    { key: 'htmls', label: 'تفاعلي', value: htmls.length, hint: 'أنشطة ذكية', icon: Code, tone: 'from-purple-600 to-fuchsia-700', locked: isBannedContent },
    { key: 'student_messages', label: 'رسائلي', value: unseenNotificationCount || 0, hint: 'تنبيهات ورسائل', icon: MessageSquare, tone: 'from-cyan-600 to-teal-700', locked: false },
    { key: 'settings', label: 'أدائي', value: completedExamResults.length ? `${averageScore}%` : 'ابدأ', hint: `${examResults.length} نتيجة`, icon: BarChart3, tone: 'from-slate-800 to-slate-950', locked: false },
  ];

  return (
    <section className="page-soft-enter space-y-5">
      <div className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-slate-950 p-4 md:p-6 shadow-2xl text-white">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative z-10 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1 text-xs font-black text-amber-200">
                <Sparkles size={14} /> الرئيسية المختصرة
              </span>
              <h1 className="mt-4 text-3xl md:text-5xl font-black leading-[1.25]">
                أهلاً <span className="text-amber-300">{firstName}</span>، كل اللي محتاجه في لوحة واحدة.
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-base font-bold leading-8 text-slate-300">
                اختار وجهتك من الكروت بالأسفل بدل الزحمة. المحاضرات، الامتحانات، الواجبات، الملفات، والتقارير كلها بضغطة واحدة.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black text-amber-200">خطوتك التالية</p>
                  <h2 className="mt-1 text-xl md:text-2xl font-black truncate md:whitespace-normal">{nextStudyAction.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-300 line-clamp-2">{nextStudyAction.text}</p>
                </div>
                <button onClick={nextStudyAction.action} className={`shrink-0 rounded-2xl px-5 py-3 font-black shadow-lg transition hover:-translate-y-0.5 bg-gradient-to-r ${nextStudyAction.tone || 'from-amber-400 to-orange-500 text-slate-950'}`}>
                  <span className="flex items-center justify-center gap-2">{nextStudyAction.icon}{nextStudyAction.button}</span>
                </button>
              </div>
              {latestVideoActivity && (
                <div className="mt-4">
                  <div className="h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, latestVideoActivity.percent || 0)}%` }} /></div>
                  <p className="mt-2 text-xs font-black text-amber-100">آخر محاضرة: {latestVideoActivity.percent || 0}% مشاهدة</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 content-start">
            <button onClick={() => setActiveTab('subscription')} className="rounded-3xl border border-amber-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <Crown className="mb-3 text-amber-300" size={24} />
              <p className="text-xs font-black text-amber-100">الاشتراك</p>
              <p className="mt-1 text-xl font-black text-white">{subscriptionText}</p>
            </button>
            <button onClick={() => setActiveTab('videos')} className="rounded-3xl border border-blue-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <PlayCircle className="mb-3 text-sky-300" size={24} />
              <p className="text-xs font-black text-sky-100">تقدم المحاضرات</p>
              <p className="mt-1 text-xl font-black text-white">{videoCompletionPercent}%</p>
            </button>
            <button onClick={() => setActiveTab('exams')} className="rounded-3xl border border-purple-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <ClipboardList className="mb-3 text-purple-300" size={24} />
              <p className="text-xs font-black text-purple-100">متوسط الامتحانات</p>
              <p className="mt-1 text-xl font-black text-white">{completedExamResults.length ? `${averageScore}%` : 'ابدأ'}</p>
            </button>
            <button onClick={() => setActiveTab('assignments')} className="rounded-3xl border border-emerald-200/20 bg-white/10 p-4 text-right transition hover:bg-white/15">
              <FileCheck className="mb-3 text-emerald-300" size={24} />
              <p className="text-xs font-black text-emerald-100">واجبات مطلوبة</p>
              <p className="mt-1 text-xl font-black text-white">{pendingAssignmentsCount}</p>
            </button>
          </div>
        </div>
      </div>

      <ContinueWatchingCard
        latestVideoActivity={latestVideoActivity}
        inProgressExam={inProgressExam}
        nextStudyAction={nextStudyAction}
      />

      {/* ⭐ تقييم آخر محاضرة شاهدها الطالب */}
      {latestVideoActivity?.video && !latestVideoActivity.isCompleted && (
        <ContentRatingCard
          userId={userId}
          contentId={latestVideoActivity.video.id}
          contentTitle={latestVideoActivity.video.title}
        />
      )}

      {/* 📊 مقارنة الأداء مع المجموعة */}
      <GroupPerformanceCard
        averageScore={averageScore}
        completedExamResults={completedExamResults}
        grade={userData?.grade}
        setActiveTab={setActiveTab}
      />

      {nextOpenExam && !inProgressExam && (
        <button onClick={() => setActiveTab('exams')} className="w-full rounded-3xl border border-blue-100 bg-blue-50 p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-black text-blue-900">امتحان متاح الآن</p>
              <p className="mt-1 text-sm font-bold text-blue-700">{nextOpenExam?.title || 'افتح مركز الامتحانات'}</p>
            </div>
            <span className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-black text-white">فتح الامتحانات</span>
          </div>
        </button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {mainActions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              disabled={item.locked}
              onClick={() => !item.locked && setActiveTab(item.key)}
              className={`group relative overflow-hidden rounded-3xl p-4 text-right text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-br ${item.tone}`}
            >
              <Icon className="absolute -bottom-4 -left-4 h-20 w-20 text-white/15 transition group-hover:scale-110" />
              <div className="relative z-10">
                <p className="text-xs font-black text-white/80">{item.label}</p>
                <p className="mt-2 text-2xl font-black">{item.value}</p>
                <p className="mt-1 truncate text-xs font-bold text-white/80">{item.locked ? 'مغلق مؤقتًا' : item.hint}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/95 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Target className="text-amber-600" /> ركّز على المهم</h3>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">بدون تشتت</span>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {focusItems.slice(0, 3).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-400">نقطة {index + 1}</p>
                <p className="mt-1 font-black text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/95 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Bell className="text-blue-600" /> آخر التنبيهات</h3>
            <button onClick={() => { setShowNotifications(true); setHasNewNotif?.(false); }} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">عرض الكل</button>
          </div>
          <div className="space-y-2">
            {recentNotificationItems?.length ? recentNotificationItems.slice(0, 3).map((n, i) => (
              <div key={n.id || i} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="truncate text-sm font-black text-slate-900">{n.title || 'تنبيه جديد'}</p>
                <p className="line-clamp-1 text-xs font-bold text-slate-500">{n.body || n.text || n.message || ''}</p>
              </div>
            )) : <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">لا توجد تنبيهات جديدة.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   ⭐  تقييم المحاضرة بنجوم
   Collection: content_ratings/{userId}_{contentId}
   بدون Cloud Functions — client write مباشر
───────────────────────────────────────── */
