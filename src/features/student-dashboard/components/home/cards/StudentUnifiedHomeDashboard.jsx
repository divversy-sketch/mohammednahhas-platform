import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Code,
  Crown,
  FileCheck,
  FileText,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
} from '@shared/icons/lucide-shim.jsx';
import { GlowFrame } from '@ui/components';
import { ContinueWatchingCard } from './ContinueWatchingCard.jsx';
import { ContentRatingCard } from './ContentRatingCard.jsx';
import { GroupPerformanceCard } from './GroupPerformanceCard.jsx';

const safeList = (value) => Array.isArray(value) ? value : [];

const DefaultActionIcon = () => <PlayCircle size={18} />;

const HomeMetric = ({ icon: Icon, label, value, hint, tone = 'student', onClick, disabled }) => (
  <GlowFrame as="button" type="button" tone={tone} intensity="soft" disabled={disabled} onClick={onClick} className="w-full text-right disabled:opacity-50">
    <div className="nh-glass-card h-full rounded-[26px] p-4 transition hover:bg-white/15">
      <Icon className="mb-4 text-cyan-300" size={26} />
      <p className="text-xs font-black text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-400">{disabled ? 'مغلق مؤقتًا' : hint}</p>
    </div>
  </GlowFrame>
);

const DynamicPreview = ({ title, icon: Icon, items, emptyText, setActiveTab, targetTab, actionLabel = 'فتح', tone = 'student' }) => (
  <GlowFrame tone={tone} intensity="soft">
    <section className="nh-light-card h-full rounded-[26px] p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-cyan-300">
            <Icon size={22} />
          </span>
          <div>
            <p className="text-xs font-black text-slate-400">من بيانات المنصة</p>
            <h3 className="text-lg font-black text-slate-950">{title}</h3>
          </div>
        </div>
        <button type="button" onClick={() => setActiveTab(targetTab)} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">{actionLabel}</button>
      </div>
      <div className="space-y-2">
        {items.length ? items.slice(0, 3).map((item, index) => (
          <button key={item.id || `${title}-${index}`} type="button" onClick={() => setActiveTab(targetTab)} className="nh-dynamic-list-item w-full text-right transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-950">{item.title || item.name || `عنصر رقم ${index + 1}`}</span>
              <span className="mt-1 block truncate text-xs font-bold text-slate-500">{item.description || item.gradeLabel || item.status || 'متاح من محتوى المنصة'}</span>
            </span>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">{index + 1}</span>
          </button>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">{emptyText}</div>
        )}
      </div>
    </section>
  </GlowFrame>
);

export function StudentUnifiedHomeDashboard({
  userData,
  isPremium,
  nextStudyAction,
  latestVideoActivity,
  inProgressExam,
  nextOpenExam,
  pendingAssignments,
  pendingAssignmentsCount = 0,
  videoCompletionPercent = 0,
  completedVideoCount = 0,
  videos = [],
  exams = [],
  filesAndLinks = [],
  htmls = [],
  completedExamResults = [],
  averageScore = 0,
  examResults = [],
  subscriptionDaysLeft,
  smartWeakBranches,
  recentNotificationItems,
  unseenNotificationCount = 0,
  setActiveTab,
  setShowNotifications,
  setHasNewNotif,
  isBannedContent,
  isBannedExam,
  userId,
}) {
  const videoItems = safeList(videos);
  const examItems = safeList(exams);
  const fileItems = safeList(filesAndLinks);
  const htmlItems = safeList(htmls);
  const notificationItems = safeList(recentNotificationItems);
  const assignmentItems = safeList(pendingAssignments);
  const weakItems = safeList(smartWeakBranches);
  const firstName = String(userData?.name || 'بطل').trim().split(' ')[0] || 'بطل';
  const action = nextStudyAction || {
    title: latestVideoActivity?.video?.title || inProgressExam?.title || nextOpenExam?.title || videoItems[0]?.title || 'ابدأ رحلة المذاكرة',
    text: latestVideoActivity ? 'كمّل آخر محاضرة من حيث توقفت.' : 'افتح أول محاضرة أو امتحان متاح من بيانات المنصة.',
    button: latestVideoActivity ? 'استكمال المحاضرة' : 'ابدأ الآن',
    icon: <DefaultActionIcon />,
    tone: 'from-cyan-300 to-amber-300 text-slate-950',
    action: () => setActiveTab(latestVideoActivity ? 'videos' : inProgressExam || nextOpenExam ? 'exams' : 'videos'),
  };
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null || subscriptionDaysLeft === undefined ? 'VIP مفعل' : `${subscriptionDaysLeft} يوم متبقي`)
    : 'فعّل الباقة';
  const focusItems = weakItems.length
    ? weakItems.map((item) => `${item.branch || item.title || 'نقطة مراجعة'} · ${item.pct || item.percent || 0}%`)
    : [
      videoItems[0]?.title ? `ابدأ: ${videoItems[0].title}` : 'شاهد محاضرة من المتاح',
      examItems[0]?.title ? `حل: ${examItems[0].title}` : 'حل امتحان قصير',
      assignmentItems[0]?.title ? `واجب: ${assignmentItems[0].title}` : 'راجع أخطاءك السابقة',
    ];

  return (
    <section className="nh-page min-h-[calc(100vh-120px)] rounded-[2rem] p-3 md:p-5" dir="rtl">
      <div className="nh-shell-grid" />
      <div className="space-y-5">
        <GlowFrame tone="student" intensity="normal">
          <section className="nh-glass-card relative overflow-hidden rounded-[28px] p-5 md:p-7">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-amber-300/16 blur-3xl" />
            <div className="relative z-10 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
              <div className="flex flex-col justify-between gap-5">
                <div>
                  <span className="nh-chip"><Sparkles size={16} /> الرئيسية الجديدة للطالب</span>
                  <h1 className="mt-4 text-3xl font-black leading-[1.25] text-white md:text-5xl">
                    أهلاً <span className="bg-gradient-to-l from-cyan-200 to-amber-200 bg-clip-text text-transparent">{firstName}</span>، دي خطتك الآن.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm font-bold leading-8 text-slate-300 md:text-base">
                    الصفحة دي لا تعرض كلام ثابت؛ المحاضرات، الامتحانات، الواجبات، الملفات، والتنبيهات كلها مأخوذة من بيانات المنصة الحالية.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-cyan-200">خطوتك التالية</p>
                      <h2 className="mt-1 truncate text-xl font-black text-white md:whitespace-normal md:text-2xl">{action.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-300">{action.text}</p>
                    </div>
                    <button type="button" onClick={action.action} className={`shrink-0 rounded-2xl bg-gradient-to-r px-5 py-3 font-black shadow-lg transition hover:-translate-y-0.5 ${action.tone || 'from-cyan-300 to-amber-300 text-slate-950'}`}>
                      <span className="flex items-center justify-center gap-2">{action.icon || <DefaultActionIcon />}{action.button}</span>
                    </button>
                  </div>
                  {latestVideoActivity && (
                    <div className="mt-4">
                      <div className="h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, latestVideoActivity.percent || 0)}%` }} /></div>
                      <p className="mt-2 text-xs font-black text-cyan-100">آخر محاضرة: {latestVideoActivity.video?.title || 'محاضرة سابقة'} · {latestVideoActivity.percent || 0}% مشاهدة</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 content-start">
                <HomeMetric icon={Crown} label="الاشتراك" value={subscriptionText} hint="حالة الباقة" tone="admin" onClick={() => setActiveTab('subscription')} />
                <HomeMetric icon={PlayCircle} label="تقدم المحاضرات" value={`${videoCompletionPercent}%`} hint={`${completedVideoCount}/${videoItems.length || 0} مكتملة`} onClick={() => setActiveTab('videos')} disabled={isBannedContent} />
                <HomeMetric icon={ClipboardList} label="متوسط الامتحانات" value={completedExamResults.length ? `${averageScore}%` : 'ابدأ'} hint={`${examResults.length} نتيجة محفوظة`} tone="purple" onClick={() => setActiveTab('exams')} disabled={isBannedExam} />
                <HomeMetric icon={FileCheck} label="واجبات مطلوبة" value={pendingAssignmentsCount} hint={assignmentItems[0]?.title || 'لا يوجد معلق'} onClick={() => setActiveTab('assignments')} disabled={isBannedExam} />
              </div>
            </div>
          </section>
        </GlowFrame>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HomeMetric icon={BookOpen} label="المحاضرات" value={videoItems.length} hint="من محتوى المنصة" onClick={() => setActiveTab('videos')} disabled={isBannedContent} />
          <HomeMetric icon={ClipboardList} label="الامتحانات" value={examItems.length} hint={nextOpenExam?.title || 'افتح مركز الامتحانات'} tone="admin" onClick={() => setActiveTab('exams')} disabled={isBannedExam} />
          <HomeMetric icon={FileText} label="الملفات" value={fileItems.length} hint="مذكرات وروابط" tone="purple" onClick={() => setActiveTab('files')} disabled={isBannedContent} />
          <HomeMetric icon={Code} label="تفاعلي" value={htmlItems.length} hint="أنشطة HTML" onClick={() => setActiveTab('htmls')} disabled={isBannedContent} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <DynamicPreview title="آخر المحاضرات" icon={PlayCircle} items={videoItems} emptyText="لا توجد محاضرات متاحة حتى الآن." setActiveTab={setActiveTab} targetTab="videos" actionLabel="كل المحاضرات" />
          <DynamicPreview title="الامتحانات المتاحة" icon={ClipboardList} items={examItems} emptyText="لا توجد امتحانات متاحة حتى الآن." setActiveTab={setActiveTab} targetTab="exams" actionLabel="كل الامتحانات" tone="admin" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DynamicPreview title="واجبات مطلوبة" icon={FileCheck} items={assignmentItems} emptyText="لا توجد واجبات معلقة حاليًا." setActiveTab={setActiveTab} targetTab="assignments" actionLabel="الواجبات" />
          <DynamicPreview title="ملفات وروابط" icon={FileText} items={fileItems} emptyText="لا توجد ملفات متاحة حاليًا." setActiveTab={setActiveTab} targetTab="files" actionLabel="الملفات" tone="purple" />
          <DynamicPreview title="محتوى تفاعلي" icon={Code} items={htmlItems} emptyText="لا يوجد محتوى تفاعلي متاح حاليًا." setActiveTab={setActiveTab} targetTab="htmls" actionLabel="تشغيل" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <GlowFrame intensity="soft" tone="admin">
            <section className="nh-light-card rounded-[26px] p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Target className="text-amber-600" /> ركّز على المهم</h3>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">خطة اليوم</span>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {focusItems.slice(0, 3).map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-400">خطوة {index + 1}</p>
                    <p className="mt-1 line-clamp-2 font-black text-slate-800">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </GlowFrame>

          <GlowFrame intensity="soft" tone="student">
            <section className="nh-light-card rounded-[26px] p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Bell className="text-blue-600" /> آخر التنبيهات</h3>
                <button type="button" onClick={() => { setShowNotifications(true); setHasNewNotif?.(false); }} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">عرض الكل</button>
              </div>
              <div className="space-y-2">
                {notificationItems.length ? notificationItems.slice(0, 3).map((n, i) => (
                  <div key={n.id || i} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="truncate text-sm font-black text-slate-900">{n.title || 'تنبيه جديد'}</p>
                    <p className="line-clamp-1 text-xs font-bold text-slate-500">{n.body || n.text || n.message || ''}</p>
                  </div>
                )) : <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500">لا توجد تنبيهات جديدة.</p>}
                {!!unseenNotificationCount && <p className="text-center text-xs font-black text-cyan-700">لديك {unseenNotificationCount} تنبيه غير مقروء</p>}
              </div>
            </section>
          </GlowFrame>
        </div>

        <ContinueWatchingCard latestVideoActivity={latestVideoActivity} inProgressExam={inProgressExam} nextStudyAction={action} />

        {latestVideoActivity?.video && !latestVideoActivity.isCompleted && (
          <ContentRatingCard userId={userId} contentId={latestVideoActivity.video.id} contentTitle={latestVideoActivity.video.title} />
        )}

        <GroupPerformanceCard averageScore={averageScore} completedExamResults={completedExamResults} grade={userData?.grade} setActiveTab={setActiveTab} />

        <GlowFrame intensity="soft" tone="purple">
          <button type="button" onClick={() => setActiveTab('settings')} className="nh-glass-card flex w-full flex-col gap-3 rounded-[26px] p-4 text-right md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-lg font-black text-white"><Trophy className="text-amber-300" /> تقرير الأداء الكامل</p>
              <p className="mt-1 text-sm font-bold text-slate-300">افتح ملفك الشخصي والأداء لمراجعة النتائج ونقاط القوة والضعف.</p>
            </div>
            <span className="rounded-2xl bg-white px-4 py-2 text-center text-sm font-black text-slate-950">عرض الأداء</span>
          </button>
        </GlowFrame>
      </div>
    </section>
  );
}
