export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        message: "Gemini AI API is working",
        provider: "gemini-only"
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed"
      });
    }

    const body = req.body || {};
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
        error: "لم يتم إدخال سؤال أو موضوع واضح."
      });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "GEMINI_API_KEY غير موجود في Vercel Environment Variables."
      });
    }

    const models = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    let lastError = null;

    for (const model of models) {
      try {
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
                  parts: [
                    {
                      text: String(question)
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096
              }
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          lastError = data?.error?.message || `Gemini error ${response.status}`;
          continue;
        }

        const text =
          data?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join("\n")
            .trim();

        if (text) {
          return res.status(200).json({
            ok: true,
            provider: "gemini",
            model,
            text,
            answer: text,
            analysis: {
              answer: text
            },
            data: {
              answer: text
            }
          });
        }

        lastError = "Gemini رجع رد فاضي بدون نص.";
      } catch (err) {
        lastError = err?.message || "حدث خطأ غير معروف أثناء الاتصال بـ Gemini.";
      }
    }

    return res.status(503).json({
      ok: false,
      provider: "gemini",
      error: "Gemini لم يرد حاليًا.",
      reason:
        lastError ||
        "قد يكون السبب ضغط مؤقت على موديل Gemini أو مشكلة في المفتاح أو الموديل.",
      advice: "جرّب بعد قليل، أو اختصر السؤال، أو راجع GEMINI_API_KEY في Vercel."
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      provider: "gemini",
      error: "خطأ داخلي في ai-coach.js",
      details: err?.message || String(err)
    });
  }
}