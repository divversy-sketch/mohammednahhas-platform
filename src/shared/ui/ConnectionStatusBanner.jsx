import { useEffect, useState } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return isOnline;
};

export const ConnectionStatusBanner = ({ isOnline, lastLocalSaveAt }) => {
  if (isOnline) return null;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[80] w-[92%] max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center shadow-lg">
      <p className="font-black text-amber-800">الاتصال غير مستقر</p>
      <p className="text-xs font-bold text-amber-700 mt-1">
        إجاباتك محفوظة محليًا على هذا الجهاز، وسيتم مزامنتها عند رجوع الإنترنت.
        {lastLocalSaveAt ? ` آخر حفظ محلي: ${lastLocalSaveAt}` : ''}
      </p>
    </div>
  );
};

export default ConnectionStatusBanner;
