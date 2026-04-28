const ADMIN_ALLOWED_MODES = new Set([
  "generate_questions",
  "generate_exam",
  "lesson_summary",
  "live_admin_question",
  "admin_chat"
]);

const STUDENT_BLOCKED_MODES = new Set([
  "student_chat",
  "student_home_plan",
  "question_explain",
  "essay_correct",
  "live_question",
  "ai_interactive_exam"
]);

function cleanJsonText(text = "") {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeJsonParse(text = "") {
  const cleaned = cleanJsonText(text);
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  return null;
}

function buildPrompt(body = {}) {
  const mode = body.mode || "admin_chat";
  const topic = body.topic || body.lesson || body.branches || body.question || body.prompt || "";
  const grade = body.grade || "غير محدد";
  const branch = body.branch || body.branches || "عام";
  const count = Number(body.count || body.mcqCount || 10);

  if (mode === "generate_questions") {
    return `
أنت مدرس لغة عربية مصري محترف ومساعد للأدمن فقط.
ولّد ${count} سؤال اختيار من متعدد مناسب للمرحلة: ${grade}.
الموضوع: ${topic}
الفرع: ${branch}

أرجع JSON صالح فقط بدون Markdown:
{
  "analysis": {
    "answer": "تم توليد الأسئلة.",
    "questions": [
      {"id":"q1","text":"نص السؤال","type":"mcq","branch":"${branch}","options":["أ","ب","ج","د"],"correctIdx":0,"explanation":"شرح مختصر"}
    ],
    "exam": {"title":"أسئلة ${topic}","questions":[]}
  },
  "data": {"questions": []}
}`;
  }

  if (mode === "generate_exam") {
    const mcqCount = Number(body.mcqCount || 10);
    const essayCount = Number(body.essayCount || 0);
    return `
أنت مدرس لغة عربية مصري محترف ومساعد للأدمن فقط.
ولّد امتحان كامل مناسب للمرحلة: ${grade}.
الموضوع: ${topic}
الفروع: ${branch}
عدد الاختياري: ${mcqCount}
عدد المقالي: ${essayCount}
المدة: ${body.duration || 30} دقيقة

أرجع JSON صالح فقط بدون Markdown:
{
  "analysis": {
    "answer": "تم بناء الامتحان.",
    "exam": {
      "title": "امتحان ${topic}",
      "duration": ${Number(body.duration || 30)},
      "questions": [
        {"text":"قطعة أو تعليمات اختيارية","subQuestions":[{"id":"q1","text":"نص السؤال","type":"mcq","branch":"${branch}","options":["أ","ب","ج","د"],"correctIdx":0,"explanation":"شرح مختصر"}]}
      ]
    }
  },
  "data": {"exam": {"title":"امتحان ${topic}","questions": []}}
}`;
  }

  return `
أنت مدرس لغة عربية مصري محترف ومساعد للأدمن فقط.
المطلوب: ${mode}
المرحلة: ${grade}
السياق/السؤال: ${topic}

أرجع JSON صالح فقط بدون Markdown:
{
  "analysis": {
    "answer": "الإجابة هنا بشكل منظم",
    "summary": "ملخص قصير",
    "recommendations": ["نصيحة عملية"]
  },
  "data": {"answer":"الإجابة هنا بشكل منظم"}
}`;
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ ok: true, provider: "gemini-admin-only", message: "AI is enabled for admin generation only." });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const body = req.body || {};
    const mode = body.mode || "admin_chat";

    if (STUDENT_BLOCKED_MODES.has(mode) || String(mode).startsWith("student_")) {
      return res.status(403).json({
        ok: false,
        error: "تم إيقاف الذكاء الاصطناعي للطلاب مؤقتًا. التحليل داخل المنصة يعمل بدون Gemini حاليًا."
      });
    }

    if (!ADMIN_ALLOWED_MODES.has(mode)) {
      return res.status(403).json({ ok: false, error: "هذا النوع من طلبات AI غير مفعل حاليًا." });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ ok: false, error: "GEMINI_API_KEY غير موجود في Vercel Environment Variables." });
    }

    const prompt = buildPrompt(body);
    const models = ["gemini-1.5-flash", "gemini-2.0-flash"];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: 8192, responseMimeType: "application/json" }
          })
        });

        const raw = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = raw?.error?.message || `Gemini error ${response.status}`;
          lastError = msg;
          if (response.status === 429 || /quota|rate limit|resource exhausted|exceeded/i.test(msg)) {
            return res.status(429).json({ ok: false, provider: "gemini", model, error: "تم استهلاك الحد الحالي للذكاء الاصطناعي.", reason: msg });
          }
          continue;
        }

        const text = raw?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n").trim();
        const parsed = safeJsonParse(text);
        if (!parsed) {
          return res.status(200).json({ ok: true, provider: "gemini", model, analysis: { answer: text || "تم." }, data: { answer: text || "تم." } });
        }

        const analysis = parsed.analysis || {};
        const data = parsed.data || {};
        if (Array.isArray(analysis.exam?.questions) && !Array.isArray(data.exam?.questions)) data.exam = analysis.exam;
        if (Array.isArray(analysis.questions) && !Array.isArray(data.questions)) data.questions = analysis.questions;

        return res.status(200).json({ ok: true, provider: "gemini", model, ...parsed, analysis, data });
      } catch (err) {
        lastError = err?.message || String(err);
      }
    }

    return res.status(503).json({ ok: false, provider: "gemini", error: "Gemini لم يرد حاليًا.", reason: lastError || "فشل الاتصال بكل النماذج." });
  } catch (err) {
    return res.status(500).json({ ok: false, provider: "gemini", error: "خطأ داخلي في ai-coach.js", details: err?.message || String(err) });
  }
}
