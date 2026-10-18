// «السينما» lecture player: a dark theater, the video in a glowing frame, and under it the lecture split into
// its parts (from the admin's «أجزاء المحاضرة», or equal parts) — each part shows how much of it was watched.
// Side panel: the parts list (watched ✓ / now / not yet) and the student's timed notes.
import { useEffect, useMemo, useState } from 'react';
import { imagePlacementStyle } from '@shared/utils/imagePlacement.js';
import { safeNumber } from '@shared/utils/media';
import { formatClock, videoParts } from '@shared/utils/chapters.js';
import { Icon } from '@v2/ui/Icon.jsx';
import { clampPercent } from '../utils/progress.js';
import SmartVideoCheckpoint from '@features/smart-teacher/SmartVideoCheckpoint.jsx';
import { PLAYBACK_RATES } from '../constants.js';
import '@v2/styles/video-cinema.css';

const ar = (n) => Number(n || 0).toLocaleString('ar-EG');

function FullIcon({ exit }) {
  return exit
    ? <svg className="nx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.5V7a2 2 0 0 1-2 2H3.5M15 3.5V7a2 2 0 0 0 2 2h3.5M20.5 15H17a2 2 0 0 0-2 2v3.5M3.5 15H7a2 2 0 0 1 2 2v3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    : <svg className="nx-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.5H5.5a2 2 0 0 0-2 2V8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** current second, duration and furthest watched second, sampled every half second */
function usePlayhead({ videoId, videoRef, youtubePlayerRef, maxAllowedSeekRef, fallbackDuration }) {
  const [state, setState] = useState({ pos: 0, dur: fallbackDuration || 0, max: 0 });
  useEffect(() => {
    const read = () => {
      let pos = 0; let dur = 0;
      if (videoId) {
        const p = youtubePlayerRef.current;
        pos = Number(p?.getCurrentTime?.() || 0);
        dur = Number(p?.getDuration?.() || 0);
      } else if (videoRef.current) {
        pos = Number(videoRef.current.currentTime || 0);
        dur = Number(videoRef.current.duration || 0);
      }
      if (!Number.isFinite(dur) || dur <= 0) dur = fallbackDuration || 0;
      const max = Math.max(Number(maxAllowedSeekRef.current || 0), pos);
      setState((s) => (Math.abs(s.pos - pos) < 0.4 && s.dur === dur && Math.abs(s.max - max) < 0.4 ? s : { pos, dur, max }));
    };
    read();
    const id = setInterval(read, 500);
    return () => clearInterval(id);
  }, [videoId, videoRef, youtubePlayerRef, maxAllowedSeekRef, fallbackDuration]);
  return state;
}

export function SecureVideoPlayerView({ ctx }) {
  const {
    notes, currentNote, setCurrentNote, handleAddNote, handleJumpToTime, deleteNote, formatMinSec,
    playerShellRef, isZoomed, setIsZoomed, isFullscreen, toggleFullscreen, videoId, reloadVideo,
    changeSpeed, playbackRate, onClose, watermarkText, resumeHint, antiSeekHint,
    isBuffering, youtubeDomId, posterUrl, youtubeStarted, pendingResumeSecondsRef,
    maxAllowedSeekRef, youtubePlayerRef, resumeAppliedRef, setYoutubeStarted, video,
    videoRef, finalUrl, setIsBuffering, setPlaybackRate, watchedPercent, setWatchedPercent,
    lastPositionRef, resumeStorageKey, user, setAntiSeekHint,
  } = ctx;
  const fallbackDuration = safeNumber(video?.durationSeconds, safeNumber(video?.estimatedDurationMinutes, 0) * 60);
  const { pos, dur, max } = usePlayhead({ videoId, videoRef, youtubePlayerRef, maxAllowedSeekRef, fallbackDuration });
  const parts = useMemo(() => videoParts(video, dur), [video, dur]);
  const [tab, setTab] = useState('parts');
  const [speedOpen, setSpeedOpen] = useState(false);
  const pct = clampPercent(watchedPercent || (dur ? (max / dur) * 100 : 0));
  const remaining = dur ? Math.max(0, dur - max) : 0;
  const nowPart = parts.findIndex((p) => pos >= p.start && pos < p.end);
  const partState = (p) => {
    const span = Math.max(1, p.end - p.start);
    const seen = Math.max(0, Math.min(span, max - p.start));
    const ratio = seen / span;
    return { ratio, done: ratio >= 0.92, started: ratio > 0.02 };
  };
  const doneParts = parts.filter((p) => partState(p).done).length;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.fullscreenElement) onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const jump = (sec) => {
    if (sec > max + 3) {
      setAntiSeekHint?.('الجزء ده لسه ما وصلتلوش. اتفرج بالترتيب عشان النسبة تتحسب صح.');
      setTimeout(() => setAntiSeekHint?.(''), 3200);
      return;
    }
    handleJumpToTime(sec);
  };

  return (
    <div className="cxv" dir="rtl" role="dialog" aria-modal="true" aria-label={video?.title || 'المحاضرة'}>
      <span className="cxv__glow" style={posterUrl ? { backgroundImage: `url("${posterUrl}")` } : undefined} aria-hidden="true" />

      <header className="cxv-top">
        <button type="button" className="cxv-close" onClick={onClose} aria-label="اقفل المحاضرة"><Icon name="arrowRight" /><span>رجوع</span></button>
        <div className="cxv-top__title">
          <small>{[video?.branch, video?.videoSection === 'revision' ? 'مراجعة' : 'شرح'].filter(Boolean).join(' · ')}</small>
          <b>{video?.title || 'محاضرة'}</b>
        </div>
        <span className="cxv-sp" />
        <div className="cxv-tools">
          {!videoId && (
            <div className="cxv-speed">
              <button type="button" className="cxv-tool" onClick={() => setSpeedOpen((v) => !v)} aria-expanded={speedOpen}><b>{ar(playbackRate)}×</b><span>السرعة</span></button>
              {speedOpen && <div className="cxv-speed__menu">{PLAYBACK_RATES.map((r) => <button key={r} type="button" aria-pressed={playbackRate === r} onClick={() => { changeSpeed(r); setSpeedOpen(false); }}>{ar(r)}×</button>)}</div>}
            </div>
          )}
          <button type="button" className={`cxv-tool ${isZoomed ? 'is-on' : ''}`} onClick={() => setIsZoomed((v) => !v)}><Icon name="search" /><span>{isZoomed ? 'صغّر' : 'كبّر'}</span></button>
          {!videoId && <button type="button" className="cxv-tool" onClick={reloadVideo}><Icon name="refresh" /><span>تحديث</span></button>}
          <button type="button" className="cxv-tool" onClick={toggleFullscreen}><FullIcon exit={isFullscreen} /><span>{isFullscreen ? 'خروج' : 'ملء الشاشة'}</span></button>
        </div>
      </header>

      <div className="cxv-layout">
        <section className="cxv-stage">
          <div ref={playerShellRef} className={`lecture-player-shell cxv-frame ${isFullscreen ? 'is-fullscreen' : ''}`}>
            <div className="lecture-stage">
              <div className="watermark-video smooth-watermark">{watermarkText}</div>
              {resumeHint && <div className="cxv-toast">{resumeHint}</div>}
              {antiSeekHint && <div className="cxv-toast is-warn">{antiSeekHint}</div>}
              {isBuffering && !videoId && <div className="cxv-buffer"><i /><span>بيحمّل…</span></div>}
              <SmartVideoCheckpoint video={video} videoRef={videoRef} user={user} />
              <div className={`lecture-media-frame ${isZoomed ? 'is-zoomed' : ''}`}>
                {videoId ? (
                  <div className="relative w-full h-full">
                    <div id={youtubeDomId} className="w-full h-full video-smooth-frame" />
                    {posterUrl && !youtubeStarted && (
                      <button type="button" className="cxv-poster" onClick={() => {
                        const saved = Math.round(pendingResumeSecondsRef.current || maxAllowedSeekRef.current || 0);
                        if (saved > 8 && youtubePlayerRef.current?.seekTo && !resumeAppliedRef.current) {
                          try { youtubePlayerRef.current.seekTo(saved, true); } catch { /* player not ready */ }
                          resumeAppliedRef.current = true;
                        }
                        setYoutubeStarted(true);
                        youtubePlayerRef.current?.playVideo?.();
                      }}>
                        <img src={posterUrl} style={imagePlacementStyle(video?.imagePlacement)} alt="" />
                        <span className="cxv-poster__play"><Icon name="play" /></span>
                        <span className="cxv-poster__label">{max > 8 ? `كمّل من ${formatClock(max)}` : 'شغّل المحاضرة'}</span>
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
                        setAntiSeekHint('ما ينفعش تقدّم الفيديو. اتفرج بالترتيب عشان النسبة تتحسب صح.');
                        setTimeout(() => setAntiSeekHint(''), 3500);
                        return;
                      }
                      maxAllowedSeekRef.current = Math.max(maxAllowedSeekRef.current, current);
                      const duration = safeNumber(videoRef.current?.duration, fallbackDuration);
                      const instantPercent = duration > 0 ? clampPercent((maxAllowedSeekRef.current / duration) * 100) : watchedPercent;
                      if (duration > 0) setWatchedPercent(instantPercent);
                      if (current > 0 && Math.abs(current - lastPositionRef.current) >= 4) {
                        lastPositionRef.current = current;
                        if (resumeStorageKey) {
                          try {
                            localStorage.setItem(resumeStorageKey, String(current));
                            localStorage.setItem(`nahhas-latest-video-${user.uid}`, JSON.stringify({
                              videoId: video.id, title: video.title || 'محاضرة', grade: video.grade || '',
                              watchedSeconds: current, lastPositionSeconds: current, maxWatchedSeconds: Math.max(maxAllowedSeekRef.current, current),
                              watchedPercent: instantPercent, percent: instantPercent, estimatedDuration: duration, updatedAt: Date.now(),
                            }));
                          } catch { /* storage blocked */ }
                        }
                      }
                    }}
                  >المتصفح ده مش بيشغّل الفيديو.</video>
                )}
              </div>
            </div>
          </div>

          <div className="cxv-meter">
            <div className="cxv-meter__head">
              <span className={`cxv-pct ${pct >= 95 ? 'is-done' : ''}`}><b>{ar(pct)}٪</b>{pct >= 95 ? 'خلصت المحاضرة' : 'اتفرجت'}</span>
              {dur > 0 && <span><Icon name="clock" />{pct >= 95 ? `${formatClock(dur)} كاملة` : `فاضل ${formatClock(remaining)}`}</span>}
              {parts.length > 0 && <span><Icon name="layers" />{ar(doneParts)} من {ar(parts.length)} أجزاء</span>}
              {max > 5 && pct < 95 && <span className="cxv-reach">وصلت لحد {formatClock(max)}</span>}
            </div>
            <div className="cxv-bar" role="img" aria-label={`اتفرجت ${pct}٪`}>
              {parts.length ? parts.map((p, i) => {
                const st = partState(p);
                return (
                  <button key={i} type="button" className={`cxv-seg ${st.done ? 'is-done' : ''} ${i === nowPart ? 'is-now' : ''}`} style={{ flexGrow: Math.max(1, p.end - p.start) }} onClick={() => jump(p.start)} title={`${formatClock(p.start)} ${p.title}`}>
                    <i style={{ width: `${st.ratio * 100}%` }} />
                    {i === nowPart && dur > 0 && <em style={{ insetInlineStart: `${Math.min(100, ((pos - p.start) / Math.max(1, p.end - p.start)) * 100)}%` }} />}
                    <span className="cxv-seg__tip"><b>{formatClock(p.start)}</b>{p.title}</span>
                  </button>
                );
              }) : <span className="cxv-seg is-solo"><i style={{ width: `${pct}%` }} /></span>}
            </div>
            {parts.length > 0 && !parts[0].auto && (
              <div className="cxv-marks">{parts.map((p, i) => <span key={i} style={{ flexGrow: Math.max(1, p.end - p.start) }}>{formatClock(p.start)}</span>)}</div>
            )}
          </div>
        </section>

        <aside className="cxv-side">
          <div className="cxv-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'parts'} onClick={() => setTab('parts')}><Icon name="layers" />أجزاء المحاضرة</button>
            <button type="button" role="tab" aria-selected={tab === 'notes'} onClick={() => setTab('notes')}><Icon name="edit" />ملاحظاتي{notes.length ? <em>{ar(notes.length)}</em> : null}</button>
          </div>

          {tab === 'parts' && (
            <ol className="cxv-parts">
              {parts.length === 0 && <li className="cxv-empty">أول ما الفيديو يبدأ هتظهر أجزاؤه هنا.</li>}
              {parts.map((p, i) => {
                const st = partState(p);
                const locked = p.start > max + 3;
                const status = st.done ? 'اتفرجت عليه' : i === nowPart ? 'بتتفرج عليه دلوقتي' : st.started ? `اتفرجت ${ar(Math.round(st.ratio * 100))}٪` : locked ? 'لسه ما وصلتلوش' : 'لسه';
                return (
                  <li key={i} style={{ animationDelay: `${i * 0.04}s` }}>
                    <button type="button" className={`${st.done ? 'is-done' : ''} ${i === nowPart ? 'is-now' : ''} ${locked ? 'is-locked' : ''}`} onClick={() => jump(p.start)}>
                      <i className="cxv-parts__dot">{st.done ? <Icon name="check" /> : locked ? <Icon name="lock" /> : ar(i + 1)}</i>
                      <span className="cxv-parts__main">
                        <b>{p.title}</b>
                        <small><span className="cxv-time">{formatClock(p.start)}</span> · {status}</small>
                        <span className="cxv-parts__bar"><i style={{ width: `${st.ratio * 100}%` }} /></span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {parts.length > 0 && parts[0].auto && <li className="cxv-empty">المحاضرة متقسمة لأجزاء متساوية. المستر يقدر يكتب عناوين الأجزاء من لوحة الإدارة.</li>}
            </ol>
          )}

          {tab === 'notes' && (
            <div className="cxv-notes">
              <form onSubmit={handleAddNote} className="cxv-notes__add">
                <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder={`اكتب ملاحظة عند ${formatClock(pos)}…`} />
                <button type="submit" disabled={!currentNote.trim()}><Icon name="plus" />احفظ عند {formatClock(pos)}</button>
              </form>
              <ul>
                {notes.length === 0 && <li className="cxv-empty">ملاحظاتك بتتحفظ بوقتها في الفيديو، تدوس عليها ترجع للحظة دي.</li>}
                {notes.map((n) => (
                  <li key={n.id}>
                    <button type="button" className="cxv-notes__time" onClick={() => jump(n.timestamp)}>{formatMinSec(n.timestamp || 0)}</button>
                    <p>{n.text}</p>
                    <button type="button" className="cxv-notes__del" onClick={() => deleteNote(n.id)} aria-label="امسح الملاحظة"><Icon name="close" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default SecureVideoPlayerView;
