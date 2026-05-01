import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BookOpen, BrainCircuit, CheckCircle, ClipboardList, Loader2, PlusCircle, Search, Sparkles, UploadCloud, XCircle, Lightbulb, FileText, User, GraduationCap } from '../../shared/icons/lucide-shim.jsx';

const GRADES = [
  ['all', 'كل الصفوف'], ['1prep', 'الصف الأول الإعدادي'], ['2prep', 'الصف الثاني الإعدادي'], ['3prep', 'الصف الثالث الإعدادي'],
  ['1sec', 'الصف الأول الثانوي'], ['2sec', 'الصف الثاني الثانوي'], ['3sec', 'الصف الثالث الثانوي']
];
const BRANCHES = ['عام', 'نحو', 'بلاغة', 'قراءة', 'نصوص', 'أدب', 'تعبير', 'قصة'];

const normalizeArabic = (value = '') => String(value || '')
  .toLowerCase()
  .replace(/[إأآا]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/[ًٌٍَُِّْـ]/g, '')
  .replace(/[،؛؟!,.()[\]{}"'`~@#$%^&*_+=|\\/:<>-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokenize = (value = '') => normalizeArabic(value).split(' ').map((w) => w.trim()).filter((w) => w.length > 2);
const parseKeywords = (value = '') => Array.isArray(value) ? value : String(value || '').split(/[،,\n]/g).map((k) => k.trim()).filter(Boolean);

const GRADE_ALIASES = {
  'all': ['all', 'كل الصفوف', 'عام'],
  '1prep': ['1prep', 'اولي اعدادي', 'اولى اعدادى', 'الصف الاول الاعدادي', 'الاول الاعدادي'],
  '2prep': ['2prep', 'تانيه اعدادي', 'ثانيه اعدادي', 'الصف الثاني الاعدادي', 'الثاني الاعدادي'],
  '3prep': ['3prep', 'تالته اعدادي', 'ثالثه اعدادي', 'الصف الثالث الاعدادي', 'الثالث الاعدادي'],
  '1sec': ['1sec', 'اولي ثانوي', 'اولى ثانوى', 'الصف الاول الثانوي', 'الاول الثانوي'],
  '2sec': ['2sec', 'تانيه ثانوي', 'ثانيه ثانوي', 'الصف الثاني الثانوي', 'الثاني الثانوي'],
  '3sec': ['3sec', 'تالته ثانوي', 'ثالثه ثانوي', 'الصف الثالث الثانوي', 'الثالث الثانوي']
};

const normalizeGrade = (value = '') => {
  const raw = String(value || '').trim();
  const norm = normalizeArabic(raw);
  if (!norm) return '';
  for (const [code, aliases] of Object.entries(GRADE_ALIASES)) {
    if (aliases.map(normalizeArabic).includes(norm)) return code;
  }
  return raw;
};

const gradeMatches = (itemGrade, userGrade) => {
  const item = normalizeGrade(itemGrade || 'all');
  const user = normalizeGrade(userGrade || '');
  if (!item || item === 'all' || !user || user === 'all') return true;
  if (item === user) return true;
  const itemKnown = Object.prototype.hasOwnProperty.call(GRADE_ALIASES, item);
  const userKnown = Object.prototype.hasOwnProperty.call(GRADE_ALIASES, user);
  return !(itemKnown && userKnown);
};
const lessonKeyOf = (item = {}) => normalizeArabic([normalizeGrade(item.grade || 'all'), item.branch || 'عام', item.lesson || item.title || ''].join('|'));
const uniqueList = (items = []) => [...new Set(items.map((x) => String(x || '').trim()).filter(Boolean))];
const shuffle = (arr = []) => [...arr].sort(() => Math.random() - 0.5);
const buildQuestionSignature = (question = '') => normalizeArabic(question).split(' ').slice(0, 10).join(' ');

const scoreExplanation = (item, question, userGrade) => {
  if (!gradeMatches(item.grade, userGrade)) return -1;
  const qNorm = normalizeArabic(question);
  const words = tokenize(question);
  const keywordText = parseKeywords(item.keywords).join(' ');
  const openingAliasText = String(item.openingKeywords || '');
  const haystack = normalizeArabic([
    item.title, item.lesson, item.branch, keywordText, openingAliasText, item.content, item.searchableText
  ].join(' '));
  let score = 0;

  if (normalizeGrade(item.grade) === normalizeGrade(userGrade)) score += 4;

  const titleNorm = normalizeArabic(item.title || '');
  const lessonNorm = normalizeArabic(item.lesson || '');
  const branchNorm = normalizeArabic(item.branch || '');

  if (lessonNorm && (qNorm === lessonNorm || qNorm.includes(lessonNorm) || lessonNorm.includes(qNorm))) score += 25;
  if (titleNorm && (qNorm === titleNorm || qNorm.includes(titleNorm) || titleNorm.includes(qNorm))) score += 18;
  if (branchNorm && qNorm.includes(branchNorm)) score += 4;

  parseKeywords(item.keywords).forEach((kw) => {
    const n = normalizeArabic(kw);
    if (!n) return;
    if (qNorm === n || qNorm.includes(n) || n.includes(qNorm)) score += 10;
  });

  collectOpeningAliasGroups(item.content || '', item.openingKeywords || '').forEach((group) => {
    (group.normalizedAliases || []).forEach((alias) => {
      if (!alias) return;
      if (qNorm === alias || qNorm.includes(alias) || alias.includes(qNorm)) score += 14;
    });
  });

  words.forEach((w) => { if (haystack.includes(w)) score += 2; });
  if (qNorm && haystack.includes(qNorm)) score += 12;
  return score;
};

const splitChunks = (content = '') => String(content || '').trim().split(/\n{2,}|(?<=[.!؟])\s+/g).map((c) => c.trim()).filter((c) => c.length > 25);

const trimLongTeacherText = (text = '', max = 12000) => {
  const clean = String(text || '').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).trim() + '\n\n[تم اختصار جزء من الشرح لطول النص. اضغط افهمني أكتر أو اسأل عن نقطة أدق لعرض تفاصيل أكثر.]';
};

const getAnswerFromContent = (content = '', question = '', max = 12000) => {
  const clean = String(content || '').trim();
  if (!clean) return '';
  // لا نختصر شرح المستر إلى فقرتين؛ نعرض القسم كاملًا عشان الأمثلة والتفاصيل تظهر كما رُفعت.
  return trimLongTeacherText(clean, max);
};

const extractContentExamples = (content = '') => {
  const lines = String(content || '').replace(/\r/g, '').split('\n');
  const examples = [];
  let buffer = [];
  const isExampleStart = (line = '') => {
    const clean = line.trim();
    return /^(مثال|مثال سريع|تدريب|السؤال|\d+[-–.)])/.test(clean) || /^[-•*]\s*(مثال|تدريب)/.test(clean);
  };
  const isHardBreak = (line = '') => /^[-–—_=*#]{3,}$/.test(line.trim()) || line.trim().startsWith('@');
  const flush = () => {
    const text = buffer.join('\n').trim();
    if (text.length > 15) {
      examples.push({
        id: 'content_example_' + examples.length + '_' + buildQuestionSignature(text),
        source: 'teacher_content',
        question: text.split('\n')[0].replace(/^\d+[-–.)]\s*/, '').trim(),
        explanation: text,
        options: [],
        correctIdx: 0,
        includeInQuiz: false
      });
    }
    buffer = [];
  };
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) { if (buffer.length) buffer.push(rawLine); return; }
    if (isHardBreak(line)) { flush(); return; }
    if (isExampleStart(line) && buffer.length) flush();
    if (isExampleStart(line) || buffer.length) buffer.push(rawLine);
  });
  flush();
  return examples.slice(0, 20);
};

const parseCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim()); current = '';
    } else current += ch;
  }
  result.push(current.trim());
  return result;
};

const parseQuestionCsv = (csvText = '') => {
  const lines = String(csvText || '').split(/\r?\n/g).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => normalizeArabic(h));
  const get = (row, names) => {
    for (const name of names) { const idx = headers.indexOf(normalizeArabic(name)); if (idx >= 0) return row[idx] || ''; }
    return '';
  };
  return lines.slice(1).map((line) => {
    const row = parseCsvLine(line);
    const correctRaw = get(row, ['correctAnswer', 'correct', 'answer', 'الإجابة', 'الاجابة', 'correctIdx']);
    const options = [
      get(row, ['optionA', 'a', 'أ', 'ا', 'اختيار ا', 'الاختيار الاول']),
      get(row, ['optionB', 'b', 'ب', 'اختيار ب', 'الاختيار الثاني']),
      get(row, ['optionC', 'c', 'ج', 'اختيار ج', 'الاختيار الثالث']),
      get(row, ['optionD', 'd', 'د', 'اختيار د', 'الاختيار الرابع'])
    ].filter(Boolean);
    const c = normalizeArabic(correctRaw);
    const correctIdx = ['0', '1', '2', '3'].includes(correctRaw) ? Number(correctRaw) :
      ['a', 'ا'].includes(c) ? 0 : ['b', 'ب'].includes(c) ? 1 : ['c', 'ج'].includes(c) ? 2 : ['d', 'د'].includes(c) ? 3 :
      Math.max(0, options.findIndex((o) => normalizeArabic(o) === c));
    const includeInQuizRaw = normalizeArabic(get(row, ['includeInQuiz', 'يدخل الامتحان', 'quiz']));
    return {
      grade: get(row, ['grade', 'الصف']) || 'all',
      lesson: get(row, ['lesson', 'الدرس']),
      branch: get(row, ['branch', 'الفرع']) || 'عام',
      question: get(row, ['question', 'السؤال']),
      options,
      correctIdx: correctIdx < 0 ? 0 : correctIdx,
      explanation: get(row, ['explanation', 'شرح', 'الشرح', 'answerExplanation', 'تعليل']),
      difficulty: get(row, ['difficulty', 'الصعوبة']) || 'medium',
      tags: parseKeywords(get(row, ['tags', 'keywords', 'كلمات مفتاحية', 'النقطة'])),
      includeInQuiz: !['false', '0', 'لا', 'no'].includes(includeInQuizRaw)
    };
  }).filter((q) => q.question && q.options.length >= 2);
};

const flattenExamQuestions = (exam = {}) => {
  const blocks = Array.isArray(exam.questions) ? exam.questions : [];
  return blocks.flatMap((block) => {
    const subQuestions = Array.isArray(block?.subQuestions) ? block.subQuestions : [];
    return subQuestions.map((q, idx) => ({
      id: `exam_${exam.id || exam.title || 'unknown'}_${q.id || idx}`,
      source: 'exam',
      examId: exam.id || '',
      examTitle: exam.title || '',
      grade: exam.grade || 'all',
      lesson: exam.lesson || exam.title || q.lesson || '',
      branch: q.branch || exam.branch || 'عام',
      question: q.text || q.question || '',
      options: Array.isArray(q.options) ? q.options : [],
      correctIdx: Number.isFinite(Number(q.correctIdx)) ? Number(q.correctIdx) : 0,
      explanation: q.explanation || q.modelAnswer || '',
      difficulty: q.difficulty || 'medium',
      tags: parseKeywords([exam.title, exam.lesson, q.branch, q.tags].filter(Boolean).join(',')),
      includeInQuiz: true
    })).filter((q) => q.question && q.options.length >= 2);
  });
};

const rankQuestions = (items = [], { answer, question, userGrade, excludeIds = [], allowExamples = true }) => {
  const lesson = normalizeArabic(answer?.lesson || answer?.title || '');
  const branch = normalizeArabic(answer?.branch || '');
  const point = normalizeArabic(answer?.pointTitle || '');
  const qWords = tokenize(question);
  const excluded = new Set(excludeIds);
  return items
    .filter((q) => gradeMatches(q.grade, userGrade))
    .filter((q) => allowExamples || q.includeInQuiz !== false)
    .filter((q) => !excluded.has(q.id))
    .map((q) => {
      const hay = normalizeArabic([q.lesson, q.branch, q.question, q.explanation, (q.tags || []).join(' '), q.examTitle].join(' '));
      let score = 0;
      if (lesson && hay.includes(lesson)) score += 10;
      if (point && hay.includes(point)) score += 8;
      if (branch && hay.includes(branch)) score += 3;
      qWords.forEach((w) => { if (hay.includes(w)) score += 1; });
      return { q, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.q);
};

const splitAliasParts = (value = '') => String(value || '')
  .split(/[|،,؛]/g)
  .map((part) => part.trim())
  .filter(Boolean);

const buildAliasGroup = (canonical = '', aliases = []) => {
  const cleanCanonical = String(canonical || '').replace(/^@/, '').replace(/_/g, ' ').trim();
  const cleanAliases = uniqueList([cleanCanonical, ...aliases.map((part) => String(part || '').replace(/^@/, '').replace(/_/g, ' ').trim())]);
  return cleanAliases.length ? { canonical: cleanCanonical || cleanAliases[0], aliases: cleanAliases, normalizedAliases: cleanAliases.map(normalizeArabic).filter(Boolean) } : null;
};

const parseOpeningAliasGroups = (value = '') => {
  const groups = [];
  String(value || '').split(/\r?\n/g).forEach((line) => {
    const clean = line.trim();
    if (!clean.startsWith('@')) return;
    const raw = clean.slice(1).trim();
    const parts = splitAliasParts(raw);
    const group = buildAliasGroup(parts[0] || raw, parts.slice(1));
    if (group) groups.push(group);
  });
  return groups;
};

const parseOpeningAliasGroupsDeep = (value = '') => {
  const lines = String(value || '').replace(/\r/g, '').split('\n');
  const groups = [];
  let active = null;
  let collectAliasesForActive = false;
  const flush = () => {
    if (active) {
      const group = buildAliasGroup(active.canonical, active.aliases);
      if (group) groups.push(group);
    }
    active = null;
    collectAliasesForActive = false;
  };
  for (let i = 0; i < lines.length; i += 1) {
    const clean = String(lines[i] || '').trim();
    if (!clean) continue;
    if (clean.startsWith('@')) {
      flush();
      const raw = clean.slice(1).trim();
      const parts = splitAliasParts(raw);
      active = { canonical: parts[0] || raw, aliases: parts.slice(1) };
      collectAliasesForActive = false;
      continue;
    }
    if (!active) continue;
    const norm = normalizeArabic(clean);
    if (norm.includes('كلمات افتتاحيه') || norm.includes('كلمات للبحث') || norm.includes('افتتاحيات') || norm.includes('مرادفات')) {
      collectAliasesForActive = true;
      continue;
    }
    if (isSectionSeparatorLine(clean)) {
      collectAliasesForActive = false;
      continue;
    }
    if (collectAliasesForActive) {
      const aliases = splitAliasParts(clean).map((part) => part.replace(/[🔹•✅⭐📌]/g, '').trim()).filter(Boolean);
      if (aliases.length) active.aliases.push(...aliases);
      collectAliasesForActive = false;
    }
  }
  flush();
  const byKey = new Map();
  groups.forEach((group) => {
    const key = normalizeArabic(group.canonical);
    const prev = byKey.get(key);
    if (!prev) byKey.set(key, group);
    else byKey.set(key, buildAliasGroup(prev.canonical, [...(prev.aliases || []), ...(group.aliases || [])]));
  });
  return [...byKey.values()].filter(Boolean);
};

const aliasGroupsToText = (groups = []) => groups
  .map((group) => '@' + String(group.canonical || '').replace(/\s+/g, '_') + ' | ' + (group.aliases || []).join(' | '))
  .join('\n');

const collectOpeningAliasGroups = (content = '', extraOpeningKeywords = '') => parseOpeningAliasGroupsDeep(String(extraOpeningKeywords || '') + '\n' + String(content || ''));

const isSectionSeparatorLine = (line = '') => {
  const clean = String(line || '').trim();
  if (!clean) return false;
  return /^[-–—_=*#]{3,}$/.test(clean) || /^\.{3,}$/.test(clean) || /^(فاصل|فصلة|فصل|قسم جديد|نقطة جديدة)$/i.test(clean);
};

const findAliasGroupForLine = (line = '', groups = []) => {
  const normalizedLine = normalizeArabic(String(line || '').replace(/^@/, '').replace(/_/g, ' '));
  if (!normalizedLine) return null;
  return groups.find((group) => (group.normalizedAliases || []).some((alias) => alias && normalizedLine === alias));
};

const findAliasGroupInQuestion = (question = '', groups = []) => {
  const qNorm = normalizeArabic(question);
  if (!qNorm) return null;
  const scored = groups.map((group) => {
    const score = (group.normalizedAliases || []).reduce((sum, alias) => {
      if (!alias) return sum;
      return sum + (qNorm.includes(alias) ? Math.max(4, alias.split(' ').length * 3) : 0);
    }, 0);
    return { group, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  return scored[0]?.group || null;
};

const extractLessonSections = (content = '', extraOpeningKeywords = '') => {
  const raw = String(content || '').replace(/\r/g, '').trim();
  if (!raw) return [];
  const globalGroups = collectOpeningAliasGroups(raw, extraOpeningKeywords);
  const lines = raw.split('\n');
  const sections = [];
  let currentTitle = 'شرح عام';
  let currentAliases = [];
  let buffer = [];
  let insideOpeningKeywordBlock = false;
  const push = () => {
    const text = buffer.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text) sections.push({ title: currentTitle, aliases: uniqueList(currentAliases), text, searchable: normalizeArabic([currentTitle, currentAliases.join(' '), text].join(' ')) });
    buffer = [];
  };
  const setTitle = (title, aliases = []) => {
    currentTitle = String(title || 'شرح عام').replace(/^#{1,4}\s+/, '').replace(/^\[|\]$/g, '').replace(/^@/, '').replace(/_/g, ' ').replace(/[🔹•✅⭐📌]/g, '').trim() || 'شرح عام';
    currentAliases = uniqueList(aliases);
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || '';
    const clean = line.trim();
    if (!clean) { if (!insideOpeningKeywordBlock) buffer.push(line); continue; }
    if (clean.startsWith('@')) {
      push();
      const rawLine = clean.slice(1).trim();
      const parts = splitAliasParts(rawLine);
      const directGroup = buildAliasGroup(parts[0] || rawLine, parts.slice(1));
      const deepGroup = globalGroups.find((group) => normalizeArabic(group.canonical) === normalizeArabic(directGroup?.canonical || rawLine));
      setTitle(deepGroup?.canonical || directGroup?.canonical || rawLine, deepGroup?.aliases || directGroup?.aliases || []);
      insideOpeningKeywordBlock = false;
      continue;
    }
    const norm = normalizeArabic(clean);
    if (norm.includes('كلمات افتتاحيه') || norm.includes('كلمات للبحث') || norm.includes('افتتاحيات') || norm.includes('مرادفات')) { insideOpeningKeywordBlock = true; continue; }
    if (insideOpeningKeywordBlock) { if (isSectionSeparatorLine(clean)) insideOpeningKeywordBlock = false; continue; }
    if (isSectionSeparatorLine(clean)) { insideOpeningKeywordBlock = false; continue; }
    const aliasGroup = findAliasGroupForLine(clean, globalGroups);
    const looksLikeClearHeading = clean.length <= 90 && (/^#{1,4}\s+/.test(clean) || /^\[[^\]]+\]$/.test(clean) || /^(النقطه|النقطة|الجزء|اولا|أولا|ثانيا|ثالثا|رابعا|خامسا)[:：\-]/i.test(clean));
    if (aliasGroup || looksLikeClearHeading) { push(); setTitle(aliasGroup?.canonical || clean, aliasGroup?.aliases || []); continue; }
    buffer.push(line);
  }
  push();
  if (sections.length === 0) return [{ title: 'شرح عام', aliases: [], text: raw, searchable: normalizeArabic(raw) }];
  return sections;
};

const findBestLessonPoint = (content = '', question = '', fallbackTitle = '', extraOpeningKeywords = '') => {
  const sections = extractLessonSections(content, extraOpeningKeywords);
  const groups = collectOpeningAliasGroups(content, extraOpeningKeywords);
  const aliasGroupFromQuestion = findAliasGroupInQuestion(question, groups);
  const words = tokenize(question);
  const ranked = sections.map((section) => {
    let score = 0;
    const titleNorm = normalizeArabic(section.title);
    const sectionAliases = (section.aliases || []).map(normalizeArabic).filter(Boolean);
    if (aliasGroupFromQuestion && normalizeArabic(aliasGroupFromQuestion.canonical) === titleNorm) score += 30;
    (aliasGroupFromQuestion?.normalizedAliases || []).forEach((alias) => {
      if (sectionAliases.includes(alias) || titleNorm.includes(alias)) score += 12;
    });
    words.forEach((w) => {
      if (section.searchable.includes(w)) score += 1;
      if (titleNorm.includes(w)) score += 4;
      if (sectionAliases.some((alias) => alias.includes(w))) score += 5;
    });
    return { ...section, score };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score <= 0) {
    const fallbackText = getAnswerFromContent(content, question);
    return { pointTitle: fallbackTitle || 'شرح عام', pointAliases: [], pointText: fallbackText, fullPointText: fallbackText };
  }
  const fullText = String(best.text || '').trim();
  return {
    pointTitle: best.title || fallbackTitle || 'شرح عام',
    pointAliases: best.aliases || [],
    pointText: getAnswerFromContent(fullText, question),
    fullPointText: fullText
  };
};

const makeSimplerExplanation = (text = '', studentProfile = {}) => {
  const source = String(text || '').trim();
  if (!source) return '';
  const intro = studentProfile?.weakPoint
    ? `تمام، هنفهمها بهدوء من نفس شرح المستر لأن نقطة "${studentProfile.weakPoint}" محتاجة تثبيت:`
    : 'تمام، هنفهمها بهدوء من نفس شرح المستر:';
  const cleanLines = source
    .split(/\n+/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^[-–—_=*#]{3,}$/.test(line));
  const detailed = cleanLines.slice(0, 45).map((line) => {
    if (/^(\d+[-–.)]|مثال|تريكة|قاعدة|الخلاصة|الشرح|النوع|الإجابة|السبب)/.test(line)) return line;
    return `• ${line.replace(/^[-•\s]+/, '')}`;
  });
  return [intro, ...detailed, 'لو تحب، اضغط "أمثلة أكثر" عشان أطلع لك أمثلة من نفس شرح المستر وأسئلته.'].join('\n');
};

const getStudentName = (user, userData) => userData?.name || user?.displayName || 'يا بطل';

const buildPersonalLesson = ({ answer, examples = [], weakPoints = [], studentName = 'يا بطل' }) => {
  if (!answer || answer.missing) return '';
  const topWeak = weakPoints?.[0]?.pointTitle || weakPoints?.[0]?.lesson || '';
  const exampleLines = examples.slice(0, 3).map((q, idx) => {
    const correct = q.options?.[q.correctIdx] || q.options?.[0] || '';
    return `${idx + 1}. ${q.question}\nالإجابة: ${correct}${q.explanation ? `\nالسبب: ${q.explanation}` : ''}`;
  }).join('\n\n');
  return [
    `${studentName}، ده درس سريع مخصص لك في: ${answer.pointTitle || answer.lesson || answer.title}`,
    topWeak ? `هنركز أكتر لأن عندك متابعة سابقة على: ${topWeak}` : 'هنمشي خطوة خطوة بدون حشو.',
    '1) الفكرة الأساسية:',
    answer.text,
    exampleLines ? '2) أمثلة محلولة من أسئلة المستر:\n' + exampleLines : '',
    '3) طريقة الحل:',
    'اقرأ المطلوب، حدد الكلمة أو الجملة المقصودة، طبق القاعدة، ثم راجع سبب الإجابة.',
    '4) بعد المراجعة اضغط "اختبرني" عشان نتأكد إن النقطة ثبتت.'
  ].filter(Boolean).join('\n\n');
};

const readTextFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = reject;
  reader.readAsText(file, 'utf-8');
});

const readArrayBuffer = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsArrayBuffer(file);
});

const decodeXmlText = (xml = '') => String(xml || '')
  .replace(/<w:tab\/>/g, ' ')
  .replace(/<w:br\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const inflateRaw = async (uint8) => {
  if (!('DecompressionStream' in window)) throw new Error('المتصفح لا يدعم قراءة DOCX/XLSX مباشرة. استخدم TXT/CSV أو انسخ النص.');
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(uint8);
  writer.close();
  const ab = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(ab);
};

const parseZipEntries = async (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder('utf-8');
  const entries = {};
  let pos = 0;
  while (pos < bytes.length - 30) {
    const sig = view.getUint32(pos, true);
    if (sig !== 0x04034b50) { pos += 1; continue; }
    const method = view.getUint16(pos + 8, true);
    const compressedSize = view.getUint32(pos + 18, true);
    const fileNameLength = view.getUint16(pos + 26, true);
    const extraLength = view.getUint16(pos + 28, true);
    const nameStart = pos + 30;
    const name = decoder.decode(bytes.slice(nameStart, nameStart + fileNameLength));
    const dataStart = nameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length || compressedSize <= 0) { pos = dataStart; continue; }
    const compressed = bytes.slice(dataStart, dataEnd);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = await inflateRaw(compressed);
    if (data) entries[name] = decoder.decode(data);
    pos = dataEnd;
  }
  return entries;
};

const extractDocxText = async (file) => {
  const ab = await readArrayBuffer(file);
  const entries = await parseZipEntries(ab);
  const main = entries['word/document.xml'];
  if (!main) throw new Error('لم أستطع قراءة ملف DOCX.');
  return decodeXmlText(main);
};

const extractXlsxText = async (file) => {
  const ab = await readArrayBuffer(file);
  const entries = await parseZipEntries(ab);
  const sharedXml = entries['xl/sharedStrings.xml'] || '';
  const shared = [...sharedXml.matchAll(/<t[^>]*>(.*?)<\/t>/g)].map((m) => decodeXmlText(m[1]));
  const sheets = Object.entries(entries).filter(([name]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  const rows = [];
  sheets.forEach(([name, xml]) => {
    rows.push(`--- ${name.split('/').pop()} ---`);
    const rowMatches = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)];
    rowMatches.forEach((rowMatch) => {
      const cells = [...rowMatch[1].matchAll(/<c[^>]*(?:t="(s)")?[^>]*>[\s\S]*?<v>(.*?)<\/v>[\s\S]*?<\/c>/g)].map((m) => {
        const val = decodeXmlText(m[2]);
        return m[1] === 's' ? (shared[Number(val)] || val) : val;
      });
      if (cells.length) rows.push(cells.join(' | '));
    });
  });
  return rows.join('\n').trim();
};

const extractPdfTextLight = async (file) => {
  const ab = await readArrayBuffer(file);
  const text = new TextDecoder('latin1').decode(new Uint8Array(ab));
  const parts = [];
  const parenMatches = [...text.matchAll(/\(([^()]{2,300})\)\s*Tj/g)].map((m) => m[1]);
  const arrayMatches = [...text.matchAll(/\[((?:\([^()]{1,200}\)\s*)+)\]\s*TJ/g)].map((m) => m[1].replace(/[()]/g, ' '));
  parts.push(...parenMatches, ...arrayMatches);
  const clean = parts.join('\n').replace(/\\[()]/g, '').replace(/\s{2,}/g, ' ').trim();
  if (!clean || clean.length < 50) throw new Error('قراءة PDF مباشرة محدودة. لو النص لم يظهر، صدّر الملف TXT أو DOCX وارفعه.');
  return clean;
};

const extractTextFromUpload = async (file) => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) return readTextFile(file);
  if (name.endsWith('.docx')) return extractDocxText(file);
  if (name.endsWith('.xlsx')) return extractXlsxText(file);
  if (name.endsWith('.pdf')) return extractPdfTextLight(file);
  return readTextFile(file);
};

const RafiqHeader = ({ compact = false }) => (
  <div className={`bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-[2rem] ${compact ? 'p-5' : 'p-7'} shadow-xl border border-amber-500/20 overflow-hidden relative`}>
    <div className="absolute -left-16 -top-16 w-44 h-44 bg-amber-400/20 blur-3xl rounded-full" />
    <div className="relative z-10 flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg"><BrainCircuit size={28}/></div>
      <div>
        <p className="text-amber-200 font-black text-sm">من شرح المستر فقط</p>
        <h2 className="text-2xl md:text-3xl font-black">رفيقك في العربي</h2>
        <p className="text-slate-300 text-sm mt-1">مدرس مساعد يشرح من محتوى المستر، يبسّط حسب الطالب، ويقترح درسًا مخصصًا بدون هبد.</p>
      </div>
    </div>
  </div>
);

const cleanForFirestore = (value) => {
  if (Array.isArray(value)) return value.map(cleanForFirestore).filter((item) => item !== undefined);
  if (value && typeof value === 'object' && !(value instanceof Date)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, cleanForFirestore(v)]).filter(([, v]) => v !== undefined));
  if (value === undefined) return '';
  return value;
};

const buildExplanationPayload = ({ form, title, content, keywords, openingKeywords, source = 'admin' }) => cleanForFirestore({
  grade: form.grade || 'all',
  branch: form.branch || 'عام',
  lesson: form.lesson || title || '',
  title: title || form.lesson || 'شرح',
  keywords: uniqueList(keywords || []),
  openingKeywords: openingKeywords || '',
  content: String(content || ''),
  searchableText: normalizeArabic([title, form.lesson, form.branch, (keywords || []).join(' '), openingKeywords, content].join(' ')),
  source
});

const safeErrorMessage = (error) => {
  const message = String(error?.message || error?.code || error || 'حدث خطأ غير معروف');
  return message.length > 260 ? message.slice(0, 260) + '...' : message;
};

const safeDocs = async (q, label = 'Firestore query') => {
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn(`${label} failed:`, safeErrorMessage(error));
    return [];
  }
};

const dedupeByIdOrLesson = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.id || lessonKeyOf(item) || normalizeArabic([item.title, item.lesson, item.content].join('|')).slice(0, 120);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const AdminRafiqPanel = ({ adminGradeFilter = 'all' }) => {
  const [form, setForm] = useState({ grade: adminGradeFilter || 'all', branch: 'عام', lesson: '', title: '', keywords: '', openingKeywords: '', content: '' });
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ explanations: 0, questions: 0, exams: 0, weak: 0 });

  useEffect(() => {
    let active = true;
    Promise.all([
      safeDocs(query(collection(db, 'lesson_explanations'), limit(700)), 'admin lesson_explanations'),
      safeDocs(query(collection(db, 'rafiq_lessons'), limit(700)), 'admin rafiq_lessons'),
      safeDocs(query(collection(db, 'rafiq_question_bank'), limit(700)), 'admin rafiq_question_bank'),
      safeDocs(query(collection(db, 'rafiq_questions'), limit(700)), 'admin rafiq_questions'),
      safeDocs(query(collection(db, 'exams'), limit(500)), 'admin exams'),
      safeDocs(query(collection(db, 'rafiq_student_weak_points'), limit(500)), 'admin rafiq_student_weak_points')
    ]).then(([exDocs, legacyExDocs, qDocs, legacyQDocs, examDocs, weakDocs]) => {
      const allExDocs = dedupeByIdOrLesson([...exDocs, ...legacyExDocs]);
      const allQDocs = [...qDocs, ...legacyQDocs];
      if (active) setStats({ explanations: allExDocs.length, questions: allQDocs.length, exams: examDocs.length, weak: weakDocs.length });
    }).catch(() => {});
    return () => { active = false; };
  }, [message]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleExplanationFile = async (file) => {
    if (!file) return;
    setFileLoading(true);
    try {
      const extracted = await extractTextFromUpload(file);
      if (!extracted.trim()) return alert('لم أستطع استخراج نص واضح من الملف.');
      const extractedAliasGroups = parseOpeningAliasGroups(extracted);
      setForm((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^.]+$/, ''),
        lesson: prev.lesson || file.name.replace(/\.[^.]+$/, ''),
        openingKeywords: uniqueList([prev.openingKeywords, aliasGroupsToText(extractedAliasGroups)]).join('\n'),
        content: prev.content ? `${prev.content}\n\n---\nمحتوى مستخرج من الملف: ${file.name}\n${extracted}` : extracted
      }));
      setMessage(`تم استخراج الشرح من الملف: ${file.name}. راجعه ثم اضغط حفظ/دمج.`);
    } catch (error) {
      alert(error?.message || 'تعذر قراءة الملف.');
    } finally { setFileLoading(false); }
  };

  const saveExplanation = async () => {
    if (!form.lesson.trim() && !form.title.trim()) return alert('اكتب اسم الدرس أو عنوان الشرح أولًا.');
    if (!form.content.trim()) return alert('اكتب محتوى الشرح أو ارفع ملفًا أولًا.');
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'lesson_explanations'), limit(900)));
      const incomingKey = lessonKeyOf(form);
      const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() })).find((item) => lessonKeyOf(item) === incomingKey);
      const nowTitle = form.title.trim() || form.lesson.trim();
      const newOpeningAliasGroups = collectOpeningAliasGroups(form.content, form.openingKeywords);
      const newOpeningAliasText = aliasGroupsToText(newOpeningAliasGroups);
      const newKeywords = uniqueList([...parseKeywords(form.keywords), ...newOpeningAliasGroups.flatMap((group) => group.aliases || []), form.lesson, form.branch]);
      const oldContent = existing ? String(existing.content || '').trim() : '';
      const addition = String(form.content || '').trim();
      const mergedContent = existing ? (oldContent.includes(addition) ? oldContent : (oldContent + "\n\n---\nإضافة جديدة من المستر:\n" + addition).trim()) : addition;
      const mergedOpeningKeywords = existing ? uniqueList([existing.openingKeywords || '', newOpeningAliasText]).join('\n') : (newOpeningAliasText || form.openingKeywords || '');
      const mergedKeywords = existing ? uniqueList([...(parseKeywords(existing.keywords) || []), ...newKeywords]) : newKeywords;
      const payload = buildExplanationPayload({ form, title: existing?.title || nowTitle, content: mergedContent, keywords: mergedKeywords, openingKeywords: mergedOpeningKeywords, source: existing ? 'admin_merge' : 'admin' });
      if (existing) {
        try {
          await updateDoc(doc(db, 'lesson_explanations', existing.id), { ...payload, updatedAt: serverTimestamp(), lastMergeSource: 'admin_file_or_text' });
          setMessage("تم دمج الإضافة الجديدة مع شرح درس: " + (form.lesson || nowTitle));
        } catch (updateError) {
          await addDoc(collection(db, 'lesson_explanations'), { ...payload, supersedesId: existing.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), source: 'admin_merge_fallback' });
          setMessage("تم حفظ نسخة مدمجة جديدة لدرس: " + (form.lesson || nowTitle));
        }
      } else {
        await addDoc(collection(db, 'lesson_explanations'), { ...payload, createdAt: serverTimestamp() });
        setMessage('تم حفظ شرح جديد من المستر بنجاح.');
      }
      setForm((prev) => ({ ...prev, title: '', keywords: '', openingKeywords: '', content: '' }));
    } catch (error) { alert('تعذر حفظ/دمج الشرح: ' + safeErrorMessage(error)); }
    finally { setLoading(false); }
  };

  const uploadQuestions = async () => {
    const rows = parseQuestionCsv(csvText);
    if (rows.length === 0) return alert('لم يتم العثور على أسئلة صالحة. تأكد من تنسيق CSV.');
    setLoading(true);
    try {
      let batch = writeBatch(db);
      let counter = 0;
      for (const row of rows) {
        const ref = doc(collection(db, 'rafiq_question_bank'));
        batch.set(ref, { ...row, searchableText: normalizeArabic([row.question, row.lesson, row.branch, row.explanation, (row.tags || []).join(' ')].join(' ')), createdAt: serverTimestamp(), source: 'csv' });
        counter += 1;
        if (counter % 400 === 0) { await batch.commit(); batch = writeBatch(db); }
      }
      await batch.commit();
      setCsvText('');
      setMessage(`تم رفع ${rows.length} سؤال إلى بنك رفيقك في العربي.`);
    } catch (error) { alert('تعذر رفع الأسئلة: ' + safeErrorMessage(error)); }
    finally { setLoading(false); }
  };

  return <div className="space-y-6">
    <RafiqHeader />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">شروحات محفوظة</p><p className="text-4xl font-black text-amber-700 mt-2">{stats.explanations}</p></div>
      <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">أسئلة بنك رفيق</p><p className="text-4xl font-black text-blue-700 mt-2">{stats.questions}</p></div>
      <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-sm"><p className="text-sm text-slate-500 font-bold">امتحانات للأمثلة</p><p className="text-4xl font-black text-purple-700 mt-2">{stats.exams}</p></div>
      <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 shadow-sm"><p className="text-sm text-rose-700 font-black">نقاط ضعف مسجلة</p><p className="text-4xl font-black text-rose-700 mt-2">{stats.weak}</p></div>
    </div>
    {message && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 font-black flex items-center gap-2"><CheckCircle/> {message}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><BookOpen className="text-amber-600"/> إضافة أو استكمال شرح درس</h3>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-sm text-amber-800 font-bold mb-4">ارفع TXT أو DOCX أو PDF أو Excel/CSV، ولو نفس الصف + الفرع + الدرس موجودين هيتدمج تلقائيًا مع الشرح القديم.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select value={form.grade} onChange={(e) => update('grade', e.target.value)} className="border rounded-2xl p-3 font-bold bg-white">{GRADES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select value={form.branch} onChange={(e) => update('branch', e.target.value)} className="border rounded-2xl p-3 font-bold bg-white">{BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}</select>
          <input value={form.lesson} onChange={(e) => update('lesson', e.target.value)} className="border rounded-2xl p-3 font-bold" placeholder="اسم الدرس: النعت" />
          <input value={form.title} onChange={(e) => update('title', e.target.value)} className="border rounded-2xl p-3 font-bold" placeholder="عنوان اختياري للشرح" />
        </div>
        <input value={form.keywords} onChange={(e) => update('keywords', e.target.value)} className="border rounded-2xl p-3 font-bold w-full mb-3" placeholder="كلمات مفتاحية مفصولة بفواصل: نعت، منعوت، إعراب" />
        <textarea
          value={form.openingKeywords}
          onChange={(e) => update('openingKeywords', e.target.value)}
          className="border rounded-2xl p-4 font-bold w-full mb-3 min-h-[110px] leading-relaxed bg-slate-50"
          placeholder={'خريطة افتتاحيات الأقسام والمرادفات:\n@تعريف_الكناية | تعريف الكناية | معنى الكناية | ما هي الكناية | مقدمة الكناية\n@انواع_الكناية | أنواع الكناية | أقسام الكناية | صفة موصوف نسبة'}
        />
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs text-blue-800 font-bold leading-relaxed mb-3">
          استخدم @ لتعريف قسم جديد. يمكنك كتابة المرادفات في نفس السطر بعد | أو تحت سطر "كلمات افتتاحية للبحث:". الفواصل مثل === و--- تُقبل للقراءة ولا تكسر الحفظ، والإيموجي والمسافات والسطور الطويلة مسموحة.
        </div>
        <label className="mb-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-200 bg-amber-50/60 rounded-3xl p-5 cursor-pointer hover:bg-amber-50 transition">
          <FileText className="text-amber-700" />
          <span className="font-black text-amber-800">ارفع ملف شرح TXT / DOCX / PDF / Excel</span>
          <span className="text-xs text-amber-700">سيتم استخراج النص داخل المتصفح ثم تراجعه قبل الحفظ</span>
          <input type="file" accept=".txt,.md,.csv,.docx,.xlsx,.pdf" className="hidden" onChange={(e) => handleExplanationFile(e.target.files?.[0])} />
        </label>
        {fileLoading && <p className="text-sm font-bold text-blue-700 bg-blue-50 rounded-xl p-3 mb-3 flex items-center gap-2"><Loader2 className="animate-spin"/> جاري قراءة الملف...</p>}
        <textarea value={form.content} onChange={(e) => update('content', e.target.value)} className="border rounded-2xl p-4 w-full min-h-[260px] leading-loose" placeholder="اكتب شرح المستر أو الإضافة الجديدة هنا..." />
        <button disabled={loading} onClick={saveExplanation} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <PlusCircle/>} حفظ / دمج الشرح</button>
      </div>
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><ClipboardList className="text-blue-600"/> رفع أسئلة كثيرة مرة واحدة CSV</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed mb-3" dir="ltr">grade,lesson,branch,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,tags,includeInQuiz<br/>1sec,النعت,نحو,"حدد النعت في الجملة","الطالب","المجتهد","في","الفصل",B,"النعت يصف المنعوت",easy,"نعت,منعوت",true</div>
        <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} className="border rounded-2xl p-4 w-full min-h-[320px] font-mono text-sm" placeholder="الصق ملف CSV هنا أو انسخ من Excel..." dir="ltr" />
        <div className="flex flex-col md:flex-row gap-3 mt-4"><button disabled={loading} onClick={uploadQuestions} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <UploadCloud/>} رفع الأسئلة</button><button onClick={() => setCsvText('grade,lesson,branch,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,difficulty,tags,includeInQuiz\n')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black">قالب فارغ</button></div>
      </div>
    </div>
  </div>;
};

export const StudentRafiqAssistant = ({ user, userData }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [explanations, setExplanations] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [weakPoints, setWeakPoints] = useState([]);
  const [exampleQuestions, setExampleQuestions] = useState([]);
  const [exampleIds, setExampleIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState([]);
  const [selected, setSelected] = useState({});
  const [simplerText, setSimplerText] = useState('');
  const [personalLesson, setPersonalLesson] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      safeDocs(query(collection(db, 'lesson_explanations'), limit(1200)), 'student lesson_explanations'),
      safeDocs(query(collection(db, 'rafiq_lessons'), limit(1200)), 'student rafiq_lessons'),
      safeDocs(query(collection(db, 'rafiq_question_bank'), limit(2200)), 'student rafiq_question_bank'),
      safeDocs(query(collection(db, 'rafiq_questions'), limit(2200)), 'student rafiq_questions'),
      safeDocs(query(collection(db, 'exams'), limit(600)), 'student exams'),
      safeDocs(query(collection(db, 'rafiq_student_weak_points'), limit(600)), 'student rafiq_student_weak_points')
    ]).then(([exDocs, legacyExDocs, qDocs, legacyQDocs, examDocs, weakDocs]) => {
      if (!active) return;
      const newestFirst = (a, b) => Number(b?.createdAt?.seconds || 0) - Number(a?.createdAt?.seconds || 0);
      const allExDocs = dedupeByIdOrLesson([...exDocs, ...legacyExDocs]);
      const allQDocs = [...qDocs, ...legacyQDocs];
      setExplanations(allExDocs.sort(newestFirst));
      setBankQuestions(allQDocs.sort(newestFirst).map((d) => ({ source: 'bank', ...d })));
      setExamQuestions(examDocs.sort(newestFirst).flatMap((d) => flattenExamQuestions(d)));
      const uid = user?.uid || '';
      setWeakPoints(weakDocs.sort(newestFirst).filter((w) => !uid || w.studentId === uid || w.userId === uid).slice(0, 20));
    }).catch((error) => console.warn('Rafiq load failed:', safeErrorMessage(error))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user?.uid]);

  const allQuestions = useMemo(() => [...bankQuestions, ...examQuestions], [bankQuestions, examQuestions]);
  const studentName = getStudentName(user, userData);
  const topWeakPoint = weakPoints?.[0]?.pointTitle || weakPoints?.[0]?.lesson || '';

  const logInteraction = async ({ type, payload = {} }) => {
    try {
      await addDoc(collection(db, 'rafiq_interactions'), {
        type,
        studentId: user?.uid || '',
        studentName,
        grade: userData?.grade || 'all',
        question: question.trim(),
        questionSignature: buildQuestionSignature(question),
        answerTitle: answer?.title || '',
        lesson: answer?.lesson || '',
        pointTitle: answer?.pointTitle || '',
        payload,
        createdAt: serverTimestamp()
      });
    } catch {}
  };

  const ask = async () => {
    if (!question.trim()) return alert('اكتب سؤالك الأول.');
    setAnswer(null); setQuiz([]); setSelected({}); setExampleQuestions([]); setExampleIds([]); setSimplerText(''); setPersonalLesson(''); setFeedbackSent(false);
    const userGrade = userData?.grade || 'all';
    const ranked = explanations
      .map((item) => ({ item, score: scoreExplanation(item, question, userGrade) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
      setAnswer({ missing: true, title: 'النقطة غير موجودة حاليًا', text: explanations.length === 0 ? 'لم يتم تحميل أي شرح محفوظ بعد. تأكد أن الشرح محفوظ في مكتبة رفيقك وأن قواعد Firestore منشورة.' : 'النقطة دي مش موجودة في شرح المستر المتاح حاليًا. جرّب كتابة اسم الدرس أو إحدى الكلمات الافتتاحية، وتم تسجيلها كموضوع يحتاج إضافة شرح لاحقًا.', lesson: '' });
      try { await addDoc(collection(db, 'rafiq_unanswered_questions'), { studentId: user?.uid || '', studentName, grade: userGrade, question, createdAt: serverTimestamp() }); } catch {}
      return;
    }

    const best = ranked[0].item;
    const point = findBestLessonPoint(best.content, question, best.lesson || best.title || 'شرح عام', best.openingKeywords || '');
    const newAnswer = {
      missing: false,
      title: best.title || best.lesson || 'شرح المستر',
      lesson: best.lesson || '',
      branch: best.branch || 'عام',
      pointTitle: point.pointTitle,
      pointAliases: point.pointAliases || [],
      text: point.pointText,
      fullText: point.fullPointText || point.pointText,
      source: 'من مكتبة شرح المستر'
    };
    setAnswer(newAnswer);
    try {
      await addDoc(collection(db, 'rafiq_answered_questions'), {
        studentId: user?.uid || '', studentName, grade: userGrade, question,
        lesson: newAnswer.lesson, branch: newAnswer.branch, pointTitle: newAnswer.pointTitle, createdAt: serverTimestamp()
      });
    } catch {}
  };

  const showMoreExamples = () => {
    if (!answer || answer.missing) return;
    // الأولوية لأمثلة المستر المكتوبة داخل الشرح نفسه، ثم أسئلة المستر والامتحانات.
    const contentExamples = extractContentExamples(answer.fullText || answer.text || '');
    const ranked = rankQuestions(allQuestions, { answer, question, userGrade: userData?.grade || 'all', excludeIds: contentExamples.map((q) => q.id), allowExamples: true });
    const bankExamples = shuffle(ranked).slice(0, Math.max(0, 6 - contentExamples.length));
    const examples = [...contentExamples.slice(0, 6), ...bankExamples].slice(0, 8);
    if (examples.length === 0) return alert('لا توجد أمثلة مرتبطة بهذه النقطة في شرح المستر أو أسئلته حتى الآن.');
    setExampleQuestions(examples);
    setExampleIds(examples.map((q) => q.id));
    logInteraction({ type: 'examples_requested', payload: { exampleIds: examples.map((q) => q.id), examplesCount: examples.length } });
  };

  const explainSimpler = () => {
    if (!answer || answer.missing) return;
    setSimplerText(makeSimplerExplanation(answer.fullText || answer.text, { weakPoint: topWeakPoint }));
    logInteraction({ type: 'simpler_requested' });
  };

  const generatePersonalLesson = () => {
    if (!answer || answer.missing) return;
    let examples = exampleQuestions;
    if (examples.length === 0) {
      const ranked = rankQuestions(allQuestions, { answer, question, userGrade: userData?.grade || 'all', excludeIds: [], allowExamples: true });
      examples = shuffle(ranked).slice(0, 4);
      setExampleQuestions(examples);
      setExampleIds(examples.map((q) => q.id));
    }
    setPersonalLesson(buildPersonalLesson({ answer, examples, weakPoints, studentName }));
    logInteraction({ type: 'personal_lesson_generated', payload: { examplesCount: examples.length } });
  };

  const sendUnderstanding = async (understood) => {
    if (!answer || feedbackSent) return;
    setFeedbackSent(true);
    await logInteraction({ type: understood ? 'understood' : 'not_understood', payload: { understood } });
    if (!understood) {
      try {
        await addDoc(collection(db, 'rafiq_student_weak_points'), {
          studentId: user?.uid || '', studentName, grade: userData?.grade || 'all',
          lesson: answer.lesson || '', branch: answer.branch || '', pointTitle: answer.pointTitle || answer.title || '',
          question, createdAt: serverTimestamp(), status: 'needs_review'
        });
      } catch {}
      if (!simplerText) setSimplerText(makeSimplerExplanation(answer.text, { weakPoint: answer.pointTitle }));
    }
  };

  const generateQuiz = () => {
    if (!answer || answer.missing) return;
    const ranked = rankQuestions(allQuestions, { answer, question, userGrade: userData?.grade || 'all', excludeIds: exampleIds, allowExamples: false });
    const quizQuestions = shuffle(ranked).slice(0, 6);
    if (quizQuestions.length === 0) return alert('لا توجد أسئلة كافية مرتبطة بهذه النقطة بعد استبعاد أمثلة الشرح. ارفع أسئلة أكثر من لوحة الأدمن.');
    setQuiz(quizQuestions); setSelected({});
    logInteraction({ type: 'quiz_generated', payload: { quizIds: quizQuestions.map((q) => q.id), quizCount: quizQuestions.length } });
  };
  const correctCount = quiz.reduce((sum, q) => sum + (selected[q.id] === q.correctIdx ? 1 : 0), 0);

  return <div className="space-y-6 page-soft-enter">
    <RafiqHeader compact />
    {topWeakPoint && <div className="bg-amber-50 border border-amber-100 rounded-3xl p-4 text-amber-900 font-bold flex items-center gap-3"><User/> {studentName}، هنراعي إن عندك نقطة محتاجة تثبيت: <span className="font-black">{topWeakPoint}</span></div>}
    <div className="bg-white rounded-3xl p-5 md:p-7 border border-slate-100 shadow-sm">
      <div className="flex flex-col md:flex-row gap-3">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} className="flex-1 border-2 border-slate-100 focus:border-amber-400 rounded-2xl p-4 font-bold outline-none" placeholder="اسأل رفيقك: مش فاهم النعت الحقيقي، الفرق بين الحال والنعت، إزاي أطلع الاستعارة..." />
        <button onClick={ask} disabled={loading} className="bg-slate-950 hover:bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="animate-spin"/> : <Search/>} اسأل رفيقك</button>
      </div>
      <p className="text-xs text-slate-400 mt-3 font-bold">الرد من شرح المستر فقط. الأمثلة من أسئلة المستر والامتحانات، ولا تتكرر في الاختبار الحالي.</p>
    </div>
    {answer && <div className={`rounded-3xl p-6 border shadow-sm ${answer.missing ? 'bg-amber-50 border-amber-200' : 'bg-white border-emerald-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-4"><div><p className={`text-xs font-black mb-1 ${answer.missing ? 'text-amber-700' : 'text-emerald-700'}`}>{answer.source || 'مطلوب إضافة شرح'}</p><h3 className="text-2xl font-black text-slate-900">{answer.title}</h3>{!answer.missing && <p className="text-sm text-slate-500 mt-1">{answer.branch} {answer.lesson ? `— ${answer.lesson}` : ''}</p>}{!answer.missing && answer.pointTitle && <p className="inline-flex mt-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-full px-4 py-1 text-xs font-black">النقطة المطابقة: {answer.pointTitle}</p>}</div>{answer.missing ? <XCircle className="text-amber-600"/> : <Sparkles className="text-emerald-600"/>}</div>
      <div className="bg-slate-50 rounded-2xl p-5 leading-loose text-slate-800 whitespace-pre-wrap font-bold">{answer.text}</div>
      {simplerText && <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-5 leading-loose text-blue-900 whitespace-pre-wrap font-bold">{simplerText}</div>}
      {personalLesson && <div className="mt-4 bg-purple-50 border border-purple-100 rounded-2xl p-5 leading-loose text-purple-950 whitespace-pre-wrap font-bold"><div className="flex items-center gap-2 mb-2 text-purple-800 font-black"><GraduationCap/> درس مخصص لك</div>{personalLesson}</div>}
      {!answer.missing && <div className="mt-5 flex flex-col md:flex-row flex-wrap gap-3"><button onClick={explainSimpler} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><BrainCircuit/> افهمني أكتر</button><button onClick={showMoreExamples} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Lightbulb/> أمثلة أكثر</button><button onClick={generatePersonalLesson} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><GraduationCap/> اعملي درس مخصص</button><button onClick={generateQuiz} className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><ClipboardList/> اختبرني على النقطة دي</button></div>}
      {!answer.missing && <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4"><p className="text-sm font-black text-slate-700 mb-3">هل الشرح وضح لك النقطة؟</p><div className="flex gap-2"><button disabled={feedbackSent} onClick={() => sendUnderstanding(true)} className="bg-emerald-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-black">نعم فهمت</button><button disabled={feedbackSent} onClick={() => sendUnderstanding(false)} className="bg-rose-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-black">لا، محتاج أبسط</button></div>{feedbackSent && <p className="text-xs text-slate-500 mt-2 font-bold">تم تسجيل إجابتك لتحسين متابعة نقاط ضعفك.</p>}</div>}
    </div>}
    {exampleQuestions.length > 0 && <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 shadow-sm"><h3 className="text-xl font-black text-blue-900 flex items-center gap-2 mb-4"><Lightbulb/> أمثلة من شرح المستر وأسئلته</h3><div className="space-y-3">{exampleQuestions.map((q, idx) => <div key={q.id || idx} className="bg-white border border-blue-100 rounded-2xl p-4"><p className="font-black text-slate-900 mb-2">مثال {idx + 1}: {q.question}</p>{q.options?.length > 0 && <p className="text-sm text-slate-700 mb-2"><b>الإجابة:</b> {q.options[q.correctIdx] || q.options[0]}</p>}{q.explanation && <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap"><b>الشرح:</b> {q.explanation}</p>}<p className="text-[11px] text-slate-400 mt-2">هذا المثال للشرح فقط ولن يدخل في الاختبار الحالي.</p></div>)}</div></div>}
    {quiz.length > 0 && <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"><div className="flex items-center justify-between gap-3 mb-5"><h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><ClipboardList className="text-amber-600"/> اختبار سريع من أسئلة المستر</h3><span className="bg-slate-900 text-white px-4 py-2 rounded-full font-black text-sm">{correctCount}/{quiz.length}</span></div><div className="space-y-4">{quiz.map((q, idx) => <div key={q.id || idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/70"><p className="font-black text-slate-900 mb-3">{idx + 1}. {q.question}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-2">{(q.options || []).map((opt, optIdx) => { const picked = selected[q.id] === optIdx; const revealed = selected[q.id] !== undefined; const correct = q.correctIdx === optIdx; return <button key={optIdx} onClick={() => setSelected((prev) => ({ ...prev, [q.id]: optIdx }))} className={`text-right p-3 rounded-xl border font-bold transition ${revealed && correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : picked ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-200'}`}>{opt}</button>; })}</div>{selected[q.id] !== undefined && q.explanation && <p className="mt-3 text-sm bg-white rounded-xl p-3 text-slate-600 leading-relaxed"><b>الشرح:</b> {q.explanation}</p>}</div>)}</div></div>}
  </div>;
};
