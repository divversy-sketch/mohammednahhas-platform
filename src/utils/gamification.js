// src/utils/gamification.js
// نظام نقاط وشارات بسيط وآمن — بدون أي ربط خارجي.

export function calculateStudentXP({ results = [], mistakes = [], videoViews = [] } = {}) {
  const safeResults = Array.isArray(results) ? results : [];
  const safeMistakes = Array.isArray(mistakes) ? mistakes : [];
  const safeVideoViews = Array.isArray(videoViews) ? videoViews : [];

  const completed = safeResults.filter((r) => r.status === "completed");

  const examsXP = completed.length * 50;

  const performanceXP = completed.reduce((sum, result) => {
    const percentage = Number(result.percentage || 0);
    return sum + Math.max(0, Math.min(100, percentage));
  }, 0);

  const videosXP = safeVideoViews.length * 15;
  const mistakesXP = safeMistakes.filter((m) => m.mastered).length * 25;

  return examsXP + performanceXP + videosXP + mistakesXP;
}

export function getLevelFromXP(xp = 0) {
  const safeXP = Math.max(0, Number(xp || 0));
  const level = Math.floor(safeXP / 500) + 1;
  const currentLevelXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const progress = Math.round(((safeXP - currentLevelXP) / 500) * 100);

  return {
    xp: safeXP,
    level,
    currentLevelXP,
    nextLevelXP,
    progress: Math.max(0, Math.min(100, progress))
  };
}

export function getStudentBadges({ results = [], mistakes = [] } = {}) {
  const safeResults = Array.isArray(results) ? results : [];
  const safeMistakes = Array.isArray(mistakes) ? mistakes : [];

  const completed = safeResults.filter((r) => r.status === "completed");
  const avg =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, r) => sum + Number(r.percentage || 0), 0) /
            completed.length
        )
      : 0;

  const badges = [];

  if (completed.length >= 1) {
    badges.push({
      id: "first_exam",
      icon: "🎯",
      title: "أول امتحان",
      description: "بدأت التدريب داخل المنصة."
    });
  }

  if (completed.length >= 5) {
    badges.push({
      id: "five_exams",
      icon: "🔥",
      title: "مجتهد",
      description: "حللت 5 امتحانات."
    });
  }

  if (completed.length >= 10) {
    badges.push({
      id: "ten_exams",
      icon: "🏆",
      title: "بطل التدريب",
      description: "حللت 10 امتحانات."
    });
  }

  if (avg >= 80) {
    badges.push({
      id: "high_average",
      icon: "⭐",
      title: "مستوى ممتاز",
      description: "متوسطك أعلى من 80%."
    });
  }

  if (safeMistakes.length >= 10) {
    badges.push({
      id: "mistake_reviewer",
      icon: "🧠",
      title: "مراجع قوي",
      description: "عندك بنك أخطاء واضح تقدر تتعلم منه."
    });
  }

  return badges;
}

export function buildGamificationProfile(input = {}) {
  const xp = calculateStudentXP(input);
  const level = getLevelFromXP(xp);
  const badges = getStudentBadges(input);

  return {
    ...level,
    badges
  };
}
