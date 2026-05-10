import { useEffect } from 'react';

export const useServiceWorkerRegistration = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;

    const registerWorker = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.warn('Service worker registration failed:', error?.message));
    };

    window.addEventListener('load', registerWorker);
    return () => window.removeEventListener('load', registerWorker);
  }, []);
};

export default useServiceWorkerRegistration;
