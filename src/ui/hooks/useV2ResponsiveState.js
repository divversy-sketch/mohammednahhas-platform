import { useEffect, useState } from 'react';

function getMatches(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

export function useV2MediaQuery(query) {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener?.('change', onChange);
    media.addListener?.(onChange);
    return () => {
      media.removeEventListener?.('change', onChange);
      media.removeListener?.(onChange);
    };
  }, [query]);

  return matches;
}

export function useV2ResponsiveState() {
  const isMobile = useV2MediaQuery('(max-width: 767px)');
  const isTablet = useV2MediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useV2MediaQuery('(min-width: 1024px)');
  const prefersReducedMotion = useV2MediaQuery('(prefers-reduced-motion: reduce)');

  return { isMobile, isTablet, isDesktop, prefersReducedMotion };
}
