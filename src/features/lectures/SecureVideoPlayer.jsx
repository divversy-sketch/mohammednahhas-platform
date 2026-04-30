import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { Settings as GearIcon, Maximize2, Minimize2, PenLine, Play, RefreshCw, Search, Shrink, Trash2, X } from '../../shared/icons/lucide-shim.jsx';
import { db } from '../../services/firebase';
import { getYouTubeID, safeNumber } from '../../shared/utils/media';
import './lecture-player.css';

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

const SecureVideoPlayer = ({ video, user, userName, onClose, onProgress }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [resumeHint, setResumeHint] = useState('');

  const playerShellRef = useRef(null);
  const videoRef = useRef(null);
  const finalUrl = video?.url || video?.file;
  const videoId = getYouTubeID(finalUrl);
  const resumeStorageKey = user?.uid && video?.id ? `nahhas-video-resume-${user.uid}-${video.id}` : '';
  const lastPositionRef = useRef(0);

  const watermarkText = useMemo(() => `${userName || 'طالب'} - ${video?.grade || ''} — منصة النحاس`, [userName, video?.grade]);
  const youtubeEmbedUrl = useMemo(() => {
    if (!videoId) return '';
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      showinfo: '0',
      iv_load_policy: '3',
      loop: '1',
      playlist: videoId,
      playsinline: '1',
      enablejsapi: '1',
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  }, [videoId]);

  const toggleFullscreen = async () => {
    const target = playerShellRef.current;
    const nativeVideo = videoRef.current;

    try {
      if (!document.fullscreenElement && target?.requestFullscreen) {
        await target.requestFullscreen();
        return;
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }
      // iPhone/Safari fallback: native video fullscreen when HTML fullscreen is unavailable.
      if (nativeVideo?.webkitEnterFullscreen) nativeVideo.webkitEnterFullscreen();
      else setIsFullscreen(v => !v);
    } catch (e) {
      if (nativeVideo?.webkitEnterFullscreen) nativeVideo.webkitEnterFullscreen();
      else setIsFullscreen(v => !v);
    }
  };

  const reloadVideo = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime || 0;
      videoRef.current.load();
      videoRef.current.currentTime = currentTime;
      videoRef.current.play?.().catch(() => {});
      return;
    }
    window.location.reload();
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!user || !video?.id) return undefined;
    const q = query(
      collection(db, 'video_notes'),
      where('userId', '==', user.uid),
      where('videoId', '==', video.id),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user, video?.id]);

  useEffect(() => {
    if (!user || !video?.id || videoId) return undefined;
    let cancelled = false;
    const restorePosition = async () => {
      let savedSeconds = 0;
      try {
        const localValue = resumeStorageKey ? Number(localStorage.getItem(resumeStorageKey) || 0) : 0;
        savedSeconds = Number.isFinite(localValue) ? localValue : 0;
        const viewSnap = await getDoc(doc(db, 'video_views', `${user.uid}_${video.id}`));
        const dbSeconds = safeNumber(viewSnap.data()?.lastPositionSeconds, 0);
        savedSeconds = Math.max(savedSeconds, dbSeconds);
      } catch (e) {
        // Firestore rules can block this on some installs; local resume still works.
      }
      if (!cancelled && videoRef.current && savedSeconds > 8) {
        const apply = () => {
          if (!videoRef.current) return;
          const duration = safeNumber(videoRef.current.duration, 0);
          const safeTime = duration > 0 ? Math.min(savedSeconds, Math.max(0, duration - 8)) : savedSeconds;
          videoRef.current.currentTime = safeTime;
          lastPositionRef.current = safeTime;
          setResumeHint(`تم استكمال المحاضرة من الدقيقة ${formatMinSec(safeTime)}`);
          setTimeout(() => setResumeHint(''), 4200);
        };
        if (videoRef.current.readyState >= 1) apply();
        else videoRef.current.addEventListener('loadedmetadata', apply, { once: true });
      }
    };
    restorePosition();
    return () => { cancelled = true; };
  }, [user, video?.id, videoId, resumeStorageKey]);

  useEffect(() => {
    if (!user || !video?.id) return undefined;
    const viewRef = doc(db, 'video_views', `${user.uid}_${video.id}`);
    let timerInterval;
    let localSeconds = 0;
    let lastSyncedSeconds = 0;
    const estimatedDuration = safeNumber(video.durationSeconds, safeNumber(video.estimatedDurationMinutes, 0) * 60);

    const syncToDatabase = async (secondsToAdd, overrideSeconds = null) => {
      const watchedSeconds = overrideSeconds ?? localSeconds;
      const currentDuration = safeNumber(videoRef.current?.duration, estimatedDuration);
      const watchedPercentValue = currentDuration > 0 ? Math.min(100, Math.round((watchedSeconds / currentDuration) * 100)) : 0;
      onProgress?.(video.id, watchedPercentValue, watchedSeconds);
      try {
        await setDoc(viewRef, {
          userId: user.uid,
          userName,
          videoId: video.id,
          videoTitle: video.title,
          viewedAt: serverTimestamp(),
          watchedSeconds: increment(secondsToAdd),
          lastPositionSeconds: Math.round(videoRef.current?.currentTime || watchedSeconds || 0),
          estimatedDuration: currentDuration,
          watchedPercent: watchedPercentValue,
          linkedExamId: video.linkedExamId || null
        }, { merge: true });
      } catch (e) {
        console.error('Sync error:', e);
      }
    };

    syncToDatabase(0, 0);
    timerInterval = setInterval(() => {
      let isPlaying = true;
      if (!videoId && videoRef.current) isPlaying = !videoRef.current.paused && !videoRef.current.ended;
      if (!document.hidden && isPlaying) {
        localSeconds = Math.max(localSeconds + 1, Math.round(videoRef.current?.currentTime || 0));
        lastPositionRef.current = localSeconds;
        if (resumeStorageKey) { try { localStorage.setItem(resumeStorageKey, String(localSeconds)); } catch (e) {} }
        const currentDuration = safeNumber(videoRef.current?.duration, estimatedDuration);
        const currentPercent = currentDuration > 0 ? Math.min(100, Math.round((localSeconds / currentDuration) * 100)) : 0;
        onProgress?.(video.id, currentPercent, localSeconds);
        if (localSeconds - lastSyncedSeconds >= 15) {
          syncToDatabase(localSeconds - lastSyncedSeconds);
          lastSyncedSeconds = localSeconds;
        }
      }
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      const remaining = localSeconds - lastSyncedSeconds;
      if (remaining > 0) syncToDatabase(remaining);
    };
  }, [user, video?.id, video?.title, userName, videoId, video?.durationSeconds, video?.estimatedDurationMinutes, video?.linkedExamId, onProgress]);

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!currentNote.trim() || !user || !video?.id) return;
    await addDoc(collection(db, 'video_notes'), {
      userId: user.uid,
      videoId: video.id,
      text: currentNote.trim(),
      timestamp: videoRef.current?.currentTime || 0,
      createdAt: serverTimestamp()
    });
    setCurrentNote('');
  };

  const handleJumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      return;
    }
    if (videoId) alert('عفواً، ميزة القفز للوقت المحدد تعمل مع الفيديوهات المرفوعة على المنصة فقط وليس يوتيوب.');
  };

  const deleteNote = async (noteId) => {
    if (window.confirm('حذف هذه الملاحظة؟')) await deleteDoc(doc(db, 'video_notes', noteId));
  };

  const formatMinSec = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row items-center justify-center p-0 md:p-4 font-['Cairo']" dir="rtl">
      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="w-full md:w-80 h-1/2 md:h-full bg-white rounded-t-2xl md:rounded-l-none md:rounded-r-2xl flex flex-col shadow-2xl relative z-[70] overflow-hidden">
            <div className="p-4 bg-blue-600 text-white font-bold flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2"><PenLine size={20}/> دفتر الملاحظات</div>
              <button onClick={() => setShowNotes(false)} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
              {notes.length === 0 ? (
                <div className="text-center text-slate-400 mt-10"><PenLine size={40} className="mx-auto mb-2 opacity-50"/><p>لم تضف أي ملاحظات بعد.</p><p className="text-xs mt-1">الملاحظات بتتربط بوقت الفيديو عشان ترجعلها بسرعة.</p></div>
              ) : notes.map(note => (
                <div key={note.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 group">
                  <div className="flex justify-between items-start mb-2">
                    <button onClick={() => handleJumpToTime(note.timestamp)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1"><Play size={10} fill="currentColor"/> الدقيقة {formatMinSec(note.timestamp)}</button>
                    <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                  </div>
                  <p className="text-sm text-slate-700 font-bold whitespace-pre-wrap">{note.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddNote} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
              <textarea className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm focus:border-blue-500 outline-none transition resize-none h-20" placeholder="اكتب ملاحظتك هنا (سيتم حفظها بوقت الفيديو الحالي)..." value={currentNote} onChange={e => setCurrentNote(e.target.value)} />
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl shadow-md hover:bg-blue-700 transition">إضافة الملاحظة</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={playerShellRef} className={`lecture-player-shell w-full h-full md:max-w-7xl bg-black ${showNotes ? 'md:rounded-l-2xl' : 'rounded-xl'} overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col justify-center flex-1 ${isFullscreen ? 'is-fullscreen !max-w-none !rounded-none' : ''}`}>
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

        <div className={`lecture-stage ${showNotes ? 'has-notes-open' : ''}`}>
          <div className="watermark-video smooth-watermark">{watermarkText}</div>
          {resumeHint && <div className="lecture-resume-toast z-[76]">{resumeHint}</div>}
          {isBuffering && !videoId && (
            <div className="lecture-buffering z-[75]">
              <div className="lecture-spinner" />
              <span>جاري تحميل جزء من الفيديو...</span>
            </div>
          )}
          <div className={`lecture-media-frame ${isZoomed ? 'is-zoomed' : ''}`}>
            {videoId ? (
              <iframe className="w-full h-full video-smooth-frame" loading="eager" src={youtubeEmbedUrl} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen />
            ) : (
              <video
                ref={videoRef}
                controls
                controlsList="nodownload noplaybackrate"
                className="w-full h-full object-contain relative z-40 video-smooth-frame"
                src={finalUrl}
                playsInline
                preload="auto"
                disablePictureInPicture
                onWaiting={() => setIsBuffering(true)}
                onStalled={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
                onPlaying={() => setIsBuffering(false)}
                onLoadedMetadata={() => { if (videoRef.current) videoRef.current.playbackRate = playbackRate; }}
                onRateChange={() => setPlaybackRate(videoRef.current?.playbackRate || 1)}
                onTimeUpdate={() => {
                  const current = Math.round(videoRef.current?.currentTime || 0);
                  if (current > 0 && Math.abs(current - lastPositionRef.current) >= 4) {
                    lastPositionRef.current = current;
                    if (resumeStorageKey) { try { localStorage.setItem(resumeStorageKey, String(current)); } catch (e) {} }
                  }
                }}
              >المتصفح لا يدعم هذا الفيديو.</video>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureVideoPlayer;
