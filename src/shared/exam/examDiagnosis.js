// تحليل محاولة امتحان من الأحداث اللي اتسجلت (examTracker.js):
// ليه الطالب خرج وما كمّلش؟ وقف عند أنهي سؤال؟ النت؟ قفل التطبيق؟ البطارية؟ التسليم فشل؟
// بيستخدمه «مراقبة الامتحانات لايف» و«النتائج».

const ar = (n) => Number(n || 0).toLocaleString('ar-EG');
export const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (v.toMillis) return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  const d = new Date(v).getTime();
  return Number.isFinite(d) ? d : 0;
};
export const dur = (secs) => {
  const s = Math.max(0, Math.round(Number(secs) || 0));
  if (s < 60) return `${ar(s)} ث`;
  const m = Math.floor(s / 60); const r = s % 60;
  if (m < 60) return r ? `${ar(m)} د ${ar(r)} ث` : `${ar(m)} د`;
  return `${ar(Math.floor(m / 60))} س ${ar(m % 60)} د`;
};

const REASONS = {
  tab_switch: 'خرج لتبويب تاني', app_switch: 'خرج لتطبيق تاني', left_exam_and_closed_app: 'خرج وقفل التطبيق',
  app_unpinned: 'فك تثبيت الشاشة', focus_or_visibility_lost: 'ساب شاشة الامتحان', right_click_attempt: 'كليك يمين',
  paste_attempt: 'حاول يلصق', copy_or_cut_attempt: 'حاول ينسخ', blocked_keyboard_shortcut: 'اختصار كيبورد ممنوع', fullscreen_exit: 'خرج من ملء الشاشة',
};
export const reasonLabel = (r) => REASONS[r] || r || '';

/** شكل كل حدث في الخط الزمني */
export const EVENT_VIEW = {
  open: { icon: 'play', tone: 'info', text: (e) => `فتح الامتحان${e.n ? ` (${ar(e.n)} سؤال)` : ''}${e.left ? ` · فاضل ${dur(e.left)}` : ''}${e.locked ? ' · الشاشة متثبتة' : ''}` },
  resume: { icon: 'refresh', tone: 'warn', text: () => 'التطبيق اتقفل ورجع للامتحان' },
  q: { icon: 'fileText', tone: 'mute', text: (e) => `راح لسؤال ${ar(e.i)}${e.spent ? ` (قعد ${dur(e.spent)} على سؤال ${ar(e.from)})` : ''}` },
  ans: { icon: 'check', tone: 'ok', text: (e) => (e.kind === 'change' ? `غيّر إجابة سؤال ${ar(e.i)}` : e.kind === 'clear' ? `مسح إجابة سؤال ${ar(e.i)}` : e.img ? `صوّر إجابة سؤال ${ar(e.i)}` : `جاوب سؤال ${ar(e.i)}`) },
  flag: { icon: 'flag', tone: 'mute', text: (e) => (e.on ? `علّم سؤال ${ar(e.i)} للمراجعة` : `شال علامة سؤال ${ar(e.i)}`) },
  hide: { icon: 'logout', tone: 'warn', text: () => 'ساب شاشة الامتحان' },
  show: { icon: 'eye', tone: 'info', text: (e) => `رجع للامتحان${e.secs ? ` بعد ${dur(e.secs)}` : ''}` },
  blur: { icon: 'alert', tone: 'mute', text: () => 'ضغط برّه صفحة الامتحان' },
  offline: { icon: 'wifiOff', tone: 'bad', text: () => 'النت فصل' },
  online: { icon: 'live', tone: 'ok', text: (e) => `النت رجع${e.secs ? ` بعد ${dur(e.secs)}` : ''}` },
  screen_off: { icon: 'moon', tone: 'mute', text: (e) => `قفل شاشة الموبايل${e.secs ? ` ${dur(e.secs)}` : ''} (مش غش)` },
  unpin: { icon: 'lock', tone: 'bad', text: () => 'فك تثبيت الشاشة' },
  warn: { icon: 'alert', tone: 'warn', text: (e) => `تنبيه أمان ${ar(e.n)}: ${reasonLabel(e.reason)}` },
  hold: { icon: 'shield', tone: 'bad', text: (e) => `الامتحان اتوقف (${reasonLabel(e.reason)})` },
  cheated: { icon: 'alert', tone: 'bad', text: (e) => `اتقفل كغش: ${reasonLabel(e.reason)}` },
  battery_low: { icon: 'alert', tone: 'warn', text: (e) => `البطارية قربت تخلص (${ar(e.level)}٪)` },
  error: { icon: 'alert', tone: 'bad', text: (e) => `حصل خطأ في الصفحة: ${e.msg || ''}` },
  upload_fail: { icon: 'alert', tone: 'warn', text: () => 'رفع صورة الإجابة فشل' },
  time_5: { icon: 'clock', tone: 'warn', text: () => 'فاضل ٥ دقايق' },
  time_1: { icon: 'clock', tone: 'warn', text: () => 'فاضل دقيقة' },
  time_up: { icon: 'clock', tone: 'bad', text: () => 'الوقت خلص' },
  submit_open: { icon: 'checkCircle', tone: 'info', text: (e) => `فتح شاشة التسليم${e.left ? ` (فاضل ${dur(e.left)})` : ''}` },
  submit_try: { icon: 'rocket', tone: 'info', text: (e) => (e.auto ? 'تسليم تلقائي (الوقت خلص)' : 'داس تسليم') },
  submit_ok: { icon: 'checkCircle', tone: 'ok', text: (e) => `اتسلّم${e.of ? ` · ${ar(e.score)} من ${ar(e.of)}` : ''}` },
  submit_fail: { icon: 'alert', tone: 'bad', text: (e) => (e.err === 'timeout' ? 'التسليم ما وصلش (النت ضعيف) — اتحفظ على الموبايل' : `التسليم فشل (${e.err || ''})`) },
  close: { icon: 'close', tone: 'warn', text: () => 'قفل الصفحة / التطبيق' },
};
export const eventText = (e) => (EVENT_VIEW[e.t]?.text(e)) || e.t;

/** بيفك دفعات exam_events لقايمة أحداث لكل محاولة، مرتبة بالوقت */
export function groupEvents(batches = []) {
  const map = new Map();
  batches.forEach((b) => {
    const list = map.get(b.attemptId) || [];
    (b.events || []).forEach((e) => list.push(e));
    map.set(b.attemptId, list);
  });
  map.forEach((list) => list.sort((a, b) => a.at - b.at));
  return map;
}

/** أرقام عن المحاولة */
export function attemptStats(r = {}, events = []) {
  const qt = r.questionTimes || {};
  const longest = Object.entries(qt).sort((a, b) => b[1] - a[1])[0];
  let offlineSecs = 0; let offlineCount = 0; let hideCount = 0; let hideSecs = 0;
  events.forEach((e) => {
    if (e.t === 'offline') offlineCount += 1;
    if (e.t === 'online' && e.secs) offlineSecs += e.secs;
    if (e.t === 'hide') hideCount += 1;
    if (e.t === 'show' && e.secs) hideSecs += e.secs;
  });
  const first = events[0]?.at || toMs(r.startedAtMillis) || 0;
  const last = events[events.length - 1]?.at || toMs(r.lastSeenAt) || 0;
  const answers = events.filter((e) => e.t === 'ans' && e.kind !== 'clear').map((e) => e.at);
  return {
    activeSecs: first && last ? Math.round((last - first) / 1000) : 0,
    longestQ: longest ? { i: Number(longest[0]), secs: longest[1] } : null,
    changes: Number(r.answerChanges) || events.filter((e) => e.t === 'ans' && e.kind === 'change').length,
    offlineCount, offlineSecs, hideCount, hideSecs,
    lastAnswerAt: answers.length ? answers[answers.length - 1] : 0,
    visited: new Set(events.filter((e) => e.t === 'q').map((e) => e.i)).size,
  };
}

/**
 * ليه المحاولة وقفت؟ بيرجّع { code, title, detail, tone, icon }.
 * tone: ok (سلّم) · live (بيمتحن) · warn (خرج) · bad (غش/مشكلة)
 */
export function diagnoseAttempt(r = {}, events = [], { now = Date.now(), totalQuestions = 0 } = {}) {
  const ev = events;
  const last = (pred) => { for (let i = ev.length - 1; i >= 0; i -= 1) if (pred(ev[i])) return ev[i]; return null; };
  const after = (e, pred) => (e ? ev.some((x) => x.at > e.at && pred(x)) : false);
  const answeredN = r.answeredCount ?? Object.values(r.answers || {}).filter((v) => v !== undefined && v !== null && v !== '').length;
  const total = r.totalQuestions || totalQuestions || 0;
  const progress = total ? `جاوب ${ar(answeredN)} من ${ar(total)}` : `جاوب ${ar(answeredN)}`;
  const curQ = (Number(r.currentQIndex) || 0) + 1;

  if (r.status === 'completed') {
    const auto = last((e) => e.t === 'submit_try')?.auto;
    return { code: auto ? 'auto_submit' : 'submitted', tone: 'ok', icon: 'checkCircle', title: auto ? 'الوقت خلص واتسلّم تلقائي' : 'سلّم', detail: progress };
  }
  if (r.status === 'cheated') {
    return { code: 'cheated', tone: 'bad', icon: 'alert', title: `اتقفل كغش: ${reasonLabel(r.securityReason) || 'خرج من الامتحان'}`, detail: `${progress} · كان على سؤال ${ar(curQ)}` };
  }
  if (r.status === 'security_hold') {
    return { code: 'hold', tone: 'bad', icon: 'shield', title: 'متوقف بعد ٣ تنبيهات أمان', detail: `آخر تنبيه: ${reasonLabel(r.securityReason)} · ${progress}` };
  }

  const beat = Math.max(toMs(r.lastSeenAt), toMs(r.lastSavedAt), r.lastEvent?.at || 0, ev[ev.length - 1]?.at || 0);
  const silent = now - beat;
  const offline = r.network === 'offline' || (last((e) => e.t === 'offline') && !after(last((e) => e.t === 'offline'), (x) => x.t === 'online'));
  const hidden = r.appState === 'background' || (last((e) => e.t === 'hide') && !after(last((e) => e.t === 'hide'), (x) => x.t === 'show'));
  const live = r.presence !== 'away' && silent < 75e3 && !hidden;

  if (live) {
    if (offline) return { code: 'live_offline', tone: 'warn', icon: 'wifiOff', title: 'بيمتحن بس النت فاصل', detail: `إجاباته بتتحفظ على الموبايل · ${progress}` };
    const onQ = r.lastEvent?.t === 'q' || r.lastEvent?.t === 'ans' ? Math.round((now - (r.lastEvent?.at || now)) / 1000) : 0;
    return { code: 'live', tone: 'live', icon: 'live', title: 'بيمتحن دلوقتي', detail: `على سؤال ${ar(curQ)}${onQ > 90 ? ` من ${dur(onQ)}` : ''} · ${progress}` };
  }

  // خرج من غير ما يسلّم: ليه؟
  const where = `وقف عند سؤال ${ar(curQ)} · ${progress}`;
  const failed = last((e) => e.t === 'submit_fail');
  if (failed && !after(failed, (x) => x.t === 'submit_ok')) return { code: 'submit_failed', tone: 'bad', icon: 'alert', title: 'حاول يسلّم والتسليم ما وصلش', detail: `غالبًا النت ضعيف. إجاباته محفوظة على موبايله وهتتبعت لما يفتح المنصة بنت · ${progress}` };
  if (offline) return { code: 'offline', tone: 'warn', icon: 'wifiOff', title: 'النت فصل عنده', detail: `آخر إشارة ${ago(beat, now)} · ${where}` };
  const closed = last((e) => e.t === 'close');
  if (closed && closed.at >= beat - 5000) return { code: 'closed', tone: 'warn', icon: 'close', title: 'قفل الصفحة أو التطبيق بنفسه', detail: `${ago(closed.at, now)} · ${where}` };
  if (hidden) {
    const native = r.device?.app === 'app';
    return { code: 'left_screen', tone: 'warn', icon: 'logout', title: native ? 'خرج من التطبيق وما رجعش' : 'ساب تبويب الامتحان وما رجعش', detail: `${ago(last((e) => e.t === 'hide')?.at || beat, now)} · ${where}` };
  }
  const err = last((e) => e.t === 'error');
  if (err && beat - err.at < 60e3) return { code: 'error', tone: 'bad', icon: 'alert', title: 'حصل خطأ في الصفحة قبل ما يخرج', detail: `${err.msg || ''} · ${where}` };
  const bat = r.battery;
  if (bat && bat.level <= 10 && !bat.charging) return { code: 'battery', tone: 'warn', icon: 'alert', title: `البطارية خلصت غالبًا (كانت ${ar(bat.level)}٪)`, detail: `آخر إشارة ${ago(beat, now)} · ${where}` };
  if (!ev.length && !r.lastEvent) return { code: 'no_signal', tone: 'warn', icon: 'logout', title: 'خرج من الامتحان', detail: `آخر إشارة ${ago(beat, now)} · ${where} (نسخة قديمة من غير تتبع)` };
  return { code: 'signal_lost', tone: 'warn', icon: 'wifiOff', title: 'الإشارة اتقطعت فجأة', detail: `غالبًا الموبايل قفل التطبيق أو النت وقع · آخر إشارة ${ago(beat, now)} · ${where}` };
}

export function ago(ms, now = Date.now()) {
  if (!ms) return '—';
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 45) return 'دلوقتي';
  const m = Math.round(s / 60);
  if (m < 60) return `من ${ar(m)} د`;
  const h = Math.round(m / 60);
  return h < 24 ? `من ${ar(h)} س` : new Date(ms).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

export const DIAG_GROUPS = {
  submitted: 'سلّموا', auto_submit: 'اتسلّم تلقائي', live: 'بيمتحنوا', live_offline: 'بيمتحنوا والنت فاصل',
  offline: 'النت فصل', closed: 'قفلوا الصفحة/التطبيق', left_screen: 'خرجوا من الشاشة', signal_lost: 'الإشارة اتقطعت',
  submit_failed: 'التسليم ما وصلش', error: 'خطأ في الصفحة', battery: 'البطارية', no_signal: 'خرجوا (من غير تتبع)',
  cheated: 'اتقفلوا كغش', hold: 'متوقفين للأمان',
};
