import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import nahhasLogo from '@assets/nahhas-logo-transparent.png';
import './smart-teacher.css';

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const normalize = (value = '') => String(value)
  .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[ًٌٍَُِّْـ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const matchesText = (queryText, values = []) => {
  const queryValue = normalize(queryText);
  if (!queryValue) return true;
  return values.some((value) => {
    const normalizedValue = normalize(value);
    return normalizedValue.includes(queryValue) || queryValue.includes(normalizedValue);
  });
};

export default function StudentSmartTeacherPopup({ user, userData }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [active, setActive] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [wrong, setWrong] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!userData?.grade) return undefined;
    const groupsQuery = query(collection(db, 'content'), where('contentType', '==', 'smart_teacher_group'));
    return onSnapshot(groupsQuery, (snapshot) => {
      const allowed = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((group) => group.status !== 'disabled')
        .filter((group) => {
          const grades = Array.isArray(group.grades) ? group.grades : [group.grade].filter(Boolean);
          return grades.includes(userData.grade);
        });
      setGroups(allowed);
    }, () => setGroups([]));
  }, [userData?.grade]);

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return [];
    const results = [];
    groups.forEach((group) => {
      (group.sections || []).forEach((section) => {
        const values = [group.title, group.lesson, group.branch, section.title, ...(section.aliases || [])];
        if (matchesText(searchText, values)) results.push({ group, section });
      });
    });
    return results.slice(0, 12);
  }, [groups, searchText]);

  const start = async (group, section = null) => {
    setActive(group);
    setActiveSection(section);
    setIndex(0);
    setChoice(null);
    setWrong(0);
    setScore(0);
    setQuestions([]);
    try {
      const snapshot = await getDocs(query(collection(db, 'content'), where('contentType', '==', 'smart_teacher_question')));
      const pool = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((question) => question.smartTeacherGroupId === group.id)
        .filter((question) => !section || question.sectionId === section.id || normalize(question.sectionTitle) === normalize(section.title));
      setQuestions(shuffle(pool).slice(0, group.questionsPerSession || 10));
    } catch {
      setQuestions([]);
    }
  };

  const q = questions[index];
  const correct = choice !== null && choice === q?.correctIdx;

  const submit = async (optionIndex) => {
    setChoice(optionIndex);
    const isCorrect = optionIndex === q.correctIdx;
    if (isCorrect) setScore((value) => value + 1);
    else setWrong((value) => value + 1);
    try {
      await addDoc(collection(db, 'smart_teacher_attempts'), {
        studentId: user.uid,
        groupId: active.id,
        sectionId: q.sectionId || activeSection?.id || '',
        sectionTitle: q.sectionTitle || activeSection?.title || '',
        questionId: q.bankQuestionId || q.id,
        correct: isCorrect,
        createdAt: serverTimestamp(),
      });
    } catch {
      // التدريب يظل يعمل حتى لو تعذر حفظ الإحصائية لحظيًا.
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setActive({ ...active, finished: true });
      return;
    }
    setIndex((value) => value + 1);
    setChoice(null);
    setWrong(0);
  };

  const resetSelection = () => {
    setActive(null);
    setActiveSection(null);
    setQuestions([]);
    setSearchText('');
  };

  return <>
    <button className="st-fab" onClick={() => setOpen(true)}><span>ن✦</span><b>المعلم الذكي</b></button>
    {open && <div className="st-modal-backdrop" onClick={() => setOpen(false)}><section className="st-modal" onClick={(event) => event.stopPropagation()} dir="rtl">
      <button className="st-close" onClick={() => setOpen(false)}>×</button>
      <header><img src={nahhasLogo} alt="" /><div><small>تدريب يتطور مع مستواك</small><h2>المعلم الذكي</h2><p>أهلًا يا {userData?.name || 'بطل'}، اكتب الجزئية التي تريد التدريب عليها.</p></div></header>

      {!active ? <>
        <div className="st-smart-search"><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="مثال: إعمال اسم الفاعل، صياغة اسم الفاعل..." /><span>اكتب اسم الدرس أو الجزئية أو السؤال الذي تبحث عنه</span></div>
        {searchText.trim() && <div className="st-search-results">{searchResults.map(({ group, section }) => <button key={`${group.id}-${section.id}`} onClick={() => start(group, section)}><b>{section.title}</b><span>{group.lesson} • {group.branch}</span><small>{section.questionCount || 0} سؤال</small></button>)}{!searchResults.length && <p>لم أجد هذه الجزئية بالاسم المكتوب. جرّب كلمة أخرى من عنوان الدرس.</p>}</div>}
        {!searchText.trim() && <div className="st-student-groups">{groups.map((group) => <article key={group.id}><button className="st-group-main" onClick={() => start(group)}><b>{group.title}</b><span>{group.branch} • {group.lesson}</span><small>{group.questionCount || 0} سؤال متاح</small></button>{(group.sections || []).length > 0 && <div className="st-section-chips">{group.sections.map((section) => <button key={section.id} onClick={() => start(group, section)}>{section.title}</button>)}</div>}</article>)}{!groups.length && <p>لا توجد تدريبات منشورة لصفك الآن.</p>}</div>}
      </> : active.finished ? <div className="st-finish"><h3>أحسنت 👏</h3><p>أنهيت تدريب {activeSection?.title || active.lesson} بنتيجة {score} من {questions.length}</p><button onClick={resetSelection}>اختيار تدريب آخر</button></div> : q ? <div className="st-question"><div className="st-progress"><span>السؤال {index + 1} من {questions.length}</span><b>{q.sectionTitle || activeSection?.title || active.lesson}</b></div><h3>{q.text}</h3><div className="st-options">{(q.options || []).map((option, optionIndex) => <button disabled={choice !== null} className={choice !== null ? (optionIndex === q.correctIdx ? 'correct' : optionIndex === choice ? 'wrong' : '') : ''} onClick={() => submit(optionIndex)} key={optionIndex}>{option}</button>)}</div>{choice !== null && !correct && <div className="st-coach"><b>لسه هنحاول تاني</b>{wrong >= 1 && active.hint && <p>💡 {active.hint}</p>}{wrong >= 2 && active.rule && <p>📘 {active.rule}</p>}{wrong >= 2 && active.example && <p>مثال: {active.example}</p>}</div>}{choice !== null && correct && <button className="st-next" onClick={next}>إجابة صحيحة — التالي</button>}{choice !== null && !correct && <button className="st-next" onClick={() => { setChoice(null); setIndex((index + 1) % questions.length); }}>سؤال آخر من نفس الجزئية</button>}</div> : <p>لا توجد أسئلة كافية في هذه الجزئية بعد.</p>}
    </section></div>}
  </>;
}
