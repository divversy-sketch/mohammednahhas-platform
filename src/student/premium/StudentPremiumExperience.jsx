import { useMemo, useState } from 'react';
import {
  BarChart3, BookOpen, Calendar, CheckCircle, ClipboardList,
  Clock3, Crown, Download, FileCheck, FileText,
  Lock, Play, PlayCircle, Search, Sparkles,
  Target, Trophy, Video
} from '../../shared/icons/lucide-shim.jsx';
import { formatWatchTime, getResultPercentage, safeNumber } from '../../shared/core/platformShared.jsx';
import { getGradeLabel } from '../../shared/constants/grades.jsx';
import { imagePlacementStyle } from '../../shared/utils/imagePlacement.js';

const img = (item) => item?.thumbnailUrl || item?.posterUrl || item?.lessonImage || item?.coverImage || item?.courseImageUrl || item?.image || item?.examImageUrl || '';
const titleOf = (item, fallback = 'بدون عنوان') => item?.title || item?.name || item?.courseTitle || fallback;
const dateLabel = (value) => {
  if (!value) return 'غير محدد';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'غير محدد' : date.toLocaleDateString('ar-EG');
};
const durationLabel = (item) => {
  const seconds = safeNumber(item?.durationSeconds, safeNumber(item?.estimatedDurationMinutes, safeNumber(item?.duration, 0)) * 60);
  if (!seconds) return 'مدة غير محددة';
  return formatWatchTime(Math.round(seconds));
};
const percentClass = (percent) => percent >= 90 ? 'is-good' : percent >= 50 ? 'is-info' : 'is-warn';

export function PremiumPageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="premium-page-header">
      <div>
        {eyebrow && <span className="premium-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="premium-page-header__actions">{children}</div>}
    </div>
  );
}

export function PremiumStatCard({ icon: Icon, label, value, hint, tone = 'navy' }) {
  return (
    <div className={`premium-stat premium-stat--${tone}`}>
      <span className="premium-stat__icon"><Icon size={20} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  );
}

export function PremiumProgress({ value = 0 }) {
  const percent = Math.max(0, Math.min(100, Math.round(value || 0)));
  return <div className="premium-progress" aria-label={`التقدم ${percent}%`}><span style={{ width: `${percent}%` }} /></div>;
}

function PremiumVideoCover({ item, locked, onPlay, large = false }) {
  const cover = img(item);
  return (
    <button className={`premium-cover ${large ? 'premium-cover--large' : ''}`} onClick={onPlay} aria-label={`تشغيل ${titleOf(item)}`}>
      {cover ? <img src={cover} style={imagePlacementStyle(item?.imagePlacement)} alt={titleOf(item)} /> : <div className="premium-cover__fallback"><Video size={large ? 54 : 38} /></div>}
      <span className="premium-cover__shade" />
      <span className="premium-cover__play">{locked ? <Lock size={large ? 28 : 22} /> : <Play size={large ? 28 : 22} fill="currentColor" />}</span>
      <span className="premium-cover__duration">{durationLabel(item)}</span>
      {(item?.grade || item?.stage || item?.subject) && <span className="premium-cover__badge">{item?.subject || getGradeLabel(item?.grade) || item?.stage}</span>}
    </button>
  );
}

export function PremiumVideoCard({ video, percent = 0, isPremium, onPlay, onLinkedExam, unlockPercent = 80 }) {
  const locked = video?.isPremium && !isPremium;
  const button = percent >= 95 ? 'إعادة مشاهدة' : percent > 0 ? 'متابعة' : 'ابدأ الآن';
  return (
    <article className="premium-card premium-video-card">
      <PremiumVideoCover item={video} locked={locked} onPlay={onPlay} />
      <div className="premium-card__body">
        <div className="premium-card__meta">
          <span>{video?.subject || video?.category || getGradeLabel(video?.grade)}</span>
          {video?.isPremium && <b><Crown size={12} /> VIP</b>}
        </div>
        <h3>{titleOf(video, 'محاضرة')}</h3>
        <p>{video?.description || video?.section || 'تابع المحاضرة وسجل تقدمك تلقائيًا.'}</p>
        <div className="premium-watch-row"><span>نسبة المشاهدة</span><strong>{Math.round(percent)}%</strong></div>
        <PremiumProgress value={percent} />
        <div className="premium-card__actions">
          <button className="premium-primary-btn" onClick={onPlay}>{locked ? 'ترقية للفتح' : button}</button>
          {video?.linkedExamId && (
            <button className="premium-soft-btn" onClick={onLinkedExam} disabled={percent < unlockPercent}>{percent >= unlockPercent ? 'امتحان الفيديو' : `${unlockPercent - Math.round(percent)}% للفتح`}</button>
          )}
        </div>
      </div>
    </article>
  );
}

export function PremiumStudentHome({
  userData, isPremium, nextStudyAction, latestVideoActivity, videos, exams, filesAndLinks,
  pendingAssignmentsCount, videoCompletionPercent, completedVideoCount, completedExamResults,
  averageScore, smartWeakBranches, setActiveTab, getVideoWatchPercent, onPlayVideo
}) {
  const firstName = String(userData?.name || 'طالب').split(' ')[0];
  const suggestedVideos = (videos || []).slice(0, 4);
  const heroVideo = latestVideoActivity?.video || suggestedVideos[0];
  const heroPercent = latestVideoActivity?.percent ?? (heroVideo ? getVideoWatchPercent?.(heroVideo) : 0);
  const shortcuts = [
    ['videos', 'المحاضرات', `${videos?.length || 0} محاضرة`, 'عرض المحاضرات', PlayCircle],
    ['courses', 'الكورسات', 'مسارات ووحدات', 'عرض الكورسات', BookOpen],
    ['exams', 'الاختبارات', `${exams?.length || 0} اختبار`, 'عرض الاختبارات', ClipboardList],
    ['assignments', 'الواجبات', `${pendingAssignmentsCount || 0} مطلوب`, 'رفع الحلول', FileCheck],
    ['files', 'الملفات', `${filesAndLinks?.length || 0} ملف`, 'تحميل الملفات', FileText],
    ['settings', 'الأداء', completedExamResults?.length ? `${averageScore}%` : 'ابدأ التحليل', 'عرض الأداء', BarChart3],
  ];

  return (
    <section className="premium-page premium-home">
      <div className="premium-hero-grid">
        <div className="premium-hero">
          <span className="premium-eyebrow"><Sparkles size={14}/> لوحة متابعة ذكية</span>
          <h1>أهلًا <em>{firstName}</em><br/>جاهز نكمل من آخر نقطة؟</h1>
          <p>كل المهم أمامك بدون زحمة: استكمال التعلم، مهام اليوم، ونظرة سريعة على تقدمك.</p>
          <div className="premium-hero__actions">
            <button className="premium-cta" onClick={nextStudyAction?.action}>{nextStudyAction?.button || 'استكمل الآن'}</button>
            <button className="premium-ghost" onClick={() => setActiveTab('courses')}>عرض الخطة</button>
          </div>
          <div className="premium-hero__strip">
            <div><small>التقدم الكلي</small><strong>{videoCompletionPercent || 0}%</strong></div>
            <div><small>المحاضرات المكتملة</small><strong>{completedVideoCount || 0}</strong></div>
            <div><small>متوسط الاختبارات</small><strong>{completedExamResults?.length ? `${averageScore}%` : '—'}</strong></div>
          </div>
        </div>
        <div className="premium-resume-card">
          <div className="premium-resume-card__top"><span>استكمال المشاهدة</span><b>{Math.round(heroPercent || 0)}%</b></div>
          {heroVideo ? <PremiumVideoCover item={heroVideo} large onPlay={() => onPlayVideo?.(heroVideo)} /> : <div className="premium-empty-mini">لا توجد محاضرات بعد</div>}
          <h2>{heroVideo ? titleOf(heroVideo, 'محاضرة') : 'ابدأ أول محاضرة'}</h2>
          <p>{latestVideoActivity?.watchedSeconds ? `آخر موضع: ${formatWatchTime(Math.round(latestVideoActivity.watchedSeconds))}` : 'اختر محاضرة لتبدأ رحلتك.'}</p>
          <PremiumProgress value={heroPercent} />
        </div>
      </div>

      <div className="premium-shortcuts">
        {shortcuts.map(([key, label, value, hint, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)} className="premium-shortcut">
            <Icon size={24}/><span>{label}</span><strong>{value}</strong><small>{hint}</small>
          </button>
        ))}
      </div>

      <div className="premium-content-grid">
        <section className="premium-section-main">
          <PremiumPageHeader eyebrow="تابع محاضراتك" title="آخر المحاضرات" description="صور أغلفة واضحة، تقدم محفوظ، وزر مباشر للاستكمال." />
          <div className="premium-video-grid premium-video-grid--home">
            {suggestedVideos.length ? suggestedVideos.map(v => <PremiumVideoCard key={v.id} video={v} percent={getVideoWatchPercent?.(v) || 0} isPremium={isPremium} onPlay={() => onPlayVideo?.(v)} />) : <PremiumEmpty icon={PlayCircle} title="لا توجد محاضرات مطابقة" text="جرّب تغيير الفلتر أو العودة لاحقًا." />}
          </div>
        </section>
        <aside className="premium-side-panel">
          <h3>التالي لك</h3>
          <TaskLine icon={ClipboardList} label="اختبارات" value={exams?.length ? `${exams.length} متاح` : 'لا يوجد مفتوح'} />
          <TaskLine icon={FileCheck} label="واجبات" value={`${pendingAssignmentsCount || 0} مطلوب`} />
          <TaskLine icon={FileText} label="ملفات" value={`${filesAndLinks?.length || 0} ملف`} />
          <div className="premium-advice">
            <Target size={18}/>
            <p>{smartWeakBranches?.length ? `راجع ${smartWeakBranches[0].branch} لرفع نتيجتك.` : 'أنت على الطريق الصحيح، واصل التعلم يوميًا.'}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function TaskLine({ icon: Icon, label, value }) {
  return <div className="premium-task-line"><Icon size={18}/><span>{label}</span><strong>{value}</strong></div>;
}

export function PremiumLecturesPage({ videos, isPremium, getVideoWatchPercent, onPlayVideo, onLinkedExam, unlockPercent }) {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => (videos || []).filter(v => {
    const p = getVideoWatchPercent?.(v) || 0;
    const statusOk = status === 'all' || (status === 'new' && p === 0) || (status === 'watching' && p > 0 && p < 95) || (status === 'done' && p >= 95);
    const q = query.trim().toLowerCase();
    const queryOk = !q || `${titleOf(v)} ${v?.subject || ''} ${v?.category || ''}`.toLowerCase().includes(q);
    return statusOk && queryOk;
  }), [videos, status, query, getVideoWatchPercent]);
  const continueVideo = (videos || []).find(v => (getVideoWatchPercent?.(v) || 0) > 0 && (getVideoWatchPercent?.(v) || 0) < 95);

  return (
    <section className="premium-page">
      <PremiumPageHeader eyebrow="المحاضرات" title="تصفح وتابع جميع محاضراتك التعليمية." description="فلترة سريعة، صور أغلفة، ونسب مشاهدة محفوظة في كل كارت.">
        <div className="premium-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث عن محاضرة، كورس، ملف..." /></div>
      </PremiumPageHeader>
      {continueVideo && <div className="premium-continue-wide"><PremiumVideoCover item={continueVideo} onPlay={() => onPlayVideo?.(continueVideo)} /><div><span>كارت استكمال المشاهدة</span><h2>{titleOf(continueVideo)}</h2><p>آخر تقدم محفوظ: {getVideoWatchPercent?.(continueVideo) || 0}%</p><PremiumProgress value={getVideoWatchPercent?.(continueVideo) || 0}/><button className="premium-primary-btn" onClick={() => onPlayVideo?.(continueVideo)}>متابعة المشاهدة</button></div></div>}
      <div className="premium-tabs"><button className={status === 'all' ? 'is-active' : ''} onClick={() => setStatus('all')}>الكل</button><button className={status === 'new' ? 'is-active' : ''} onClick={() => setStatus('new')}>لم يبدأ</button><button className={status === 'watching' ? 'is-active' : ''} onClick={() => setStatus('watching')}>قيد المشاهدة</button><button className={status === 'done' ? 'is-active' : ''} onClick={() => setStatus('done')}>مكتمل</button></div>
      <div className="premium-video-grid">
        {filtered.length ? filtered.map(v => <PremiumVideoCard key={v.id} video={v} percent={getVideoWatchPercent?.(v) || 0} isPremium={isPremium} onPlay={() => onPlayVideo?.(v)} onLinkedExam={() => onLinkedExam?.(v)} unlockPercent={unlockPercent} />) : <PremiumEmpty icon={PlayCircle} title="لا توجد محاضرات مطابقة" text="جرّب تغيير الفلتر أو العودة لاحقًا." />}
      </div>
    </section>
  );
}

export function PremiumCoursesPage({ children }) {
  return (
    <section className="premium-page">
      <PremiumPageHeader eyebrow="الكورسات" title="مسارات ووحدات منظمة" description="كل كورس يظهر كمسار واضح مع الوحدات والدروس والملفات المرتبطة." />
      <div className="premium-course-shell">
        <div className="premium-course-hero"><BookOpen size={34}/><div><h2>استكمل الكورس المناسب لك</h2><p>الكورسات الحالية محفوظة كما هي، مع إطار بصري Premium RTL وتجهيز لعرض الوحدات كـ Accordion.</p></div><button className="premium-ghost">حفظ الكورس</button></div>
        <div className="premium-legacy-wrap">{children}</div>
      </div>
    </section>
  );
}

export function PremiumExamsPage({ exams, examResults, isPremium, getExamAccessState, onPreStart, onReview, onCertificate, onStartApproved }) {
  const completed = examResults?.filter(r => r.status === 'completed') || [];
  const saved = examResults?.find(r => r.status === 'in_progress' || r.adminDecision === 'continue');
  const average = completed.length ? Math.round(completed.reduce((s, r) => s + getResultPercentage(r), 0) / completed.length) : 0;
  return (
    <section className="premium-page">
      <PremiumPageHeader eyebrow="اختباراتي" title="تابع اختباراتك وحقق أفضل النتائج." description="المفتوحة، المحفوظة، النتائج، والمغلقة في ترتيب واضح." />
      <div className="premium-stats-grid"><PremiumStatCard icon={ClipboardList} label="اختبارات مفتوحة" value={exams?.length || 0} hint="حسب صلاحيات حسابك"/><PremiumStatCard icon={CheckCircle} label="مكتملة" value={completed.length}/><PremiumStatCard icon={Trophy} label="متوسط النتائج" value={completed.length ? `${average}%` : '—'} /><PremiumStatCard icon={Clock3} label="بانتظار التصحيح" value={(examResults || []).filter(r => r.status === 'security_hold').length}/></div>
      {saved && <div className="premium-saved-exam"><ClipboardList size={24}/><div><span>لديك محاولة محفوظة</span><h2>{saved.examTitle || 'اختبار محفوظ'}</h2><p>آخر حفظ: {dateLabel(saved.updatedAt || saved.submittedAt)}</p></div></div>}
      <div className="premium-exam-grid">
        {(exams || []).length ? exams.map(e => <PremiumExamCard key={e.id} exam={e} attempts={(examResults || []).filter(r => r.examId === e.id)} isPremium={isPremium} accessState={getExamAccessState?.(e)} onPreStart={() => onPreStart?.(e)} onReview={() => onReview?.(e)} onCertificate={(result) => onCertificate?.(e, result)} onStartApproved={() => onStartApproved?.(e)} />) : <PremiumEmpty icon={ClipboardList} title="لا توجد اختبارات مفتوحة حاليًا" text="سنخبرك عند إضافة اختبار جديد." />}
      </div>
    </section>
  );
}

function PremiumExamCard({ exam, attempts, isPremium, accessState, onPreStart, onReview, onCertificate, onStartApproved }) {
  const result = attempts?.find(r => ['continue', 'restart'].includes(r.adminDecision)) || attempts?.find(r => ['security_hold', 'in_progress', 'cheated'].includes(r.status)) || attempts?.find(r => r.status === 'completed') || attempts?.[0];
  const questions = (exam?.questions || []).reduce((acc, g) => acc + ((g?.subQuestions || []).length), 0);
  const completed = result?.status === 'completed';
  const approved = result?.adminDecision === 'continue' || result?.adminDecision === 'restart';
  return (
    <article className={`premium-card premium-exam-card ${accessState?.locked ? 'is-locked' : ''}`}>
      {img(exam) && <div className="premium-exam-card__image"><img src={img(exam)} style={imagePlacementStyle(exam?.imagePlacement)} alt={titleOf(exam, 'اختبار')} /></div>}
      <div className="premium-card__meta"><span>{exam?.subject || getGradeLabel(exam?.grade)}</span>{exam?.isPremium && <b><Crown size={12}/> VIP</b>}</div>
      <h3>{titleOf(exam, 'اختبار')}</h3>
      <div className="premium-exam-facts"><span><ClipboardList size={14}/>{questions} سؤال</span><span><Clock3 size={14}/>{exam?.duration || 0} دقيقة</span><span><Calendar size={14}/>{dateLabel(exam?.endTime)}</span></div>
      {accessState?.locked && <div className="premium-lock-note"><Lock size={16}/>{accessState.message}</div>}
      {completed ? <div className="premium-card__actions"><button className="premium-soft-btn" onClick={onReview}>عرض النتيجة</button><button className="premium-primary-btn" onClick={() => onCertificate?.(result)}>شهادة</button></div> : approved ? <button className="premium-primary-btn" onClick={onStartApproved}>استكمال</button> : <button className="premium-primary-btn" disabled={(exam?.isPremium && !isPremium) || accessState?.locked} onClick={onPreStart}>{exam?.isPremium && !isPremium ? 'مقفل' : 'ابدأ'}</button>}
    </article>
  );
}

export function PremiumAssignmentsFilesPage({ assignments, submissions, filesAndLinks, user, userData, assignmentPanel }) {
  const submitted = new Set((submissions || []).map(s => s.assignmentId));
  const pending = (assignments || []).filter(a => !submitted.has(a.id));
  return (
    <section className="premium-page">
      <PremiumPageHeader eyebrow="الواجبات والملفات" title="إدارة الواجبات والملفات في مكان واحد." description="تقليل التكرار: الواجبات والملفات المهمة مدمجة في صفحة واحدة منظمة." />
      <div className="premium-stats-grid"><PremiumStatCard icon={FileCheck} label="واجبات مستحقة" value={pending.length}/><PremiumStatCard icon={FileText} label="ملفات جديدة" value={filesAndLinks?.length || 0}/><PremiumStatCard icon={Download} label="ملفات متاحة" value={filesAndLinks?.length || 0}/><PremiumStatCard icon={CheckCircle} label="واجبات مكتملة" value={(submissions || []).length}/></div>
      <div className="premium-two-col">
        <div className="premium-card premium-table-card"><h2>الواجبات</h2>{assignmentPanel}</div>
        <aside className="premium-files-panel"><h2>الملفات</h2>{(filesAndLinks || []).length ? filesAndLinks.map(f => <FileMini key={f.id} file={f}/>) : <PremiumEmpty icon={FileText} title="لا توجد ملفات بعد" text="عند إضافة ملفات جديدة ستظهر هنا." compact />}</aside>
      </div>
    </section>
  );
}

function FileMini({ file }) {
  const isLink = file?.type === 'link';
  return <a href={file?.url} target="_blank" rel="noreferrer" className="premium-file-mini"><span>{isLink ? <Sparkles size={18}/> : <FileText size={18}/>}</span><div><strong>{titleOf(file, 'ملف')}</strong><small>{file?.subject || getGradeLabel(file?.grade)} · {isLink ? 'رابط' : 'تحميل'}</small></div><Download size={16}/></a>;
}

export function PremiumPerformancePage({ videos, exams, examResults, assignments, submissions, getVideoWatchPercent, growthPanel, certificatePanel, profileForm }) {
  const completed = (examResults || []).filter(r => r.status === 'completed');
  const avg = completed.length ? Math.round(completed.reduce((s, r) => s + getResultPercentage(r), 0) / completed.length) : 0;
  const watched = (videos || []).filter(v => (getVideoWatchPercent?.(v) || 0) >= 95).length;
  const assignmentPercent = assignments?.length ? Math.round(((submissions || []).length / assignments.length) * 100) : 0;
  return (
    <section className="premium-page">
      <PremiumPageHeader eyebrow="الأداء والتقدم" title="حلل أداءك وركز على التحسن المستمر." description="مؤشرات مختصرة، توصيات ذكية، وتقاريرك في مكان واحد." />
      <div className="premium-stats-grid premium-stats-grid--five"><PremiumStatCard icon={Target} label="التقدم الكلي" value={videos?.length ? `${Math.round((watched / videos.length) * 100)}%` : '—'} /><PremiumStatCard icon={Clock3} label="ساعات الدراسة" value={Math.round((videos || []).reduce((s,v)=>s+safeNumber(v.durationSeconds,0),0)/3600)}/><PremiumStatCard icon={FileCheck} label="إكمال الواجبات" value={`${assignmentPercent}%`}/><PremiumStatCard icon={PlayCircle} label="إكمال المحاضرات" value={`${watched}/${videos?.length || 0}`}/><PremiumStatCard icon={Trophy} label="متوسط الاختبارات" value={completed.length ? `${avg}%` : '—'}/></div>
      <div className="premium-analytics-grid"><div className="premium-card premium-chart-card"><h2>تحليلات الأداء</h2>{growthPanel}</div><aside className="premium-side-panel"><h3>توصية شخصية</h3><div className="premium-advice"><Sparkles size={18}/><p>{avg >= 80 ? 'أداؤك قوي. حافظ على الاستمرارية وراجع أخطاءك الأخيرة.' : 'ركز على محاضرتين ثم حل اختبار قصير لرفع المتوسط.'}</p></div>{certificatePanel}</aside></div>
      <div className="premium-card premium-profile-card"><h2>بيانات الحساب</h2>{profileForm}</div>
    </section>
  );
}

export function PremiumEmpty({ icon: Icon, title, text, compact = false }) {
  return <div className={`premium-empty ${compact ? 'premium-empty--compact' : ''}`}><Icon size={compact ? 28 : 42}/><h3>{title}</h3><p>{text}</p></div>;
}
