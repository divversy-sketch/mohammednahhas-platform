import React from 'react';
import { imagePlacementStyle, normalizeImagePlacement } from '../utils/imagePlacement.js';

export default function ImageFitControls({ imageUrl, value, onChange, title = 'تظبيط الصورة داخل الإطار' }) {
  const placement = normalizeImagePlacement(value);
  const update = (patch) => onChange?.(normalizeImagePlacement({ ...placement, ...patch }));

  return (
    <div className="rounded-2xl border bg-white p-3 space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="w-full md:w-48 h-28 rounded-xl border bg-slate-100 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="معاينة الصورة" className="w-full h-full" style={imagePlacementStyle(placement)} />
          ) : (
            <span className="text-xs text-slate-400 font-bold">ارفع صورة للمعاينة</span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-black text-slate-700">{title}</p>
            <button type="button" onClick={() => update({ fit: 'contain', positionX: 50, positionY: 50, scale: 1, stretchX: 1, stretchY: 1 })} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full font-bold">إرجاع تلقائي</button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            <button type="button" onClick={() => update({ fit: 'contain' })} className={`rounded-xl px-3 py-2 border ${placement.fit === 'contain' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700'}`}>كاملة بدون قص</button>
            <button type="button" onClick={() => update({ fit: 'cover' })} className={`rounded-xl px-3 py-2 border ${placement.fit === 'cover' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-700'}`}>ملء مع قص</button>
            <button type="button" onClick={() => update({ fit: 'fill' })} className={`rounded-xl px-3 py-2 border ${placement.fit === 'fill' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700'}`}>شد للإطار</button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-xs font-bold text-slate-600">
        <label>تحريك أفقي<input type="range" min="0" max="100" value={placement.positionX} onChange={(e) => update({ positionX: e.target.value })} className="w-full" /></label>
        <label>تحريك رأسي<input type="range" min="0" max="100" value={placement.positionY} onChange={(e) => update({ positionY: e.target.value })} className="w-full" /></label>
        <label>تكبير / تصغير<input type="range" min="0.5" max="2" step="0.05" value={placement.scale} onChange={(e) => update({ scale: e.target.value })} className="w-full" /></label>
        <label>شد بالعرض<input type="range" min="0.5" max="2" step="0.05" value={placement.stretchX} onChange={(e) => update({ stretchX: e.target.value })} className="w-full" /></label>
        <label className="md:col-span-2">شد بالطول<input type="range" min="0.5" max="2" step="0.05" value={placement.stretchY} onChange={(e) => update({ stretchY: e.target.value })} className="w-full" /></label>
      </div>
    </div>
  );
}
