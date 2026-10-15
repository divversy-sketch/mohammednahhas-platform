import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@services/firebase';
import { VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';
import { Icon } from '../../ui/Icon.jsx';
import { Bar, Button, Chip, Empty, Skeleton, formatNumber } from '../../ui/kit.jsx';
import { arabicDateTime, normalizeArabic, orderOf, titleOf, toDate } from '../insights.js';
import { FileRow, LessonCard, SectionHead } from '../parts.jsx';
import { Embed, StudentCoursesHub } from '../embeds.jsx';

function FilterBar({ q, setQ, placeholder, children }) {
  return (
    <div className="nx-filter">
      <label className="nx-input nx-filter__search">
        <Icon name="search" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
        {q && <button type="button" className="nx-iconbtn nx-iconbtn--plain" aria-label="مسح" onClick={() => setQ('')}><Icon name="close" /></button>}
      </label>
      {children}
    </div>
  );
}

const match = (q) => {
  const needle = normalizeArabic(q);
  return (item) => !needle || normalizeArabic(`${titleOf(item, '')} ${item.description || ''}`).includes(needle);
};

function Lectures({ ctx }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const sorted = useMemo(() => [...(ctx.videos || [])].sort((a, b) => orderOf(a) - orderOf(b)), [ctx.videos]);
  const list = sorted.filter(match(q)).filter((v) => {
    const pct = ctx.getVideoWatchPercent(v) || 0;
    if (filter === 'todo') return pct < 95;
    if (filter === 'done') return pct >= 95;
    return true;
  });
  const linked = sorted.filter((v) => v.linkedExamId);
  return (
    <div className="nx-stack">
      <FilterBar q={q} setQ={setQ} placeholder="دوّر في المحاضرات">
        <div className="nx-choice" role="group" aria-label="فلترة">
          {[['all', 'الكل'], ['todo', 'لسه ما خلصتهاش'], ['done', 'خلصتها']].map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </FilterBar>
      {list.length
        ? <div className="nx-grid nx-stagger">{list.map((v, i) => <LessonCard key={v.id} item={v} ctx={ctx} index={i} />)}</div>
        : <Empty icon="video" title={q ? 'مفيش محاضرة بالاسم ده' : 'مفيش محاضرات هنا'} text={q ? 'جرّب كلمة تانية.' : 'أول ما المحاضرات تنزل لصفّك هتظهر هنا.'} />}
      {linked.length > 0 && (
        <section className="nx-card nx-sec">
          <SectionHead title="امتحانات المحاضرات" icon="exam" />
          <p className="muted" style={{ fontSize: 'var(--nx-fs-s)' }}>كل امتحان بيفتح لما تتفرج على {formatNumber(VIDEO_EXAM_UNLOCK_PERCENT)}٪ من المحاضرة بتاعته.</p>
          <div className="nx-list">
            {linked.map((v) => {
              const pct = Math.round(ctx.getVideoWatchPercent(v) || 0);
              const open = ctx.canOpenLinkedExam(v);
              return (
                <div key={v.id} className="nx-row">
                  <span className={`nx-tile ${open ? 'nx-tile--patina' : ''}`}><Icon name={open ? 'exam' : 'lock'} /></span>
                  <span className="nx-row__main">
                    <span className="nx-row__title">{titleOf(v, 'محاضرة')}</span>
                    <Bar value={Math.min(100, (pct / VIDEO_EXAM_UNLOCK_PERCENT) * 100)} tone={open ? 'patina' : undefined} />
                  </span>
                  <Button variant={open ? 'pri' : 'soft'} size="s" onClick={() => (open ? ctx.openLinkedExamFromVideo(v) : ctx.handlePremiumClick(() => ctx.setPlayingVideo(v)))}>
                    {open ? 'ادخل الامتحان' : `كمّل (${formatNumber(pct)}٪)`}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Interactive({ ctx }) {
  const [q, setQ] = useState('');
  const list = [...(ctx.htmls || []), ...(ctx.interactiveExams || [])].sort((a, b) => orderOf(a) - orderOf(b)).filter(match(q));
  return (
    <div className="nx-stack">
      <FilterBar q={q} setQ={setQ} placeholder="دوّر في الدروس التفاعلية" />
      {list.length
        ? <div className="nx-grid nx-stagger">{list.map((v, i) => <LessonCard key={v.id} item={v} ctx={ctx} kind="html" index={i + 3} />)}</div>
        : <Empty icon="interactive" title="مفيش دروس تفاعلية" text="الأنشطة والدروس التفاعلية هتظهر هنا أول ما تنزل." />}
    </div>
  );
}

function Files({ ctx }) {
  const [q, setQ] = useState('');
  const all = (ctx.filesAndLinks || []).filter(match(q));
  const files = all.filter((f) => f.type !== 'link');
  const links = all.filter((f) => f.type === 'link');
  return (
    <div className="nx-stack">
      <FilterBar q={q} setQ={setQ} placeholder="دوّر في الملفات والمذكرات" />
      {!all.length && <Empty icon="fileText" title={q ? 'مفيش ملف بالاسم ده' : 'مفيش ملفات لسه'} text={q ? 'جرّب كلمة تانية.' : 'المذكرات والملخصات هتنزل هنا.'} />}
      {files.length > 0 && <section className="nx-card nx-sec"><SectionHead title="ملفات ومذكرات" icon="fileText" count={files.length} /><div className="nx-list nx-stagger">{files.map((f) => <FileRow key={f.id} item={f} />)}</div></section>}
      {links.length > 0 && <section className="nx-card nx-sec"><SectionHead title="روابط مفيدة" icon="link" count={links.length} /><div className="nx-list nx-stagger">{links.map((f) => <FileRow key={f.id} item={f} />)}</div></section>}
    </div>
  );
}

function Live({ ctx }) {
  const [classes, setClasses] = useState(null);
  const grade = ctx.userData?.grade;
  useEffect(() => onSnapshot(
    query(collection(db, 'live_classes'), orderBy('startsAt', 'desc'), limit(50)),
    (snap) => setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => setClasses([]),
  ), []);
  if (classes === null) return <div className="nx-card nx-stack"><Skeleton h={20} w="40%" /><Skeleton h={64} r={16} /><Skeleton h={64} r={16} /></div>;
  const mine = classes.filter((c) => ['all', grade].includes(c.grade || 'all'));
  const live = mine.filter((c) => c.status === 'live');
  const upcoming = mine.filter((c) => c.status !== 'live' && c.status !== 'completed' && (toDate(c.startsAt)?.getTime() || 0) > Date.now() - 3 * 3600e3).reverse();
  const past = mine.filter((c) => c.status === 'completed' || (!live.includes(c) && !upcoming.includes(c)));
  if (!mine.length) return <Empty icon="live" title="مفيش حصص لايف دلوقتي" text="أول ما المستر يحدد حصة لايف لصفّك هتلاقي ميعادها ورابطها هنا." />;
  const Row = ({ item, mode }) => (
    <div className="nx-row">
      <span className={`nx-tile ${mode === 'live' ? 'nx-tile--danger' : mode === 'upcoming' ? 'nx-tile--copper' : ''}`}><Icon name={mode === 'past' ? 'video' : 'live'} /></span>
      <span className="nx-row__main">
        <span className="nx-row__title">{item.title || 'حصة لايف'}</span>
        <span className="nx-row__sub">{arabicDateTime(item.startsAt)} · {formatNumber(item.duration || 60)} دقيقة</span>
      </span>
      {mode === 'past'
        ? (item.recordingUrl ? <Button size="s" variant="soft" href={item.recordingUrl} icon="play">التسجيل</Button> : <Chip>انتهت</Chip>)
        : <Button size="s" variant={mode === 'live' ? 'pri' : 'soft'} href={item.meetingUrl} disabled={!item.meetingUrl} icon="external">{mode === 'live' ? 'ادخل دلوقتي' : 'الرابط'}</Button>}
    </div>
  );
  return (
    <div className="nx-stack">
      {live.length > 0 && <section className="nx-card nx-sec nx-live-now"><SectionHead title="شغّالة دلوقتي" icon="live" /><div className="nx-list">{live.map((c) => <Row key={c.id} item={c} mode="live" />)}</div></section>}
      {upcoming.length > 0 && <section className="nx-card nx-sec"><SectionHead title="الحصص الجاية" icon="calendar" /><div className="nx-list">{upcoming.map((c) => <Row key={c.id} item={c} mode="upcoming" />)}</div></section>}
      {past.length > 0 && <section className="nx-card nx-sec"><SectionHead title="حصص فاتت وتسجيلاتها" icon="video" /><div className="nx-list">{past.slice(0, 12).map((c) => <Row key={c.id} item={c} mode="past" />)}</div></section>}
    </div>
  );
}

export default function LearnView({ ctx, route }) {
  switch (route.sub) {
    case 'courses':
      return <Embed><StudentCoursesHub user={ctx.user} userData={ctx.userData} exams={ctx.exams} onStartExam={(exam) => ctx.startExamWithCode(exam)} /></Embed>;
    case 'interactive': return <Interactive ctx={ctx} />;
    case 'files': return <Files ctx={ctx} />;
    case 'live': return <Live ctx={ctx} />;
    default: return <Lectures ctx={ctx} />;
  }
}
