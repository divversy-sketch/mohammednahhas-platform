// api/ai-coach.js
// Gemini fallback + retry تلقائي + منع الأسئلة الوهمية

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

function isBadOption(value) {
  const v = String(value || "").trim();
  return !v || /^اختيار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(v) || /^اختبار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(v);
}

function isValidQuestion(q) {
  if (!q || !String(q.text || "").trim()) return false;
  const text = String(q.text || "").trim();
  if (/^سؤال\s+تدريبي\s+\d+/i.test(text)) return false;
  if (!Array.isArray(q.options) || q.options.length < 4) return false;
  const options = q.options.slice(0, 4).map(x => String(x || "").trim());
  if (options.some(isBadOption)) return false;
  if (new Set(options).size < 4) return false;
  return true;
}

function normalizeQuestion(q, i, topic = "عام") {
  const options = Array.isArray(q?.options) ? q.options.slice(0, 4).map(x => String(x || "").trim()) : [];
  return {
    id: q?.id || `q_${i + 1}`,
    text: String(q?.text || "").trim(),
    options,
    correctIdx: Number.isInteger(q?.correctIdx) && q.correctIdx >= 0 && q.correctIdx <= 3 ? q.correctIdx : 0,
    difficulty: q?.difficulty || ["سهل", "متوسط", "صعب", "صعب جدًا"][i % 4],
    branch: q?.branch || topic,
    explanation: q?.explanation || "راجع فكرة السؤال ثم قارن الإجابات."
  };
}

function emergencyRealQuestions(body = {}) {
  const topic = body.topic || body.branches || body.branch || "النحو";
  const branch = body.branch || body.branches || topic;
  const grade = body.grade || "الطالب";
  const templates = [
    {
      text: `في ${branch}: ما الاختيار الذي يعبّر عن الفكرة الأساسية في الدرس المطلوب؟`,
      options: ["تحديد القاعدة أولًا ثم تطبيقها", "حفظ الاختيارات بدون فهم", "تجاهل موضع الكلمة", "اختيار الإجابة الأطول دائمًا"],
      correctIdx: 0,
      explanation: "الفهم الصحيح يبدأ بتحديد القاعدة أو الفكرة ثم التطبيق على المثال."
    },
    {
      text: `أي خطوة تساعدك أكثر عند حل سؤال في ${topic}؟`,
      options: ["قراءة السؤال وتحديد المطلوب", "اختيار أول إجابة بسرعة", "ترك السؤال بدون محاولة", "الاعتماد على التخمين فقط"],
      correctIdx: 0,
      explanation: "تحديد المطلوب يمنع الخلط بين القواعد المتشابهة."
    },
    {
      text: `عند وجود كلمة بين علامتي [ ] في القطعة، ماذا تفعل أولًا؟`,
      options: ["أحدد موقعها ووظيفتها في الجملة", "أتجاهل السياق", "أختار إجابة عشوائية", "أحذف الكلمة من الجملة"],
      correctIdx: 0,
      explanation: "تظليل الكلمة يعني أن السؤال غالبًا مرتبط بوظيفتها أو معناها داخل السياق."
    },
    {
      text: `ما أفضل طريقة لمراجعة خطأ متكرر في ${branch}؟`,
      options: ["كتابة سبب الخطأ وحل مثال مشابه", "حفظ الإجابة فقط", "تجاهل الخطأ", "تغيير الفرع بالكامل"],
      correctIdx: 0,
      explanation: "معرفة سبب الخطأ مع تدريب مشابه تثبت الفكرة."
    }
  ];
  const count = Math.min(Math.max(Number(body.count || body.mcqCount || 18), 8), 20);
  return Array.from({ length: count }).map((_, i) => {
    const base = templates[i % templates.length];
    return {
      id: `emergency_${i + 1}`,
      text: `${base.text} (${i + 1})`,
      options: base.options,
      correctIdx: base.correctIdx,
      difficulty: ["سهل", "متوسط", "صعب", "صعب جدًا"][i % 4],
      branch,
      explanation: `${base.explanation} مناسب لمرحلة ${grade}.`
    };
  });
}

function normalizeExam(exam, body = {}) {
  const topic = body.topic || body.branches || "مراجعة عامة";
  const rawQuestions = Array.isArray(exam?.questions) ? exam.questions : [];
  const questions = rawQuestions
    .flatMap((item, i) => {
      if (Array.isArray(item?.subQuestions)) {
        return item.subQuestions.map((q, j) => normalizeQuestion(q, i + j, topic));
      }
      return [normalizeQuestion(item, i, topic)];
    })
    .filter(isValidQuestion)
    .slice(0, 20);

  return {
    title: exam?.title || `امتحان AI - ${topic}`,
    questions
  };
}

function buildPrompt(body) {
  if (body.mode === "generate_questions") {
    const topic = body.topic || "مراجعة عامة";
    const branch = body.branch || body.branches || topic;
    const grade = body.grade || "غير محدد";
    const count = Math.min(Math.max(Number(body.count || 10), 1), 20);
    return `
أنت معلم لغة عربية مصري. أنشئ ${count} سؤال اختيار من متعدد حقيقي، وليس أسئلة شكلية.
المرحلة: ${grade}
الفرع: ${branch}
الموضوع: ${topic}
الصعوبة: ${body.difficulty || "متوسط"}

ممنوع تمامًا استخدام اختيارات مثل: اختيار أ، اختيار ب، اختيار ج، اختيار د.
لازم كل سؤال له نص واضح، و4 اختيارات تعليمية حقيقية، وشرح.

أعد JSON فقط:
{
  "questions": [
    {
      "id": "q1",
      "text": "نص سؤال حقيقي",
      "options": ["إجابة حقيقية 1", "إجابة حقيقية 2", "إجابة حقيقية 3", "إجابة حقيقية 4"],
      "correctIdx": 0,
      "difficulty": "متوسط",
      "branch": "${branch}",
      "explanation": "شرح سبب الإجابة"
    }
  ]
}
`;
  }

  if (body.mode === "generate_exam") {
    const topic = body.topic || body.branches || "مراجعة عامة";
    const grade = body.grade || "غير محدد";
    return `
أنت معلم لغة عربية مصري. أنشئ امتحان اختيار من متعدد حقيقي من 15 إلى 20 سؤال.

الشروط الصارمة:
- المرحلة الدراسية: ${grade}
- الموضوع / الفرع: ${topic}
- ممنوع سؤال تدريبي عام.
- ممنوع اختيارات وهمية مثل: اختيار أ، اختيار ب، اختيار ج، اختيار د.
- كل سؤال لازم يكون له نص واضح مرتبط بالموضوع.
- كل سؤال له 4 اختيارات حقيقية مختلفة.
- correctIdx رقم من 0 إلى 3.
- explanation يشرح سبب الإجابة.
- التزم بمستوى الطالب ولا تخرج عنه.

أعد JSON فقط:
{
  "exam": {
    "title": "عنوان الامتحان",
    "questions": [
      {
        "id": "q1",
        "text": "نص سؤال حقيقي",
        "options": ["اختيار حقيقي 1", "اختيار حقيقي 2", "اختيار حقيقي 3", "اختيار حقيقي 4"],
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
          const questions = raw.map((q, i) => normalizeQuestion(q, i, body.branch || body.topic)).filter(isValidQuestion);
          if (questions.length < 3) throw new Error("Gemini returned placeholder or invalid questions");
          return send(res, 200, { ok: true, provider: "gemini", model, analysis: { questions }, data: { questions } });
        }

        if (body.mode === "generate_exam") {
          const rawExam = json?.exam || json;
          const exam = normalizeExam(rawExam, body);
          if (exam.questions.length < 5) throw new Error("Gemini returned placeholder or invalid exam questions");
          return send(res, 200, { ok: true, provider: "gemini", model, analysis: { exam }, data: { exam } });
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
    const questions = emergencyRealQuestions(body);
    return send(res, 200, {
      ok: true,
      provider: "fallback",
      model: "local-real-fallback",
      warning: "Gemini ضغط أو رجع أسئلة غير صالحة، تم استخدام أسئلة احتياطية مفهومة.",
      analysis: { questions },
      data: { questions },
      errors
    });
  }

  if (body.mode === "generate_exam") {
    const questions = emergencyRealQuestions(body);
    const exam = { title: `امتحان احتياطي مفهوم - ${body.topic || body.branches || "مراجعة"}`, questions };
    return send(res, 200, {
      ok: true,
      provider: "fallback",
      model: "local-real-fallback",
      warning: "Gemini ضغط أو رجع أسئلة غير صالحة، تم استخدام امتحان احتياطي مفهوم.",
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
