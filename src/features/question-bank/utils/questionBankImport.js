import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { safeNumber } from '@shared/core/platformShared.jsx';
import { QUESTION_BRANCHES } from '../constants/questionBankConstants.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export const cleanImportedLine = (value = '') => String(value)
  .replace(/\u00a0/g, ' ')
  .replace(/[\t ]+/g, ' ')
  .trim();

export const normalizeArabicKey = (value = '') => String(value)
  .replace(/[إأآا]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه')
  .replace(/ؤ/g, 'و')
  .replace(/ئ/g, 'ي')
  .replace(/\s+/g, '')
  .toLowerCase();

export const detectBranchFromText = (text = '') => {
  const normalized = normalizeArabicKey(text);
  if (normalized.includes('بلاغ')) return 'البلاغة';
  if (normalized.includes('نحو') || normalized.includes('اعراب') || normalized.includes('منادي') || normalized.includes('اسماء') || normalized.includes('افعال')) return 'النحو';
  return '';
};

export const stripQuestionPrefix = (line = '') => cleanImportedLine(line)
  .replace(/^س(?:ؤال)?\s*\d*\s*[:：\-.)،]?\s*/i, '')
  .replace(/^Q\s*\d*\s*[:：\-.)]?\s*/i, '')
  .trim();

export const stripMetaWrapper = (line = '') => cleanImportedLine(line).replace(/^\[/, '').replace(/\]$/, '').trim();

export const parseMetaLine = (line = '') => {
  const cleaned = stripMetaWrapper(line);
  const match = cleaned.match(/^(المادة|الفرع|الباب|الدرس|الموضوع|الصعوبة|الصف|الدرجة)\s*[:：]\s*(.+)$/i);
  return match ? { key: match[1], value: cleanImportedLine(match[2]) } : null;
};

export const parseOptionLine = (line = '') => {
  const text = cleanImportedLine(line);
  const match = text.match(/^([أابجدهـهوA-Da-d])\s*[\)\].\-:：،]\s*(.+)$/u);
  if (!match) return null;
  const rawLabel = match[1].toUpperCase();
  const label = rawLabel === 'ا' ? 'أ' : rawLabel;
  return { label, text: cleanImportedLine(match[2]) };
};

export const labelToIndex = (label = '') => {
  const normalized = label.trim().toUpperCase();
  if (['A', 'أ', 'ا'].includes(normalized)) return 0;
  if (['B', 'ب'].includes(normalized)) return 1;
  if (['C', 'ج'].includes(normalized)) return 2;
  if (['D', 'د'].includes(normalized)) return 3;
  if (['E', 'هـ', 'ه'].includes(normalized)) return 4;
  if (['F', 'و'].includes(normalized)) return 5;
  return Math.max(0, safeNumber(normalized, 1) - 1);
};

export const readPlainTextFile = async (file) => file.text();

export const readPdfTextFile = async (file) => {
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

export const xmlChildrenByLocalName = (node, name) => Array.from(node.getElementsByTagName('*')).filter((el) => el.localName === name);

export const readDocxParagraphs = async (file) => {
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

export const parseQuestionBankLines = (lines, settings) => {
  const results = [];
  const warnings = [];
  let currentBranch = settings.branchMode === 'auto' ? '' : settings.branch;
  let currentTopic = 'عام';
  let currentDifficulty = settings.difficulty || 'medium';
  let currentGrade = settings.grade || '3sec';
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
      mark: hasOptions ? 1 : 10,
      tags: Array.from(new Set([branch, topic, ...(settings.tags || [])].filter(Boolean))),
      source: 'question_bank_import',
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
      question = {
        text: stripQuestionPrefix(rawText),
        options: [],
        correctIdx: null,
        explanation: '',
        branch: branchFromQuestion || currentBranch,
        topic: currentTopic,
        grade: currentGrade,
        difficulty: currentDifficulty,
      };
      return;
    }

    if (!question) return;

    if (option) {
      const correctByMarker = /\*/.test(option.text) || highlighted;
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

