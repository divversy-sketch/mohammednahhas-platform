import { MoonStar, SunMedium } from 'lucide-react';

export default function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="تبديل الوضع"
    >
      <SunMedium size={16} />
      <div className={`theme-knob ${theme === 'dark' ? 'right' : ''}`} />
      <MoonStar size={16} />
      <span>{theme === 'dark' ? 'ليلي' : 'نهاري'}</span>
    </button>
  );
}
