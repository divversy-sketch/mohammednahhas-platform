// api/ai-coach.js
// Gemini-only backend for Vercel.
// Required Vercel Environment Variable: GEMINI_API_KEY
// Current stable Gemini model: gemini-2.5-flash

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function safeTrim(value, max = 14000) {
  return String(value ?? "").slice(0, max);
}

function stripJsonFence(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseJSON(text) {
  const raw = stripJsonFence(text);

  try {
    return JSON.parse(raw);
  } catch (e) {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {}
  }

  return {
    summary: "تم إنشاء رد من Gemini.",
    answer: raw.slice(0, 3000),
    explanation: raw.slice(0, 3000),
    studyPlan: [],
    quickExercises: []
  };
}

function schemaForMode(mode) {
  if (mode === "generate_exam") {
    return `{
  "summary": "ملخص قصير",
  "exam": {
    "title": "عنوان الامتحان",
    "duration": 25,
    "questions": [
      {
        "text": "قطعة أو تعليمات ويمكن استخدام [تمييز] عند الحاجة",
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
  "studyPlan": ["خطوة 1", "خطوة 2"],
  "quickExercises": ["تدريب 1", "تدريب 2"]
}`;
  }

  if (mode === "essay_correct") {
    return `{
  "summary": "ملخص التصحيح",
  "suggestedScore": 0,
  "feedback": "ملاحظات للطالب",
  "strengths": ["نقطة قوة"],
  "improvements": ["نقطة تحتاج تحسين"],
  "studyPlan": ["خطوة مراجعة"]
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
لا تذكر أنك ذكاء اصطناعي.
رجّع JSON فقط بدون Markdown وبدون أي شرح خارج JSON.

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
عدد المقالي: ${Number(body.essayCount || 0)}
المدة: ${Number(body.duration || 25)} دقيقة
تعليمات إضافية: ${safeTrim(body.instructions, 1000)}

شروط مهمة:
- عدد الأسئلة بين 15 و20 سؤال اختيار من متعدد.
- وزّع الصعوبة بين: سهل، متوسط، صعب، صعب جدا.
- لا تضع أي سؤال خارج مرحلة الطالب.
- كل سؤال له 4 اختيارات.
- correctIdx رقم من 0 إلى 3 فقط.
- كل سؤال له explanation واضح يشرح فكرة السؤال والتصويب.
- استخدم [ ] لتظليل الكلمات المهمة في القطعة أو السؤال عند الحاجة.
- أضف tags تلقائية من فهم السؤال.
`;
  }

  if (mode === "student_chat") {
    return `${base}

المطلوب: الرد على الطالب كمدرب ذكي.
اسم الطالب: ${safeTrim(body.studentName, 200)}
الصف: ${safeTrim(body.grade, 100)}
سؤال الطالب: ${safeTrim(body.question, 2500)}

آخر النتائج:
${safeTrim(JSON.stringify(body.recentResults || [], null, 2), 6000)}

آخر المحادثة:
${safeTrim(JSON.stringify(body.chatHistory || [], null, 2), 4000)}
`;
  }

  if (mode === "question_explain") {
    return `${base}

المطلوب: شرح سؤال واحد، سبب الخطأ، وخطة مذاكرة صغيرة.
بيانات السؤال والطالب:
${safeTrim(JSON.stringify(body, null, 2), 12000)}
`;
  }

  if (mode === "exam_review" || mode === "student_home_plan") {
    return `${base}

المطلوب: تحليل النتائج وتقديم خطة مذاكرة عملية.
البيانات:
${safeTrim(JSON.stringify(body, null, 2), 14000)}
`;
  }

  if (mode === "essay_correct") {
    return `${base}

المطلوب: تصحيح إجابة مقالية باقتراح درجة فقط، والقرار النهائي للأدمن.
البيانات:
${safeTrim(JSON.stringify(body, null, 2), 12000)}
`;
  }

  return `${base}

حلل البيانات التالية:
${safeTrim(JSON.stringify(body, null, 2), 14000)}
`;
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("GEMINI_API_KEY missing in Vercel Environment Variables");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json"
      }
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`);
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "{}";

  return parseJSON(text);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      provider: "gemini",
      model: GEMINI_MODEL,
      message: "AI endpoint exists. Use POST from the platform."
    });
  }

  try {
    const prompt = buildPrompt(req.body || {});
    const analysis = await callGemini(prompt);

    return res.status(200).json({
      ok: true,
      provider: "gemini",
      model: GEMINI_MODEL,
      analysis,
      data: analysis
    });
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({
      ok: false,
      provider: "gemini",
      model: GEMINI_MODEL,
      error: error.message || "Gemini failed"
    });
  }
}
