// صفحة المحتوى — إضافة محتوى خطوة بخطوة + قايمة منظمة حسب النوع.
// كل نوع واضح هيظهر للطالب فين:
//   فيديو → المحاضرات | ملف / رابط / HTML تفاعلي → الملفات | امتحان HTML → الامتحانات ← امتحانات الحصة
import { useMemo, useState } from 'react';
import { Icon } from '@v2/ui/Icon.jsx';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';
import AudiencePicker, { useStudentGroups } from '@admin/v2/AudiencePicker.jsx';
import { defaultAudience, resolveAudience, audienceLabel } from '@shared/audience/audience.js';
import '@styles/pages/admin-people.css';

const n = (x) => Number(x || 0).toLocaleString('ar-EG');
export const CONTENT_TYPES = [
  { key: 'video', label: 'فيديو', icon: 'video', where: 'المحاضرات', hint: 'رابط يوتيوب / درايف أو ارفع الفيديو' },
  { key: 'file', label: 'ملف (PDF وغيره)', icon: 'fileText', where: 'الملفات', hint: 'PDF، Word، صور، ZIP…' },
  { key: 'html', label: 'ملف HTML تفاعلي', icon: 'interactive', where: 'الملفات', hint: 'درس أو نشاط تفاعلي، من غير درجة' },
  { key: 'interactive_exam', label: 'امتحان حصة (HTML)', icon: 'exam', where: 'الامتحانات ← امتحانات الحصة', hint: 'محاولة واحدة، بوقت، ومراقبة' },
  { key: 'link', label: 'رابط خارجي', icon: 'link', where: 'الملفات', hint: 'Meet، Drive، أي موقع' },
];
const typeOf = (k) => CONTENT_TYPES.find((t) => t.key === k) || CONTENT_TYPES[1];
const TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'video', label: 'فيديوهات', match: (c) => c.type === 'video' },
  { key: 'files', label: 'ملفات وروابط', match: (c) => ['file', 'link', 'html'].includes(c.type) },
  { key: 'exam', label: 'امتحانات الحصة', match: (c) => c.type === 'interactive_exam' },
  { key: 'vip', label: 'VIP', match: (c) => c.isPremium },
];

function Step({ no, title, children, hint }) {
  return (
    <section className="acn-step">
      <header><span>{n(no)}</span><b>{title}</b>{hint && <small>{hint}</small>}</header>
      <div className="acn-step__body">{children}</div>
    </section>
  );
}

export default function AdminContentV2({ ctx }) {
  const {
    newContent, setNewContent, handleAddContent, handleFileSelect, handleVideoThumbnailSelect,
    isUploading, uploadProgress, examsList = [], activeUsersList = [], contentList = [], filteredContentList = [],
    openFullContentEditor, handleDeleteContent, handleDeleteAllContent,
  } = ctx;
  const groups = useStudentGroups();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [showCover, setShowCover] = useState(false);
  const set = (patch) => setNewContent({ ...newContent, ...patch });
  const t = typeOf(newContent.type);
  const isExam = newContent.type === 'interactive_exam';
  const contentAudience = newContent?.audience || defaultAudience(newContent?.grade);
  const setContentAudience = (v) => set({ audience: v, audienceFields: resolveAudience(v, activeUsersList || [], groups), allowedEmails: '' });
  const setGrade = (grade) => {
    const a = newContent?.audience;
    const follow = !a || (a.mode === 'grades' && (a.grades || []).length <= 1);
    set({ grade, ...(follow ? { audience: undefined, audienceFields: undefined } : {}) });
  };
  const reach = useMemo(() => resolveAudience(contentAudience, activeUsersList || [], groups), [contentAudience, activeUsersList, groups]);

  const counts = useMemo(() => {
    const c = { all: contentList.length };
    TABS.forEach((x) => { if (x.match) c[x.key] = contentList.filter(x.match).length; });
    return c;
  }, [contentList]);
  const shown = filteredContentList.filter((c) => {
    const m = TABS.find((x) => x.key === tab)?.match;
    if (m && !m(c)) return false;
    return !q.trim() || String(c.title || '').includes(q.trim());
  });

  return (
    <div className="apl acn">
      <div className="apl-kpis">
        <button type="button" className="apl-kpi" onClick={() => setTab('video')}><span><Icon name="video" />فيديوهات</span><b>{n(counts.video)}</b></button>
        <button type="button" className="apl-kpi" onClick={() => setTab('files')}><span><Icon name="fileText" />ملفات وروابط</span><b>{n(counts.files)}</b></button>
        <button type="button" className="apl-kpi tone-info" onClick={() => setTab('exam')}><span><Icon name="exam" />امتحانات الحصة</span><b>{n(counts.exam)}</b></button>
        <button type="button" className="apl-kpi tone-gold" onClick={() => setTab('vip')}><span><Icon name="crown" />محتوى VIP</span><b>{n(counts.vip)}</b></button>
      </div>

      <form className="apl-section acn-form" onSubmit={handleAddContent}>
        <h3><Icon name="plus" />إضافة محتوى</h3>

        <Step no={1} title="نوع المحتوى">
          <div className="acn-types">
            {CONTENT_TYPES.map((x) => (
              <button key={x.key} type="button" className={`acn-type${newContent.type === x.key ? ' is-on' : ''}`} onClick={() => set({ type: x.key })}>
                <span className="acn-type__ico"><Icon name={x.icon} /></span>
                <b>{x.label}</b>
                <small>{x.hint}</small>
              </button>
            ))}
          </div>
          <p className="acn-where"><Icon name="eye" />هيظهر للطالب في: <b>{t.where}</b></p>
        </Step>

        <Step no={2} title="العنوان والملف">
          <label className="apl-field"><span>العنوان</span><input value={newContent.title} onChange={(e) => set({ title: e.target.value })} placeholder={isExam ? 'مثلاً: امتحان الحصة — المبتدأ والخبر' : 'العنوان اللي الطالب هيشوفه'} /></label>
          {newContent.type !== 'link' && (
            <label className={`acn-drop${isUploading ? ' is-busy' : ''}${!isUploading && uploadProgress === 100 ? ' is-done' : ''}`}>
              <input type="file" onChange={handleFileSelect} accept={['html', 'interactive_exam'].includes(newContent.type) ? '.html,.htm,text/html' : undefined} />
              <Icon name={!isUploading && uploadProgress === 100 ? 'checkCircle' : 'download'} />
              <b>{isUploading ? `بيترفع… ${n(uploadProgress)}٪` : uploadProgress === 100 ? 'الملف جاهز' : ['html', 'interactive_exam'].includes(newContent.type) ? 'ارفع ملف الـ HTML' : 'اضغط وارفع الملف'}</b>
              <small>{newContent.fileName || (isExam ? 'ملف .html معمول بالبرومت أو النموذج' : 'أو حط الرابط تحت')}</small>
              {isUploading && <i style={{ width: `${uploadProgress}%` }} />}
            </label>
          )}
          <label className="apl-field"><span>{newContent.type === 'link' ? 'الرابط' : 'أو رابط (اختياري)'}</span><input dir="ltr" value={newContent.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://" /></label>
        </Step>

        {(newContent.type === 'video' || isExam) && (
          <Step no={3} title={isExam ? 'وقت الامتحان' : 'إعدادات الفيديو'}>
            {isExam ? (
              <>
                <div className="acn-grid">
                  <label className="apl-field"><span>المدة بالدقايق</span><input type="number" min="0" value={newContent.examDurationMinutes || ''} onChange={(e) => set({ examDurationMinutes: e.target.value })} placeholder="فاضية = من غير وقت" /></label>
                  <label className="apl-field"><span>متاح لحد (اختياري)</span><input type="datetime-local" value={newContent.availableUntil || ''} onChange={(e) => set({ availableUntil: e.target.value })} /></label>
                </div>
                <p className="apl-note"><Icon name="shield" />محاولة واحدة لكل طالب، ولما الوقت يخلص بيتسلّم لوحده. لو الطالب خرج من الشاشة: أول مرة تحذير، والتانية حظر مايتفكش غير من «النتائج».</p>
              </>
            ) : (
              <>
                <div className="acn-grid">
                  <label className="apl-field"><span>قسم الفيديو</span>
                    <select value={newContent.videoSection || 'explanation'} onChange={(e) => set({ videoSection: e.target.value })}>
                      <option value="explanation">شرح الدرس</option><option value="exercises">حل التدريبات</option><option value="reviews">مراجعة نهائية</option>
                    </select>
                  </label>
                  <label className="apl-field"><span>مدة الفيديو بالدقايق</span><input type="number" min="1" value={newContent.estimatedDurationMinutes || ''} onChange={(e) => set({ estimatedDurationMinutes: e.target.value })} placeholder="مثلاً 30" /></label>
                  <label className="apl-field acn-span2"><span>امتحان بعد الفيديو (اختياري)</span>
                    <select value={newContent.linkedExamId || ''} onChange={(e) => set({ linkedExamId: e.target.value })}>
                      <option value="">من غير امتحان</option>
                      {examsList.filter((e) => !newContent.grade || e.grade === newContent.grade).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  </label>
                  <label className="apl-field acn-span2"><span>أجزاء المحاضرة (اختياري)</span>
                    <textarea rows={3} value={newContent.chaptersText || ''} onChange={(e) => set({ chaptersText: e.target.value })} placeholder={'سطر لكل جزء: الوقت وبعده العنوان\n00:00 مقدمة\n2:00 أنواع التشبيه'} />
                  </label>
                </div>
                {newContent.linkedExamId && <p className="apl-note"><Icon name="info" />زرار الامتحان مش هيظهر غير بعد ما الطالب يتفرج على {n(VIDEO_EXAM_UNLOCK_PERCENT)}٪ من الفيديو، فاكتب المدة صح.</p>}
              </>
            )}
          </Step>
        )}

        <Step no={newContent.type === 'video' || isExam ? 4 : 3} title="مين يشوفه؟">
          <div className="acn-grid">
            <label className="apl-field"><span>الصف</span><select value={newContent.grade} onChange={(e) => setGrade(e.target.value)}><GradeOptions /></select></label>
            <div className="apl-field"><span>الوصول</span>
              <div className="acn-seg">
                <button type="button" className={!newContent.isPremium ? 'is-on' : ''} onClick={() => set({ isPremium: false })}><Icon name="users" />للكل (مجاني ومشترك)</button>
                <button type="button" className={newContent.isPremium ? 'is-on is-gold' : ''} onClick={() => set({ isPremium: true })}><Icon name="crown" />VIP بس</button>
              </div>
            </div>
          </div>
          <AudiencePicker title="مين يشوف المحتوى ده؟" value={contentAudience} onChange={setContentAudience} users={activeUsersList || []} groups={groups} compact />
          <label className="aas-check"><input type="checkbox" checked={!!newContent.isPublic} onChange={(e) => set({ isPublic: e.target.checked })} /><span>يظهر كمان للزوار في الصفحة الرئيسية</span></label>
        </Step>

        <button type="button" className="acn-more" onClick={() => setShowCover((v) => !v)}><Icon name={showCover ? 'chevronDown' : 'chevronLeft'} />صورة الغلاف (اختياري)</button>
        {showCover && (
          <div className="acn-cover">
            <label className="apl-field"><span>رابط الصورة</span><input dir="ltr" value={newContent.thumbnailUrl || ''} onChange={(e) => set({ thumbnailUrl: e.target.value })} placeholder="https://" /></label>
            <label className="apl-btn"><Icon name="download" />ارفع صورة<input type="file" accept="image/*" hidden onChange={handleVideoThumbnailSelect} /></label>
            {newContent.thumbnailUrl && <ImageFitControls imageUrl={newContent.thumbnailUrl} value={newContent.imagePlacement} onChange={(v) => set({ imagePlacement: v })} title="تظبيط الصورة جوه الإطار" />}
          </div>
        )}

        <div className="acn-submit">
          <div className="acn-summary">
            <span className="apl-chip"><Icon name={t.icon} />{t.label}</span>
            <span className="apl-chip"><Icon name="eye" />{t.where}</span>
            <span className={`apl-chip${newContent.isPremium ? ' is-gold' : ''}`}><Icon name={newContent.isPremium ? 'crown' : 'users'} />{newContent.isPremium ? 'VIP بس' : 'للكل'}</span>
            {reach.count ? <span className="apl-chip"><Icon name="user" />{n(reach.count)} طالب</span> : null}
          </div>
          <button className="apl-btn apl-btn--pri" disabled={isUploading}><Icon name="rocket" />نشر</button>
        </div>
      </form>

      <section className="apl-section">
        <div className="apl-bar">
          <div className="aas-seg" role="tablist">
            {TABS.map((x) => <button key={x.key} type="button" className={tab === x.key ? 'is-on' : ''} onClick={() => setTab(x.key)}>{x.label}{counts[x.key] ? <i>{n(counts[x.key])}</i> : null}</button>)}
          </div>
          <span className="apl-sp" />
          <label className="apl-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر بالعنوان" /></label>
        </div>
        <div className="apl-list">
          {shown.map((c) => {
            const ct = typeOf(c.type);
            const targeted = (c.allowedEmails && c.allowedEmails.length > 0) || (c.audience && !(c.audience.mode === 'grades' && (c.audience.grades || []).length <= 1));
            return (
              <div key={c.id} className="acn-row">
                <span className={`acn-row__ico t-${c.type}`}><Icon name={ct.icon} /></span>
                <div className="acn-row__main">
                  <b>{c.title || 'من غير عنوان'}</b>
                  <div className="aas-tags">
                    <span className="apl-chip"><Icon name="eye" />{ct.where}</span>
                    <span className="apl-chip">{getGradeLabel(c.grade) || c.grade}</span>
                    {c.type === 'video' && <span className="apl-chip">{c.videoSection === 'exercises' ? 'حل تدريبات' : c.videoSection === 'reviews' ? 'مراجعة' : 'شرح'}</span>}
                    {c.type === 'interactive_exam' && <span className="apl-chip"><Icon name="clock" />{Number(c.examDurationMinutes) > 0 ? `${n(c.examDurationMinutes)} دقيقة` : 'من غير وقت'}</span>}
                    <span className={`apl-chip${c.isPremium ? ' is-gold' : ''}`}><Icon name={c.isPremium ? 'crown' : 'users'} />{c.isPremium ? 'VIP بس' : 'للكل'}</span>
                    {targeted && <span className="apl-chip"><Icon name="lock" />{audienceLabel(c, { gradeLabel: getGradeLabel, groups })}</span>}
                    {c.isPublic && <span className="apl-chip"><Icon name="external" />للزوار</span>}
                  </div>
                </div>
                <div className="apl-acts">
                  <button type="button" className="apl-btn" onClick={() => openFullContentEditor(c)}><Icon name="edit" />تعديل</button>
                  <button type="button" className="apl-icon" title="حذف" onClick={() => handleDeleteContent(c.id)}><Icon name="close" /></button>
                </div>
              </div>
            );
          })}
          {!shown.length && <div className="apl-empty"><Icon name="layers" />مفيش محتوى هنا</div>}
        </div>
        {contentList.length > 0 && <div className="acn-danger"><button type="button" className="apl-btn apl-btn--danger" onClick={handleDeleteAllContent}><Icon name="alert" />حذف كل المحتوى</button></div>}
      </section>
    </div>
  );
}
