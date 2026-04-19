import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, setDoc, getDoc, deleteDoc, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getYouTubeID, generatePDF, formatWatchTime } from '../../utils/helpers';
import { 
    AlertOctagon, AlertTriangle, Check, CheckCircle, ChevronRight, ClipboardList, Clock, 
    Code, Crown, ExternalLink, Flag, Settings as GearIcon, Headphones, Layers, Layout, 
    Loader2, Lock, LogOut, MousePointerClick, Pause, PenLine, Play, PlayCircle, PlusCircle, 
    QrCode, Radio, RefreshCw, Send, Sparkles, Star, Timer, Trash2, Trophy, Video, X, XCircle, Camera, BookOpen, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ------------------------------------------------------------------
// 1. الإعلانات (Announcements)
// ------------------------------------------------------------------
export const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setAnnouncements(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }, []);
    if(announcements.length === 0) return null;
    return (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-xl shadow-lg mb-6 relative overflow-hidden z-20 border border-blue-700/50">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={60}/></div>
            <h3 className="font-bold font-arabic text-lg flex items-center gap-2 mb-2 relative z-10 text-blue-200"><Megaphone size={20}/> تنبيهات هامة</h3>
            <div className="relative z-10 space-y-2">
                {announcements.map((a, i) => (
                    <div key={i} className="text-sm border-b border-blue-800 last:border-0 pb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>{a.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 2. لوحة الشرف (Leaderboard)
// ------------------------------------------------------------------
export const Leaderboard = () => {
    const [topStudents, setTopStudents] = useState([]);
    const [config, setConfig] = useState({ show: true });
    useEffect(() => {
        const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (snap) => { if(snap.exists()) setConfig(snap.data()); });
        const unsub = onSnapshot(query(collection(db, 'exam_results')), (snap) => {
            const scores = {};
            snap.docs.forEach(doc => {
                const data = doc.data();
                if(data.score && data.status === 'completed' && data.studentName) {
                    if(!scores[data.studentName]) scores[data.studentName] = 0;
                    scores[data.studentName] += parseInt(data.score);
                }
            });
            const sorted = Object.entries(scores).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score).slice(0, 5); 
            setTopStudents(sorted);
        });
        return () => { unsub(); unsubConfig(); };
    }, []);
    if(!config.show) return null;
    return (
        <div className="glass-panel p-6 rounded-2xl mb-6">
            <h3 className="text-xl font-bold font-arabic mb-4 flex items-center gap-2 text-amber-700"><Trophy className="text-amber-500 fill-amber-500" /> لوحة الشرف (الأوائل)</h3>
            <div className="space-y-3">
                {topStudents.length === 0 ? <p className="text-slate-400 text-sm">لسه مفيش حد امتحن..</p> : topStudents.map((s, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-lg border-b-2 ${i===0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-400' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md ${i===0?'bg-yellow-400 text-white':i===1?'bg-gray-300 text-gray-700':i===2?'bg-orange-300 text-white':'bg-slate-100 text-slate-500'}`}>
                                {i < 3 ? <Star size={14} fill="currentColor" /> : i+1}
                            </div>
                            <span className="font-bold text-slate-800">{s.name}</span>
                        </div>
                        <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{s.score} نقطة</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 3. مشغل الفيديو الآمن (SecureVideoPlayer)
// ------------------------------------------------------------------
export const SecureVideoPlayer = ({ video, user, userName, onClose }) => {
  const videoId = getYouTubeID(video.url || video.file);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const videoRef = useRef(null);
  const finalUrl = video.url || video.file;

  useEffect(() => {
      if(!user || !video.id) return;
      const q = query(collection(db, 'video_notes'), where('userId', '==', user.uid), where('videoId', '==', video.id), orderBy('timestamp', 'asc'));
      const unsub = onSnapshot(q, (snap) => { setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
      return () => unsub();
  }, [user, video.id]);

  useEffect(() => {
      if (!user || !video.id) return;
      const viewId = `${user.uid}_${video.id}`;
      const viewRef = doc(db, 'video_views', viewId);
      let timerInterval; let localSeconds = 0; let lastSyncedSeconds = 0;

      const syncToDatabase = async (secondsToAdd) => {
          try { await setDoc(viewRef, { userId: user.uid, userName: userName, videoId: video.id, videoTitle: video.title, viewedAt: serverTimestamp(), watchedSeconds: increment(secondsToAdd) }, { merge: true }); } catch (e) { console.error("Sync error:", e); }
      };
      syncToDatabase(0);

      timerInterval = setInterval(() => {
          let isPlaying = true;
          if (!videoId && videoRef.current) isPlaying = !videoRef.current.paused && !videoRef.current.ended;
          if (!document.hidden && isPlaying) {
              localSeconds += 1;
              if (localSeconds - lastSyncedSeconds >= 15) { syncToDatabase(localSeconds - lastSyncedSeconds); lastSyncedSeconds = localSeconds; }
          }
      }, 1000);
      return () => { clearInterval(timerInterval); const remaining = localSeconds - lastSyncedSeconds; if (remaining > 0) syncToDatabase(remaining); };
  }, [user, video.id, video.title, userName, videoId]);

  const changeSpeed = (rate) => { if(videoRef.current) videoRef.current.playbackRate = rate; setShowSettings(false); };

  const handleAddNote = async (e) => {
      e.preventDefault();
      if(!currentNote.trim()) return;
      let currentTime = 0;
      if (videoRef.current) currentTime = videoRef.current.currentTime;
      await addDoc(collection(db, 'video_notes'), { userId: user.uid, videoId: video.id, text: currentNote, timestamp: currentTime, createdAt: serverTimestamp() });
      setCurrentNote("");
  };

  const handleJumpToTime = (time) => {
      if(videoRef.current) { videoRef.current.currentTime = time; videoRef.current.play(); } else if(videoId) { alert("عفواً، ميزة القفز للوقت المحدد تعمل مع الفيديوهات المرفوعة على المنصة فقط وليس يوتيوب."); }
  };

  const deleteNote = async (noteId) => { if(window.confirm("حذف هذه الملاحظة؟")) await deleteDoc(doc(db, 'video_notes', noteId)); };
  const formatMinSec = (seconds) => { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${s.toString().padStart(2, '0')}`; };
  const youtubeEmbedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&loop=1&playlist=${videoId}&playsinline=1` : '';

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
                      ) : (
                          notes.map(note => (
                              <div key={note.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 group">
                                  <div className="flex justify-between items-start mb-2">
                                      <button onClick={() => handleJumpToTime(note.timestamp)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold hover:bg-blue-200 transition flex items-center gap-1"><Play size={10} fill="currentColor"/> الدقيقة {formatMinSec(note.timestamp)}</button>
                                      <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                                  </div>
                                  <p className="text-sm text-slate-700 font-bold whitespace-pre-wrap">{note.text}</p>
                              </div>
                          ))
                      )}
                  </div>
                  <form onSubmit={handleAddNote} className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
                      <textarea className="w-full border-2 border-slate-200 rounded-xl p-2 text-sm focus:border-blue-500 outline-none transition resize-none h-20" placeholder="اكتب ملاحظتك هنا (سيتم حفظها بوقت الفيديو الحالي)..." value={currentNote} onChange={e => setCurrentNote(e.target.value)} />
                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl shadow-md hover:bg-blue-700 transition">إضافة الملاحظة</button>
                  </form>
              </motion.div>
          )}
      </AnimatePresence>

      <div className={`w-full h-full md:max-w-7xl bg-black ${showNotes ? 'md:rounded-l-2xl' : 'rounded-xl'} overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col justify-center flex-1 transition-all duration-300`}>
        <div className="absolute top-4 right-4 z-50 flex gap-4">
            <button onClick={() => setShowNotes(!showNotes)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold backdrop-blur-md transition shadow-lg ${showNotes ? 'bg-blue-600 text-white' : 'bg-black/50 text-white hover:bg-black/80 border border-white/20'}`}>
                <PenLine size={18}/> <span className="hidden md:inline">ملاحظاتي</span>
            </button>
            <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition border border-white/20"><GearIcon size={24}/></button>
                {showSettings && (
                    <div className="absolute top-12 left-0 bg-white text-black rounded-lg shadow-xl py-2 w-40 z-50 text-sm font-bold">
                        <div className="px-4 py-2 border-b text-gray-400 text-xs">سرعة التشغيل</div>
                        {[0.5, 1, 1.25, 1.5, 2].map(rate => ( <button key={rate} onClick={() => changeSpeed(rate)} className="block w-full text-right px-4 py-2 hover:bg-gray-100">{rate}x</button> ))}
                    </div>
                )}
            </div>
            <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg"><X size={24}/></button>
        </div>

        <div className="w-full relative flex items-center justify-center bg-black overflow-hidden" style={{ height: showNotes ? '50vh' : '100%' }}>
          <div className="watermark-video">{userName} - {video.grade || 'منصة النحاس'}</div>
          {videoId ? (
            <iframe className="w-full h-full" src={youtubeEmbedUrl} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          ) : (
             <video ref={videoRef} controls controlsList="nodownload" className="w-full h-full object-contain relative z-40" src={finalUrl} playsInline preload="auto" disablePictureInPicture>المتصفح لا يدعم هذا الفيديو.</video>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 4. وضع التركيز (PomodoroFocusMode)
// ------------------------------------------------------------------
export const PomodoroFocusMode = ({ onClose }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    const audioRef = useRef(null);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) { interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000); } 
        else if (timeLeft === 0) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); audio.play().catch(e=>{});
            if (isBreak) { setIsBreak(false); setTimeLeft(25 * 60); setIsActive(false); } 
            else { setIsBreak(true); setTimeLeft(5 * 60); setIsActive(false); }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak]);

    const toggleTimer = () => {
        setIsActive(!isActive);
        if(!isActive && audioRef.current && !isBreak) { audioRef.current.play().catch(e => console.log("Audio play blocked")); } 
        else if(isActive && audioRef.current) { audioRef.current.pause(); }
    };

    const addTask = (e) => { e.preventDefault(); if(newTask.trim()) { setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]); setNewTask(""); } };
    const toggleTask = (id) => { setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)); };

    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
                <div className="flex items-center gap-2 text-2xl font-bold text-amber-400"><Headphones/> وضع التركيز (Pomodoro)</div>
                <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition"><X size={24}/></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row p-6 gap-8 overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/50 rounded-3xl p-8 border border-slate-700 relative overflow-hidden">
                    <div className="absolute top-6 left-6 flex gap-2">
                        <button onClick={() => { setIsBreak(false); setTimeLeft(25 * 60); setIsActive(false); }} className={`px-4 py-1 rounded-full text-sm font-bold transition ${!isBreak ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>مذاكرة (25)</button>
                        <button onClick={() => { setIsBreak(true); setTimeLeft(5 * 60); setIsActive(false); }} className={`px-4 py-1 rounded-full text-sm font-bold transition ${isBreak ? 'bg-green-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>راحة (5)</button>
                    </div>
                    <div className={`text-9xl font-black font-sans my-12 drop-shadow-2xl tracking-widest ${isBreak ? 'text-green-400' : 'text-amber-400'}`}>{m}:{s}</div>
                    <div className="flex items-center gap-6">
                        <button onClick={toggleTimer} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-105 ${isActive ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-white text-slate-900 shadow-white/20'}`}>
                            {isActive ? <Pause size={40} fill="currentColor"/> : <Play size={40} fill="currentColor" className="ml-2"/>}
                        </button>
                        <button onClick={() => setTimeLeft(isBreak ? 5*60 : 25*60)} className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition text-slate-300"><RefreshCw size={24}/></button>
                    </div>
                    <p className="mt-8 text-slate-400 flex items-center gap-2"><Headphones size={16}/> موسيقى Lo-Fi للتركيز تعمل تلقائياً أثناء جلسة المذاكرة</p>
                </div>
                <div className="w-full lg:w-96 flex flex-col gap-4">
                    <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><CheckCircle className="text-amber-400"/> مهام الجلسة</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
                            {tasks.length === 0 ? <p className="text-slate-500 text-center mt-10">أضف مهامك هنا لتركز عليها.</p> : tasks.map(t => (
                                <div key={t.id} onClick={() => toggleTask(t.id)} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${t.done ? 'bg-slate-700/50 border-slate-600 text-slate-500 line-through' : 'bg-slate-700 border-slate-500 text-white'}`}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${t.done ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-400'}`}>
                                        {t.done && <Check size={14} strokeWidth={4}/>}
                                    </div>
                                    <span className="font-bold">{t.text}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={addTask} className="flex gap-2">
                            <input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="أضف مهمة جديدة..." className="flex-1 bg-slate-900 border border-slate-600 rounded-xl p-3 outline-none focus:border-amber-500 transition"/>
                            <button type="submit" className="bg-amber-600 text-white p-3 rounded-xl font-bold hover:bg-amber-700"><PlusCircle/></button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 5. المشغل التفاعلي (InteractiveViewer)
// ------------------------------------------------------------------
export const InteractiveViewer = ({ content, user, onClose }) => {
    const handleContextMenu = (e) => e.preventDefault();
    const [iframeSrc, setIframeSrc] = useState('');
    useEffect(() => {
        let activeBlobUrl = null;
        if (content.url && content.url.startsWith('data:')) {
            fetch(content.url).then(res => res.blob()).then(blob => { activeBlobUrl = URL.createObjectURL(blob); setIframeSrc(activeBlobUrl); }).catch(err => { console.error("Error creating blob:", err); setIframeSrc(content.url); });
        } else { setIframeSrc(content.url); }
        return () => { if (activeBlobUrl) { URL.revokeObjectURL(activeBlobUrl); } };
    }, [content.url]);
    useEffect(() => {
        const handleKeyDown = (e) => { if (e.key === 'PrintScreen') { alert('غير مسموح بأخذ لقطات شاشة! المحتوى محمي.'); if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText('Screenshots are disabled'); } } };
        const handleCopy = (e) => { e.preventDefault(); alert("النسخ غير مسموح!"); };
        window.addEventListener('keydown', handleKeyDown); document.addEventListener('copy', handleCopy); document.addEventListener('cut', handleCopy);
        return () => { window.removeEventListener('keydown', handleKeyDown); document.removeEventListener('copy', handleCopy); document.removeEventListener('cut', handleCopy); };
    }, []);
    return (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 select-none" onContextMenu={handleContextMenu}>
            <div className="w-full h-full max-w-7xl bg-white rounded-xl overflow-hidden relative shadow-2xl border border-gray-800 flex flex-col">
                <div className="bg-slate-900 p-3 flex justify-between items-center text-white border-b border-gray-700 select-none">
                   <div className="flex items-center gap-4">
                       <h3 className="font-bold flex items-center gap-2"><Code /> {content.title}</h3>
                       <span className="hidden md:block text-xs bg-amber-600 px-3 py-1 rounded-full text-white font-bold">منصة النحاس - أ/ محمد النحاس</span>
                   </div>
                   <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded font-bold transition">خروج</button>
                </div>
                <div className="flex-1 bg-white relative overflow-hidden">
                   {user && (<div className="watermark-video" style={{ pointerEvents: 'none', zIndex: 9999 }}>{user.name || user.displayName} — منصة النحاس</div>)}
                   <div className="absolute inset-0 z-[9998] pointer-events-none select-none"></div>
                   <iframe src={iframeSrc} className="w-full h-full border-0 relative z-40 bg-white" title={content.title} sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals" style={{ pointerEvents: 'auto', WebkitTransform: 'translateZ(0)' }}></iframe>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 6. مشغل الامتحان والمراجعة (ExamRunner)
// ------------------------------------------------------------------
export const ExamRunner = ({ exam, user, onClose, isReviewMode = false, existingResult = null }) => {
  const [activeView, setActiveView] = useState(isReviewMode || existingResult ? 'dashboard' : 'questions'); 
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState(existingResult?.answers || {});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState((exam?.duration || 60) * 60);
  const [isCheating, setIsCheating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode || existingResult !== null);
  const [score, setScore] = useState(existingResult?.score || 0);
  const [startTime] = useState(Date.now()); 
  const [wmPositions, setWmPositions] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [activeBranchTab, setActiveBranchTab] = useState('الكل');

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  };

  const flatQuestions = useMemo(() => {
    const flat = [];
    if (exam && exam.questions) {
        let processedBlocks = [...exam.questions];
        if (!isReviewMode && !existingResult) processedBlocks = shuffleArray(processedBlocks);
        processedBlocks.forEach((block) => {
            let subQs = [...(block.subQuestions || [])];
            if (!isReviewMode && !existingResult) subQs = shuffleArray(subQs);
            subQs.forEach((q) => { flat.push({ ...q, blockText: block.text, branch: q.branch || 'عام' }); });
        });
    }
    return flat;
  }, [exam, isReviewMode, existingResult]);

  const uniqueBranches = useMemo(() => ['الكل', ...new Set(flatQuestions.map(q => q.branch))], [flatQuestions]);

  const displayQuestions = useMemo(() => {
      if (!isSubmitted || activeBranchTab === 'الكل') return flatQuestions;
      return flatQuestions.filter(q => q.branch === activeBranchTab);
  }, [flatQuestions, isSubmitted, activeBranchTab]);

  useEffect(() => { if (isSubmitted) setCurrentQIndex(0); }, [activeBranchTab, isSubmitted]);

  useEffect(() => {
    if (isReviewMode) return;
    const updatePositions = () => {
        const newPos = [...Array(6)].map(() => ({ top: Math.floor(Math.random() * 90) + '%', left: Math.floor(Math.random() * 90) + '%' }));
        setWmPositions(newPos);
    };
    updatePositions();
    const interval = setInterval(updatePositions, 6000); 
    return () => clearInterval(interval);
  }, [isReviewMode]);

  const stateRefs = useRef({ isSubmitted, showSubmitConfirm, isCheating });
  useEffect(() => { stateRefs.current = { isSubmitted, showSubmitConfirm, isCheating }; });

  const handleCheatingRef = useRef();
  handleCheatingRef.current = async () => {
      const { isSubmitted, isCheating } = stateRefs.current;
      if(isReviewMode || isSubmitted || isCheating) return;
      setIsCheating(true); setIsSubmitted(true); setActiveView('dashboard');
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      if (exam.attemptId) {
          await setDoc(doc(db, 'exam_results', exam.attemptId), { 
              examId: exam.id, studentId: user.uid, studentName: user.displayName || user.name || 'طالب', 
              score: 0, total: flatQuestions.length, status: 'cheated', timeTaken: timeTaken, totalTime: exam.duration, submittedAt: serverTimestamp() 
          }, {merge: true});
      }
      await updateDoc(doc(db, 'users', user.uid), { status: 'banned_exam' });
  };

  useEffect(() => {
      if (isReviewMode) return;
      const handleBeforeUnload = (e) => {
          if (!stateRefs.current.isSubmitted) {
              e.preventDefault(); e.returnValue = "هل أنت متأكد؟ الخروج سيمنعك من العودة للامتحان!"; return e.returnValue;
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      const handleAntiCheat = () => { 
          const { showSubmitConfirm, isSubmitted } = stateRefs.current;
          if (!showSubmitConfirm && !isSubmitted) handleCheatingRef.current();
      };
      const handleVisibilityChange = () => { if (document.hidden) handleAntiCheat(); };
      const blockContextMenu = (e) => e.preventDefault();
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleAntiCheat);
      window.addEventListener("pagehide", handleAntiCheat);
      document.addEventListener('contextmenu', blockContextMenu); 
      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("blur", handleAntiCheat);
          window.removeEventListener("pagehide", handleAntiCheat);
          document.removeEventListener('contextmenu', blockContextMenu);
      };
  }, [isReviewMode]);

  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    if (timeLeft > 0 && !isCheating) {
      const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitted, isCheating, isReviewMode]);

  // --- التحقق من خلو الامتحان من الأسئلة (يجب أن يكون بعد كل الهوكس) ---
  if (flatQuestions.length === 0) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-['Cairo'] flex-col gap-4">
              <h2 className="text-xl font-bold text-slate-700">عفواً، لا توجد أسئلة مسجلة في هذا الامتحان.</h2>
              <button onClick={onClose} className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-amber-700">خروج</button>
          </div>
      );
  }

  if (isCheating) {
      return (
          <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']">
              <div><AlertOctagon size={80} className="mx-auto mb-4"/><h1>تم رصد محاولة غش!</h1><p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك من الامتحانات القادمة.</p><button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button></div>
          </div>
      );
  }

  const handleAnswer = (qId, optionIdx) => { 
    if(!isReviewMode && !isSubmitted) setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };
  
  const calculateScore = () => {
    let rawScore = 0;
    flatQuestions.forEach(q => { if (answers[q.id] === q.correctIdx) rawScore++; });
    return rawScore;
  };

  const confirmSubmit = () => setShowSubmitConfirm(true);

  const handleSubmit = async (auto = false) => {
    setShowSubmitConfirm(false);
    const totalQs = flatQuestions.length;
    const finalScore = calculateScore();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setScore(finalScore);
    setIsSubmitted(true);
    setActiveView('dashboard'); 

    const batch = writeBatch(db);
    flatQuestions.forEach(q => {
        const studentAns = answers[q.id];
        const isAnswered = studentAns !== undefined;
        const isCorrect = studentAns === q.correctIdx;
        
        if (isAnswered && !isCorrect) {
            const mistakeRef = doc(collection(db, 'student_mistakes'));
            batch.set(mistakeRef, {
                userId: user.uid, examTitle: exam.title,
                question: { ...q, studentAnswerText: q.options[studentAns], correctAnswerText: q.options[q.correctIdx] },
                timestamp: serverTimestamp()
            });
        }
    });

    if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
        const attemptRef = doc(db, 'exam_results', exam.attemptId);
        batch.set(attemptRef, { 
            examId: exam.id, studentId: user.uid, studentName: user.displayName || user.name || 'طالب', 
            score: finalScore, total: totalQs, answers, status: 'completed', timeTaken: timeTaken, totalTime: exam.duration, submittedAt: serverTimestamp() 
        }, { merge: true });
    }
    try { await batch.commit(); } catch(err) { console.error("Error saving results or mistakes", err); }
  };

  const totalQs = flatQuestions.length;
  const solvedQs = Object.keys(answers).length;
  const unsolvedQs = totalQs - solvedQs;
  const correctQs = score;
  const wrongQs = solvedQs - correctQs;
  const percentage = totalQs > 0 ? Math.round((score / totalQs) * 100) : 0;
  
  const branchStats = {};
  flatQuestions.forEach(q => {
      const b = q.branch || 'عام';
      if (!branchStats[b]) branchStats[b] = { total: 0, solved: 0, correct: 0, wrong: 0, unsolved: 0 };
      branchStats[b].total++;
      const isSelected = answers[q.id] !== undefined;
      const isCorrect = answers[q.id] === q.correctIdx;
      if (isSelected) branchStats[b].solved++;
      if (!isSelected) branchStats[b].unsolved++;
      else if (isCorrect) branchStats[b].correct++;
      else branchStats[b].wrong++;
  });

  const canReview = exam?.id === 'custom_mistakes_exam' || (exam?.endTime && Date.now() > new Date(exam.endTime).getTime());

  if (activeView === 'dashboard') {
     return (
        <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto p-4 md:p-8 font-['Cairo'] text-slate-200" dir="rtl">
            <div className="max-w-6xl mx-auto mt-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-700 pb-4 gap-4">
                    <div className="text-center md:text-right">
                        <h2 className="text-3xl font-black text-white mb-2">{exam?.title || 'مراجعة الامتحان'}</h2>
                        {isSubmitted ? (
                            <p className="text-lg text-slate-400">الطالب: {user?.displayName || user?.name || 'طالب'}</p>
                        ) : (
                            <p className="text-amber-400 font-bold">⏳ الوقت المتبقي: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {isSubmitted ? (
                            <>
                                <button onClick={() => generatePDF('student', {studentName: user?.displayName || user?.name || 'طالب', score, total: flatQuestions.length, status: 'completed', examTitle: exam?.title, questions: flatQuestions, answers: answers })} className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition" title="تحميل التقرير PDF">
                                    <FileText size={20}/>
                                </button>
                                <button onClick={onClose} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-600 shadow-lg transition flex items-center gap-2">
                                    خروج <LogOut size={18}/>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setActiveView('questions')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                                استكمال الامتحان <Play size={18}/>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
                    <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
                        <p className="text-slate-400 text-sm mb-3 font-bold">عدد الأسئلة</p>
                        <p className="text-4xl md:text-5xl font-black text-white">{totalQs}</p>
                    </div>
                    {isSubmitted ? (
                        <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
                            <p className="text-slate-400 text-sm mb-3 font-bold">النتيجة</p>
                            <p className="text-4xl md:text-5xl font-black text-white">{percentage}%</p>
                        </div>
                    ) : (
                        <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center cursor-pointer hover:bg-slate-700 transition" onClick={() => {setActiveBranchTab('الكل'); setActiveView('questions');}}>
                            <p className="text-slate-400 text-sm mb-3 font-bold">عرض الكل</p>
                            <p className="text-4xl md:text-5xl font-black text-blue-400">{solvedQs}/{totalQs}</p>
                        </div>
                    )}
                    <div className="bg-[#0e7490] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                        <p className="text-cyan-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16}/> المحلولة</p>
                        <p className="text-4xl md:text-5xl font-black text-white">{solvedQs}</p>
                    </div>
                    {isSubmitted ? (
                        <>
                            <div className="bg-[#831843] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                                <p className="text-pink-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><XCircle size={16}/> الخاطئة</p>
                                <p className="text-4xl md:text-5xl font-black text-pink-50">{wrongQs}</p>
                            </div>
                            <div className="bg-[#115e59] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                                <p className="text-teal-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Check size={16}/> الصحيحة</p>
                                <p className="text-4xl md:text-5xl font-black text-teal-50">{correctQs}</p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#b45309] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center col-span-2">
                            <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Flag size={16}/> أسئلة محددة للمراجعة</p>
                            <p className="text-4xl md:text-5xl font-black text-amber-50">{Object.values(flagged).filter(v=>v).length}</p>
                        </div>
                    )}
                    <div className="bg-[#78350f] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
                        <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><AlertCircle size={16}/> لم تُحل</p>
                        <p className="text-4xl md:text-5xl font-black text-amber-50">{unsolvedQs}</p>
                    </div>
                </div>

                {Object.keys(branchStats).length > 0 && (
                    <div className="mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2 text-teal-400"><Layers size={28}/> {isSubmitted ? 'ملخص الفروع' : 'أقسام الامتحان (اضغط للدخول)'}</h3>
                            {canReview && isSubmitted && (
                                <button onClick={() => { setActiveBranchTab('الكل'); setActiveView('questions'); }} className="text-teal-400 bg-teal-900/30 px-4 py-2 rounded-lg font-bold hover:bg-teal-900/50 transition text-sm flex items-center gap-2">
                                    عرض كل الأسئلة <ClipboardList size={16}/>
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {Object.entries(branchStats).map(([branch, stats], idx) => {
                                const bPercent = stats.total > 0 ? (isSubmitted 
                                    ? Math.round((stats.correct / stats.total) * 100) 
                                    : Math.round((stats.solved / stats.total) * 100)) : 0;
                                
                                let message = "";
                                if (isSubmitted) {
                                    message = bPercent >= 90 ? `عاش يا بطل، مقفل ${branch} 🌟` : bPercent >= 70 ? `أداء محترم في ${branch} 👏` : "شد حيلك أكتر، تقدر تجيب أعلى 💪";
                                } else {
                                    message = bPercent === 100 ? "تم حل كل أسئلة القسم ✅" : "يوجد أسئلة متبقية ⏳";
                                }

                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => {
                                            if (!isSubmitted || canReview) {
                                                setActiveBranchTab(branch);
                                                setActiveView('questions');
                                            } else {
                                                alert("نموذج الإجابة سيتاح بعد انتهاء وقت الامتحان للجميع.");
                                            }
                                        }}
                                        className={`bg-[#1e293b] p-6 rounded-2xl border border-[#334155] shadow-lg transition group ${(!isSubmitted || canReview) ? 'cursor-pointer hover:border-teal-400 hover:-translate-y-1' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-6">
                                            <span className={`text-4xl font-black ${isSubmitted ? 'text-teal-400' : 'text-blue-400'}`}>{bPercent}%</span>
                                            <span className="text-xl font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">{branch}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 text-left mb-2 font-bold">{isSubmitted ? 'نسبة النجاح' : 'نسبة الحل'}</p>
                                        <div className="w-full bg-[#0f172a] rounded-full h-2.5 mb-6 overflow-hidden">
                                            <div className={`${isSubmitted ? 'bg-teal-400' : 'bg-blue-400'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${bPercent}%` }}></div>
                                        </div>
                                        <div className="text-sm mt-4 bg-[#0f172a] p-3 rounded-lg">
                                            {!isSubmitted ? (
                                                <div className="flex justify-between text-slate-400 font-bold">
                                                    <span>محلول: <span className="text-blue-400">{stats.solved}</span></span>
                                                    <span>المجموع: {stats.total}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-slate-500 mb-1 text-xs">رسالة المنصة:</p>
                                                    <p className={`${bPercent >= 90 ? 'text-teal-300' : 'text-amber-300'} font-bold`}>{message}</p>
                                                </>
                                            )}
                                        </div>
                                        {(canReview && isSubmitted) && (
                                            <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 text-xs font-bold flex items-center justify-center gap-1">
                                                اضغط لمراجعة أخطاء {branch} <MousePointerClick size={12}/>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {!canReview && isSubmitted && (
                    <div className="mt-8 bg-amber-900/30 text-amber-400 p-6 rounded-2xl border border-amber-900 text-center font-bold text-lg flex flex-col items-center gap-3">
                        <Clock size={32}/>
                        نموذج الإجابة والمراجعة سيظهر هنا تلقائياً بعد انتهاء وقت الامتحان للأغلبية.
                    </div>
                )}

                {!isSubmitted && (
                    <div className="flex justify-end mt-8 border-t border-slate-700 pt-6">
                        <button onClick={confirmSubmit} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                            <CheckCircle size={20}/> تسليم الامتحان نهائياً
                        </button>
                    </div>
                )}
            </div>
        </div>
     );
  }

  const currentQObj = displayQuestions[currentQIndex];
  if (!currentQObj) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
      {!isSubmitted && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {wmPositions.map((pos, i) => (
                <div key={i} className="watermark-text" style={{ top: pos.top, left: pos.left }}>
                    {user?.displayName || user?.name || 'طالب'} - {user?.email}
                </div>
            ))}
        </div>
      )}
      
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-t-8 border-amber-500">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4"/>
                <h3 className="text-2xl font-bold mb-2 text-slate-800">هل أنت متأكد من التسليم؟</h3>
                <p className="text-slate-500 mb-8 font-bold">لن يمكنك تعديل إجاباتك بعد ذلك، وسيتم نقلك للوحة النتيجة.</p>
                <div className="flex gap-4">
                    <button onClick={() => handleSubmit(false)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition">نعم، سلم الآن</button>
                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-300 shadow-sm transition">تراجع</button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row justify-between items-center shadow-md relative z-50 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
            {isSubmitted && (
                <button onClick={() => setActiveView('dashboard')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-sm text-sm">
                    <Layout size={16}/> العودة للنتيجة
                </button>
            )}
            <h2 className="font-bold text-lg font-sans text-amber-400 truncate hidden md:block">{exam?.title} {isSubmitted ? '(مراجعة الإجابات)' : ''}</h2>
            {!isSubmitted && <div className="bg-slate-800 px-6 py-2 rounded-full font-mono shadow-inner border border-slate-700 font-bold text-amber-400 text-lg flex items-center gap-2"><Timer size={18}/> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>}
        </div>

        {isSubmitted && uniqueBranches.length > 2 && (
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {uniqueBranches.map((branch, i) => (
                    <button 
                        key={i} onClick={() => setActiveBranchTab(branch)}
                        className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === branch ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        {branch}
                    </button>
                ))}
            </div>
        )}

        {!isSubmitted && (
            <button onClick={() => setActiveView('dashboard')} className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2">
                <Layout size={18}/> لوحة التحكم
            </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-50">
        <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto shadow-inner scrollbar-hide">
          <div className="grid grid-cols-1 gap-3">
              {displayQuestions.map((q, idx) => {
                  let statusClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent';
                  if (isSubmitted) {
                      if (answers[q.id] === q.correctIdx) statusClass = 'bg-green-100 text-green-700 border-green-500 shadow-sm';
                      else if (answers[q.id] !== undefined) statusClass = 'bg-red-100 text-red-700 border-red-500 shadow-sm';
                      else statusClass = 'bg-slate-100 text-slate-400 border-slate-300 border-dashed'; 
                  } else if (answers[q.id] !== undefined) {
                      statusClass = 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm';
                  }
                  const originalIndex = flatQuestions.findIndex(origQ => origQ.id === q.id) + 1;
                  return (
                    <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-xl font-bold text-base transition-all relative ${currentQIndex === idx ? 'ring-4 ring-amber-500 ring-offset-2 scale-105 z-10' : ''} ${statusClass}`}>
                        {originalIndex}
                        {flagged[q.id] && !isSubmitted && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>}
                    </button>
                  )
              })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-100 w-full p-4 md:p-8 gap-6`}>
          {currentQObj?.blockText && currentQObj.blockText.trim().length > 0 && (
            <div className="flex-1 w-full bg-white p-6 md:p-10 overflow-y-auto rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-xl border-b border-blue-100 pb-4 font-['Cairo']"><FileText size={24}/> نص المراجعة / القراءة:</h3>
              <p className="whitespace-pre-line leading-loose text-lg md:text-xl font-bold text-slate-700 font-['Cairo']">{currentQObj.blockText}</p>
            </div>
          )}
          
          <div className={`${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-6 md:p-10 overflow-y-auto flex flex-col shadow-xl rounded-3xl h-full border border-slate-200 relative`}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                  <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md font-['Cairo']">سؤال {flatQuestions.findIndex(origQ => origQ.id === currentQObj.id) + 1}</span>
                  {currentQObj.branch && currentQObj.branch !== 'عام' && (
                      <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2"><Layers size={16}/> {currentQObj.branch}</span>
                  )}
              </div>
              {!isSubmitted && <button onClick={() => { setFlagged({...flagged, [currentQObj.id]: !flagged[currentQObj.id]}) }} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition shadow-sm ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}><Flag size={16} /> {flagged[currentQObj.id] ? 'محدد للمراجعة' : 'تحديد لمراجعته لاحقاً'}</button>}
            </div>
            
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mb-8 shadow-inner text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-loose font-['Cairo'] drop-shadow-sm">
                  {(currentQObj.text || '').split('|').map((part, i, arr) => (
                      <React.Fragment key={i}>
                          {part.trim()}
                          {i !== arr.length - 1 && <br />}
                      </React.Fragment>
                  ))}
              </h3>
            </div>

            <div className="space-y-4">
              {(currentQObj.options || []).map((opt, idx) => {
                  let optionClass = 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700';
                  const isSelected = answers[currentQObj.id] === idx;
                  
                  if (isSubmitted) {
                      if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200'; 
                      else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md'; 
                      else optionClass = 'border-slate-200 bg-slate-50 opacity-50'; 
                  } else {
                      if (isSelected) optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.02] ring-2 ring-amber-200';
                  }

                  return (
                    <div key={idx} onClick={() => handleAnswer(currentQObj.id, idx)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && idx === currentQObj.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
                          {(isSubmitted && idx === currentQObj.correctIdx) && <Check size={16} className="text-white"/>}
                          {(isSubmitted && isSelected && idx !== currentQObj.correctIdx) && <X size={16} className="text-white"/>}
                      </div>
                      <span className="font-['Cairo'] text-xl font-bold leading-relaxed">{opt}</span>
                      {isSubmitted && idx === currentQObj.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
                      {isSubmitted && isSelected && idx !== currentQObj.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
                    </div>
                  )
              })}
            </div>

            <div className="mt-auto pt-10 flex justify-between">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex(p => p - 1)} className="px-8 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm font-['Cairo'] flex items-center gap-2"><ChevronRight size={20}/> السابق</button>
              <button disabled={currentQIndex === displayQuestions.length - 1} onClick={() => setCurrentQIndex(p => p + 1)} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-lg font-['Cairo'] flex items-center gap-2">التالي <ChevronRight size={20} className="rotate-180"/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 8. الواجب الذكي QR (SmartHomeworkScanner)
// ------------------------------------------------------------------
export const SmartHomeworkScanner = ({ hwId, user, onClose }) => {
    const [homeworkData, setHomeworkData] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchHw = async () => {
            const docRef = doc(db, 'smart_homeworks', hwId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setHomeworkData({ id: snap.id, ...snap.data() });
            } else {
                alert("الواجب غير موجود أو تم حذفه.");
                onClose();
            }
        };
        fetchHw();
    }, [hwId, onClose]);

    const handleImageCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageSrc(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImageWithGemini = async () => {
        if (!imageSrc || !homeworkData) return;
        setIsAnalyzing(true);
        
        try {
            const base64Data = imageSrc.split(',')[1];
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
            
            if(!apiKey) {
                setTimeout(async () => {
                    const dummyResult = { score: Math.floor(Math.random() * 10), total: 10, feedback: "تم استلام الواجب (محاكاة)." };
                    await saveResult(dummyResult);
                }, 2000);
                return;
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            const promptText = `أنت معلم لغة عربية. قم بتصحيح صورة الواجب هذه المكونة من أسئلة اختيار من متعدد. مفتاح الإجابة الصحيح هو: ${homeworkData.answerKey}. قم بإرجاع النتيجة بصيغة JSON فقط تحتوي على: {"score": عدد الإجابات الصحيحة, "total": العدد الكلي للأسئلة, "feedback": "تعليق قصير"}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '');
            const parsedResult = JSON.parse(cleanJson);
            
            await saveResult(parsedResult);

        } catch (error) {
            console.error("Error analyzing image:", error);
            alert("حدث خطأ أثناء التصحيح. تأكد من وضوح الصورة.");
            setIsAnalyzing(false);
        }
    };

    const saveResult = async (aiResult) => {
        const finalData = {
            studentId: user.uid,
            studentName: user.displayName || user.name || 'طالب',
            homeworkId: homeworkData.id,
            homeworkTitle: homeworkData.title,
            bookName: homeworkData.bookName || 'عام',
            grade: homeworkData.grade || 'غير محدد',
            score: aiResult.score,
            total: aiResult.total,
            feedback: aiResult.feedback,
            submittedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'homework_results'), finalData);
        setResult(aiResult);
        setIsAnalyzing(false);
    };

    if (!homeworkData) return <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col font-['Cairo']" dir="rtl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h2 className="font-bold flex items-center gap-2 text-blue-400"><QrCode/> تسليم الواجب: {homeworkData.title} {homeworkData.bookName && `(${homeworkData.bookName})`}</h2>
                <button onClick={onClose} className="bg-red-600 px-4 py-1 rounded text-sm font-bold">إلغاء</button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
                {!imageSrc ? (
                    <div className="space-y-6">
                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-blue-500 border-dashed">
                            <Camera size={48} className="text-blue-400"/>
                        </div>
                        <h3 className="text-2xl font-bold">صوّر صفحة الواجب</h3>
                        <p className="text-slate-400 max-w-md">تأكد من أن الإضاءة جيدة وأن الإجابات (أ، ب، ج، د) واضحة في الصورة ليتمكن الذكاء الاصطناعي من قراءتها بدقة.</p>
                        
                        <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg flex items-center gap-2 mx-auto">
                            <Camera /> افتح الكاميرا
                        </button>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageCapture} className="hidden" />
                    </div>
                ) : !result ? (
                    <div className="space-y-6 w-full max-w-md">
                        <img src={imageSrc} alt="Homework" className="w-full h-80 object-cover rounded-xl border-4 border-slate-700" />
                        {isAnalyzing ? (
                            <div className="bg-slate-800 p-6 rounded-xl border border-blue-500/50 flex flex-col items-center">
                                <Loader2 className="animate-spin text-blue-500 w-10 h-10 mb-4"/>
                                <p className="font-bold text-blue-400">الذكاء الاصطناعي يقوم بالتصحيح الآن...</p>
                                <p className="text-xs text-slate-400 mt-2">يرجى الانتظار ثوانٍ قليلة</p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => setImageSrc(null)} className="flex-1 bg-slate-700 py-3 rounded-xl font-bold hover:bg-slate-600">إعادة التصوير</button>
                                <button onClick={analyzeImageWithGemini} className="flex-1 bg-green-600 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/20">تأكيد وتصحيح</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white text-slate-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
                        <CheckCircle className="text-green-500 w-20 h-20 mx-auto mb-4"/>
                        <h2 className="text-3xl font-black mb-2 text-slate-800">النتيجة</h2>
                        <div className="text-5xl font-black text-amber-600 mb-6">{result.score} / {result.total}</div>
                        <p className="text-slate-600 font-bold mb-6">{result.feedback}</p>
                        <p className="text-xs text-slate-400 mb-6">تم إرسال الدرجة للمستر بنجاح.</p>
                        <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">العودة للمنصة</button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};