import { Play } from '@shared/icons/lucide-shim.jsx';
import { imagePlacementStyle } from '@shared/utils/imagePlacement.js';
import { safeNumber } from '@shared/utils/media';
import { clampPercent } from '../utils/progress.js';
import VideoNotesPanel from '@features/video-security/player/components/VideoNotesPanel.jsx';
import VideoPlayerControls from '@features/video-security/player/components/VideoPlayerControls.jsx';
import SmartVideoCheckpoint from '@features/smart-teacher/SmartVideoCheckpoint.jsx';

export function SecureVideoPlayerView({ ctx }) {
  const {
    showNotes, notes, currentNote, setCurrentNote, setShowNotes, handleAddNote,
    handleJumpToTime, deleteNote, formatMinSec, playerShellRef, isZoomed, setIsZoomed,
    isFullscreen, toggleFullscreen, videoId, reloadVideo, showSettings, setShowSettings,
    changeSpeed, playbackRate, onClose, watermarkText, resumeHint, antiSeekHint,
    isBuffering, youtubeDomId, posterUrl, youtubeStarted, pendingResumeSecondsRef,
    maxAllowedSeekRef, youtubePlayerRef, resumeAppliedRef, setYoutubeStarted, video,
    videoRef, finalUrl, setIsBuffering, setPlaybackRate, watchedPercent, setWatchedPercent,
    lastPositionRef, resumeStorageKey, user,
  } = ctx;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col md:flex-row items-center justify-center p-0 md:p-4 font-['Cairo']" dir="rtl">
      <VideoNotesPanel
        showNotes={showNotes}
        notes={notes}
        currentNote={currentNote}
        setCurrentNote={setCurrentNote}
        onClose={() => setShowNotes(false)}
        onAddNote={handleAddNote}
        onJumpToTime={handleJumpToTime}
        onDeleteNote={deleteNote}
        formatMinSec={formatMinSec}
      />

      <div ref={playerShellRef} className={`lecture-player-shell w-full h-full md:max-w-7xl bg-black ${showNotes ? 'md:rounded-l-2xl' : 'rounded-xl'} overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col justify-center flex-1 ${isFullscreen ? 'is-fullscreen !max-w-none !rounded-none' : ''}`}>
        <VideoPlayerControls
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          isZoomed={isZoomed}
          setIsZoomed={setIsZoomed}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          videoId={videoId}
          reloadVideo={reloadVideo}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          changeSpeed={changeSpeed}
          playbackRate={playbackRate}
          onClose={onClose}
        />

        <div className={`lecture-stage ${showNotes ? 'has-notes-open' : ''}`}>
          <div className="watermark-video smooth-watermark">{watermarkText}</div>
          {resumeHint && <div className="lecture-resume-toast z-[76]">{resumeHint}</div>}
          {antiSeekHint && <div className="lecture-resume-toast z-[77] bg-red-600 text-white">{antiSeekHint}</div>}
          {isBuffering && !videoId && (
            <div className="lecture-buffering z-[75]">
              <div className="lecture-spinner" />
              <span>جاري تحميل جزء من الفيديو...</span>
            </div>
          )}
          <SmartVideoCheckpoint video={video} videoRef={videoRef} user={user} />
          <div className={`lecture-media-frame ${isZoomed ? 'is-zoomed' : ''}`}>
            {videoId ? (
              <div className="relative w-full h-full">
                <div id={youtubeDomId} className="w-full h-full video-smooth-frame" />
                {posterUrl && !youtubeStarted && (
                  <button type="button" onClick={() => {
                      const saved = Math.round(pendingResumeSecondsRef.current || maxAllowedSeekRef.current || 0);
                      if (saved > 8 && youtubePlayerRef.current?.seekTo && !resumeAppliedRef.current) {
                        try { youtubePlayerRef.current.seekTo(saved, true); } catch {}
                        resumeAppliedRef.current = true;
                      }
                      setYoutubeStarted(true);
                      youtubePlayerRef.current?.playVideo?.();
                    }} className="absolute inset-0 z-50 group">
                    <img src={posterUrl} className="w-full h-full" style={imagePlacementStyle(video?.imagePlacement)} alt={video?.title || 'غلاف الفيديو'} />
                    <span className="absolute inset-0 bg-black/35 flex items-center justify-center"><span className="w-20 h-20 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition"><Play size={38}/></span></span>
                  </button>
                )}
              </div>
            ) : (
              <video
                ref={videoRef}
                controls
                controlsList="nodownload noplaybackrate"
                poster={posterUrl || undefined}
                className="w-full h-full object-contain relative z-40 video-smooth-frame"
                src={finalUrl}
                playsInline
                preload="auto"
                disablePictureInPicture
                onWaiting={() => setIsBuffering(true)}
                onStalled={() => setIsBuffering(true)}
                onCanPlay={() => setIsBuffering(false)}
                onPlaying={() => setIsBuffering(false)}
                onLoadedMetadata={() => { if (videoRef.current) { videoRef.current.playbackRate = playbackRate; maxAllowedSeekRef.current = Math.max(maxAllowedSeekRef.current, videoRef.current.currentTime || 0); } }}
                onRateChange={() => setPlaybackRate(videoRef.current?.playbackRate || 1)}
                onTimeUpdate={() => {
                  const current = Math.round(videoRef.current?.currentTime || 0);
                  if (current > Math.max(maxAllowedSeekRef.current + 4, 8)) {
                    videoRef.current.currentTime = Math.max(0, maxAllowedSeekRef.current);
                    setAntiSeekHint('تم منع تقديم الفيديو. شاهد بالترتيب حتى تتحسب النسبة صح.');
                    setTimeout(() => setAntiSeekHint(''), 3500);
                    return;
                  }
                  maxAllowedSeekRef.current = Math.max(maxAllowedSeekRef.current, current);
                  const duration = safeNumber(videoRef.current?.duration, safeNumber(video.durationSeconds, safeNumber(video.estimatedDurationMinutes, 0) * 60));
                  const instantPercent = duration > 0 ? clampPercent((maxAllowedSeekRef.current / duration) * 100) : watchedPercent;
                  if (duration > 0) setWatchedPercent(instantPercent);
                  if (current > 0 && Math.abs(current - lastPositionRef.current) >= 4) {
                    lastPositionRef.current = current;
                    if (resumeStorageKey) {
                      try {
                        localStorage.setItem(resumeStorageKey, String(current));
                        localStorage.setItem(`nahhas-latest-video-${user.uid}`, JSON.stringify({
                          videoId: video.id,
                          title: video.title || 'محاضرة',
                          grade: video.grade || '',
                          watchedSeconds: current,
                          lastPositionSeconds: current,
                          maxWatchedSeconds: Math.max(maxAllowedSeekRef.current, current),
                          watchedPercent: instantPercent,
                          percent: instantPercent,
                          estimatedDuration: duration,
                          updatedAt: Date.now()
                        }));
                      } catch (e) {}
                    }
                  }
                }}
              >المتصفح لا يدعم هذا الفيديو.</video>
            )}
          </div>
          <div className="absolute left-4 right-4 bottom-4 z-[70] rounded-2xl border border-white/10 bg-black/55 p-3 text-white backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between text-xs font-black">
              <span>نسبة المشاهدة</span>
              <span className={watchedPercent >= 75 ? 'text-emerald-300' : 'text-amber-300'}>{watchedPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, watchedPercent)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
