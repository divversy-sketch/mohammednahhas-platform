import { useState, useEffect } from 'react';
import { Code } from '../../shared/icons/lucide-shim.jsx';
import { platformNotify } from '../../shared/core/platformShared.jsx';

const InteractiveViewer = ({ content, user, onClose }) => {
  const [iframeSrc, setIframeSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let activeBlobUrl = null;
    if (content.htmlContent) {
      const blob = new Blob([content.htmlContent], { type: 'text/html;charset=utf-8' });
      activeBlobUrl = URL.createObjectURL(blob);
      setIframeSrc(activeBlobUrl);
    } else if (content.url?.startsWith('data:')) {
      fetch(content.url).then((res) => res.blob()).then((blob) => {
        activeBlobUrl = URL.createObjectURL(blob);
        setIframeSrc(activeBlobUrl);
      }).catch(() => setIframeSrc(content.url));
    } else {
      setIframeSrc(content.url);
    }
    return () => activeBlobUrl && URL.revokeObjectURL(activeBlobUrl);
  }, [content.url, content.htmlContent]);

  useEffect(() => {
    const block = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') platformNotify('غير مسموح بأخذ لقطات شاشة! المحتوى محمي.', 'error');
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 font-['Cairo'] select-none" dir="rtl" onContextMenu={(e) => e.preventDefault()}>
      <header className="relative z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-7">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-lg shadow-indigo-200"><Code size={21} /></div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-slate-900 md:text-xl">{content.title || 'المحتوى التفاعلي'}</h2>
              <p className="mt-0.5 text-xs font-bold text-slate-500">محتوى تعليمي تفاعلي — منصة النحاس</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => document.documentElement.requestFullscreen?.()} className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-indigo-50 md:block">ملء الشاشة</button>
            <button onClick={onClose} className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-600 transition hover:bg-rose-50">خروج</button>
          </div>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 p-2 md:p-5">
        <div className="relative mx-auto h-full w-full max-w-[1700px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.10)] md:rounded-[28px]">
          {isLoading && <div className="absolute inset-0 z-30 grid place-items-center bg-white"><div className="text-center"><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"/><p className="font-black text-slate-600">جاري تجهيز المحتوى...</p></div></div>}
          {user && <div className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full bg-slate-900/5 px-4 py-1 text-xs font-black text-slate-500">{user.name || user.displayName} — منصة النحاس</div>}
          <iframe src={iframeSrc} onLoad={() => setIsLoading(false)} className="relative z-10 h-full w-full border-0 bg-white" title={content.title} sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals" />
        </div>
      </main>
    </div>
  );
};

export default InteractiveViewer;
