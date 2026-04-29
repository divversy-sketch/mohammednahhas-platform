// src/components/video/YouTubeTrackedPlayer.jsx
// YouTube IFrame API tracked player.
// يحسب وقت المشاهدة الحقيقي، يحفظ الاستكمال، ولا يحتسب القفز للأمام كمشاهدة.

import React, { useEffect, useRef, useState } from "react";

let youTubeApiPromise = null;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!youTubeApiPromise) {
    youTubeApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        resolve(window.YT);
      };

      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    });
  }

  return youTubeApiPromise;
}

const nowIso = () => new Date().toISOString();

function formatSafeNumber(safeNumber, value, fallback = 0) {
  try {
    return safeNumber(value, fallback);
  } catch {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
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
  safeNumber = formatSafeNumber
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const mountedRef = useRef(false);

  const [ready, setReady] = useState(false);

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
    let lastDuration = 0;

    let lastPlayerState = -1;
    let restored = false;
    let sessionKind = "new_watch";

    const getCurrentTime = () => {
      try {
        return formatSafeNumber(safeNumber, player?.getCurrentTime?.(), lastKnownPosition);
      } catch {
        return lastKnownPosition;
      }
    };

    const getDuration = () => {
      try {
        const d = formatSafeNumber(
          safeNumber,
          player?.getDuration?.(),
          video.durationSeconds || (Number(video.estimatedDurationMinutes || 0) * 60) || lastDuration
        );
        if (d > 0) lastDuration = d;
        return d || lastDuration || 0;
      } catch {
        return lastDuration || 0;
      }
    };

    const getWatchedPercent = () => {
      const duration = getDuration();
      return duration > 0 ? Math.min(100, Math.round((lastKnownPosition / duration) * 100)) : 0;
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
          videoDurationSeconds: getDuration(),
          playerType: "youtube_iframe_api",
          status: "open"
        }, { merge: true });
      } catch (error) {
        console.warn("youtube watch session start blocked:", error?.message);
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
          estimatedDuration: getDuration(),
          durationSeconds: getDuration(),
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

    const flushProgress = async (force = false) => {
      if (!mountedRef.current && !force) return;

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
          youtubeVideoId: videoId,
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
          playerType: "youtube_iframe_api",
          watchStatus: "watching"
        }, { merge: true });

        await setDoc(sessionRef, {
          endPositionSeconds: lastKnownPosition,
          watchedSecondsThisSession: Math.round(sessionRealSeconds),
          realPlaybackSeconds: Math.round(sessionRealSeconds),
          videoDurationSeconds: duration,
          watchedPercentThisSession: percent,
          lastUpdatedAt: serverTimestamp(),
          lastUpdatedAtISO: nowIso()
        }, { merge: true });
      } catch (error) {
        console.warn("youtube watch progress blocked:", error?.message);
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
          watchedSecondsThisSession: Math.round(sessionRealSeconds),
          realPlaybackSeconds: Math.round(sessionRealSeconds),
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
          watchStatus: percent >= 95 ? "completed" : "paused",
          playerType: "youtube_iframe_api"
        }, { merge: true });
      } catch (error) {
        console.warn("youtube watch close blocked:", error?.message);
      }
    };

    const restorePosition = async () => {
      if (restored || !player?.seekTo) return;
      restored = true;

      try {
        const { getDoc } = await import("firebase/firestore");
        const snap = await getDoc(viewRef);
        if (!snap.exists()) return;

        const data = snap.data() || {};
        const resumeAt = formatSafeNumber(safeNumber, data.resumeAtSeconds ?? data.lastPositionSeconds, 0);
        const duration = getDuration();

        if (resumeAt > 3 && (!duration || resumeAt < duration - 5)) {
          sessionKind = "resume";
          lastKnownPosition = resumeAt;
          lastPlaybackTime = resumeAt;

          player.seekTo(resumeAt, true);

          await setDoc(sessionRef, {
            sessionType: "resume",
            resumedFromSeconds: resumeAt,
            resumedFromPercent: duration > 0 ? Math.round((resumeAt / duration) * 100) : 0
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

      const currentTime = getCurrentTime();
      const playbackDelta = currentTime - lastPlaybackTime;

      if (isPlaying() && !document.hidden) {
        const forwardJump = playbackDelta > deltaWallSeconds + 2;

        if (forwardJump) {
          const ignored = Math.max(0, Math.round(playbackDelta - deltaWallSeconds));
          setDoc(sessionRef, {
            skippedSecondsIgnored: increment(ignored),
            lastSkipDetectedAt: serverTimestamp(),
            lastSkipDetectedAtISO: nowIso()
          }, { merge: true }).catch(() => {});
        } else {
          const validSeconds = Math.max(
            0,
            Math.min(deltaWallSeconds, Math.max(0, playbackDelta || deltaWallSeconds))
          );

          sessionRealSeconds += validSeconds;
          pendingRealSeconds += validSeconds;
        }
      }

      lastPlaybackTime = currentTime;
      lastKnownPosition = currentTime;

      onProgress?.(video.id, getWatchedPercent(), lastKnownPosition);
    };

    const init = async () => {
      const YT = await loadYouTubeIframeApi();
      if (!mountedRef.current || !containerRef.current) return;

      player = new YT.Player(containerRef.current, {
        videoId,
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
            setReady(true);
            lastDuration = getDuration();

            await restorePosition();

            lastKnownPosition = getCurrentTime();
            lastPlaybackTime = lastKnownPosition;

            await writeSessionStart();
            await writeMainViewStart();

            tickTimer = setInterval(tick, 1000);
            flushTimer = setInterval(() => flushProgress(false), 10000);
          },
          onStateChange: (event) => {
            lastPlayerState = event.data;

            if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED ||
              event.data === YT.PlayerState.BUFFERING
            ) {
              tick();
              flushProgress(true);
            }

            if (event.data === YT.PlayerState.PLAYING) {
              lastTickMs = Date.now();
              lastPlaybackTime = getCurrentTime();
              lastKnownPosition = lastPlaybackTime;
            }
          }
        }
      });
    };

    init();

    const handleBeforeUnload = () => {
      tick();
      closeSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        tick();
        flushProgress(true);
      }
    });

    return () => {
      mountedRef.current = false;
      clearInterval(tickTimer);
      clearInterval(flushTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);

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

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white font-bold">
          جاري تجهيز مشغل YouTube الذكي...
        </div>
      )}
    </div>
  );
}
