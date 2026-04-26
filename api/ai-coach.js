// api/ai-coach.js

const GEMINI_MODEL = "gemini-1.5-flash";

function buildPrompt(body) {
  const mode = body?.mode || "general";

  if (mode === "generate_exam") {
    return `
أنت مدرس ذكي.

المطلوب:
إنشاء امتحان JSON.

الموضوع: ${body.topic}
الصف: ${body.grade}

الشروط:
- 15 إلى 20 سؤال
- اختياري (4 اختيارات)
- مستويات مختلفة
- correctIdx من 0 لـ 3
- شرح لكل سؤال

ارجع JSON فقط بالشكل ده:

{
  "exam": {
    "title": "امتحان",
    "questions": [
      {
        "text": "سؤال",
        "options": ["A","B","C","D"],
        "correctIdx": 0,
        "explanation": "شرح"
      }
    ]
  }
}
`;
  }

  if (mode === "student_chat") {
    return `
أنت مدرب ذكي.

سؤال الطالب:
${body.question}

الصف:
${body.grade}

ارجع JSON فقط:

{
  "answer": "رد واضح",
  "studyPlan": ["خطوة1","خطوة2"]
}
`;
  }

  return `
حلل وارجع JSON:

{
  "explanation": "شرح",
  "studyPlan": []
}
`;
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;

  if (!key) throw new Error("Gemini key missing");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Gemini error");
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true,
      message: "Use POST",
    });
  }

  try {
    const prompt = buildPrompt(req.body);
    const result = await callGemini(prompt);

    return res.status(200).json({
      ok: true,
      provider: "gemini",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}