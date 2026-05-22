import { useState } from 'react';
import { UploadCloud } from '@shared/icons/lucide-shim.jsx';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';
import { imagePlacementStyle } from '@shared/utils/imagePlacement.js';
import { platformNotify } from '@shared/core/platformShared.jsx';
import { uploadMedia } from '../services/courseMedia.js';

export function ImgInput({ label, value, onChange, kind = 'image', placement, onPlacementChange }) {
  const [busy, setBusy] = useState(false);
  const isPdf = kind === 'pdf';
  return (
    <div className="space-y-2">
      <label className="text-sm font-black flex gap-2">
        <UploadCloud size={16} /> {label}
      </label>
      <input
        className="w-full p-3 rounded-xl border"
        placeholder={isPdf ? 'رابط PDF أو ارفع ملف' : 'رابط الصورة أو ارفع صورة'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <label className="inline-flex gap-2 px-4 py-2 rounded-xl bg-slate-100 font-black text-xs cursor-pointer">
        <UploadCloud size={16} />
        {busy ? 'جاري الرفع...' : isPdf ? 'رفع PDF على Cloudinary' : 'رفع صورة على Cloudinary'}
        <input
          type="file"
          accept={isPdf ? 'application/pdf' : 'image/*'}
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            try {
              setBusy(true);
              onChange(await uploadMedia(e.target.files?.[0], kind));
            } catch (err) {
              platformNotify(err.message || 'حدث خطأ أثناء الرفع', 'error');
            } finally {
              setBusy(false);
              e.target.value = '';
            }
          }}
        />
      </label>
      {busy && <p className="text-xs text-amber-700">جاري رفع الملف على Cloudinary...</p>}
      {value &&
        (isPdf ? (
          <a href={value} target="_blank" rel="noreferrer" className="block text-blue-700 font-black underline">
            فتح ملف PDF
          </a>
        ) : (
          <div className="h-28 w-full rounded-2xl border bg-slate-100 overflow-hidden"><img src={value} className="w-full h-full" style={imagePlacementStyle(placement)} /></div>
        ))}
      {!isPdf && onPlacementChange && (
        <ImageFitControls imageUrl={value} value={placement} onChange={onPlacementChange} />
      )}
    </div>
  );
}
