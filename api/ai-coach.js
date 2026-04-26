const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

function safeTrim(value, max = 14000) {
  return String(value ?? "").slice(0, max);
}

function schemaForMode(mode) {
  if (mode === "generate_exam") {
    return `{
      "summary": "ملخص",
      "exam": {
        "title": "عنوان الامتحان",
        "duration": 25,
        "questions": [
          {
            "text": "قطعة أو تعليمات ويمكن استخدام [تمييز]",
            "subQuestions": [
              {
                "id": "q1",
                "text": "نص السؤال",
                "type": "mcq",
                "branch": "الفرع",
                "difficulty": "سهل",
                "options": ["اختيار 1", "اختيار 2", "اختيار 3", "اختيار 4"],
                "correctIdx": 0,
                "explanation": "شرح فكرة السؤال والتصويب",
                "maxScore": 1,
                "tags": ["مهارة"]
              }
            ]
          }
        ]
      }
    }`;
  }

  if (mode === "student_chat") {
    return `{
      "summary": "ملخص",
      "answer": "رد مباشر للطالب بالعربية المصرية",
      "studyPlan": ["خطوة 1", "خطوة 2"]
    }`;
  }

  return `{
    "summary": "ملخص قصير",
    "explanation": "شرح السؤال أو التحليل",
    "mistakeReason": "سبب الخطأ المحتمل",
    "studyPlan": ["خطوة 1", "خطوة 2", "خطوة 3"],
    "quickExercises": ["تدريب 1", "تدريب 2"]
  }`;
}

function buildPrompt(body) {
  const mode = body?.mode || "general";
  const base = `
أنت مدرب ومصحح عربي ذكي لمنصة تعليمية للأستاذ محمد النحاس.
اكتب بالعربية المصرية الواضحة.
التزم بالمرحلة الدراسية المطلوبة ولا تخرج عنها.
رجّع JSON فقط بدون Markdown.
الشكل المطلوب:
${schemaForMode(mode)}
`;

  if (mode === "generate_exam") {
    return `${base}

المطلوب: بناء امتحان تفاعلي في صورة JSON للمنصة.
الموضوع/الفرع: ${safeTrim(body.topic, 700)}
الصف/مرحلة الطالب: ${safeTrim(body.grade, 100)}
الفروع المطلوبة: ${safeTrim(body.branches, 500)}
عدد الاختياري المطلوب: ${Number(body.mcqCount || 18)}
المدة: ${Number(body.duration || 25)} دقيقة
تعليمات إضافية: ${safeTrim(body.instructions, 1000)}

شروط:
- عدد الأسئلة بين 15 و20 سؤال اختيار من متعدد.
- الصعوبة موزعة: سهل، متوسط، صعب، صعب جدا.
- لا تضع أي سؤال خارج مرحلة الطالب.
- كل سؤال له 4 اختيارات.
- correctIdx رقم من 0 إلى 3.
- كل سؤال له explanation واضح للتصويب.
- استخدم [ ] لتظليل الكلمات المهمة عند الحاجة.
`;
  }

  if (mode === "student_chat") {
    return `${base}

رد على الطالب كمدرب ذكي.
اسم الطالب: ${safeTrim(body.studentName, 200)}
الصف: ${safeTrim(body.grade, 100)}
سؤال الطالب: ${safeTrim(body.question, 2500)}
آخر النتائج:
${safeTrim(JSON.stringify(body.recentResults || [], null, 2), 6000)}
آخر المحادثة:
${safeTrim(JSON.stringify(body.chatHistory || [], null, 2), 4000)}
`;
  }

  return `${base}
حلل البيانات:
${safeTrim(JSON.stringify(body, null, 2), 14000)}
`;
}

function parseJSON(text) {
  const raw = String(text || "").trim();
  try { return JSON.parse(raw); } catch (e) {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (e) {}
  }
  return { summary: "تم إنشاء تحليل.", explanation: raw.slice(0, 2000), studyPlan: [], quickExercises: [] };
}

async function callOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a strict JSON-only Arabic educational assistant." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI request failed");
  return parseJSON(data?.choices?.[0]?.message?.content || "{}");
}

async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.35, responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini request failed");
  const txt = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\\n") || "{}";
  return parseJSON(txt);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "AI endpoint exists. Use POST from the platform.",
      method: req.method
    });
  }

  try {
    const prompt = buildPrompt(req.body || {});
    let provider = "openai";
    let analysis;
    try {
      analysis = await callOpenAI(prompt);
    } catch (openAIError) {
      provider = "gemini";
      console.warn("OpenAI failed, using Gemini:", openAIError.message);
      analysis = await callGemini(prompt);
    }
    return res.status(200).json({ ok: true, provider, analysis });
  } catch (error) {
    console.error("AI API error:", error);
    return res.status(500).json({
      ok: false,
      error: "AI غير متصل حاليًا. راجع مفاتيح OPENAI_API_KEY أو GEMINI_API_KEY في Vercel ثم اعمل Redeploy."
    });
  }
}
