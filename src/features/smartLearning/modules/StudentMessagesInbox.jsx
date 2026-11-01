// «رسائلي» عند الطالب — رسائل الإدارة (للكل أو ليه هو/مجموعته/صفه).
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { Icon } from '@v2/ui/Icon.jsx';
import '@styles/pages/admin-people.css';

const when = (v) => {
  const d = v?.toDate ? v.toDate() : v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString('ar-EG', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }) : '';
};
function mergeMessages(oldRows, newRows) {
  const map = new Map([...oldRows, ...newRows].map((x) => [x.id, x]));
  return [...map.values()].filter((m) => m.kind !== 'support').sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export function StudentMessagesInbox({ user }) {
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!user?.uid) return undefined;
    const add = (snap) => { setMessages((prev) => mergeMessages(prev, snap.docs.map((d) => ({ id: d.id, ...d.data() })))); setReady(true); };
    const fail = () => setReady(true);
    const unsubs = [
      onSnapshot(query(collection(db, 'student_messages'), where('audience', '==', 'all')), add, fail),
      onSnapshot(query(collection(db, 'student_messages'), where('userIds', 'array-contains', user.uid)), add, fail),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user?.uid]);

  return (
    <div className="apl smi" dir="rtl">
      <h3 className="smi-h"><Icon name="message" />رسائل من الإدارة{messages.length ? <span className="apl-count">{messages.length.toLocaleString('ar-EG')}</span> : null}</h3>
      {messages.map((m) => (
        <article key={m.id} className={`amc-msg${m.priority === 'high' ? ' is-high' : ''}`}>
          <header><b>{m.priority === 'high' ? <Icon name="alert" /> : null}{m.title || 'رسالة'}</b></header>
          <p>{m.body}</p>
          <footer><small className="dim">{when(m.createdAt)}</small></footer>
        </article>
      ))}
      {ready && !messages.length && <div className="apl-empty"><Icon name="message" />مفيش رسائل لحد دلوقتي</div>}
    </div>
  );
}

export default StudentMessagesInbox;
