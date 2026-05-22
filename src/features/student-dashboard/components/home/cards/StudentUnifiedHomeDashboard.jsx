import {
  ArrowIcon,
  AssignmentIcon,
  BellIcon,
  BrainIcon,
  CourseIcon,
  CrownIcon,
  ExamIcon,
  FileBoxIcon,
  FocusIcon,
  InteractiveIcon,
  LessonIcon,
  MessageIcon,
  SparkIcon,
  TrophyIcon,
} from '@shared/icons/nahhasCustomIcons.jsx';

const safeList = (value) => Array.isArray(value) ? value : [];
const getTitle = (item, fallback) => item?.title || item?.name || item?.lessonTitle || item?.examTitle || fallback;
const getSub = (item, fallback = 'متاح من بيانات المنصة') => item?.description || item?.gradeLabel || item?.branch || item?.status || item?.type || fallback;

const StatCard = ({ icon: Icon, label, value, sub, onClick, tone = 'blue', disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`nh-modern-stat nh-modern-stat--${tone} ${disabled ? 'is-disabled' : ''}`}
  >
    <span className="nh-modern-stat__icon"><Icon size={24} /></span>
    <span className="nh-modern-stat__body">
      <span className="nh-modern-stat__label">{label}</span>
      <strong>{value}</strong>
      <small>{disabled ? 'مغلق مؤقتًا' : sub}</small>
    </span>
  </button>
);

const DataList = ({ title, eyebrow, icon: Icon, items, emptyText, actionLabel, onAction, tone = 'blue' }) => (
  <section className="nh-modern-panel">
    <div className="nh-modern-panel__head">
      <div className="nh-modern-titleline">
        <span className={`nh-modern-titleicon nh-modern-titleicon--${tone}`}><Icon size={22} /></span>
        <div>
          <p>{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <button type="button" onClick={onAction} className="nh-modern-mini-btn">{actionLabel}</button>
    </div>

    <div className="nh-modern-list">
      {items.length ? items.slice(0, 4).map((item, index) => (
        <button key={item.id || `${title}-${index}`} type="button" onClick={onAction} className="nh-modern-list__item">
          <span className="nh-modern-list__number">{String(index + 1).padStart(2, '0')}</span>
          <span className="nh-modern-list__text">
            <strong>{getTitle(item, `عنصر رقم ${index + 1}`)}</strong>
            <small>{getSub(item)}</small>
          </span>
          <ArrowIcon size={18} />
        </button>
      )) : (
        <div className="nh-modern-empty">{emptyText}</div>
      )}
    </div>
  </section>
);

const TodayStep = ({ index, text }) => (
  <div className="nh-modern-step">
    <span>{index}</span>
    <p>{text}</p>
  </div>
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
}) {
  const videoItems = safeList(videos);
  const examItems = safeList(exams);
  const fileItems = safeList(filesAndLinks);
  const htmlItems = safeList(htmls);
  const notificationItems = safeList(recentNotificationItems);
  const assignmentItems = safeList(pendingAssignments);
  const weakItems = safeList(smartWeakBranches);

  const firstName = String(userData?.name || 'طالب').trim().split(' ')[0] || 'طالب';
  const continueTitle = latestVideoActivity?.video?.title || inProgressExam?.title || nextOpenExam?.title || videoItems[0]?.title || 'ابدأ من أول محاضرة متاحة';
  const continueText = latestVideoActivity
    ? `آخر تقدم محفوظ ${latestVideoActivity.percent || 0}%`
    : inProgressExam
      ? 'لديك امتحان بدأ بالفعل ويمكنك استكماله.'
      : nextOpenExam
        ? 'أقرب امتحان متاح من بيانات المنصة.'
        : 'لم يتم تسجيل نشاط سابق بعد.';
  const continueTarget = latestVideoActivity ? 'videos' : (inProgressExam || nextOpenExam ? 'exams' : 'videos');

  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null || subscriptionDaysLeft === undefined ? 'VIP مفعل' : `${subscriptionDaysLeft} يوم`)
    : 'مجاني';

  const planItems = weakItems.length
    ? weakItems.map((item) => `${item.branch || item.title || 'نقطة مراجعة'} · ${item.pct || item.percent || 0}%`)
    : [
      videoItems[0]?.title ? `شاهد: ${videoItems[0].title}` : 'شاهد محاضرة من المتاح',
      examItems[0]?.title ? `حل: ${examItems[0].title}` : 'حل امتحان قصير',
      assignmentItems[0]?.title ? `أنهِ: ${assignmentItems[0].title}` : 'راجع أخطاءك السابقة',
    ];

  return (
    <section className="nh-modern-student-home" dir="rtl">
      <div className="nh-modern-hero">
        <div className="nh-modern-hero__copy">
          <span className="nh-modern-kicker"><SparkIcon size={18} /> لوحة الطالب الجديدة</span>
          <h1>أهلاً {firstName}، كل خطوة مذاكرة واضحة قدامك.</h1>
          <p>واجهة جديدة تعتمد على محتوى المنصة الحقيقي: المحاضرات، الامتحانات، الواجبات، الملفات والتنبيهات بدون نصوص تجريبية ثابتة.</p>
          <div className="nh-modern-hero__actions">
            <button type="button" onClick={() => setActiveTab(continueTarget)} className="nh-modern-primary-btn">
              <span>{latestVideoActivity ? 'استكمال آخر نشاط' : 'ابدأ المذاكرة'}</span>
              <ArrowIcon size={18} />
            </button>
            <button type="button" onClick={() => setActiveTab('settings')} className="nh-modern-secondary-btn">عرض الأداء</button>
          </div>
        </div>

        <div className="nh-modern-next-card">
          <span className="nh-modern-next-card__icon"><LessonIcon size={26} /></span>
          <p>خطوتك التالية</p>
          <h2>{continueTitle}</h2>
          <small>{continueText}</small>
          <div className="nh-modern-progress">
            <span style={{ width: `${Math.min(100, Number(latestVideoActivity?.percent || videoCompletionPercent || 0))}%` }} />
          </div>
        </div>
      </div>

      <div className="nh-modern-stats-grid">
        <StatCard icon={CrownIcon} label="الاشتراك" value={subscriptionText} sub="حالة الباقة" tone="gold" onClick={() => setActiveTab('subscription')} />
        <StatCard icon={LessonIcon} label="المحاضرات" value={`${videoCompletionPercent}%`} sub={`${completedVideoCount}/${videoItems.length || 0} مكتملة`} onClick={() => setActiveTab('videos')} disabled={isBannedContent} />
        <StatCard icon={ExamIcon} label="الامتحانات" value={completedExamResults.length ? `${averageScore}%` : examItems.length} sub={`${examResults.length} نتيجة محفوظة`} tone="purple" onClick={() => setActiveTab('exams')} disabled={isBannedExam} />
        <StatCard icon={AssignmentIcon} label="الواجبات" value={pendingAssignmentsCount} sub={assignmentItems[0]?.title || 'لا يوجد معلق'} tone="green" onClick={() => setActiveTab('assignments')} disabled={isBannedExam} />
      </div>

      <div className="nh-modern-layout-grid">
        <div className="nh-modern-main-column">
          <div className="nh-modern-feature-grid">
            <DataList title="آخر المحاضرات" eyebrow="من محتوى المنصة" icon={LessonIcon} items={videoItems} emptyText="لا توجد محاضرات متاحة حتى الآن." actionLabel="كل المحاضرات" onAction={() => setActiveTab('videos')} />
            <DataList title="الامتحانات المتاحة" eyebrow="حسب جدولك" icon={ExamIcon} items={examItems} emptyText="لا توجد امتحانات متاحة حتى الآن." actionLabel="كل الامتحانات" onAction={() => setActiveTab('exams')} tone="purple" />
          </div>

          <div className="nh-modern-feature-grid nh-modern-feature-grid--three">
            <DataList title="واجبات مطلوبة" eyebrow="متابعة يومية" icon={AssignmentIcon} items={assignmentItems} emptyText="لا توجد واجبات معلقة حاليًا." actionLabel="فتح" onAction={() => setActiveTab('assignments')} tone="green" />
            <DataList title="ملفات وروابط" eyebrow="مذكرات وملخصات" icon={FileBoxIcon} items={fileItems} emptyText="لا توجد ملفات متاحة حاليًا." actionLabel="فتح" onAction={() => setActiveTab('files')} tone="gold" />
            <DataList title="محتوى تفاعلي" eyebrow="أنشطة HTML" icon={InteractiveIcon} items={htmlItems} emptyText="لا يوجد محتوى تفاعلي متاح حاليًا." actionLabel="تشغيل" onAction={() => setActiveTab('htmls')} tone="pink" />
          </div>
        </div>

        <aside className="nh-modern-side-column">
          <section className="nh-modern-panel nh-modern-plan-panel">
            <div className="nh-modern-panel__head">
              <div className="nh-modern-titleline">
                <span className="nh-modern-titleicon nh-modern-titleicon--gold"><FocusIcon size={22} /></span>
                <div><p>خطة اليوم</p><h3>ركز على المهم</h3></div>
              </div>
            </div>
            <div className="nh-modern-steps">
              {planItems.slice(0, 3).map((item, index) => <TodayStep key={`${item}-${index}`} index={index + 1} text={item} />)}
            </div>
          </section>

          <section className="nh-modern-panel nh-modern-notify-panel">
            <div className="nh-modern-panel__head">
              <div className="nh-modern-titleline">
                <span className="nh-modern-titleicon"><BellIcon size={22} /></span>
                <div><p>{unseenNotificationCount ? `${unseenNotificationCount} غير مقروء` : 'آخر تحديثاتك'}</p><h3>التنبيهات</h3></div>
              </div>
              <button type="button" onClick={() => { setShowNotifications(true); setHasNewNotif?.(false); }} className="nh-modern-mini-btn">عرض</button>
            </div>
            <div className="nh-modern-list nh-modern-list--compact">
              {notificationItems.length ? notificationItems.slice(0, 3).map((n, i) => (
                <div key={n.id || i} className="nh-modern-notification-item">
                  <strong>{n.title || 'تنبيه جديد'}</strong>
                  <small>{n.body || n.text || n.message || 'رسالة من الإدارة'}</small>
                </div>
              )) : <div className="nh-modern-empty">لا توجد تنبيهات جديدة.</div>}
            </div>
          </section>

          <section className="nh-modern-panel nh-modern-achievement-panel">
            <span><TrophyIcon size={24} /></span>
            <h3>ملخص أدائك</h3>
            <p>متوسط نتائجك الحالي {completedExamResults.length ? `${averageScore}%` : 'لم يبدأ بعد'}.</p>
            <button type="button" onClick={() => setActiveTab('settings')}>فتح التقرير</button>
          </section>
        </aside>
      </div>
    </section>
  );
}
