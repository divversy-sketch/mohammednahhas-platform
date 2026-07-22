import { useEffect, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import './smart-teacher.css';

const normalize = (value = '') => String(value)
  .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[ًٌٍَُِّْـ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

export default function SmartVideoCheckpoint({ video, videoRef }) {
  const [group, setGroup] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [show, setShow] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [wrong, setWrong] = useState(0);
  const passed = useRef(new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      const lesson = video?.lesson || video?.topic || video?.title;
      if (!lesson) return;
      const groupSnapshot = await getDocs(query(collection(db, 'content'), where('contentType', '==', 'smart_teacher_group')));
      const matchedGroup = groupSnapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .find((item) => item.status !== 'disabled' && normalize(item.lesson) === normalize(lesson));
      if (!matchedGroup || !alive) return;
      setGroup(matchedGroup);
      const questionSnapshot = await getDocs(query(collection(db, 'content'), where('contentType', '==', 'smart_teacher_question')));
      const pool = questionSnapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => item.smartTeacherGroupId === matchedGroup.id)
        .sort(() => Math.random() - 0.5);
      if (alive) setQuestions(pool);
    })().catch(() => {});
    return () => { alive = false; };
  }, [video?.id, video?.lesson, video?.topic, video?.title]);

  useEffect(() => {
    const element = videoRef?.current;
    if (!element || !group || !questions.length) return undefined;
    const handleTime = () => {
      const percentage = element.duration ? Math.round((element.currentTime / element.duration) * 100) : 0;
      const checkpoint = (group.checkpoints || [25, 50, 75]).find((point) => percentage >= point && !passed.current.has(point));
      if (checkpoint) {
        passed.current.add(checkpoint);
        element.pause();
        setShow(true);
        setQIndex((value) => (value + 1) % questions.length);
      }
    };
    element.addEventListener('timeupdate', handleTime);
    return () => element.removeEventListener('timeupdate', handleTime);
  }, [videoRef, group, questions]);

  if (!show || !questions[qIndex]) return null;
  const question = questions[qIndex];
  const answer = (optionIndex) => {
    if (optionIndex === question.correctIdx) {
      setShow(false);
      setWrong(0);
      videoRef.current?.play?.();
    } else {
      setWrong((value) => value + 1);
      setQIndex((value) => (value + 1) % questions.length);
    }
  };

  return <div className="st-video-gate" dir="rtl"><div><span className="st-mini-logo">ن✦</span><small>{question.sectionTitle || group.lesson}</small><h3>سؤال سريع قبل استكمال الشرح</h3><p>{question.text}</p><div>{(question.options || []).map((option, optionIndex) => <button key={optionIndex} onClick={() => answer(optionIndex)}>{option}</button>)}</div>{wrong >= 1 && group.hint && <small>💡 {group.hint}</small>}{wrong >= 2 && group.rule && <small>📘 {group.rule}</small>}</div></div>;
}
