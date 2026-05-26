import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BookMarked,
  Brain,
  CalendarClock,
  CheckCircle2,
  Flame,
  LayoutGrid,
  LifeBuoy,
  LineChart as LineIcon,
  MessageSquareText,
  PlayCircle,
  Rocket,
  Settings,
  Trophy,
  UserCircle2,
  UsersRound,
} from 'lucide-react';
import SectionHeader from '../components/SectionHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import { getPlatformData, resetPlatformData } from '../services/platformRepository.js';

const studentTabs = [
  ['overview', 'الرئيسية', LayoutGrid],
  ['courses', 'دوراتي', BookMarked],
  ['live', 'الجلسات المباشرة', PlayCircle],
  ['tasks', 'الواجبات', CheckCircle2],
  ['exams', 'الاختبارات', Trophy],
  ['messages', 'الرسائل', MessageSquareText],
  ['notifications', 'الإشعارات', Bell],
  ['analytics', 'التحليلات', LineIcon],
  ['community', 'المجتمع', UsersRound],
  ['support', 'الدعم', LifeBuoy],
  ['settings', 'الإعدادات', Settings],
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dataVersion, setDataVersion] = useState(0);
  const data = useMemo(() => getPlatformData().student, [dataVersion]);

  const refreshData = () => {
    resetPlatformData();
    setDataVersion((value) => value + 1);
  };

  return (
    <div className="dashboard-layout student-layout">
      <aside className="sidebar glow-card">
        <div className="profile-card glow-card">
          <div className="avatar-placeholder glow-ring user-photo"><UserCircle2 size={52} /></div>
          <div>
            <h3>{data.profile.name}</h3>
            <p>{data.profile.role} — المستوى {data.profile.level}</p>
          </div>
        </div>

        <div className="menu-stack">
          {studentTabs.map(([key, label, Icon]) => (
            <button className={`menu-button ${activeTab === key ? 'active' : ''}`} key={key} type="button" onClick={() => setActiveTab(key)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="promo-card glow-card">
          <p className="eyebrow">ترحيب متحرك</p>
          <h4>أكمل 3 دروس إضافية لتحصل على 200 نقطة</h4>
          <button className="cta-button wide" type="button" onClick={refreshData}>تحديث البيانات</button>
        </div>
      </aside>

      <div className="dashboard-main page-stack">
        <StudentHero data={data} />
        <StudentTabContent activeTab={activeTab} data={data} />
      </div>
    </div>
  );
}

function StudentHero({ data }) {
  return (
    <motion.section className="dashboard-hero glow-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} key="student-hero">
      <div className="hero-text">
        <span className="hero-badge"><Rocket size={14} /> أهلاً بك من جديد</span>
        <h2>مرحبًا {data.profile.name}، رحلتك التعليمية تنتظرك</h2>
        <p>كل صفحة تحمل أنيميشن خاص بها، وكل فكرة مدعومة بأيقونة وجرافكس يرفعان التجربة للمستوى العالمي.</p>
        <div className="hero-actions">
          <button className="cta-button" type="button">استكمل التعلم</button>
          <button className="cta-button ghost" type="button">استكشف الدورات</button>
        </div>
      </div>
      <div className="hero-character glow-card">
        <div className="avatar-placeholder glow-ring large user-photo"><UserCircle2 size={84} /></div>
        <div className="tiny-orb orb-a" />
        <div className="tiny-orb orb-b" />
        <div className="tiny-orb orb-c" />
      </div>
    </motion.section>
  );
}

function StudentTabContent({ activeTab, data }) {
  if (activeTab === 'overview') return <StudentOverview data={data} />;
  if (activeTab === 'courses') return <StudentCourses data={data} />;
  if (activeTab === 'tasks') return <StudentTasks data={data} />;
  if (activeTab === 'exams') return <StudentExams data={data} />;
  if (activeTab === 'messages') return <StudentMessages data={data} />;
  if (activeTab === 'notifications') return <StudentNotifications data={data} />;
  if (activeTab === 'community') return <StudentCommunity data={data} />;
  if (activeTab === 'analytics') return <StudentAnalytics data={data} />;
  if (activeTab === 'live') return <StudentLive data={data} />;
  return <StudentPlaceholder activeTab={activeTab} />;
}

function StudentOverview({ data }) {
  return (
    <>
      <section className="stats-grid four">
        <StatCard icon={CalendarClock} label="الساعات هذا الأسبوع" value="12.5 ساعة" helper="+20% عن الأسبوع الماضي" tone="cyan" />
        <StatCard icon={Flame} label="سلسلة التعلم" value={`${data.profile.streak} يوم`} helper="استمرار ممتاز" tone="purple" />
        <StatCard icon={Brain} label="المسار الذكي" value="4 توصيات" helper="خطة تعلم مخصصة لك" tone="green" />
        <StatCard icon={Trophy} label="النقاط الإجمالية" value={data.profile.points.toLocaleString('ar-EG')} helper="+350 هذا الأسبوع" tone="gold" />
      </section>
      <section className="grid-two-columns alt-gap student-columns">
        <StudentCourses data={data} compact />
        <div className="page-stack">
          <StudentTasks data={data} compact />
          <StudentMessages data={data} compact />
        </div>
      </section>
    </>
  );
}

function StudentCourses({ data, compact = false }) {
  return (
    <div className="glow-card">
      <SectionHeader
        eyebrow="تقدم الدورات"
        title={compact ? 'دوراتك الحالية' : 'كل دوراتي'}
        description="بطاقات تقدم أكثر حيوية وتوزيعًا أفضل داخل لوحة الطالب."
      />
      <div className="progress-list">
        {data.courses.map((item) => (
          <div key={item.name} className="progress-item glow-card">
            <div>
              <h4>{item.name}</h4>
              <p>مسار عملي مع تحديثات لحظية</p>
            </div>
            <div className="progress-ring-sm" style={{ '--progress': `${item.value}%`, '--ring-color': item.color }}>
              <span>{item.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentTasks({ data, compact = false }) {
  const tasks = compact ? data.tasks.slice(0, 3) : data.tasks;
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="المهام القادمة" title={compact ? 'أقرب المهام' : 'كل الواجبات والمهام'} />
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.title} className="task-item glow-card">
            <div>
              <span className="task-badge">{task.badge}</span>
              <h4>{task.title}</h4>
            </div>
            <strong>{task.due}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentMessages({ data, compact = false }) {
  const messages = compact ? data.messages.slice(0, 2) : data.messages;
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="الرسائل" title="تفاعل حي داخل الصفحة" />
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.text} className="message-item">
            <div className="mini-avatar" />
            <div>
              <h4>{msg.from}</h4>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentExams({ data }) {
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="الاختبارات" title="مركز الاختبارات والنتائج" description="واجهة مخصصة للاختبارات، النتائج، والتنبيهات المرتبطة بها." />
      <div className="content-grid-three">
        {data.exams.map((exam) => (
          <div className="identity-card glow-card" key={exam.title}>
            <Trophy size={22} />
            <h4>{exam.title}</h4>
            <p>{exam.status}</p>
            <strong>{exam.score}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentNotifications({ data }) {
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="الإشعارات" title="كل جديد يظهر هنا فورًا" />
      <div className="activity-list">
        {data.notifications.map((item) => (
          <div className="activity-item" key={item}><div className="timeline-dot" /><p>{item}</p></div>
        ))}
      </div>
    </div>
  );
}

function StudentCommunity({ data }) {
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="المجتمع" title="مساحات تعليمية تفاعلية" />
      <div className="content-grid-three">
        {data.community.map((item) => (
          <div className="identity-card glow-card" key={item.title}>
            <UsersRound size={22} />
            <h4>{item.title}</h4>
            <p>{item.members} عضو</p>
            <strong>{item.activity}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentAnalytics({ data }) {
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="التحليلات" title="خريطة تقدمك الذكية" description="قراءة سريعة للتقدم العام ونقاط القوة والفجوات." />
      <div className="stats-grid four">
        <StatCard icon={LineIcon} label="متوسط التقدم" value="74%" helper="عبر كل الدورات" tone="cyan" />
        <StatCard icon={CheckCircle2} label="المهام المكتملة" value="32" helper="هذا الشهر" tone="green" />
        <StatCard icon={Trophy} label="أفضل نتيجة" value="96%" helper="اختبار البرمجة" tone="gold" />
        <StatCard icon={Brain} label="توصيات AI" value="7" helper="جاهزة للتنفيذ" tone="purple" />
      </div>
      <StudentCourses data={data} compact />
    </div>
  );
}

function StudentLive({ data }) {
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="الجلسات المباشرة" title="جدول جلساتك الحية" />
      <div className="task-list">
        {data.tasks.filter((task) => task.badge === 'مباشر' || task.title.includes('جلسة')).map((task) => (
          <div className="task-item glow-card" key={task.title}>
            <div>
              <span className="task-badge">مباشر</span>
              <h4>{task.title}</h4>
            </div>
            <button className="cta-button" type="button">دخول الجلسة</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentPlaceholder({ activeTab }) {
  return (
    <div className="glow-card empty-state">
      <SectionHeader eyebrow="تبويب جاهز" title="تم تجهيز الصفحة للتوسعة" description={`التبويب الحالي: ${activeTab}. الهيكل جاهز لإضافة البيانات الفعلية والواجهات التفصيلية.`} />
    </div>
  );
}
