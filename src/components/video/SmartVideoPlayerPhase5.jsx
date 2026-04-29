// src/components/video/SmartVideoPlayerPhase5.jsx
// مشغل فيديو بسيط وسريع: YouTube أساسي + Vimeo احتياطي + استكمال بسيط بدون ضغط.

import React, { useEffect, useMemo, useRef, useState } from "react";

function extractYouTubeId(url = "") {
  const raw = String(url || "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || "";
}

function extractVimeoId(url = "") {
  const raw = String(url || "").trim();
  if (/^\d+$/.test(raw)) return raw;
  const match = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] || "";
}

function getVideoType(video = {}, mode = "") {
  const url = String(video.url || video.file || video.videoUrl || video.link || "");
  if (mode === "vimeo" || video.provider === "vimeo" || url.includes("vimeo.com")) return "vimeo";
  if (mode === "youtube" || video.provider === "youtube" || url.includes("youtube") || url.includes("youtu.be")) return "youtube";
  return "direct";
}

const n = (v, f = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : f;
};

export default function SmartVideoPlayerPhase5({
  video,
  user,
  userName,
  db,
  doc,
  setDoc,
  serverTimestamp,
  mode = "",
  onProgress
}) {
  const playerRef = useRef(null);
  const [resumeAt, setResumeAt] = useState(0);
  const [showResume, setShowResume] = useState(false);

  const type = useMemo(() => getVideoType(video, mode), [video, mode]);
  const url = String(video?.url || video?.file || video?.videoUrl || video?.link || "");
  const youtubeId = useMemo(() => extractYouTubeId(url || video?.youtubeId), [url, video]);
  const vimeoId = useMemo(() => extractVimeoId(url || video?.vimeoId), [url, video]);

  const viewRef = useMemo(() => {
    if (!user?.uid || !video?.id || !doc || !db) return null;
    return doc(db, "video_views", `${user.uid}_${video.id}`);
  }, [user?.uid, video?.id, doc, db]);

  useEffect(() => {
    if (!viewRef || !setDoc) return;

    setDoc(viewRef, {
      userId: user.uid,
      userEmail: user.email || "",
      userName: userName || user.displayName || user.email || "طالب",
      videoId: video.id,
      videoTitle: video.title || "",
      provider: type,
      lastOpenedAt: serverTimestamp(),
      openCount: 1,
      status: "opened_simple"
    }, { merge: true }).catch((e) => console.warn("simple video open log blocked:", e?.message));

    import("firebase/firestore").then(({ getDoc }) => {
      getDoc(viewRef).then((snap) => {
        const data = snap.data() || {};
        const saved = n(data.resumeAtSeconds || data.lastPositionSeconds, 0);
        if (saved > 5) {
          setResumeAt(saved);
          setShowResume(true);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, [viewRef, type, video?.id]);

  // ملاحظة:
  // YouTube iframe العادي لا يسمح بالاستكمال الدقيق بدون API.
  // لذلك زر الاستكمال البسيط متاح للفيديو المباشر، وVimeo لاحقًا بسهولة.
  const jumpToResume = () => {
    if (type === "direct" && playerRef.current && resumeAt > 0) {
      playerRef.current.currentTime = resumeAt;
      playerRef.current.play?.();
      setShowResume(false);
      return;
    }

    alert("الاستكمال الدقيق متاح للفيديوهات المرفوعة مباشرة. في YouTube الحالي نستخدم تشغيل سريع بدون تتبع لتجنب التهنيج.");
  };

  const handleDirectProgress = () => {
    if (!playerRef.current || !viewRef) return;
    const current = n(playerRef.current.currentTime, 0);
    const duration = n(playerRef.current.duration, n(video.durationSeconds, n(video.estimatedDurationMinutes) * 60));
    const percent = duration > 0 ? Math.min(100, Math.round((current / duration) * 100)) : 0;

    onProgress?.(video.id, percent, current);

    setDoc(viewRef, {
      resumeAtSeconds: current,
      lastPositionSeconds: current,
      durationSeconds: duration,
      watchedPercent: percent,
      lastSeenAt: serverTimestamp(),
      status: percent >= 95 ? "completed" : "paused"
    }, { merge: true }).catch(() => {});
  };

  useEffect(() => {
    if (type !== "direct" || !playerRef.current) return;

    const timer = setInterval(handleDirectProgress, 20000);
    const onPause = () => handleDirectProgress();
    const onEnded = () => handleDirectProgress();

    playerRef.current.addEventListener("pause", onPause);
    playerRef.current.addEventListener("ended", onEnded);

    return () => {
      clearInterval(timer);
      handleDirectProgress();
      try {
        playerRef.current?.removeEventListener("pause", onPause);
        playerRef.current?.removeEventListener("ended", onEnded);
      } catch {}
    };
  }, [type, viewRef, video?.id]);

  let src = "";
  if (type === "youtube") {
    if (!youtubeId) {
      return <PlayerShell title={video?.title} error="رابط YouTube غير صحيح" />;
    }
    src = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`;
  }

  if (type === "vimeo") {
    if (!vimeoId) {
      return <PlayerShell title={video?.title} error="رابط Vimeo غير صحيح" />;
    }
    src = `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`;
  }

  return (
    <div className="relative w-full h-full bg-black rounded-none overflow-hidden">
      <div className="absolute top-4 right-4 z-20 bg-black/60 text-white px-4 py-2 rounded-2xl backdrop-blur border border-white/10">
        <p className="font-black text-sm">{video?.title || "فيديو"}</p>
        <p className="text-[11px] text-white/70">
          {type === "youtube" ? "YouTube" : type === "vimeo" ? "Vimeo احتياطي" : "فيديو مباشر"}
        </p>
      </div>

      {showResume && (
        <button
          onClick={jumpToResume}
          className="absolute bottom-5 right-5 z-20 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-3 rounded-2xl font-black shadow-xl"
        >
          أكمل من حيث توقفت
        </button>
      )}

      {type === "direct" ? (
        <video
          ref={playerRef}
          controls
          controlsList="nodownload"
          className="w-full h-full object-contain"
          src={url}
          playsInline
          preload="auto"
          disablePictureInPicture
        >
          المتصفح لا يدعم هذا الفيديو.
        </video>
      ) : (
        <iframe
          className="w-full h-full"
          src={src}
          title={video?.title || "Video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}
    </div>
  );
}

function PlayerShell({ title, error }) {
  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-center text-center p-6">
      <h3 className="text-2xl font-black mb-2">{title || "فيديو"}</h3>
      <p className="text-red-300 font-bold">{error}</p>
    </div>
  );
}
