import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { getGradeLabel } from '@shared/constants/grades';
import { Icon } from '../ui/Icon.jsx';
import { Empty, Skeleton, formatNumber } from '../ui/kit.jsx';

const MEDALS = ['gold', 'neutral', 'copper'];

/** Top students of the same grade, read from leaderboard_entries (filled by a Cloud Function). */
export default function Leaderboard({ ctx }) {
  const grade = ctx.userData?.grade || '';
  const uid = ctx.user?.uid;
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!grade) return undefined;
    const q = query(collection(db, 'leaderboard_entries'), where('grade', '==', grade), orderBy('rankScore', 'desc'), limit(30));
    return onSnapshot(q, (snap) => { setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setFailed(false); }, () => { setFailed(true); setRows([]); });
  }, [grade]);

  if (rows === null) return <div className="nx-card nx-stack"><Skeleton h={22} w="40%" />{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={48} r={14} />)}</div>;
  if (failed || !rows.length) {
    return <Empty icon="trophy" title="لوحة الشرف لسه بتتجهز" text={failed ? 'لوحة الشرف هتظهر أول ما الإدارة تفعّلها.' : `أول ما طلاب ${getGradeLabel(grade)} يخلصوا امتحانات هتظهر الترتيبات هنا.`} />;
  }
  const mine = rows.findIndex((r) => r.id === uid);
  const podium = rows.slice(0, 3);
  return (
    <div className="nx-stack">
      <section className="nx-night nx-card" style={{ overflow: 'hidden' }}>
        <span className="nx-night__glow" aria-hidden="true" />
        <div className="nx-stack" style={{ gap: 6 }}>
          <span className="muted" style={{ fontSize: 'var(--nx-fs-s)' }}>{getGradeLabel(grade)}</span>
          <h2 style={{ fontSize: 'var(--nx-fs-xl)', fontWeight: 700 }}>أوائل الدفعة</h2>
          <p className="dim" style={{ fontSize: 'var(--nx-fs-s)' }}>{mine >= 0 ? `ترتيبك ${formatNumber(mine + 1)} من ${formatNumber(rows.length)}. كمّل كده.` : 'خلّص امتحاناتك عشان يظهر اسمك هنا.'}</p>
        </div>
        <div className="nx-podium">
          {[podium[1], podium[0], podium[2]].map((row, i) => row && (
            <div key={row.id} className={`nx-podium__col nx-podium__col--${[2, 1, 3][i]}`}>
              <span className={`nx-avatar nx-avatar--medal-${MEDALS[[1, 0, 2][i]]}`}>{String(row.displayName || '؟').charAt(0)}</span>
              <b>{row.displayName}</b>
              <span>{formatNumber(row.average)}٪</span>
              <i>{formatNumber([2, 1, 3][i])}</i>
            </div>
          ))}
        </div>
      </section>
      <section className="nx-card">
        <div className="nx-list nx-stagger">
          {rows.map((row, i) => (
            <div key={row.id} className={`nx-row ${row.id === uid ? 'is-me' : ''}`}>
              <span className="nx-rank">{i < 3 ? <Icon name="medal" /> : formatNumber(i + 1)}</span>
              <span className="nx-row__main">
                <span className="nx-row__title">{row.displayName}{row.id === uid ? ' (إنت)' : ''}</span>
                <span className="nx-row__sub">{formatNumber(row.completed)} امتحان</span>
              </span>
              <b>{formatNumber(row.average)}٪</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
