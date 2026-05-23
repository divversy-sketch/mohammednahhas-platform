import {
  IconVideo,
  IconExam,
  IconTask,
  IconFiles,
  IconCode,
  IconBrain,
  IconWallet,
  IconSpark,
  IconRocket,
  IconCalendar,
  IconPlay,
  IconCrown,
  IconChart,
} from '@shared/icons/nahhasCustomIcons.jsx';

const safeList = (value) => Array.isArray(value) ? value : [];
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

const firstTitle = (items, fallback) => safeList(items).find((item) => item?.title || item?.name)?.title || safeList(items).find((item) => item?.title || item?.name)?.name || fallback;

function StatCard({ icon: Icon, label, value, hint, onClick, accent = 'violet', disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`creative-stat-card is-${accent}`}>
      <span className="creative-stat-card__icon"><Icon size={24} /></span>
      <span className="creative-stat-card__content">
        <strong>{value}</strong>
        <small>{label}</small>
        <em>{disabled ? 'مغلق مؤقتًا' : hint}</em>
      </span>
      <span className="creative-sparkline" aria-hidden="true" />
    </button>
  );
}

function StudySchedule({ videos, exams, assignments, setActiveTab }) {
  const rows = [
    { time: '10:00', title: firstTitle(videos, 'محاضرة جديدة من المنصة'), meta: 'ابدأ بالمحتوى الأحدث', tab: 'videos' },
    { time: '12:30', title: firstTitle(assignments, 'مراجعة واجبات الأسبوع'), meta: 'ثبّت نقاطك الضعيفة', tab: 'assignments' },
    { time: '04:00', title: firstTitle(exams, 'اختبار تدريبي سريع'), meta: 'اختبر مستواك الآن', tab: 'exams' },
  ];
  return (
    <section className="creative-side-card creative-schedule">
      <div className="creative-card-head">
        <div>
          <span>خطة اليوم</span>
          <h3>جدول مقترح من محتوى المنصة</h3>
        </div>
        <IconCalendar size={22} />
      </div>
      <div className="creative-timeline">
        {rows.map((row) => (
          <button key={`${row.time}-${row.tab}`} type="button" onClick={() => setActiveTab?.(row.tab)} className="creative-timeline__row">
            <time>{row.time}</time>
            <span>
              <strong>{row.title}</strong>
              <small>{row.meta}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ContinueCard({ latestVideoActivity, inProgressExam, nextOpenExam, videos, setActiveTab }) {
  const hasVideo = Boolean(latestVideoActivity?.video);
  const title = hasVideo
    ? latestVideoActivity.video?.title
    : inProgressExam?.title || nextOpenExam?.title || firstTitle(videos, 'ابدأ أول محاضرة متاحة');
  const percent = clamp(hasVideo ? latestVideoActivity?.percent : 0);
  const tab = hasVideo ? 'videos' : (inProgressExam || nextOpenExam ? 'exams' : 'videos');
  return (
    <section className="creative-panel creative-continue-card">
      <div className="creative-card-head">
        <div>
          <span>أكمل من حيث توقفت</span>
          <h3>{title}</h3>
        </div>
        <IconPlay size={24} />
      </div>
      <div className="creative-media-preview">
        <div className="creative-play-orb"><IconPlay size={34} /></div>
      </div>
      <div className="creative-progress-line"><span style={{ width: `${hasVideo ? percent : 38}%` }} /></div>
      <div className="creative-card-footer">
        <small>{hasVideo ? `${percent}% مشاهدة` : 'مقترح كبداية الآن'}</small>
        <button type="button" onClick={() => setActiveTab?.(tab)}>متابعة الآن</button>
      </div>
    </section>
  );
}

function UpcomingTests({ exams, nextOpenExam, setActiveTab }) {
  const list = safeList(exams).slice(0, 3);
  if (nextOpenExam && !list.find((exam) => exam.id === nextOpenExam.id)) list.unshift(nextOpenExam);
  return (
    <section className="creative-panel creative-tests">
      <div className="creative-card-head">
        <div>
          <span>الاختبارات القادمة</span>
          <h3>امتحاناتك حسب بيانات المنصة</h3>
        </div>
        <button type="button" onClick={() => setActiveTab?.('exams')}>عرض الكل</button>
      </div>
      <div className="creative-test-list">
        {list.length ? list.slice(0, 3).map((exam, index) => (
          <button type="button" onClick={() => setActiveTab?.('exams')} key={exam.id || index} className="creative-test-row">
            <span className="creative-test-icon"><IconExam size={20} /></span>
            <span>
              <strong>{exam.title || exam.name || `اختبار رقم ${index + 1}`}</strong>
              <small>{exam.unit || exam.gradeLabel || exam.status || 'متاح من المنصة'}</small>
            </span>
            <em>{index === 0 ? 'الأقرب' : `${index + 2} يوم`}</em>
          </button>
        )) : <div className="creative-empty">لا توجد اختبارات متاحة حاليًا.</div>}
      </div>
    </section>
  );
}

function RecentLessons({ videos, setActiveTab }) {
  const list = safeList(videos).slice(0, 4);
  return (
    <section className="creative-panel creative-lessons">
      <div className="creative-card-head">
        <div>
          <span>المحاضرات الأخيرة</span>
          <h3>اختار محاضرتك التالية</h3>
        </div>
        <button type="button" onClick={() => setActiveTab?.('videos')}>عرض الكل</button>
      </div>
      <div className="creative-lesson-grid">
        {list.length ? list.map((video, index) => (
          <button type="button" onClick={() => setActiveTab?.('videos')} key={video.id || index} className="creative-lesson-card">
            <span className="creative-lesson-art"><IconBrain size={32} /></span>
            <strong>{video.title || video.name || `محاضرة رقم ${index + 1}`}</strong>
            <small>{video.teacherName || video.description || 'من محتوى المنصة'}</small>
            <span className="creative-mini-progress"><i style={{ width: `${20 + (index * 18)}%` }} /></span>
          </button>
        )) : <div className="creative-empty">لا توجد محاضرات ظاهرة للطالب حاليًا.</div>}
      </div>
    </section>
  );
}

function AchievementStrip({ averageScore, completedVideoCount, completedExamResults, videoCompletionPercent }) {
  const xp = Math.round((Number(videoCompletionPercent) || 0) * 12 + safeList(completedExamResults).length * 85 + completedVideoCount * 25);
  const level = Math.max(1, Math.floor(xp / 350) + 1);
  const levelProgress = clamp((xp % 350) / 3.5);
  return (
    <section className="creative-achievements">
      <div className="creative-badge-card"><IconSpark size={24} /><span><strong>متعلم نشط</strong><small>أكملت {completedVideoCount || 0} محاضرات</small></span></div>
      <div className="creative-badge-card"><IconChart size={24} /><span><strong>متوسطك {averageScore || 0}%</strong><small>أداء الامتحانات</small></span></div>
      <div className="creative-xp">
        <strong>{xp} XP</strong>
        <span><i style={{ width: `${levelProgress}%` }} /></span>
      </div>
      <div className="creative-level">{level}</div>
    </section>
  );
}

export function StudentUnifiedHomeDashboard({
  userData,
  isPremium,
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
  isBannedContent,
  isBannedExam,
}) {
  const videoItems = safeList(videos);
  const examItems = safeList(exams);
  const fileItems = safeList(filesAndLinks);
  const htmlItems = safeList(htmls);
  const weakItems = safeList(smartWeakBranches);
  const notificationItems = safeList(recentNotificationItems);
  const assignmentItems = safeList(pendingAssignments);
  const firstName = String(userData?.name || 'بطل').trim().split(' ')[0] || 'بطل';
  const completion = clamp(videoCompletionPercent);
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null || subscriptionDaysLeft === undefined ? 'VIP' : `${subscriptionDaysLeft} يوم`)
    : 'فعّل الباقة';
  const focusTitle = weakItems[0]?.branch || weakItems[0]?.title || firstTitle(videoItems, 'ابدأ محاضرة جديدة');

  return (
    <section className="creative-dashboard" dir="rtl">
      <div className="creative-dashboard__bg" />
      <div className="creative-dashboard__layout">
        <div className="creative-left-column">
          <StudySchedule videos={videoItems} exams={examItems} assignments={assignmentItems} setActiveTab={setActiveTab} />
          <section className="creative-side-card creative-focus-card">
            <div className="creative-card-head">
              <div><span>هدفك القادم</span><h3>{focusTitle}</h3></div>
              <IconRocket size={24} />
            </div>
            <p>خليك ماشي خطوة بخطوة. المنصة بتعرض لك أقرب محتوى بناءً على بياناتك الحالية.</p>
            <button type="button" onClick={() => setActiveTab?.(weakItems.length ? 'remediation' : 'videos')}>ابدأ المهمة</button>
          </section>
        </div>

        <main className="creative-main-column">
          <section className="creative-hero-card">
            <div className="creative-hero-card__content">
              <span className="creative-kicker"><IconSpark size={16} /> تجربة الإبداع الجديدة</span>
              <h1>مرحباً بك، <span>{firstName}</span> 👋</h1>
              <p>تابع رحلتك التعليمية وحقق أهدافك خطوة بخطوة من خلال محتوى المنصة الحقيقي.</p>
            </div>
            <div className="creative-rocket-scene" aria-hidden="true">
              <div className="creative-planet" />
              <div className="creative-rocket"><IconRocket size={70} /></div>
              <div className="creative-cloud cloud-1" />
              <div className="creative-cloud cloud-2" />
            </div>
            <div className="creative-hero-progress">
              <strong>تقدمك في التعلم</strong>
              <span>{completion}%</span>
              <div><i style={{ width: `${completion}%` }} /></div>
              <small>{completion >= 70 ? 'ممتاز، كمل بنفس القوة' : 'استمر على هذا التقدم'}</small>
            </div>
          </section>

          <div className="creative-stats-grid">
            <StatCard icon={IconVideo} label="عدد المحاضرات" value={videoItems.length} hint={`${completedVideoCount} محاضرة مكتملة`} onClick={() => setActiveTab?.('videos')} disabled={isBannedContent} accent="violet" />
            <StatCard icon={IconExam} label="الامتحانات المتاحة" value={examItems.length} hint={nextOpenExam?.title || 'افتح الامتحانات'} onClick={() => setActiveTab?.('exams')} disabled={isBannedExam} accent="pink" />
            <StatCard icon={IconTask} label="واجبات مطلوبة" value={pendingAssignmentsCount} hint={assignmentItems[0]?.title || 'لا يوجد معلق'} onClick={() => setActiveTab?.('assignments')} disabled={isBannedExam} accent="blue" />
            <StatCard icon={IconWallet} label="الاشتراك" value={subscriptionText} hint="حالة الباقة" onClick={() => setActiveTab?.('subscription')} accent="gold" />
          </div>

          <div className="creative-content-grid">
            <ContinueCard latestVideoActivity={latestVideoActivity} inProgressExam={inProgressExam} nextOpenExam={nextOpenExam} videos={videoItems} setActiveTab={setActiveTab} />
            <UpcomingTests exams={examItems} nextOpenExam={nextOpenExam} setActiveTab={setActiveTab} />
            <RecentLessons videos={videoItems} setActiveTab={setActiveTab} />
          </div>

          <div className="creative-resource-grid">
            <StatCard icon={IconFiles} label="الملفات" value={fileItems.length} hint={firstTitle(fileItems, 'مذكرات وروابط')} onClick={() => setActiveTab?.('files')} disabled={isBannedContent} accent="blue" />
            <StatCard icon={IconCode} label="تفاعلي" value={htmlItems.length} hint="أنشطة HTML" onClick={() => setActiveTab?.('htmls')} disabled={isBannedContent} accent="pink" />
            <StatCard icon={IconBrain} label="العلاج الذكي" value={weakItems.length || 'جاهز'} hint="نقاط تحتاج مراجعة" onClick={() => setActiveTab?.('remediation')} disabled={isBannedExam} accent="violet" />
            <StatCard icon={IconCrown} label="التنبيهات" value={unseenNotificationCount || notificationItems.length} hint={notificationItems[0]?.title || 'آخر رسائل الإدارة'} onClick={() => setShowNotifications?.(true)} accent="gold" />
          </div>

          <AchievementStrip averageScore={averageScore} completedVideoCount={completedVideoCount} completedExamResults={completedExamResults} videoCompletionPercent={videoCompletionPercent} examResults={examResults} />
        </main>
      </div>
    </section>
  );
}
