import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '@services/firebase';
import { getGradeLabel } from '@shared/constants/grades';
import {
  cleanImportedLine,
  parseMetaLine,
  parseOptionLine,
  parseQuestionBankLines,
  parseQuestionStart,
  readDocxParagraphs,
} from '@features/question-bank/utils/questionBankImport.js';
import { platformNotify } from '@shared/core/platformShared.jsx';
import './smart-teacher.css';

const GRADE_ITEMS = [
  { value: '1prep', label: 'الصف الأول الإعدادي' },
  { value: '2prep', label: 'الصف الثاني الإعدادي' },
  { value: '3prep', label: 'الصف الثالث الإعدادي' },
  { value: '1sec', label: 'الصف الأول الثانوي' },
  { value: '2sec', label: 'الصف الثاني الثانوي' },
  { value: '3sec', label: 'الصف الثالث الثانوي' },
];

const branches = ['النحو', 'البلاغة', 'الأدب', 'القصة', 'القراءة', 'التعبير'];
const normalize = (value = '') => cleanImportedLine(value)
  .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[ًٌٍَُِّْـ]/g, '').toLowerCase();

const explicitHeading = (text = '') => /^(?:عنوان|قسم|جزئية|قاعد(?:ة|ه)|أولًا|أولاً|ثانيًا|ثانياً|ثالثًا|ثالثاً|رابعًا|رابعاً|خامسًا|خامساً|سادسًا|سادساً|تدريبات|أسئلة|إعمال|صياغة|عمل|مفهوم|شروط|تمييز)\b/u.test(cleanImportedLine(text));
const stripHeadingPrefix = (text = '') => cleanImportedLine(text).replace(/^(?:عنوان|قسم|جزئية|قاعد(?:ة|ه))\s*[:：-]\s*/u, '');

function isHeadingLine(line, nextLine) {
  const text = cleanImportedLine(line?.text || '');
  if (!text || parseQuestionStart(text) || parseOptionLine(text) || parseMetaLine(text)) return false;
  if (/^(?:الإجابة|الاجابة|الحل|شرح|التعليل)\s*[:：-]/u.test(text)) return false;
  if (line?.isHeading || explicitHeading(text)) return true;
  const nextIsQuestion = Boolean(parseQuestionStart(nextLine?.text || ''));
  return nextIsQuestion && text.length <= 120 && !/[؟?]$/.test(text);
}

function sectionizeLines(lines = []) {
  const sections = [];
  let current = { title: 'تدريبات عامة على الدرس', aliases: [], lines: [] };
  const flush = () => {
    if (current.lines.length || sections.length === 0) sections.push(current);
  };
  lines.forEach((line, index) => {
    if (isHeadingLine(line, lines[index + 1])) {
      flush();
      const title = stripHeadingPrefix(line.text) || 'جزئية بدون عنوان';
      current = { title, aliases: [title], lines: [] };
      return;
    }
    current.lines.push(line);
  });
  flush();
  return sections.filter((section, index) => section.lines.length || index > 0);
}

function parseStructuredQuestions(lines, config) {
  const rawSections = sectionizeLines(lines);
  const questions = [];
  const rejected = [];
  const warnings = [];
  const sections = [];

  rawSections.forEach((section, sectionIndex) => {
    const result = parseQuestionBankLines(section.lines, config);
    const sectionId = `section_${sectionIndex + 1}`;
    const title = section.title || `الجزئية ${sectionIndex + 1}`;
    const aliases = Array.from(new Set([title, ...section.aliases].filter(Boolean)));
    sections.push({ id: sectionId, title, aliases, questionCount: result.questions?.length || 0 });
    (result.questions || []).forEach((question) => questions.push({
      ...question,
      sectionId,
      sectionTitle: title,
      sectionAliases: aliases,
    }));
    (result.rejected || []).forEach((item) => rejected.push({ ...item, sectionTitle: title }));
    warnings.push(...(result.warnings || []));
  });

  return { questions, rejected, warnings, sections: sections.filter((section) => section.questionCount > 0) };
}

export default function AdminSmartTeacherManager() {
  const [groups, setGroups] = useState([]);
  const [grades, setGrades] = useState(['3sec']);
  const [branch, setBranch] = useState('النحو');
  const [lesson, setLesson] = useState('');
  const [title, setTitle] = useState('');
  const [perSession, setPerSession] = useState(10);
  const [hint, setHint] = useState('');
  const [rule, setRule] = useState('');
  const [example, setExample] = useState('');
  const [commonMistake, setCommonMistake] = useState('');
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');

  useEffect(() => {
    const groupsQuery = query(collection(db, 'content'), where('contentType', '==', 'smart_teacher_group'));
    return onSnapshot(groupsQuery, (snapshot) => {
      setPermissionMessage('');
      setGroups(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, (error) => {
      setGroups([]);
      setPermissionMessage(error?.code === 'permission-denied'
        ? 'يلزم نشر قواعد Firestore المرفقة مرة واحدة لتفعيل الحفظ والقراءة.'
        : 'تعذر تحميل مجموعات المعلم الذكي مؤقتًا.');
    });
  }, []);

  const sectionLookup = useMemo(() => Object.fromEntries(sections.map((section) => [section.id, section])), [sections]);

  const parseLines = (lines) => {
    const result = parseStructuredQuestions(lines, {
      branchMode: 'manual',
      branch,
      grade: grades[0] || '3sec',
      difficulty: 'medium',
      tags: ['المعلم الذكي', lesson],
    });
    setParsed(result.questions || []);
    setRejected(result.rejected || []);
    setSections(result.sections || []);
    if (result.warnings?.length) platformNotify(`تم الاستيراد مع ${result.warnings.length} ملاحظة`);
    if (result.sections?.length > 1) platformNotify(`تم فهم ${result.sections.length} عناوين داخل الملف وربط الأسئلة بها.`);
  };

  const handlePaste = () => parseLines(raw.split(/\r?\n/).map((text) => ({ text })));
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (/\.docx$/i.test(file.name)) parseLines(await readDocxParagraphs(file));
      else parseLines((await file.text()).split(/\r?\n/).map((text) => ({ text })));
    } catch (error) {
      platformNotify(error.message || 'تعذر قراءة الملف', 'error');
    }
    event.target.value = '';
  };

  const toggleGrade = (grade) => setGrades((current) => current.includes(grade)
    ? current.filter((item) => item !== grade)
    : [...current, grade]);

  const updateSection = (id, key, value) => {
    setSections((current) => current.map((section) => section.id === id ? {
      ...section,
      [key]: key === 'aliases'
        ? value.split(/[،,\n]/).map((item) => cleanImportedLine(item)).filter(Boolean)
        : value,
    } : section));
    if (key === 'title') {
      setParsed((current) => current.map((question) => question.sectionId === id
        ? { ...question, sectionTitle: value }
        : question));
    }
  };

  const saveGroup = async () => {
    if (!lesson.trim() || !title.trim() || !grades.length || !parsed.length) {
      platformNotify('أكمل بيانات المجموعة واستورد الأسئلة أولًا', 'error');
      return;
    }
    setSaving(true);
    try {
      const groupRef = doc(collection(db, 'content'));
      const normalizedSections = sections.map((section) => ({
        ...section,
        title: cleanImportedLine(section.title),
        aliases: Array.from(new Set([
          section.title,
          ...(section.aliases || []),
          `${lesson} ${section.title}`,
          `${section.title} ${lesson}`,
        ].map(cleanImportedLine).filter(Boolean))),
      }));
      let batch = writeBatch(db);
      let operationCount = 0;
      batch.set(groupRef, {
        contentType: 'smart_teacher_group',
        title: title.trim(),
        branch,
        lesson: lesson.trim(),
        grades,
        questionsPerSession: Number(perSession) || 10,
        questionCount: parsed.length,
        hint: hint.trim(),
        rule: rule.trim(),
        example: example.trim(),
        commonMistake: commonMistake.trim(),
        sections: normalizedSections,
        status: 'published',
        interactiveVideoEnabled: true,
        checkpoints: [25, 50, 75],
        createdAt: serverTimestamp(),
      });
      operationCount += 1;

      for (const question of parsed) {
        if (operationCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
        const section = normalizedSections.find((item) => item.id === question.sectionId);
        const bankRef = doc(collection(db, 'question_bank'));
        const studentRef = doc(collection(db, 'content'));
        const shared = {
          ...question,
          grade: grades[0],
          grades,
          branch,
          topic: lesson.trim(),
          lesson: lesson.trim(),
          sectionTitle: section?.title || question.sectionTitle || 'تدريبات عامة',
          sectionAliases: section?.aliases || question.sectionAliases || [],
          smartTeacherGroupId: groupRef.id,
          smartTeacher: true,
          createdAt: serverTimestamp(),
        };
        batch.set(bankRef, shared);
        batch.set(studentRef, {
          contentType: 'smart_teacher_question',
          bankQuestionId: bankRef.id,
          ...shared,
        });
        operationCount += 2;
      }
      if (operationCount > 0) await batch.commit();

      setRaw(''); setParsed([]); setRejected([]); setSections([]);
      setTitle(''); setLesson(''); setHint(''); setRule(''); setExample(''); setCommonMistake('');
      platformNotify('تم نشر المجموعة بعناوينها وجزئياتها بنجاح');
    } catch (error) {
      const message = error?.code === 'permission-denied'
        ? 'صلاحيات Firebase غير منشورة. انشر ملف firestore.rules المرفق ثم أعد المحاولة.'
        : (error.message || 'تعذر الحفظ');
      platformNotify(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return <div className="st-admin" dir="rtl">
    <div className="st-admin-hero"><div className="st-logo">ن<span>✦</span></div><div><small>منصة النحاس</small><h2>المعلم الذكي</h2><p>يفهم عناوين ملفك ويقدم للطالب الجزئية التي يطلبها بالضبط.</p></div></div>
    {permissionMessage && <div className="st-permission-note"><b>تنبيه إعداد مرة واحدة</b><span>{permissionMessage}</span></div>}

    <section className="st-card">
      <div className="st-grid">
        <label>عنوان المجموعة<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="تدريبات اسم الفاعل" /></label>
        <label>الفرع<select value={branch} onChange={(event) => setBranch(event.target.value)}>{branches.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>اسم الدرس<input value={lesson} onChange={(event) => setLesson(event.target.value)} placeholder="اسم الفاعل" /></label>
        <label>عدد أسئلة الجلسة<input type="number" min="1" max="50" value={perSession} onChange={(event) => setPerSession(event.target.value)} /></label>
      </div>

      <div className="st-grade-box"><strong>تظهر للصفوف:</strong>{GRADE_ITEMS.map((grade) => <button type="button" key={grade.value} className={grades.includes(grade.value) ? 'active' : ''} onClick={() => toggleGrade(grade.value)}>{grade.label}</button>)}</div>

      <div className="st-help-grid">
        <label>التلميح العام<textarea value={hint} onChange={(event) => setHint(event.target.value)} placeholder="اسأل نفسك: من الذي قام بالفعل؟" /></label>
        <label>القاعدة المختصرة<textarea value={rule} onChange={(event) => setRule(event.target.value)} placeholder="يُصاغ اسم الفاعل..." /></label>
        <label>مثال<textarea value={example} onChange={(event) => setExample(event.target.value)} placeholder="كتب ← كاتب" /></label>
        <label>خطأ شائع<textarea value={commonMistake} onChange={(event) => setCommonMistake(event.target.value)} placeholder="الخلط بين اسم الفاعل واسم المفعول" /></label>
      </div>

      <div className="st-import"><h3>نفس مستورد بنك الأسئلة — مع فهم عناوين Word</h3><p>اجعل عناوين الجزئيات في Word بنمط Heading أو بخط عريض، أو اكتب مثلًا: «إعمال اسم الفاعل» ثم ضع أسئلته تحته.</p><textarea value={raw} onChange={(event) => setRaw(event.target.value)} placeholder={'الصق الملف كاملًا بعناوينه، مثال:\nصياغة اسم الفاعل\n1- ...\n2- ...\n\nإعمال اسم الفاعل\n3- ...'} /><div><button type="button" onClick={handlePaste}>تحليل النص والعناوين</button><label className="st-file">رفع Word أو TXT<input type="file" accept=".docx,.txt" onChange={handleFile} /></label></div></div>

      {sections.length > 0 && <div className="st-sections-editor"><div className="st-sections-head"><h3>العناوين التي فهمتها المنصة</h3><span>يمكنك تعديل العنوان وإضافة كل الجمل التي قد يكتبها الطالب للوصول لهذه الجزئية.</span></div>{sections.map((section) => <article key={section.id}><div><b>{section.questionCount} سؤال</b><input value={section.title} onChange={(event) => updateSection(section.id, 'title', event.target.value)} /></div><label>عبارات بحث الطالب<textarea value={(section.aliases || []).join('\n')} onChange={(event) => updateSection(section.id, 'aliases', event.target.value)} placeholder={'إعمال اسم الفاعل\nعمل اسم الفاعل\nمتى يعمل اسم الفاعل؟'} /></label></article>)}</div>}

      {(parsed.length > 0 || rejected.length > 0) && <div className="st-review"><b>تم التعرف على {parsed.length} سؤال</b><span>{rejected.length} يحتاج مراجعة</span><div className="st-preview">{parsed.slice(0, 12).map((question, index) => <article key={`${question.sectionId}-${index}`}><em>{sectionLookup[question.sectionId]?.title || question.sectionTitle}</em><strong>{index + 1}. {question.text}</strong><small>{question.options?.join(' • ')}</small></article>)}</div></div>}
      <button className="st-publish" disabled={saving} onClick={saveGroup}>{saving ? 'جاري الحفظ...' : 'حفظ ونشر المجموعة الذكية'}</button>
    </section>

    <section className="st-card"><h3>المجموعات المنشورة</h3><div className="st-groups">{groups.map((group) => { const gradeList = Array.isArray(group.grades) ? group.grades : (group.grade ? [group.grade] : []); return <article key={group.id}><b>{group.title}</b><span>{group.branch} • {group.lesson}</span><small>{group.questionCount || 0} سؤال — {(group.sections || []).length} جزئية — {gradeList.map(getGradeLabel).join('، ') || 'غير محدد'}</small></article>; })}{!groups.length && <p className="st-muted">لا توجد مجموعات بعد.</p>}</div></section>
  </div>;
}
