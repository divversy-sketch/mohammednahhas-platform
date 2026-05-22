import { Maximize2, Minimize2, PenLine, RefreshCw, Search, Settings as GearIcon, Shrink, X } from '@shared/icons/lucide-shim.jsx';
import { PLAYBACK_RATES } from '../constants.js';

export const VideoPlayerControls = ({
  showNotes,
  setShowNotes,
  isZoomed,
  setIsZoomed,
  isFullscreen,
  toggleFullscreen,
  videoId,
  reloadVideo,
  showSettings,
  setShowSettings,
  changeSpeed,
  playbackRate,
  onClose
}) => (
  <div className="lecture-controls-layer absolute top-3 right-3 left-3 z-[80] flex gap-2 md:gap-3 flex-wrap items-start justify-between pointer-events-none">
    <div className="flex gap-2 md:gap-3 flex-wrap pointer-events-auto">
      <button onClick={() => setShowNotes(!showNotes)} className={`lecture-action-btn ${showNotes ? 'bg-blue-600 text-white' : 'bg-black/55 text-white'}`}>
        <PenLine size={18}/> <span className="hidden md:inline">ملاحظاتي</span>
      </button>
      <button onClick={() => setIsZoomed(v => !v)} className={`lecture-action-btn ${isZoomed ? 'bg-amber-500 text-black' : 'bg-black/55 text-white'}`} title={isZoomed ? 'إلغاء تكبير الصورة' : 'تكبير الصورة أثناء المشاهدة'}>
        {isZoomed ? <Shrink size={22}/> : <Search size={22}/>}<span className="hidden sm:inline">{isZoomed ? 'تصغير الصورة' : 'تكبير الصورة'}</span>
      </button>
      <button onClick={toggleFullscreen} className="lecture-action-btn bg-black/55 text-white" title={isFullscreen ? 'تصغير العرض' : 'ملء الشاشة'}>
        {isFullscreen ? <Minimize2 size={23}/> : <Maximize2 size={23}/>}<span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
      </button>
      {!videoId && (
        <button onClick={reloadVideo} className="lecture-action-btn bg-black/55 text-white" title="إعادة تحميل الفيديو إذا توقف مؤقتًا">
          <RefreshCw size={20}/><span className="hidden md:inline">تحديث</span>
        </button>
      )}
    </div>
    <div className="flex gap-2 pointer-events-auto">
      <div className="relative">
        <button onClick={() => setShowSettings(!showSettings)} className="lecture-action-btn bg-black/55 text-white"><GearIcon size={23}/></button>
        {showSettings && (
          <div className="absolute top-12 left-0 bg-white text-black rounded-lg shadow-xl py-2 w-40 z-[90] text-sm font-bold">
            <div className="px-4 py-2 border-b text-gray-400 text-xs">سرعة التشغيل</div>
            {PLAYBACK_RATES.map(rate => (<button key={rate} onClick={() => changeSpeed(rate)} className={`block w-full text-right px-4 py-2 hover:bg-gray-100 ${playbackRate === rate ? 'bg-amber-50 text-amber-700' : ''}`}>{rate}x</button>))}
            {videoId && <p className="px-4 py-2 text-[10px] text-slate-400 border-t">سرعة يوتيوب من إعدادات المشغل نفسه.</p>}
          </div>
        )}
      </div>
      <button onClick={onClose} className="lecture-action-btn bg-red-600 hover:bg-red-700 text-white"><X size={23}/></button>
    </div>
  </div>
);

export default VideoPlayerControls;
