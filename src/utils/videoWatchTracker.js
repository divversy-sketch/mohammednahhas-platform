// src/utils/videoWatchTracker.js
// نظام تتبع مشاهدة الفيديوهات بدقة.
// الهدف:
// - حساب وقت المشاهدة الحقيقي فقط أثناء تشغيل الفيديو.
// - عدم حساب القفز للأمام كوقت مشاهدة.
// - حفظ آخر ثانية وقف عندها الطالب للاستكمال.
// - إنشاء جلسة منفصلة لكل فتح/استكمال للفيديو.

const nowIso = () => new Date().toISOString();

const getSafeDuration = (safeNumber, videoRef, estimatedDuration) => {
  return safeNumber(
    videoRef?.current?.duration,
    safeNumber(estimatedDuration, 0)
  );
};

export function createVideoWatchTracker({
  db,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  user,
  userName,
  video,
  videoId,
  videoRef,
  estimatedDuration = 0,
  onProgress,
  safeNumber = (v, f = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : f;
  }
}) {
  const viewId = `${user.uid}_${video.id}`;
  const viewRef = doc(db, "video_views", viewId);
  const sessionRef = doc(collection(db, "video_watch_sessions"));

  let mounted = false;
  let tickTimer = null;
  let flushTimer = null;

  let sessionStartedAtMs = Date.now();
  let sessionRealSeconds = 0;
  let pendingRealSeconds = 0;

  let lastPlaybackTime = 0;
  let lastKnownPosition = 0;
  let lastTickMs = Date.now();

  let restoredPosition = false;
  let sessionKind = "new_watch";

  const isYoutube = Boolean(videoId);

  const getCurrentTime = () => {
    if (isYoutube) return lastKnownPosition;
    return safeNumber(videoRef?.current?.currentTime, lastKnownPosition);
  };

  const getDuration = () => getSafeDuration(safeNumber, videoRef, estimatedDuration);

  const getWatchedPercent = () => {
    const duration = getDuration();
    return duration > 0 ? Math.min(100, Math.round((lastKnownPosition / duration) * 100)) : 0;
  };

  const writeSessionStart = async () => {
    try {
      await setDoc(sessionRef, {
        userId: user.uid,
        userEmail: user.email || "",
        userName: userName || user.displayName || user.email || "طالب",
        videoId: video.id,
        videoTitle: video.title || "",
        linkedExamId: video.linkedExamId || null,
        sessionType: sessionKind,
        openedAt: serverTimestamp(),
        openedAtISO: nowIso(),
        openedAtMs: sessionStartedAtMs,
        startPositionSeconds: lastKnownPosition,
        endPositionSeconds: lastKnownPosition,
        watchedSecondsThisSession: 0,
        realPlaybackSeconds: 0,
        skippedSecondsIgnored: 0,
        videoDurationSeconds: getDuration(),
        status: "open"
      }, { merge: true });
    } catch (error) {
      console.warn("video watch session start blocked:", error?.message);
    }
  };

  const writeMainViewStart = async () => {
    try {
      await setDoc(viewRef, {
        userId: user.uid,
        userEmail: user.email || "",
        userName: userName || user.displayName || user.email || "طالب",
        videoId: video.id,
        videoTitle: video.title || "",
        linkedExamId: video.linkedExamId || null,
        estimatedDuration: getDuration(),
        durationSeconds: getDuration(),
        lastOpenedAt: serverTimestamp(),
        lastOpenedAtISO: nowIso(),
        lastPositionSeconds: lastKnownPosition,
        lastSessionId: sessionRef.id,
        watchStatus: "watching"
      }, { merge: true });
    } catch (error) {
      console.warn("video view start blocked:", error?.message);
    }
  };

  const flushProgress = async (force = false) => {
    if (!mounted && !force) return;

    const secondsToAdd = Math.max(0, Math.round(pendingRealSeconds));
    const duration = getDuration();
    const percent = getWatchedPercent();

    onProgress?.(video.id, percent, lastKnownPosition);

    if (secondsToAdd <= 0 && !force) return;

    pendingRealSeconds = 0;

    try {
      await setDoc(viewRef, {
        userId: user.uid,
        userEmail: user.email || "",
        userName: userName || user.displayName || user.email || "طالب",
        videoId: video.id,
        videoTitle: video.title || "",
        viewedAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
        lastSeenAtISO: nowIso(),
        watchedSeconds: increment(secondsToAdd),
        actualWatchedSeconds: increment(secondsToAdd),
        lastPositionSeconds: lastKnownPosition,
        resumeAtSeconds: lastKnownPosition,
        estimatedDuration: duration,
        durationSeconds: duration,
        watchedPercent: percent,
        linkedExamId: video.linkedExamId || null,
        lastSessionId: sessionRef.id,
        watchStatus: "watching"
      }, { merge: true });

      await setDoc(sessionRef, {
        endPositionSeconds: lastKnownPosition,
        watchedSecondsThisSession: sessionRealSeconds,
        realPlaybackSeconds: sessionRealSeconds,
        videoDurationSeconds: duration,
        watchedPercentThisSession: percent,
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedAtISO: nowIso()
      }, { merge: true });
    } catch (error) {
      console.warn("video watch progress blocked:", error?.message);
    }
  };

  const closeSession = async () => {
    const duration = getDuration();
    const percent = getWatchedPercent();

    try {
      await flushProgress(true);

      await updateDoc(sessionRef, {
        closedAt: serverTimestamp(),
        closedAtISO: nowIso(),
        closedAtMs: Date.now(),
        sessionLengthWallSeconds: Math.max(0, Math.round((Date.now() - sessionStartedAtMs) / 1000)),
        watchedSecondsThisSession: sessionRealSeconds,
        realPlaybackSeconds: sessionRealSeconds,
        endPositionSeconds: lastKnownPosition,
        videoDurationSeconds: duration,
        watchedPercentThisSession: percent,
        status: "closed"
      });

      await setDoc(viewRef, {
        lastClosedAt: serverTimestamp(),
        lastClosedAtISO: nowIso(),
        lastPositionSeconds: lastKnownPosition,
        resumeAtSeconds: lastKnownPosition,
        watchedPercent: percent,
        watchStatus: percent >= 95 ? "completed" : "paused"
      }, { merge: true });
    } catch (error) {
      console.warn("video watch close blocked:", error?.message);
    }
  };

  const restoreLocalVideoPosition = async () => {
    if (isYoutube || restoredPosition || !videoRef?.current) return;
    restoredPosition = true;

    try {
      const snap = await import("firebase/firestore").then(({ getDoc }) => getDoc(viewRef));
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const resumeAt = safeNumber(data.resumeAtSeconds ?? data.lastPositionSeconds, 0);
      const duration = getDuration();

      if (resumeAt > 3 && (!duration || resumeAt < duration - 5)) {
        videoRef.current.currentTime = resumeAt;
        lastKnownPosition = resumeAt;
        lastPlaybackTime = resumeAt;
        sessionKind = "resume";
        await setDoc(sessionRef, {
          sessionType: "resume",
          resumedFromSeconds: resumeAt,
          resumedFromPercent: duration > 0 ? Math.round((resumeAt / duration) * 100) : 0
        }, { merge: true });
      }
    } catch (error) {
      console.warn("video resume restore blocked:", error?.message);
    }
  };

  const tick = () => {
    if (!mounted) return;

    const now = Date.now();
    const deltaWallSeconds = Math.max(0, Math.min(2, (now - lastTickMs) / 1000));
    lastTickMs = now;

    let playing = true;
    let currentTime = getCurrentTime();

    if (!isYoutube && videoRef?.current) {
      playing =
        !document.hidden &&
        !videoRef.current.paused &&
        !videoRef.current.ended &&
        videoRef.current.readyState >= 2;

      currentTime = safeNumber(videoRef.current.currentTime, lastKnownPosition);
    } else {
      playing = !document.hidden;
    }

    const playbackDelta = currentTime - lastPlaybackTime;
    const forwardJump = playbackDelta > deltaWallSeconds + 2;

    if (playing) {
      if (forwardJump) {
        // الطالب قدم الفيديو للأمام: لا نحسب الفرق كوقت مشاهدة.
        const ignored = Math.max(0, Math.round(playbackDelta - deltaWallSeconds));
        setDoc(sessionRef, {
          skippedSecondsIgnored: increment(ignored),
          lastSkipDetectedAt: serverTimestamp(),
          lastSkipDetectedAtISO: nowIso()
        }, { merge: true }).catch(() => {});
      } else {
        const validSeconds = Math.max(0, Math.min(deltaWallSeconds, Math.max(0, playbackDelta || deltaWallSeconds)));
        sessionRealSeconds += validSeconds;
        pendingRealSeconds += validSeconds;
      }
    }

    lastPlaybackTime = currentTime;
    lastKnownPosition = currentTime;

    onProgress?.(video.id, getWatchedPercent(), lastKnownPosition);
  };

  const onLoadedMetadata = () => {
    restoreLocalVideoPosition();
    const currentTime = getCurrentTime();
    lastPlaybackTime = currentTime;
    lastKnownPosition = currentTime;
    flushProgress(false);
  };

  const onSeeking = () => {
    const currentTime = getCurrentTime();
    const jump = currentTime - lastKnownPosition;
    if (jump > 2) {
      setDoc(sessionRef, {
        skippedSecondsIgnored: increment(Math.round(jump)),
        lastSkipDetectedAt: serverTimestamp(),
        lastSkipDetectedAtISO: nowIso()
      }, { merge: true }).catch(() => {});
    }
    lastPlaybackTime = currentTime;
    lastKnownPosition = currentTime;
  };

  const onPauseOrEnded = () => {
    tick();
    flushProgress(true);
  };

  const addVideoListeners = () => {
    if (isYoutube || !videoRef?.current) return;

    videoRef.current.addEventListener("loadedmetadata", onLoadedMetadata);
    videoRef.current.addEventListener("seeking", onSeeking);
    videoRef.current.addEventListener("pause", onPauseOrEnded);
    videoRef.current.addEventListener("ended", onPauseOrEnded);
  };

  const removeVideoListeners = () => {
    if (isYoutube || !videoRef?.current) return;

    videoRef.current.removeEventListener("loadedmetadata", onLoadedMetadata);
    videoRef.current.removeEventListener("seeking", onSeeking);
    videoRef.current.removeEventListener("pause", onPauseOrEnded);
    videoRef.current.removeEventListener("ended", onPauseOrEnded);
  };

  const start = async () => {
    mounted = true;
    sessionStartedAtMs = Date.now();
    lastTickMs = Date.now();
    lastKnownPosition = getCurrentTime();
    lastPlaybackTime = lastKnownPosition;

    await writeSessionStart();
    await writeMainViewStart();

    addVideoListeners();
    restoreLocalVideoPosition();

    tickTimer = setInterval(tick, 1000);
    flushTimer = setInterval(() => flushProgress(false), 10000);
  };

  const stop = () => {
    mounted = false;
    removeVideoListeners();
    clearInterval(tickTimer);
    clearInterval(flushTimer);
    tick();
    closeSession();
  };

  return { start, stop };
}
