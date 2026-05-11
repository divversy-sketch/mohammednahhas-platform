import { useState, useEffect } from 'react';
import { Code } from '../../shared/icons/lucide-shim.jsx';
import { platformNotify } from '../../shared/core/platformShared.jsx';

const InteractiveViewer = ({ content, user, onClose }) => {
    const handleContextMenu = (e) => e.preventDefault();
    const [iframeSrc, setIframeSrc] = useState('');
    useEffect(() => {
        let activeBlobUrl = null;
        if (content.htmlContent) {
            const blob = new Blob([content.htmlContent], { type: 'text/html;charset=utf-8' });
            activeBlobUrl = URL.createObjectURL(blob);
            setIframeSrc(activeBlobUrl);
        } else if (content.url && content.url.startsWith('data:')) {
            fetch(content.url).then(res => res.blob()).then(blob => { activeBlobUrl = URL.createObjectURL(blob); setIframeSrc(activeBlobUrl); }).catch(err => { console.error("Error creating blob:", err); setIframeSrc(content.url); });
        } else { setIframeSrc(content.url); }
        return () => { if (activeBlobUrl) { URL.revokeObjectURL(activeBlobUrl); } };
    }, [content.url, content.htmlContent]);
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'PrintScreen') { platformNotify('غير مسموح بأخذ لقطات شاشة! المحتوى محمي.', 'error'); if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText('Screenshots are disabled'); } } };
        const handleCopy = (e) => { e.preventDefault(); platformNotify('النسخ غير مسموح!', 'error'); };
        window.addEventListener('keydown', handleKeyDown); document.addEventListener('copy', handleCopy); document.addEventListener('cut', handleCopy);
        return () => { window.removeEventListener('keydown', handleKeyDown); document.removeEventListener('copy', handleCopy); document.removeEventListener('cut', handleCopy); };
    }, []);
    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 select-none" onContextMenu={handleContextMenu}>
            <div className="w-full h-full max-w-7xl bg-white rounded-xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col">
                <div className="bg-slate-900 p-3 flex justify-between items-center text-white border-b border-gray-700 select-none">
                   <div className="flex items-center gap-4">
                       <h3 className="font-bold flex items-center gap-2"><Code /> {content.title}</h3>
                       <span className="hidden md:block text-xs bg-amber-600 px-3 py-1 rounded-full text-white font-bold">منصة النحاس - أ/ محمد النحاس</span>
                   </div>
                   <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded font-bold transition">خروج</button>
                </div>
                <div className="flex-1 bg-white relative overflow-hidden">
                   {user && (<div className="watermark-video" style={{ pointerEvents: 'none', zIndex: 9999 }}>{user.name} - {user.grade} — منصة النحاس — أ/ محمد النحاس</div>)}
                   <div className="absolute inset-0 z-[9998] pointer-events-none select-none"></div>
                   <iframe src={iframeSrc} className="w-full h-full border-0 relative z-40 bg-white" title={content.title} sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals" style={{ pointerEvents: 'auto', WebkitTransform: 'translateZ(0)' }}></iframe>
                </div>
            </div>
        </div>
    );
};


export default InteractiveViewer;
