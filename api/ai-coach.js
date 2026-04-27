// api/ai-coach.js
// Gemini فقط - بدون fallback وبدون حدود استخدام

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
  return String(body.lesson || body.topic || body.branches || body.branch || body.question || "").trim();
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

function buildPrompt(body = {}) {
  const lesson = getLesson(body);
  const grade = body.grade || "غير محدد";
  const count = Math.min(Math.max(Number(body.mcqCount || body.count || 18), 5), 20);

  if (body.mode === "generate_questions") {
    return `
أنت معلم لغة عربية مصري خبير.
الطالب طلب أسئلة عن: "${lesson}"
المرحلة الدراسية: ${grade}
عدد الأسئلة المطلوب: ${Math.min(count, 10)}

اكتب أسئلة اختيار من متعدد عن نفس الدرس الذي كتبه الطالب فقط، أيًا كان الدرس: اسم الفاعل، اسم المفعول، اسم التفضيل، التشبيه، الاستعارة، القراءة، النصوص، النحو... إلخ.
لا تستخدم أمثلة محفوظة ثابتة.
لا تسأل عن طريقة المذاكرة أو خطوات الحل.
كل سؤال يجب أن يكون من محتوى الدرس نفسه.
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

  if (body.mode === "generate_exam") {
    return `
أنت معلم لغة عربية مصري خبير.
أنشئ امتحان اختيار من متعدد من ${count} سؤال.

مهم جدًا:
- الدرس المطلوب من الطالب هو: "${lesson}"
- المرحلة الدراسية: ${grade}
- يجب أن تكون كل الأسئلة عن هذا الدرس تحديدًا، وليس عن درس آخر.
- إذا كتب الطالب "اسم الفاعل" تكون الأسئلة عن اسم الفاعل فقط.
- إذا كتب الطالب "اسم التفضيل" تكون الأسئلة عن اسم التفضيل فقط.
- إذا كتب الطالب أي درس آخر، ولّد له من Gemini عن هذا الدرس.
- ممنوع fallback.
- ممنوع أسئلة عامة عن المذاكرة أو طريقة الحل.
- ممنوع اختيارات وهمية مثل: اختيار أ / اختيار ب.
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

  return `
أنت مساعد تعليمي مصري.
السياق: ${body.context || ""}
سؤال الطالب: ${body.question || body.message || lesson || ""}

أعد JSON فقط:
{
  "summary": "ملخص",
  "answer": "إجابة واضحة",
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
        temperature: 0.55,
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
      message: "AI Coach API works - Gemini only",
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
    error: "Gemini لم يولد أسئلة صالحة الآن. جرّب مرة أخرى أو اكتب اسم الدرس بشكل أوضح.",
    errors
  });
}
