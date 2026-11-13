// «جسر» بين المنصة وأي ملف امتحان HTML — حتى لو الملف ما اتعملش بالبرومت.
// المنصة بتحطه جوه الملف قبل ما تعرضه، وبيعمل:
//  - alert/confirm/prompt: الصفحة بتشتغل عادي (confirm = موافق، alert = رسالة من المنصة)
//    (قبل كده كانت بتتمنع، وأي امتحان بيسأل «متأكد تسلّم؟» ماكانش بيسلّم أبدًا)
//  - لما الطالب يدوس زرار تسليم/نتيجة جوه الصفحة: بيدور على الدرجة اللي ظهرت (٨ / ١٠، ٨ من ١٠، ٨٠٪) ويبعتها للمنصة
//  - لما المنصة تطلب تسليم (زرار «سلّم» أو الوقت خلص): بيدوس زرار التسليم بتاع الصفحة لو الصفحة ماسلّمتش لوحدها
// لو الصفحة بتبعت nahhas:result بنفسها، المنصة بتاخد نتيجتها هي والجسر بيقف.
const BRIDGE_JS = `(function(){
if (window.__nahhasBridge) return; window.__nahhasBridge = true;
var P = function(m){ try { parent.postMessage(m, '*'); } catch(e){} };
var done = false;
var AR = '٠١٢٣٤٥٦٧٨٩', FA = '۰۱۲۳۴۵۶۷۸۹';
function norm(t){ return String(t || '').replace(/[٠-٩]/g, function(d){ return AR.indexOf(d); }).replace(/[۰-۹]/g, function(d){ return FA.indexOf(d); }).replace(/٫/g, '.'); }
try {
  window.alert = function(m){ P({ type: 'nahhas:toast', text: String(m == null ? '' : m).slice(0, 300) }); };
  window.confirm = function(){ return true; };
  window.prompt = function(m, d){ return d == null ? '' : d; };
} catch(e) {}
var SUBMIT_STRICT = /سل[ّ]?م|تسليم|إنهاء|انهاء|إنها|submit|finish|النتيج|احسب|تصحيح/i;
var KEY = /درج|نتيج|مجموع|حصلت|نقط|نقاط|صح|score|result|total|grade|points|correct/i;
var QLINE = /سؤال|السؤال|question|q\\s*\\d/i;
function lines(){ return norm(document.body ? document.body.innerText : '').split(/\\n+/).map(function(x){ return x.trim(); }).filter(Boolean); }
function snap(){ var o = {}; lines().forEach(function(x){ o[x] = 1; }); return o; }
// بيدوّر بس في السطور اللي ظهرت بعد ما الطالب سلّم، ومن غير سطور «سؤال ١ من ١٠»
function scan(before){
  if (done || !document.body) return false;
  var all = lines(), best = null, i, L, near, m;
  var fresh = all.map(function(x){ return before && before[x] ? '' : x; });
  for (i = 0; i < fresh.length && !best; i++) {
    L = fresh[i]; if (!L || L.length > 180 || QLINE.test(L)) continue;
    near = KEY.test(L) || (i > 0 && KEY.test(all[i - 1])) || (i + 1 < all.length && KEY.test(all[i + 1]));
    m = L.match(/(\\d+(?:\\.\\d+)?)\\s*(?:\\/|من|out of|of)\\s*(\\d+(?:\\.\\d+)?)/i);
    if (m && near) { var s = +m[1], t = +m[2]; if (t > 0 && s <= t && t <= 1000) best = { score: s, total: t }; }
  }
  for (i = 0; i < fresh.length && !best; i++) {
    L = fresh[i]; if (!L || L.length > 180 || QLINE.test(L)) continue;
    near = KEY.test(L) || (i > 0 && KEY.test(all[i - 1]));
    m = L.match(/(\\d{1,3}(?:\\.\\d+)?)\\s*[%٪]/);
    if (m && near && +m[1] <= 100) best = { score: +m[1], total: 100 };
  }
  if (best) { P({ type: 'nahhas:result', score: best.score, total: best.total, inferred: true }); return true; }
  return false;
}
function watch(before){ var n = 0; var iv = setInterval(function(){ n++; if (done || scan(before) || n > 10) clearInterval(iv); }, 600); }
document.addEventListener('click', function(e){
  var b = e.target && e.target.closest ? e.target.closest('button, input[type=submit], input[type=button], a, [role=button]') : null;
  if (!b) return;
  var t = (b.innerText || b.value || b.getAttribute('aria-label') || '').trim();
  if (t.length < 40 && SUBMIT_STRICT.test(t)) { var before = snap(); setTimeout(function(){ watch(before); }, 900); }
}, true);
function findSubmit(){
  var els = document.querySelectorAll('button, input[type=submit], input[type=button], [role=button]');
  var dis = null;
  for (var i = els.length - 1; i >= 0; i--) {
    var t = (els[i].innerText || els[i].value || '').trim();
    if (t.length < 40 && SUBMIT_STRICT.test(t)) { if (!els[i].disabled) return els[i]; if (!dis) dis = els[i]; }
  }
  if (dis) { dis.disabled = false; dis.removeAttribute('disabled'); }
  return dis;
}
window.addEventListener('message', function(e){
  var d = e.data || {};
  if (d.type === 'nahhas:got') done = true;
  if (d.type === 'nahhas:submit' || d.type === 'nahhas:timeup') {
    setTimeout(function(){ if (done) return; var before = snap(); var b = findSubmit(); if (b) { try { b.click(); } catch(x) {} } setTimeout(function(){ watch(before); }, 500); }, 1200);
  }
});
P({ type: 'nahhas:ready', bridge: true });
})();`;

/** يحط الجسر في أول الملف (قبل أي سكربت تاني في الصفحة). */
export function injectBridge(html) {
  const tag = `<script>${BRIDGE_JS}</script>`;
  const src = String(html || '');
  if (/<head[^>]*>/i.test(src)) return src.replace(/<head[^>]*>/i, (m) => `${m}${tag}`);
  if (/<html[^>]*>/i.test(src)) return src.replace(/<html[^>]*>/i, (m) => `${m}<head>${tag}</head>`);
  return tag + src;
}

/** الملف ده بيبعت الدرجة للمنصة بنفسه؟ (عشان ننبه الأدمن وقت الرفع) */
export function speaksToPlatform(html) {
  return /nahhas:result/.test(String(html || ''));
}
