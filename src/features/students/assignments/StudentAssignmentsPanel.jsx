// الواجبات عند الطالب: المطلوب وآخر ميعاد، التسليم (نص/صورة حسب اللي المدرس اختاره)، والدرجة وتعليق المدرس.
import { useState } from 'react';
import { doc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@services/firebase';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import { platformNotify, safeNumber } from '@shared/core/platformShared.jsx';
import { Icon } from '@v2/ui/Icon.jsx';
import '@styles/pages/admin-people.css';

const ms = (t) => (t?.seconds ? t.seconds * 1000 : t ? new Date(t).getTime() : 0);
const fmt = (v) => (v ? new Date(v).toLocaleString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : '');
const n = (x) => Number(x || 0).toLocaleString('ar-EG');
const left = (due) => {
  const d = due - Date.now();
  if (d <= 0) return '';
  const h = Math.floor(d / 36e5);
  if (h < 1) return `فاضل ${n(Math.ceil(d / 6e4))} دقيقة`;
  if (h < 48) return `فاضل ${n(h)} ساعة`;
  return `فاضل ${n(Math.floor(h / 24))} يوم`;
};

export const StudentAssignmentsPanel = ({ assignments = [], submissions = [], user, userData }) => {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('open');
  const [answerText, setAnswerText] = useState('');
  const [answerImage, setAnswerImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subOf = (a) => submissions.find((s) => s.assignmentId === a.id);
  const canSubmit = (a) => a.status !== 'closed' && !(ms(a.dueDate) && ms(a.dueDate) <= Date.now());

  const open = (a) => {
    const sub = subOf(a);
    setSelected(a); setAnswerText(sub?.answerText || ''); setAnswerImage(sub?.answerImage || '');
    setTimeout(() => document.getElementById('nx-hw-submit')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, { kind: 'image', folder: 'nahhas-platform/assignment-answers' });
      setAnswerImage(uploaded.url);
    } catch (err) {
      platformNotify(err?.message || 'الصورة ماترفعتش، جرّب تاني.');
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!selected) return;
    const type = selected.deliveryType || 'text_or_image';
    if (type === 'image_only' && !answerImage) return platformNotify('الواجب ده لازم يتسلّم صورة');
    if (type === 'text_only' && !answerText.trim()) return platformNotify('اكتب إجابتك');
    if (!answerText.trim() && !answerImage) return platformNotify('اكتب إجابتك أو ارفع صورة');
    if (!canSubmit(selected)) return platformNotify('التسليم اتقفل');
    setIsSubmitting(true);
    try {
      const existing = subOf(selected);
      const payload = {
        assignmentId: selected.id,
        assignmentTitle: selected.title,
        grade: userData?.grade || selected.grade,
        branch: selected.branch || '',
        studentId: user.uid,
        studentName: userData?.name || '',
        answerText: type === 'image_only' ? '' : answerText,
        answerImage: type === 'text_only' ? '' : answerImage,
        reviewStatus: 'submitted',
        totalMarks: safeNumber(selected.totalMarks, 20),
        submittedAt: serverTimestamp(),
      };
      if (existing) await updateDoc(doc(db, 'assignment_submissions', existing.id), payload);
      else await addDoc(collection(db, 'assignment_submissions'), payload);
      setSelected(null); setAnswerText(''); setAnswerImage('');
      platformNotify('اتسلّم الواجب، هيوصلك إشعار أول ما يتصحح');
    } catch (err) { platformNotify('ماتسلّمش: ' + (err?.message || 'خطأ')); }
    setIsSubmitting(false);
  };

  const counts = { open: 0, submitted: 0, graded: 0, all: assignments.length };
  assignments.forEach((a) => { const s = subOf(a); if (!s) counts.open += 1; else if (s.reviewStatus === 'graded') counts.graded += 1; else counts.submitted += 1; });
  const visible = assignments.filter((a) => {
    const s = subOf(a);
    if (view === 'open') return !s;
    if (view === 'submitted') return s && s.reviewStatus !== 'graded';
    if (view === 'graded') return s && s.reviewStatus === 'graded';
    return true;
  }).sort((a, b) => (ms(a.dueDate) || 9e15) - (ms(b.dueDate) || 9e15));

  const type = selected?.deliveryType || 'text_or_image';

  return (
    <div className="apl shw">
      <div className="apl-bar">
        <h3 className="smi-h"><Icon name="file" />الواجبات</h3>
        <span className="apl-sp" />
        <div className="aas-seg" role="tablist">
          {[['open', 'المطلوب'], ['submitted', 'اتسلّم'], ['graded', 'اتصحح'], ['all', 'الكل']].map(([k, l]) => (
            <button key={k} type="button" className={view === k ? 'is-on' : ''} onClick={() => setView(k)}>{l}{counts[k] && k !== 'all' ? <i>{n(counts[k])}</i> : null}</button>
          ))}
        </div>
      </div>

      <div className="aas-subs">
        {visible.map((a) => {
          const s = subOf(a);
          const due = ms(a.dueDate);
          const late = due && due <= Date.now();
          const closed = a.status === 'closed';
          const graded = s?.reviewStatus === 'graded';
          return (
            <article key={a.id} className={`apl-card aas-sub${graded ? ' is-done' : ''}`}>
              <header>
                <span className="aas-av"><Icon name="file" /></span>
                <div><b>{a.title}</b><small>{a.branch || 'واجب'} · {n(a.totalMarks || 20)} درجة</small></div>
                <span className={`aas-badge${graded ? ' is-ok' : ''}`}>{graded ? `${n(s.score)}/${n(s.maxScore)}` : s ? 'اتسلّم' : late || closed ? 'اتقفل' : 'مطلوب'}</span>
              </header>
              {a.description ? <p className="aas-ans">{a.description}</p> : null}
              <div className="aas-tags">
                {due ? <span className={`apl-chip${late ? ' is-bad' : left(due).includes('ساعة') || left(due).includes('دقيقة') ? ' is-gold' : ''}`}><Icon name="calendar" />{late ? `خلص ${fmt(due)}` : `آخر ميعاد ${fmt(due)}`}</span> : null}
                {due && !late ? <span className="apl-chip is-gold"><Icon name="clock" />{left(due)}</span> : null}
                <span className="apl-chip">{{ image_only: 'التسليم صورة', text_only: 'التسليم كتابة' }[a.deliveryType] || 'كتابة أو صورة'}</span>
              </div>
              {graded && s.feedback ? <p className="apl-note"><Icon name="message" /><span><b>تعليق المدرس:</b> {s.feedback}</span></p> : null}
              {graded ? null : canSubmit(a) ? (
                <button type="button" className={`apl-btn ${s ? '' : 'apl-btn--pri'}`} onClick={() => open(a)}><Icon name={s ? 'edit' : 'arrowLeft'} />{s ? 'عدّل تسليمك' : 'سلّم الواجب'}</button>
              ) : !s ? <p className="apl-note is-bad"><Icon name="lock" />التسليم اتقفل</p> : null}
            </article>
          );
        })}
      </div>
      {!visible.length && <div className="apl-empty"><Icon name="checkCircle" />{view === 'open' ? 'مفيش واجبات مطلوبة منك دلوقتي' : 'مفيش حاجة هنا'}</div>}

      {selected && (
        <section id="nx-hw-submit" className="apl-section shw-form">
          <h3><Icon name="edit" />تسليم: {selected.title}</h3>
          {selected.description ? <p className="apl-note"><Icon name="info" />{selected.description}</p> : null}
          {type !== 'image_only' && (
            <label className="apl-field"><span>إجابتك</span><textarea rows={6} value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="اكتب إجابتك هنا" /></label>
          )}
          {type !== 'text_only' && (
            <div className="shw-photo">
              <label className="apl-btn"><Icon name="download" />{uploading ? 'بيرفع…' : answerImage ? 'غيّر الصورة' : 'ارفع صورة الإجابة'}
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </label>
              {answerImage ? <img src={answerImage} alt="إجابتك" /> : null}
            </div>
          )}
          <div className="apl-bar">
            <button type="button" className="apl-btn apl-btn--pri" disabled={isSubmitting || uploading} onClick={submit}><Icon name="check" />{isSubmitting ? 'بيتسلّم…' : 'سلّم'}</button>
            <button type="button" className="apl-btn" onClick={() => setSelected(null)}>إلغاء</button>
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentAssignmentsPanel;
