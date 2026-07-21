import { useEffect, useState } from 'react';
import { enableNativeSecurity, isNativeApp } from './nativeSecurity.js';
import { countOfflineActions } from '../../shared/offline/offlineQueue.js';
import './native-app.css';

export default function NativeAppLayer() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    enableNativeSecurity();

    const refresh = async () => {
      setOnline(navigator.onLine);
      try { setPending(await countOfflineActions()); } catch { setPending(0); }
    };

    const protectBackground = () => {
      document.documentElement.classList.toggle('nahhas-app-backgrounded', document.hidden);
    };

    refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.addEventListener('nahhas-offline-queue-change', refresh);
    document.addEventListener('visibilitychange', protectBackground);

    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.removeEventListener('nahhas-offline-queue-change', refresh);
      document.removeEventListener('visibilitychange', protectBackground);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className={`nahhas-connectivity-banner ${online ? 'is-syncing' : 'is-offline'}`} role="status" dir="rtl">
      <strong>{online ? 'عاد الاتصال بالإنترنت' : 'أنت تعمل بدون إنترنت'}</strong>
      <span>{pending > 0 ? `${pending} عملية محفوظة بانتظار المزامنة` : 'سيتم حفظ العمليات محليًا حتى عودة الاتصال'}</span>
      {isNativeApp() && <small>تطبيق منصة النحاس</small>}
    </div>
  );
}
