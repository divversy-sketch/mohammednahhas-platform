import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase.js';
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ClipboardList,
  UploadCloud,
  FileText,
  GraduationCap,
  Layout,
  LogOut,
  Mail,
  Megaphone,
  Power,
  Play,
  Search,
  Settings,
  Sparkles,
  Trophy,
  User,
  Users,
  Video,
  Wand2,
} from '../../shared/icons/lucide-shim.jsx';
import './neon-learning-os.css';

const pct = (value) => Math.max(0, Math.min(100, Number(value || 0)));
const getCover = (item, fallback = 0) => item?.thumbnailUrl || item?.image || item?.posterUrl || item?.coverUrl || item?.courseImage || null;
const getTitle = (item, fallback) => item?.title || item?.name || fallback;
const getDuration = (item, fallback = '38:45') => item?.duration || item?.durationText || (item?.estimatedDurationMinutes ? `${item.estimatedDurationMinutes}:00` : fallback);

function NeonLogo({ label = 'منصة النحاس', sub = 'منصة تعليمية' }) {
  return (
    <div className="neo-brand">
      <div className="neo-brand-mark"><span /></div>
      <div>
        <b>{label}</b>
        <small>{sub}</small>
      </div>
    </div>
  );
}

function QuantumArt({ compact = false }) {
  return (
    <div className={`neo-quantum-art ${compact ? 'is-compact' : ''}`} aria-hidden="true">
      <div className="neo-orbit one" />
      <div className="neo-orbit two" />
      <div className="neo-crystal" />
      <div className="neo-platform" />
      <div className="neo-play-orb"><Play size={compact ? 16 : 24} fill="currentColor" /></div>
    </div>
  );
}

const studentNav = [
  { key: 'home', label: 'الرئيسية', icon: Layout },
  { key: 'learning_path', label: 'مساري الدراسي', icon: BookOpen },
  { key: 'videos', label: 'المحاضرات', icon: Video },
  { key: 'exams', label: 'المهام والاختبارات', icon: ClipboardList },
  { key: 'support', label: 'الملاحظات', icon: Mail },
  { key: 'files', label: 'المكتبة', icon: FileText },
  { key: 'performance', label: 'الإنجازات', icon: Trophy },
  { key: 'student_messages', label: 'الرسائل', icon: Mail, badge: '3' },
  { key: 'settings', label: 'الإعدادات', icon: Settings },
];

const adminNav = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: Layout },
  { key: 'all_users', label: 'الطلاب', icon: Users },
  { key: 'admin_roles', label: 'المدرسون', icon: User },
  { key: 'courses', label: 'الكورسات', icon: BookOpen },
  { key: 'content', label: 'المحاضرات', icon: Video },
  { key: 'exams', label: 'الاختبارات', icon: CheckCircle },
  { key: 'assignments', label: 'الواجبات', icon: ClipboardList },
  { key: 'platform_settings', label: 'الملفات', icon: FileText },
  { key: 'student_reports', label: 'التحليلات', icon: BarChart3 },
  { key: 'notifications_admin', label: 'الإعلانات', icon: Megaphone },
  { key: 'settings', label: 'الإعدادات', icon: Settings },
];

function Sidebar({ type = 'student', activeTab, setActiveTab, profileName = 'محمد', subtitle = 'طالب', isPremium }) {
  const items = type === 'admin' ? adminNav : studentNav;
  return (
    <aside className="neo-sidebar">
      <NeonLogo label="منصة النحاس" sub={type === 'admin' ? 'لوحة الإدارة' : 'منصة تعليمية'} />
      <nav className="neo-nav-list" aria-label={type === 'admin' ? 'تنقل لوحة الإدارة' : 'تنقل الطالب'}>
        {items.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} type="button" onClick={() => setActiveTab?.(key)} className={`neo-nav-item ${activeTab === key ? 'active' : ''}`}>
            <Icon size={19} />
            <span>{label}</span>
            {badge && <em>{badge}</em>}
          </button>
        ))}
      </nav>
      <div className="neo-profile-card">
        <div className="neo-avatar">{type === 'admin' ? 'م' : 'ن'}</div>
        <div className="neo-profile-meta">
          <b>{type === 'admin' ? 'مدير المنصة' : `مرحباً ${profileName}`}</b>
          <small>{type === 'admin' ? 'مدير' : (isPremium ? 'طالب VIP' : subtitle)}</small>
        </div>
        <div className="neo-level">
          <span>المستوى 12</span>
          <i><strong style={{ width: '62%' }} /></i>
          <small>1,250 / 2,000 XP</small>
        </div>
      </div>
      <div className="neo-side-actions">
        <button type="button" title="الوضع الليلي"><Power size={18} /></button>
        <button type="button" title="الإشعارات"><Bell size={18} /></button>
        <button type="button" title="الخروج" onClick={() => signOut(auth)}><LogOut size={18} /></button>
      </div>
    </aside>
  );
}

function Topbar({ type = 'student', name = 'محمد', unseen = 0, onBellClick }) {
  return (
    <header className="neo-topbar">
      <div className="neo-greeting">
        <h1>{type === 'admin' ? 'مرحباً مدير 👑' : `مرحباً ${name} 👋`}</h1>
        <p>{type === 'admin' ? 'لوحة التحكم الإدارية' : 'جاهز لمواصلة التعلم اليوم؟'}</p>
      </div>
      <div className="neo-search">
        <Search size={18} />
        <input placeholder={type === 'admin' ? 'ابحث عن طالب، كورس، محاضرة...' : 'ابحث في الدروس، المحاضرات والملفات...'} />
        <kbd>⌘ K</kbd>
      </div>
      <div className="neo-top-actions">
        <button type="button" onClick={onBellClick}><Bell size={19} />{unseen ? <span>{unseen}</span> : null}</button>
        <button type="button"><Wand2 size={19} /></button>
      </div>
    </header>
  );
}

export function NeonStudentChrome({ children, activeTab, setActiveTab, userData, isPremium, unseenNotificationCount = 0, setShowNotifications }) {
  return (
    <div className="neo-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profileName={userData?.name || 'محمد'} subtitle="طالب" isPremium={isPremium} />
      <div className="neo-main">
        <Topbar name={userData?.name || 'محمد'} unseen={unseenNotificationCount} onBellClick={() => setShowNotifications?.(true)} />
        {children}
      </div>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export function NeonAdminChrome({ children, activeTab, setActiveTab, adminProfile, userData }) {
  return (
    <div className="neo-shell neo-admin-shell">
      <Sidebar type="admin" activeTab={activeTab} setActiveTab={setActiveTab} profileName={adminProfile?.name || userData?.name || 'مدير'} subtitle="مدير" />
      <div className="neo-main">
        <Topbar type="admin" name={adminProfile?.name || userData?.name || 'مدير'} unseen={9} />
        {children}
      </div>
    </div>
  );
}

function MobileBottomNav({ activeTab, setActiveTab }) {
  const items = [
    { key: 'home', label: 'الرئيسية', icon: Layout },
    { key: 'videos', label: 'المحاضرات', icon: Video },
    { key: 'exams', label: 'الاختبارات', icon: FileText },
    { key: 'files', label: 'الملفات', icon: FileText },
    { key: 'settings', label: 'حسابي', icon: User },
  ];
  return (
    <nav className="neo-mobile-nav" aria-label="تنقل الهاتف">
      {items.map(({ key, label, icon: Icon }) => (
        <button key={key} type="button" onClick={() => setActiveTab?.(key)} className={activeTab === key ? 'active' : ''}>
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function StatRing({ value = 78, label = 'التقدم العام' }) {
  return (
    <div className="neo-ring-wrap">
      <div className="neo-ring" style={{ '--value': `${pct(value) * 3.6}deg` }}><b>{pct(value)}%</b></div>
      <div>
        <h3>{label}</h3>
        <p>+12% عن الأسبوع الماضي</p>
      </div>
    </div>
  );
}

function LectureCard({ item, index = 0, onPlay }) {
  const cover = getCover(item);
  const progress = pct(item?.progress || item?.watchPercent || item?.watchPercentage || item?.viewPercent || (index === 0 ? 75 : index === 1 ? 42 : 0));
  const titles = ['الشبكات العصبية', 'ميكانيكا الكم', 'الفيزياء الذرية'];
  return (
    <button type="button" className={`neo-lecture-card ${index === 1 ? 'featured' : ''}`} onClick={onPlay}>
      <div className="neo-thumb">
        {cover ? <img src={cover} alt={getTitle(item, titles[index] || 'محاضرة')} /> : <div className={`neo-fallback-art art-${index % 4}`} />}
        <span>{getDuration(item, index === 0 ? '42:18' : index === 1 ? '38:45' : '45:10')}</span>
      </div>
      <h4>{getTitle(item, titles[index] || 'محاضرة جديدة')}</h4>
      <p>المحاضرة {index + 4}</p>
      <div className="neo-progress-row"><b>{progress}%</b><i><strong style={{ width: `${progress}%` }} /></i></div>
    </button>
  );
}

export function NeonStudentHome({ userData, videos = [], exams = [], filesAndLinks = [], nextStudyAction, latestVideoActivity, pendingAssignmentsCount = 0, videoCompletionPercent = 0, averageScore = 0, setActiveTab, onPlayVideo }) {
  const name = userData?.name || 'محمد';
  const heroVideo = latestVideoActivity?.video || videos[0] || {};
  const recentVideos = (videos.length ? videos : [{}, {}, {}]).slice(0, 3);
  const progress = pct(latestVideoActivity?.percent || heroVideo?.progress || heroVideo?.watchPercent || videoCompletionPercent || 42);
  return (
    <div className="neo-home-grid">
      <section className="neo-assistant-card neo-hide-tablet">
        <Bot className="neo-bot-icon" size={92} />
        <h2>المساعد الذكي</h2>
        <h3>أنا هنا لمساعدتك ✨</h3>
        <p>اطرح أي سؤال حول دروسك أو المحاضرات أو الاختبارات.</p>
        <button type="button" onClick={() => setActiveTab?.('support')}>ابدأ محادثة</button>
      </section>

      <section className="neo-hero-card">
        <div className="neo-hero-media">
          {getCover(heroVideo) ? <img src={getCover(heroVideo)} alt={getTitle(heroVideo, 'الفيزياء الحديثة')} /> : <QuantumArt />}
        </div>
        <div className="neo-hero-info">
          <span>متابعة التعلم</span>
          <h2>{getTitle(heroVideo, 'الفيزياء الحديثة')}</h2>
          <p>{heroVideo?.branch || heroVideo?.section || 'الفصل الثالث: ميكانيكا الكم'}</p>
          <div className="neo-hero-progress"><small>{progress}%</small><i><strong style={{ width: `${progress}%` }} /></i><small>المحاضرة 5 من 12</small></div>
          <div className="neo-hero-actions">
            <button type="button" className="primary" onClick={nextStudyAction?.action || (() => heroVideo?.id ? onPlayVideo?.(heroVideo) : setActiveTab?.('videos'))}><Play size={17} /> متابعة المحاضرة</button>
            <button type="button" className="ghost" onClick={() => setActiveTab?.('videos')}>عرض التفاصيل</button>
          </div>
        </div>
      </section>

      <section className="neo-summary-card neo-hide-tablet"><StatRing value={videoCompletionPercent || 78} /><div className="neo-mini-stats"><span>المحاضرات<b>{videos.length || 24}</b></span><span>ساعات التعلم<b>18.6</b></span><span>الاختبارات<b>{exams.length || 7}</b></span></div></section>

      <section className="neo-path-card">
        <div className="neo-section-head"><h3>مساري الدراسي</h3><button type="button" onClick={() => setActiveTab?.('learning_path')}>عرض الخطة كاملة</button></div>
        <div className="neo-path-steps">
          {[['01','أساسيات الفيزياء','orbit'], ['02','الفيزياء الذرية','wave'], ['03','ميكانيكا الكم','atom'], ['04','الفيزياء الحديثة','chip'], ['05','التطبيقات المتقدمة','flag']].map(([num,label,type], idx) => (
            <React.Fragment key={num}>
              <div className={`neo-step ${idx === 2 ? 'active' : ''}`}><span className={`neo-step-icon ${type}`}>{type === 'atom' ? '⚛' : type === 'flag' ? '⚑' : type === 'chip' ? '▣' : type === 'wave' ? '〽' : '◎'}</span><b>{num}</b><small>{label}</small></div>
              {idx < 4 && <ChevronLeft className="neo-path-arrow" size={16} />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="neo-today-card">
        <div className="neo-section-head"><h3>خطة اليوم</h3><Calendar size={18} /></div>
        {[
          ['09:00 ص', getTitle(heroVideo, 'محاضرة ميكانيكا الكم'), Play],
          ['11:30 ص', pendingAssignmentsCount ? 'حل واجب جديد' : 'حل تمارين الفصل الثالث', CheckCircle],
          ['02:00 م', 'اجتماع مجموعتي', Users],
          ['07:00 م', 'مراجعة سريعة', BookOpen],
        ].map(([time, title, Icon]) => <div className="neo-task-row" key={title}><time>{time}</time><span>{title}</span><Icon size={16} /></div>)}
        <button type="button" onClick={() => setActiveTab?.('assignments')}>عرض الجدول الكامل</button>
      </section>

      <section className="neo-lectures-card">
        <div className="neo-section-head"><h3>المحاضرات الحديثة</h3><button type="button" onClick={() => setActiveTab?.('videos')}>عرض الكل</button></div>
        <div className="neo-lectures-row">{recentVideos.map((video, i) => <LectureCard key={video?.id || i} item={video} index={i} onPlay={() => video?.id ? onPlayVideo?.(video) : setActiveTab?.('videos')} />)}</div>
      </section>

      <section className="neo-analytics-card">
        <div className="neo-section-head"><h3>تحليلات سريعة</h3><Sparkles size={18} /></div>
        <div className="neo-chart-card"><p>ساعات التعلم</p><h4>18.6 <small>+2.6</small></h4><div className="neo-bars">{[28,42,34,55,48,72,64].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div></div>
        <div className="neo-chart-card"><p>النقاط الإجمالية</p><h4>2,450 <small>+250</small></h4><svg viewBox="0 0 120 34"><polyline points="0,24 18,20 34,26 49,14 66,18 82,8 101,13 120,3" fill="none" stroke="currentColor" strokeWidth="3" /></svg></div>
      </section>

      <section className="neo-streak-card neo-hide-mobile"><h3>سلسلة التعلم 🔥</h3><b>12</b><span>أيام متتالية</span><div>{['س','ح','ن','ث','ر','خ','ج'].map((d,i)=><i key={d} className={i > 1 ? 'on' : ''}>{d}</i>)}</div></section>
    </div>
  );
}

export function NeonAdminCommandCenter({ users = [], exams = [], content = [], examResults = [], assignments = [], assignmentSubmissions = [], onNavigate }) {
  const activeStudents = users.filter((u) => (u.status || 'active') === 'active').length || users.length;
  const publishedLectures = content.filter((c) => c.type === 'video').length || content.length;
  const openExams = exams.filter((e) => !e.endTime || new Date(e.endTime).getTime() > Date.now()).length;
  const pendingApprovals = assignments.length + assignmentSubmissions.filter((s) => (s.status || 'pending') === 'pending').length;
  const kpis = [
    ['عدد الطلاب النشطين', activeStudents || 18642, '+12%', Users, 'violet'],
    ['إجمالي الكورسات', Math.max(12, Math.ceil((content.length || 256) / 6)), '+8%', BookOpen, 'purple'],
    ['المحاضرات المنشورة', publishedLectures || 1482, '+15%', Video, 'cyan'],
    ['الاختبارات المفتوحة', openExams || 42, '+5%', CheckCircle, 'gold'],
  ];
  const actions = [
    ['إنشاء محاضرة', 'content', Play], ['إنشاء كورس', 'courses', BookOpen], ['رفع ملف', 'content', UploadCloud], ['إنشاء اختبار', 'exams', ClipboardList], ['إرسال إعلان', 'notifications_admin', Megaphone],
  ];
  return (
    <section className="neo-admin-home">
      <div className="neo-admin-kpis">{kpis.map(([label, value, growth, Icon, tone]) => <button type="button" key={label} className={`neo-admin-kpi ${tone}`} onClick={() => onNavigate?.(label.includes('طلاب') ? 'all_users' : label.includes('اختبارات') ? 'exams' : label.includes('كورسات') ? 'courses' : 'content')}><div><span>{label}</span><b>{Number(value).toLocaleString('ar-EG')}</b><small>{growth} عن الأسبوع الماضي</small></div><Icon size={30} /></button>)}</div>
      <div className="neo-admin-hero">
        <div className="neo-admin-art"><QuantumArt compact /></div>
        <div className="neo-admin-hero-copy"><h2>مركز إدارة المنصة</h2><p>تحكم كامل في المحتوى والمستخدمين والأداء</p><div className="neo-admin-live-stats"><span>الطلاب الجدد اليوم<b>312</b><small>+18</small></span><span>التسجيلات اليوم<b>89</b><small>+14</small></span><span>المحاضرات اليوم<b>24</b><small>+6</small></span><span>الدخل اليوم<b>$2,450</b><small>+12%</small></span></div></div>
      </div>
      <div className="neo-admin-actions"><h3>إدارة المحتوى</h3>{actions.map(([label, tab, Icon]) => <button type="button" key={label} onClick={() => onNavigate?.(tab)}><Icon size={22}/>{label}</button>)}</div>
      <div className="neo-admin-panels">
        <div className="neo-admin-panel recent"><div className="neo-section-head"><h3>النشاط الأخير</h3><button>عرض الكل</button></div>{['تم تسجيل طالب جديد','تم نشر محاضرة جديدة','تم إنشاء اختبار جديد','تم رفع ملف جديد','تم إرسال إعلان جديد'].map((text,i)=><div className="neo-activity-row" key={text}><span>{i === 0 ? 'منذ 5 دقائق' : `منذ ${15*i} دقيقة`}</span><b>{text}</b><i /></div>)}</div>
        <div className="neo-admin-panel chart"><div className="neo-section-head"><h3>تحليلات التفاعل</h3><button>آخر 7 أيام</button></div><div className="neo-line-chart"><svg viewBox="0 0 500 210"><polyline points="0,150 70,100 140,115 210,55 280,92 360,38 430,70 500,42"/><polyline points="0,175 70,132 140,138 210,88 280,121 360,74 430,102 500,84"/><polyline points="0,195 70,168 140,172 210,120 280,150 360,113 430,132 500,126"/></svg></div><div className="neo-chart-stats"><span>إجمالي المشاهدات<b>28,450</b></span><span>إجمالي التسجيلات<b>8,920</b></span><span>متوسط المشاهدة<b>24:36</b></span><span>معدل الإكمال<b>67%</b></span></div></div>
        <div className="neo-admin-panel approvals"><div className="neo-section-head"><h3>الموافقات السريعة</h3></div>{[['مراجعة الكورسات',5],['المحاضرات الجديدة',12],['الاختبارات الجديدة',7],['الواجبات المرسلة',pendingApprovals || 23]].map(([t,n])=><button key={t} type="button"><b>{n}</b><span>{t}<small>بانتظار المراجعة</small></span></button>)}<button type="button" className="all" onClick={() => onNavigate?.('pending')}>عرض جميع الموافقات</button></div>
      </div>
    </section>
  );
}
