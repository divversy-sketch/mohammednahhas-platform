import { useMemo, useState } from 'react';
import {
  Activity,
  BadgeHelp,
  BellRing,
  BookOpen,
  CircleUserRound,
  CreditCard,
  FileChartColumn,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  MessageSquareText,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SectionHeader from '../components/SectionHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import { getPlatformData, resetPlatformData } from '../services/platformRepository.js';

const pieColors = ['#7c6cff', '#23c8ff', '#20d5a2', '#ffb25b'];
const adminTabs = [
  ['overview', 'لوحة التحكم', LayoutDashboard],
  ['students', 'الطلاب', UsersRound],
  ['teachers', 'المدرسون', UserCog],
  ['courses', 'الدورات', BookOpen],
  ['content', 'المحتوى', ScrollText],
  ['exams', 'الاختبارات', BadgeHelp],
  ['payments', 'الاشتراكات والمدفوعات', CreditCard],
  ['messages', 'الرسائل', MessageSquareText],
  ['support', 'الدعم الفني', LifeBuoy],
  ['reports', 'التقارير', FileChartColumn],
  ['logs', 'السجلات', Activity],
  ['permissions', 'الصلاحيات', LockKeyhole],
  ['settings', 'الإعدادات', Settings],
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dataVersion, setDataVersion] = useState(0);
  const data = useMemo(() => getPlatformData().admin, [dataVersion]);

  const refreshData = () => {
    resetPlatformData();
    setDataVersion((value) => value + 1);
  };

  return (
    <div className="dashboard-layout admin-layout">
      <aside className="sidebar admin-sidebar glow-card">
        <div className="profile-card glow-card admin-head">
          <div className="avatar-placeholder glow-ring user-photo"><CircleUserRound size={48} /></div>
          <div>
            <h3>{data.profile.name}</h3>
            <p>{data.profile.role} — {data.profile.plan}</p>
          </div>
        </div>

        <div className="menu-stack admin-menu-scroll">
          {adminTabs.map(([key, label, Icon]) => (
            <button className={`menu-button ${activeTab === key ? 'active' : ''}`} key={key} type="button" onClick={() => setActiveTab(key)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="promo-card glow-card">
          <p className="eyebrow">تحسين ضخم</p>
          <h4>تبويب جديد، اختصارات سريعة، وتنقل أسلس داخل لوحة الأدمن</h4>
          <button className="cta-button wide" type="button" onClick={refreshData}>تحديث البيانات</button>
        </div>
      </aside>

      <div className="dashboard-main page-stack">
        <section className="glow-card admin-topbar-panel">
          <SectionHeader
            eyebrow="لوحة الأدمن المطورة"
            title="إدارة احترافية تشبه أقوى المنصات العالمية"
            description="تنقل مرن، إحصائيات لحظية، نظام تبويب متطور، ورسوم تحليلية حديثة."
            action={<button className="cta-button" type="button">تصدير التقرير</button>}
          />
        </section>

        <AdminTabContent activeTab={activeTab} data={data} />
      </div>
    </div>
  );
}

function AdminTabContent({ activeTab, data }) {
  if (activeTab === 'overview') return <AdminOverview data={data} />;
  if (activeTab === 'students') return <AdminTable title="إدارة الطلاب" description="متابعة الحسابات، الاشتراكات، والحالة." rows={data.students} columns={['name', 'email', 'plan', 'status']} />;
  if (activeTab === 'teachers') return <AdminTable title="إدارة المدرسين" description="توزيع المدرسين والجلسات والتخصصات." rows={data.teachers} columns={['name', 'specialty', 'sessions']} />;
  if (activeTab === 'courses') return <AdminTable title="إدارة الدورات" description="نشر، مراجعة، وتحليل أداء الدورات." rows={data.courses} columns={['title', 'students', 'status']} />;
  if (activeTab === 'support') return <AdminSupport data={data} />;
  if (activeTab === 'reports') return <AdminReports data={data} />;
  if (activeTab === 'payments') return <AdminPayments data={data} />;
  if (activeTab === 'logs') return <AdminLogs data={data} />;
  if (activeTab === 'messages') return <AdminMessages />;
  if (activeTab === 'permissions') return <AdminPermissions />;
  if (activeTab === 'content') return <AdminContent />;
  if (activeTab === 'exams') return <AdminExams />;
  return <AdminSettings />;
}

function AdminOverview({ data }) {
  return (
    <>
      <section className="stats-grid four">
        {data.stats.map((item, index) => {
          const icons = [UserPlus, BadgeHelp, BookOpen, CreditCard];
          return <StatCard key={item.label} icon={icons[index]} label={item.label} value={item.value} helper={item.helper} tone={item.tone} />;
        })}
      </section>

      <section className="grid-two-columns admin-charts">
        <div className="glow-card chart-card large">
          <SectionHeader eyebrow="الأداء العام" title="نمو الطلاب والمبيعات" />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chart}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14 }} />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="#7c6cff" strokeWidth={3} dot={false} name="الطلاب" />
                <Line type="monotone" dataKey="sales" stroke="#23c8ff" strokeWidth={3} dot={false} name="المبيعات" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="page-stack">
          <AdminPayments data={data} compact />
          <AdminQuickActions />
        </div>
      </section>

      <section className="grid-two-columns alt-gap admin-bottom">
        <AdminSupport data={data} compact />
        <AdminLogs data={data} compact />
      </section>
    </>
  );
}

function AdminPayments({ data, compact = false }) {
  return (
    <div className="glow-card chart-card small">
      <SectionHeader eyebrow="توزيع الاشتراكات" title={compact ? 'هيكلة الاشتراكات' : 'الاشتراكات والمدفوعات'} />
      <div className="chart-wrap small">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.subscriptions} dataKey="value" innerRadius={54} outerRadius={86} paddingAngle={4}>
              {data.subscriptions.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend-list">
        {data.subscriptions.map((item, index) => (
          <div key={item.name}><span className="legend-dot" style={{ background: pieColors[index] }} />{item.name}<strong>{item.value}%</strong></div>
        ))}
      </div>
    </div>
  );
}

function AdminQuickActions() {
  return (
    <div className="glow-card quick-actions-panel">
      <SectionHeader eyebrow="إجراءات سريعة" title="اختصارات محسنة" />
      <div className="quick-grid">
        {['إضافة طالب', 'إضافة مدرب', 'إنشاء اختبار', 'نشر دورة', 'إرسال رسالة', 'عرض التقارير'].map((label) => (
          <button key={label} className="quick-square glow-card" type="button">{label}</button>
        ))}
      </div>
    </div>
  );
}

function AdminSupport({ data, compact = false }) {
  const tickets = compact ? data.tickets.slice(0, 3) : data.tickets;
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="التذاكر والدعم" title="متابعة مهام الفريق" />
      <div className="ticket-list">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="ticket-item glow-card">
            <div>
              <span className={`task-badge ${ticket.level === 'عاجل' ? 'danger' : ''}`}>{ticket.level}</span>
              <h4>{ticket.title}</h4>
              <p>{ticket.id} — بواسطة {ticket.owner}</p>
            </div>
            <button className="link-button" type="button">عرض</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminLogs({ data, compact = false }) {
  const items = compact ? data.activities.slice(0, 4) : data.activities.concat(['تم فحص نظام الصلاحيات.', 'تم تحديث تصميم شاشة التحميل.']);
  return (
    <div className="page-stack">
      <div className="glow-card">
        <SectionHeader eyebrow="آخر الأنشطة" title="سجل التحديثات" />
        <div className="activity-list">
          {items.map((item) => <div key={item} className="activity-item"><div className="timeline-dot" /><p>{item}</p></div>)}
        </div>
      </div>
      <div className="glow-card status-panel">
        <SectionHeader eyebrow="حالة النظام" title="جميع الأنظمة تعمل بشكل ممتاز" />
        <div className="status-list">
          {['الخوادم', 'قاعدة البيانات', 'التخزين', 'خدمة البريد'].map((name, index) => (
            <div key={name} className="status-item"><span>{name}</span><strong>99.{99 - index}%</strong></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminReports({ data }) {
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="التقارير" title="مركز التقارير الذكي" description="تجميع التقارير التشغيلية والمالية وتقارير أداء الطلاب في مكان واحد." />
      <div className="content-grid-three">
        {data.reports.map((item) => (
          <div key={item.title} className="identity-card glow-card">
            <FileChartColumn size={22} />
            <h4>{item.title}</h4>
            <p>{item.ready ? 'جاهز للتحميل' : 'قيد التجهيز'}</p>
            <button className="cta-button wide" type="button">{item.ready ? 'تحميل' : 'متابعة'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminTable({ title, description, rows, columns }) {
  const labels = { name: 'الاسم', email: 'البريد', plan: 'الخطة', status: 'الحالة', specialty: 'التخصص', sessions: 'الجلسات', title: 'العنوان', students: 'الطلاب' };
  return (
    <div className="glow-card table-panel">
      <SectionHeader eyebrow="تبويب إداري" title={title} description={description} action={<button className="cta-button" type="button">إضافة جديد</button>} />
      <div className="responsive-table">
        <table>
          <thead>
            <tr>{columns.map((col) => <th key={col}>{labels[col] || col}</th>)}<th>إجراء</th></tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.email || row.name || row.title || index}>
                {columns.map((col) => <td key={col}>{row[col]}</td>)}
                <td><button className="link-button" type="button">إدارة</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMessages() { return <AdminFeature title="الرسائل" icon={MessageSquareText} items={['رسالة جماعية للطلاب', 'إشعار للمدرسين', 'قوالب رسائل جاهزة']} />; }
function AdminPermissions() { return <AdminFeature title="الصلاحيات" icon={LockKeyhole} items={['مدير عام', 'مشرف محتوى', 'دعم فني', 'مدقق تقارير']} />; }
function AdminContent() { return <AdminFeature title="المحتوى" icon={ScrollText} items={['مكتبة الدروس', 'ملفات الدورات', 'وسائط تعليمية', 'مراجعة المحتوى']} />; }
function AdminExams() { return <AdminFeature title="الاختبارات" icon={BadgeHelp} items={['بنك الأسئلة', 'اختبار جديد', 'نتائج الاختبارات', 'نماذج تصحيح']} />; }
function AdminSettings() { return <AdminFeature title="الإعدادات" icon={Settings} items={['هوية المنصة', 'الوضع الليلي والنهاري', 'الشعارات والصور', 'تفضيلات الأمان']} />; }

function AdminFeature({ title, icon: Icon, items }) {
  return (
    <div className="glow-card">
      <SectionHeader eyebrow="صفحة جاهزة للتوسع" title={title} description="تم تجهيز تصميم داخلي لهذا التبويب مع بطاقات منظمة وربط بيانات لاحق." />
      <div className="content-grid-three">
        {items.map((item) => (
          <div className="identity-card glow-card" key={item}>
            <Icon size={22} />
            <h4>{item}</h4>
            <p>وحدة واجهة جاهزة للربط والتطوير.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
