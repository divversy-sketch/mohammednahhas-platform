// Public home page, v2 ("night copper" with motion). Same props and Firestore reads as the old landing page.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { openPlatformWhatsApp } from '@shared/core/platform/media.js';
import logoLight from '@assets/nahhas-logo-transparent.webp';
import logoDark from '@assets/nahhas-logo-dark.webp';
import { Icon, KhatamStar } from '../ui/Icon.jsx';
import { Button, CountUp, IconButton, formatNumber } from '../ui/kit.jsx';
import { usePrefs } from '../prefs.js';
import { titleOf } from '../student/insights.js';
import '../styles/landing.css';

const SecureVideoPlayer = lazy(() => import('@features/video-security/player/SecureVideoPlayer.jsx'));
const InteractiveViewer = lazy(() => import('@features/content/InteractiveViewer'));

const GRADES = { '1prep': 'أولى إعدادي', '2prep': 'تانية إعدادي', '3prep': 'تالتة إعدادي', '1sec': 'أولى ثانوي', '2sec': 'تانية ثانوي', '3sec': 'تالتة ثانوي' };

function typeOf(item) {
  const type = String(item?.type || item?.contentType || '').toLowerCase();
  const mime = String(item?.mimeType || '').toLowerCase();
  if (type.includes('video')) return 'video';
  if (type.includes('html') || item?.htmlContent) return 'html';
  if (type.includes('pdf') || mime.includes('pdf')) return 'pdf';
  if (type.includes('exam') || type.includes('assignment') || type.includes('homework')) return 'exam';
  return 'file';
}
const TYPE_LABEL = { video: 'فيديو شرح', html: 'نشاط تفاعلي', pdf: 'ملف PDF', file: 'ملف', exam: 'تدريب' };
const TYPE_ICON = { video: 'video', html: 'interactive', pdf: 'fileText', file: 'fileText', exam: 'exam' };

const FEATURES = [
  { icon: 'route', tone: 'copper', title: 'مسار واضح من أول درس', text: 'شرح، بعده تدريب، بعده مراجعة. كل خطوة بتوديك للي بعدها من غير تشتيت.', big: true },
  { icon: 'exam', tone: 'gold', title: 'امتحانات زي الحقيقة', text: 'بالوقت، ونص القراءة ثابت قدامك، والنتيجة وتحليلها أول ما تسلّم.' },
  { icon: 'mistake', tone: 'danger', title: 'بنك الأخطاء', text: 'كل سؤال تغلط فيه بيتحفظ، وتقدر تمتحن نفسك فيه تاني لحد ما تتقنه.' },
  { icon: 'video', tone: 'patina', title: 'فيديو محمي ومنظم', text: 'المحاضرات مترتبة، وبتكمّل من مكان ما وقفت على أي جهاز.' },
  { icon: 'users', tone: 'info', title: 'متابعة ولي الأمر', text: 'ولي الأمر بيشوف الدرجات والحضور والواجبات من حسابه.' },
  { icon: 'trophy', tone: 'gold', title: 'لوحة الشرف والشهادات', text: 'ترتيبك بين زمايلك في صفك، وشهادة إنجاز لما توصل للمستوى.' },
];

const STEPS = [
  ['افهم', 'شرح قصير ومباشر قبل القاعدة، بأمثلة من الامتحان.', 'play'],
  ['طبّق', 'تدريب متدرج من السهل لحد النموذج الكامل.', 'edit'],
  ['راجع', 'مراجعة على أخطائك إنت، مش على كل حاجة.', 'refresh'],
];

function PhoneMock() {
  return (
    <div className="lx-phone" aria-hidden="true">
      <div className="lx-phone__bezel">
        <div className="lx-phone__screen nx">
          <div className="lx-phone__notch" />
          <div className="lx-mini">
            <div className="lx-mini__hello"><span className="nx-avatar">ي</span><div><b>صباح الخير يا يوسف</b><small>تالتة ثانوي</small></div></div>
            <div className="lx-mini__hero">
              <span className="lx-mini__chip">كمّل من مكانك</span>
              <b>المفعول المطلق وأنواعه</b>
              <div className="nx-bar"><i style={{ width: '62%' }} /></div>
            </div>
            <div className="lx-mini__streak">
              <b><Icon name="fire" className="nx-flame" size={14} /> ٦ أيام مذاكرة ورا بعض</b>
              <div>{['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((d, i) => <span key={d} className={i < 6 ? 'on' : ''} style={{ animationDelay: `${0.4 + i * 0.12}s` }}>{i < 6 ? <Icon name="check" size={11} /> : d}</span>)}</div>
            </div>
            <div className="lx-mini__list">
              <div><span className="nx-tile nx-tile--copper"><Icon name="exam" size={15} /></span><p><b>امتحان البلاغة الشهري</b><small>بيقفل بعد يومين</small></p></div>
              <div><span className="nx-tile nx-tile--gold"><Icon name="mistake" size={15} /></span><p><b>راجع ٨ أسئلة</b><small>من بنك الأخطاء</small></p></div>
            </div>
            <div className="lx-mini__score">
              <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" /><circle className="arc" cx="60" cy="60" r="50" /></svg>
              <div><b>٨٦٪</b><small>متوسطك</small></div>
            </div>
          </div>
          <nav className="lx-mini__tabs">{['home', 'video', 'exam', 'chart', 'user'].map((n, i) => <span key={n} className={i === 0 ? 'on' : ''}><Icon name={n} size={17} /></span>)}</nav>
        </div>
      </div>
    </div>
  );
}

export default function LandingV2({ onAuthClick, onRegisterClick, installPrompt }) {
  const { theme, toggleTheme } = usePrefs();
  const [publicContent, setPublicContent] = useState([]);
  const [publicFiles, setPublicFiles] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true), limit(18)),
    (snap) => setPublicContent(snap.docs.map((d) => ({ id: d.id, source: 'content', ...d.data() }))), () => setPublicContent([])), []);
  useEffect(() => onSnapshot(query(collection(db, 'files'), where('isPublic', '==', true), limit(12)),
    (snap) => setPublicFiles(snap.docs.map((d) => ({ id: d.id, source: 'files', type: 'file', ...d.data() }))), () => setPublicFiles([])), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = useMemo(() => [...publicContent, ...publicFiles], [publicContent, publicFiles]);
  const counts = useMemo(() => ({
    video: items.filter((i) => typeOf(i) === 'video').length,
    html: items.filter((i) => ['html', 'exam'].includes(typeOf(i))).length,
    files: items.filter((i) => ['pdf', 'file'].includes(typeOf(i))).length,
  }), [items]);

  const goLogin = () => onAuthClick?.('login');
  const goRegister = () => (onRegisterClick || onAuthClick)?.('register');
  const openItem = (item) => {
    const t = typeOf(item);
    if (t === 'video') return setPlayingVideo(item);
    if (t === 'html') return setPlayingHtml(item);
    const url = item.url || item.fileUrl || item.downloadURL || item.downloadUrl || item.storageUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    return null;
  };
  const install = () => (typeof installPrompt === 'function' ? installPrompt() : installPrompt?.prompt?.());

  return (
    <div className="nx lx" dir="rtl">
      <header className={`lx-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="lx-wrap lx-nav__in">
          <img className="lx-nav__logo" src={scrolled && theme !== 'dark' ? logoLight : logoDark} alt="منصة النحاس" />
          <nav className="lx-nav__links" aria-label="أقسام الصفحة">
            <a href="#features">المميزات</a>
            <a href="#how">إزاي بتذاكر</a>
            {items.length > 0 && <a href="#free">محتوى مجاني</a>}
          </nav>
          <div className="lx-nav__actions">
            {installPrompt && <IconButton icon="install" label="ثبّت المنصة" plain onClick={install} />}
            <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'} plain onClick={toggleTheme} />
            <Button variant={scrolled ? 'soft' : 'glass'} size="s" onClick={goLogin}>دخول</Button>
          </div>
        </div>
      </header>

      <section className="lx-hero">
        <div className="lx-mesh" aria-hidden="true"><i /><i /><i /></div>
        <KhatamStar className="lx-hero__star" />
        <div className="lx-wrap lx-hero__grid">
          <div className="lx-hero__copy">
            <span className="nx-chip nx-chip--night lx-rise"><Icon name="spark" />مع أ/ محمد النحاس</span>
            <h1 className="lx-rise lx-d1">
              اتعلّم <span className="lx-ticker" aria-label="النحو والبلاغة والأدب والقراءة"><span>النحو</span><span>البلاغة</span><span>الأدب</span><span>القراءة</span><span>النحو</span></span>
              <br /><span className="cal lx-sheen">صح</span>، لحد يوم الامتحان
            </h1>
            <p className="lx-lead lx-rise lx-d2">شرح منظم، تدريب بعد كل درس، امتحانات بالوقت، ومتابعة لمستواك أول بأول. على الموبايل والتابلت والكمبيوتر.</p>
            <div className="lx-hero__cta lx-rise lx-d3">
              <Button variant="pri" size="l" iconEnd="arrowLeft" onClick={goRegister} haptics="medium">ابدأ مجانًا</Button>
              <Button variant="glass" size="l" onClick={goLogin}>عندي حساب</Button>
            </div>
            {items.length > 0 && (
              <div className="lx-hero__stats lx-rise lx-d4">
                {counts.video > 0 && <div><b><CountUp value={counts.video} /></b><span>فيديو مجاني</span></div>}
                {counts.html > 0 && <div><b><CountUp value={counts.html} /></b><span>نشاط تفاعلي</span></div>}
                {counts.files > 0 && <div><b><CountUp value={counts.files} /></b><span>ملف ومراجعة</span></div>}
              </div>
            )}
          </div>
          <div className="lx-hero__stage">
            <div className="lx-hero__glow" aria-hidden="true" />
            <PhoneMock />
            <div className="lx-float lx-float--a" aria-hidden="true"><span className="nx-tile nx-tile--patina"><Icon name="checkCircle" size={16} /></span><div><b>إجابة صح</b><small>+٢ درجة</small></div></div>
            <div className="lx-float lx-float--b" aria-hidden="true"><span className="nx-tile nx-tile--gold"><Icon name="trophy" size={16} /></span><div><b>الأول على الصف</b><small>لوحة الشرف</small></div></div>
          </div>
        </div>
        <div className="lx-marquee" aria-hidden="true"><div>{[0, 1].map((k) => <span key={k}>{['امتحانات بالوقت', 'نص القراءة ثابت قدامك', 'بنك الأخطاء', 'تقرير لولي الأمر', 'فيديو محمي', 'لوحة الشرف', 'شهادات إنجاز', 'وضع ليلي'].map((t) => <em key={t}><Icon name="spark" size={12} />{t}</em>)}</span>)}</div></div>
      </section>

      <main>
        <section className="lx-sec lx-wrap" id="features">
          <div className="lx-head"><span>ليه منصة النحاس</span><h2>كل اللي محتاجه عشان تذاكر عربي صح، في مكان واحد</h2></div>
          <div className="lx-bento">
            {FEATURES.map((f, i) => (
              <article key={f.title} className={`lx-feature ${f.big ? 'lx-feature--big' : ''}`} style={{ '--i': i }}>
                <span className={`nx-tile nx-tile--${f.tone}`}><Icon name={f.icon} /></span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                {f.big && (
                  <div className="lx-path" aria-hidden="true">{STEPS.map(([t, , ic], k) => <span key={t} style={{ animationDelay: `${k * 0.25}s` }}><Icon name={ic} size={15} />{t}</span>)}</div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="lx-sec lx-wrap" id="how">
          <div className="lx-head"><span>طريقة المذاكرة</span><h2>تلات خطوات، كل يوم</h2></div>
          <ol className="lx-steps">
            {STEPS.map(([title, text, icon], i) => (
              <li key={title}>
                <span className="lx-steps__n">{formatNumber(i + 1)}</span>
                <span className="nx-tile nx-tile--copper"><Icon name={icon} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {items.length > 0 && (
          <section className="lx-sec lx-wrap" id="free">
            <div className="lx-head"><span>جرّب قبل ما تشترك</span><h2>محتوى مفتوح للكل</h2></div>
            <div className="lx-free">
              {items.slice(0, 9).map((item) => {
                const t = typeOf(item);
                return (
                  <button key={`${item.source}-${item.id}`} type="button" className="nx-card nx-card--tap lx-free__item" onClick={() => openItem(item)}>
                    <span className={`nx-tile ${t === 'video' ? 'nx-tile--copper' : t === 'html' ? 'nx-tile--patina' : 'nx-tile--gold'}`}><Icon name={TYPE_ICON[t]} /></span>
                    <span className="nx-row__main"><span className="nx-row__title">{titleOf(item, 'محتوى مفتوح')}</span><span className="nx-row__sub">{TYPE_LABEL[t]}{GRADES[item.grade] ? ` · ${GRADES[item.grade]}` : ''}</span></span>
                    <Icon name={t === 'video' ? 'play' : 'chevronLeft'} />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="lx-sec lx-wrap">
          <div className="lx-cta nx-night">
            <span className="nx-night__glow" aria-hidden="true" />
            <span className="nx-night__glow nx-night__glow--gold" aria-hidden="true" />
            <KhatamStar />
            <h2>جاهز تبدأ أول خطوة؟</h2>
            <p className="dim">اعمل حسابك في دقيقة، وأول ما الإدارة تفعّله هتلاقي محاضراتك وامتحاناتك مستنياك.</p>
            <div className="lx-hero__cta">
              <Button variant="pri" size="l" iconEnd="arrowLeft" onClick={goRegister}>اعمل حساب طالب</Button>
              <Button variant="glass" size="l" icon="whatsapp" onClick={() => openPlatformWhatsApp()}>كلّم الإدارة</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lx-foot lx-wrap">
        <img src={theme === 'dark' ? logoDark : logoLight} alt="منصة النحاس" />
        <span>منصة النحاس لتعليم اللغة العربية · أ/ محمد النحاس</span>
        <div>
          <a href="https://www.facebook.com/share/17aiUQWKf5/" target="_blank" rel="noreferrer">فيسبوك</a>
          <button type="button" onClick={() => openPlatformWhatsApp()}>واتساب</button>
          <button type="button" onClick={goLogin}>تسجيل الدخول</button>
        </div>
      </footer>

      <Suspense fallback={null}>
        {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
        {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      </Suspense>
    </div>
  );
}
