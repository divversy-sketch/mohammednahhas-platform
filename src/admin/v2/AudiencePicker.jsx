// «مين يشوف ده؟»: كل الطلبة · صفوف · مجموعات · طلبة بالاسم — وبيبين هيوصل لكام طالب.
import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@services/firebase';
import { Icon } from '@v2/ui/Icon.jsx';
import { formatNumber } from '@v2/ui/kit.jsx';
import { GRADE_OPTIONS, getGradeLabel } from '@shared/constants/grades';
import { AUDIENCE_MODES, audienceStudents } from '@shared/audience/audience.js';
import '@styles/pages/admin-audience.css';

export function useStudentGroups() {
  const [groups, setGroups] = useState([]);
  useEffect(() => onSnapshot(query(collection(db, 'student_groups')), (s) => setGroups(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setGroups([])), []);
  return groups;
}

const ICONS = { all: 'users', grades: 'grade', groups: 'layers', students: 'user' };

export default function AudiencePicker({ value, onChange, users = [], groups: groupsProp, title = 'مين يشوف ده؟', compact = false }) {
  const ownGroups = useStudentGroups();
  const groups = groupsProp || ownGroups;
  const a = { mode: 'all', grades: [], groupIds: [], studentIds: [], ...(value || {}) };
  const set = (patch) => onChange({ ...a, ...patch });
  const [q, setQ] = useState('');
  const students = useMemo(() => users.filter((u) => (u.role || 'student') === 'student'), [users]);
  const count = useMemo(() => audienceStudents(a, students, groups).length, [a.mode, a.grades, a.groupIds, a.studentIds, students, groups]); // eslint-disable-line react-hooks/exhaustive-deps
  const gradeList = useMemo(() => {
    const fromUsers = new Set(students.map((u) => u.grade).filter(Boolean));
    const known = (GRADE_OPTIONS || []).map((g) => (typeof g === 'string' ? g : g.value || g.key)).filter(Boolean);
    return [...new Set([...known, ...fromUsers])];
  }, [students]);
  const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const found = useMemo(() => {
    const t = q.trim();
    if (!t) return [];
    return students.filter((u) => `${u.name || ''} ${u.phone || ''} ${u.email || ''}`.includes(t)).slice(0, 30);
  }, [q, students]);
  const picked = students.filter((u) => a.studentIds.includes(u.id || u.uid));

  return (
    <div className={`aud ${compact ? 'is-compact' : ''}`}>
      <div className="aud-head"><b><Icon name="target" />{title}</b><em className={count ? '' : 'is-zero'}><Icon name="users" />هيوصل لـ {formatNumber(count)} طالب</em></div>
      <div className="aud-modes" role="radiogroup">
        {AUDIENCE_MODES.map((m) => (
          <button key={m.key} type="button" role="radio" aria-checked={a.mode === m.key} className={a.mode === m.key ? 'is-on' : ''} onClick={() => set({ mode: m.key })}>
            <Icon name={ICONS[m.key]} /><span><b>{m.label}</b><small>{m.hint}</small></span>
          </button>
        ))}
      </div>

      {a.mode === 'grades' && (
        <div className="aud-chips">
          {gradeList.map((g) => <button key={g} type="button" className={a.grades.includes(g) ? 'is-on' : ''} onClick={() => set({ grades: toggle(a.grades, g) })}>{a.grades.includes(g) && <Icon name="check" />}{getGradeLabel(g) || g}<small>{formatNumber(students.filter((u) => u.grade === g).length)}</small></button>)}
        </div>
      )}

      {a.mode === 'groups' && (
        groups.length ? (
          <div className="aud-chips">
            {groups.map((g) => <button key={g.id} type="button" className={a.groupIds.includes(g.id) ? 'is-on' : ''} onClick={() => set({ groupIds: toggle(a.groupIds, g.id) })}>{a.groupIds.includes(g.id) && <Icon name="check" />}{g.name || g.title || 'مجموعة'}<small>{formatNumber((g.members || []).length)}</small></button>)}
          </div>
        ) : <p className="aud-hint">مفيش مجموعات لسه. اعملها من «الطلاب ← المجموعات والدفعات».</p>
      )}

      {a.mode === 'students' && (
        <div className="aud-students">
          <label className="aud-search"><Icon name="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب اسم الطالب أو رقمه" /></label>
          {found.length > 0 && (
            <div className="aud-found">
              {found.map((u) => {
                const id = u.id || u.uid; const on = a.studentIds.includes(id);
                return <button key={id} type="button" className={on ? 'is-on' : ''} onClick={() => set({ studentIds: toggle(a.studentIds, id) })}><i>{on ? <Icon name="check" /> : <Icon name="plus" />}</i><span><b>{u.name || u.email}</b><small>{getGradeLabel(u.grade) || ''}{u.phone ? ` · ${u.phone}` : ''}</small></span></button>;
              })}
            </div>
          )}
          {q.trim() && !found.length && <p className="aud-hint">مفيش طالب بالاسم ده.</p>}
          {picked.length > 0 && (
            <div className="aud-picked">
              {picked.map((u) => { const id = u.id || u.uid; return <span key={id}>{u.name || u.email}<button type="button" onClick={() => set({ studentIds: a.studentIds.filter((x) => x !== id) })} aria-label="شيل"><Icon name="close" /></button></span>; })}
            </div>
          )}
        </div>
      )}
      {a.mode === 'groups' && a.groupIds.length > 0 && <p className="aud-hint">الطلبة اللي في المجموعة دلوقتي هما اللي هيشوفوه. لو ضفت طالب للمجموعة بعد كده، عدّل العنصر عشان يوصله.</p>}
    </div>
  );
}
