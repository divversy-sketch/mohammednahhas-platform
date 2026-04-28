export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        message: "Gemini AI API is working",
        provider: "smart-fallback"
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed"
      });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "GEMINI_API_KEY مش موجود"
      });
    }

    const body = req.body || {};
    const mode = body.mode || "normal";

    const question =
      body.question ||
      body.message ||
      body.topic ||
      body.branches ||
      body.prompt ||
      "";

    if (!question || String(question).trim().length < 2) {
      return res.status(400).json({
        ok: false,
        error: "مفيش سؤال واضح"
      });
    }

    // 🧠 بناء Prompt ذكي
    const prompt = `
أنت مدرس لغة عربية محترف.

المطلوب: ${mode}

الموضوع:
${question}

ارجع JSON فقط بدون أي شرح:

{
  "analysis": {
    "answer": "الإجابة",
    "summary": "ملخص",
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

    // 🔥 ترتيب ذكي (من الأخف للأقوى)
    const models = [
      "gemini-1.5-flash",
      "gemini-2.0-flash"
    ];

    let lastError = null;

    for (const model of models) {
      try {
        // ⏱️ delay بسيط يقلل الضغط
        await new Promise(r => setTimeout(r, 1200));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
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

        // ❌ لو quota خلص → وقف فورًا
        if (
          data?.error?.message?.toLowerCase().includes("quota") ||
          response.status === 429
        ) {
          return res.status(429).json({
            ok: false,
            error: "تم استهلاك الحد اليومي للذكاء الاصطناعي"
          });
        }

        if (!response.ok) {
          lastError = data?.error?.message;
          continue;
        }

        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map(p => p.text || "")
            .join("\n")
            .trim();

        if (!text) continue;

        // 🧠 محاولة تحويل JSON
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          return res.status(200).json({
            ok: true,
            model,
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
          model,
          ...parsed
        });

      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(500).json({
      ok: false,
      error: lastError || "فشل في كل الموديلات"
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}