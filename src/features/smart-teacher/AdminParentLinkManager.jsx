import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { getGradeLabel } from '@shared/constants/grades';
import { platformNotify } from '@shared/core/platformShared.jsx';
import './smart-teacher.css';

const normalizePhone = (value = '') => String(value).replace(/\D/g, '').slice(-11);

export default function AdminParentLinkManager() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(query(collection(db, 'users'), where('role', '==', 'student')), (snap) => {
    setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, () => setStudents([])), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => [student.name, student.displayName, student.email, student.phone, student.parentPhone]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [students, search]);

  const selected = students.find((student) => student.id === selectedStudent);

  const linkParent = async () => {
    const phone = normalizePhone(parentPhone);
    if (!selected || phone.length !== 11) return platformNotify('اختر الطالب واكتب رقم ولي أمر صحيح', 'error');
    setSaving(true);
    try {
      const ref = doc(db, 'parent_links', phone);
      const current = students.filter((student) => normalizePhone(student.parentPhone) === phone).map((student) => student.id);
      const studentIds = Array.from(new Set([...current, selected.id]));
      await setDoc(ref, {
        phone,
        parentName: parentName.trim() || selected.parentName || 'ولي الأمر',
        studentIds,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await updateDoc(doc(db, 'users', selected.id), {
        parentPhone: phone,
        parentName: parentName.trim() || selected.parentName || 'ولي الأمر',
        updatedAt: serverTimestamp(),
      });
      platformNotify('تم ربط ولي الأمر بالطالب بنجاح');
      setParentName('');
      setParentPhone('');
      setSelectedStudent('');
    } catch (error) {
      platformNotify(error.message || 'تعذر الربط', 'error');
    } finally {
      setSaving(false);
    }
  };

  return <div className="st-admin" dir="rtl">
    <div className="st-admin-hero"><div className="st-logo">و<span>✦</span></div><div><small>منصة النحاس</small><h2>بوابة ولي الأمر</h2><p>اربط ولي الأمر بابنه من لوحة الإدارة في خطوة واحدة، بدون UID وبدون دخول إلى Firebase.</p></div></div>
    <section className="st-card">
      <h3>ربط ولي الأمر بالطالب</h3>
      <p className="st-muted">ابحث عن الطالب، اختره، ثم اكتب اسم ولي الأمر ورقم هاتفه.</p>
      <label className="st-parent-search">بحث سريع<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اسم الطالب أو الهاتف أو البريد" /></label>
      <div className="st-grid">
        <label>الطالب<select value={selectedStudent} onChange={(e) => {
          const id = e.target.value;
          setSelectedStudent(id);
          const student = students.find((item) => item.id === id);
          setParentName(student?.parentName || '');
          setParentPhone(student?.parentPhone || '');
        }}><option value="">اختر الطالب</option>{filtered.map((student) => <option key={student.id} value={student.id}>{student.name || student.displayName || student.email} — {getGradeLabel(student.grade)}</option>)}</select></label>
        <label>اسم ولي الأمر<input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="اسم ولي الأمر" /></label>
        <label>رقم الموبايل<input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="01xxxxxxxxx" /></label>
      </div>
      {selected && <div className="st-parent-preview"><b>{selected.name || selected.displayName || selected.email}</b><span>{getGradeLabel(selected.grade)}</span><small>{selected.parentPhone ? `مرتبط حاليًا بـ ${selected.parentPhone}` : 'غير مرتبط بولي أمر بعد'}</small></div>}
      <button className="st-publish" disabled={saving} onClick={linkParent}>{saving ? 'جاري الربط...' : 'ربط ولي الأمر بالطالب'}</button>
    </section>
  </div>;
}
