import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { safeNumber } from '@shared/core/platformShared.jsx';
import { QUESTION_BRANCHES } from '../constants/questionBankConstants.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export const cleanImportedLine = (value = '') => String(value)
  .replace(/\u00a0/g, ' ')
  .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
  .replace(/[\t ]+/g, ' ')
  .trim();

export const normalizeArabicKey = (value = '') => String(value)
  .replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[ًٌٍَُِّْـ]/g, '')
  .replace(/\s+/g, '').toLowerCase();

export const detectBranchFromText = (text = '') => {
  const normalized = normalizeArabicKey(text);
  if (normalized.includes('بلاغ')) return 'البلاغة';
  if (normalized.includes('نحو') || normalized.includes('اعراب') || normalized.includes('منادي') || normalized.includes('صرف')) return 'النحو';
  if (normalized.includes('ادب')) return 'الأدب';
  if (normalized.includes('قصه')) return 'القصة';
  return '';
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toWesternDigits = (value = '') => String(value)
  .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
  .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
const QUESTION_START_RE = /^\s*(?:[-–—ـ•●▪◦*]\s*)?(?:س(?:ؤال)?\s*)?(?:[\[(（{]\s*)?(\d{1,4}|[٠-٩]{1,4}|[۰-۹]{1,4})(?:\s*[\])）}])?\s*(?:[-–—ـ.:：،؛/\\]|\)|\]|）)?\s*(.*)$/iu;

// قاعدة حاسمة: أي سطر يبدأ برقم هو رأس سؤال جديد، حتى لو لم توجد مسافة
// بعد الرقم أو كان الرقم محاطًا بنقطة/شرطة/قوس أو سبقه رمز تعداد.
export const parseQuestionStart = (line = '') => {
  const cleaned = cleanImportedLine(line);
  const match = cleaned.match(QUESTION_START_RE);
  if (!match) return null;
  const number = Number(toWesternDigits(match[1]));
  if (!Number.isFinite(number)) return null;
  return { number, text: cleanImportedLine(match[2] || '') };
};
const OPTION_LABEL_TOKEN = '[أإآاابجدهـهوزحطA-Ha-h١-٨1-8]';
const OPTION_MARKER_BODY = `(?:[\\[(（{]\\s*(${OPTION_LABEL_TOKEN})\\s*[\\])）}]|(${OPTION_LABEL_TOKEN})\\s*(?:[-–—ـ.:：،؛/\\\\]|\\)|\\]|）))`;
const OPTION_START_RE = new RegExp(`^\\s*(?:[-–—ـ•●▪◦*]\\s*)?${OPTION_MARKER_BODY}\\s*(.*)$`, 'u');

const normalizedOptionLabel = (value = '') => {
  const raw = cleanImportedLine(value).toUpperCase();
  return ['ا', 'إ', 'آ'].includes(raw) ? 'أ' : raw;
};

const isPlausibleOptionSequence = (markers = []) => {
  if (!markers.length) return false;
  const indexes = markers.map((item) => item.index);
  if (indexes[0] !== 0 && markers.length < 2) return false;
  let expected = indexes[0];
  let score = 0;
  for (const index of indexes) {
    if (index === expected) { score += 1; expected += 1; }
    else if (index === expected - 1) score += 0.15; // يتحمل تكرار حرف بالخطأ داخل Word
    else if (index > expected) { score -= (index - expected) * 0.4; expected = index + 1; }
    else score -= 0.5;
  }
  return score >= Math.min(2, markers.length);
};

// يكتشف الاختيارات بصرف النظر عن الفاصل أو المسافة السابقة لها. هذا مهم لأن Word
// كثيرًا ما يدمج نهاية الاختيار مع بداية التالي هكذا: "...شفاء؟ب – ...".
// بعد الاكتشاف نختار أفضل سلسلة منطقية (أ، ب، ج، د...) حتى لا نعتبر حرفًا داخل كلمة اختيارًا.
export const findOptionMarkers = (source = '') => {
  const text = String(source || '').replace(/[\u200e\u200f\u202a-\u202e]/g, '');
  const re = new RegExp(OPTION_MARKER_BODY, 'gu');
  const candidates = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    const label = normalizedOptionLabel(match[1] || match[2] || '');
    const index = labelToIndex(label);
    if (index < 0 || index > 7) continue;
    candidates.push({ markerStart: match.index, contentStart: re.lastIndex, label, index });
    if (!match[0].length) re.lastIndex += 1;
  }

  if (!candidates.length) return [];

  let best = [];
  let bestScore = -Infinity;
  for (let i = 0; i < candidates.length; i += 1) {
    const chain = [candidates[i]];
    let expected = candidates[i].index + 1;
    let score = candidates[i].index === 0 ? 2 : 0;
    for (let j = i + 1; j < candidates.length; j += 1) {
      const candidate = candidates[j];
      if (candidate.index === expected) {
        chain.push(candidate); score += 3; expected += 1;
      } else if (candidate.index === expected - 1 && chain.length === 1) {
        // بعض ملفات Word تكرر حرف الاختيار عند كسر السطر/الصفحة؛ نحتفظ به مؤقتًا
        // لكن السلسلة المنتظمة تظل أعلى تقييمًا.
        chain.push(candidate); score += 0.2;
      } else if (candidate.index > expected && candidate.index - expected <= 1) {
        chain.push(candidate); score += 1; expected = candidate.index + 1;
      }
    }
    if (chain.length >= 2 && isPlausibleOptionSequence(chain) && score > bestScore) {
      best = chain; bestScore = score;
    }
  }

  // إذا كانت الفقرة تحتوي اختيارًا واحدًا فقط، parseOptionLine يتعامل معه لاحقًا.
  return best;
};

export const stripQuestionPrefix = (line = '') => {
  const cleaned = cleanImportedLine(line);
  const m = parseQuestionStart(cleaned);
  if (m) return cleanImportedLine(m.text);
  return cleaned.replace(/^س(?:ؤال)?\s*\d*\s*[:：\-–—.)،]?\s*/iu, '').replace(/^Q\s*\d*\s*[:：\-–—.)]?\s*/i, '').trim();
};

export const stripMetaWrapper = (line = '') => cleanImportedLine(line).replace(/^\[/, '').replace(/\]$/, '').trim();
export const parseMetaLine = (line = '') => {
  const cleaned = stripMetaWrapper(line);
  const match = cleaned.match(/^(المادة|الفرع|الباب|الوحدة|الدرس|الموضوع|الصعوبة|الصف|الدرجة)\s*[:：]\s*(.+)$/i);
  return match ? { key: match[1], value: cleanImportedLine(match[2]) } : null;
};

export const parseOptionLine = (line = '') => {
  const text = cleanImportedLine(line);
  const match = text.match(OPTION_START_RE);
  const body = cleanImportedLine(match?.[3] || '');
  if (!match || !body) return null;
  return { label: normalizedOptionLabel(match[1] || match[2]), text: body };
};

export const labelToIndex = (label = '') => {
  const normalized = cleanImportedLine(label).toUpperCase().replace(/[\s\[\](){（）：:؛،.\-–—ـ/\\]/g, '');
  if (['A', 'أ', 'إ', 'ا'].includes(normalized)) return 0;
  if (['B', 'ب'].includes(normalized)) return 1;
  if (['C', 'ج'].includes(normalized)) return 2;
  if (['D', 'د'].includes(normalized)) return 3;
  if (['E', 'هـ', 'ه'].includes(normalized)) return 4;
  if (['F', 'و'].includes(normalized)) return 5;
  if (['G', 'ز'].includes(normalized)) return 6;
  if (['H', 'ح'].includes(normalized)) return 7;
  return Math.max(0, safeNumber(toWesternDigits(normalized), 1) - 1);
};

export const normalizeImportedTextLayout = (value = '') => String(value)
  .replace(/\r\n?/g, '\n').replace(/[\u200e\u200f\u202a-\u202e]/g, '')
  .replace(/\s+(?=(?:س(?:ؤال)?\s*\d+|Q\s*\d+|[-–—ـ.]?\s*\d{1,4}\s*[-–—ـ.:،)])\s+)/gi, '\n')
  .replace(/\s+(?=(?:[أإابجدهـهوA-Fa-f]|[١-٦1-6])\s*[-–—ـ).:،]\s+)/gu, '\n')
  .replace(/\s+(?=(?:الإجابة|الاجابة|الإجابه|الحل|answer|correct|شرح|التعليل)\s*[:：\-])/gi, '\n')
  .replace(/\n{3,}/g, '\n\n').trim();

export const readPlainTextFile = async (file) => {
  const buffer = await file.arrayBuffer();
  try { return normalizeImportedTextLayout(new TextDecoder('utf-8', { fatal: false }).decode(buffer)); }
  catch { return normalizeImportedTextLayout(await file.text()); }
};

export const readPdfTextFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent({ normalizeWhitespace: true });
    const items = content.items.filter((item) => cleanImportedLine(item.str)).map((item) => ({ text: cleanImportedLine(item.str), x: Number(item.transform?.[4] || 0), y: Number(item.transform?.[5] || 0) }));
    const rows = []; const tolerance = 3;
    for (const item of items) { let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance); if (!row) { row = { y: item.y, items: [] }; rows.push(row); } row.items.push(item); }
    rows.sort((a, b) => b.y - a.y);
    pages.push(rows.map((row) => cleanImportedLine([...row.items].sort((a, b) => b.x - a.x).map((item) => item.text).join(' '))).filter(Boolean).join('\n'));
  }
  const text = normalizeImportedTextLayout(pages.join('\n'));
  if (!text) throw new Error('ملف PDF لا يحتوي على نص قابل للقراءة. لو الملف صور ممسوحة ضوئيًا، حوّله إلى PDF نصي أو DOCX/TXT أولًا.');
  return text;
};

export const xmlChildrenByLocalName = (node, name) => Array.from(node.getElementsByTagName('*')).filter((el) => el.localName === name);
const attr = (node, name) => node?.getAttribute(`w:${name}`) || node?.getAttribute(name) || '';
const runIsMarked = (run) => {
  const underline = xmlChildrenByLocalName(run, 'u').some((node) => !['none', '0', 'false'].includes((attr(node, 'val') || 'single').toLowerCase()));
  const highlight = xmlChildrenByLocalName(run, 'highlight').some((node) => attr(node, 'val') && attr(node, 'val') !== 'none');
  const shading = xmlChildrenByLocalName(run, 'shd').some((node) => { const fill = attr(node, 'fill').toUpperCase(); return fill && !['AUTO', 'FFFFFF', '000000'].includes(fill); });
  return underline || highlight || shading;
};

const buildMarkedRanges = (runs = []) => {
  const ranges = [];
  let cursor = 0;
  runs.forEach((run) => {
    const start = cursor;
    const end = start + String(run.text || '').length;
    if (run.marked && end > start) ranges.push([start, end]);
    cursor = end;
  });
  return ranges;
};

const segmentMarkRatio = (start, end, ranges = []) => {
  const length = Math.max(1, end - start);
  const overlap = ranges.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(end, b) - Math.max(start, a)), 0);
  return overlap / length;
};

const splitRichLine = ({ text, runs = [], ...meta }) => {
  const source = String(text || '').replace(/[\u200e\u200f\u202a-\u202e]/g, '');
  const matches = findOptionMarkers(source);

  // نفصل إذا وجدنا اختيارين متتابعين على الأقل. أما اختيار واحد في فقرة منفصلة
  // فيتعامل معه parseOptionLine لاحقًا، حتى لا نقطع نص السؤال خطأً.
  if (matches.length < 2) return [{ text: cleanImportedLine(source), runs, ...meta }];

  const markedRanges = buildMarkedRanges(runs);
  const segments = [];
  const firstOptionStart = matches[0]?.markerStart ?? source.length;
  const questionPart = cleanImportedLine(source.slice(0, firstOptionStart));
  if (questionPart) segments.push({ text: questionPart, highlighted: false, underlined: false, ...meta });

  matches.forEach((entry, index) => {
    const end = matches[index + 1]?.markerStart ?? source.length;
    const optionText = cleanImportedLine(source.slice(entry.contentStart, end)
      .replace(/^[-–—ـ•●▪◦*\s]+/u, '')
      .replace(/[\s|،؛\-–—ـ•●▪◦*]+$/u, ''));
    if (!optionText) return;
    const ratio = segmentMarkRatio(entry.contentStart, end, markedRanges);
    segments.push({
      text: `${entry.label}) ${optionText}`,
      highlighted: ratio > 0,
      underlined: ratio > 0,
      markScore: ratio,
      ...meta,
    });
  });

  return segments.length ? segments : [{ text: cleanImportedLine(source), runs, ...meta }];
};

export const readDocxParagraphs = async (file) => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) throw new Error('لم أستطع قراءة ملف Word. تأكد أنه DOCX وليس DOC قديم.');
  const xml = new DOMParser().parseFromString(documentXml, 'application/xml');
  const paragraphs = xmlChildrenByLocalName(xml, 'p');
  const output = [];
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const runs = xmlChildrenByLocalName(paragraph, 'r').map((run) => ({ text: xmlChildrenByLocalName(run, 't').map((node) => node.textContent || '').join(''), marked: runIsMarked(run) })).filter((run) => run.text);
    const text = runs.map((run) => run.text).join('');
    if (!cleanImportedLine(text)) return;
    output.push(...splitRichLine({ text, runs, paragraphIndex, sourceFormat: 'docx' }));
  });
  return output;
};

const isUnitHeader = (text = '') => /^(?:الوحدة|الباب|الفصل|الدرس|الموضوع|الجزئية|التدريب|تدريبات)\s*(?:[:：\-–—])?\s*(?:الأولى|الاولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|الثامنة|التاسعة|العاشرة|\d+|.+)$/u.test(cleanImportedLine(text));
const looksLikeTopicHeader = (text = '') => {
  const value = cleanImportedLine(text);
  if (!value || value.length > 110 || parseQuestionStart(value) || parseOptionLine(value)) return false;
  if (/^(?:الوحدة|الباب|الفصل|الدرس|الموضوع|الجزئية|تدريبات?|أسئلة|اسئلة|مراجعة|اختبار)/u.test(value)) return true;
  if (/[:：]$/.test(value) && !/[؟?]/.test(value)) return true;
  return /^(?:التشبيه|الاستعارة|الكناية|المجاز|المنادى|الاستثناء|التعجب|اسم التفضيل|اسم الفاعل|اسم المفعول|المصدر|الممنوع من الصرف|النواسخ|الجملة الاسمية|الجملة الفعلية|النحو|البلاغة|الأدب|القصة)$/u.test(value);
};
const answerRegex = /^(الإجابة(?:\s+الصحيحة)?|الاجابة(?:\s+الصحيحة)?|الإجابه|الحل|answer|correct)\s*[:：\-–—]\s*(.+)$/i;
const explanationRegex = /^(شرح|التعليل|سبب الإجابة|سبب الاجابة|explanation)\s*[:：\-–—]\s*(.+)$/i;

export const parseQuestionBankLines = (lines, settings) => {
  const results = []; const warnings = []; const rejected = [];
  let currentBranch = settings.branchMode === 'auto' ? '' : settings.branch;
  let currentTopic = 'عام'; let currentHeading = 'عام'; let currentDifficulty = settings.difficulty || 'medium'; let currentGrade = settings.grade || '3sec'; let question = null;

  const finalizeQuestion = () => {
    if (!question) return;
    question.options = question.options.filter((option) => cleanImportedLine(option.text));
    const options = question.options.map((option) => cleanImportedLine(option.text.replace(/\*/g, '')));
    if (!question.text.trim()) { rejected.push({ reason: 'سؤال بلا نص', raw: question.rawLines || [] }); question = null; return; }
    let correctIdx = question.correctIdx;
    let hasConfirmedAnswer = Number.isInteger(correctIdx) && correctIdx >= 0;
    if (options.length && (correctIdx === null || Number.isNaN(correctIdx))) {
      const scored = question.options.map((option, index) => ({
        index,
        score: Math.max(Number(option.markScore || 0), option.correctByMarker || option.highlighted ? 0.0001 : 0),
      })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
      const marked = scored.map((item) => item.index);
      const topIsClearlyMarked = scored.length > 0 && (scored.length === 1 || scored[0].score > scored[1].score + 0.01 || scored[0].score >= scored[1].score * 1.35);
      if (topIsClearlyMarked) { correctIdx = scored[0].index; hasConfirmedAnswer = true; }
      else { correctIdx = marked[0] ?? 0; warnings.push(`راجع إجابة السؤال: ${question.text.slice(0, 55)}${marked.length > 1 ? ' (أكثر من اختيار تحته خط بنفس القوة)' : ' (لم أجد اختيارًا محددًا)'}`); rejected.push({ reason: marked.length > 1 ? 'أكثر من إجابة معلّمة بنفس القوة' : 'لم تُكتشف الإجابة الصحيحة', question: question.text, options, heading: question.sourceHeading || currentHeading, raw: question.rawLines || [] }); }
    }
    const branch = question.branch || currentBranch || settings.branch || detectBranchFromText(question.text) || 'النحو';
    const topic = question.topic || currentTopic || 'عام';
    if (options.length === 1) rejected.push({ reason: 'تم اكتشاف اختيار واحد فقط', question: question.text, options, heading: question.sourceHeading || currentHeading, raw: question.rawLines || [] });
    results.push({ text: question.text.trim(), questionStem: question.text.trim().split(/\n/)[0], sourceHeading: question.sourceHeading || currentHeading || topic, grade: question.grade || currentGrade, branch, topic, lesson: topic, type: options.length ? 'mcq' : 'essay', difficulty: question.difficulty || currentDifficulty, options, correctIdx: options.length ? Math.max(0, Math.min(options.length - 1, safeNumber(correctIdx, 0))) : 0, explanation: question.explanation.trim(), mark: options.length ? 1 : 10, tags: Array.from(new Set([branch, topic, ...(settings.tags || [])].filter(Boolean))), source: 'question_bank_import', importConfidence: options.length >= 2 && hasConfirmedAnswer ? 'high' : 'review' });
    question = null;
  };

  lines.forEach((lineObject) => {
    const rawText = cleanImportedLine(typeof lineObject === 'string' ? lineObject : lineObject.text);
    const highlighted = Boolean(typeof lineObject === 'object' && (lineObject.highlighted || lineObject.underlined));
    const markScore = typeof lineObject === 'object' ? Number(lineObject.markScore || 0) : 0;
    if (!rawText) return;

    const meta = parseMetaLine(rawText);
    if (meta) { const key = normalizeArabicKey(meta.key); if (key.includes('فرع') || key.includes('باب')) currentBranch = detectBranchFromText(meta.value) || meta.value; if (key.includes('وحده') || key.includes('درس') || key.includes('موضوع')) currentTopic = meta.value; if (key.includes('صعوبه')) currentDifficulty = meta.value; if (key.includes('صف')) currentGrade = meta.value; return; }
    if (isUnitHeader(rawText) || (!question && looksLikeTopicHeader(rawText))) { finalizeQuestion(); currentTopic = rawText.replace(/[:：]+$/, ''); currentHeading = currentTopic; return; }
    const headerMatch = rawText.match(/^(#{1,6}|[-=]{2,})\s*(.+)$/); if (headerMatch) { const header = cleanImportedLine(headerMatch[2]); const found = detectBranchFromText(header); if (found) currentBranch = found; else currentTopic = header; return; }
    if (/^(النحو|نحو|البلاغة|بلاغة|الأدب|ادب|القصة)$/i.test(rawText)) { currentBranch = detectBranchFromText(rawText) || rawText; return; }

    const questionStart = parseQuestionStart(rawText);
    const option = parseOptionLine(rawText);
    if (questionStart) {
      finalizeQuestion();
      question = {
        text: questionStart.text,
        number: questionStart.number,
        options: [],
        correctIdx: null,
        explanation: '',
        branch: currentBranch,
        topic: currentTopic,
        sourceHeading: currentHeading,
        grade: currentGrade,
        difficulty: currentDifficulty,
        rawLines: [rawText],
        waitingForQuestionText: !questionStart.text,
      };
      return;
    }
    if (!question) return;

    question.rawLines = [...(question.rawLines || []), rawText];

    // بعض ملفات Word تضع الرقم وحده في سطر، ثم رأس السؤال في السطر التالي.
    if (question.waitingForQuestionText && !option) {
      question.text = rawText;
      question.waitingForQuestionText = false;
      return;
    }

    if (option) { const correctByMarker = /\*/.test(option.text) || highlighted; const nextIndex = question.options.length; question.options.push({ ...option, text: option.text.replace(/\*/g, '').trim(), correctByMarker, highlighted, markScore }); if (correctByMarker) question.correctIdx = nextIndex; return; }
    const answerMatch = rawText.match(answerRegex); if (answerMatch) { const value = answerMatch[2].replace(/\*/g, '').trim(); const byText = question.options.findIndex((item) => normalizeArabicKey(item.text) === normalizeArabicKey(value)); question.correctIdx = byText >= 0 ? byText : labelToIndex(value); return; }
    const explanationMatch = rawText.match(explanationRegex); if (explanationMatch) { question.explanation = [question.explanation, explanationMatch[2]].filter(Boolean).join('\n'); return; }

    if (!question.options.length) question.text = [question.text, rawText].filter(Boolean).join('\n');
    else {
      const last = question.options[question.options.length - 1];
      // Word may push the rest of an option to the next page/paragraph. Continue the last option unless this is clearly an explanation.
      if (last && !/[.:؟!]$/.test(last.text) && rawText.length < 180) last.text = cleanImportedLine(`${last.text} ${rawText}`);
      else question.explanation = [question.explanation, rawText].filter(Boolean).join('\n');
    }
  });
  finalizeQuestion();
  return { questions: results, warnings: Array.from(new Set(warnings)), rejected }; 
};
