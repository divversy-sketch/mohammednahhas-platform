import '../../styles/pages/app-loading.css';
import PlatformLogo from './PlatformLogo.jsx';

const loadingLetters = ['ن', 'ح', 'و', 'ص', 'ر', 'ف'];

function LoadingStudentMark() {
  return (
    <svg className="nahhas-loading-student" viewBox="0 0 220 180" role="img" aria-label="طالب يذاكر">
      <defs>
        <linearGradient id="loadingSkin" x1="0" x2="1"><stop offset="0" stopColor="#ffd8a8" /><stop offset="1" stopColor="#f2a261" /></linearGradient>
        <linearGradient id="loadingBook" x1="0" x2="1"><stop offset="0" stopColor="#f5b820" /><stop offset="1" stopColor="#45ccff" /></linearGradient>
        <linearGradient id="loadingShirt" x1="0" x2="1"><stop offset="0" stopColor="#36e2bf" /><stop offset="1" stopColor="#45ccff" /></linearGradient>
      </defs>
      <circle cx="110" cy="91" r="74" fill="currentColor" opacity=".08" />
      <path d="M62 144c15-23 81-23 96 0v20H62v-20Z" fill="url(#loadingShirt)" />
      <circle cx="110" cy="72" r="32" fill="url(#loadingSkin)" />
      <path d="M78 68c5-27 25-40 55-31 15 4 23 16 21 31-12-8-29-10-45-6-13 3-23 5-31 6Z" fill="#172033" />
      <path d="M90 82c6 8 34 8 40 0" stroke="#743f23" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".55" />
      <path d="M40 116c25-14 48-14 70 2v42c-22-15-45-15-70-2v-42Z" fill="#f5b820" />
      <path d="M110 118c22-16 45-16 70-2v42c-25-13-48-13-70 2v-42Z" fill="#fff" opacity=".92" />
      <path d="M110 118v42 M55 130h38 M55 142h30 M127 130h37 M127 142h28" stroke="#102240" strokeWidth="3" strokeLinecap="round" opacity=".36" />
      <circle cx="62" cy="42" r="8" fill="#f5b820" opacity=".86" />
      <path d="M168 38l5 11 11 5-11 5-5 11-5-11-11-5 11-5 5-11Z" fill="#45ccff" opacity=".82" />
    </svg>
  );
}

export const AppLoadingScreen = ({
  title = 'منصة النحاس التعليمية',
  message = 'جاري تجهيز تجربتك...',
  variant = 'student'
}) => {
  const isAdmin = variant === 'admin';
  const finalMessage = message || (isAdmin ? 'جاري تجهيز لوحة الإدارة...' : 'جاري تجهيز مساحة الطالب...');

  return (
    <div className={`nahhas-loading-screen nahhas-loading-screen--${isAdmin ? 'admin' : 'student'}`} dir="rtl">
      <div className="nahhas-loading-letters" aria-hidden="true">
        {loadingLetters.map((letter, index) => <span key={`${letter}-${index}`} style={{ '--i': index }}>{letter}</span>)}
      </div>
      <section className="nahhas-loading-card" aria-live="polite">
        <div className="nahhas-loading-card__shine" aria-hidden="true" />
        <div className="nahhas-loading-visual">
          <div className="nahhas-loading-ring" aria-hidden="true" />
          <div className="nahhas-loading-orb">
            <LoadingStudentMark />
          </div>
        </div>
        <PlatformLogo variant="full" size="sm" strong className="nahhas-loading-brand" />
        <span className="nahhas-loading-kicker">رحلة تعليمية أذكى في اللغة العربية</span>
        <h2>{title}</h2>
        <p>{finalMessage}</p>
        <div className="nahhas-loading-progress" aria-hidden="true"><span /></div>
        <div className="nahhas-loading-steps" aria-hidden="true">
          <b>شرح</b>
          <i />
          <b>تدريب</b>
          <i />
          <b>مراجعة</b>
        </div>
      </section>
    </div>
  );
};

export const RouteLoadingScreen = ({ mode }) => (
  <AppLoadingScreen
    title="منصة النحاس التعليمية"
    message={mode === 'admin' ? 'جاري تجهيز لوحة الإدارة...' : 'جاري تجهيز مساحة الطالب...'}
    variant={mode}
  />
);

export default AppLoadingScreen;
