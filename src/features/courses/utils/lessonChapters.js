// Lesson parts pasted by the admin the same way YouTube descriptions list chapters:
//   0:00 المقدمة
//   6:20 أركان التشبيه
//   1:02:15 تدريبات
const TIME_RE = /^\s*[[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]?\s*[-–—:.]?\s*(.+?)\s*$/;

const toSeconds = (stamp) => stamp.split(':').map(Number).reduce((total, part) => total * 60 + part, 0);

export function parseLessonChapters(text = '') {
  const rows = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/[‎‏]/g, '').match(TIME_RE))
    .filter(Boolean)
    .map(([, stamp, title]) => ({ start: toSeconds(stamp), title: title.trim() }))
    .filter((row) => Number.isFinite(row.start) && row.title);
  const unique = [...new Map(rows.map((row) => [row.start, row])).values()].sort((a, b) => a.start - b.start);
  return unique.slice(0, 40);
}

export const formatClock = (seconds = 0) => {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

// Each part ends where the next one starts (the last ends with the video).
export function chapterProgress(chapters = [], watchedSeconds = 0, duration = 0) {
  return chapters.map((chapter, i) => {
    const end = chapters[i + 1]?.start ?? (duration || chapter.start);
    const length = Math.max(1, end - chapter.start);
    const watched = Math.max(0, Math.min(length, watchedSeconds - chapter.start));
    return { ...chapter, end, length, percent: Math.round((watched / length) * 100), done: watchedSeconds >= end - 2 };
  });
}
