import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { doc, collection, addDoc, onSnapshot, serverTimestamp, writeBatch, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { UploadCloud, PenTool, Sparkles, Layers, BookOpen } from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';


import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';


import { platformNotify, platformConfirm, safeNumber, getQuestionMaxScore } from '../../shared/core/platformShared.jsx';


pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;


const QUESTION_BRANCHES = ['النحو', 'البلاغة'];
const OPTION_LABELS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
const QUICK_REVIEW_TITLE = 'مراجعة ف السريع';
const DEFAULT_PAPER_TITLE = 'أسئلة ثانوية عامة واسترشادي';

const looksLikeQuestionSource = (value = '') => /(استرشادي|ثانوية|سنوات|سابق|شامل|عادي|مراجعة|امتحان|نموذج|تدريب)/i.test(String(value));

const extractQuestionSource = (value = '') => {
  const text = cleanImportedLine(value);
  const bracket = text.match(/^\[([^\]]{2,60})\]\s*(.+)$/u);
  if (bracket) return { sourceLabel: cleanImportedLine(bracket[1]), text: cleanImportedLine(bracket[2]) };
  const colon = text.match(/^([^:：|]{2,45})\s*[:：|]\s*(.+)$/u);
  if (colon && looksLikeQuestionSource(colon[1])) return { sourceLabel: cleanImportedLine(colon[1]), text: cleanImportedLine(colon[2]) };
  return { sourceLabel: '', text };
};

const cleanImportedLine = (value = '') => String(value)
  .replace(/\u00a0/g, ' ')
  .replace(/[\t ]+/g, ' ')
  .trim();

const normalizeArabicKey = (value = '') => String(value)
  .replace(/[إأآا]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي')
  .replace(/\s+/g, '')
  .toLowerCase();

const detectBranchFromText = (text = '') => {
  const normalized = normalizeArabicKey(text);
  if (normalized.includes('بلاغ')) return 'البلاغة';
  if (normalized.includes('نحو') || normalized.includes('اعراب') || normalized.includes('منادي') || normalized.includes('اسماء') || normalized.includes('افعال')) return 'النحو';
  return '';
};

const stripQuestionPrefix = (line = '') => cleanImportedLine(line)
  .replace(/^س(?:ؤال)?\s*\d*\s*[:：\-.)،]?\s*/i, '')
  .replace(/^Q\s*\d*\s*[:：\-.)]?\s*/i, '')
  .trim();

const stripMetaWrapper = (line = '') => cleanImportedLine(line).replace(/^\[/, '').replace(/\]$/, '').trim();

const parseMetaLine = (line = '') => {
  const cleaned = stripMetaWrapper(line);
  const match = cleaned.match(/^(المادة|الفرع|الباب|الدرس|الموضوع|الصعوبة|الصف|الدرجة|عنوان الورقة|العنوان|مصدر السؤال|المصدر|نوع السؤال|النموذج|السنة)\s*[:：]\s*(.+)$/i);
  return match ? { key: match[1], value: cleanImportedLine(match[2]) } : null;
};

const parseOptionLine = (line = '') => {
  const text = cleanImportedLine(line);
  const match = text.match(/^(\*)?\s*([أابجدهـهوA-Fa-f])\s*[\)\].\-:：،]\s*(.+)$/u);
  if (!match) return null;
  const rawLabel = match[2].toUpperCase();
  const label = rawLabel === 'ا' ? 'أ' : rawLabel;
  const rawOptionText = cleanImportedLine(match[3]);
  const correctByMarker = Boolean(match[1]) || rawOptionText.startsWith('*') || rawOptionText.endsWith('*');
  return { label, text: cleanImportedLine(rawOptionText.replace(/^\*+|\*+$/g, '')), correctByMarker };
};

const labelToIndex = (label = '') => {
  const normalized = label.trim().toUpperCase();
  if (['A', 'أ', 'ا'].includes(normalized)) return 0;
  if (['B', 'ب'].includes(normalized)) return 1;
  if (['C', 'ج'].includes(normalized)) return 2;
  if (['D', 'د'].includes(normalized)) return 3;
  if (['E', 'هـ', 'ه'].includes(normalized)) return 4;
  if (['F', 'و'].includes(normalized)) return 5;
  return Math.max(0, safeNumber(normalized, 1) - 1);
};

const readPlainTextFile = async (file) => file.text();

const readPdfTextFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n');
};

const xmlChildrenByLocalName = (node, name) => Array.from(node.getElementsByTagName('*')).filter((el) => el.localName === name);

const readDocxParagraphs = async (file) => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) throw new Error('لم أستطع قراءة ملف Word. تأكد أنه DOCX وليس DOC قديم.');
  const parser = new DOMParser();
  const xml = parser.parseFromString(documentXml, 'application/xml');
  const paragraphs = xmlChildrenByLocalName(xml, 'p');
  return paragraphs.map((paragraph) => {
    const text = xmlChildrenByLocalName(paragraph, 't').map((node) => node.textContent || '').join('');
    const hasHighlight = xmlChildrenByLocalName(paragraph, 'highlight').some((node) => {
      const value = node.getAttribute('w:val') || node.getAttribute('val') || '';
      return value && value !== 'none';
    });
    const hasShading = xmlChildrenByLocalName(paragraph, 'shd').some((node) => {
      const fill = (node.getAttribute('w:fill') || node.getAttribute('fill') || '').toUpperCase();
      return fill && !['AUTO', 'FFFFFF', '000000'].includes(fill);
    });
    return { text: cleanImportedLine(text), highlighted: hasHighlight || hasShading };
  }).filter((line) => line.text);
};

const parseQuestionBankLines = (lines, settings) => {
  const results = [];
  const warnings = [];
  let currentBranch = settings.branchMode === 'auto' ? '' : settings.branch;
  let currentTopic = 'عام';
  let currentDifficulty = settings.difficulty || 'medium';
  let currentGrade = settings.grade || '3sec';
  let currentPaperTitle = settings.paperTitle || DEFAULT_PAPER_TITLE;
  let currentSourceLabel = settings.sourceLabel || '';
  let question = null;

  const finalizeQuestion = () => {
    if (!question) return;
    const options = question.options.map((option) => cleanImportedLine(option.text.replace(/\*/g, ''))).filter(Boolean);
    const hasOptions = options.length > 0;
    if (!question.text.trim()) {
      question = null;
      return;
    }
    let correctIdx = question.correctIdx;
    if (hasOptions && (correctIdx === null || Number.isNaN(correctIdx))) {
      const highlightedIndex = question.options.findIndex((option) => option.correctByMarker || option.highlighted);
      correctIdx = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (highlightedIndex < 0) warnings.push(`السؤال "${question.text.slice(0, 35)}..." لم أجد له إجابة صحيحة، تم اختيار أول اختيار مؤقتًا.`);
    }
    const branch = question.branch || currentBranch || settings.branch || 'النحو';
    const topic = question.topic || currentTopic || 'عام';
    results.push({
      text: question.text.trim(),
      grade: question.grade || currentGrade,
      branch,
      topic,
      lesson: topic,
      type: hasOptions ? 'mcq' : 'essay',
      difficulty: question.difficulty || currentDifficulty,
      options,
      correctIdx: hasOptions ? Math.max(0, Math.min(options.length - 1, safeNumber(correctIdx, 0))) : 0,
      explanation: question.explanation.trim(),
      introText: question.introText || '',
      mark: hasOptions ? 1 : 10,
      tags: Array.from(new Set([branch, topic, ...(settings.tags || [])].filter(Boolean))),
      source: settings.importTarget === 'quick_review' ? 'quick_review_import' : 'question_bank_import',
      template: 'paper-style',
      paperTitle: question.paperTitle || currentPaperTitle || DEFAULT_PAPER_TITLE,
      sourceLabel: question.sourceLabel || currentSourceLabel || '',
      year: question.year || settings.year || '',
      lockAfterAnswer: true,
      showExplanationAfterAnswer: true,
    });
    question = null;
  };

  lines.forEach((lineObject) => {
    const rawText = cleanImportedLine(typeof lineObject === 'string' ? lineObject : lineObject.text);
    const highlighted = Boolean(typeof lineObject === 'object' && lineObject.highlighted);
    if (!rawText) return;

    const meta = parseMetaLine(rawText);
    if (meta) {
      const key = normalizeArabicKey(meta.key);
      if (key.includes('فرع') || key.includes('باب')) currentBranch = QUESTION_BRANCHES.includes(meta.value) ? meta.value : (detectBranchFromText(meta.value) || meta.value);
      if (key.includes('درس') || key.includes('موضوع')) currentTopic = meta.value;
      if (key.includes('صعوبه')) currentDifficulty = meta.value;
      if (key.includes('صف')) currentGrade = meta.value;
      if (key.includes('عنوان')) currentPaperTitle = meta.value;
      if (key.includes('مصدر') || key.includes('نوعالسؤال') || key.includes('نموذج') || key.includes('سنه')) currentSourceLabel = meta.value;
      return;
    }

    const headerMatch = rawText.match(/^(#{1,6}|[-=]{2,})\s*(.+)$/);
    if (headerMatch) {
      const header = cleanImportedLine(headerMatch[2]);
      const branchFromHeader = detectBranchFromText(header);
      if (branchFromHeader && QUESTION_BRANCHES.includes(branchFromHeader)) currentBranch = branchFromHeader;
      else currentTopic = header;
      return;
    }

    if (/^(النحو|نحو|البلاغة|بلاغة)$/i.test(rawText)) {
      currentBranch = detectBranchFromText(rawText) || rawText;
      currentTopic = 'عام';
      return;
    }

    if (/^(درس|موضوع)\s*[:：\-]/.test(rawText)) {
      currentTopic = cleanImportedLine(rawText.replace(/^(درس|موضوع)\s*[:：\-]/, '')) || currentTopic;
      return;
    }

    const startsQuestion = /^(س(?:ؤال)?\s*\d*\s*[:：\-.)،]?|Q\s*\d*\s*[:：\-.)]?)/i.test(rawText);
    const option = parseOptionLine(rawText);

    if (startsQuestion) {
      finalizeQuestion();
      const branchFromQuestion = settings.branchMode === 'auto' ? detectBranchFromText(rawText) : '';
      const strippedQuestion = extractQuestionSource(stripQuestionPrefix(rawText));
      question = {
        text: strippedQuestion.text,
        options: [],
        correctIdx: null,
        explanation: '',
        introText: '',
        branch: branchFromQuestion || currentBranch,
        topic: currentTopic,
        grade: currentGrade,
        difficulty: currentDifficulty,
        paperTitle: currentPaperTitle,
        sourceLabel: strippedQuestion.sourceLabel || currentSourceLabel,
      };
      return;
    }

    if (!question) return;

    if (option) {
      const correctByMarker = option.correctByMarker || /\*/.test(option.text) || highlighted;
      const nextIndex = question.options.length;
      question.options.push({ ...option, text: option.text.replace(/\*/g, '').trim(), correctByMarker, highlighted });
      if (correctByMarker) question.correctIdx = nextIndex;
      return;
    }

    const answerMatch = rawText.match(/^(الإجابة|الاجابة|الإجابه|answer|correct)\s*[:：]\s*(.+)$/i);
    if (answerMatch) {
      const answerValue = answerMatch[2].replace(/\*/g, '').trim();
      const byLabel = labelToIndex(answerValue);
      const byText = question.options.findIndex((option) => normalizeArabicKey(option.text) === normalizeArabicKey(answerValue));
      question.correctIdx = byText >= 0 ? byText : byLabel;
      return;
    }

    const explanationMatch = rawText.match(/^(شرح|التعليل|سبب الإجابة|سبب الاجابة|explanation)\s*[:：]\s*(.+)$/i);
    if (explanationMatch) {
      question.explanation = [question.explanation, explanationMatch[2]].filter(Boolean).join('\n');
      return;
    }

    if (question.options.length === 0) question.text = [question.text, rawText].filter(Boolean).join('\n');
    else question.explanation = [question.explanation, rawText].filter(Boolean).join('\n');
  });

  finalizeQuestion();
  return { questions: results, warnings };
};

export const QuestionBankManager = ({ adminGradeFilter }) => {
  const [questions, setQuestions] = useState([]);
  const [quickReviews, setQuickReviews] = useState([]);
  const [filters, setFilters] = useState({ grade: adminGradeFilter === 'all' ? '' : adminGradeFilter, branch: '', type: '', topic: '', search: '' });
  const [form, setForm] = useState({ text: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'النحو', topic: '', type: 'mcq', difficulty: 'medium', optionsText: '', correctIdx: 0, explanation: '', mark: 1, tags: '', paperTitle: DEFAULT_PAPER_TITLE, sourceLabel: '' });
  const [importSettings, setImportSettings] = useState({ grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branchMode: 'auto', branch: 'النحو', difficulty: 'medium', tags: 'استيراد', paperTitle: DEFAULT_PAPER_TITLE, sourceLabel: '' });
  const [importPreview, setImportPreview] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importBusy, setImportBusy] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [examTabName, setExamTabName] = useState(QUICK_REVIEW_TITLE);
  const [managerTab, setManagerTab] = useState('quick-review');
  const fileInputRef = useRef(null);

  useEffect(() => {
      const unsub = onSnapshot(query(collection(db, 'question_bank'), orderBy('createdAt', 'desc'), limit(300)), (snap) => {
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setQuestions(rows);
      }, (error) => {
          console.warn('question_bank listener blocked:', error?.message);
          setQuestions([]);
      });
      return () => unsub();
  }, []);


  useEffect(() => {
      const unsub = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc'), limit(80)), (snap) => {
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((exam) => exam.quickReview || exam.source === 'quick_review');
          rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setQuickReviews(rows);
      }, (error) => {
          console.warn('quick review exams listener blocked:', error?.message);
          setQuickReviews([]);
      });
      return () => unsub();
  }, []);

  const deleteQuickReviewExam = async (examId) => {
    const ok = await platformConfirm('هل تريد حذف مراجعة ع السريع من صفحة الطالب؟');
    if (!ok) return;
    await deleteDoc(doc(db, 'exams', examId));
    platformNotify('تم حذف المراجعة من صفحة الطالب');
  };

  const deleteQuestionFromBank = async (questionId) => {
    const ok = await platformConfirm('هل تريد حذف هذا السؤال من بنك الأسئلة؟');
    if (!ok) return;
    await deleteDoc(doc(db, 'question_bank', questionId));
    platformNotify('تم حذف السؤال');
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const options = form.type === 'mcq' ? form.optionsText.split('\n').map(o => o.trim().replace(/\*/g, '')).filter(Boolean) : [];
    if (!form.text.trim()) return platformNotify('اكتب نص السؤال أولاً');
    if (form.type === 'mcq' && options.length < 2) return platformNotify('أضف اختيارين على الأقل');
    await addDoc(collection(db, 'question_bank'), {
      text: form.text.trim(),
      grade: form.grade,
      branch: form.branch,
      topic: form.topic.trim() || 'عام',
      lesson: form.topic.trim() || 'عام',
      type: form.type,
      difficulty: form.difficulty,
      options,
      correctIdx: markerCorrectIndex >= 0 ? markerCorrectIndex : safeNumber(form.correctIdx, 0),
      explanation: form.explanation,
      mark: safeNumber(form.mark, form.type === 'essay' ? 10 : 1),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      template: 'paper-style',
      paperTitle: form.paperTitle.trim() || DEFAULT_PAPER_TITLE,
      sourceLabel: form.sourceLabel.trim(),
      lockAfterAnswer: true,
      showExplanationAfterAnswer: true,
      createdAt: serverTimestamp()
    });
    setForm(prev => ({ ...prev, text: '', optionsText: '', explanation: '', tags: '', topic: '' }));
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportBusy(true);
    setImportPreview([]);
    setImportWarnings([]);
    try {
      const lowerName = file.name.toLowerCase();
      let lines = [];
      if (lowerName.endsWith('.txt')) {
        lines = (await readPlainTextFile(file)).split(/\r?\n/).map((text) => ({ text, highlighted: false }));
      } else if (lowerName.endsWith('.docx')) {
        lines = await readDocxParagraphs(file);
      } else if (lowerName.endsWith('.pdf')) {
        lines = (await readPdfTextFile(file)).split(/\r?\n/).map((text) => ({ text, highlighted: false }));
        setImportWarnings(['ملفات PDF النصية مدعومة بعلامة * أو سطر الإجابة. تظليل PDF غالبًا لا يظهر في النص، لذلك DOCX أفضل لو هتستخدم التظليل.']);
      } else {
        platformNotify('ارفع ملف TXT أو DOCX أو PDF نصي فقط');
        return;
      }
      const parsed = parseQuestionBankLines(lines, {
        ...importSettings,
        importTarget: managerTab === 'quick-review' ? 'quick_review' : 'question_bank',
        tags: importSettings.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      setImportPreview(parsed.questions);
      setImportWarnings((prev) => [...prev, ...parsed.warnings]);
      platformNotify(`تمت قراءة ${parsed.questions.length} سؤال من الملف`);
    } catch (error) {
      console.error('question bank import failed', error);
      platformNotify(error?.message || 'تعذر قراءة الملف');
    } finally {
      setImportBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const previewBulkQuestions = () => {
    const parsed = parseQuestionBankLines(bulkText.split(/\r?\n/).map((text) => ({ text, highlighted: false })), {
      ...importSettings,
      importTarget: managerTab === 'quick-review' ? 'quick_review' : 'question_bank',
      tags: importSettings.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
    setImportPreview(parsed.questions);
    setImportWarnings(parsed.warnings);
    platformNotify(`تم تجهيز ${parsed.questions.length} سؤال للمعاينة`);
  };

  const createQuickReviewExam = async (questionList = importPreview) => {
    if (!questionList.length) return platformNotify('لا توجد أسئلة جاهزة لعمل مراجعة ف السريع');
    const grouped = {};
    questionList.forEach((q) => {
      const branch = q.branch || 'مراجعة';
      grouped[branch] = grouped[branch] || { text: branch, subQuestions: [] };
      grouped[branch].subQuestions.push({
        id: `quick_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        text: q.text,
        options: q.options || [],
        correctIdx: q.correctIdx ?? 0,
        branch,
        topic: q.topic || q.lesson || 'عام',
        type: q.type || 'mcq',
        explanation: q.explanation || '',
        introText: q.introText || '',
        maxScore: getQuestionMaxScore(q),
        modelAnswer: q.modelAnswer || '',
        template: 'paper-style',
        paperTitle: q.paperTitle || importSettings.paperTitle || DEFAULT_PAPER_TITLE,
        sourceLabel: q.sourceLabel || importSettings.sourceLabel || '',
        lockAfterAnswer: true,
        showExplanationAfterAnswer: true,
      });
    });
    await addDoc(collection(db, 'exams'), {
      title: examTabName.trim() || QUICK_REVIEW_TITLE,
      grade: importSettings.grade,
      duration: 0,
      startTime: new Date(Date.now() - 60 * 1000).toISOString().slice(0,16),
      endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0,16),
      accessCode: '',
      noAccessCode: true,
      quickReview: true,
      reviewTabTitle: examTabName.trim() || QUICK_REVIEW_TITLE,
      isPremium: false,
      questions: Object.values(grouped),
      createdAt: serverTimestamp(),
      source: 'quick_review',
    });
    setImportPreview([]);
    setImportWarnings([]);
    setBulkText('');
    platformNotify('تم إنشاء مراجعة ف السريع وظهورها في صفحة الامتحانات بدون كلمة سر');
  };

  const saveImportedQuestions = async () => {
    if (importPreview.length === 0) return platformNotify('لا توجد أسئلة جاهزة للحفظ');
    const ok = await platformConfirm(`سيتم حفظ ${importPreview.length} سؤال في بنك الأسئلة. هل نكمل؟`);
    if (!ok) return;
    try {
      let batch = writeBatch(db);
      let counter = 0;
      for (const importedQuestion of importPreview) {
        const ref = doc(collection(db, 'question_bank'));
        batch.set(ref, {
          ...importedQuestion,
          createdAt: serverTimestamp(),
          importedAt: serverTimestamp(),
        });
        counter += 1;
        if (counter % 400 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      if (counter % 400 !== 0) await batch.commit();
      setImportPreview([]);
      setImportWarnings([]);
      platformNotify('تم حفظ الأسئلة المستوردة بنجاح');
    } catch (error) {
      console.error('save imported question bank failed', error);
      platformNotify('تعذر حفظ الأسئلة: ' + (error?.message || 'خطأ غير معروف'));
    }
  };

  const createExamFromBank = async () => {
    const pool = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type) && (!filters.topic || (q.topic || q.lesson || '').includes(filters.topic)) && (!filters.search || `${q.text} ${(q.tags || []).join(' ')} ${q.explanation || ''}`.includes(filters.search)));
    if (pool.length === 0) return platformNotify('لا توجد أسئلة مطابقة للفلاتر الحالية');
    const selected = pool.slice(0, Math.min(pool.length, 20));
    const grouped = {};
    selected.forEach(q => {
      grouped[q.branch] = grouped[q.branch] || { text: q.branch, subQuestions: [] };
      grouped[q.branch].subQuestions.push({
        id: `qb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        text: q.text,
        options: q.options || [],
        correctIdx: q.correctIdx ?? 0,
        branch: q.branch,
        topic: q.topic || q.lesson || 'عام',
        type: q.type || 'mcq',
        explanation: q.explanation || '',
        introText: q.introText || '',
        maxScore: getQuestionMaxScore(q),
        modelAnswer: q.modelAnswer || '',
        template: q.template || 'paper-style',
        paperTitle: q.paperTitle || DEFAULT_PAPER_TITLE,
        sourceLabel: q.sourceLabel || '',
        lockAfterAnswer: true,
        showExplanationAfterAnswer: true
      });
    });
    await addDoc(collection(db, 'exams'), {
      title: `امتحان مُولَّد من بنك الأسئلة - ${getGradeLabel(filters.grade || selected[0].grade)}`,
      grade: filters.grade || selected[0].grade,
      duration: Math.max(15, selected.length * 2),
      startTime: new Date().toISOString().slice(0,16),
      endTime: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,16),
      accessCode: Math.random().toString(36).slice(2, 7).toUpperCase(),
      isPremium: false,
      questions: Object.values(grouped),
      createdAt: serverTimestamp(),
      source: 'question_bank'
    });
    platformNotify('تم إنشاء امتحان جديد من بنك الأسئلة بنجاح');
  };

  const visible = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type) && (!filters.topic || (q.topic || q.lesson || '').includes(filters.topic)) && (!filters.search || `${q.text} ${(q.tags || []).join(' ')} ${q.explanation || ''}`.includes(filters.search)));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button type="button" onClick={() => setManagerTab('quick-review')} className={`rounded-2xl px-5 py-4 font-black transition flex items-center justify-center gap-2 ${managerTab === 'quick-review' ? 'bg-gradient-to-l from-amber-500 via-orange-500 to-rose-600 text-white shadow-xl shadow-amber-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            <Sparkles className="w-5 h-5" /> مراجعة ع السريع
          </button>
          <button type="button" onClick={() => setManagerTab('bank')} className={`rounded-2xl px-5 py-4 font-black transition flex items-center justify-center gap-2 ${managerTab === 'bank' ? 'bg-indigo-700 text-white shadow-xl shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            <BookOpen className="w-5 h-5" /> بنك الأسئلة الشامل
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 md:p-6 rounded-xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${managerTab === 'quick-review' ? 'text-orange-700' : 'text-indigo-700'}`}>{managerTab === 'quick-review' ? <Sparkles/> : <Layers/>} {managerTab === 'quick-review' ? 'مراجعة ع السريع - نظام مستقل' : 'بنك الأسئلة الشامل'}</h2>
            <p className="text-sm text-slate-500 mt-1">{managerTab === 'quick-review' ? 'هنا فقط تضيف مجموعات مراجعة سريعة تظهر للطالب في تبويب منفصل بدون كلمة سر، ولا تختلط ببنك الأسئلة.' : 'هنا بنك الأسئلة التقليدي: إضافة يدوية، فلترة، وتوليد امتحان من الفلاتر.'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${managerTab === 'quick-review' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>{managerTab === 'quick-review' ? 'منفصل عن بنك الأسئلة' : `${questions.length} سؤال محفوظ`}</span>
        </div>

        {managerTab === 'quick-review' && (
        <div className="bg-white/90 border border-dashed border-orange-200 rounded-2xl p-4 mb-5">
          <h3 className="font-black text-slate-900 flex items-center gap-2 mb-3"><UploadCloud className="w-5 h-5 text-orange-600"/> إضافة مراجعة ع السريع: اكتب مجموعة أو ارفع ملف</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <select className="border p-3 rounded" value={importSettings.grade} onChange={e=>setImportSettings({...importSettings, grade:e.target.value})}><GradeOptions/></select>
            <select className="border p-3 rounded" value={importSettings.branchMode} onChange={e=>setImportSettings({...importSettings, branchMode:e.target.value})}>
              <option value="auto">تحديد الفرع تلقائيًا من الملف</option>
              <option value="fixed">استخدام الفرع المختار لكل الملف</option>
            </select>
            <select className="border p-3 rounded" value={importSettings.branch} disabled={importSettings.branchMode === 'auto'} onChange={e=>setImportSettings({...importSettings, branch:e.target.value})}>
              <option value="النحو">النحو</option>
              <option value="البلاغة">البلاغة</option>
            </select>
            <select className="border p-3 rounded" value={importSettings.difficulty} onChange={e=>setImportSettings({...importSettings, difficulty:e.target.value})}>
              <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
            </select>
            <input className="border p-3 rounded" placeholder="وسوم عامة: نحو,بلاغة" value={importSettings.tags} onChange={e=>setImportSettings({...importSettings, tags:e.target.value})}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input className="border p-3 rounded" placeholder="العنوان الثابت أعلى كل سؤال" value={importSettings.paperTitle} onChange={e=>setImportSettings({...importSettings, paperTitle:e.target.value})}/>
            <input className="border p-3 rounded" placeholder="مصدر افتراضي: استرشادي ثامن / شامل 2025" value={importSettings.sourceLabel} onChange={e=>setImportSettings({...importSettings, sourceLabel:e.target.value})}/>
            <input className="border p-3 rounded" placeholder="اسم تبويب الطالب" value={examTabName} onChange={e=>setExamTabName(e.target.value)}/>
          </div>
          <textarea className="w-full border border-indigo-100 rounded-2xl p-4 min-h-[180px] mb-3 font-['Cairo']" placeholder={`إضافة مجموعة أسئلة مرة واحدة:
س1: استرشادي ثامن: نص السؤال
أ: اختيار
*ب: اختيار صحيح
شرح: الشرح اختياري

س2: سؤال عادي...`} value={bulkText} onChange={(e)=>setBulkText(e.target.value)} />
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <button type="button" onClick={previewBulkQuestions} disabled={!bulkText.trim()} className="bg-violet-600 disabled:bg-slate-300 text-white py-3 px-6 rounded-xl font-bold">معاينة مجموعة الأسئلة</button>
            <button type="button" onClick={()=>createQuickReviewExam()} disabled={importPreview.length === 0} className="bg-amber-500 disabled:bg-slate-300 text-white py-3 px-6 rounded-xl font-black shadow-lg">حفظ وظهور للطالب</button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleImportFile} className="block w-full text-sm text-slate-600 file:ml-3 file:rounded-xl file:border-0 file:bg-orange-600 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-orange-700" />
            <span className="rounded-xl bg-orange-50 px-4 py-3 text-xs font-bold text-orange-700">منطقة مراجعة ع السريع مستقلة نهائيًا عن بنك الأسئلة.</span>
          </div>
          <div className="mt-3 text-xs text-slate-600 leading-6 bg-slate-50 rounded-xl p-3">
            <b>الصيغ المدعومة:</b> TXT و DOCX و PDF نصي. ضع <b>*</b> بجانب الإجابة الصحيحة أو ظلّل سطر الإجابة في Word. اكتب عناوين مثل <b># النحو</b> ثم <b>## المنادى</b> أو <b># البلاغة</b> ثم <b>## التشبيه</b> عشان يتخزن الفرع والموضوع تلقائيًا.
          </div>
          {importWarnings.length > 0 && <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm space-y-1">{importWarnings.slice(0, 6).map((warning, idx) => <p key={idx}>• {warning}</p>)}</div>}
          {managerTab === 'quick-review' && importPreview.length > 0 && <div className="mt-4 bg-slate-50 rounded-xl p-3 max-h-72 overflow-y-auto space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-2"><Sparkles className="w-4 h-4"/> معاينة {importPreview.length} سؤال قبل إنشاء المراجعة</div>
            {importPreview.slice(0, 20).map((q, idx) => <div key={`${q.text}_${idx}`} className="bg-white border rounded-xl p-3">
              <div className="flex flex-wrap gap-2 mb-1 text-[11px]"><span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">{q.sourceLabel || 'سؤال عادي'}</span><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{q.branch}</span><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">{q.topic}</span><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">{q.type === 'mcq' ? 'اختياري' : 'مقالي'}</span></div>
              <p className="font-bold text-sm text-slate-800">{idx + 1}. {q.text}</p>
              {q.options?.length > 0 && <p className="text-xs text-emerald-700 mt-1">الإجابة: {OPTION_LABELS[q.correctIdx] || q.correctIdx + 1}) {q.options[q.correctIdx]}</p>}
            </div>)}
          </div>}

          {quickReviews.length > 0 && <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
            <h4 className="font-black text-orange-800 mb-3">المراجعات المنشورة للطالب</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {quickReviews.map((exam) => <div key={exam.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl bg-white border border-orange-100 p-3">
                <div><p className="font-black text-slate-800">{exam.title || 'مراجعة ع السريع'}</p><p className="text-xs text-slate-500">{exam.questions?.reduce((acc,g)=>acc+(g.subQuestions?.length || 0),0) || 0} سؤال • بدون وقت • بدون كلمة سر</p></div>
                <button type="button" onClick={() => deleteQuickReviewExam(exam.id)} className="rounded-xl bg-red-50 text-red-700 px-4 py-2 font-black border border-red-100 hover:bg-red-100">حذف من صفحة الطالب</button>
              </div>)}
            </div>
          </div>}
        </div>
        )}

        {managerTab === 'bank' && (
        <form onSubmit={handleAddQuestion} className="grid gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><PenTool className="w-5 h-5"/> إضافة سؤال يدويًا</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
            <select className="border p-3 rounded" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}><option value="النحو">النحو</option><option value="البلاغة">البلاغة</option></select>
            <input className="border p-3 rounded" placeholder="الموضوع مثل المنادى / التشبيه" value={form.topic} onChange={e=>setForm({...form, topic:e.target.value})}/>
            <select className="border p-3 rounded" value={form.type} onChange={e=>setForm({...form, type:e.target.value, mark: e.target.value === 'essay' ? 10 : 1})}>
              <option value="mcq">اختياري</option><option value="essay">مقالي</option>
            </select>
            <select className="border p-3 rounded" value={form.difficulty} onChange={e=>setForm({...form, difficulty:e.target.value})}>
              <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border p-3 rounded" placeholder="عنوان الورقة الثابت" value={form.paperTitle} onChange={e=>setForm({...form, paperTitle:e.target.value})}/>
            <input className="border p-3 rounded" placeholder="مصدر السؤال: استرشادي ثامن / ثانوية عامة / سؤال عادي" value={form.sourceLabel} onChange={e=>setForm({...form, sourceLabel:e.target.value})}/>
          </div>
          <textarea className="border p-3 rounded h-24" placeholder="نص السؤال" value={form.text} onChange={e=>setForm({...form, text:e.target.value})}/>
          {form.type === 'mcq' && <textarea className="border p-3 rounded h-28 font-mono" placeholder={'كل اختيار في سطر منفصل، وتقدر تحط * قبل الإجابة الصحيحة\nمثال:\nنكرة مقصودة\n*مضاف\nشبيه بالمضاف'} value={form.optionsText} onChange={e=>setForm({...form, optionsText:e.target.value})}/>}          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {form.type === 'mcq' && <select className="border p-3 rounded" value={form.correctIdx} onChange={e=>setForm({...form, correctIdx:e.target.value})}><option value={0}>الإجابة الصحيحة: أ</option><option value={1}>الإجابة الصحيحة: ب</option><option value={2}>الإجابة الصحيحة: ج</option><option value={3}>الإجابة الصحيحة: د</option><option value={4}>الإجابة الصحيحة: هـ</option><option value={5}>الإجابة الصحيحة: و</option></select>}            
            <input type="number" min="1" className="border p-3 rounded" placeholder="درجة السؤال" value={form.mark} onChange={e=>setForm({...form, mark:e.target.value})}/>
            <input className="border p-3 rounded" placeholder="tags مفصولة بفاصلة" value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})}/>
          </div>
          <textarea className="border p-3 rounded h-20" placeholder="شرح الإجابة / قاعدة المراجعة الذكية" value={form.explanation} onChange={e=>setForm({...form, explanation:e.target.value})}/>
          <div className="flex flex-col md:flex-row gap-3">
            <button className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold">حفظ السؤال اليدوي</button>
          </div>
        </form>
        )}
      </div>

      {managerTab === 'bank' && <div className="glass-panel p-4 md:p-6 rounded-xl border border-indigo-100 bg-white">
        <h3 className="font-black text-slate-900 flex items-center gap-2 mb-3"><UploadCloud className="w-5 h-5 text-indigo-600"/> رفع مجموعة أسئلة إلى بنك الأسئلة</h3>
        <p className="text-sm text-slate-500 mb-3">اكتب مجموعة أسئلة أو ارفع TXT / DOCX / PDF. علامة * قبل الاختيار أو تظليل الاختيار في Word = إجابة صحيحة.</p>
        <textarea className="w-full border border-slate-200 rounded-2xl p-4 min-h-[160px] mb-3" placeholder={`س1: استرشادي ثامن: نص السؤال
أ: اختيار
*ب: اختيار صحيح
شرح: الشرح اختياري`} value={bulkText} onChange={(e)=>setBulkText(e.target.value)} />
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <button type="button" onClick={previewBulkQuestions} disabled={!bulkText.trim()} className="bg-indigo-600 disabled:bg-slate-300 text-white py-3 px-6 rounded-xl font-bold">معاينة المجموعة</button>
          <button type="button" onClick={saveImportedQuestions} disabled={importPreview.length === 0} className="bg-emerald-600 disabled:bg-slate-300 text-white py-3 px-6 rounded-xl font-black">حفظ المجموعة في بنك الأسئلة</button>
        </div>
        <input ref={managerTab === 'bank' ? fileInputRef : null} type="file" accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleImportFile} className="block w-full text-sm text-slate-600 file:ml-3 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-indigo-700" />
        {managerTab === 'bank' && importWarnings.length > 0 && <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm space-y-1">{importWarnings.slice(0, 6).map((warning, idx) => <p key={idx}>• {warning}</p>)}</div>}
        {managerTab === 'bank' && importPreview.length > 0 && <div className="mt-4 bg-slate-50 rounded-xl p-3 max-h-72 overflow-y-auto space-y-2"><div className="font-bold text-slate-700">معاينة {importPreview.length} سؤال</div>{importPreview.slice(0, 20).map((q, idx) => <div key={`${q.text}_${idx}`} className="bg-white border rounded-xl p-3"><p className="font-bold text-sm text-slate-800">{idx + 1}. {q.text}</p>{q.options?.length > 0 && <p className="text-xs text-emerald-700 mt-1">الإجابة: {OPTION_LABELS[q.correctIdx] || q.correctIdx + 1}) {q.options[q.correctIdx]}</p>}</div>)}</div>}
      </div>}

      {managerTab === 'bank' && <div className="glass-panel p-4 md:p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <select className="border p-3 rounded" value={filters.grade} onChange={e=>setFilters({...filters, grade:e.target.value})}><option value="">كل المراحل</option><GradeOptions/></select>
          <select className="border p-3 rounded" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}><option value="">النحو والبلاغة</option><option value="النحو">النحو</option><option value="البلاغة">البلاغة</option></select>
          <input className="border p-3 rounded" placeholder="فلترة الموضوع" value={filters.topic} onChange={e=>setFilters({...filters, topic:e.target.value})}/>
          <select className="border p-3 rounded" value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}><option value="">كل الأنواع</option><option value="mcq">اختياري</option><option value="essay">مقالي</option></select>
          <input className="border p-3 rounded" placeholder="بحث في نص السؤال" value={filters.search} onChange={e=>setFilters({...filters, search:e.target.value})}/>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <p className="text-sm text-slate-500">المعروض الآن: <b>{visible.length}</b> سؤال</p>
          <button type="button" onClick={createExamFromBank} className="bg-emerald-600 text-white py-2 px-5 rounded-xl font-bold">توليد امتحان من النحو/البلاغة حسب الفلاتر</button>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {visible.map(q => <div key={q.id} className="bg-white border rounded-xl p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(q.grade)}</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{q.branch}</span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">{q.topic || q.lesson || 'عام'}</span>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">{getQuestionMaxScore(q)} درجة</span>{q.sourceLabel && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">{q.sourceLabel}</span>}
            </div>
            <p className="font-bold text-slate-800">{q.text}</p>
            {q.options?.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">{q.options.map((option, idx) => <div key={idx} className={`border rounded-lg p-2 ${idx === q.correctIdx ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50'}`}>{OPTION_LABELS[idx] || idx + 1}) {option}</div>)}</div>}
            {q.explanation && <p className="text-xs text-slate-500 mt-2">شرح: {q.explanation}</p>}
            <div className="mt-3 flex justify-end"><button type="button" onClick={() => deleteQuestionFromBank(q.id)} className="rounded-xl bg-red-50 text-red-700 px-4 py-2 text-xs font-black border border-red-100 hover:bg-red-100">حذف السؤال</button></div>
          </div>)}
          {visible.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد أسئلة مطابقة.</p>}
        </div>
      </div>}
    </div>
  );
};

export default QuestionBankManager;
