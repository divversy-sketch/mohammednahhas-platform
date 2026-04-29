// src/components/video/YouTubeTrackedPlayer.jsx
// إصلاح نهائي: الفيديو يشتغل فورًا.
// التتبع يحاول يشتغل باستخدام YouTube IFrame API، لكن لا يمنع تشغيل الفيديو أبدًا.

import React, { useEffect, useMemo, useRef, useState } from "react";

let ytApiPromise = null;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === "function") previousReady();
        if (window.YT?.Player) resolve(window.YT);
      };

      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.onerror = () => reject(new Error("YouTube API load failed"));
        document.body.appendChild(tag);
      }

      const started = Date.now();
      const poll = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(poll);
          resolve(window.YT);
        }

        if (Date.now() - started > 7000) {
          clearInterval(poll);
          reject(new Error("YouTube API timeout"));
        }
      }, 250);
    });
  }

  return ytApiPromise;
}

const nowIso = () => new Date().toISOString();

const num = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

function cleanVideoId(value = "") {
  const raw = String(value || "").trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    const v = url.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex((p) => p === "embed" || p === "shorts");
    if (embedIndex >= 0 && parts[embedIndex + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[embedIndex + 1])) {
      return parts[embedIndex + 1];
    }
  } catch {}

  const match = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || raw;
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
  updateDoc,
  serverTimestamp,
  increment,
  onProgress
}) {
  const finalVideoId = useMemo(() => {
    return cleanVideoId(videoId || video?.youtubeId || video?.youtubeUrl || video?.url || video?.videoUrl || video?.link);
  }, [videoId, video]);

  const iframeId = useMemo(() => `yt-player-${video?.id || finalVideoId}-${Math.random().toString(36).slice(2)}`, [video?.id, finalVideoId]);

  const playerRef = useRef(null);
  const mountedRef = useRef(false);
  const timersRef = useRef({ tick: null, flush: null });
  const sessionRefRef = useRef(null);

  const [trackingStatus, setTrackingStatus] = useState("جاري تفعيل التتبع...");
  const [apiReady, setApiReady] = useState(false);

  const embedSrc = useMemo(() => {
    if (!finalVideoId) return "";
    return `https://www.youtube.com/embed/${finalVideoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1&playsinline=1`;
  }, [finalVideoId]);

  useEffect(() => {
    if (!finalVideoId || !video?.id || !user?.uid) return;

    mountedRef.current = true;

    const viewId = `${user.uid}_${video.id}`;
    const viewRef = doc(db, "video_views", viewId);
    const sessionRef = doc(collection(db, "video_watch_sessions"));
    sessionRefRef.current = sessionRef;

    let player = null;
    let sessionStartedAtMs = Date.now();
    let started = false;

    let lastState = -1;
    let lastTickMs = Date.now();
    let lastPosition = 0;
    let lastPlaybackPosition = 0;
    let durationSeconds = num(video.durationSeconds, num(video.estimatedDurationMinutes) * 60);

    let realWatchedSeconds = 0;
    let pendingSeconds = 0;
    let skippedSeconds = 0;
    let sessionType = "new_watch";
    let closed = false;

    const getDuration = () => {
      try {
        const d = num(player?.getDuration?.(), durationSeconds);
        if (d > 0) durationSeconds = d;
      } catch {}
      return durationSeconds || 0;
    };

    const getCurrentTime = () => {
      try {
        return num(player?.getCurrentTime?.(), lastPosition);
      } catch {
        return lastPosition;
      }
    };

    const getPercent = () => {
      const d = getDuration();
      return d > 0 ? Math.min(100, Math.round((lastPosition / d) * 100)) : 0;
    };

    const isPlaying = () => {
      return lastState === window.YT?.PlayerState?.PLAYING;
    };

    const startSessionDocs = async () => {
      if (started) return;
      started = true;

      try {
        await setDoc(sessionRef, {
          userId: user.uid,
          userEmail: user.email || "",
          userName: userName || user.displayName || user.email || "طالب",
          videoId: video.id,
          youtubeVideoId: finalVideoId,
          videoTitle: video.title || "",
          linkedExamId: video.linkedExamId || null,
          sessionType,
          openedAt: serverTimestamp(),
          openedAtISO: nowIso(),
          openedAtMs: sessionStartedAtMs,
          startPositionSeconds: lastPosition,
          endPositionSeconds: lastPosition,
          watchedSecondsThisSession: 0,
          realPlaybackSeconds: 0,
          skippedSecondsIgnored: 0,
          videoDurationSeconds: getDuration(),
          playerType: "youtube_iframe_api",
          status: "open"
        }, { merge: true });

        await setDoc(viewRef, {
          userId: user.uid,
          userEmail: user.email || "",
          userName: userName || user.displayName || user.email || "طالب",
          videoId: video.id,
          youtubeVideoId: finalVideoId,
          videoTitle: video.title || "",
          linkedExamId: video.linkedExamId || null,
          estimatedDuration: getDuration(),
          durationSeconds: getDuration(),
          lastOpenedAt: serverTimestamp(),
          lastOpenedAtISO: nowIso(),
          lastPositionSeconds: lastPosition,
          resumeAtSeconds: lastPosition,
          lastSessionId: sessionRef.id,
          playerType: "youtube_iframe_api",
          watchStatus: "watching"
        }, { merge: true });
      } catch (error) {
        console.warn("youtube session start blocked:", error?.message);
        setTrackingStatus("التتبع يحتاج صلاحيات Firestore");
      }
    };

    const restorePosition = async () => {
      try {
        const { getDoc } = await import("firebase/firestore");
        const snap = await getDoc(viewRef);
        if (!snap.exists()) return;

        const data = snap.data() || {};
        const resumeAt = num(data.resumeAtSeconds ?? data.lastPositionSeconds, 0);
        const d = getDuration();

        if (resumeAt > 3 && (!d || resumeAt < d - 5)) {
          sessionType = "resume";
          lastPosition = resumeAt;
          lastPlaybackPosition = resumeAt;
          player?.seekTo?.(resumeAt, true);

          await setDoc(sessionRef, {
            sessionType: "resume",
            resumedFromSeconds: resumeAt,
            resumedFromPercent: d > 0 ? Math.round((resumeAt / d) * 100) : 0
          }, { merge: true });
        }
      } catch (error) {
        console.warn("youtube restore blocked:", error?.message);
      }
    };

    const flush = async (force = false) => {
      if (!mountedRef.current && !force) return;

      const addSeconds = Math.max(0, Math.round(pendingSeconds));
      const percent = getPercent();

      onProgress?.(video.id, percent, lastPosition);

      if (addSeconds <= 0 && !force) return;
      pendingSeconds = 0;

      try {
        await setDoc(viewRef, {
          userId: user.uid,
          userEmail: user.email || "",
          userName: userName || user.displayName || user.email || "طالب",
          videoId: video.id,
          youtubeVideoId: finalVideoId,
          videoTitle: video.title || "",
          viewedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
          lastSeenAtISO: nowIso(),
          watchedSeconds: increment(addSeconds),
          actualWatchedSeconds: increment(addSeconds),
          lastPositionSeconds: lastPosition,
          resumeAtSeconds: lastPosition,
          estimatedDuration: getDuration(),
          durationSeconds: getDuration(),
          watchedPercent: percent,
          linkedExamId: video.linkedExamId || null,
          lastSessionId: sessionRef.id,
          playerType: "youtube_iframe_api",
          watchStatus: "watching"
        }, { merge: true });

        await setDoc(sessionRef, {
          endPositionSeconds: lastPosition,
          watchedSecondsThisSession: Math.round(realWatchedSeconds),
          realPlaybackSeconds: Math.round(realWatchedSeconds),
          skippedSecondsIgnored: Math.round(skippedSeconds),
          videoDurationSeconds: getDuration(),
          watchedPercentThisSession: percent,
          lastUpdatedAt: serverTimestamp(),
          lastUpdatedAtISO: nowIso()
        }, { merge: true });
      } catch (error) {
        console.warn("youtube progress blocked:", error?.message);
        setTrackingStatus("التتبع يحتاج صلاحيات Firestore");
      }
    };

    const closeSession = async () => {
      if (closed || !started) return;
      closed = true;

      try {
        await flush(true);

        await updateDoc(sessionRef, {
          closedAt: serverTimestamp(),
          closedAtISO: nowIso(),
          closedAtMs: Date.now(),
          sessionLengthWallSeconds: Math.max(0, Math.round((Date.now() - sessionStartedAtMs) / 1000)),
          watchedSecondsThisSession: Math.round(realWatchedSeconds),
          realPlaybackSeconds: Math.round(realWatchedSeconds),
          skippedSecondsIgnored: Math.round(skippedSeconds),
          endPositionSeconds: lastPosition,
          videoDurationSeconds: getDuration(),
          watchedPercentThisSession: getPercent(),
          status: "closed"
        });

        await setDoc(viewRef, {
          lastClosedAt: serverTimestamp(),
          lastClosedAtISO: nowIso(),
          lastPositionSeconds: lastPosition,
          resumeAtSeconds: lastPosition,
          watchedPercent: getPercent(),
          watchStatus: getPercent() >= 95 ? "completed" : "paused",
          playerType: "youtube_iframe_api"
        }, { merge: true });
      } catch (error) {
        console.warn("youtube close blocked:", error?.message);
      }
    };

    const tick = () => {
      if (!player) return;

      const now = Date.now();
      const wallDelta = Math.max(0, Math.min(2, (now - lastTickMs) / 1000));
      lastTickMs = now;

      const current = getCurrentTime();
      const playbackDelta = current - lastPlaybackPosition;

      if (isPlaying() && !document.hidden) {
        const jumpedForward = playbackDelta > wallDelta + 2;

        if (jumpedForward) {
          const ignored = Math.max(0, Math.round(playbackDelta - wallDelta));
          skippedSeconds += ignored;

          setDoc(sessionRef, {
            skippedSecondsIgnored: increment(ignored),
            lastSkipDetectedAt: serverTimestamp(),
            lastSkipDetectedAtISO: nowIso()
          }, { merge: true }).catch(() => {});
        } else {
          const valid = Math.max(0, Math.min(wallDelta, Math.max(0, playbackDelta || wallDelta)));
          realWatchedSeconds += valid;
          pendingSeconds += valid;
        }
      }

      lastPlaybackPosition = current;
      lastPosition = current;

      onProgress?.(video.id, getPercent(), lastPosition);
    };

    const initTracking = async () => {
      try {
        const YT = await loadYouTubeApi();

        if (!mountedRef.current) return;

        player = new YT.Player(iframeId, {
          events: {
            onReady: async (event) => {
              player = event.target;
              playerRef.current = player;
              setApiReady(true);
              setTrackingStatus("التتبع مفعل");

              durationSeconds = getDuration();

              await restorePosition();

              lastPosition = getCurrentTime();
              lastPlaybackPosition = lastPosition;
              lastTickMs = Date.now();

              await startSessionDocs();

              timersRef.current.tick = setInterval(tick, 1000);
              timersRef.current.flush = setInterval(() => flush(false), 10000);
            },
            onStateChange: (event) => {
              lastState = event.data;

              if (event.data === YT.PlayerState.PLAYING) {
                lastTickMs = Date.now();
                lastPosition = getCurrentTime();
                lastPlaybackPosition = lastPosition;
                startSessionDocs();
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
              setTrackingStatus("الفيديو يعمل، لكن التتبع الذكي لم يتفعل لهذا الفيديو");
            }
          }
        });

        setTimeout(() => {
          if (!apiReady && mountedRef.current) {
            setTrackingStatus("الفيديو يعمل، جاري محاولة تفعيل التتبع...");
          }
        }, 4000);
      } catch (error) {
        console.warn("YouTube API failed; video still works as normal iframe:", error?.message);
        setTrackingStatus("الفيديو يعمل بدون تتبع دقيق مؤقتًا");
      }
    };

    initTracking();

    const beforeUnload = () => {
      tick();
      closeSession();
    };

    const visibility = () => {
      if (document.hidden) {
        tick();
        flush(true);
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", visibility);
      clearInterval(timersRef.current.tick);
      clearInterval(timersRef.current.flush);
      tick();
      closeSession();
    };
  }, [
    finalVideoId,
    iframeId,
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

  if (!finalVideoId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white font-black">
        رابط YouTube غير صحيح
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        id={iframeId}
        className="w-full h-full"
        src={embedSrc}
        title={video?.title || "YouTube Video"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />

      {trackingStatus && trackingStatus !== "التتبع مفعل" && (
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs md:text-sm px-3 py-2 rounded-xl backdrop-blur pointer-events-none">
          {trackingStatus}
        </div>
      )}
    </div>
  );
}
