import { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, getDoc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '@services/firebase';
import { platformNotify, platformConfirm } from '@shared/core/platformShared.jsx';
import { getYouTubeID, safeNumber } from '@shared/utils/media';
import '@features/lectures/lecture-player.css';

import { YT_PLAYING } from '../constants.js';
import { SecureVideoPlayerView } from '../views/SecureVideoPlayerView.jsx';


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
  const [antiSeekHint, setAntiSeekHint] = useState('');
  const [youtubeStarted, setYoutubeStarted] = useState(false);
  const [watchedPercent, setWatchedPercent] = useState(0);

  const playerShellRef = useRef(null);
  const videoRef = useRef(null);
  const finalUrl = video?.url || video?.file;
  const videoId = getYouTubeID(finalUrl);
  const youtubeDomId = useMemo(() => `yt-secure-${Math.random().toString(36).slice(2)}`, []);
  const posterUrl = video?.thumbnailUrl || video?.posterUrl || video?.image || video?.lessonImage || video?.coverImage || '';
  const resumeStorageKey = user?.uid && video?.id ? `nahhas-video-resume-${user.uid}-${video.id}` : '';
  const lastPositionRef = useRef(0);
  const maxAllowedSeekRef = useRef(0);
  const youtubePlayerRef = useRef(null);
  const youtubeTimerRef = useRef(null);
  const pendingResumeSecondsRef = useRef(0);
  const resumeAppliedRef = useRef(false);

  const watermarkText = useMemo(() => `${userName || 'طالب'} - ${video?.grade || ''} — منصة النحاس`, [userName, video?.grade]);
  

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
    if (!videoId) return undefined;
    let cancelled = false;
    const estimatedDuration = safeNumber(video.durationSeconds, safeNumber(video.estimatedDurationMinutes, 0) * 60);
    const loadYouTubeApi = () => new Promise((resolve) => {
      if (window.YT?.Player) return resolve();
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
    });

    const tickYouTube = () => {
      const player = youtubePlayerRef.current;
      if (!player?.getCurrentTime) return;
      const current = Math.floor(player.getCurrentTime() || 0);
      const duration = Math.floor(player.getDuration?.() || estimatedDuration || 0);
      if (current > Math.max(maxAllowedSeekRef.current + 6, 10)) {
        player.seekTo(Math.max(0, maxAllowedSeekRef.current), true);
        setAntiSeekHint('تم منع تقديم الفيديو. شاهد بالترتيب حتى تتحسب النسبة صح.');
        setTimeout(() => setAntiSeekHint(''), 3500);
        return;
      }
      maxAllowedSeekRef.current = Math.max(maxAllowedSeekRef.current, current);
      lastPositionRef.current = maxAllowedSeekRef.current;
      const percentValue = duration > 0 ? clampPercent((maxAllowedSeekRef.current / duration) * 100) : 0;
      setWatchedPercent(percentValue);
    };

    loadYouTubeApi().then(() => {
      if (cancelled) return;
      youtubePlayerRef.current = new window.YT.Player(youtubeDomId, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1, enablejsapi: 1, controls: 1, disablekb: 1, fs: 1 },
        events: {
          onReady: () => {
            const saved = Math.round(pendingResumeSecondsRef.current || maxAllowedSeekRef.current || 0);
            if (saved > 8 && !resumeAppliedRef.current) {
              try { youtubePlayerRef.current?.seekTo?.(saved, true); } catch {}
              resumeAppliedRef.current = true;
              setResumeHint(`تم استكمال المحاضرة من الدقيقة ${formatMinSec(saved)}`);
              setTimeout(() => setResumeHint(''), 4200);
            }
            tickYouTube();
          },
          onStateChange: (event) => {
            clearInterval(youtubeTimerRef.current);
            if (event.data === YT_PLAYING) youtubeTimerRef.current = setInterval(tickYouTube, 1000);
            else tickYouTube();
          }
        }
      });
    });

    return () => {
      cancelled = true;
      clearInterval(youtubeTimerRef.current);
      try { youtubePlayerRef.current?.destroy?.(); } catch {}
      youtubePlayerRef.current = null;
    };
  }, [videoId, youtubeDomId, video?.durationSeconds, video?.estimatedDurationMinutes]);

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
    if (!user || !video?.id) return undefined;
    let cancelled = false;
    const restorePosition = async () => {
      let savedSeconds = 0;
      try {
        const localValue = resumeStorageKey ? Number(localStorage.getItem(resumeStorageKey) || 0) : 0;
        savedSeconds = Number.isFinite(localValue) ? localValue : 0;
        const viewSnap = await getDoc(doc(db, 'video_views', `${user.uid}_${video.id}`));
        const data = viewSnap.data() || {};
        const dbSeconds = Math.max(
          safeNumber(data.lastPositionSeconds, 0),
          safeNumber(data.maxWatchedSeconds, 0),
          safeNumber(data.watchedSeconds, 0)
        );
        savedSeconds = Math.max(savedSeconds, dbSeconds);
        const storedPercent = safeNumber(data.watchedPercent ?? data.watchPercent ?? data.percent, -1);
        if (storedPercent >= 0) setWatchedPercent(clampPercent(storedPercent));
      } catch (e) {
        // Firestore rules can block this on some installs; local resume still works.
      }
      if (!cancelled && videoId && savedSeconds > 8) {
        pendingResumeSecondsRef.current = savedSeconds;
        maxAllowedSeekRef.current = savedSeconds;
        lastPositionRef.current = savedSeconds;
        if (youtubePlayerRef.current?.seekTo && !resumeAppliedRef.current) {
          try { youtubePlayerRef.current.seekTo(savedSeconds, true); } catch {}
          resumeAppliedRef.current = true;
          setResumeHint(`تم استكمال المحاضرة من الدقيقة ${formatMinSec(savedSeconds)}`);
        } else {
          setResumeHint(`تم حفظ تقدمك السابق حتى الدقيقة ${formatMinSec(savedSeconds)}`);
        }
        setTimeout(() => setResumeHint(''), 4200);
      }
      if (!cancelled && !videoId && videoRef.current && savedSeconds > 8) {
        const apply = () => {
          if (!videoRef.current) return;
          const duration = safeNumber(videoRef.current.duration, 0);
          const safeTime = duration > 0 ? Math.min(savedSeconds, Math.max(0, duration - 8)) : savedSeconds;
          videoRef.current.currentTime = safeTime;
          lastPositionRef.current = safeTime;
          maxAllowedSeekRef.current = safeTime;
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
    let localSeconds = Math.round(maxAllowedSeekRef.current || 0);
    let lastSyncedSeconds = localSeconds;
    const estimatedDuration = safeNumber(video.durationSeconds, safeNumber(video.estimatedDurationMinutes, 0) * 60);

    const syncToDatabase = async (secondsToAdd, overrideSeconds = null) => {
      const watchedSeconds = Math.max(overrideSeconds ?? localSeconds, maxAllowedSeekRef.current || 0);
      const currentDuration = videoId ? safeNumber(youtubePlayerRef.current?.getDuration?.(), estimatedDuration) : safeNumber(videoRef.current?.duration, estimatedDuration);
      const watchedPercentValue = currentDuration > 0 ? Math.min(100, Math.round((watchedSeconds / currentDuration) * 100)) : watchedPercent;
      const localProgressPayload = {
        videoId: video.id,
        title: video.title || 'محاضرة',
        grade: video.grade || '',
        watchedSeconds,
        lastPositionSeconds: watchedSeconds,
        maxWatchedSeconds: watchedSeconds,
        watchedPercent: watchedPercentValue,
        percent: watchedPercentValue,
        estimatedDuration: currentDuration,
        videoDuration: currentDuration,
        updatedAt: Date.now()
      };
      try {
        if (resumeStorageKey) {
          localStorage.setItem(resumeStorageKey, String(Math.round(watchedSeconds || 0)));
          localStorage.setItem(`nahhas-video-progress-${user.uid}-${video.id}`, JSON.stringify(localProgressPayload));
          localStorage.setItem(`nahhas-latest-video-${user.uid}`, JSON.stringify(localProgressPayload));
        }
      } catch (e) {}
      onProgress?.(video.id, watchedPercentValue, watchedSeconds, { estimatedDuration: currentDuration, videoDuration: currentDuration, videoTitle: video.title, lastPositionSeconds: watchedSeconds, maxWatchedSeconds: watchedSeconds });
      try {
        await setDoc(viewRef, {
          userId: user.uid,
          userName,
          videoId: video.id,
          videoTitle: video.title,
          viewedAt: serverTimestamp(),
          watchedSeconds: increment(Math.max(0, secondsToAdd)),
          lastPositionSeconds: Math.round(watchedSeconds || 0),
          maxWatchedSeconds: Math.round(watchedSeconds || 0),
          estimatedDuration: currentDuration,
          watchedPercent: watchedPercentValue,
          linkedExamId: video.linkedExamId || null
        }, { merge: true });
      } catch (e) {
        console.error('Sync error:', e);
      }
    };

    timerInterval = setInterval(() => {
      let isPlaying = true;
      if (videoId) isPlaying = youtubePlayerRef.current?.getPlayerState?.() === YT_PLAYING;
      if (!videoId && videoRef.current) isPlaying = !videoRef.current.paused && !videoRef.current.ended;
      if (!document.hidden && isPlaying) {
        const actualSecond = videoId ? Math.round(youtubePlayerRef.current?.getCurrentTime?.() || 0) : Math.round(videoRef.current?.currentTime || 0);
        if (actualSecond > Math.max(maxAllowedSeekRef.current + 6, 10)) {
          if (videoId) youtubePlayerRef.current?.seekTo?.(maxAllowedSeekRef.current, true);
          else if (videoRef.current) videoRef.current.currentTime = maxAllowedSeekRef.current;
          setAntiSeekHint('تم منع تقديم الفيديو. شاهد بالترتيب حتى تتحسب النسبة صح.');
          setTimeout(() => setAntiSeekHint(''), 3500);
          return;
        }
        maxAllowedSeekRef.current = Math.max(maxAllowedSeekRef.current, actualSecond, localSeconds + 1);
        localSeconds = maxAllowedSeekRef.current;
        lastPositionRef.current = localSeconds;
        const currentDuration = videoId ? safeNumber(youtubePlayerRef.current?.getDuration?.(), estimatedDuration) : safeNumber(videoRef.current?.duration, estimatedDuration);
        const currentPercent = currentDuration > 0 ? clampPercent((localSeconds / currentDuration) * 100) : 0;
        if (resumeStorageKey) {
          try {
            const localProgressPayload = {
              videoId: video.id,
              title: video.title || 'محاضرة',
              grade: video.grade || '',
              watchedSeconds: localSeconds,
              lastPositionSeconds: localSeconds,
              maxWatchedSeconds: localSeconds,
              watchedPercent: currentPercent,
              percent: currentPercent,
              estimatedDuration: currentDuration,
              videoDuration: currentDuration,
              updatedAt: Date.now()
            };
            localStorage.setItem(resumeStorageKey, String(localSeconds));
            localStorage.setItem(`nahhas-video-progress-${user.uid}-${video.id}`, JSON.stringify(localProgressPayload));
            localStorage.setItem(`nahhas-latest-video-${user.uid}`, JSON.stringify(localProgressPayload));
          } catch (e) {}
        }
        setWatchedPercent(currentPercent);
        onProgress?.(video.id, currentPercent, localSeconds, { estimatedDuration: currentDuration, videoTitle: video.title, lastPositionSeconds: localSeconds });
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
    if (videoId) platformNotify('عفواً، ميزة القفز للوقت المحدد تعمل مع الفيديوهات المرفوعة على المنصة فقط وليس يوتيوب.', 'error');
  };

  const deleteNote = async (noteId) => {
    if (platformConfirm('حذف هذه الملاحظة؟')) await deleteDoc(doc(db, 'video_notes', noteId));
  };

  const formatMinSec = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return <SecureVideoPlayerView ctx={{
    showNotes, notes, currentNote, setCurrentNote, setShowNotes, handleAddNote,
    handleJumpToTime, deleteNote, formatMinSec, playerShellRef, isZoomed, setIsZoomed,
    isFullscreen, toggleFullscreen, videoId, reloadVideo, showSettings, setShowSettings,
    changeSpeed, playbackRate, onClose, watermarkText, resumeHint, antiSeekHint,
    isBuffering, youtubeDomId, posterUrl, youtubeStarted, pendingResumeSecondsRef,
    maxAllowedSeekRef, youtubePlayerRef, resumeAppliedRef, setYoutubeStarted, video,
    videoRef, finalUrl, setIsBuffering, setPlaybackRate, watchedPercent, setWatchedPercent,
    lastPositionRef, resumeStorageKey, user,
  }} />;
};

export default SecureVideoPlayer;
