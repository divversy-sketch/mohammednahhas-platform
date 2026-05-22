import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { BookOpen, Layers, PlayCircle, FileText, ClipboardList, Lock, UploadCloud, PlusCircle, Trash2, Save, Unlock, Key, Users, Crown } from '@shared/icons/lucide-shim.jsx';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';
import { platformNotify, platformConfirm } from '@shared/core/platformShared.jsx';
import EmptyState from '@shared/ui/EmptyState.jsx';
import PageHeader from '@shared/ui/PageHeader.jsx';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';
import { defaultImagePlacement, imagePlacementStyle, normalizeImagePlacement } from '@shared/utils/imagePlacement.js';

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

function ImgInput({ label, value, onChange, kind = 'image', placement, onPlacementChange }) {
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
          <div className="h-28 w-full rounded-2xl border bg-slate-100 overflow-hidden"><img src={value} className="w-full h-full" style={imagePlacementStyle(placement)} /></div>
        ))}
      {!isPdf && onPlacementChange && (
        <ImageFitControls imageUrl={value} value={placement} onChange={onPlacementChange} />
      )}
    </div>
  );
}
import { YouTubeLessonPlayer } from './YouTubeLessonPlayer.jsx';

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
                <div className="h-72 lg:h-96 w-full bg-slate-100 overflow-hidden"><img src={c.coverImage || 'https://placehold.co/1200x640?text=Course'} className="w-full h-full" style={imagePlacementStyle(c.coverImagePlacement)} /></div>
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
        <div className="h-72 lg:h-[420px] w-full bg-slate-100 overflow-hidden"><img src={course.coverImage || 'https://placehold.co/1200x520?text=Course'} className="w-full h-full" style={imagePlacementStyle(course.coverImagePlacement)} /></div>
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
        {mods.map((m) => <div key={m.id} className="mb-6"><h4 className="font-black text-amber-800 mb-3">{m.order}. {m.title}</h4><div className="grid lg:grid-cols-2 gap-6">{(lbm[m.id] || []).map((l) => { const a = can(l); const p = pr(l.id); return <button key={l.id} onClick={() => { if (!a.ok) return platformNotify(a.reason, 'error'); setLesson(l); setTab('video'); }} className={`text-right rounded-3xl overflow-hidden border bg-white ${a.ok ? 'hover:-translate-y-1' : 'opacity-70'}`}><div className="relative"><div className="h-72 lg:h-80 w-full bg-slate-100 overflow-hidden"><img src={l.lessonImage || course.coverImage || (l.youtubeVideoId ? `https://img.youtube.com/vi/${l.youtubeVideoId}/hqdefault.jpg` : 'https://placehold.co/600x340?text=Lesson')} className="w-full h-full" style={imagePlacementStyle(l.lessonImage ? l.lessonImagePlacement : course.coverImagePlacement)} /></div><span className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 font-black">{l.icon || '📘'}</span><span className="absolute top-3 left-3 bg-white/90 rounded-full p-2">{a.ok ? <Unlock size={18} className="text-emerald-600" /> : <Lock size={18} className="text-red-600" />}</span></div><div className="p-4"><h5 className="font-black">{l.title}</h5><p className="text-xs text-slate-500 font-bold">مشاهدة: {pct(p.watchPercent)}%</p>{a.admin && <p className="text-xs text-emerald-700 font-black">متاح باستثناء من الإدارة</p>}{!a.ok && <p className="text-xs text-red-600 font-black">{a.reason}</p>}</div></button>; })}</div></div>)}
      </div>

      {lesson && <div className="bg-white rounded-3xl p-5 border"><h3 className="text-2xl font-black mb-4">{lesson.icon || '📘'} {lesson.title}</h3><div className="grid md:grid-cols-3 gap-2 mb-5"><button onClick={() => setTab('video')} className={`p-3 rounded-2xl font-black ${tab === 'video' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}><PlayCircle className="inline ml-1" /> شرح الدرس</button><button onClick={() => setTab('pdf')} className={`p-3 rounded-2xl font-black ${tab === 'pdf' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}><FileText className="inline ml-1" /> PDF</button><button onClick={() => setTab('exam')} className={`p-3 rounded-2xl font-black ${tab === 'exam' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}><ClipboardList className="inline ml-1" /> الامتحان</button></div>{tab === 'video' && <YouTubeLessonPlayer videoUrl={lesson.videoUrl} posterImage={lesson.lessonImage || course.coverImage || (lesson.youtubeVideoId ? `https://img.youtube.com/vi/${lesson.youtubeVideoId}/hqdefault.jpg` : '')} savedProgress={pr(lesson.id)} onProgress={(d) => saveP(lesson, d)} />} {tab === 'pdf' && <div className="bg-blue-50 rounded-3xl p-6 text-center space-y-4">{lesson.pdfImage && <div className="h-56 rounded-3xl bg-white border overflow-hidden"><img src={lesson.pdfImage} className="w-full h-full" style={imagePlacementStyle(lesson.pdfImagePlacement)} /></div>}{lesson.pdfUrl ? <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black inline-flex gap-2"><FileText /> فتح PDF</a> : <p className="font-bold text-slate-500">لا يوجد PDF لهذا الدرس.</p>}</div>} {tab === 'exam' && <div className="bg-emerald-50 rounded-3xl p-6 text-center space-y-3">{lesson.examImage && <div className="h-56 rounded-3xl bg-white border overflow-hidden"><img src={lesson.examImage} className="w-full h-full" style={imagePlacementStyle(lesson.examImagePlacement)} /></div>}<p className="font-black">نسبة مشاهدتك: {pct(pr(lesson.id).watchPercent)}%</p><button onClick={() => openExam(lesson)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black inline-flex gap-2"><ClipboardList /> بدء الامتحان</button><p className="text-xs text-slate-500 font-bold">لا يفتح إلا بعد مشاهدة {lesson.unlockRules?.examRequiresWatchPercent || 75}% إلا باستثناء من الأدمن.</p></div>}</div>}
    </div>
  );
}
