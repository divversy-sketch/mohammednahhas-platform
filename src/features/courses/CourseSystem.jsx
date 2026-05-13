import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BookOpen, Layers, PlayCircle, FileText, ClipboardList, Lock, UploadCloud, PlusCircle, Trash2, Save, Unlock, Key, Users, Crown } from '../../shared/icons/lucide-shim.jsx';
import { uploadToCloudinary } from '../../services/cloudinaryUpload';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades.jsx';
import { platformNotify, platformConfirm } from '../../shared/core/platformShared.jsx';
import EmptyState from '../../shared/ui/EmptyState.jsx';
import PageHeader from '../../shared/ui/PageHeader.jsx';

const uploadMedia = async (file, kind = 'image') => {
  if (!file) return '';
  const res = await uploadToCloudinary(file, {
    kind,
    folder: kind === 'pdf' ? 'nahhas-platform/pdfs' : 'nahhas-platform/images',
  });
  return res.url;
};

const ytId = (url) =>
  String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([^&?/]+)/)?.[1] || '';

const pct = (n) => Math.max(0, Math.min(100, Math.floor(Number(n) || 0)));
const clean = (v) => String(v || '').trim();
const randomCode = () => `NH-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const userLabel = (u) => u?.name || u?.displayName || u?.email || u?.id || 'طالب';
const userIdOf = (u) => u?.id || u?.uid || u?.userId || '';

function ImgInput({ label, value, onChange, kind = 'image' }) {
  const [busy, setBusy] = useState(false);
  const isPdf = kind === 'pdf';
  return (
    <div className="space-y-2">
      <label className="text-sm font-black flex gap-2">
        <UploadCloud size={16} /> {label}
      </label>
      <input
        className="w-full p-3 rounded-xl border"
        placeholder={isPdf ? 'رابط PDF أو ارفع ملف' : 'رابط الصورة أو ارفع صورة'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <label className="inline-flex gap-2 px-4 py-2 rounded-xl bg-slate-100 font-black text-xs cursor-pointer">
        <UploadCloud size={16} />
        {busy ? 'جاري الرفع...' : isPdf ? 'رفع PDF على Cloudinary' : 'رفع صورة على Cloudinary'}
        <input
          type="file"
          accept={isPdf ? 'application/pdf' : 'image/*'}
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            try {
              setBusy(true);
              onChange(await uploadMedia(e.target.files?.[0], kind));
            } catch (err) {
              platformNotify(err.message || 'حدث خطأ أثناء الرفع', 'error');
            } finally {
              setBusy(false);
              e.target.value = '';
            }
          }}
        />
      </label>
      {busy && <p className="text-xs text-amber-700">جاري رفع الملف على Cloudinary...</p>}
      {value &&
        (isPdf ? (
          <a href={value} target="_blank" rel="noreferrer" className="block text-blue-700 font-black underline">
            فتح ملف PDF
          </a>
        ) : (
          <img src={value} className="h-28 w-full object-cover rounded-2xl border" />
        ))}
    </div>
  );
}

export function YouTubeLessonPlayer({ videoUrl, savedProgress, onProgress }) {
  const id = useMemo(() => `yt-${Math.random().toString(36).slice(2)}`, []);
  const player = useRef(null);
  const timer = useRef(null);
  const last = useRef({ p: 0, t: 0 });
  const max = useRef(Number(savedProgress?.maxWatchedSeconds || savedProgress?.watchTime || 0));
  const [state, setState] = useState({ p: pct(savedProgress?.watchPercent), anti: false });
  const vid = ytId(videoUrl);

  useEffect(() => {
    if (!vid) return undefined;
    let off = false;
    const load = () =>
      new Promise((resolve) => {
        if (window.YT?.Player) return resolve();
        const old = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          old?.();
          resolve();
        };
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          const s = document.createElement('script');
          s.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(s);
        }
      });

    const tick = () => {
      const p = player.current;
      if (!p?.getCurrentTime) return;
      const cur = Math.floor(p.getCurrentTime() || 0);
      const dur = Math.floor(p.getDuration() || 0);
      if (!dur) return;
      if (cur > Math.max(max.current + 8, 12)) {
        p.seekTo(max.current, true);
        setState((x) => ({ ...x, anti: true }));
        return;
      }
      max.current = Math.max(max.current, cur);
      const per = pct((max.current / dur) * 100);
      setState({ p: per, anti: false });
      const now = Date.now();
      if (per >= last.current.p + 3 || now - last.current.t > 12000 || per >= 75) {
        last.current = { p: per, t: now };
        onProgress?.({
          watchTime: max.current,
          maxWatchedSeconds: max.current,
          videoDuration: dur,
          watchPercent: per,
          examUnlocked: per >= 75,
        });
      }
    };

    load().then(() => {
      if (off) return;
      player.current = new window.YT.Player(id, {
        videoId: vid,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1 },
        events: {
          onReady: tick,
          onStateChange: (e) => {
            clearInterval(timer.current);
            if (e.data === window.YT.PlayerState.PLAYING) timer.current = setInterval(tick, 2500);
            else tick();
          },
        },
      });
    });

    return () => {
      off = true;
      clearInterval(timer.current);
      try {
        player.current?.destroy?.();
      } catch {}
    };
  }, [vid]);

  if (!vid) return <div className="bg-red-50 text-red-700 p-4 rounded-2xl font-bold">رابط يوتيوب غير صحيح.</div>;

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden">
        <div id={id} className="w-full h-full" />
      </div>
      <div className="bg-white rounded-2xl p-4 border">
        <div className="flex justify-between font-black mb-2">
          <span>نسبة المشاهدة</span>
          <span className={state.p >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{state.p}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${state.p}%` }} />
        </div>
        {state.anti && <p className="text-red-600 text-sm font-black mt-2">تم منع التقديم السريع. شاهد الفيديو بالترتيب.</p>}
        <p className="text-sm font-bold mt-2">{state.p >= 75 ? '✅ الامتحان متاح الآن' : `باقي لك ${75 - state.p}% لفتح الامتحان`}</p>
      </div>
    </div>
  );
}

export function AdminCoursesManager({ users = [], exams = [], adminUser }) {
  const [courses, setCourses] = useState([]);
  const [mods, setMods] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [overs, setOvers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [course, setCourse] = useState('');
  const [mod, setMod] = useState('');
  const emptyCourseForm = { title: '', description: '', price: '', teacher: 'مستر النحاس', coverImage: '', grade: '3sec', isPublished: false, unlockMode: 'sequential', visibleFrom: '', visibleUntil: '', defaultAccessDays: '', permanentAccess: true };
  const [cf, setCf] = useState(emptyCourseForm);
  const [mf, setMf] = useState({ title: '', order: 1 });
  const [lf, setLf] = useState({ title: '', videoUrl: '', pdfUrl: '', examUrl: '', examId: '', lessonImage: '', icon: '📘', order: 1, isFree: false, unlockAt: '', requiredPreviousLessonId: '', examRequiresWatchPercent: 75, nextLessonRequiresExamScore: 60 });
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
    setCf({ title: c.title || '', description: c.description || '', price: c.price ?? '', teacher: c.teacher || 'مستر النحاس', coverImage: c.coverImage || '', grade: c.grade || '3sec', isPublished: !!c.isPublished, unlockMode: c.unlockMode || 'sequential', visibleFrom: c.visibleFrom || '', visibleUntil: c.visibleUntil || '', defaultAccessDays: c.defaultAccessDays ?? '', permanentAccess: c.permanentAccess !== false });
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
    const payload = { ...cf, price: Number(cf.price || 0), defaultAccessDays: cf.defaultAccessDays === '' ? '' : Number(cf.defaultAccessDays || 0), updatedAt: serverTimestamp() };
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
      icon: lf.icon,
      order: Number(lf.order || 1),
      isFree: !!lf.isFree,
      unlockAt: lf.unlockAt || '',
      requiredPreviousLessonId: lf.requiredPreviousLessonId || '',
      unlockRules: { examRequiresWatchPercent: Number(lf.examRequiresWatchPercent || 75), nextLessonRequiresWatchPercent: 75, nextLessonRequiresExamScore: Number(lf.nextLessonRequiresExamScore || 60) },
      createdAt: serverTimestamp(),
    });
    setLf({ ...lf, title: '', videoUrl: '', pdfUrl: '', examUrl: '', examId: '', lessonImage: '', icon: '📘', order: lessons.length + 2 });
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
          <ImgInput label="صورة الكورس الكبيرة" value={cf.coverImage} onChange={(v) => setCf({ ...cf, coverImage: v })} />
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
          <ImgInput label="صورة الدرس" value={lf.lessonImage} onChange={(v) => setLf({ ...lf, lessonImage: v })} />
          <input className="w-full p-3 rounded-xl border" placeholder="رابط يوتيوب" value={lf.videoUrl} onChange={(e) => setLf({ ...lf, videoUrl: e.target.value })} />
          <ImgInput label="ملف PDF" kind="pdf" value={lf.pdfUrl} onChange={(v) => setLf({ ...lf, pdfUrl: v })} />
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
          {courses.map((c) => <div key={c.id} className="border rounded-2xl p-3"><img src={c.coverImage || 'https://placehold.co/900x420?text=Course'} className="h-36 w-full rounded-xl object-cover" /><p className="font-black mt-2">{c.title}</p><p className="text-xs text-slate-500">{c.isPublished ? 'منشور' : 'غير منشور'} • {getGradeLabel(c.grade || 'كل المراحل')} • {c.unlockMode}</p><p className="text-[11px] text-slate-400 mt-1">{c.visibleFrom ? `من ${new Date(c.visibleFrom).toLocaleString('ar-EG')}` : 'بدون بداية'} — {c.visibleUntil ? `حتى ${new Date(c.visibleUntil).toLocaleString('ar-EG')}` : 'بدون اختفاء'}</p><div className="flex flex-wrap gap-2 mt-2"><button onClick={() => updateDoc(doc(db, 'courses', c.id), { isPublished: !c.isPublished })} className="text-xs bg-slate-100 px-3 py-1 rounded-lg font-bold">{c.isPublished ? 'إخفاء' : 'نشر'}</button><button onClick={() => editCourse(c)} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold">تعديل</button><button onClick={() => deleteCourseDeep(c.id)} className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-lg font-bold">حذف</button></div></div>)}
        </div>
      </section>
    </div>
  );
}

export function StudentCoursesHub({ user, userData, exams = [], onStartExam }) {
  const [courses, setCourses] = useState([]);
  const [enroll, setEnroll] = useState([]);
  const [prog, setProg] = useState([]);
  const [exr, setExr] = useState([]);
  const [overs, setOvers] = useState([]);
  const [course, setCourse] = useState(null);
  const [mods, setMods] = useState([]);
  const [lbm, setLbm] = useState({});
  const [lesson, setLesson] = useState(null);
  const [tab, setTab] = useState('video');
  const [accessCode, setAccessCode] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'courses'), where('isPublished', '==', true)), (s) => {
    const g = userData?.grade || '';
    const now = new Date();
    setCourses(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => {
      const gradeOk = !c.grade || c.grade === g;
      const startOk = !c.visibleFrom || new Date(c.visibleFrom) <= now;
      const endOk = !c.visibleUntil || new Date(c.visibleUntil) >= now;
      return gradeOk && startOk && endOk;
    }));
  }, () => setCourses([])), [userData?.grade]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = [
      onSnapshot(query(collection(db, 'enrollments'), where('userId', '==', user.uid)), (s) => setEnroll(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setEnroll([])),
      onSnapshot(query(collection(db, 'lessonProgress'), where('userId', '==', user.uid)), (s) => setProg(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setProg([])),
      onSnapshot(query(collection(db, 'examResults'), where('userId', '==', user.uid)), (s) => setExr(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setExr([])),
      onSnapshot(query(collection(db, 'lessonUnlockOverrides'), where('userId', '==', user.uid), where('active', '==', true)), (s) => setOvers(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setOvers([])),
    ];
    return () => unsub.forEach((u) => u());
  }, [user?.uid]);

  useEffect(() => {
    if (!course?.id) { setMods([]); setLbm({}); return undefined; }
    return onSnapshot(query(collection(db, 'courses', course.id, 'modules'), orderBy('order')), async (s) => {
      const ms = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMods(ms);
      const pairs = await Promise.all(ms.map(async (m) => {
        const x = await getDocs(query(collection(db, 'courses', course.id, 'modules', m.id, 'lessons'), orderBy('order')));
        return [m.id, x.docs.map((d) => ({ id: d.id, moduleId: m.id, ...d.data() }))];
      }));
      setLbm(Object.fromEntries(pairs));
    }, () => { setMods([]); setLbm({}); });
  }, [course?.id]);

  const isEnrolled = (c) => Number(c.price || 0) === 0 || enroll.some((e) => e.courseId === c.id && e.status !== 'blocked' && (e.paid || e.status === 'active') && (!e.expiresAt || new Date(e.expiresAt) >= new Date()));
  const courseProgress = (c) => enroll.find((e) => e.courseId === c.id)?.progress || 0;
  const pr = (id) => prog.find((p) => p.courseId === course?.id && p.lessonId === id) || {};
  const er = (id) => exr.find((r) => r.courseId === course?.id && r.lessonId === id) || {};
  const over = (id) => overs.some((o) => o.courseId === course?.id && o.lessonId === id && o.active !== false);
  const can = (l) => {
    if (l.isFree || course.unlockMode === 'all' || over(l.id)) return { ok: true, admin: over(l.id) };
    if (!isEnrolled(course)) return { ok: false, reason: 'الكورس يحتاج فتح من الإدارة أو كود' };
    if (course.unlockMode === 'date' && l.unlockAt && new Date(l.unlockAt) > new Date()) return { ok: false, reason: 'لم يحن موعد فتح الدرس' };
    if (!l.requiredPreviousLessonId) return { ok: true };
    const pp = pr(l.requiredPreviousLessonId);
    const ee = er(l.requiredPreviousLessonId);
    if (pct(pp.watchPercent) < Number(l.unlockRules?.nextLessonRequiresWatchPercent || 75)) return { ok: false, reason: 'شاهد 75% من الدرس السابق' };
    if (!(Number(ee.score || 0) >= Number(l.unlockRules?.nextLessonRequiresExamScore || 60) || ee.passed)) return { ok: false, reason: 'اجتاز امتحان الدرس السابق بنسبة 60%' };
    return { ok: true };
  };
  const saveP = (l, d) => setDoc(doc(db, 'lessonProgress', `${user.uid}_${course.id}_${l.id}`), { userId: user.uid, courseId: course.id, lessonId: l.id, ...d, updatedAt: serverTimestamp(), completed: d.watchPercent >= 95, completedAt: d.watchPercent >= 95 ? serverTimestamp() : null }, { merge: true });
  const openExam = (l) => {
    const needed = Number(l.unlockRules?.examRequiresWatchPercent || 75);
    if (pct(pr(l.id).watchPercent) < needed && !over(l.id)) return platformNotify(`الامتحان مغلق حتى مشاهدة ${needed}%. أنت شاهدت ${pct(pr(l.id).watchPercent)}%.`, 'error');
    if (l.examId && onStartExam) {
      const x = exams.find((e) => e.id === l.examId);
      if (x) return onStartExam(x, { sourceCourseId: course.id, sourceLessonId: l.id });
    }
    if (l.examUrl) return window.open(l.examUrl, '_blank');
    platformNotify('لم يتم ربط امتحان بهذا الدرس بعد', 'error');
  };
  const redeemCode = async () => {
    const code = clean(accessCode).toUpperCase();
    if (!code) return platformNotify('اكتب كود فتح الكورس', 'error');
    const snap = await getDocs(query(collection(db, 'courseAccessCodes'), where('code', '==', code), limit(1)));
    if (snap.empty) return platformNotify('الكود غير صحيح', 'error');
    const d = snap.docs[0];
    const data = d.data();
    if (data.isUsed) return platformNotify('الكود مستخدم بالفعل', 'error');
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) return platformNotify('انتهت صلاحية هذا الكود', 'error');
    if (data.courseId !== course.id) return platformNotify('الكود لا يخص هذا الكورس', 'error');
    const enrollmentExpiresAt = data.permanentAccess === false && data.validityDays ? new Date(Date.now() + Number(data.validityDays) * 86400000).toISOString() : null;
    await setDoc(doc(db, 'enrollments', `${user.uid}_${course.id}`), { userId: user.uid, courseId: course.id, status: 'active', paid: true, joinedAt: serverTimestamp(), progress: 0, openedBy: 'access-code', accessCode: code, permanentAccess: !enrollmentExpiresAt, expiresAt: enrollmentExpiresAt }, { merge: true });
    await updateDoc(doc(db, 'courseAccessCodes', d.id), { isUsed: true, usedBy: user.uid, usedAt: serverTimestamp() });
    setAccessCode('');
    platformNotify('تم فتح الكورس بنجاح', 'success');
  };

  if (!course) {
    return (
      <div className="space-y-6" dir="rtl">
        <PageHeader title="الكورسات التعليمية" icon={<Crown className="text-amber-600" />} />
        <div className="space-y-6">
          {courses.map((c) => (
            <button key={c.id} onClick={() => setCourse(c)} className="w-full bg-white rounded-[2rem] overflow-hidden border text-right hover:-translate-y-1 transition shadow-sm">
              <div className="grid lg:grid-cols-2 gap-0">
                <img src={c.coverImage || 'https://placehold.co/1200x640?text=Course'} className="h-72 lg:h-96 w-full object-cover" />
                <div className="p-6 lg:p-8 flex flex-col justify-center gap-3">
                  <div className="flex gap-2 flex-wrap">
                    <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-black text-xs">{getGradeLabel(c.grade)}</span>
                    <span className={`px-3 py-1 rounded-full font-black text-xs ${isEnrolled(c) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{isEnrolled(c) ? 'مفتوح لك' : 'يحتاج فتح'}</span>
                  </div>
                  <h3 className="text-3xl font-black">{c.title}</h3>
                  <p className="text-slate-600 font-bold leading-8 line-clamp-4">{c.description}</p>
                  <p className="font-black text-slate-800">المدرس: {c.teacher || 'مستر النحاس'}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-2xl font-black text-amber-700">{Number(c.price || 0) ? `${c.price} جنيه` : 'مجاني'}</span>
                    <span className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black">عرض التفاصيل</span>
                  </div>
                  {isEnrolled(c) && <div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${pct(courseProgress(c))}%` }} /></div>}
                </div>
              </div>
            </button>
          ))}
        </div>
        {!courses.length && <EmptyState title="لا توجد كورسات منشورة" description="أول كورس منشور لمرحلتك سيظهر هنا مباشرة." icon="📚" />}
      </div>
    );
  }

  const opened = isEnrolled(course);

  return (
    <div className="space-y-5" dir="rtl">
      <button onClick={() => { setCourse(null); setLesson(null); }} className="bg-white px-4 py-2 rounded-xl font-black border">رجوع للكورسات</button>
      <div className="bg-white rounded-[2rem] overflow-hidden border shadow-sm">
        <img src={course.coverImage || 'https://placehold.co/1200x520?text=Course'} className="h-72 lg:h-[420px] w-full object-cover" />
        <div className="p-6 lg:p-8 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-black text-xs">{getGradeLabel(course.grade)}</span>
            <span className={`px-3 py-1 rounded-full font-black text-xs ${opened ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{opened ? '✅ الكورس مفتوح لك' : '🔒 الكورس مغلق'}</span>
          </div>
          <h2 className="text-4xl font-black">{course.title}</h2>
          <p className="text-slate-600 font-bold leading-8">{course.description}</p>
          <p className="font-black">المدرس: {course.teacher || 'مستر النحاس'} • السعر: {Number(course.price || 0) ? `${course.price} جنيه` : 'مجاني'}</p>
        </div>
      </div>

      {!opened && (
        <section className="bg-white rounded-3xl p-5 border space-y-4">
          <h3 className="font-black flex gap-2"><Key /> فتح الكورس</h3>
          <p className="text-slate-500 font-bold">يمكن للإدارة فتح الكورس لك مباشرة، أو يمكنك إدخال كود فتح مولد من المنصة.</p>
          <div className="grid md:grid-cols-[1fr_auto] gap-3">
            <input className="p-3 rounded-xl border font-black tracking-wider" placeholder="اكتب كود الفتح مثل NH-XXXX-XXXX" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} />
            <button onClick={redeemCode} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex gap-2 justify-center"><Unlock /> تفعيل الكود</button>
          </div>
        </section>
      )}

      <div className="bg-white rounded-3xl p-4 border">
        <h3 className="font-black mb-4 flex gap-2"><Layers /> دروس الكورس</h3>
        {mods.map((m) => <div key={m.id} className="mb-6"><h4 className="font-black text-amber-800 mb-3">{m.order}. {m.title}</h4><div className="grid lg:grid-cols-2 gap-6">{(lbm[m.id] || []).map((l) => { const a = can(l); const p = pr(l.id); return <button key={l.id} onClick={() => { if (!a.ok) return platformNotify(a.reason, 'error'); setLesson(l); setTab('video'); }} className={`text-right rounded-3xl overflow-hidden border bg-white ${a.ok ? 'hover:-translate-y-1' : 'opacity-70'}`}><div className="relative"><img src={l.lessonImage || course.coverImage || 'https://placehold.co/600x340?text=Lesson'} className="h-72 lg:h-80 w-full object-cover" /><span className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 font-black">{l.icon || '📘'}</span><span className="absolute top-3 left-3 bg-white/90 rounded-full p-2">{a.ok ? <Unlock size={18} className="text-emerald-600" /> : <Lock size={18} className="text-red-600" />}</span></div><div className="p-4"><h5 className="font-black">{l.title}</h5><p className="text-xs text-slate-500 font-bold">مشاهدة: {pct(p.watchPercent)}%</p>{a.admin && <p className="text-xs text-emerald-700 font-black">متاح باستثناء من الإدارة</p>}{!a.ok && <p className="text-xs text-red-600 font-black">{a.reason}</p>}</div></button>; })}</div></div>)}
      </div>

      {lesson && <div className="bg-white rounded-3xl p-5 border"><h3 className="text-2xl font-black mb-4">{lesson.icon || '📘'} {lesson.title}</h3><div className="grid md:grid-cols-3 gap-2 mb-5"><button onClick={() => setTab('video')} className={`p-3 rounded-2xl font-black ${tab === 'video' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}><PlayCircle className="inline ml-1" /> شرح الدرس</button><button onClick={() => setTab('pdf')} className={`p-3 rounded-2xl font-black ${tab === 'pdf' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><FileText className="inline ml-1" /> PDF</button><button onClick={() => setTab('exam')} className={`p-3 rounded-2xl font-black ${tab === 'exam' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}><ClipboardList className="inline ml-1" /> الامتحان</button></div>{tab === 'video' && <YouTubeLessonPlayer videoUrl={lesson.videoUrl} savedProgress={pr(lesson.id)} onProgress={(d) => saveP(lesson, d)} />} {tab === 'pdf' && <div className="bg-blue-50 rounded-3xl p-6 text-center">{lesson.pdfUrl ? <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black inline-flex gap-2"><FileText /> فتح PDF</a> : <p className="font-bold text-slate-500">لا يوجد PDF لهذا الدرس.</p>}</div>} {tab === 'exam' && <div className="bg-emerald-50 rounded-3xl p-6 text-center space-y-3"><p className="font-black">نسبة مشاهدتك: {pct(pr(lesson.id).watchPercent)}%</p><button onClick={() => openExam(lesson)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black inline-flex gap-2"><ClipboardList /> بدء الامتحان</button><p className="text-xs text-slate-500 font-bold">لا يفتح إلا بعد مشاهدة {lesson.unlockRules?.examRequiresWatchPercent || 75}% إلا باستثناء من الأدمن.</p></div>}</div>}
    </div>
  );
}
