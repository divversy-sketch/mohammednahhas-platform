export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        message: "AI API is working"
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "GEMINI_API_KEY مش موجود في Vercel"
      });
    }

    const body = req.body || {};
    const mode = body.mode || "normal";

    const prompt = `
أنت مدرس لغة عربية محترف.

المطلوب: ${mode}

الموضوع: ${body.topic || body.question || ""}

ارجع النتيجة بصيغة JSON فقط بدون أي كلام خارجي:

{
  "analysis": {
    "answer": "الإجابة هنا",
    "summary": "ملخص بسيط",
    "recommendations": ["نصيحة 1", "نصيحة 2"],
    "exam": {
      "title": "امتحان",
      "questions": [
        {
          "id": "1",
          "text": "سؤال؟",
          "options": ["أ", "ب", "ج", "د"],
          "correctIdx": 0
        }
      ]
    }
  }
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        error: data?.error?.message || "Gemini Error"
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("\n")
        .trim();

    if (!text) {
      return res.status(500).json({
        ok: false,
        error: "Gemini رجع رد فاضي"
      });
    }

    // نحاول نحول النص لـ JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(200).json({
        ok: true,
        raw: text,
        analysis: {
          answer: text,
          summary: text,
          recommendations: [],
          exam: { questions: [] }
        }
      });
    }

    return res.status(200).json({
      ok: true,
      ...parsed
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}