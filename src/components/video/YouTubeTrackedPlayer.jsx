// src/components/video/YouTubeTrackedPlayer.jsx
// مشغل YouTube ذكي: يعمل بالـ YouTube IFrame API للتتبع، ومعه fallback iframe لو الـ API اتأخر.

import React, { useEffect, useRef, useState } from "react";

let youTubeApiPromise = null;

function loadYouTubeIframeApi(timeoutMs = 8000) {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!youTubeApiPromise) {
    youTubeApiPromise = new Promise((resolve, reject) => {
      const done = () => {
        if (window.YT?.Player) resolve(window.YT);
      };

      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        done();
      };

      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.onerror = () => reject(new Error("YouTube API failed to load"));
        document.body.appendChild(tag);
      }

      const poll = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(poll);
          done();
        }
      }, 300);

      setTimeout(() => {
        clearInterval(poll);
        if (window.YT?.Player) done();
        else reject(new Error("YouTube API timeout"));
      }, timeoutMs);
    });
  }

  return youTubeApiPromise;
}

const nowIso = () => new Date().toISOString();

function getNumber(fn, fallback = 0) {
  try {
    const n = Number(fn());
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function getDateMs(value) {
  if (!value) return 0;
  if (value?.seconds) return value.seconds * 1000;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export default function YouTubeTrackedPlayer({
  videoId,
  video,
  user,
  userName,
  db,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  onProgress,
  safeNumber = (v, f = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : f;
  }
}) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const mountedRef = useRef(false);
  const sessionCloseRef = useRef(null);

  const [fallbackIframe, setFallbackIframe] = useState(false);
  const [message, setMessage] = useState("جاري تجهيز مشغل YouTube الذكي...");

  useEffect(() => {
    if (!videoId || !video?.id || !user?.uid) return;

    mountedRef.current = true;

    const viewId = `${user.uid}_${video.id}`;
    const viewRef = doc(db, "video_views", viewId);
    const sessionRef = doc(collection(db, "video_watch_sessions"));

    let tickTimer = null;
    let flushTimer = null;
    let player = null;

    let sessionStartedAtMs = Date.now();
    let sessionRealSeconds = 0;
    let pendingRealSeconds = 0;
    let lastTickMs = Date.now();
    let lastPlaybackTime = 0;
    let lastKnownPosition = 0;
    let lastDuration = safeNumber(video.durationSeconds, safeNumber(video.estimatedDurationMinutes, 0) * 60);
    let lastPlayerState = -1;
    let restored = false;
    let sessionKind = "new_watch";
    let skippedSecondsIgnoredTotal = 0;
    let started = false;

    const duration = () => {
      const d = getNumber(() => player?.getDuration?.(), lastDuration);
      if (d > 0) lastDuration = d;
      return lastDuration || 0;
    };

    const currentTime = () => getNumber(() => player?.getCurrentTime?.(), lastKnownPosition);

    const percent = () => {
      const d = duration();
      return d > 0 ? Math.min(100, Math.round((lastKnownPosition / d) * 100)) : 0;
    };

    const isPlaying = () => lastPlayerState === window.YT?.PlayerState?.PLAYING;

    const writeSessionStart = async () => {
      try {
        await setDoc(sessionRef, {
          userId: user.uid,
          userEmail: user.email || "",
          userName: userName || user.displayName || user.email || "طالب",
          videoId: video.id,
          youtubeVideoId: videoId,
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
          videoDurationSeconds: duration(),
          playerType: "youtube_iframe_api",
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
          youtubeVideoId: videoId,
          videoTitle: video.title || "",
          linkedExamId: video.linkedExamId || null,
          estimatedDuration: duration(),
          durationSeconds: duration(),
          lastOpenedAt: serverTimestamp(),
          lastOpenedAtISO: nowIso(),
          lastPositionSeconds: lastKnownPosition,
          resumeAtSeconds: lastKnownPosition,
          lastSessionId: sessionRef.id,
          playerType: "youtube_iframe_api",
          watchStatus: "watching"
        }, { merge: true });
      } catch (error) {
        console.warn("youtube view start blocked:", error?.message);
      }
    };

    const flush = async (force = false) => {
      if (!mountedRef.current && !force) return;

      const secondsToAdd = Math.max(0, Math.round(pendingRealSeconds));
      const p = percent();

      onProgress?.(video.id, p, lastKnownPosition);

      if (secondsToAdd <= 0 && !force) return;

      pendingRealSeconds = 0;

      try {
        await setDoc(viewRef, {
          userId: user.uid,
          userEmail: user.email || "",
          userName: userName || user.displayName || user.email || "طالب",
          videoId: video.id,
          youtubeVideoId: videoId,
          videoTitle: video.title || "",
          viewedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
          lastSeenAtISO: nowIso(),
          watchedSeconds: increment(secondsToAdd),
          actualWatchedSeconds: increment(secondsToAdd),
          lastPositionSeconds: lastKnownPosition,
          resumeAtSeconds: lastKnownPosition,
          estimatedDuration: duration(),
          durationSeconds: duration(),
          watchedPercent: p,
          linkedExamId: video.linkedExamId || null,
          lastSessionId: sessionRef.id,
          playerType: "youtube_iframe_api",
          watchStatus: "watching"
        }, { merge: true });

        await setDoc(sessionRef, {
          endPositionSeconds: lastKnownPosition,
          watchedSecondsThisSession: Math.round(sessionRealSeconds),
          realPlaybackSeconds: Math.round(sessionRealSeconds),
          skippedSecondsIgnored: Math.round(skippedSecondsIgnoredTotal),
          videoDurationSeconds: duration(),
          watchedPercentThisSession: p,
          lastUpdatedAt: serverTimestamp(),
          lastUpdatedAtISO: nowIso()
        }, { merge: true });
      } catch (error) {
        console.warn("youtube watch progress blocked:", error?.message);
      }
    };

    const closeSession = async () => {
      if (!started) return;
      const p = percent();

      try {
        await flush(true);

        await updateDoc(sessionRef, {
          closedAt: serverTimestamp(),
          closedAtISO: nowIso(),
          closedAtMs: Date.now(),
          sessionLengthWallSeconds: Math.max(0, Math.round((Date.now() - sessionStartedAtMs) / 1000)),
          watchedSecondsThisSession: Math.round(sessionRealSeconds),
          realPlaybackSeconds: Math.round(sessionRealSeconds),
          skippedSecondsIgnored: Math.round(skippedSecondsIgnoredTotal),
          endPositionSeconds: lastKnownPosition,
          videoDurationSeconds: duration(),
          watchedPercentThisSession: p,
          status: "closed"
        });

        await setDoc(viewRef, {
          lastClosedAt: serverTimestamp(),
          lastClosedAtISO: nowIso(),
          lastPositionSeconds: lastKnownPosition,
          resumeAtSeconds: lastKnownPosition,
          watchedPercent: p,
          watchStatus: p >= 95 ? "completed" : "paused",
          playerType: "youtube_iframe_api"
        }, { merge: true });
      } catch (error) {
        console.warn("youtube watch close blocked:", error?.message);
      }
    };

    sessionCloseRef.current = closeSession;

    const restorePosition = async () => {
      if (restored || !player?.seekTo) return;
      restored = true;

      try {
        const { getDoc } = await import("firebase/firestore");
        const snap = await getDoc(viewRef);
        if (!snap.exists()) return;

        const data = snap.data() || {};
        const resumeAt = safeNumber(data.resumeAtSeconds ?? data.lastPositionSeconds, 0);
        const d = duration();

        if (resumeAt > 3 && (!d || resumeAt < d - 5)) {
          sessionKind = "resume";
          lastKnownPosition = resumeAt;
          lastPlaybackTime = resumeAt;
          player.seekTo(resumeAt, true);

          await setDoc(sessionRef, {
            sessionType: "resume",
            resumedFromSeconds: resumeAt,
            resumedFromPercent: d > 0 ? Math.round((resumeAt / d) * 100) : 0
          }, { merge: true });
        }
      } catch (error) {
        console.warn("youtube resume restore blocked:", error?.message);
      }
    };

    const tick = () => {
      if (!mountedRef.current || !player) return;

      const now = Date.now();
      const deltaWallSeconds = Math.max(0, Math.min(2, (now - lastTickMs) / 1000));
      lastTickMs = now;

      const ct = currentTime();
      const playbackDelta = ct - lastPlaybackTime;

      if (isPlaying() && !document.hidden) {
        const forwardJump = playbackDelta > deltaWallSeconds + 2;

        if (forwardJump) {
          const ignored = Math.max(0, Math.round(playbackDelta - deltaWallSeconds));
          skippedSecondsIgnoredTotal += ignored;

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

      lastPlaybackTime = ct;
      lastKnownPosition = ct;
      onProgress?.(video.id, percent(), lastKnownPosition);
    };

    const startTracking = async () => {
      if (started) return;
      started = true;
      await restorePosition();

      lastKnownPosition = currentTime();
      lastPlaybackTime = lastKnownPosition;

      await writeSessionStart();
      await writeMainViewStart();

      tickTimer = setInterval(tick, 1000);
      flushTimer = setInterval(() => flush(false), 10000);
    };

    const init = async () => {
      try {
        const YT = await loadYouTubeIframeApi();
        if (!mountedRef.current || !hostRef.current) return;

        player = new YT.Player(hostRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: async () => {
              playerRef.current = player;
              setMessage("");
              lastDuration = duration();
              await startTracking();
            },
            onStateChange: (event) => {
              lastPlayerState = event.data;

              if (event.data === YT.PlayerState.PLAYING) {
                lastTickMs = Date.now();
                lastPlaybackTime = currentTime();
                lastKnownPosition = lastPlaybackTime;
                startTracking();
              }

              if (
                event.data === YT.PlayerState.PAUSED ||
                event.data === YT.PlayerState.ENDED ||
                event.data === YT.PlayerState.BUFFERING
              ) {
                tick();
                flush(true);
              }
            },
            onError: () => {
              setFallbackIframe(true);
              setMessage("");
            }
          }
        });
      } catch (error) {
        console.warn("youtube iframe api unavailable, fallback to iframe:", error?.message);
        setFallbackIframe(true);
        setMessage("");
      }
    };

    init();

    const handleBeforeUnload = () => {
      tick();
      closeSession();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        tick();
        flush(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      clearInterval(tickTimer);
      clearInterval(flushTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);

      tick();
      closeSession();

      try {
        player?.destroy?.();
      } catch {}
    };
  }, [
    videoId,
    video?.id,
    video?.title,
    video?.durationSeconds,
    video?.estimatedDurationMinutes,
    video?.linkedExamId,
    user?.uid,
    user?.email,
    userName,
    onProgress
  ]);

  if (fallbackIframe) {
    return (
      <iframe
        className="w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
        title="YouTube Video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={hostRef} className="w-full h-full" />

      {message && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white font-bold">
          {message}
        </div>
      )}
    </div>
  );
}
