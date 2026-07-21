import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import nahhasLogo from '../../assets/nahhas-logo-transparent.png';
import '../../styles/pages/parent-dashboard.css';

const asDate = (value) => {
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch { return null; }
};
const dateLabel = (value) => asDate(value)?.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) || 'غير محدد';
const percentOf = (row) => {
  const direct = Number(row?.percentage ?? row?.percent ?? row?.scorePercentage);
  if (Number.isFinite(direct)) return Math.round(direct);
  const score = Number(row?.score || 0);
  const total = Number(row?.total || row?.totalScore || 0);
  return total > 0 ? Math.round((score / total) * 100) : 0;
};
function Stat({ label, value, tone = '' }) { return <div className={`parent-stat ${tone}`}><strong>{value}</strong><span>{label}</span></div>; }

export default function ParentDashboardPage({ user, userData }) {
  const [phoneLinkedIds, setPhoneLinkedIds] = useState([]);
  const linkedIds = useMemo(() => [...new Set([...(Array.isArray(userData?.linkedStudentIds) ? userData.linkedStudentIds : []), userData?.linkedStudentId, ...phoneLinkedIds].filter(Boolean))], [userData, phoneLinkedIds]);
  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState(linkedIds[0] || '');
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const phone = String(userData?.phone || userData?.parentPhone || '').replace(/\D/g, '').slice(-11);
    if (!phone) { setPhoneLinkedIds([]); return undefined; }
    return onSnapshot(doc(db, 'parent_links', phone), (snap) => setPhoneLinkedIds(snap.exists() ? (snap.data().studentIds || []) : []), () => setPhoneLinkedIds([]));
  }, [userData?.phone, userData?.parentPhone]);

  useEffect(() => {
    if (!linkedIds.length) { setChildren([]); setLoading(false); return undefined; }
    const state = new Map();
    const unsubs = linkedIds.map((id) => onSnapshot(doc(db, 'users', id), (snap) => {
      if (snap.exists()) state.set(id, { id: snap.id, ...snap.data() }); else state.delete(id);
      setChildren(Array.from(state.values())); setLoading(false);
    }, () => setLoading(false)));
    return () => unsubs.forEach((fn) => fn());
  }, [linkedIds.join('|')]);

  useEffect(() => { if (!selectedId && linkedIds[0]) setSelectedId(linkedIds[0]); }, [linkedIds, selectedId]);
  useEffect(() => {
    if (!selectedId) { setResults([]); setAttendance([]); setSubmissions([]); return undefined; }
    const unsubs = [
      onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', selectedId)), (s) => setResults(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => setResults([])),
      onSnapshot(query(collection(db, 'attendance_records'), where('studentId', '==', selectedId)), (s) => setAttendance(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => setAttendance([])),
      onSnapshot(query(collection(db, 'assignment_submissions'), where('studentId', '==', selectedId)), (s) => setSubmissions(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => setSubmissions([])),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [selectedId]);

  const child = children.find((item) => item.id === selectedId) || children[0];
  const completedResults = results.filter((r) => (r.status || 'completed') === 'completed');
  const average = completedResults.length ? Math.round(completedResults.reduce((sum, row) => sum + percentOf(row), 0) / completedResults.length) : 0;
  const absences = attendance.filter((row) => row.status === 'absent');
  const late = attendance.filter((row) => row.status === 'late');
  const present = attendance.filter((row) => row.status === 'present');
  const sortedResults = [...completedResults].sort((a, b) => (asDate(b.submittedAt || b.createdAt)?.getTime() || 0) - (asDate(a.submittedAt || a.createdAt)?.getTime() || 0));
  const sortedAttendance = [...attendance].sort((a, b) => (asDate(b.date || b.createdAt)?.getTime() || 0) - (asDate(a.date || a.createdAt)?.getTime() || 0));

  return <main className="parent-page" dir="rtl">
    <header className="parent-header"><div className="parent-brand"><img src={nahhasLogo} alt="منصة النحاس" /><div><span>منصة النحاس</span><h1>متابعة ولي الأمر</h1></div></div><div className="parent-header-actions"><span>{userData?.name || user?.email || 'ولي الأمر'}</span><button onClick={() => signOut(auth)}>تسجيل الخروج</button></div></header>
    {!linkedIds.length ? <section className="parent-empty"><h2>الحساب غير مربوط بطالب حتى الآن</h2><p>تأكد أن رقم موبايل الحساب هو نفس رقم ولي الأمر المسجل لدى الإدارة. الربط يتم برقم الهاتف فقط.</p></section> : loading ? <section className="parent-empty">جاري تحميل بيانات الطالب...</section> : <>
      <section className="parent-child-bar"><div><small>الطالب المرتبط</small><h2>{child?.name || 'الطالب'}</h2><p>{child?.grade || ''} {child?.phone ? `• ${child.phone}` : ''}</p></div>{children.length > 1 && <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>{children.map((item) => <option key={item.id} value={item.id}>{item.name || item.email}</option>)}</select>}</section>
      <section className="parent-stats"><Stat label="متوسط الامتحانات" value={`${average}%`} tone="blue" /><Stat label="مرات الحضور" value={present.length} tone="green" /><Stat label="مرات الغياب" value={absences.length} tone="red" /><Stat label="مرات التأخير" value={late.length} tone="amber" /><Stat label="الواجبات المسلمة" value={submissions.length} /></section>
      <section className="parent-grid"><article className="parent-card"><div className="parent-card-title"><h3>آخر نتائج الامتحانات</h3><span>{completedResults.length} نتيجة</span></div>{sortedResults.length ? <div className="parent-list">{sortedResults.slice(0, 12).map((row) => <div className="parent-result" key={row.id}><div><strong>{row.examTitle || row.title || 'امتحان'}</strong><small>{dateLabel(row.submittedAt || row.createdAt)}</small></div><b className={percentOf(row) >= 60 ? 'good' : 'weak'}>{percentOf(row)}%</b></div>)}</div> : <p className="parent-muted">لا توجد نتائج امتحانات بعد.</p>}</article>
      <article className="parent-card"><div className="parent-card-title"><h3>الحضور والغياب</h3><span>{attendance.length} حصة</span></div>{sortedAttendance.length ? <div className="parent-list">{sortedAttendance.slice(0, 14).map((row) => <div className="parent-attendance" key={row.id}><div><strong>{row.sessionTitle || row.lessonTitle || 'حصة دراسية'}</strong><small>{dateLabel(row.date || row.createdAt)}</small></div><b className={row.status}>{row.status === 'absent' ? 'غائب' : row.status === 'late' ? 'متأخر' : 'حاضر'}</b></div>)}</div> : <p className="parent-muted">لم تُسجل بيانات حضور لهذا الطالب بعد.</p>}</article></section>
    </>}
  </main>;
}
