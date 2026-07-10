import { useEffect, useState } from 'react';
import { Sparkles } from '../icons/lucide-shim.jsx';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage?.getItem('nahhas-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
};

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('nahhas-light', theme === 'light');
    root.classList.toggle('nahhas-dark', theme === 'dark');
    window.localStorage?.setItem('nahhas-theme', theme);
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={`nh-theme-toggle ${compact ? 'nh-theme-toggle--compact' : ''}`}
      aria-label={theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
      title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
    >
      <Sparkles size={16} />
      <span>{theme === 'dark' ? 'نهاري' : 'ليلي'}</span>
    </button>
  );
}
