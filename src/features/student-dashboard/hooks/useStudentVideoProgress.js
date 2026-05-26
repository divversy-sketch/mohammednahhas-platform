import { useMemo } from 'react';
import { safeNumber } from '@shared/core/platformShared.jsx';

export function useStudentVideoProgress({ user, videos = [], videoViews = [], setVideoViews }) {
  const getStoredLocalVideoProgress = (videoId) => {
      if (!user?.uid || !videoId) return null;
      try {
          const fullProgress = localStorage.getItem(`nahhas-video-progress-${user.uid}-${videoId}`);
          if (fullProgress) return JSON.parse(fullProgress);
          const resumeSeconds = safeNumber(localStorage.getItem(`nahhas-video-resume-${user.uid}-${videoId}`), 0);
          const latestRaw = localStorage.getItem('nahhas-latest-video-' + user.uid);
          const latest = latestRaw ? JSON.parse(latestRaw) : null;
          if (latest?.videoId === videoId) {
              return { ...latest, lastPositionSeconds: Math.max(resumeSeconds, safeNumber(latest.lastPositionSeconds, 0), safeNumber(latest.watchedSeconds, 0)) };
          }
          return resumeSeconds > 0 ? { videoId, lastPositionSeconds: resumeSeconds, watchedSeconds: resumeSeconds } : null;
      } catch (e) {
          return null;
      }
  };

  const getVideoWatchPercent = (videoItem) => {
      const candidates = [
          videoViews.find(v => v.videoId === videoItem.id || v.id === videoItem.id),
          getStoredLocalVideoProgress(videoItem.id)
      ].filter(Boolean);

      let bestPercent = 0;
      candidates.forEach((match) => {
          const storedPercent = safeNumber(match.watchedPercent ?? match.watchPercent ?? match.percent, -1);
          if (storedPercent >= 0) bestPercent = Math.max(bestPercent, storedPercent);

          const watchedSeconds = Math.max(
              safeNumber(match.lastPositionSeconds, 0),
              safeNumber(match.maxWatchedSeconds, 0),
              safeNumber(match.watchedSeconds, 0)
          );
          const durationSeconds = safeNumber(
              match.estimatedDuration,
              safeNumber(match.videoDuration, safeNumber(videoItem.durationSeconds, safeNumber(videoItem.estimatedDurationMinutes, 0) * 60))
          );
          if (durationSeconds > 0 && watchedSeconds > 0) {
              bestPercent = Math.max(bestPercent, (watchedSeconds / durationSeconds) * 100);
          }
      });

      return Math.max(0, Math.min(100, Math.round(bestPercent)));
  };

  const handleVideoProgress = (videoId, percent, watchedSeconds, extra = {}) => {
      setVideoViews(prev => {
          const existing = prev.find(v => v.videoId === videoId) || {};
          const others = prev.filter(v => v.videoId !== videoId);
          const nextPercent = Math.max(safeNumber(existing.watchedPercent ?? existing.watchPercent ?? existing.percent, 0), safeNumber(percent, 0));
          const nextSeconds = Math.max(safeNumber(existing.lastPositionSeconds, safeNumber(existing.watchedSeconds, 0)), safeNumber(watchedSeconds, 0));
          const nextView = {
              ...existing,
              ...extra,
              videoId,
              watchedPercent: Math.min(100, Math.round(nextPercent)),
              watchedSeconds: Math.max(safeNumber(existing.watchedSeconds, 0), nextSeconds),
              maxWatchedSeconds: Math.max(safeNumber(existing.maxWatchedSeconds, 0), nextSeconds),
              lastPositionSeconds: nextSeconds,
              updatedAt: { seconds: Math.floor(Date.now() / 1000) }
          };
          try {
              if (user?.uid) localStorage.setItem(`nahhas-video-progress-${user.uid}-${videoId}`, JSON.stringify({ ...nextView, updatedAt: Date.now() }));
          } catch (e) {}
          return [...others, nextView];
      });
  };


  const latestVideoActivity = useMemo(() => {
      const normalizeActivityTime = (item) => {
          const raw = safeNumber(
              item?.viewedAt?.seconds,
              safeNumber(item?.updatedAt?.seconds, safeNumber(item?.updatedAt, safeNumber(item?.lastSeenAt, 0)))
          );
          return raw > 1000000000000 ? raw : raw * 1000;
      };
      const views = Array.isArray(videoViews) ? videoViews : [];
      const byView = [...views].sort((a, b) => normalizeActivityTime(b) - normalizeActivityTime(a))[0] || null;
      let localActivity = null;
      try {
          const raw = user?.uid ? localStorage.getItem('nahhas-latest-video-' + user.uid) : '';
          localActivity = raw ? JSON.parse(raw) : null;
      } catch (e) {}

      const picked = normalizeActivityTime(localActivity) > normalizeActivityTime(byView) ? localActivity : byView;
      if (!picked) return null;

      const videoId = picked.videoId || picked.id;
      const videoItem = videos.find(v => v.id === videoId);
      if (!videoItem) return null;

      const watchedSeconds = Math.max(
          safeNumber(picked.lastPositionSeconds, 0),
          safeNumber(picked.maxWatchedSeconds, 0),
          safeNumber(picked.watchedSeconds, 0),
          safeNumber(localActivity?.videoId === videoId ? localActivity?.lastPositionSeconds : 0, 0),
          safeNumber(localActivity?.videoId === videoId ? localActivity?.watchedSeconds : 0, 0)
      );

      const storedPercent = Math.max(
          safeNumber(picked.watchedPercent ?? picked.watchPercent ?? picked.percent, -1),
          safeNumber(localActivity?.videoId === videoId ? (localActivity?.watchedPercent ?? localActivity?.watchPercent ?? localActivity?.percent) : -1, -1),
          getVideoWatchPercent(videoItem)
      );
      const durationSeconds = safeNumber(
          picked.estimatedDuration,
          safeNumber(picked.videoDuration, safeNumber(videoItem.durationSeconds, safeNumber(videoItem.estimatedDurationMinutes, 0) * 60))
      );
      const computedPercent = durationSeconds > 0 && watchedSeconds > 0 ? Math.round((watchedSeconds / durationSeconds) * 100) : 0;
      const percent = Math.max(0, Math.min(100, Math.round(Math.max(storedPercent, computedPercent))));

      return {
          video: videoItem,
          watchedSeconds,
          percent,
          isCompleted: percent >= 95
      };
  })();


  return { getStoredLocalVideoProgress, getVideoWatchPercent, handleVideoProgress, latestVideoActivity };
}
