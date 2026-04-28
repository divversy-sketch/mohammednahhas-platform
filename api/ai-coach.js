// api/ai-coach.js
// Phase 30 - Gemini AI: exam review + question explain + student home plan + essay correction
// Gemini فقط - بدون حدود استخدام، مع دعم كل أوضاع المنصة.

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
].filter(Boolean);

function send(res, status, payload) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(payload));
}

function extractJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

function getLesson(body = {}) {
  return String(body.lesson || body.topic || body.branches || body.branch || body.question || body.questionText || "").trim();
}

function safeString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function isBadOption(value) {
  const v = String(value || "").trim();
  return !v || /^اختيار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(v) || /^اختبار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(v);
}

function normalizeQuestion(q, i, lesson) {
  const options = Array.isArray(q?.options) ? q.options.slice(0, 4).map(x => String(x || "").trim()) : [];
  return {
    id: q?.id || `q_${i + 1}`,
    text: String(q?.text || "").trim(),
    options,
    correctIdx: Number.isInteger(q?.correctIdx) && q.correctIdx >= 0 && q.correctIdx <= 3 ? q.correctIdx : 0,
    difficulty: q?.difficulty || ["سهل", "متوسط", "صعب", "صعب جدًا"][i % 4],
    branch: q?.branch || lesson,
    explanation: q?.explanation || ""
  };
}

function validateQuestion(q) {
  if (!q?.text || !Array.isArray(q.options) || q.options.length < 4) return false;
  if (q.options.some(isBadOption)) return false;
  if (new Set(q.options).size < 4) return false;
  if (/سؤال تدريبي|الدرس المطلوب|طريقة المذاكرة|أفضل خطوة/i.test(q.text)) return false;
  return true;
}

function normalizeExam(rawExam, body = {}) {
  const lesson = getLesson(body);
  const rawQuestions = Array.isArray(rawExam?.questions)
    ? rawExam.questions
    : Array.isArray(rawExam)
      ? rawExam
      : [];

  const questions = rawQuestions
    .flatMap((item, i) => {
      if (Array.isArray(item?.subQuestions)) {
        return item.subQuestions.map((q, j) => normalizeQuestion({ ...q, blockText: item.text || "" }, i + j, lesson));
      }
      return [normalizeQuestion(item, i, lesson)];
    })
    .filter(validateQuestion)
    .slice(0, 20);

  return {
    title: rawExam?.title || `امتحان ${lesson || "AI"}`,
    questions
  };
}

function compactQuestions(list = [], max = 30) {
  return (Array.isArray(list) ? list : []).slice(0, max).map((q, i) => ({
    number: i + 1,
    text: q.text || q.questionText || "",
    branch: q.branch || "عام",
    type: q.type || "mcq",
    correctAnswer: q.correctAnswer || "",
    chosenAnswer: q.chosenAnswer || q.studentAnswer || "",
    isCorrect: q.isCorrect,
    explanation: q.explanation || ""
  }));
}

function buildPrompt(body = {}) {
  const mode = body.mode || "student_chat";
  const lesson = getLesson(body);
  const grade = body.grade || "غير محدد";
  const count = Math.min(Math.max(Number(body.mcqCount || body.count || 18), 5), 20);

  if (mode === "question_explain") {
    const q = body.question || {};
    return `
أنت مدرس لغة عربية مصري.
اشرح للطالب سؤالًا واحدًا بعد الامتحان.

بيانات الطالب:
الاسم: ${body.studentName || ""}
المرحلة: ${grade}
الامتحان: ${body.examTitle || ""}

السؤال:
${q.text || body.questionText || ""}

الفرع: ${q.branch || body.branch || "عام"}
القطعة إن وجدت:
${q.blockText || ""}

اختيارات السؤال:
${Array.isArray(q.options) ? q.options.map((x, i) => `${i}: ${x}`).join("\n") : ""}

إجابة الطالب: ${q.chosenAnswer || body.studentAnswer || "لم يجب"}
الإجابة الصحيحة: ${q.correctAnswer || body.correctAnswer || ""}
شرح محفوظ من السؤال إن وجد: ${q.explanation || ""}

أعد JSON فقط:
{
  "summary": "ملخص قصير لحالة إجابة الطالب",
  "answer": "التصويب المباشر للطالب",
  "explanation": "شرح الفكرة والقاعدة بطريقة بسيطة",
  "mistakeReason": "سبب الخطأ المحتمل إن كانت الإجابة خطأ",
  "studyPlan": ["خطوة مذاكرة 1", "خطوة مذاكرة 2", "خطوة مذاكرة 3"],
  "quickExercises": ["تدريب قصير 1", "تدريب قصير 2"]
}
`;
  }

  if (mode === "exam_review") {
    const wrongQuestions = compactQuestions(body.wrongQuestions || (body.questions || []).filter(q => q.isCorrect === false), 25);
    const weakBranches = body.weakBranches || [];
    return `
أنت مدرس لغة عربية مصري ومحلل أداء.
حلل نتيجة طالب بعد امتحان، وقدم مراجعة ذكية مفيدة.

بيانات الطالب:
الاسم: ${body.studentName || ""}
المرحلة: ${grade}
الامتحان: ${body.examTitle || ""}

إحصائيات النتيجة:
${JSON.stringify(body.metrics || {}, null, 2)}

الفروع الضعيفة:
${JSON.stringify(weakBranches, null, 2)}

الأسئلة الخطأ:
${JSON.stringify(wrongQuestions, null, 2)}

المطلوب:
- شرح عام لأداء الطالب.
- تحديد سبب الأخطاء.
- خطة مذاكرة عملية حسب الفروع الضعيفة.
- تدريبات قصيرة مقترحة.
- لا تقل "لم يتم تقديم سؤال الطالب" لأن هذه مراجعة امتحان كامل وليست سؤالًا واحدًا.

أعد JSON فقط:
{
  "summary": "ملخص ذكي لأداء الطالب",
  "answer": "تقييم واضح ومباشر",
  "explanation": "شرح نقاط القوة والضعف والأسئلة الخطأ",
  "mistakeReason": "الأسباب المتكررة للأخطاء",
  "studyPlan": ["خطة 1", "خطة 2", "خطة 3", "خطة 4"],
  "quickExercises": ["تدريب 1", "تدريب 2", "تدريب 3"]
}
`;
  }

  if (mode === "student_home_plan") {
    return `
أنت مدرب مذاكرة للغة العربية.
حلل نتائج الطالب الأخيرة واعمل خطة مذاكرة مخصصة.

الطالب: ${body.studentName || ""}
المرحلة: ${grade}
النتائج الأخيرة:
${JSON.stringify(body.recentResults || [], null, 2)}
المحتوى المقترح إن وجد:
${JSON.stringify(body.recommendedContent || body.content || [], null, 2)}

أعد JSON فقط:
{
  "summary": "ملخص حالة الطالب",
  "answer": "نصيحة واضحة للطالب",
  "explanation": "تحليل مختصر لأقوى وأضعف الفروع",
  "mistakeReason": "سبب التعثر المحتمل",
  "studyPlan": ["ماذا يذاكر أولًا", "ماذا يحل", "متى يراجع", "كيف يقيس تقدمه"],
  "quickExercises": ["تدريب سريع 1", "تدريب سريع 2"]
}
`;
  }

  if (mode === "essay_correct") {
    const q = body.question || {};
    return `
أنت مصحح لغة عربية.
صحح إجابة مقالية للطالب واقترح درجة، لكن القرار النهائي للأدمن.

الطالب: ${body.studentName || ""}
الامتحان: ${body.examTitle || ""}
السؤال: ${q.text || ""}
الفرع: ${q.branch || ""}
الإجابة النموذجية أو معيار التصحيح: ${q.modelAnswer || ""}
الدرجة العظمى: ${q.maxScore || 10}
إجابة الطالب:
${body.studentAnswer || ""}

أعد JSON فقط:
{
  "suggestedScore": 0,
  "feedback": "ملاحظات التصحيح",
  "strengths": ["نقطة قوة"],
  "improvements": ["نقطة تحسين"]
}
`;
  }

  if (mode === "generate_questions") {
    return `
أنت معلم لغة عربية مصري خبير.
الطالب طلب أسئلة عن: "${lesson}"
المرحلة الدراسية: ${grade}
عدد الأسئلة المطلوب: ${Math.min(count, 10)}

اكتب أسئلة اختيار من متعدد عن نفس الدرس الذي كتبه الطالب فقط.
ممنوع أسئلة عامة عن المذاكرة أو خطوات الحل.
كل سؤال له 4 اختيارات حقيقية مختلفة.
correctIdx رقم من 0 إلى 3.

أعد JSON فقط:
{
  "questions": [
    {
      "id": "q1",
      "text": "نص السؤال من الدرس",
      "options": ["اختيار حقيقي", "اختيار حقيقي", "اختيار حقيقي", "اختيار حقيقي"],
      "correctIdx": 0,
      "difficulty": "سهل",
      "branch": "${lesson}",
      "explanation": "شرح مختصر للإجابة"
    }
  ]
}
`;
  }

  if (mode === "generate_exam") {
    return `
أنت معلم لغة عربية مصري خبير.
أنشئ امتحان اختيار من متعدد من ${count} سؤال.

مهم جدًا:
- الدرس المطلوب من الطالب هو: "${lesson}"
- المرحلة الدراسية: ${grade}
- يجب أن تكون كل الأسئلة عن هذا الدرس تحديدًا.
- ممنوع أسئلة عامة عن المذاكرة أو طريقة الحل.
- كل سؤال 4 اختيارات حقيقية مختلفة.
- correctIdx رقم من 0 إلى 3.
- اشرح الإجابة في explanation.

أعد JSON فقط:
{
  "exam": {
    "title": "امتحان ${lesson}",
    "questions": [
      {
        "id": "q1",
        "text": "سؤال حقيقي عن ${lesson}",
        "options": ["اختيار حقيقي 1", "اختيار حقيقي 2", "اختيار حقيقي 3", "اختيار حقيقي 4"],
        "correctIdx": 0,
        "difficulty": "سهل",
        "branch": "${lesson}",
        "explanation": "شرح سبب الإجابة"
      }
    ]
  }
}
`;
  }

  const userQuestion = safeString(body.question || body.message || lesson);
  return `
أنت مساعد تعليمي مصري.
السياق: ${body.context || ""}
سؤال الطالب: ${userQuestion || "قدّم مساعدة تعليمية عامة مناسبة للطالب."}

أعد JSON فقط:
{
  "summary": "ملخص",
  "answer": "إجابة واضحة",
  "explanation": "شرح مبسط",
  "mistakeReason": "",
  "studyPlan": ["خطوة 1", "خطوة 2", "خطوة 3"],
  "quickExercises": ["تدريب 1", "تدريب 2"]
}
`;
}

async function callGemini(model, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    })
  });

  const raw = await res.text();
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch {}

  if (!res.ok) {
    const err = new Error(parsed?.error?.message || raw || `Gemini ${res.status}`);
    err.status = res.status;
    err.raw = raw;
    throw err;
  }

  return parsed?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n") || "";
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });

  if (req.method === "GET") {
    return send(res, 200, {
      ok: true,
      message: "AI Coach API works - Gemini full platform modes",
      provider: "gemini",
      fallback: false,
      limits: false,
      env: {
        GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
        VITE_GEMINI_API_KEY: Boolean(process.env.VITE_GEMINI_API_KEY),
        GEMINI_MODEL: process.env.GEMINI_MODEL || null
      }
    });
  }

  if (req.method !== "POST") {
    return send(res, 405, { ok: false, error: "Method not allowed" });
  }

  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    return send(res, 500, { ok: false, error: "GEMINI_API_KEY غير موجود في Vercel" });
  }

  const body = req.body || {};
  const prompt = buildPrompt(body);
  const errors = [];

  for (const model of GEMINI_MODELS) {
    try {
      const txt = await callGemini(model, key, prompt);
      const json = extractJson(txt);

      if (!json) {
        throw new Error("Gemini returned non-JSON response");
      }

      if (body.mode === "generate_exam") {
        const exam = normalizeExam(json.exam || json, body);
        if (exam.questions.length < 5) {
          throw new Error("Gemini returned too few valid lesson questions");
        }

        return send(res, 200, {
          ok: true,
          provider: "gemini",
          model,
          fallback: false,
          limits: false,
          analysis: { exam },
          data: { exam }
        });
      }

      if (body.mode === "generate_questions") {
        const lesson = getLesson(body);
        const raw = Array.isArray(json.questions) ? json.questions : [];
        const questions = raw.map((q, i) => normalizeQuestion(q, i, lesson)).filter(validateQuestion);

        if (questions.length < 1) {
          throw new Error("Gemini returned no valid questions");
        }

        return send(res, 200, {
          ok: true,
          provider: "gemini",
          model,
          fallback: false,
          limits: false,
          analysis: { questions },
          data: { questions }
        });
      }

      return send(res, 200, {
        ok: true,
        provider: "gemini",
        model,
        fallback: false,
        limits: false,
        analysis: json,
        data: json
      });
    } catch (e) {
      errors.push({ model, message: e.message, status: e.status || null });
    }
  }

  return send(res, 503, {
    ok: false,
    provider: "gemini",
    fallback: false,
    limits: false,
    error: "Gemini لم يرد برد صالح الآن. جرّب مرة أخرى بعد قليل أو اختصر السؤال.",
    errors
  });
}
