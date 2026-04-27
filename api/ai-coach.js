// api/ai-coach.js
// Gemini fallback + retry تلقائي + دعم generate_exam و generate_questions

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

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

function normalizeQuestion(q, i, topic = "عام") {
  return {
    id: q?.id || `q_${i + 1}`,
    text: String(q?.text || `سؤال تدريبي ${i + 1} في ${topic}`).trim(),
    options: Array.isArray(q?.options) && q.options.length >= 4
      ? q.options.slice(0, 4).map(x => String(x || "").trim())
      : ["اختيار أ", "اختيار ب", "اختيار ج", "اختيار د"],
    correctIdx: Number.isInteger(q?.correctIdx) && q.correctIdx >= 0 && q.correctIdx <= 3 ? q.correctIdx : 0,
    difficulty: q?.difficulty || ["سهل", "متوسط", "صعب", "صعب جدًا"][i % 4],
    branch: q?.branch || topic,
    explanation: q?.explanation || "راجع فكرة السؤال ثم قارن الإجابات."
  };
}

function fallbackQuestions(body = {}) {
  const topic = body.topic || body.branches || body.branch || "مراجعة عامة";
  const count = Math.min(Math.max(Number(body.count || body.mcqCount || 18), 5), 20);
  return Array.from({ length: count }).map((_, i) => normalizeQuestion({}, i, topic));
}

function normalizeExam(exam, body = {}) {
  const topic = body.topic || body.branches || "مراجعة عامة";
  const rawQuestions = Array.isArray(exam?.questions) ? exam.questions : [];
  const questions = rawQuestions
    .filter(q => q && (q.text || Array.isArray(q.subQuestions)))
    .flatMap((item, i) => {
      if (Array.isArray(item.subQuestions)) {
        return item.subQuestions.map((q, j) => normalizeQuestion({ ...q, blockText: item.text || "" }, i + j, topic));
      }
      return [normalizeQuestion(item, i, topic)];
    })
    .slice(0, 20);

  return {
    title: exam?.title || `امتحان AI - ${topic}`,
    questions
  };
}

function fallbackExam(body = {}) {
  const topic = body.topic || body.branches || "المحاضرة";
  return {
    title: `امتحان تدريبي مؤقت - ${topic}`,
    questions: fallbackQuestions({ ...body, topic, count: 18 })
  };
}

function buildPrompt(body) {
  if (body.mode === "generate_questions") {
    const topic = body.topic || "مراجعة عامة";
    const branch = body.branch || body.branches || topic;
    const grade = body.grade || "غير محدد";
    const count = Math.min(Math.max(Number(body.count || 10), 1), 20);
    return `
أنت مساعد تعليمي مصري متخصص في اللغة العربية.
أنشئ ${count} سؤال اختيار من متعدد فقط.

المرحلة الدراسية: ${grade}
الفرع: ${branch}
الموضوع: ${topic}
الصعوبة: ${body.difficulty || "متوسط"}

أعد JSON فقط:
{
  "questions": [
    {
      "id": "q1",
      "text": "نص السؤال",
      "options": ["اختيار أ", "اختيار ب", "اختيار ج", "اختيار د"],
      "correctIdx": 0,
      "difficulty": "متوسط",
      "branch": "${branch}",
      "explanation": "شرح الإجابة"
    }
  ]
}
`;
  }

  if (body.mode === "generate_exam") {
    const topic = body.topic || body.branches || "مراجعة عامة";
    const grade = body.grade || "غير محدد";
    return `
أنت مساعد تعليمي مصري متخصص في اللغة العربية.
أنشئ امتحان اختيار من متعدد فقط من 15 إلى 20 سؤال.

الشروط:
- المرحلة الدراسية: ${grade}
- الموضوع / الفرع: ${topic}
- لا تخرج عن مرحلة الطالب.
- المستويات: سهل، متوسط، صعب، صعب جدًا.
- كل سؤال له 4 اختيارات.
- correctIdx رقم من 0 إلى 3.
- explanation يشرح سبب الإجابة.

أعد JSON فقط بدون أي كلام خارج JSON:
{
  "exam": {
    "title": "عنوان الامتحان",
    "questions": [
      {
        "id": "q1",
        "text": "نص السؤال",
        "options": ["اختيار أ", "اختيار ب", "اختيار ج", "اختيار د"],
        "correctIdx": 0,
        "difficulty": "سهل",
        "branch": "${topic}",
        "explanation": "شرح فكرة السؤال"
      }
    ]
  }
}
`;
  }

  return `
أنت مساعد تعليمي مصري.
السياق: ${body.context || ""}
السؤال: ${body.question || body.message || ""}

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
        temperature: 0.35,
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
      message: "AI Coach API works",
      env: {
        GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
        VITE_GEMINI_API_KEY: Boolean(process.env.VITE_GEMINI_API_KEY)
      }
    });
  }

  if (req.method !== "POST") {
    return send(res, 405, { ok: false, error: "Method not allowed" });
  }

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

        if (body.mode === "generate_questions") {
          const raw = Array.isArray(json?.questions) ? json.questions : [];
          const questions = raw.length ? raw.map((q, i) => normalizeQuestion(q, i, body.branch || body.topic)) : fallbackQuestions(body);
          return send(res, 200, {
            ok: true,
            provider: raw.length ? "gemini" : "fallback",
            model: raw.length ? model : "local-fallback",
            analysis: { questions },
            data: { questions }
          });
        }

        if (body.mode === "generate_exam") {
          const rawExam = json?.exam || json;
          const exam = normalizeExam(rawExam, body);
          if (!exam.questions.length) throw new Error("Gemini returned no valid exam questions");

          return send(res, 200, {
            ok: true,
            provider: "gemini",
            model,
            analysis: { exam },
            data: { exam }
          });
        }

        return send(res, 200, {
          ok: true,
          provider: "gemini",
          model,
          analysis: json || { answer: txt },
          data: json || { answer: txt }
        });
      } catch (e) {
        errors.push({ model, attempt, message: e.message, status: e.status || null });
        await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }
  }

  if (body.mode === "generate_questions") {
    const questions = fallbackQuestions(body);
    return send(res, 200, {
      ok: true,
      provider: "fallback",
      model: "local-fallback",
      warning: "ضغط مؤقت على Gemini، تم استخدام أسئلة احتياطية.",
      analysis: { questions },
      data: { questions },
      errors
    });
  }

  if (body.mode === "generate_exam") {
    const exam = fallbackExam(body);
    return send(res, 200, {
      ok: true,
      provider: "fallback",
      model: "local-fallback",
      warning: "ضغط مؤقت على Gemini أو لم يتم إرجاع أسئلة صالحة، تم استخدام امتحان احتياطي.",
      analysis: { exam },
      data: { exam },
      errors
    });
  }

  return send(res, 503, {
    ok: false,
    error: "مزود الذكاء الاصطناعي عليه ضغط مؤقت. جرّب بعد قليل.",
    errors
  });
}
