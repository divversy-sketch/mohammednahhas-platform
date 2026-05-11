import { useEffect } from 'react';


export const PlatformPerformanceBooster = () => {
  useEffect(() => {
    if (import.meta.env.PROD) console.debug = () => {};
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        try { sessionStorage.setItem('platform_warmup', String(Date.now())); } catch(e) {}
      });
    }
  }, []);
  return null;
};

export default PlatformPerformanceBooster;
