// api/ai-coach.js
// Gemini fallback + retry تلقائي

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

function send(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
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

function fallbackExam(body = {}) {
  const topic = body.topic || body.branches || "المحاضرة";
  return {
    title: `امتحان تدريبي مؤقت - ${topic}`,
    questions: Array.from({ length: 18 }).map((_, i) => ({
      id: `fallback_${i+1}`,
      text: `سؤال تدريبي ${i+1} في ${topic} مناسب لمرحلة ${body.grade || "الطالب"}.`,
      options: ["اختيار أ", "اختيار ب", "اختيار ج", "اختيار د"],
      correctIdx: i % 4,
      difficulty: ["سهل", "متوسط", "صعب", "صعب جدًا"][i % 4],
      branch: topic,
      explanation: "ظهر هذا السؤال الاحتياطي بسبب ضغط مؤقت على مزود الذكاء الاصطناعي. أعد التوليد لاحقًا للحصول على امتحان أقوى."
    }))
  };
}

function buildPrompt(body) {
  if (body.mode === "generate_exam") {
    const topic = body.topic || body.branches || "مراجعة عامة";
    return `أنت مساعد تعليمي مصري. أنشئ امتحان اختيار من متعدد فقط من 15 إلى 20 سؤال.
المرحلة: ${body.grade || ""}
الموضوع: ${topic}
أعد JSON فقط:
{"exam":{"title":"عنوان","questions":[{"id":"q1","text":"نص السؤال","options":["أ","ب","ج","د"],"correctIdx":0,"difficulty":"سهل","branch":"${topic}","explanation":"شرح"}]}}`;
  }

  return `أنت مساعد تعليمي مصري.
السياق: ${body.context || ""}
السؤال: ${body.question || body.message || ""}
أعد JSON فقط:
{"summary":"ملخص","answer":"إجابة واضحة","studyPlan":["خطوة 1","خطوة 2"],"quickExercises":["تدريب 1","تدريب 2"]}`;
}

async function callGemini(model, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.45, maxOutputTokens: 8192 }
    })
  });

  const raw = await res.text();
  let parsed = {};
  try { parsed = JSON.parse(raw); } catch {}

  if (!res.ok) {
    const err = new Error(parsed?.error?.message || raw || `Gemini ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return parsed?.candidates?.[0]?.content?.parts?.map(p=>p.text || "").join("\n") || "";
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 200, { ok: true });
  if (req.method === "GET") return send(res, 200, { ok: true, message: "AI Coach API works" });
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });

  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) return send(res, 500, { ok: false, error: "GEMINI_API_KEY غير موجود في Vercel" });

  const body = req.body || {};
  const prompt = buildPrompt(body);
  const errors = [];

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const txt = await callGemini(model, key, prompt);
        const json = extractJson(txt);

        if (body.mode === "generate_exam") {
          const exam = json?.exam || json || fallbackExam(body);
          return send(res, 200, { ok: true, provider: "gemini", model, analysis: { exam }, data: { exam } });
        }

        return send(res, 200, { ok: true, provider: "gemini", model, analysis: json || { answer: txt }, data: json || { answer: txt } });
      } catch (e) {
        errors.push({ model, attempt, message: e.message, status: e.status || null });
        await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }
  }

  if (body.mode === "generate_exam") {
    const exam = fallbackExam(body);
    return send(res, 200, {
      ok: true,
      provider: "fallback",
      model: "local-fallback",
      warning: "ضغط مؤقت على Gemini، تم استخدام امتحان احتياطي.",
      analysis: { exam },
      data: { exam },
      errors
    });
  }

  return send(res, 503, { ok: false, error: "مزود الذكاء الاصطناعي عليه ضغط مؤقت. جرّب بعد قليل.", errors });
}
