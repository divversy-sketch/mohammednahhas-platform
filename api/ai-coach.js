const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'mido16280@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function verifyAdminRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = String(header).startsWith('Bearer ') ? String(header).slice(7) : '';
  if (!token) return { ok: false, status: 401, error: 'AI متاح للأدمن فقط. لم يتم إرسال جلسة دخول.' };

  const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!firebaseApiKey) return { ok: false, status: 500, error: 'FIREBASE_API_KEY غير موجود في Vercel.' };

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  });
  const data = await response.json().catch(() => ({}));
  const email = data?.users?.[0]?.email?.toLowerCase?.() || '';

  if (!response.ok || !email) return { ok: false, status: 401, error: 'جلسة الأدمن غير صالحة.' };
  if (!ADMIN_EMAILS.includes(email)) return { ok: false, status: 403, error: 'هذا الحساب غير مصرح له باستخدام AI.' };

  return { ok: true, email };
}

function buildPrompt(body = {}) {
  const mode = body.mode || 'normal';
  const grade = body.grade || 'غير محدد';
  const topic = body.topic || body.branches || body.question || body.message || body.prompt || '';
  const context = body.context || '';
  const mcqCount = Number(body.mcqCount || body.count || 15);

  if (mode === 'generate_exam' || mode === 'generate_questions' || mode === 'ai_interactive_exam') {
    return `أنت مدرس لغة عربية مصري محترف.\n\nالمطلوب: توليد أسئلة أو امتحان مناسب للمرحلة: ${grade}\n\nالموضوع أو الفروع:\n${topic}\n\nالسياق:\n${context}\n\nعدد الأسئلة المطلوب: ${mcqCount}\n\nالشروط:\n- أسئلة اختيار من متعدد من 4 اختيارات.\n- correctIdx رقم من 0 إلى 3.\n- لا تستخدم Markdown.\n- أرجع JSON صالح فقط.\n\nالصيغة:\n{\n  "analysis": {\n    "answer": "تم التوليد بنجاح",\n    "summary": "ملخص قصير",\n    "recommendations": ["نصيحة 1", "نصيحة 2"],\n    "exam": {\n      "title": "امتحان",\n      "questions": [\n        {"id":"q1","text":"نص السؤال","type":"mcq","branch":"النحو","options":["اختيار 1","اختيار 2","اختيار 3","اختيار 4"],"correctIdx":0,"explanation":"شرح مختصر"}\n      ]\n    }\n  },\n  "data": {"answer":"تم التوليد بنجاح","exam":{"title":"امتحان","questions":[]}}\n}`;
  }

  return `أنت مساعد تعليمي لمعلم لغة عربية. أجب للأدمن فقط.\n\nالطلب:\n${topic}\n\nالسياق:\n${context}\n\nأرجع JSON صالح فقط:\n{\n  "analysis": {"answer":"الإجابة","summary":"ملخص","recommendations":["نصيحة 1"],"exam":{"title":"","questions":[]}},\n  "data": {"answer":"الإجابة","summary":"ملخص","exam":{"title":"","questions":[]}}\n}`;
}

function normalizeResponse(parsed, model) {
  const analysis = parsed.analysis || {};
  const dataObj = parsed.data || {};
  const exam = analysis.exam || dataObj.exam || parsed.exam || { title: '', questions: [] };
  const answer = analysis.answer || dataObj.answer || parsed.answer || 'تم تنفيذ الطلب بنجاح.';
  const summary = analysis.summary || dataObj.summary || parsed.summary || answer;
  const recommendations = analysis.recommendations || dataObj.recommendations || parsed.recommendations || [];
  return {
    ok: true,
    provider: 'gemini',
    model,
    text: answer,
    answer,
    analysis: { ...analysis, answer, summary, recommendations, exam },
    data: { ...dataObj, answer, summary, recommendations, exam }
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.status(200).json({ ok: true, message: 'AI endpoint ready. Admin only.' });
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const admin = await verifyAdminRequest(req);
    if (!admin.ok) return res.status(admin.status).json({ ok: false, error: admin.error });

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return res.status(500).json({ ok: false, error: 'GEMINI_API_KEY غير موجود في Vercel.' });

    const body = req.body || {};
    const prompt = buildPrompt(body);
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    let lastError = null;

    for (const model of models) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 8192, responseMimeType: 'application/json' }
        })
      });

      const raw = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = raw?.error?.message || `Gemini error ${response.status}`;
        lastError = msg;
        if (response.status === 429 || /quota|rate limit|resource exhausted|exceeded/i.test(msg)) {
          return res.status(429).json({ ok: false, error: 'تم استهلاك الحد الحالي للذكاء الاصطناعي.', reason: msg });
        }
        continue;
      }

      const text = raw?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim();
      if (!text) { lastError = 'Gemini رجع رد فارغ.'; continue; }

      const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      try {
        return res.status(200).json(normalizeResponse(JSON.parse(cleaned), model));
      } catch {
        return res.status(200).json(normalizeResponse({ analysis: { answer: cleaned, summary: cleaned, exam: { title: '', questions: [] } } }, model));
      }
    }

    return res.status(503).json({ ok: false, error: 'Gemini لم يرد حاليًا.', reason: lastError || 'فشل كل النماذج.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'خطأ داخلي في ai-coach.js', details: err?.message || String(err) });
  }
}
