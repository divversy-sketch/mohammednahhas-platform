import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { BookOpen, Layers, PlayCircle, FileText, ClipboardList, Lock, PlusCircle, Trash2, Save, Unlock, Key, Users, Crown } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';
import { platformNotify, platformConfirm } from '@shared/core/platformShared.jsx';
import EmptyState from '@shared/ui/EmptyState.jsx';
import PageHeader from '@shared/ui/PageHeader.jsx';
import { defaultImagePlacement, normalizeImagePlacement } from '@shared/utils/imagePlacement.js';
import { ImgInput } from '../components/ImgInput.jsx';
import { ytId, pct, clean, randomCode, userLabel, userIdOf } from '../utils/courseAdminUtils.js';

export function AdminCoursesManager({ users = [], exams = [], adminUser }) {
  const [courses, setCourses] = useState([]);
  const [mods, setMods] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [overs, setOvers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [course, setCourse] = useState('');
  const [mod, setMod] = useState('');
  const emptyCourseForm = { title: '', description: '', price: '', teacher: 'مستر النحاس', coverImage: '', coverImagePlacement: defaultImagePlacement, grade: '3sec', isPublished: false, unlockMode: 'sequential', visibleFrom: '', visibleUntil: '', defaultAccessDays: '', permanentAccess: true };
  const [cf, setCf] = useState(emptyCourseForm);
  const [mf, setMf] = useState({ title: '', order: 1 });
  const [lf, setLf] = useState({ title: '', videoUrl: '', pdfUrl: '', pdfImage: '', examUrl: '', examId: '', examImage: '', lessonImage: '', lessonImagePlacement: defaultImagePlacement, pdfImagePlacement: defaultImagePlacement, examImagePlacement: defaultImagePlacement, icon: '📘', order: 1, isFree: false, unlockAt: '', requiredPreviousLessonId: '', examRequiresWatchPercent: 75, nextLessonRequiresExamScore: 60 });
  const [of, setOf] = useState({ userId: '', lessonId: '', reason: '' });
  const [manual, setManual] = useState({ userId: '', courseId: '', expiresInDays: '', permanent: true });
  const [codeForm, setCodeForm] = useState({ courseId: '', count: 1, expiresInDays: '', permanent: true });
  const [editingCourseId, setEditingCourseId] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'courses'), orderBy('title')), (s) => setCourses(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setCourses([])), []);
  useEffect(() => (course ? onSnapshot(query(collection(db, 'courses', course, 'modules'), orderBy('order')), (s) => setMods(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setMods([])) : setMods([])), [course]);
  useEffect(() => (course && mod ? onSnapshot(query(collection(db, 'courses', course, 'modules', mod, 'lessons'), orderBy('order')), (s) => setLessons(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setLessons([])) : setLessons([])), [course, mod]);
  useEffect(() => onSnapshot(query(collection(db, 'lessonUnlockOverrides'), limit(300)), (s) => setOvers(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setOvers([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'courseAccessCodes'), orderBy('createdAt')), (s) => setCodes(s.docs.map((d) => ({ id: d.id, ...d.data() })).reverse()), () => setCodes([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'enrollments'), limit(500)), (s) => setEnrollments(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setEnrollments([])), []);

  const resetCourseForm = () => { setEditingCourseId(''); setCf(emptyCourseForm); };
  const editCourse = (c) => {
    setEditingCourseId(c.id);
    setCf({ title: c.title || '', description: c.description || '', price: c.price ?? '', teacher: c.teacher || 'مستر النحاس', coverImage: c.coverImage || '', coverImagePlacement: normalizeImagePlacement(c.coverImagePlacement), grade: c.grade || '3sec', isPublished: !!c.isPublished, unlockMode: c.unlockMode || 'sequential', visibleFrom: c.visibleFrom || '', visibleUntil: c.visibleUntil || '', defaultAccessDays: c.defaultAccessDays ?? '', permanentAccess: c.permanentAccess !== false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const deleteManyRefs = async (refs) => {
    for (let i = 0; i < refs.length; i += 350) {
      const { writeBatch } = await import('firebase/firestore');
      const b = writeBatch(db);
      refs.slice(i, i + 350).forEach((r) => b.delete(r));
      await b.commit();
    }
  };
  const deleteCourseDeep = async (courseId, silent = false) => {
    if (!courseId) return;
    if (!silent && !platformConfirm('سيتم حذف الكورس بكل وحداته ودروسه وأكواد فتحه واشتراكاته. هل أنت متأكد؟')) return;
    const refs = [];
    const modSnap = await getDocs(collection(db, 'courses', courseId, 'modules'));
    for (const m of modSnap.docs) {
      const lessonSnap = await getDocs(collection(db, 'courses', courseId, 'modules', m.id, 'lessons'));
      lessonSnap.docs.forEach((l) => refs.push(doc(db, 'courses', courseId, 'modules', m.id, 'lessons', l.id)));
      refs.push(doc(db, 'courses', courseId, 'modules', m.id));
    }
    for (const name of ['enrollments', 'courseAccessCodes', 'lessonUnlockOverrides', 'lessonProgress']) {
      const snap = await getDocs(query(collection(db, name), where('courseId', '==', courseId)));
      snap.docs.forEach((d) => refs.push(doc(db, name, d.id)));
    }
    refs.push(doc(db, 'courses', courseId));
    await deleteManyRefs(refs);
    if (editingCourseId === courseId) resetCourseForm();
    if (!silent) platformNotify('تم حذف الكورس بالكامل.', 'success');
  };
  const deleteAllCourses = async () => {
    if (!platformConfirm('تحذير: سيتم حذف كل الكورسات والوحدات والدروس والأكواد والاشتراكات الخاصة بها. هل أنت متأكد؟')) return;
    for (const c of courses) await deleteCourseDeep(c.id, true);
    platformNotify('تم حذف كل الكورسات.', 'success');
  };
  const saveCourse = async () => {
    if (!cf.title.trim()) return platformNotify('اكتب اسم الكورس', 'error');
    const payload = { ...cf, coverImagePlacement: normalizeImagePlacement(cf.coverImagePlacement), price: Number(cf.price || 0), defaultAccessDays: cf.defaultAccessDays === '' ? '' : Number(cf.defaultAccessDays || 0), updatedAt: serverTimestamp() };
    if (editingCourseId) { await updateDoc(doc(db, 'courses', editingCourseId), payload); platformNotify('تم تعديل الكورس.', 'success'); }
    else { await addDoc(collection(db, 'courses'), { ...payload, createdAt: serverTimestamp() }); platformNotify('تم حفظ الكورس.', 'success'); }
    resetCourseForm();
  };
  const saveMod = async () => {
    if (!course || !mf.title.trim()) return platformNotify('اختار كورس واكتب الوحدة', 'error');
    await addDoc(collection(db, 'courses', course, 'modules'), { ...mf, order: Number(mf.order || 1), createdAt: serverTimestamp() });
    setMf({ title: '', order: mods.length + 2 });
  };
  const saveLesson = async () => {
    if (!course || !mod || !lf.title.trim()) return platformNotify('اختار كورس ووحدة واكتب الدرس', 'error');
    await addDoc(collection(db, 'courses', course, 'modules', mod, 'lessons'), {
      title: lf.title,
      videoUrl: lf.videoUrl,
      youtubeVideoId: ytId(lf.videoUrl),
      pdfUrl: lf.pdfUrl,
      examUrl: lf.examUrl,
      examId: lf.examId,
      lessonImage: lf.lessonImage,
      lessonImagePlacement: normalizeImagePlacement(lf.lessonImagePlacement),
      pdfImage: lf.pdfImage || '',
      pdfImagePlacement: normalizeImagePlacement(lf.pdfImagePlacement),
      examImage: lf.examImage || '',
      examImagePlacement: normalizeImagePlacement(lf.examImagePlacement),
      icon: lf.icon,
      order: Number(lf.order || 1),
      isFree: !!lf.isFree,
      unlockAt: lf.unlockAt || '',
      requiredPreviousLessonId: lf.requiredPreviousLessonId || '',
      unlockRules: { examRequiresWatchPercent: Number(lf.examRequiresWatchPercent || 75), nextLessonRequiresWatchPercent: 75, nextLessonRequiresExamScore: Number(lf.nextLessonRequiresExamScore || 60) },
      createdAt: serverTimestamp(),
    });
    setLf({ ...lf, title: '', videoUrl: '', pdfUrl: '', pdfImage: '', examUrl: '', examId: '', examImage: '', lessonImage: '', icon: '📘', order: lessons.length + 2 });
  };
  const saveOver = async () => {
    if (!course || !mod || !of.userId || !of.lessonId) return platformNotify('اختار الطالب والدرس', 'error');
    await setDoc(doc(db, 'lessonUnlockOverrides', `${of.userId}_${course}_${of.lessonId}`), { userId: of.userId, courseId: course, moduleId: mod, lessonId: of.lessonId, reason: of.reason || 'استثناء من الإدارة', active: true, allowedBy: adminUser?.email || 'admin', createdAt: serverTimestamp() }, { merge: true });
    setOf({ userId: '', lessonId: '', reason: '' });
  };
  const enrollStudent = async () => {
    const targetCourseId = manual.courseId || course;
    if (!manual.userId || !targetCourseId) return platformNotify('اختار الطالب والكورس', 'error');
    const days = manual.permanent ? 0 : Number(manual.expiresInDays || 0);
    const expiresAt = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
    await setDoc(doc(db, 'enrollments', `${manual.userId}_${targetCourseId}`), {
      userId: manual.userId,
      courseId: targetCourseId,
      status: 'active',
      paid: true,
      joinedAt: serverTimestamp(),
      progress: 0,
      openedBy: adminUser?.email || 'admin',
      method: 'manual',
      permanentAccess: !expiresAt,
      expiresAt,
    }, { merge: true });
    platformNotify('تم فتح الكورس للطالب', 'success');
  };
  const generateCodes = async () => {
    const targetCourseId = codeForm.courseId || course;
    if (!targetCourseId) return platformNotify('اختار الكورس', 'error');
    const count = Math.max(1, Math.min(50, Number(codeForm.count || 1)));
    for (let i = 0; i < count; i += 1) {
      const code = randomCode();
      const selectedCourse = courses.find((c) => c.id === targetCourseId);
      const days = codeForm.permanent ? 0 : Number(codeForm.expiresInDays || selectedCourse?.defaultAccessDays || 0);
      const expiresAt = days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
      await setDoc(doc(db, 'courseAccessCodes', code), { code, courseId: targetCourseId, isUsed: false, usedBy: null, usedAt: null, permanentAccess: !expiresAt, expiresAt, validityDays: days || null, createdBy: adminUser?.email || 'admin', createdAt: serverTimestamp() });
    }
    platformNotify(`تم توليد ${count} كود`, 'success');
  };


  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-3xl p-5 border">
        <h2 className="text-2xl font-black flex gap-2"><BookOpen className="text-amber-600" /> إدارة الكورسات التعليمية</h2>
        
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl p-5 border space-y-3">
          <h3 className="font-black flex gap-2"><PlusCircle /> {editingCourseId ? 'تعديل كورس' : 'إنشاء كورس'}</h3>
          <input className="w-full p-3 rounded-xl border" placeholder="اسم الكورس" value={cf.title} onChange={(e) => setCf({ ...cf, title: e.target.value })} />
          <textarea className="w-full p-3 rounded-xl border" placeholder="وصف وتفاصيل الكورس" value={cf.description} onChange={(e) => setCf({ ...cf, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="p-3 rounded-xl border" placeholder="السعر" value={cf.price} onChange={(e) => setCf({ ...cf, price: e.target.value })} />
            <input className="p-3 rounded-xl border" placeholder="المدرس" value={cf.teacher} onChange={(e) => setCf({ ...cf, teacher: e.target.value })} />
          </div>
          <select className="w-full p-3 rounded-xl border" value={cf.grade} onChange={(e) => setCf({ ...cf, grade: e.target.value })}><GradeOptions /></select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border rounded-2xl p-3">
            <label className="text-xs font-black text-slate-600">يظهر من<input type="datetime-local" className="mt-1 w-full p-3 rounded-xl border" value={cf.visibleFrom || ''} onChange={(e) => setCf({ ...cf, visibleFrom: e.target.value })} /></label>
            <label className="text-xs font-black text-slate-600">يختفي بعد<input type="datetime-local" className="mt-1 w-full p-3 rounded-xl border" value={cf.visibleUntil || ''} onChange={(e) => setCf({ ...cf, visibleUntil: e.target.value })} /></label>
            <label className="md:col-span-2 font-bold flex gap-2 items-center"><input type="checkbox" checked={cf.permanentAccess !== false} onChange={(e) => setCf({ ...cf, permanentAccess: e.target.checked })} /> فتح الكورس دائم عند التفعيل</label>
            {cf.permanentAccess === false && <input className="md:col-span-2 p-3 rounded-xl border" placeholder="مدة فتح الكورس الافتراضية بالأيام" value={cf.defaultAccessDays || ''} onChange={(e) => setCf({ ...cf, defaultAccessDays: e.target.value })} />}
          </div>
          <ImgInput label="صورة الكورس الكبيرة" value={cf.coverImage} onChange={(v) => setCf({ ...cf, coverImage: v })} placement={cf.coverImagePlacement} onPlacementChange={(v) => setCf({ ...cf, coverImagePlacement: v })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="p-3 rounded-xl border" value={cf.unlockMode} onChange={(e) => setCf({ ...cf, unlockMode: e.target.value })}>
              <option value="sequential">ترتيبي بشروط</option>
              <option value="all">كل الدروس مفتوحة</option>
              <option value="date">حسب التاريخ</option>
            </select>
            <label className="font-bold flex gap-2 items-center"><input type="checkbox" checked={cf.isPublished} onChange={(e) => setCf({ ...cf, isPublished: e.target.checked })} /> منشور في الرئيسية</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveCourse} className="bg-amber-600 text-white px-5 py-3 rounded-xl font-black flex gap-2"><Save /> {editingCourseId ? 'حفظ التعديلات' : 'حفظ الكورس'}</button>
            {editingCourseId && <button onClick={resetCourseForm} className="bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-black">إلغاء التعديل</button>}
            {courses.length > 0 && <button onClick={deleteAllCourses} className="bg-red-600 text-white px-5 py-3 rounded-xl font-black flex gap-2"><Trash2 /> حذف كل الكورسات</button>}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-5 border space-y-3">
          <h3 className="font-black flex gap-2"><Layers /> الوحدات والدروس</h3>
          <select className="w-full p-3 rounded-xl border" value={course} onChange={(e) => { setCourse(e.target.value); setMod(''); }}>
            <option value="">اختار كورس</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title} - {getGradeLabel(c.grade)}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input className="col-span-2 p-3 rounded-xl border" placeholder="عنوان الوحدة" value={mf.title} onChange={(e) => setMf({ ...mf, title: e.target.value })} />
            <input className="p-3 rounded-xl border" placeholder="ترتيب" value={mf.order} onChange={(e) => setMf({ ...mf, order: e.target.value })} />
          </div>
          <button onClick={saveMod} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-black">إضافة وحدة</button>
          <select className="w-full p-3 rounded-xl border" value={mod} onChange={(e) => setMod(e.target.value)}>
            <option value="">اختار وحدة</option>
            {mods.map((m) => <option key={m.id} value={m.id}>{m.order} - {m.title}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className="p-3 rounded-xl border" placeholder="عنوان الدرس" value={lf.title} onChange={(e) => setLf({ ...lf, title: e.target.value })} />
            <input className="p-3 rounded-xl border" placeholder="أيقونة" value={lf.icon} onChange={(e) => setLf({ ...lf, icon: e.target.value })} />
          </div>
          <ImgInput label="صورة الفيديو داخل الكورس / غلاف الدرس" value={lf.lessonImage} onChange={(v) => setLf({ ...lf, lessonImage: v })} placement={lf.lessonImagePlacement} onPlacementChange={(v) => setLf({ ...lf, lessonImagePlacement: v })} />
          <input className="w-full p-3 rounded-xl border" placeholder="رابط يوتيوب" value={lf.videoUrl} onChange={(e) => setLf({ ...lf, videoUrl: e.target.value })} />
          <ImgInput label="ملف PDF" kind="pdf" value={lf.pdfUrl} onChange={(v) => setLf({ ...lf, pdfUrl: v })} />
          <ImgInput label="صورة ملف PDF / غلافه" value={lf.pdfImage} onChange={(v) => setLf({ ...lf, pdfImage: v })} placement={lf.pdfImagePlacement} onPlacementChange={(v) => setLf({ ...lf, pdfImagePlacement: v })} />
          <ImgInput label="صورة الامتحان داخل الدرس" value={lf.examImage} onChange={(v) => setLf({ ...lf, examImage: v })} placement={lf.examImagePlacement} onPlacementChange={(v) => setLf({ ...lf, examImagePlacement: v })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="p-3 rounded-xl border" placeholder="رابط امتحان خارجي" value={lf.examUrl} onChange={(e) => setLf({ ...lf, examUrl: e.target.value })} />
            <select className="p-3 rounded-xl border" value={lf.examId} onChange={(e) => setLf({ ...lf, examId: e.target.value })}>
              <option value="">أو امتحان داخلي</option>
              {exams.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="p-3 rounded-xl border" placeholder="ترتيب" value={lf.order} onChange={(e) => setLf({ ...lf, order: e.target.value })} />
            <input className="p-3 rounded-xl border" placeholder="فتح الامتحان %" value={lf.examRequiresWatchPercent} onChange={(e) => setLf({ ...lf, examRequiresWatchPercent: e.target.value })} />
            <input className="p-3 rounded-xl border" type="datetime-local" value={lf.unlockAt} onChange={(e) => setLf({ ...lf, unlockAt: e.target.value })} />
            <label className="font-bold flex gap-2 items-center"><input type="checkbox" checked={lf.isFree} onChange={(e) => setLf({ ...lf, isFree: e.target.checked })} /> مجاني</label>
          </div>
          <select className="w-full p-3 rounded-xl border" value={lf.requiredPreviousLessonId} onChange={(e) => setLf({ ...lf, requiredPreviousLessonId: e.target.value })}>
            <option value="">لا يوجد درس سابق</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.order} - {l.title}</option>)}
          </select>
          <button onClick={saveLesson} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black flex gap-2"><Save /> حفظ الدرس</button>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl p-5 border space-y-3">
          <h3 className="font-black flex gap-2"><Users /> فتح كورس لطالب يدويًا</h3>
          <select className="w-full p-3 rounded-xl border" value={manual.courseId || course} onChange={(e) => setManual({ ...manual, courseId: e.target.value })}>
            <option value="">اختار كورس</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select className="w-full p-3 rounded-xl border" value={manual.userId} onChange={(e) => setManual({ ...manual, userId: e.target.value })}>
            <option value="">اختار طالب</option>
            {users.map((u) => <option key={userIdOf(u)} value={userIdOf(u)}>{userLabel(u)}</option>)}
          </select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
            <label className="font-bold flex gap-2 items-center"><input type="checkbox" checked={manual.permanent !== false} onChange={(e) => setManual({ ...manual, permanent: e.target.checked })} /> فتح دائم للطالب</label>
            {manual.permanent === false && <input className="p-3 rounded-xl border" placeholder="الصلاحية بالأيام" value={manual.expiresInDays || ''} onChange={(e) => setManual({ ...manual, expiresInDays: e.target.value })} />}
          </div>
          <button onClick={enrollStudent} className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black flex gap-2"><Unlock /> فتح الكورس للطالب</button>
          <div className="space-y-2 max-h-48 overflow-auto">
            {enrollments.slice(0, 8).map((e) => <div key={e.id} className="bg-emerald-50 rounded-2xl p-3 text-sm font-bold">{userLabel(users.find((u) => userIdOf(u) === e.userId))} — {courses.find((c) => c.id === e.courseId)?.title || e.courseId}</div>)}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-5 border space-y-3">
          <h3 className="font-black flex gap-2"><Key /> أكواد فتح الكورسات</h3>
          <select className="w-full p-3 rounded-xl border" value={codeForm.courseId || course} onChange={(e) => setCodeForm({ ...codeForm, courseId: e.target.value })}>
            <option value="">اختار كورس</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <input className="w-full p-3 rounded-xl border" type="number" min="1" max="50" placeholder="عدد الأكواد" value={codeForm.count} onChange={(e) => setCodeForm({ ...codeForm, count: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <label className="font-bold flex gap-2 items-center"><input type="checkbox" checked={codeForm.permanent !== false} onChange={(e) => setCodeForm({ ...codeForm, permanent: e.target.checked })} /> الكود يفتح دائم</label>
            {codeForm.permanent === false && <input className="p-3 rounded-xl border" placeholder="صلاحية فتح الكورس بالأيام" value={codeForm.expiresInDays || ''} onChange={(e) => setCodeForm({ ...codeForm, expiresInDays: e.target.value })} />}
          </div>
          <button onClick={generateCodes} className="bg-amber-600 text-white px-5 py-3 rounded-xl font-black flex gap-2"><Key /> توليد الأكواد</button>
          <div className="space-y-2 max-h-56 overflow-auto">
            {codes.slice(0, 12).map((c) => <div key={c.id} className="bg-slate-50 rounded-2xl p-3 flex justify-between items-center gap-2"><span className="font-black text-sm tracking-wider">{c.code}</span><span className={`text-xs px-2 py-1 rounded-full font-black ${c.isUsed ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{c.isUsed ? 'مستخدم' : 'متاح'}</span></div>)}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-3xl p-5 border space-y-3">
        <h3 className="font-black flex gap-2"><Unlock /> استثناء فتح درس لطالب</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <select className="p-3 rounded-xl border" value={of.userId} onChange={(e) => setOf({ ...of, userId: e.target.value })}>
            <option value="">الطالب</option>
            {users.map((u) => <option key={userIdOf(u)} value={userIdOf(u)}>{userLabel(u)}</option>)}
          </select>
          <select className="p-3 rounded-xl border" value={of.lessonId} onChange={(e) => setOf({ ...of, lessonId: e.target.value })}>
            <option value="">الدرس</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <input className="p-3 rounded-xl border" placeholder="السبب" value={of.reason} onChange={(e) => setOf({ ...of, reason: e.target.value })} />
          <button onClick={saveOver} className="bg-emerald-600 text-white rounded-xl font-black">السماح</button>
        </div>
        {overs.filter((o) => !course || o.courseId === course).slice(0, 8).map((o) => <div key={o.id} className="bg-emerald-50 rounded-2xl p-3 font-bold flex justify-between"><span>{userLabel(users.find((u) => userIdOf(u) === o.userId))} — {o.reason}</span><button onClick={() => deleteDoc(doc(db, 'lessonUnlockOverrides', o.id))} className="text-red-600"><Trash2 size={16} /></button></div>)}
      </section>

      <section className="bg-white rounded-3xl p-5 border">
        <h3 className="font-black mb-3">الكورسات الحالية</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {courses.map((c) => <div key={c.id} className="border rounded-2xl p-3"><div className="h-36 w-full rounded-xl bg-slate-100 overflow-hidden"><img src={c.coverImage || 'https://placehold.co/900x420?text=Course'} className="w-full h-full" style={imagePlacementStyle(c.coverImagePlacement)} /></div><p className="font-black mt-2">{c.title}</p><p className="text-xs text-slate-500">{c.isPublished ? 'منشور' : 'غير منشور'} • {getGradeLabel(c.grade || 'كل المراحل')} • {c.unlockMode}</p><p className="text-[11px] text-slate-400 mt-1">{c.visibleFrom ? `من ${new Date(c.visibleFrom).toLocaleString('ar-EG')}` : 'بدون بداية'} — {c.visibleUntil ? `حتى ${new Date(c.visibleUntil).toLocaleString('ar-EG')}` : 'بدون اختفاء'}</p><div className="flex flex-wrap gap-2 mt-2"><button onClick={() => updateDoc(doc(db, 'courses', c.id), { isPublished: !c.isPublished })} className="text-xs bg-slate-100 px-3 py-1 rounded-lg font-bold">{c.isPublished ? 'إخفاء' : 'نشر'}</button><button onClick={() => editCourse(c)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold">تعديل</button><button onClick={() => deleteCourseDeep(c.id)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-lg font-bold">حذف</button></div></div>)}
        </div>
      </section>
    </div>
  );
}
