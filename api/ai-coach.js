// api/ai-coach.js
// Resilient AI Coach: Gemini-first with model fallback + clean errors.
// ضع هذا الملف مكان api/ai-coach.js

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

function send(res, status, payload) {
  res.status(status).setHeader("Content-Type", jsonHeaders["Content-Type"]);
  Object.entries(jsonHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(payload));
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

function fallbackExam({ topic = "اللغة العربية", grade = "3sec", branch = "" }) {
  const name = branch || topic || "مراجعة عامة";
  const questions = Array.from({ length: 18 }).map((_, i) => ({
    id: `fallback_${i + 1}`,
    text: `سؤال تدريبي ${i + 1} في ${name} مناسب للمرحلة ${grade}: اختر الإجابة الصحيحة.`,
    options: ["الإجابة الأولى", "الإجابة الثانية", "الإجابة الثالثة", "الإجابة الرابعة"],
    correctIdx: i % 4,
    difficulty: ["سهل", "متوسط", "صعب", "صعب جدًا"][i % 4],
    branch: name,
    explanation: "هذا سؤال احتياطي ظهر لأن مزود الذكاء الاصطناعي كان مشغولًا. راجع القاعدة ثم أعد توليد الامتحان لاحقًا."
  }));
  return {
    title: `امتحان تدريبي مؤقت - ${name}`,
    questions
  };
}

function buildPrompt(body) {
  const mode = body.mode || "student_chat";
  const grade = body.grade || "غير محدد";

  if (mode === "generate_exam") {
    const topic = body.topic || body.branches || "مراجعة عامة";
    return `
أنت مساعد تعليمي مصري لمنصة لغة عربية.
أنشئ امتحان اختيار من متعدد فقط.
المرحلة: ${grade}
الموضوع/الفرع: ${topic}
عدد الأسئلة: من 15 إلى 20
المستويات: سهل، متوسط، صعب، صعب جدًا.
لا تخرج عن مرحلة الطالب.

أعد JSON فقط بهذا الشكل:
{
  "exam": {
    "title": "عنوان الامتحان",
    "questions": [
      {
        "id": "q1",
        "text": "نص السؤال",
        "options": ["اختيار 1","اختيار 2","اختيار 3","اختيار 4"],
        "correctIdx": 0,
        "difficulty": "سهل",
        "branch": "${topic}",
        "explanation": "شرح فكرة السؤال وسبب الإجابة"
      }
    ]
  }
}
`;
  }

  return `
أنت مساعد تعليمي مصري لطالب في المرحلة: ${grade}.
سؤال الطالب: ${body.question || body.message || ""}
أجب عربي مصري واضح ومفيد.
أعد JSON فقط:
{
  "summary": "ملخص",
  "answer": "الإجابة",
  "studyPlan": ["خطوة 1","خطوة 2","خطوة 3"],
  "quickExercises": ["تدريب 1","تدريب 2"]
}
`;
}

async function callGemini(model, apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 8192 }
    })
  });

  const raw = await response.text();
  let payload = {};
  try { payload = JSON.parse(raw); } catch {}

  if (!response.ok) {
    const msg = payload?.error?.message || raw || `Gemini error ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    err.model = model;
    throw err;
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n") || "";
  return { text, model };
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });
  if (req.method === "GET") return send(res, 200, { ok: true, message: "AI Coach API is working" });
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 500, {
      ok: false,
      error: "GEMINI_API_KEY غير موجود في Vercel Environment Variables"
    });
  }

  const body = req.body || {};
  const prompt = buildPrompt(body);
  const errors = [];

  for (const model of GEMINI_MODELS) {
    try {
      const result = await callGemini(model, apiKey, prompt);
      const parsed = extractJson(result.text);

      if (body.mode === "generate_exam") {
        const exam = parsed?.exam || parsed;
        return send(res, 200, {
          ok: true,
          provider: "gemini",
          model: result.model,
          analysis: { exam },
          data: { exam }
        });
      }

      return send(res, 200, {
        ok: true,
        provider: "gemini",
        model: result.model,
        analysis: parsed || { answer: result.text },
        data: parsed || { answer: result.text }
      });
    } catch (error) {
      errors.push({ model, message: error.message, status: error.status || null });
      const busy = /high demand|overloaded|quota|rate|busy|unavailable|503|429/i.test(error.message);
      if (!busy) break;
    }
  }

  // امتحان احتياطي بدل ما الطالب يشوف Alert مزعج وقت الضغط العالي
  if (body.mode === "generate_exam") {
    const exam = fallbackExam({
      topic: body.topic || body.branches,
      grade: body.grade,
      branch: body.branches
    });
    return send(res, 200, {
      ok: true,
      provider: "fallback",
      model: "local-fallback",
      warning: "مزود AI كان عليه ضغط مؤقت، فتم توليد امتحان تدريبي احتياطي.",
      analysis: { exam },
      data: { exam },
      errors
    });
  }

  return send(res, 503, {
    ok: false,
    error: "مزود الذكاء الاصطناعي عليه ضغط مؤقت. جرّب بعد قليل.",
    details: errors
  });
}
