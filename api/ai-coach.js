// api/ai-coach.js
// Gemini fallback + retry تلقائي + أسئلة مرتبطة بالدرس وليست عامة

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

function getRequestedLesson(body = {}) {
  return String(body.topic || body.branches || body.branch || body.lesson || "مراجعة عامة").trim();
}

function normalizeArabicKey(value = "") {
  return String(value || "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBadOption(value) {
  const v = String(value || "").trim();
  return !v || /^اختيار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(v) || /^اختبار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(v);
}

function isGenericQuestionText(value = "") {
  const v = String(value || "").trim();
  return (
    /^سؤال\s+تدريبي\s+\d+/i.test(v) ||
    /ما الاختيار الذي يعبّر عن الفكرة الأساسية/i.test(v) ||
    /أي خطوة تساعدك أكثر/i.test(v) ||
    /أفضل طريقة لمراجعة خطأ/i.test(v) ||
    /الدرس المطلوب/i.test(v)
  );
}

function isValidQuestion(q) {
  if (!q || !String(q.text || "").trim()) return false;
  const text = String(q.text || "").trim();
  if (isGenericQuestionText(text)) return false;
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

function lessonFallbackQuestions(body = {}) {
  const lesson = getRequestedLesson(body);
  const key = normalizeArabicKey(lesson);
  const count = Math.min(Math.max(Number(body.count || body.mcqCount || 18), 8), 20);

  let pool = [];

  if (key.includes("اسم التفضيل") || key.includes("تفضيل")) {
    pool = [
      {
        text: "أيُّ صيغة مما يأتي تُعدّ اسم تفضيل صحيحًا؟",
        options: ["أكبر", "كبير", "كبر", "تكبير"],
        correctIdx: 0,
        difficulty: "سهل",
        explanation: "اسم التفضيل غالبًا يأتي على وزن (أفعل) مثل: أكبر، أفضل، أجمل."
      },
      {
        text: "اسم التفضيل في جملة: «العلمُ أنفعُ من المال» هو:",
        options: ["العلم", "أنفع", "من", "المال"],
        correctIdx: 1,
        difficulty: "سهل",
        explanation: "كلمة «أنفع» جاءت على وزن أفعل ودلت على تفضيل العلم على المال."
      },
      {
        text: "أي جملة تحتوي على اسم تفضيل؟",
        options: ["محمد أطول من أخيه", "محمد طويل القامة", "طال محمد في السفر", "أطال محمد الحديث"],
        correctIdx: 0,
        difficulty: "متوسط",
        explanation: "«أطول» اسم تفضيل، لأنه يدل على زيادة محمد في الطول مقارنة بأخيه."
      },
      {
        text: "الحالة الصحيحة لاسم التفضيل إذا كان نكرة غير مضاف هي أنه:",
        options: ["يلزم الإفراد والتذكير", "يطابق المفضل دائمًا", "يأتي جمعًا فقط", "يمنع دخول من بعده"],
        correctIdx: 0,
        difficulty: "صعب",
        explanation: "اسم التفضيل النكرة غير المضاف غالبًا يلزم صورة المفرد المذكر مثل: هند أفضل من غيرها."
      },
      {
        text: "في جملة: «الطالباتُ أفضلُ من غيرهنَّ اجتهادًا»، اسم التفضيل هو:",
        options: ["الطالبات", "أفضل", "غيرهن", "اجتهادًا"],
        correctIdx: 1,
        difficulty: "متوسط",
        explanation: "«أفضل» اسم تفضيل، وجاء مفردًا مذكرًا لأنه غير مضاف ومقترن بمن."
      },
      {
        text: "أي مما يأتي لا يصح أن يُصاغ منه اسم تفضيل مباشر غالبًا؟",
        options: ["الفعل الجامد", "الفعل الثلاثي", "الفعل المثبت", "الفعل القابل للتفاوت"],
        correctIdx: 0,
        difficulty: "صعب",
        explanation: "من شروط صياغة اسم التفضيل المباشر أن يكون الفعل متصرفًا لا جامدًا."
      },
      {
        text: "أفضل صياغة للتفضيل من الفعل غير المستوفي للشروط تكون باستخدام:",
        options: ["أشدّ أو أكثر + المصدر", "الفعل الماضي فقط", "اسم الفاعل فقط", "حذف المفضل عليه"],
        correctIdx: 0,
        difficulty: "صعب جدًا",
        explanation: "إذا لم يستوف الفعل الشروط نصوغ التفضيل بطريقة مساعدة مثل: أكثر اجتهادًا، أشد حمرة."
      },
      {
        text: "في عبارة: «مصرُ أعظمُ البلادِ تاريخًا»، المفضل هو:",
        options: ["مصر", "أعظم", "البلاد", "تاريخًا"],
        correctIdx: 0,
        difficulty: "متوسط",
        explanation: "المفضل هو الشيء الذي زاد في الصفة، وهو هنا «مصر»."
      },
      {
        text: "في جملة: «هذا الكتابُ أكثرُ فائدةً»، سبب استخدام «أكثر» هو:",
        options: ["لأن فائدة مصدر لفعل غير مباشر في التفضيل", "لأن أكثر فعل ماض", "لأن الكتاب جمع", "لأن الجملة لا تحتوي مقارنة"],
        correctIdx: 0,
        difficulty: "صعب جدًا",
        explanation: "نستخدم أكثر/أشد مع المصدر عند الحاجة لصياغة تفضيل غير مباشر."
      },
      {
        text: "أي إعراب مناسب لكلمة «أفضل» في: «المجتهدُ أفضلُ من الكسول»؟",
        options: ["خبر مرفوع", "فاعل مرفوع", "مفعول به منصوب", "مضاف إليه مجرور"],
        correctIdx: 0,
        difficulty: "صعب",
        explanation: "«أفضل» خبر للمبتدأ «المجتهد» مرفوع، وهو اسم تفضيل."
      }
    ];
  } else if (key.includes("بلاغ") || key.includes("البلاغه") || key.includes("البيان") || key.includes("بديع")) {
    pool = [
      {
        text: "أي مثال يُعدّ تشبيهًا واضحًا؟",
        options: ["الجندي كالأسد في الشجاعة", "ابتسم الصباح", "الكتاب صديق", "سمعت صوت الحق"],
        correctIdx: 0,
        difficulty: "سهل",
        explanation: "وجود الكاف بين الجندي والأسد مع وجه الشبه يدل على التشبيه."
      },
      {
        text: "في قولنا: «العلم نور»، نوع الصورة البيانية:",
        options: ["تشبيه بليغ", "استعارة مكنية", "كناية", "جناس"],
        correctIdx: 0,
        difficulty: "متوسط",
        explanation: "حُذف أداة التشبيه ووجه الشبه، فصار تشبيهًا بليغًا."
      },
      {
        text: "«ابتسمتِ السماءُ» صورة بيانية تعتمد على:",
        options: ["تشخيص", "طباق", "جناس", "سجع"],
        correctIdx: 0,
        difficulty: "متوسط",
        explanation: "نسب الابتسام إلى السماء، وهو من صفات الإنسان."
      },
      {
        text: "الطباق هو الجمع بين:",
        options: ["كلمتين متضادتين", "كلمتين مترادفتين", "كلمتين لهما نفس الوزن فقط", "جملتين طويلتين"],
        correctIdx: 0,
        difficulty: "سهل",
        explanation: "الطباق مثل: ليل/نهار، خير/شر."
      }
    ];
  } else if (key.includes("نحو") || key.includes("اعراب") || key.includes("اعراب")) {
    pool = [
      {
        text: "الكلمة المرفوعة بعد فعل مبني للمعلوم تُسمى غالبًا:",
        options: ["فاعلًا", "مفعولًا به", "حالًا", "تمييزًا"],
        correctIdx: 0,
        difficulty: "سهل",
        explanation: "الفاعل هو من قام بالفعل أو اتصف به ويأتي مرفوعًا."
      },
      {
        text: "في جملة: «قرأ الطالبُ الدرسَ»، المفعول به هو:",
        options: ["الدرس", "قرأ", "الطالب", "الجملة كلها"],
        correctIdx: 0,
        difficulty: "سهل",
        explanation: "الدرس وقع عليه فعل القراءة، لذلك هو مفعول به."
      },
      {
        text: "علامة رفع جمع المذكر السالم هي:",
        options: ["الواو", "الألف", "الياء", "الفتحة"],
        correctIdx: 0,
        difficulty: "متوسط",
        explanation: "يرفع جمع المذكر السالم بالواو وينصب ويجر بالياء."
      },
      {
        text: "الجملة الاسمية تبدأ غالبًا بـ:",
        options: ["اسم", "فعل", "حرف جر", "أداة نصب فقط"],
        correctIdx: 0,
        difficulty: "سهل",
        explanation: "الجملة الاسمية ركنها الأساسي مبتدأ وخبر."
      }
    ];
  } else {
    pool = [
      {
        text: `في درس «${lesson}»: ما أول خطوة صحيحة لفهم السؤال؟`,
        options: ["تحديد المطلوب من السؤال", "اختيار إجابة عشوائية", "تجاهل الكلمات المهمة", "حفظ الاختيارات فقط"],
        correctIdx: 0,
        difficulty: "سهل",
        explanation: "تحديد المطلوب هو أساس الإجابة الصحيحة."
      },
      {
        text: `ما الطريقة الأفضل لمراجعة درس «${lesson}»؟`,
        options: ["فهم القاعدة ثم حل أمثلة", "حفظ الإجابات فقط", "ترك الأخطاء دون مراجعة", "الاعتماد على التخمين"],
        correctIdx: 0,
        difficulty: "متوسط",
        explanation: "الفهم ثم التطبيق يثبت المعلومة أفضل من الحفظ وحده."
      },
      {
        text: `عند الخطأ في سؤال من درس «${lesson}»، ماذا تفعل؟`,
        options: ["أحدد سبب الخطأ وأحل مثالًا مشابهًا", "أتجاهل الخطأ", "أحذف السؤال", "أحفظ الإجابة فقط"],
        correctIdx: 0,
        difficulty: "صعب",
        explanation: "تحليل سبب الخطأ يمنع تكراره."
      },
      {
        text: `أي اختيار يدل على مذاكرة صحيحة لدرس «${lesson}»؟`,
        options: ["تلخيص الفكرة الأساسية وتطبيقها", "قراءة العنوان فقط", "حل بدون تصحيح", "اختيار الإجابة الأسرع"],
        correctIdx: 0,
        difficulty: "متوسط",
        explanation: "التلخيص والتطبيق هما أفضل طريقة للمراجعة."
      }
    ];
  }

  return Array.from({ length: count }).map((_, i) => {
    const base = pool[i % pool.length];
    return {
      id: `lesson_fallback_${i + 1}`,
      text: base.text,
      options: base.options,
      correctIdx: base.correctIdx,
      difficulty: base.difficulty || ["سهل", "متوسط", "صعب", "صعب جدًا"][i % 4],
      branch: lesson,
      explanation: base.explanation
    };
  });
}

function normalizeExam(exam, body = {}) {
  const topic = getRequestedLesson(body);
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
أنت معلم لغة عربية مصري خبير بالمنهج.
أنشئ ${count} سؤال اختيار من متعدد عن هذا الدرس تحديدًا، وليس أسئلة عامة.

المرحلة: ${grade}
الدرس المطلوب: ${topic}
الفرع: ${branch}
الصعوبة: ${body.difficulty || "متوسط"}

لو الدرس هو "اسم التفضيل"، يجب أن تكون الأسئلة عن:
- تعريف اسم التفضيل
- وزنه أفعل
- شروط صياغته
- حالاته
- المفضل والمفضل عليه
- إعرابه في الجملة
- صياغته بطريقة مباشرة وغير مباشرة

ممنوع تمامًا:
- أسئلة عن "طريقة المذاكرة"
- أسئلة عامة مثل "ما أفضل خطوة؟"
- اختيارات وهمية مثل: اختيار أ، اختيار ب
- سؤال لا يخص الدرس

أعد JSON فقط:
{
  "questions": [
    {
      "id": "q1",
      "text": "نص سؤال من الدرس نفسه",
      "options": ["اختيار حقيقي 1", "اختيار حقيقي 2", "اختيار حقيقي 3", "اختيار حقيقي 4"],
      "correctIdx": 0,
      "difficulty": "متوسط",
      "branch": "${topic}",
      "explanation": "شرح سبب الإجابة"
    }
  ]
}
`;
  }

  if (body.mode === "generate_exam") {
    const topic = getRequestedLesson(body);
    const grade = body.grade || "غير محدد";
    return `
أنت معلم لغة عربية مصري خبير بالمنهج.
أنشئ امتحان اختيار من متعدد حقيقي من 15 إلى 20 سؤال عن الدرس المطلوب فقط.

المرحلة الدراسية: ${grade}
الدرس / الفرع المطلوب: ${topic}

لو الدرس هو "اسم التفضيل"، يجب أن تكون الأسئلة عن:
- وزن اسم التفضيل
- استخراجه من الجملة
- شروط صياغته
- حالاته: مجرد من أل والإضافة، مقترن بأل، مضاف
- المفضل والمفضل عليه
- صياغة التفضيل من فعل مستوفٍ وغير مستوفٍ للشروط
- إعرابه حسب موقعه في الجملة

ممنوع تمامًا:
- أسئلة عامة عن المذاكرة أو طريقة الحل
- أسئلة مثل: "أي خطوة تساعدك؟"
- اختيارات وهمية مثل: اختيار أ / اختيار ب
- أي سؤال لا يخص الدرس

أعد JSON فقط:
{
  "exam": {
    "title": "امتحان ${topic}",
    "questions": [
      {
        "id": "q1",
        "text": "سؤال حقيقي من درس ${topic}",
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
          const questions = raw.map((q, i) => normalizeQuestion(q, i, getRequestedLesson(body))).filter(isValidQuestion);
          if (questions.length < 3) throw new Error("Gemini returned generic or invalid questions");
          return send(res, 200, { ok: true, provider: "gemini", model, analysis: { questions }, data: { questions } });
        }

        if (body.mode === "generate_exam") {
          const rawExam = json?.exam || json;
          const exam = normalizeExam(rawExam, body);
          if (exam.questions.length < 5) throw new Error("Gemini returned generic or invalid exam questions");
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
    const questions = lessonFallbackQuestions(body);
    return send(res, 200, {
      ok: true,
      provider: "lesson-fallback",
      model: "local-lesson-fallback",
      warning: "Gemini لم يرجع أسئلة مناسبة للدرس، فتم استخدام أسئلة احتياطية مرتبطة بالدرس.",
      analysis: { questions },
      data: { questions },
      errors
    });
  }

  if (body.mode === "generate_exam") {
    const questions = lessonFallbackQuestions(body);
    const exam = { title: `امتحان ${getRequestedLesson(body)}`, questions };
    return send(res, 200, {
      ok: true,
      provider: "lesson-fallback",
      model: "local-lesson-fallback",
      warning: "Gemini لم يرجع أسئلة مناسبة للدرس، فتم استخدام امتحان احتياطي مرتبط بالدرس.",
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
