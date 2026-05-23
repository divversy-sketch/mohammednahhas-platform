import {
  C03BellIcon,
  C03BookIcon,
  C03CalendarIcon,
  C03ChartIcon,
  C03CrownIcon,
  C03ExamIcon,
  C03FileIcon,
  C03PlayIcon,
  C03RocketIcon,
  C03SparkIcon,
} from '@shared/icons/creative03Icons.jsx';

const asList = (value) => Array.isArray(value) ? value : [];
const asNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getTitle = (item, fallback) => item?.title || item?.name || item?.label || fallback;
const clamp = (value) => Math.max(0, Math.min(100, Math.round(asNumber(value, 0))));

function C03Progress({ value }) {
  const percent = clamp(value);
  return (
    <div className="c03-progress" aria-label={`التقدم ${percent}%`}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone = 'violet', onClick }) {
  return (
    <button type="button" onClick={onClick} className={`c03-stat-card is-${tone}`}>
      <span className="c03-stat-card__icon"><Icon size={23} /></span>
      <span className="c03-stat-card__text">
        <strong>{value}</strong>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
    </button>
  );
}

function LessonCard({ item, index, onClick }) {
  const progress = clamp(item?.progress ?? item?.percent ?? item?.watchPercent ?? item?.completionPercent ?? 0);
  const durations = ['52:16', '45:30', '38:45', '1:05:20'];
  return (
    <button type="button" onClick={onClick} className="c03-lesson-card">
      <div className="c03-lesson-thumb">
        <span className="c03-orb" />
        <C03PlayIcon size={34} />
        <em>{item?.duration || durations[index % durations.length]}</em>
      </div>
      <div className="c03-lesson-info">
        <strong>{getTitle(item, `محاضرة ${index + 1}`)}</strong>
        <small>{item?.teacher || item?.instructor || 'د. أحمد النحاس'}</small>
        <C03Progress value={progress || 45 + (index * 12)} />
      </div>
    </button>
  );
}

function ExamRow({ exam, index, onClick }) {
  const days = index === 0 ? 'متاح الآن' : `متبقي ${index + 2} أيام`;
  return (
    <button type="button" onClick={onClick} className="c03-exam-row">
      <span><C03ExamIcon size={19} /></span>
      <div>
        <strong>{getTitle(exam, `اختبار ${index + 1}`)}</strong>
        <small>{exam?.unit || exam?.lessonTitle || 'مراجعة من محتوى المنصة'}</small>
      </div>
      <em>{exam?.dateLabel || days}</em>
    </button>
  );
}

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
  subscriptionDaysLeft,
  smartWeakBranches,
  recentNotificationItems,
  unseenNotificationCount,
  setActiveTab,
  setShowNotifications,
  setHasNewNotif,
  isBannedContent,
  isBannedExam,
}) {
  const videosList = asList(videos);
  const examsList = asList(exams);
  const filesList = asList(filesAndLinks);
  const htmlList = asList(htmls);
  const assignments = asList(pendingAssignments);
  const results = asList(completedExamResults);
  const notifications = asList(recentNotificationItems);
  const weakPoints = asList(smartWeakBranches);

  const firstName = String(userData?.name || 'محمد').trim().split(' ')[0] || 'محمد';
  const progress = clamp(videoCompletionPercent);
  const average = results.length ? clamp(averageScore) : 0;
  const latestVideo = latestVideoActivity?.video || latestVideoActivity || videosList[0];
  const latestProgress = clamp(latestVideoActivity?.percent ?? latestVideoActivity?.progress ?? latestVideo?.progress ?? 0);
  const targetExam = inProgressExam || nextOpenExam || examsList[0];
  const primaryAction = nextStudyAction || {
    title: latestVideo ? getTitle(latestVideo, 'استكمل آخر محاضرة') : 'ابدأ أول خطوة',
    text: latestVideo ? 'آخر محاضرة مفتوحة من بيانات المنصة.' : 'افتح المحاضرات واختر أول محتوى مناسب لك.',
    button: latestVideo ? 'متابعة الآن' : 'فتح المحاضرات',
    action: () => setActiveTab?.('videos'),
  };

  const schedule = [
    { time: '10:00', title: getTitle(latestVideo, 'استكمال المحاضرة'), hint: 'ابدأ من حيث توقفت' },
    { time: '12:30', title: getTitle(targetExam, 'مراجعة اختبار'), hint: inProgressExam ? 'لديك محاولة محفوظة' : 'اختبار من محتوى المنصة' },
    { time: '04:00', title: assignments[0]?.title || 'تدريب سريع', hint: assignments[0] ? 'واجب مطلوب' : 'مراجعة نقاط الضعف' },
  ];

  const topLessons = videosList.slice(0, 4);
  const topExams = [inProgressExam, nextOpenExam, ...examsList].filter(Boolean).slice(0, 3);

  const startPrimary = () => {
    if (typeof primaryAction.action === 'function') primaryAction.action();
    else setActiveTab?.('videos');
  };

  return (
    <section className="c03-dashboard" dir="rtl">
      <div className="c03-grid">
        <aside className="c03-day-card c03-glow-card">
          <div className="c03-card-head">
            <div>
              <small>خطة اليوم</small>
              <h3>جدول مقترح من محتوى المنصة</h3>
            </div>
            <C03CalendarIcon size={24} />
          </div>
          <div className="c03-timeline">
            {schedule.map((item, index) => (
              <button type="button" key={`${item.time}-${index}`} onClick={() => index === 1 ? setActiveTab?.('exams') : setActiveTab?.('videos')}>
                <time>{item.time}</time>
                <span />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.hint}</small>
                </div>
              </button>
            ))}
          </div>
          <button type="button" className="c03-soft-action" onClick={() => setActiveTab?.('learning_path')}>
            عرض المسار الكامل
            <C03RocketIcon size={18} />
          </button>
        </aside>

        <main className="c03-main-area">
          <section className="c03-hero c03-glow-card">
            <div className="c03-hero__copy">
              <span className="c03-chip"><C03SparkIcon size={17} /> تجربة الإبداع الجديدة</span>
              <h1>مرحبًا بك، <b>{firstName}</b> 👋</h1>
              <p>تابع رحلتك التعليمية وحقق أهدافك خطوة بخطوة من خلال محتوى المنصة الحقيقي.</p>
            </div>

            <div className="c03-rocket-stage" aria-hidden="true">
              <div className="c03-planet" />
              <C03RocketIcon size={86} />
              <span className="c03-flame" />
            </div>

            <div className="c03-hero-progress">
              <strong>تقدمك في التعلم</strong>
              <span>{progress}%</span>
              <C03Progress value={progress} />
              <small>{isPremium ? 'استمر، حسابك مفعّل' : (subscriptionDaysLeft ? `${subscriptionDaysLeft} يوم متبقي` : 'فعّل الباقة للوصول الكامل')}</small>
            </div>
          </section>

          <section className="c03-stats-row">
            <StatCard icon={C03PlayIcon} label="عدد المحاضرات" value={videosList.length || 0} hint={`${completedVideoCount || 0} مكتملة`} tone="pink" onClick={() => !isBannedContent && setActiveTab?.('videos')} />
            <StatCard icon={C03ExamIcon} label="الامتحانات" value={examsList.length || 0} hint={`${results.length} نتيجة محفوظة`} tone="violet" onClick={() => !isBannedExam && setActiveTab?.('exams')} />
            <StatCard icon={C03CalendarIcon} label="الواجبات" value={pendingAssignmentsCount || 0} hint="مطلوبة الآن" tone="purple" onClick={() => !isBannedExam && setActiveTab?.('assignments')} />
            <StatCard icon={C03ChartIcon} label="متوسط الأداء" value={results.length ? `${average}%` : 'ابدأ'} hint="من نتائجك" tone="blue" onClick={() => setActiveTab?.('settings')} />
          </section>
        </main>
      </div>

      <div className="c03-content-grid">
        <section className="c03-panel c03-continue-panel">
          <div className="c03-panel-head">
            <div>
              <small>أكمل من حيث توقفت</small>
              <h3>{primaryAction.title}</h3>
            </div>
            <button type="button" onClick={startPrimary}>متابعة الآن <C03PlayIcon size={17} /></button>
          </div>
          <div className="c03-video-preview">
            <div className="c03-video-art"><C03PlayIcon size={54} /></div>
            <div>
              <strong>{getTitle(latestVideo, primaryAction.title || 'محتوى مقترح')}</strong>
              <p>{primaryAction.text || 'تابع آخر نشاط لك داخل المنصة.'}</p>
              <C03Progress value={latestProgress || progress} />
              <small>{latestProgress || progress}% مكتمل</small>
            </div>
          </div>
        </section>

        <section className="c03-panel">
          <div className="c03-panel-head">
            <div><small>الاختبارات القادمة</small><h3>استعد للاختبار التالي</h3></div>
            <button type="button" onClick={() => setActiveTab?.('exams')}>عرض الكل</button>
          </div>
          <div className="c03-exam-list">
            {topExams.length ? topExams.map((exam, index) => (
              <ExamRow key={exam.id || index} exam={exam} index={index} onClick={() => setActiveTab?.('exams')} />
            )) : <div className="c03-empty-mini">لا توجد اختبارات متاحة حاليًا.</div>}
          </div>
        </section>

        <section className="c03-panel c03-lessons-panel">
          <div className="c03-panel-head">
            <div><small>المحاضرات الأخيرة</small><h3>من محتوى المنصة</h3></div>
            <button type="button" onClick={() => setActiveTab?.('videos')}>عرض الكل</button>
          </div>
          <div className="c03-lessons-grid">
            {topLessons.length ? topLessons.map((video, index) => (
              <LessonCard key={video.id || index} item={video} index={index} onClick={() => setActiveTab?.('videos')} />
            )) : <div className="c03-empty-mini">لا توجد محاضرات مضافة بعد.</div>}
          </div>
        </section>
      </div>

      <section className="c03-achievement-bar">
        <div><C03BookIcon size={22} /><strong>متعلم نشط</strong><span>أكملت {completedVideoCount || 0} محاضرات</span></div>
        <div><C03SparkIcon size={22} /><strong>مستكشف</strong><span>{htmlList.length || 0} نشاط تفاعلي</span></div>
        <div><C03CrownIcon size={22} /><strong>{isPremium ? 'حساب مميز' : 'حساب مجاني'}</strong><span>{isPremium ? 'كل المزايا مفتوحة' : 'يمكنك الترقية لاحقًا'}</span></div>
        <div><C03FileIcon size={22} /><strong>مكتبتك</strong><span>{filesList.length || 0} ملفات وروابط</span></div>
        <div><C03BellIcon size={22} /><strong>التنبيهات</strong><span>{unseenNotificationCount || 0} غير مقروء</span></div>
      </section>

      <section className="c03-bottom-panels">
        <div className="c03-panel">
          <div className="c03-panel-head">
            <div><small>نقاط تحتاج تركيز</small><h3>اقتراحات ذكية للمراجعة</h3></div>
            <button type="button" onClick={() => setActiveTab?.('remediation')}>العلاج الذكي</button>
          </div>
          <div className="c03-focus-list">
            {(weakPoints.length ? weakPoints : [{ branch: 'راجع آخر درس', pct: progress }, { branch: 'حل اختبار قصير', pct: average }, { branch: 'راجع بنك الأخطاء', pct: pendingAssignmentsCount || 0 }]).slice(0, 3).map((item, index) => (
              <div key={`${item.branch || item}-${index}`}>
                <span>{index + 1}</span>
                <strong>{item.branch || item.title || item}</strong>
                <small>{item.pct || item.percent || 'مقترح'}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="c03-panel">
          <div className="c03-panel-head">
            <div><small>آخر الرسائل</small><h3>تنبيهات المنصة</h3></div>
            <button type="button" onClick={() => { setShowNotifications?.(true); setHasNewNotif?.(false); }}>عرض الكل</button>
          </div>
          <div className="c03-notice-list">
            {notifications.length ? notifications.slice(0, 3).map((notice, index) => (
              <div key={notice.id || index}>
                <strong>{notice.title || 'تنبيه جديد'}</strong>
                <p>{notice.body || notice.text || notice.message || 'رسالة جديدة من إدارة المنصة.'}</p>
              </div>
            )) : <div className="c03-empty-mini">لا توجد تنبيهات جديدة.</div>}
          </div>
        </div>
      </section>
    </section>
  );
}
