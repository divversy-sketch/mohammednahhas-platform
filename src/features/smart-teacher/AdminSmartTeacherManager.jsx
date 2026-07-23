import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
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
  const [managedGroup, setManagedGroup] = useState(null);
  const [managedQuestions, setManagedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [groupDraft, setGroupDraft] = useState(null);
  const [managementSaving, setManagementSaving] = useState(false);

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



  const openGroupManager = async (group) => {
    setManagedGroup(group);
    setGroupDraft({
      title: group.title || '',
      branch: group.branch || 'النحو',
      lesson: group.lesson || '',
      questionsPerSession: Number(group.questionsPerSession || 10),
      hint: group.hint || '',
      rule: group.rule || '',
      example: group.example || '',
      commonMistake: group.commonMistake || '',
      grades: Array.isArray(group.grades) ? group.grades : (group.grade ? [group.grade] : []),
      sections: Array.isArray(group.sections) ? group.sections : [],
    });
    setLoadingQuestions(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'content'), where('smartTeacherGroupId', '==', group.id)));
      const questions = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => item.contentType === 'smart_teacher_question');
      setManagedQuestions(questions);
    } catch (error) {
      platformNotify(error?.code === 'permission-denied' ? 'لا توجد صلاحية لقراءة أسئلة المجموعة.' : 'تعذر تحميل أسئلة المجموعة', 'error');
      setManagedQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const closeGroupManager = () => {
    setManagedGroup(null);
    setManagedQuestions([]);
    setEditingQuestion(null);
    setGroupDraft(null);
  };

  const saveGroupChanges = async () => {
    if (!managedGroup || !groupDraft?.title?.trim() || !groupDraft?.lesson?.trim()) return;
    setManagementSaving(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'content', managedGroup.id), {
        title: groupDraft.title.trim(),
        branch: groupDraft.branch,
        lesson: groupDraft.lesson.trim(),
        topic: groupDraft.lesson.trim(),
        questionsPerSession: Number(groupDraft.questionsPerSession) || 10,
        hint: groupDraft.hint.trim(),
        rule: groupDraft.rule.trim(),
        example: groupDraft.example.trim(),
        commonMistake: groupDraft.commonMistake.trim(),
        grades: groupDraft.grades,
        sections: groupDraft.sections,
        questionCount: managedQuestions.length,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setGroups((current) => current.map((item) => item.id === managedGroup.id ? { ...item, ...groupDraft, questionCount: managedQuestions.length } : item));
      setManagedGroup((current) => ({ ...current, ...groupDraft, questionCount: managedQuestions.length }));
      platformNotify('تم حفظ تعديلات المجموعة');
    } catch (error) {
      platformNotify(error?.message || 'تعذر حفظ تعديلات المجموعة', 'error');
    } finally {
      setManagementSaving(false);
    }
  };

  const saveQuestionChanges = async () => {
    if (!editingQuestion?.id || !editingQuestion?.text?.trim()) return;
    setManagementSaving(true);
    try {
      const batch = writeBatch(db);
      const payload = {
        text: editingQuestion.text.trim(),
        options: Array.isArray(editingQuestion.options) ? editingQuestion.options.map((item) => cleanImportedLine(item)).filter(Boolean) : [],
        correctAnswer: editingQuestion.correctAnswer,
        correctIndex: Number.isInteger(Number(editingQuestion.correctIndex)) ? Number(editingQuestion.correctIndex) : editingQuestion.correctIndex,
        sectionTitle: editingQuestion.sectionTitle || 'تدريبات عامة',
        sectionAliases: Array.isArray(editingQuestion.sectionAliases) ? editingQuestion.sectionAliases : [],
        updatedAt: serverTimestamp(),
      };
      batch.update(doc(db, 'content', editingQuestion.id), payload);
      if (editingQuestion.bankQuestionId) batch.update(doc(db, 'question_bank', editingQuestion.bankQuestionId), payload);
      await batch.commit();
      setManagedQuestions((current) => current.map((item) => item.id === editingQuestion.id ? { ...item, ...payload } : item));
      setEditingQuestion(null);
      platformNotify('تم تعديل السؤال في المعلم الذكي وبنك الأسئلة');
    } catch (error) {
      platformNotify(error?.message || 'تعذر تعديل السؤال', 'error');
    } finally {
      setManagementSaving(false);
    }
  };

  const deleteQuestion = async (question) => {
    if (!window.confirm('حذف هذا السؤال من المعلم الذكي وبنك الأسئلة؟')) return;
    setManagementSaving(true);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'content', question.id));
      if (question.bankQuestionId) batch.delete(doc(db, 'question_bank', question.bankQuestionId));
      batch.update(doc(db, 'content', managedGroup.id), {
        questionCount: Math.max(0, managedQuestions.length - 1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setManagedQuestions((current) => current.filter((item) => item.id !== question.id));
      setGroups((current) => current.map((item) => item.id === managedGroup.id ? { ...item, questionCount: Math.max(0, managedQuestions.length - 1) } : item));
      platformNotify('تم حذف السؤال');
    } catch (error) {
      platformNotify(error?.message || 'تعذر حذف السؤال', 'error');
    } finally {
      setManagementSaving(false);
    }
  };

  const deleteGroup = async (group) => {
    if (!window.confirm(`حذف مجموعة «${group.title}» وكل أسئلتها من المعلم الذكي وبنك الأسئلة؟`)) return;
    setManagementSaving(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'content'), where('smartTeacherGroupId', '==', group.id)));
      const docsToDelete = snapshot.docs.filter((item) => item.data()?.contentType === 'smart_teacher_question');
      let batch = writeBatch(db);
      let count = 0;
      const commitIfNeeded = async (force = false) => {
        if (count >= 400 || (force && count > 0)) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      };
      for (const item of docsToDelete) {
        const data = item.data();
        batch.delete(item.ref); count += 1;
        if (data.bankQuestionId) { batch.delete(doc(db, 'question_bank', data.bankQuestionId)); count += 1; }
        await commitIfNeeded(false);
      }
      batch.delete(doc(db, 'content', group.id)); count += 1;
      await commitIfNeeded(true);
      setGroups((current) => current.filter((item) => item.id !== group.id));
      closeGroupManager();
      platformNotify('تم حذف المجموعة وكل أسئلتها');
    } catch (error) {
      platformNotify(error?.message || 'تعذر حذف المجموعة', 'error');
    } finally {
      setManagementSaving(false);
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

    <section className="st-card"><div className="st-management-head"><div><h3>المجموعات المنشورة</h3><p>افتح أي مجموعة لتعديل بياناتها وأسئلتها أو حذفها.</p></div></div><div className="st-groups">{groups.map((group) => { const gradeList = Array.isArray(group.grades) ? group.grades : (group.grade ? [group.grade] : []); const sectionList = Array.isArray(group.sections) ? group.sections : []; return <article key={group.id} className="st-group-card"><b>{group.title}</b><span>{group.branch} • {group.lesson}</span><small>{group.questionCount || 0} سؤال — {sectionList.length} جزئية — {gradeList.map(getGradeLabel).join('، ') || 'غير محدد'}</small><div className="st-group-actions"><button type="button" onClick={() => openGroupManager(group)}>إدارة وتعديل</button><button type="button" className="danger" onClick={() => deleteGroup(group)}>حذف المجموعة</button></div></article>; })}{!groups.length && <p className="st-muted">لا توجد مجموعات بعد.</p>}</div></section>

    {managedGroup && groupDraft && <div className="st-manage-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeGroupManager(); }}><section className="st-manage-modal"><button className="st-manage-close" type="button" onClick={closeGroupManager}>×</button><header><div className="st-mini-logo">ن✦</div><div><small>إدارة المعلم الذكي</small><h2>{managedGroup.title}</h2><p>تعديل المجموعة والأسئلة بدون إعادة رفع الملف.</p></div></header>
      <div className="st-manage-tabs-content">
        <div className="st-card st-edit-group-card"><h3>بيانات المجموعة</h3><div className="st-grid"><label>العنوان<input value={groupDraft.title} onChange={(e) => setGroupDraft({ ...groupDraft, title: e.target.value })} /></label><label>الفرع<select value={groupDraft.branch} onChange={(e) => setGroupDraft({ ...groupDraft, branch: e.target.value })}>{branches.map((item) => <option key={item}>{item}</option>)}</select></label><label>اسم الدرس<input value={groupDraft.lesson} onChange={(e) => setGroupDraft({ ...groupDraft, lesson: e.target.value })} /></label><label>أسئلة كل جلسة<input type="number" min="1" max="50" value={groupDraft.questionsPerSession} onChange={(e) => setGroupDraft({ ...groupDraft, questionsPerSession: e.target.value })} /></label></div><div className="st-help-grid"><label>التلميح<textarea value={groupDraft.hint} onChange={(e) => setGroupDraft({ ...groupDraft, hint: e.target.value })} /></label><label>القاعدة<textarea value={groupDraft.rule} onChange={(e) => setGroupDraft({ ...groupDraft, rule: e.target.value })} /></label><label>مثال<textarea value={groupDraft.example} onChange={(e) => setGroupDraft({ ...groupDraft, example: e.target.value })} /></label><label>خطأ شائع<textarea value={groupDraft.commonMistake} onChange={(e) => setGroupDraft({ ...groupDraft, commonMistake: e.target.value })} /></label></div><button type="button" className="st-save-changes" disabled={managementSaving} onClick={saveGroupChanges}>حفظ بيانات المجموعة</button></div>

        <div className="st-card"><div className="st-question-manager-head"><div><h3>أسئلة المجموعة</h3><p>{managedQuestions.length} سؤال — يمكنك التعديل أو النقل لعنوان آخر أو الحذف.</p></div></div>{loadingQuestions ? <p className="st-muted">جاري تحميل الأسئلة...</p> : <div className="st-question-manager-list">{managedQuestions.map((question, index) => <article key={question.id}><div className="st-question-number">{index + 1}</div><div className="st-question-body"><em>{question.sectionTitle || 'تدريبات عامة'}</em><strong>{question.text}</strong><small>{Array.isArray(question.options) ? question.options.join(' • ') : ''}</small></div><div className="st-question-actions"><button type="button" onClick={() => setEditingQuestion({ ...question, options: Array.isArray(question.options) ? question.options : [] })}>تعديل</button><button type="button" className="danger" onClick={() => deleteQuestion(question)}>حذف</button></div></article>)}{!managedQuestions.length && <p className="st-muted">لا توجد أسئلة داخل المجموعة.</p>}</div>}</div>
      </div>
    </section></div>}

    {editingQuestion && <div className="st-manage-backdrop st-question-edit-backdrop"><section className="st-question-edit-modal"><button className="st-manage-close" type="button" onClick={() => setEditingQuestion(null)}>×</button><h3>تعديل السؤال</h3><label>نص السؤال<textarea value={editingQuestion.text || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })} /></label><label>عنوان الجزئية<select value={editingQuestion.sectionTitle || ''} onChange={(e) => { const section = (groupDraft?.sections || []).find((item) => item.title === e.target.value); setEditingQuestion({ ...editingQuestion, sectionTitle: e.target.value, sectionId: section?.id || editingQuestion.sectionId, sectionAliases: section?.aliases || [] }); }}>{(groupDraft?.sections || []).map((section) => <option key={section.id} value={section.title}>{section.title}</option>)}</select></label><div className="st-options-editor">{(editingQuestion.options || []).map((option, index) => <label key={index}><span>اختيار {index + 1}</span><input value={option} onChange={(e) => setEditingQuestion({ ...editingQuestion, options: editingQuestion.options.map((item, optionIndex) => optionIndex === index ? e.target.value : item) })} /></label>)}</div><label>رقم الإجابة الصحيحة<select value={Number(editingQuestion.correctIndex ?? 0)} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctIndex: Number(e.target.value), correctAnswer: editingQuestion.options?.[Number(e.target.value)] || '' })}>{(editingQuestion.options || []).map((option, index) => <option key={index} value={index}>{index + 1} — {option}</option>)}</select></label><div className="st-edit-actions"><button type="button" onClick={() => setEditingQuestion(null)}>إلغاء</button><button type="button" className="primary" disabled={managementSaving} onClick={saveQuestionChanges}>حفظ التعديل</button></div></section></div>}
  </div>;
}
