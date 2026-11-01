// تقرير نتيجة الامتحان (PDF): صفحة A4 بتتطبع كـ PDF حقيقي (الحروف العربي سليمة، مش صورة).
// - على المتصفح: نافذة الطباعة ← «حفظ كـ PDF».
// - جوه تطبيق الأندرويد: شاشة الطباعة بتاعة أندرويد ← «حفظ بتنسيق PDF» (ReportPrintPlugin).
// - APK قديم من غير الإضافة: التقرير بيتعرض على الشاشة.
import { Capacitor, registerPlugin } from '@capacitor/core';
import logoUrl from '@assets/nahhas-brand-mark.png';

const ReportPrint = registerPlugin('ReportPrint');
const ar = (n) => Number(n || 0).toLocaleString('ar-EG');
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ms = (v) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : v ? new Date(v).getTime() || 0 : 0);
const clean = (t) => esc(String(t || '').replace(/\|/g, '\n')).replace(/\n/g, '<br>').replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
const dur = (secs) => { const s = Math.max(0, Math.round(Number(secs) || 0)); const m = Math.floor(s / 60); return m ? `${ar(m)} دقيقة${s % 60 ? ` و${ar(s % 60)} ثانية` : ''}` : `${ar(s)} ثانية`; };

const ICON = {
  user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  exam: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  minus: '<path d="M5 12h14"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  grade: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
};
const ico = (name, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ''}</svg>`;

const LEVELS = [
  { min: 85, label: 'ممتاز', color: '#059669', soft: '#D1FAE5' },
  { min: 75, label: 'جيد جدًا', color: '#16A34A', soft: '#DCFCE7' },
  { min: 65, label: 'جيد', color: '#2563EB', soft: '#DBEAFE' },
  { min: 50, label: 'مقبول', color: '#D97706', soft: '#FEF3C7' },
  { min: 0, label: 'محتاج متابعة', color: '#DC2626', soft: '#FEE2E2' },
];
const levelOf = (p) => LEVELS.find((l) => p >= l.min);

let logoData = null;
async function logoDataUrl() {
  if (logoData) return logoData;
  try {
    const blob = await (await fetch(logoUrl)).blob();
    logoData = await new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => resolve(''); r.readAsDataURL(blob); });
  } catch { logoData = ''; }
  return logoData;
}

const answered = (v) => v !== undefined && v !== null && v !== '' && !(typeof v === 'object' && !v?.text && !v?.image);

/** الأرقام اللي التقرير مبني عليها */
export function examReportModel(data = {}) {
  const questions = (data.questions || []).map((q) => ({ ...q, branch: q.branch || 'عام' }));
  const answers = data.answers || {};
  const mcq = questions.filter((q) => q.type !== 'essay');
  const essays = questions.filter((q) => q.type === 'essay');
  let correct = 0; let wrong = 0; let blank = 0;
  const branches = new Map();
  mcq.forEach((q) => {
    const a = answers[q.id];
    const b = branches.get(q.branch) || { name: q.branch, correct: 0, total: 0, wrong: 0, blank: 0 };
    b.total += 1;
    if (!answered(a)) { blank += 1; b.blank += 1; } else if (a === q.correctIdx) { correct += 1; b.correct += 1; } else { wrong += 1; b.wrong += 1; }
    branches.set(q.branch, b);
  });
  const essayAnswered = essays.filter((q) => answered(answers[q.id])).length;
  const total = Number(data.total) || mcq.length;
  const score = Number.isFinite(Number(data.score)) ? Number(data.score) : correct;
  const pct = Number.isFinite(Number(data.percentage)) && data.percentage !== null ? Math.round(Number(data.percentage)) : (total ? Math.round((score / total) * 100) : 0);
  const branchList = [...branches.values()].map((b) => ({ ...b, pct: b.total ? Math.round((b.correct / b.total) * 100) : 0 })).sort((a, b) => b.pct - a.pct);

  const tips = [];
  const weak = branchList.filter((b) => b.pct < 70).sort((a, b) => a.pct - b.pct).slice(0, 2);
  weak.forEach((b) => tips.push({ icon: 'target', tone: 'bad', text: `راجع «${b.name}»: جاوبت صح ${ar(b.correct)} من ${ar(b.total)} (${ar(b.pct)}٪). ابدأ بأخطائك فيه من بنك الأخطاء.` }));
  const strong = branchList.find((b) => b.pct >= 85 && b.total >= 2);
  if (strong) tips.push({ icon: 'trophy', tone: 'ok', text: `مستواك ممتاز في «${strong.name}» (${ar(strong.pct)}٪). حافظ عليه.` });
  if (blank > 0) tips.push({ icon: 'minus', tone: 'warn', text: `سبت ${ar(blank)} ${blank === 1 ? 'سؤال' : 'أسئلة'} من غير إجابة. حتى لو مش متأكد، جاوب: مفيش درجة بتتخصم على الغلط.` });
  const durationSecs = Number(data.totalTime || data.duration || 0) * 60;
  if (durationSecs && data.timeTaken && data.timeTaken < durationSecs * 0.35 && pct < 65) tips.push({ icon: 'clock', tone: 'warn', text: `خلصت في ${dur(data.timeTaken)} بس من ${dur(durationSecs)}. خد وقتك في قراءة الأسئلة وراجع قبل ما تسلّم.` });
  if (!tips.length) tips.push({ icon: 'bulb', tone: 'ok', text: pct >= 85 ? 'أداء ممتاز. كمّل بنفس المذاكرة، وحل امتحانات إضافية عشان تثبّت مستواك.' : 'كمّل مذاكرة منتظمة، وحل امتحانات تدريبية على الفروع اللي محتاجة تقوية.' });

  return { questions, answers, mcq, essays, correct, wrong, blank, essayAnswered, total, score, pct, level: levelOf(pct), branches: branchList, tips };
}

function gauge(pct, color) {
  const r = 52; const c = 2 * Math.PI * r; const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<svg class="gauge" viewBox="0 0 128 128" width="150" height="150">
    <circle cx="64" cy="64" r="${r}" fill="none" stroke="#EFE8E1" stroke-width="13"/>
    <circle cx="64" cy="64" r="${r}" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 64 64)"/>
    <text x="64" y="62" text-anchor="middle" font-size="30" font-weight="800" fill="#1F1B18">${ar(pct)}٪</text>
    <text x="64" y="84" text-anchor="middle" font-size="12" fill="#8A7F75">النسبة</text>
  </svg>`;
}

/** HTML التقرير كامل */
export async function buildExamReportHtml(data = {}, { audience = 'student' } = {}) {
  const m = examReportModel(data);
  const logo = await logoDataUrl();
  const now = new Date();
  const submitted = ms(data.submittedAt) || now.getTime();
  const lv = m.level;
  const cheated = data.status === 'cheated';
  const passed = !cheated && m.pct >= 50;
  const mcqN = m.mcq.length || 1;
  const bar = (n, color) => (n ? `<i style="width:${(n / mcqN) * 100}%;background:${color}"></i>` : '');

  const branchRows = m.branches.map((b) => {
    const l = levelOf(b.pct);
    return `<div class="br"><span class="br-n">${esc(b.name)}</span><span class="br-bar"><i style="width:${Math.max(3, b.pct)}%;background:${l.color}"></i></span><b style="color:${l.color}">${ar(b.pct)}٪</b><small>${ar(b.correct)} من ${ar(b.total)}</small></div>`;
  }).join('');

  const qCards = m.questions.map((q, i) => {
    const a = m.answers[q.id];
    if (q.type === 'essay') {
      const text = typeof a === 'object' ? a?.text : a;
      const img = typeof a === 'object' ? a?.image : null;
      const sc = data.essayScores?.[q.id]; const mx = data.essayMaxScores?.[q.id];
      return `<div class="q essay"><div class="q-h"><em>${ar(i + 1)}</em><span class="chip">${esc(q.branch)}</span><span class="chip blue">${ico('pen', 11)} مقالي</span>${sc !== undefined ? `<span class="st blue">${ar(sc)} / ${ar(mx ?? '')}</span>` : `<span class="st gray">${answered(a) ? 'مستني التصحيح' : 'ما اتجاوبش'}</span>`}</div>
        <p class="q-t">${clean(q.text)}</p>
        <div class="ans"><b>إجابتك:</b> ${text ? clean(text) : (img ? 'صورة' : '<span class="muted">ما اتجاوبش</span>')}</div>
        ${img ? `<img class="ans-img" src="${esc(img)}" alt="">` : ''}
        ${q.modelAnswer ? `<div class="ans model"><b>الإجابة النموذجية:</b> ${clean(q.modelAnswer)}</div>` : ''}</div>`;
    }
    const isBlank = !answered(a); const ok = !isBlank && a === q.correctIdx;
    const st = isBlank ? '<span class="st gray">' + ico('minus', 11) + ' متروك</span>' : ok ? '<span class="st green">' + ico('check', 11) + ' صح</span>' : '<span class="st red">' + ico('x', 11) + ' غلط</span>';
    const opts = (q.options || []).map((o, k) => {
      const cls = k === q.correctIdx ? 'opt right' : k === a ? 'opt wrong' : 'opt';
      const mark = k === q.correctIdx ? ico('check', 11) : k === a ? ico('x', 11) : '';
      return `<span class="${cls}">${mark}${esc(o)}</span>`;
    }).join('');
    return `<div class="q ${ok ? 'ok' : isBlank ? 'blank' : 'bad'}"><div class="q-h"><em>${ar(i + 1)}</em><span class="chip">${esc(q.branch)}</span>${st}</div><p class="q-t">${clean(q.text)}</p><div class="opts">${opts}</div></div>`;
  }).join('');

  const tips = m.tips.map((t) => `<li class="${t.tone}"><i>${ico(t.icon, 15)}</i><span>${esc(t.text)}</span></li>`).join('');
  const security = audience === 'admin' && (Number(data.antiCheatWarnings) || cheated)
    ? `<div class="sec">${ico('shield', 14)} ${cheated ? 'الامتحان اتقفل كمحاولة غش' : `${ar(data.antiCheatWarnings)} تنبيه أمان أثناء الامتحان`}</div>` : '';

  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير ${esc(data.studentName || '')} - ${esc(data.examTitle || '')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:11mm 10mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:'Almarai','Noto Sans Arabic','Noto Naskh Arabic','Segoe UI',Tahoma,sans-serif;color:#1F1B18;font-size:12.5px;line-height:1.65;background:#fff}
.page{max-width:190mm;margin:0 auto}
.head{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;color:#fff;background:linear-gradient(120deg,#7C2D12,#C2410C 55%,#E8A33D)}
.head img{width:46px;height:46px;border-radius:12px;background:#fff;padding:4px}
.head h1{margin:0;font-size:19px;font-weight:800}.head p{margin:0;font-size:11.5px;opacity:.9}
.head .sp{flex:1}.head .meta{text-align:left;font-size:11px;opacity:.95}.head .meta b{display:block;font-size:13px}
.info{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
.info div{display:flex;gap:8px;align-items:center;padding:9px 10px;border:1px solid #EFE6DD;border-radius:12px;background:#FCFAF8}
.info i{color:#C2410C;display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#FDEBDC;flex:none}
.info small{display:block;color:#8A7F75;font-size:10.5px}.info b{display:block;font-size:12.5px;word-break:break-word}
.hero{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;padding:14px 16px;border:1px solid #EFE6DD;border-radius:16px;page-break-inside:avoid}
.hero .score{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.hero .score b{font-size:34px;font-weight:800}.hero .score small{font-size:15px;color:#8A7F75}
.lvl{display:inline-flex;align-items:center;gap:5px;padding:3px 12px;border-radius:999px;font-weight:800;font-size:12.5px}
.pf{display:inline-flex;margin-inline-start:6px;padding:3px 10px;border-radius:999px;font-weight:800;font-size:12px}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.tile{padding:8px 10px;border-radius:12px;display:flex;gap:8px;align-items:center}
.tile i{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:#fff;flex:none}
.tile b{font-size:18px;font-weight:800;display:block;line-height:1.2}.tile small{font-size:10.5px;color:#6B6159}
.stack{display:flex;height:9px;border-radius:9px;overflow:hidden;background:#EFE8E1;margin-top:10px}.stack i{display:block;height:100%}
.legend{display:flex;gap:12px;margin-top:5px;font-size:10.5px;color:#6B6159}.legend span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:2px;margin-inline-end:4px;background:var(--c)}
.grid2{display:grid;grid-template-columns:1.15fr 1fr;gap:10px;margin-top:12px;page-break-inside:avoid}
.card{border:1px solid #EFE6DD;border-radius:16px;padding:12px 14px}
.card h3{display:flex;align-items:center;gap:6px;margin:0 0 10px;font-size:13.5px;font-weight:800}.card h3 i{color:#C2410C;display:flex}
.br{display:grid;grid-template-columns:92px 1fr 40px 54px;align-items:center;gap:8px;margin-bottom:7px;font-size:11.5px}
.br-n{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.br-bar{height:9px;border-radius:9px;background:#EFE8E1;overflow:hidden}.br-bar i{display:block;height:100%;border-radius:9px}
.br b{text-align:left;font-size:12px}.br small{color:#8A7F75;font-size:10.5px}
.tips{list-style:none;margin:0;padding:0;display:grid;gap:7px}.tips li{display:flex;gap:8px;align-items:flex-start;font-size:11.5px;line-height:1.7}
.tips li i{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;flex:none}
.tips li.bad i{background:#FEE2E2;color:#DC2626}.tips li.ok i{background:#D1FAE5;color:#059669}.tips li.warn i{background:#FEF3C7;color:#B45309}
.sec{margin-top:10px;display:inline-flex;gap:6px;align-items:center;padding:6px 12px;border-radius:10px;background:#FEF3C7;color:#92400E;font-weight:700;font-size:11.5px}
h2.sect{display:flex;align-items:center;gap:7px;margin:18px 0 8px;font-size:15px;font-weight:800;page-break-after:avoid}h2.sect i{color:#C2410C;display:flex}
.q{border:1px solid #EFE6DD;border-inline-start:4px solid #CFC5BB;border-radius:12px;padding:9px 12px;margin-bottom:7px;page-break-inside:avoid}
.q.ok{border-inline-start-color:#10B981}.q.bad{border-inline-start-color:#EF4444}.q.blank{border-inline-start-color:#A8A29E}.q.essay{border-inline-start-color:#3B82F6}
.q-h{display:flex;align-items:center;gap:6px;margin-bottom:4px}.q-h em{font-style:normal;display:grid;place-items:center;min-width:22px;height:22px;border-radius:7px;background:#1F1B18;color:#fff;font-size:11px;font-weight:800}
.chip{padding:1px 8px;border-radius:999px;background:#F3EEE9;color:#6B6159;font-size:10.5px;display:inline-flex;gap:3px;align-items:center}.chip.blue{background:#DBEAFE;color:#1D4ED8}
.st{margin-inline-start:auto;display:inline-flex;align-items:center;gap:3px;padding:1px 9px;border-radius:999px;font-size:11px;font-weight:800}
.st.green{background:#D1FAE5;color:#047857}.st.red{background:#FEE2E2;color:#B91C1C}.st.gray{background:#F3EEE9;color:#78716C}.st.blue{background:#DBEAFE;color:#1D4ED8}
.q-t{margin:0 0 6px;font-weight:700;font-size:12.5px}mark{background:#FEF08A;padding:0 2px;border-radius:3px}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:4px}.opt{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:8px;background:#F8F5F2;font-size:11.5px}
.opt.right{background:#D1FAE5;color:#065F46;font-weight:800}.opt.wrong{background:#FEE2E2;color:#991B1B;font-weight:800;text-decoration:line-through}
.ans{font-size:11.5px;padding:6px 9px;border-radius:8px;background:#F8F5F2;margin-top:4px}.ans.model{background:#EFF6FF;color:#1E3A8A}.muted{color:#A8A29E}
.ans-img{display:block;max-width:60%;max-height:200px;margin-top:6px;border-radius:8px;border:1px solid #EFE6DD}
.foot{margin-top:16px;padding-top:10px;border-top:1px dashed #E2D8CE;display:flex;justify-content:space-between;color:#8A7F75;font-size:10.5px}
@media screen{body{background:#F4F1EE;padding:16px}.page{background:#fff;padding:14px;border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.08)}}
</style></head><body><div class="page">
<div class="head">${logo ? `<img src="${logo}" alt="">` : ''}<div><h1>تقرير نتيجة امتحان</h1><p>منصة النحاس التعليمية</p></div><span class="sp"></span><div class="meta"><b>${esc(new Date(submitted).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }))}</b>${esc(new Date(submitted).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' }))}</div></div>

<div class="info">
  <div><i>${ico('user')}</i><span><small>الطالب</small><b>${esc(data.studentName || 'طالب')}</b></span></div>
  <div><i>${ico('exam')}</i><span><small>الامتحان</small><b>${esc(data.examTitle || 'امتحان')}</b></span></div>
  <div><i>${ico('grade')}</i><span><small>الأسئلة</small><b>${ar(m.questions.length)} سؤال${m.essays.length ? ` (${ar(m.essays.length)} مقالي)` : ''}</b></span></div>
  <div><i>${ico('clock')}</i><span><small>وقت الحل</small><b>${data.timeTaken ? esc(dur(data.timeTaken)) : '—'}</b></span></div>
</div>

<div class="hero">
  ${gauge(cheated ? 0 : m.pct, lv.color)}
  <div>
    <div class="score"><b>${ar(m.score)}</b><small>من ${ar(m.total)}</small>
      <span class="lvl" style="background:${lv.soft};color:${lv.color}">${ico('trophy', 13)} ${cheated ? 'اتلغى' : lv.label}</span>
      <span class="pf" style="background:${cheated ? '#FEE2E2' : passed ? '#D1FAE5' : '#FEE2E2'};color:${cheated ? '#991B1B' : passed ? '#065F46' : '#991B1B'}">${cheated ? 'اتقفل (غش)' : passed ? 'ناجح' : 'محتاج يعيد المذاكرة'}</span></div>
    <div class="tiles">
      <div class="tile" style="background:#ECFDF5"><i style="background:#10B981">${ico('check', 14)}</i><span><b>${ar(m.correct)}</b><small>إجابة صح</small></span></div>
      <div class="tile" style="background:#FEF2F2"><i style="background:#EF4444">${ico('x', 14)}</i><span><b>${ar(m.wrong)}</b><small>إجابة غلط</small></span></div>
      <div class="tile" style="background:#F5F5F4"><i style="background:#A8A29E">${ico('minus', 14)}</i><span><b>${ar(m.blank)}</b><small>من غير إجابة</small></span></div>
      <div class="tile" style="background:#EFF6FF"><i style="background:#3B82F6">${ico('pen', 14)}</i><span><b>${ar(m.essayAnswered)}<small> / ${ar(m.essays.length)}</small></b><small>مقالي متجاوب</small></span></div>
    </div>
    ${m.mcq.length ? `<div class="stack">${bar(m.correct, '#10B981')}${bar(m.wrong, '#EF4444')}${bar(m.blank, '#D6D3D1')}</div><div class="legend"><span style="--c:#10B981">صح</span><span style="--c:#EF4444">غلط</span><span style="--c:#D6D3D1">متروك</span></div>` : ''}
    ${security}
  </div>
</div>

<div class="grid2">
  <div class="card"><h3><i>${ico('chart')}</i>المستوى في كل فرع</h3>${branchRows || '<p class="muted">مفيش أسئلة اختياري.</p>'}</div>
  <div class="card"><h3><i>${ico('bulb')}</i>نصايح للمرة الجاية</h3><ul class="tips">${tips}</ul></div>
</div>

${m.questions.length ? `<h2 class="sect"><i>${ico('exam', 17)}</i>الإجابات بالتفصيل</h2>${qCards}` : ''}

<div class="foot"><span>التقرير اتعمل من منصة النحاس التعليمية</span><span>${esc(now.toLocaleString('ar-EG'))}</span></div>
</div></body></html>`;
}

function showOnScreen(html) {
  const wrap = document.createElement('div');
  wrap.setAttribute('dir', 'rtl');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.6);display:flex;flex-direction:column';
  wrap.innerHTML = `<div style="display:flex;gap:8px;align-items:center;padding:10px 12px;padding-top:calc(env(safe-area-inset-top,0px) + 10px);background:#16110E;color:#fff;font-family:Almarai,sans-serif">
    <b style="flex:1">تقرير الامتحان</b><small style="opacity:.75">حدّث التطبيق عشان تحفظه PDF</small>
    <button type="button" style="min-height:40px;padding:0 16px;border:0;border-radius:10px;background:#D97706;color:#fff;font:inherit;font-weight:800">إغلاق</button></div>`;
  const frame = document.createElement('iframe');
  frame.style.cssText = 'flex:1;border:0;background:#F4F1EE';
  frame.srcdoc = html;
  wrap.appendChild(frame);
  wrap.querySelector('button').onclick = () => wrap.remove();
  document.body.appendChild(wrap);
}

function printInBrowser(html) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px;bottom:0';
  frame.srcdoc = html;
  document.body.appendChild(frame);
  frame.onload = async () => {
    const w = frame.contentWindow;
    try {
      await Promise.race([w.document.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]);
      await Promise.all([...w.document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; setTimeout(r, 3000); }))));
    } catch { /* ignore */ }
    w.focus();
    w.print();
    setTimeout(() => frame.remove(), 60000);
  };
}

/** افتح التقرير للطباعة/الحفظ PDF */
export async function openExamReport(data, { audience = 'student' } = {}) {
  const html = await buildExamReportHtml(data, { audience });
  const name = `تقرير ${data.studentName || ''} - ${data.examTitle || 'امتحان'}`.trim();
  let native = false;
  try { native = Capacitor.isNativePlatform(); } catch { /* web */ }
  if (native) {
    if (Capacitor.isPluginAvailable('ReportPrint')) {
      try { await ReportPrint.print({ html, name }); return; } catch { /* يعرضه على الشاشة */ }
    }
    showOnScreen(html);
    return;
  }
  printInBrowser(html);
}
