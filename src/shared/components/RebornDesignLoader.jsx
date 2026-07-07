import { useEffect } from 'react';
import '../../styles/reborn-platform-design.css';

/*
  RebornDesignLoader
  بديل نظيف لـ DesignSystemLoader القديم.
  وظيفته: تفعيل RTL، الوضع الليلي/النهاري، ولون المتصفح فقط.
*/

const STORAGE_KEY = 'platform-theme';

export default function RebornDesignLoader() {
  useEffect(() => {
    const root = document.documentElement;
    root.dir = 'rtl';
    root.lang = root.lang || 'ar';

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      root.dataset.theme = saved;
      root.classList.toggle('dark', saved === 'dark');
    }

    const applyMeta = () => {
      const isDark = root.classList.contains('dark') || root.dataset.theme === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = isDark ? '#070b14' : '#f5f7fb';
    };

    applyMeta();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', applyMeta);

    window.platformTheme = {
      set(theme) {
        const next = theme === 'dark' ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEY, next);
        root.dataset.theme = next;
        root.classList.toggle('dark', next === 'dark');
        applyMeta();
      },
      toggle() {
        const currentDark = root.dataset.theme === 'dark' || root.classList.contains('dark');
        this.set(currentDark ? 'light' : 'dark');
      },
    };

    return () => media.removeEventListener?.('change', applyMeta);
  }, []);

  return null;
}
