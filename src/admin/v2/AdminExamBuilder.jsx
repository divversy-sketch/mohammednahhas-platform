// صفحة «إدارة الامتحانات»: إنشاء امتحان + الامتحانات الحالية + الفتح الاستثنائي.
// نفس الوظايف القديمة بالظبط (نفس parseExam ونفس الحفظ)، بس متنظمة:
// خانات ليها أسماء، أزرار إدراج سريع، معاينة حيّة للأسئلة وتحذيرات قبل النشر،
// ملخص على الجنب، والإعدادات الإضافية مطوية لحد ما تحتاجها.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { platformNotify } from '@shared/core/platformShared.jsx';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';
import { parseExamText } from '@shared/exam/parseExamText.js';
import '@styles/pages/admin-exam-builder.css';

const DRAFT_KEY = 'nx-admin-exam-draft-v1';
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseDate = (v) => {
  if (!v) return null;
  const d = v?.toDate ? v.toDate() : new Date(v?.seconds ? v.seconds * 1000 : v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const nice = (v) => {
  const d = parseDate(v);
  return d ? d.toLocaleString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;
};
const examStatus = (e, now = Date.now()) => {
  const s = parseDate(e.startTime); const en = parseDate(e.endTime);
  if (!s || !en) return { key: 'none', label: 'من غير موعد' };
  if (now < s.getTime()) return { key: 'soon', label: 'جاي' };
  if (now > en.getTime()) return { key: 'done', label: 'خلص' };
  return { key: 'open', label: 'مفتوح دلوقتي' };
};
const questionCount = (e) => (e.questions || []).reduce((n, b) => n + (b.subQuestions || []).length, 0);

const SNIPPETS = [
  { key: 'branch', label: 'فرع', icon: 'layers', text: '#فرع: اسم الفرع\n' },
  { key: 'passage', label: 'قطعة', icon: 'book', text: 'بداية القطعة\nاكتب نص القطعة هنا\nنهاية القطعة\n\n' },
  { key: 'mcq', label: 'سؤال اختياري', icon: 'check', text: 'نص السؤال\nاختيار أول\n*الإجابة الصحيحة\nاختيار تالت\nاختيار رابع\n\n' },
  { key: 'essay', label: 'سؤال مقالي', icon: 'edit', text: '#مقالي: نص السؤال المقالي\nنموذج: الإجابة النموذجية\n\n' },
];

function Field({ label, hint, children, wide }) {
  return (
    <label className={`aeb-field ${wide ? 'is-wide' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Preview({ parsed }) {
  const [open, setOpen] = useState(true);
  const all = parsed.blocks.flatMap((b) => b.subQuestions.map((q) => ({ ...q, passage: b.text })));
  if (!all.length && !parsed.warnings.length) return null;
  return (
    <div className="aeb-preview">
      <button type="button" className="aeb-preview__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Icon name="eye" /><b>معاينة زي ما الطالب هيشوفها</b>
        <span>{formatNumber(all.length)} سؤال</span>
        <Icon name="chevronDown" />
      </button>
      {parsed.warnings.length > 0 && (
        <ul className="aeb-warns">
          {parsed.warnings.map((w, i) => (
            <li key={i} className={w.type === 'dropped' ? 'is-bad' : ''}>
              <Icon name="alert" />
              <span>{w.line ? <b>سطر {formatNumber(w.line)}: </b> : null}{w.text ? `«${String(w.text).slice(0, 50)}» — ` : ''}{w.message}</span>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <ol className="aeb-qs">
          {all.slice(0, 40).map((q, i) => (
            <li key={q.id}>
              <div className="aeb-qs__meta"><em>{formatNumber(i + 1)}</em><span>{q.branch}</span>{q.type === 'essay' && <span className="is-essay">مقالي</span>}{q.passage && i === all.findIndex((x) => x.passage === q.passage) && <span className="is-pass">على قطعة</span>}</div>
              <p>{q.text}</p>
              {q.type === 'essay'
                ? (q.modelAnswer ? <small className="aeb-qs__model">النموذج: {q.modelAnswer}</small> : null)
                : <div className="aeb-qs__opts">{q.options.map((o, k) => <span key={k} className={k === q.correctIdx ? 'is-ok' : ''}>{k === q.correctIdx && <Icon name="check" />}{o}</span>)}</div>}
            </li>
          ))}
          {all.length > 40 && <li className="aeb-qs__more">و{formatNumber(all.length - 40)} سؤال كمان…</li>}
        </ol>
      )}
    </div>
  );
}

export default function AdminExamBuilder({ ctx }) {
  const {
    examBuilder, setExamBuilder, bulkText, setBulkText, parseExam, handleExamImageSelect,
    examsList = [], filteredExamsList, openFullExamEditor, setEditingExamTime, setNewEndTime, handleDeleteExam, handleDeleteAllExams,
    examOverrideDraft = {}, setExamOverrideDraft, gatedExamsList = [], activeUsersList = [], openExamAccessOverride, revokeExamAccessOverride, examAccessOverrides = [],
  } = ctx;
  const b = examBuilder || {};
  const set = (patch) => setExamBuilder({ ...b, ...patch });
  const textRef = useRef(null);
  const [showGuide, setShowGuide] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [listQ, setListQ] = useState('');
  const [listFilter, setListFilter] = useState('all');

  // مسودة محفوظة على الجهاز: لو الصفحة اتقفلت قبل النشر الأسئلة ما تضيعش
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (d && !bulkText && (d.bulkText || d.title)) {
        setBulkText(d.bulkText || '');
        setExamBuilder((prev) => ({ ...prev, title: d.title || prev.title, accessCode: d.accessCode || prev.accessCode, duration: d.duration || prev.duration, grade: d.grade || prev.grade, startTime: d.startTime || '', endTime: d.endTime || '' }));
        platformNotify('رجّعنا مسودة الامتحان اللي كنت بتكتبها.');
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (!bulkText && !b.title) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify({ bulkText, title: b.title, accessCode: b.accessCode, duration: b.duration, grade: b.grade, startTime: b.startTime, endTime: b.endTime }));
      } catch { /* ignore */ }
    }, 600);
    return () => clearTimeout(t);
  }, [bulkText, b.title, b.accessCode, b.duration, b.grade, b.startTime, b.endTime]);

  const parsed = useMemo(() => parseExamText(bulkText || ''), [bulkText]);
  const start = parseDate(b.startTime); const end = parseDate(b.endTime);
  const checks = [
    { ok: Boolean(String(b.title || '').trim()), label: 'اسم الامتحان' },
    { ok: Boolean(String(b.accessCode || '').trim()), label: 'كود الدخول' },
    { ok: Number(b.duration) > 0, label: 'المدة' },
    { ok: Boolean(start && end && end > start), label: 'الموعد' },
    { ok: parsed.stats.total > 0, label: 'الأسئلة' },
  ];
  const ready = checks.every((c) => c.ok);

  const insert = (text) => {
    const ta = textRef.current;
    const cur = bulkText || '';
    const at = ta ? ta.selectionStart ?? cur.length : cur.length;
    const before = cur.slice(0, at); const after = cur.slice(at);
    const lead = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    setBulkText(`${before}${lead}${text}${after}`);
    requestAnimationFrame(() => { if (ta) { ta.focus(); const pos = before.length + lead.length + text.length; ta.setSelectionRange(pos, pos); } });
  };
  const highlight = () => {
    const ta = textRef.current; if (!ta) return;
    const s = ta.selectionStart ?? 0; const e = ta.selectionEnd ?? 0; const sel = (bulkText || '').slice(s, e);
    if (!sel.trim()) { platformNotify('حدد أولًا الكلمة أو الجملة داخل القطعة ثم اضغط «تظليل المحدد».'); ta.focus(); return; }
    setBulkText(`${bulkText.slice(0, s)}[${sel}]${bulkText.slice(e)}`);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + 1, s + 1 + sel.length); });
  };
  const genCode = () => set({ accessCode: String(Math.floor(1000 + Math.random() * 9000)) });
  const startNow = () => {
    const s = new Date(); s.setSeconds(0, 0);
    const en = new Date(s.getTime() + Math.max(Number(b.duration) || 60, 30) * 60000 + 30 * 60000);
    set({ startTime: toLocalInput(s), endTime: toLocalInput(en) });
  };
  const endAfter = (hours) => {
    const s = start || new Date();
    set({ startTime: b.startTime || toLocalInput(s), endTime: toLocalInput(new Date(s.getTime() + hours * 3600e3)) });
  };
  const publish = async () => {
    setPublishing(true);
    try { await parseExam(); } finally { setPublishing(false); }
  };
  const clearDraft = () => {
    setBulkText('');
    set({ title: '', accessCode: '', startTime: '', endTime: '' });
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const now = Date.now();
  const list = useMemo(() => {
    const src = filteredExamsList || examsList;
    const order = { open: 0, soon: 1, none: 2, done: 3 };
    return src
      .map((e) => ({ e, st: examStatus(e, now) }))
      .filter(({ e, st }) => (listFilter === 'all' || st.key === listFilter) && (!listQ.trim() || String(e.title || '').includes(listQ.trim())))
      .sort((x, y) => order[x.st.key] - order[y.st.key] || (parseDate(y.e.startTime)?.getTime() || 0) - (parseDate(x.e.startTime)?.getTime() || 0));
  }, [filteredExamsList, examsList, listFilter, listQ, now]);
  const counts = useMemo(() => (filteredExamsList || examsList).reduce((a, e) => { const k = examStatus(e, now).key; a[k] = (a[k] || 0) + 1; return a; }, {}), [filteredExamsList, examsList, now]);
  const overrides = examAccessOverrides.filter((o) => o.allowed);

  return (
    <div className="aeb" dir="rtl">
      {/* ── امتحان جديد ── */}
      <div className="aeb-title"><h2><Icon name="plus" />امتحان جديد</h2><small>اكتب البيانات والأسئلة، راجع المعاينة، وبعدين انشر.</small></div>
      <div className="aeb-grid">
        <div className="aeb-main">
          <section className="aeb-card">
            <h3><i>١</i>بيانات الامتحان</h3>
            <div className="aeb-fields">
              <Field label="اسم الامتحان" wide><input value={b.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder="مثلًا: امتحان البلاغة الشامل" /></Field>
              <Field label="الصف"><select value={b.grade || ''} onChange={(e) => set({ grade: e.target.value })}><GradeOptions /></select></Field>
              <Field label="المدة (بالدقيقة)"><input type="number" min="1" inputMode="numeric" value={b.duration ?? ''} onChange={(e) => set({ duration: parseInt(e.target.value, 10) || '' })} /></Field>
              <Field label="كود الدخول" hint="الطالب بيكتبه عشان يبدأ">
                <span className="aeb-inline"><input value={b.accessCode || ''} onChange={(e) => set({ accessCode: e.target.value })} placeholder="مثلًا 2580" dir="ltr" /><button type="button" onClick={genCode}><Icon name="refresh" />توليد</button></span>
              </Field>
              <label className={`aeb-switch ${b.isPremium ? 'is-on' : ''}`}>
                <input type="checkbox" checked={!!b.isPremium} onChange={(e) => set({ isPremium: e.target.checked })} />
                <i aria-hidden="true" /><span><b><Icon name="crown" />امتحان VIP</b><small>مقفول لغير المشتركين</small></span>
              </label>
            </div>
          </section>

          <section className="aeb-card">
            <h3><i>٢</i>الموعد</h3>
            <div className="aeb-fields">
              <Field label="بيفتح"><input type="datetime-local" value={b.startTime || ''} onChange={(e) => set({ startTime: e.target.value })} /></Field>
              <Field label="بيقفل"><input type="datetime-local" value={b.endTime || ''} onChange={(e) => set({ endTime: e.target.value })} /></Field>
            </div>
            <div className="aeb-chips">
              <button type="button" onClick={startNow}><Icon name="play" />يفتح دلوقتي</button>
              <button type="button" onClick={() => endAfter(2)}>يقفل بعد ساعتين</button>
              <button type="button" onClick={() => endAfter(24)}>يقفل بعد يوم</button>
              <button type="button" onClick={() => endAfter(72)}>يقفل بعد ٣ أيام</button>
            </div>
            {start && end && end <= start && <p className="aeb-err"><Icon name="alert" />وقت القفل لازم يكون بعد وقت الفتح.</p>}
          </section>

          <section className="aeb-card">
            <h3><i>٣</i>الأسئلة<button type="button" className="aeb-link" onClick={() => setShowGuide((v) => !v)}><Icon name="help" />{showGuide ? 'اخفي الطريقة' : 'طريقة الكتابة'}</button></h3>
            {showGuide && (
              <div className="aeb-guide">
                <p><b>سطر فاضي</b> بين كل سؤال واللي بعده، و<b>*</b> قبل الإجابة الصح.</p>
                <p><code>#فرع: اسم الفرع</code> في سطر لوحده عشان تحدد الفرع.</p>
                <p><code>#مقالي: نص السؤال</code> للسؤال المقالي، وبعده <code>نموذج: …</code> للإجابة النموذجية.</p>
                <p>القطعة: <code>بداية القطعة</code> ثم النص ثم <code>نهاية القطعة</code>، والأسئلة بعدها.</p>
                <p>لكلمة جوه القطعة: حددها واضغط «تظليل المحدد» أو اكتبها بين <code>[ ]</code>.</p>
              </div>
            )}
            <div className="aeb-toolbar">
              <span>إدراج:</span>
              {SNIPPETS.map((s) => <button key={s.key} type="button" onClick={() => insert(s.text)}><Icon name={s.icon} />{s.label}</button>)}
              <span className="aeb-sp" />
              <button type="button" className="is-hl" onClick={highlight} title="حدد كلمة أو جملة من القطعة ثم اضغط هنا"><i />تظليل المحدد</button>
            </div>
            <textarea ref={textRef} className="aeb-text" value={bulkText || ''} onChange={(e) => setBulkText(e.target.value)} spellCheck={false}
              placeholder={'اكتب الأسئلة هنا أو الصقها…\n\nنص السؤال\nاختيار\n*الإجابة الصحيحة\nاختيار\n\n#مقالي: سؤال مقالي'} />
            <Preview parsed={parsed} />
          </section>

          <details className="aeb-card aeb-more">
            <summary><Icon name="settings" /><b>إعدادات إضافية</b><small>صورة الغلاف · شروط الفتح</small>{(b.examImageUrl || b.accessRule?.enabled) && <em>متفعّلة</em>}<Icon name="chevronDown" /></summary>
            <div className="aeb-more__body">
              <div className="aeb-sub">
                <h4><Icon name="file" />صورة الغلاف</h4>
                <span className="aeb-inline"><input value={b.examImageUrl || ''} onChange={(e) => set({ examImageUrl: e.target.value })} placeholder="رابط الصورة أو ارفع صورة" dir="ltr" /><label className="aeb-upload"><Icon name="plus" />رفع صورة<input type="file" accept="image/*" hidden onChange={handleExamImageSelect} /></label></span>
                {b.examImageUrl && <ImageFitControls imageUrl={b.examImageUrl} value={b.imagePlacement} onChange={(v) => set({ imagePlacement: v })} title="تظبيط الصورة داخل الكارت" />}
              </div>
              <div className="aeb-sub">
                <label className={`aeb-switch ${b.accessRule?.enabled ? 'is-on' : ''}`}>
                  <input type="checkbox" checked={!!b.accessRule?.enabled} onChange={(e) => set({ accessRule: { ...(b.accessRule || {}), enabled: e.target.checked, visibilityWhenLocked: 'locked', allowAdminOverride: true } })} />
                  <i aria-hidden="true" /><span><b><Icon name="lock" />شرط فتح</b><small>يفضل مقفول لحد ما الطالب ينجح في امتحان قبله بنسبة معينة</small></span>
                </label>
                {b.accessRule?.enabled && (
                  <div className="aeb-fields">
                    <Field label="الامتحان اللي قبله" wide>
                      <select value={b.accessRule?.requiredExamId || ''} onChange={(e) => set({ accessRule: { ...(b.accessRule || {}), requiredExamId: e.target.value } })}>
                        <option value="">اختار الامتحان</option>
                        {examsList.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                      </select>
                    </Field>
                    <Field label="النسبة المطلوبة ٪"><input type="number" min="0" max="100" value={b.accessRule?.requiredPercentage ?? 70} onChange={(e) => set({ accessRule: { ...(b.accessRule || {}), requiredPercentage: Number(e.target.value) } })} /></Field>
                    <label className="aeb-check"><input type="checkbox" checked={b.accessRule?.useBestAttempt !== false} onChange={(e) => set({ accessRule: { ...(b.accessRule || {}), useBestAttempt: e.target.checked } })} />احسب أحسن محاولة للطالب</label>
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>

        <aside className="aeb-side">
          <div className="aeb-card aeb-sum">
            <h3>ملخص قبل النشر</h3>
            <div className="aeb-sum__title">{b.title || <span className="dim">من غير اسم</span>}</div>
            <dl>
              <div><dt>الصف</dt><dd>{getGradeLabel(b.grade) || '—'}</dd></div>
              <div><dt>المدة</dt><dd>{b.duration ? `${formatNumber(b.duration)} دقيقة` : '—'}</dd></div>
              <div><dt>بيفتح</dt><dd>{nice(b.startTime) || '—'}</dd></div>
              <div><dt>بيقفل</dt><dd>{nice(b.endTime) || '—'}</dd></div>
            </dl>
            <div className="aeb-nums">
              <span><b>{formatNumber(parsed.stats.total)}</b>سؤال</span>
              <span><b>{formatNumber(parsed.stats.mcq)}</b>اختياري</span>
              <span><b>{formatNumber(parsed.stats.essay)}</b>مقالي</span>
              <span><b>{formatNumber(parsed.stats.passages)}</b>قطعة</span>
            </div>
            {Object.keys(parsed.stats.branches).length > 0 && (
              <div className="aeb-branches">{Object.entries(parsed.stats.branches).map(([k, n]) => <span key={k}>{k} · {formatNumber(n)}</span>)}</div>
            )}
            <ul className="aeb-checks">
              {checks.map((c) => <li key={c.label} className={c.ok ? 'is-ok' : ''}><Icon name={c.ok ? 'checkCircle' : 'clock'} />{c.label}</li>)}
              {parsed.warnings.length > 0 && <li className="is-warn"><Icon name="alert" />{formatNumber(parsed.warnings.length)} تحذير في الأسئلة</li>}
            </ul>
            <button type="button" className="aeb-publish" onClick={publish} disabled={!ready || publishing}><Icon name="rocket" />{publishing ? 'بيتنشر…' : 'انشر الامتحان'}</button>
            {!ready && <small className="aeb-hint">كمّل اللي ناقص فوق عشان تقدر تنشر.</small>}
            {(bulkText || b.title) && <button type="button" className="aeb-clear" onClick={clearDraft}>ابدأ من جديد (امسح المسودة)</button>}
          </div>
        </aside>
      </div>

      {/* ── الامتحانات الحالية ── */}
      <div className="aeb-title"><h2><Icon name="exam" />الامتحانات</h2><small>{formatNumber((filteredExamsList || examsList).length)} امتحان</small></div>
      <div className="aeb-listbar">
        <label className="aeb-search"><Icon name="search" /><input className="aeb-bare" value={listQ} onChange={(e) => setListQ(e.target.value)} placeholder="دوّر باسم الامتحان" /></label>
        <div className="aeb-tabs">
          {[['all', 'الكل'], ['open', 'مفتوح دلوقتي'], ['soon', 'جاي'], ['done', 'خلص'], ['none', 'من غير موعد']].map(([k, l]) => (
            (k === 'all' || counts[k]) ? <button key={k} type="button" className={listFilter === k ? 'is-on' : ''} onClick={() => setListFilter(k)}>{l}{k !== 'all' && <b>{formatNumber(counts[k] || 0)}</b>}</button> : null
          ))}
        </div>
      </div>
      {list.length === 0 && <p className="aeb-empty">{examsList.length ? 'مفيش امتحانات بالفلتر ده.' : 'لسه مفيش امتحانات. أول امتحان تنشره هيظهر هنا.'}</p>}
      <div className="aeb-exams">
        {list.map(({ e, st }) => (
          <article key={e.id} className={`aeb-exam st-${st.key}`}>
            <header>
              <em className="aeb-st"><i />{st.label}</em>
              {e.isPremium && <em className="aeb-vip"><Icon name="crown" />VIP</em>}
              <span className="aeb-sp" />
              <small>{getGradeLabel(e.grade) || ''}</small>
            </header>
            <h4>{e.title || 'امتحان من غير اسم'}</h4>
            <ul>
              <li><Icon name="calendar" />{nice(e.startTime) ? <>{nice(e.startTime)} ← {nice(e.endTime) || '—'}</> : <span className="dim">مفيش موعد متحدد</span>}</li>
              <li><Icon name="fileText" />{formatNumber(questionCount(e))} سؤال · {formatNumber(e.duration || 0)} دقيقة</li>
              <li><Icon name="key" />الكود: <code>{e.accessCode || '—'}</code>{e.accessCode && <button type="button" className="aeb-copy" onClick={() => { navigator.clipboard?.writeText(String(e.accessCode)); platformNotify('الكود اتنسخ.'); }}>نسخ</button>}</li>
              {e.accessRule?.enabled && <li className="is-rule"><Icon name="lock" />مقفول لحد اجتياز «{examsList.find((x) => x.id === e.accessRule?.requiredExamId)?.title || 'امتحان سابق'}» بـ {formatNumber(e.accessRule?.requiredPercentage || 70)}٪</li>}
            </ul>
            <footer>
              <button type="button" onClick={() => openFullExamEditor(e)}><Icon name="edit" />تعديل</button>
              <button type="button" onClick={() => { setEditingExamTime(e); setNewEndTime(e.endTime); }}><Icon name="clock" />الوقت</button>
              <button type="button" className="is-danger" onClick={() => handleDeleteExam(e.id)} aria-label="حذف"><Icon name="close" /></button>
            </footer>
          </article>
        ))}
      </div>

      {/* ── الفتح الاستثنائي ── */}
      <section className="aeb-card aeb-override">
        <h3><Icon name="key" />فتح امتحان مقفول لطالب معيّن</h3>
        <p className="dim">لو امتحان عليه شرط فتح والطالب ما حققش النسبة، وعايز تسمح له يدخل.</p>
        <div className="aeb-fields aeb-fields--4">
          <Field label="الامتحان المقفول"><select value={examOverrideDraft.examId || ''} onChange={(e) => setExamOverrideDraft({ ...examOverrideDraft, examId: e.target.value })}><option value="">اختار</option>{gatedExamsList.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></Field>
          <Field label="الطالب"><select value={examOverrideDraft.studentId || ''} onChange={(e) => setExamOverrideDraft({ ...examOverrideDraft, studentId: e.target.value })}><option value="">اختار</option>{activeUsersList.map((s) => <option key={s.id} value={s.id}>{s.name || s.displayName || s.email}</option>)}</select></Field>
          <Field label="السبب (اختياري)"><input value={examOverrideDraft.reason || ''} onChange={(e) => setExamOverrideDraft({ ...examOverrideDraft, reason: e.target.value })} /></Field>
          <button type="button" className="aeb-btn" onClick={openExamAccessOverride}><Icon name="key" />افتح له</button>
        </div>
        {gatedExamsList.length === 0 && <small className="dim">مفيش امتحانات عليها شرط فتح دلوقتي.</small>}
        {overrides.length > 0 && (
          <div className="aeb-ovr">
            {overrides.slice(0, 10).map((o) => (
              <div key={o.id}><span><b>{o.studentName || o.studentEmail || o.studentId}</b><small>{o.examTitle || examsList.find((x) => x.id === o.examId)?.title || 'امتحان'} — {o.reason || 'فتح استثنائي'}</small></span><button type="button" onClick={() => revokeExamAccessOverride(o)}>إلغاء</button></div>
            ))}
          </div>
        )}
      </section>

      {examsList.length > 0 && <div className="aeb-danger"><button type="button" onClick={handleDeleteAllExams}><Icon name="alert" />حذف كل الامتحانات</button></div>}
    </div>
  );
}
