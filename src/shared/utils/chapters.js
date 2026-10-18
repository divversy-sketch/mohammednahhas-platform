// أجزاء المحاضرة: the admin writes one line per part, e.g.
//   00:00 مقدمة
//   2:00 أنواع التشبيه
//   دقيقة 7 التشبيه المفصل
//   1:05:30 مراجعة نهائية
// Arabic digits work too. Stored on the content as [{ time: seconds, title }].

const AR = '٠١٢٣٤٥٦٧٨٩';
const toLatin = (s) => String(s || '').replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));

export function parseChapters(text) {
  const out = [];
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = toLatin(raw).trim();
    if (!line) return;
    let time = null; let title = '';
    let m = line.match(/^(\d{1,2}):(\d{1,2}):(\d{2})\s*[-–—.:)]?\s*(.*)$/);
    if (m) { time = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]); title = m[4]; }
    if (time === null) { m = line.match(/^(\d{1,3}):(\d{2})\s*[-–—.:)]?\s*(.*)$/); if (m) { time = (+m[1]) * 60 + (+m[2]); title = m[3]; } }
    if (time === null) { m = line.match(/^(?:الدقيقة|دقيقة|د)\s*(\d{1,3})(?::(\d{2}))?\s*[-–—.:)]?\s*(.*)$/); if (m) { time = (+m[1]) * 60 + (+(m[2] || 0)); title = m[3]; } }
    if (time === null) { m = line.match(/^(.*?)\s*[-–—(]?\s*(?:الدقيقة|دقيقة|د)\s*(\d{1,3})(?::(\d{2}))?\)?$/); if (m && m[1]) { time = (+m[2]) * 60 + (+(m[3] || 0)); title = m[1]; } }
    if (time === null) return;
    out.push({ time, title: (title || '').trim() || `الجزء ${out.length + 1}` });
  });
  const seen = new Set();
  return out.sort((a, b) => a.time - b.time).filter((c) => (seen.has(c.time) ? false : seen.add(c.time)));
}

export function chaptersToText(chapters = []) {
  return (chapters || []).map((c) => `${formatClock(c.time)} ${c.title}`).join('\n');
}

export function formatClock(sec = 0) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

/** The video's parts with start/end, or equal parts when the admin didn't write any. */
export function videoParts(video, duration) {
  const list = Array.isArray(video?.chapters) && video.chapters.length ? video.chapters : parseChapters(video?.chaptersText);
  const d = Number(duration) || 0;
  if (list.length) {
    const sorted = [...list].sort((a, b) => a.time - b.time);
    if (sorted[0].time > 0) sorted.unshift({ time: 0, title: 'البداية' });
    return sorted.map((c, i) => ({ ...c, start: c.time, end: i < sorted.length - 1 ? sorted[i + 1].time : Math.max(d, c.time + 1), auto: false }));
  }
  if (!d) return [];
  const n = d > 3600 ? 8 : d > 1500 ? 6 : d > 600 ? 4 : 2;
  return Array.from({ length: n }, (_, i) => ({ time: (d / n) * i, start: (d / n) * i, end: (d / n) * (i + 1), title: `الجزء ${i + 1}`, auto: true }));
}
