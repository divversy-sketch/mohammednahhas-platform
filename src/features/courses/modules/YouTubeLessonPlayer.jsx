import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { BookOpen, Layers, PlayCircle, FileText, ClipboardList, Lock, UploadCloud, PlusCircle, Trash2, Save, Unlock, Key, Users, Crown } from '@shared/icons/lucide-shim.jsx';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';
import { platformNotify, platformConfirm } from '@shared/core/platformShared.jsx';
import EmptyState from '@shared/ui/EmptyState.jsx';
import PageHeader from '@shared/ui/PageHeader.jsx';
import ImageFitControls from '@shared/ui/ImageFitControls.jsx';
import { defaultImagePlacement, imagePlacementStyle, normalizeImagePlacement } from '@shared/utils/imagePlacement.js';

const uploadMedia = async (file, kind = 'image') => {
  if (!file) return '';
  const res = await uploadToCloudinary(file, {
    kind,
    folder: kind === 'pdf' ? 'nahhas-platform/pdfs' : 'nahhas-platform/images',
  });
  return res.url;
};

const ytId = (url) =>
  String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([^&?/]+)/)?.[1] || '';

const pct = (n) => Math.max(0, Math.min(100, Math.floor(Number(n) || 0)));
const clean = (v) => String(v || '').trim();
const randomCode = () => `NH-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const userLabel = (u) => u?.name || u?.displayName || u?.email || u?.id || 'طالب';
const userIdOf = (u) => u?.id || u?.uid || u?.userId || '';

function ImgInput({ label, value, onChange, kind = 'image', placement, onPlacementChange }) {
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

export function YouTubeLessonPlayer({ videoUrl, savedProgress, onProgress, posterImage = '' }) {
  const id = useMemo(() => `yt-${Math.random().toString(36).slice(2)}`, []);
  const player = useRef(null);
  const timer = useRef(null);
  const last = useRef({ p: 0, t: 0 });
  const max = useRef(Number(savedProgress?.maxWatchedSeconds || savedProgress?.watchTime || 0));
  const [state, setState] = useState({ p: pct(savedProgress?.watchPercent), anti: false });
  const [started, setStarted] = useState(false);
  const vid = ytId(videoUrl);

  useEffect(() => {
    if (!vid) return undefined;
    let off = false;
    const load = () =>
      new Promise((resolve) => {
        if (window.YT?.Player) return resolve();
        const old = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          old?.();
          resolve();
        };
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
          const s = document.createElement('script');
          s.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(s);
        }
      });

    const tick = () => {
      const p = player.current;
      if (!p?.getCurrentTime) return;
      const cur = Math.floor(p.getCurrentTime() || 0);
      const dur = Math.floor(p.getDuration() || 0);
      if (!dur) return;
      if (cur > Math.max(max.current + 8, 12)) {
        p.seekTo(max.current, true);
        setState((x) => ({ ...x, anti: true }));
        return;
      }
      max.current = Math.max(max.current, cur);
      const per = pct((max.current / dur) * 100);
      setState({ p: per, anti: false });
      const now = Date.now();
      if (per >= last.current.p + 3 || now - last.current.t > 12000 || per >= 75) {
        last.current = { p: per, t: now };
        onProgress?.({
          watchTime: max.current,
          maxWatchedSeconds: max.current,
          videoDuration: dur,
          watchPercent: per,
          examUnlocked: per >= 75,
        });
      }
    };

    load().then(() => {
      if (off) return;
      player.current = new window.YT.Player(id, {
        videoId: vid,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1 },
        events: {
          onReady: tick,
          onStateChange: (e) => {
            clearInterval(timer.current);
            if (e.data === window.YT.PlayerState.PLAYING) timer.current = setInterval(tick, 2500);
            else tick();
          },
        },
      });
    });

    return () => {
      off = true;
      clearInterval(timer.current);
      try {
        player.current?.destroy?.();
      } catch {}
    };
  }, [vid]);

  if (!vid) return <div className="bg-red-50 text-red-700 p-4 rounded-2xl font-bold">رابط يوتيوب غير صحيح.</div>;

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden relative">
        <div id={id} className="w-full h-full" />
        {posterImage && !started && (
          <button type="button" onClick={() => { setStarted(true); player.current?.playVideo?.(); }} className="absolute inset-0 z-20 group">
            <img src={posterImage} className="w-full h-full object-cover" alt="غلاف الدرس" />
            <span className="absolute inset-0 bg-black/35 flex items-center justify-center"><span className="w-20 h-20 rounded-full bg-amber-500 text-white flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 transition">▶</span></span>
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl p-4 border">
        <div className="flex justify-between font-black mb-2">
          <span>نسبة المشاهدة</span>
          <span className={state.p >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{state.p}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${state.p}%` }} />
        </div>
        {state.anti && <p className="text-red-600 text-sm font-black mt-2">تم منع التقديم السريع. شاهد الفيديو بالترتيب.</p>}
        <p className="text-sm font-bold mt-2">{state.p >= 75 ? '✅ الامتحان متاح الآن' : `باقي لك ${75 - state.p}% لفتح الامتحان`}</p>
      </div>
    </div>
  );
}
