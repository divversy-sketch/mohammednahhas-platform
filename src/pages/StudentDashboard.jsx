import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { 
  doc, getDocs, collection, query, where, onSnapshot, orderBy, limit 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase'; 
import { getGradeLabel, GradeOptions } from '../components/common/GradeOptions';
import { requestNotificationPermission, sendSystemNotification, formatWatchTime } from '../utils/helpers';
import FloatingArabicBackground from '../components/common/Background';
import ModernLogo from '../components/common/ModernLogo';
import WisdomBox from '../components/features/WisdomBox';
import ChatWidget from '../components/features/ChatWidget';

// استدعاء الشاشات المشتركة اللي عملناها
import { 
  Announcements, Leaderboard, SecureVideoPlayer, PomodoroFocusMode, 
  InteractiveViewer, ExamRunner, SmartHomeworkScanner, LiveSessionView 
} from '../components/features/SharedFeatures';

import { 
  PlayCircle, FileText, LogOut, User, GraduationCap, Quote, CheckCircle, 
  Lock, Mail, ChevronRight, Menu, X, Loader2, AlertTriangle, PlusCircle, 
  Check, Trash2, Eye, ShieldAlert, Video, UploadCloud, Phone, Edit, KeyRound,
  MessageSquare, Send, MessageCircle, Facebook, BookOpen, Feather, Radio, 
  ExternalLink, ClipboardList, Timer, AlertOctagon, Flag, Save, HelpCircle, 
  Reply, Unlock, Layout, Settings, Trophy, Megaphone, Bell, Download, XCircle, 
  Calendar, Clock, FileWarning, Settings as GearIcon, Star, Bot, Power, Upload,
  Users, PenTool, Code, Sparkles, Lamp, Ban, Shield, RefreshCw, Link as LinkIcon, 
  History, Camera, QrCode, FileCheck, MousePointerClick, BarChart3, Layers,
  BrainCircuit, Headphones, DownloadCloud, PenLine, Play, Pause, SkipForward, 
  Target, AlertCircle, Crown, CreditCard, Key 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StudentDashboard = ({ user, userData, installPrompt }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [videoSectionTab, setVideoSectionTab] = useState('explanation');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [content, setContent] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]); 
  const [activeLiveView, setActiveLiveView] = useState(null); 
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [hwResults, setHwResults] = useState([]); 
  const [reviewingExam, setReviewingExam] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', parentPhone: '', grade: '' });
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [scanningHwId, setScanningHwId] = useState(null);
  
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
      window.history.pushState({ tab: activeTab }, '');
      const handlePopState = (e) => {
          if (e.state && e.state.tab) {
              setActiveTab(e.state.tab);
              setMobileMenu(false);
          } else {
              setActiveTab('home');
          }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  useEffect(() => {
    if(!userData) return;
    const urlParams = new URLSearchParams(window.location.search);
    const hwParam = urlParams.get('hw');
    if (hwParam) { setScanningHwId(hwParam); window.history.replaceState({}, document.title, window.location.pathname); }

    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', userData.grade)), s => {
        const allContent = s.docs.map(d=>({id:d.id,...d.data()}));
        const visibleContent = allContent.filter(c => { if (!c.allowedEmails || c.allowedEmails.length === 0) return true; return c.allowedEmails.includes(user.email); });
        setContent(visibleContent);
    });

    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active'), where('grade', '==', userData.grade)), s => {
        const activeSessions = s.docs.map(d=>({id:d.id, ...d.data()}));
        const visibleSessions = activeSessions.filter(ls => { if (!ls.allowedEmails || ls.allowedEmails.length === 0) return true; return ls.allowedEmails.includes(user.email); });
        setLiveSessions(visibleSessions);
    });

    const unsubExams = onSnapshot(query(collection(db, 'exams'), where('grade', '==', userData.grade)), s => setExams(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubHwResults = onSnapshot(query(collection(db, 'homework_results'), where('studentId', '==', user.uid)), s => {
        const results = s.docs.map(d=>({id:d.id,...d.data()})); results.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)); setHwResults(results);
    });
    const unsubMistakes = onSnapshot(query(collection(db, 'student_mistakes'), where('userId', '==', user.uid), orderBy('timestamp', 'desc')), s => { setMistakes(s.docs.map(d => ({id: d.id, ...d.data()}))); });
    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData.grade]), orderBy('createdAt', 'desc'), limit(10)), s => {
        const newNotifs = s.docs.map(d => d.data()); setNotifications(newNotifs);
        if(newNotifs.length > 0) { setHasNewNotif(true); if(newNotifs[0].text) sendSystemNotification("تنبيه جديد 🔔", newNotifs[0].text); }
    });

    setEditFormData({ name: userData.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData.grade });

    return () => { unsubContent(); unsubLive(); unsubExams(); unsubResults(); unsubHwResults(); unsubMistakes(); unsubNotif(); };
  }, [userData, user]);

  const isPremium = userData?.subscriptionStatus === 'premium' && (!userData.subscriptionExpiry || userData.subscriptionExpiry.toDate() > new Date());
  
  const startMistakesExam = () => {
      if (mistakes.length === 0) return alert("ليس لديك أي أخطاء مسجلة بعد! استمر في التميز 👏");
      const shuffledMistakes = [...mistakes].sort(() => 0.5 - Math.random()).slice(0, 20);
      const generatedExam = {
          id: 'custom_mistakes_exam', title: 'امتحان نقاط الضعف (بنك الأخطاء) 🏦', duration: shuffledMistakes.length * 2, 
          questions: [ { text: 'أجب عن هذه الأسئلة التي أخطأت بها سابقاً:', subQuestions: shuffledMistakes.map(m => m.question) } ]
      };
      setActiveExam(generatedExam);
  };

  const handleChargeSubscriptionCode = async (e) => {
      e.preventDefault();
      if(!subscriptionCodeInput.trim()) return alert("أدخل الكود أولاً");
      setIsCharging(true);
      try {
          const qStr = query(collection(db, 'subscription_codes'), where('code', '==', subscriptionCodeInput.trim()));
          const snap = await getDocs(qStr);
          if(snap.empty) { alert("الكود غير صحيح أو غير موجود."); setIsCharging(false); return; }
          
          const codeDoc = snap.docs[0];
          const codeData = codeDoc.data();
          if(codeData.used) { alert("عفواً، هذا الكود تم استخدامه من قبل."); setIsCharging(false); return; }

          const days = codeData.days;
          let newExpiry = new Date();
          if(isPremium && userData.subscriptionExpiry) {
              newExpiry = userData.subscriptionExpiry.toDate();
          }
          newExpiry.setDate(newExpiry.getDate() + days);

          const batch = writeBatch(db);
          batch.update(doc(db, 'users', user.uid), { subscriptionStatus: 'premium', subscriptionExpiry: newExpiry });
          batch.update(doc(db, 'subscription_codes', codeDoc.id), { used: true, usedBy: user.displayName || user.name });
          
          await batch.commit();
          alert(`تم شحن الكود بنجاح! تم تفعيل اشتراكك لمدة ${days} يوم.`);
          setSubscriptionCodeInput('');
      } catch (err) { console.error(err); alert("حدث خطأ أثناء الشحن"); }
      setIsCharging(false);
  };

  const handlePremiumClick = (callback) => {
      if(!isPremium) {
          alert("عفواً يا بطل، هذا المحتوى مخصص للطلاب المشتركين في الباقة المدفوعة (VIP). يرجى شحن حسابك أو التواصل مع المستر لترقية حسابك!");
          setActiveTab('subscription');
      } else {
          callback();
      }
  };

  // معالجة تعديل بيانات المستخدم
  const handleUpdateMyProfile = async (e) => {
      e.preventDefault();
      try {
          const updateData = { phone: editFormData.phone };
          if (editFormData.grade !== userData.grade) {
              updateData.requestedGrade = editFormData.grade;
              updateData.gradeUpdateStatus = 'pending';
              alert("تم إرسال طلب تغيير المرحلة للمستر. سيتم تغييره فور موافقته.");
          } else {
              alert("تم تحديث البيانات بنجاح.");
          }
          await updateDoc(doc(db, 'users', user.uid), updateData);
      } catch (err) {
          alert("حدث خطأ أثناء التحديث.");
      }
  };

  if (scanningHwId) return <SmartHomeworkScanner hwId={scanningHwId} user={user} onClose={() => setScanningHwId(null)} />;
  if (activeLiveView) return <LiveSessionView session={activeLiveView} user={user} onClose={() => setActiveLiveView(null)} />;
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  if (showFocusMode) return <PomodoroFocusMode onClose={() => setShowFocusMode(false)} />;
if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result || null} />;
  }

  const isBannedAll = userData?.status === 'banned_all';
  const isBannedExam = userData?.status === 'banned_exam' || userData?.status === 'banned_cheating'; 
  const isBannedContent = userData?.status === 'banned_content';

  if(userData?.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData?.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  if (isBannedAll) return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6"><Ban size={80} className="text-red-600 mb-4" /><h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2><p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p><button onClick={()=>signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">تسجيل الخروج</button></div>
  );

  const videos = content.filter(c => c.type === 'video');
  const filesAndLinks = content.filter(c => c.type === 'file' || c.type === 'link');
  const htmls = content.filter(c => c.type === 'html');
  const interactiveExams = content.filter(c => c.type === 'interactive_exam');

  const startExamWithCode = async (exam) => {
    if (isBannedExam) return alert("أنت محظور من دخول الامتحانات.");
    const previousResult = examResults.find(r => r.examId === exam.id);
    if (previousResult) {
        if (previousResult.status === 'completed') { alert(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`); } 
        else if (previousResult.status === 'in_progress' || previousResult.status === 'cheated') { alert("لقد بدأت هذا الامتحان بالفعل وتم احتسابه عليك. لا يمكن الإعادة."); }
        return;
    }
    const now = new Date(); const start = new Date(exam.startTime); const end = new Date(exam.endTime);
    if (now < start) return alert(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return alert("عفواً، انتهى وقت الامتحان.");
    const code = prompt("أدخل كود الامتحان:");
    if (code === exam.accessCode) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), { examId: exam.id, studentId: user.uid, studentName: user.displayName || user.name, score: 0, total: 0, status: 'in_progress', submittedAt: serverTimestamp() });
            setActiveExam({ ...exam, attemptId: attemptRef.id });
        } catch (error) { console.error("Error creating attempt record:", error); alert("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى."); }
    } else { alert("كود خاطئ!"); }
  };

  return (
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={user} userName={userData.name} onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <ChatWidget user={user} />
      
      <aside className={`fixed top-0 bottom-0 right-0 z-40 bg-white/95 backdrop-blur-xl w-72 p-6 shadow-xl transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : 'translate-x-full md:translate-x-0'} border-l border-slate-200 flex flex-col`}>
        <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
                <ModernLogo />
                <h1 className="text-2xl font-bold font-arabic text-amber-800">النحاس</h1>
            </div>
            <button onClick={() => setMobileMenu(false)} className="md:hidden"><X /></button>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto pr-2">
          <button onClick={() => {setActiveTab('home'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='home'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><User/> الرئيسية</button>
          
          <button onClick={() => {setActiveTab('subscription'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='subscription'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><Crown/> الباقة والاشتراك</button>

          {!isBannedContent && (
              <>
                <div onClick={() => {setActiveTab('videos'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='videos'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><PlayCircle/> المحاضرات</div>
                <div onClick={() => {setActiveTab('files'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='files'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><FileText/> الملفات و الروابط</div>
                <div onClick={() => {setActiveTab('htmls'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='htmls'?'bg-purple-100 text-purple-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-purple-600'}`}><Code/> محتوى تفاعلي</div>
              </>
          )}
          {!isBannedExam && (
              <>
                <div onClick={() => {setActiveTab('exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='exams'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><ClipboardList/> الامتحانات</div>
                <div onClick={() => {setActiveTab('interactive_exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='interactive_exams'?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><Sparkles/> امتحان تفاعلي</div>
                <div onClick={() => {setActiveTab('smart_hw_results'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='smart_hw_results'?'bg-blue-100 text-blue-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}><QrCode/> سجل الواجبات (QR)</div>
                <div onClick={() => {setActiveTab('mistakes_bank'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='mistakes_bank'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><BrainCircuit/> بنك الأخطاء</div>
              </>
          )}
          <button onClick={() => {setActiveTab('settings'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition ${activeTab==='settings'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><Settings/> ملفي الشخصي</button>
        </div>
        <div className="mt-auto pt-6"><button onClick={() => signOut(auth)} className="flex items-center gap-3 text-red-500 font-bold hover:bg-red-50 w-full p-4 rounded-xl transition"><LogOut/> خروج</button></div>
      </aside>

      <main className="p-4 md:p-10 relative z-10 min-h-screen md:pr-72 w-full transition-all">
        <div className="md:hidden flex justify-between items-center mb-6 glass-panel p-4 rounded-2xl shadow-sm"><h1 className="font-bold text-lg text-slate-800">منصة النحاس</h1><button onClick={() => setMobileMenu(true)} className="p-2 bg-slate-100 rounded-lg"><Menu /></button></div>
        <div className="flex justify-between items-center mb-6 relative">
            <div className="flex gap-2">
                {installPrompt && ( <button onClick={installPrompt} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition flex items-center gap-2"><DownloadCloud size={18}/><span className="hidden md:inline">تثبيت التطبيق</span></button> )}
                <button onClick={() => setShowFocusMode(true)} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-full font-bold shadow-lg transition flex items-center gap-2"><Headphones size={18}/><span className="hidden md:inline">التركيز</span></button>
            </div>
            <div className="flex items-center gap-3">
                {isPremium && <span className="hidden md:flex bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold items-center gap-1 border border-amber-200"><Crown size={14}/> VIP صالح حتى: {userData.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</span>}
                <button onClick={() => {requestNotificationPermission(); setShowNotifications(!showNotifications); setHasNewNotif(false);}} className="relative p-2 glass-panel rounded-full shadow-sm hover:bg-white transition">
                    <Bell className="text-slate-600"/>{hasNewNotif && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                </button>
            </div>
            {showNotifications && (
                <div className="absolute top-12 left-0 w-80 glass-panel rounded-xl shadow-xl border border-white/50 p-4 z-50 max-h-96 overflow-y-auto">
                    <h3 className="font-bold mb-3 text-sm text-slate-500">الإشعارات</h3>
                    {notifications.length === 0 ? <p className="text-xs text-slate-400">لا توجد إشعارات جديدة</p> : (
                        <div className="space-y-3">
                            {notifications.map((n, i) => (
                                <div key={i} className="text-sm bg-slate-50/50 p-2 rounded border-l-4 border-amber-500">{n.text}<div className="text-[10px] text-slate-400 mt-1">{n.createdAt?.toDate().toLocaleDateString()}</div></div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {activeTab === 'home' && (
            <div className="space-y-8">
                {liveSessions.map(ls => (
                    <div key={ls.id} className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border border-red-500/50 animate-pulse-slow">
                        <div>
                           <h3 className="font-bold font-arabic text-xl flex items-center gap-2"><Radio className="animate-pulse"/> بث مباشر الآن: {ls.title}</h3>
                           {ls.passcode && <p className="text-xs text-red-200 mt-1">هذا البث محمي برقم سري</p>}
                        </div>
                        <button onClick={() => handleJoinLive(ls)} className="bg-white text-red-700 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-50 transition w-full md:w-auto">انضمام الآن</button>
                    </div>
                ))}
                <WisdomBox />
                <Announcements />
                <h2 className="text-3xl font-bold text-slate-800 font-arabic flex flex-wrap items-center gap-2">
                    منور يا <span className="text-amber-600">{userData.name.split(' ')[0]}</span> 👋 
                    <span className="text-sm font-normal text-slate-500 bg-slate-200 px-3 py-1 rounded-full font-sans">{getGradeLabel(userData.grade)}</span>
                    {isPremium ? (
                        <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><Crown size={14}/> حساب VIP</span>
                    ) : (
                        <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 cursor-pointer" onClick={()=>setActiveTab('subscription')}>مجاني (رقي حسابك)</span>
                    )}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('videos')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-blue-900 group-hover:text-blue-600 transition">المحاضرات</h3>
                        <p className="relative z-10 text-3xl font-black text-blue-600">{videos.length}</p><PlayCircle className="absolute -bottom-6 -left-6 text-blue-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('files')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-amber-900 group-hover:text-amber-600 transition">الملفات</h3>
                        <p className="relative z-10 text-3xl font-black text-amber-600">{filesAndLinks.length}</p><FileText className="absolute -bottom-6 -left-6 text-amber-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedContent && setActiveTab('htmls')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedContent ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-purple-900 group-hover:text-purple-600 transition">تفاعلي</h3>
                        <p className="relative z-10 text-3xl font-black text-purple-600">{htmls.length}</p><Code className="absolute -bottom-6 -left-6 text-purple-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedExam && setActiveTab('exams')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedExam ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-slate-900 group-hover:text-slate-600 transition">الامتحانات</h3>
                        <p className="relative z-10 text-3xl font-black text-slate-600">{exams.length}</p><ClipboardList className="absolute -bottom-6 -left-6 text-slate-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={()=> !isBannedExam && setActiveTab('smart_hw_results')} className={`glass-card p-8 rounded-3xl relative overflow-hidden cursor-pointer group ${isBannedExam ? 'opacity-50 grayscale' : ''}`}>
                        <h3 className="relative z-10 text-xl font-bold mb-2 text-blue-900 group-hover:text-blue-600 transition">واجبات (QR)</h3>
                        <p className="relative z-10 text-3xl font-black text-blue-600">{hwResults.length}</p><QrCode className="absolute -bottom-6 -left-6 text-blue-200 opacity-50 w-40 h-40 group-hover:scale-110 transition"/>
                    </motion.div>
                </div>
                <Leaderboard />
            </div>
        )}

        {activeTab === 'subscription' && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <Crown size={64} className={`mx-auto mb-4 ${isPremium ? 'text-amber-500' : 'text-slate-300'}`} />
                    <h2 className="text-3xl font-bold font-arabic text-slate-800 mb-2">حالة اشتراكك</h2>
                    {isPremium ? (
                        <p className="text-green-600 font-bold text-lg bg-green-50 inline-block px-4 py-2 rounded-full border border-green-200">أنت الآن على الباقة المدفوعة (VIP). صالحة حتى: {userData.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</p>
                    ) : (
                        <p className="text-slate-500 font-bold text-lg">حسابك الآن مجاني. اشحن لتتمكن من فتح كل الفيديوهات والامتحانات المغلقة.</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-amber-500">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Key className="text-amber-500"/> شحن بكود (كارت)</h3>
                        <p className="text-slate-500 text-sm mb-6">إذا اشتريت كارت شحن أو حصلت على كود من السنتر، اكتبه هنا لتفعيل اشتراكك فوراً.</p>
                        <form onSubmit={handleChargeSubscriptionCode} className="flex flex-col gap-3">
                            <input 
                                className="border-2 border-slate-200 p-4 rounded-xl text-center font-mono font-bold text-lg tracking-widest focus:border-amber-500 outline-none" 
                                placeholder="مثال: NAHAS-XXXXXX"
                                value={subscriptionCodeInput}
                                onChange={e=>setSubscriptionCodeInput(e.target.value.toUpperCase())}
                            />
                            <button disabled={isCharging} className="bg-amber-600 text-white font-bold py-4 rounded-xl hover:bg-amber-700 shadow-lg flex justify-center items-center">
                                {isCharging ? <Loader2 className="animate-spin" /> : 'اشحن الكود الآن'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-500">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="text-blue-500"/> شحن فودافون كاش / إنستا باي</h3>
                        <p className="text-slate-500 text-sm mb-4">للشحن اليدوي، قم بتحويل قيمة الاشتراك إلى أحد الأرقام التالية:</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 text-center">
                            <p className="font-bold text-lg text-blue-900 font-mono">010XXXXXXXX</p>
                            <p className="text-xs text-slate-400 mt-1">(فودافون كاش - إنستا باي)</p>
                        </div>
                        <p className="text-sm font-bold text-slate-700 mb-4">بعد التحويل، أرسل صورة الوصل على الواتساب مع إيميلك ليتم التفعيل.</p>
                        <button onClick={() => window.open("https://wa.me/201500076322", "_blank")} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 shadow-lg flex items-center justify-center gap-2">
                            <Phone size={20}/> إرسال الوصل واتساب
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'mistakes_bank' && !isBannedExam && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold font-arabic text-red-700 flex items-center gap-3"><BrainCircuit size={32} className="text-red-500" /> بنك أخطاء الطالب 🏦</h2>
                        <p className="text-slate-500 mt-2 text-sm md:text-lg">كل سؤال أخطأت فيه سيتم تسجيله هنا لتتمكن من مراجعته والتدرب عليه.</p>
                    </div>
                    <button onClick={startMistakesExam} className="bg-red-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold shadow-xl shadow-red-500/30 hover:bg-red-700 transition flex items-center gap-2 transform hover:scale-105 w-full md:w-auto justify-center"><Target size={20}/> امتحان من أخطائي</button>
                </div>
                {mistakes.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm"><Trophy size={64} className="mx-auto text-amber-400 mb-4 opacity-80" /><h3 className="text-2xl font-bold text-slate-700">ممتاز جداً يا بطل! 👏</h3><p className="text-slate-500 mt-2">بنك الأخطاء الخاص بك فارغ تماماً. استمر على هذا المستوى.</p></div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-bold flex items-center gap-2 text-sm md:text-base">
                            <AlertOctagon /> لديك {mistakes.length} سؤال في بنك الأخطاء. يجب مراجعتها جيداً قبل الامتحان النهائي!
                        </div>
                        {mistakes.map(m => (
                            <div key={m.id} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-red-300 transition relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-slate-800 text-white text-xs px-3 py-1 rounded-bl-lg font-bold">من امتحان: {m.examTitle}</div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-800 mt-6 md:mt-4 mb-4 leading-relaxed font-sans">{m.question.text}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs text-red-500 font-bold mb-1">إجابتك الخاطئة كانت:</p><p className="font-bold text-slate-800">{m.question.studentAnswerText || 'غير معروف'}</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold mb-1">الإجابة الصحيحة هي:</p><p className="font-bold text-green-800">{m.question.correctAnswerText || 'غير معروف'}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {activeTab === 'videos' && !isBannedContent && (
            <div className="space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200">
                    <button onClick={() => setVideoSectionTab('explanation')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition ${videoSectionTab === 'explanation' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>شرح الدروس</button>
                    <button onClick={() => setVideoSectionTab('exercises')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition ${videoSectionTab === 'exercises' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>حل التدريبات</button>
                    <button onClick={() => setVideoSectionTab('reviews')} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition ${videoSectionTab === 'reviews' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border'}`}>المراجعات النهائية</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {videos.filter(v => (v.videoSection || 'explanation') === videoSectionTab).length === 0 ? (
                         <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                             <PlayCircle className="mx-auto text-slate-300 w-16 h-16 mb-4"/>
                             <p className="text-slate-500 font-bold">لا توجد فيديوهات في هذا القسم حالياً.</p>
                         </div>
                    ) : videos.filter(v => (v.videoSection || 'explanation') === videoSectionTab).map(v => (
                        <div key={v.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative group" onClick={() => handlePremiumClick(() => setPlayingVideo(v))}>
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative">
                                {v.isPremium && !isPremium ? <Lock className="text-slate-400 w-16 h-16 opacity-80" /> : <PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span>
                                {v.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                            </div>
                            <div className="p-4"><h3 className={`font-bold text-lg ${v.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{v.title}</h3></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'files' && !isBannedContent && (
            <div className="glass-panel rounded-xl overflow-hidden">
                {filesAndLinks.map(f => (
                    <div key={f.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center border-b last:border-0 hover:bg-white/50 transition gap-4">
                        <div className="flex items-center gap-4">
                            {f.type === 'link' ? (<div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs shadow-sm flex items-center justify-center"><LinkIcon size={16}/></div>) : (<div className="bg-red-100 text-red-600 p-3 rounded-lg font-bold text-xs shadow-sm">PDF</div>)}
                            <div>
                                <h4 className={`font-bold text-lg ${f.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'} flex items-center gap-2`}>
                                    {f.title}
                                    {f.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                </h4>
                                <span className="text-xs text-slate-500">{getGradeLabel(f.grade)}</span>
                            </div>
                        </div>
                        {f.isPremium && !isPremium ? (
                            <button onClick={()=>handlePremiumClick(()=>{})} className="px-4 py-2 rounded-lg font-bold transition shadow-sm bg-slate-100 text-slate-400 flex items-center justify-center gap-2"><Lock size={16}/> مقفل</button>
                        ) : (
                            <a href={f.url} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-lg font-bold transition shadow-sm text-center ${f.type === 'link' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{f.type === 'link' ? 'فتح الرابط' : 'تحميل'}</a>
                        )}
                    </div>
                ))}
            </div>
        )}
        
        {activeTab === 'htmls' && !isBannedContent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {htmls.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative" onClick={() => handlePremiumClick(() => setPlayingHtml(h))}>
                        <div className="h-48 bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center relative group">
                            {h.isPremium && !isPremium ? <Lock className="text-slate-400 w-20 h-20 opacity-80" /> : <Code className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                            {h.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                        </div>
                        <div className="p-4"><h3 className={`font-bold text-lg ${h.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{h.title}</h3><button className={`mt-2 w-full font-bold py-2 rounded-lg transition shadow-sm ${h.isPremium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>{h.isPremium && !isPremium ? 'مقفل' : 'تشغيل'}</button></div>
                    </motion.div>
                ))}
            </div>
        )}

        {activeTab === 'interactive_exams' && !isBannedExam && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {interactiveExams.map(h => (
                    <motion.div whileHover={{y:-5}} key={h.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative" onClick={() => handlePremiumClick(() => setPlayingHtml(h))}>
                        <div className="h-48 bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center relative group">
                            {h.isPremium && !isPremium ? <Lock className="text-slate-400 w-20 h-20 opacity-80" /> : <Sparkles className="text-white w-20 h-20 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(h.grade)}</span>
                            {h.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                        </div>
                        <div className="p-4"><h3 className={`font-bold text-lg ${h.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{h.title}</h3><button className={`mt-2 w-full font-bold py-2 rounded-lg transition shadow-sm ${h.isPremium && !isPremium ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>{h.isPremium && !isPremium ? 'مقفل' : 'بدء الامتحان'}</button></div>
                    </motion.div>
                ))}
            </div>
        )}
        
        {activeTab === 'exams' && !isBannedExam && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {exams.map(e => {
                const prevResult = examResults.find(r => r.examId === e.id);
                const isExamTimeOver = Date.now() > new Date(e.endTime).getTime();
                
                let statusText = null; let statusClass = "";
                if (prevResult) {
                    if (prevResult.status === 'completed') { statusText = `تم الحل: ${prevResult.score} درجة`; statusClass = "bg-green-500 text-white"; } 
                    else if (prevResult.status === 'in_progress') { statusText = "قيد التنفيذ / انسحاب ⚠️"; statusClass = "bg-yellow-500 text-white"; } 
                    else if (prevResult.status === 'cheated') { statusText = "تم الحظر (غش)"; statusClass = "bg-red-600 text-white"; }
                }

                return (
                  <motion.div whileHover={{scale:1.01}} key={e.id} className={`glass-card p-4 md:p-6 rounded-2xl relative overflow-hidden flex flex-col ${e.isPremium && !isPremium ? 'opacity-70' : ''}`}>
                    {statusText && <div className={`absolute top-0 left-0 text-[10px] md:text-xs px-2 md:px-3 py-1 rounded-br-xl font-bold shadow-md ${statusClass}`}>{statusText}</div>}
                    {e.isPremium && <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</div>}
                    
                    <h3 className={`text-lg md:text-xl font-bold mb-2 mt-4 md:mt-0 ${e.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{e.title}</h3>
                    <div className="flex justify-between text-xs md:text-sm text-slate-500 mb-4"><span>⏳ {e.duration} دقيقة</span><span>📝 {e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0)} سؤال</span></div>
                    
                    <div className="mt-auto">
                        {prevResult && prevResult.status === 'completed' ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                                 <button disabled className="flex-1 bg-slate-200 text-slate-500 py-2 md:py-3 rounded-xl font-bold cursor-not-allowed text-xs md:text-sm">تم الانتهاء</button>
                                 {isExamTimeOver ? (
                                    <button onClick={() => setReviewingExam(e)} className="flex-1 bg-blue-100 text-blue-700 py-2 md:py-3 rounded-xl font-bold hover:bg-blue-200 transition shadow-sm text-xs md:text-sm">عرض الأخطاء</button>
                                 ) : (
                                    <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2 md:py-3 rounded-xl font-bold cursor-not-allowed text-[10px] md:text-xs">المراجعة بعد الوقت</button>
                                 )}
                                 <button onClick={() => generatePDF('student', {studentName: user.displayName || user.name, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status, examTitle: e.title, questions: e.questions.flatMap(q => q.subQuestions), answers: prevResult.answers })} className="flex-1 bg-green-100 text-green-700 py-2 md:py-3 rounded-xl font-bold hover:bg-green-200 flex items-center justify-center gap-1 transition shadow-sm text-xs md:text-sm"><Download size={14}/> شهادة</button>
                            </div>
                        ) : prevResult ? (
                            <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-xl font-bold text-center border border-red-200 text-sm">لا يمكن إعادة الامتحان</div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500">يبدأ: {new Date(e.startTime).toLocaleString('ar-EG')}</p>
                                {e.isPremium && !isPremium ? (
                                    <button onClick={()=>handlePremiumClick(()=>{})} className="w-full bg-slate-200 text-slate-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed text-sm"><Lock size={16}/> امتحان مقفل (للمشتركين)</button>
                                ) : (
                                    <button onClick={() => startExamWithCode(e)} className="w-full bg-slate-900 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-slate-500/30 transition text-sm"><Lock size={14}/> ابدأ الامتحان</button>
                                )}
                            </div>
                        )}
                    </div>
                  </motion.div>
                )
             })}
          </div>
        )}

        {activeTab === 'smart_hw_results' && !isBannedExam && (
            <div className="glass-panel p-4 md:p-6 rounded-xl">
                <h2 className="text-xl md:text-2xl font-bold mb-6 font-arabic text-blue-800 flex items-center gap-2"><QrCode/> سجل الواجبات الذكية (QR)</h2>
                {hwResults.length === 0 ? (
                    <p className="text-slate-500 text-center py-10 bg-white rounded-xl border font-bold text-sm md:text-base">لم تقم بتسليم أي واجب ذكي عبر الكاميرا حتى الآن.</p>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            const hwByBook = hwResults.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                            return Object.entries(hwByBook).map(([bookName, hws]) => (
                                <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                                    <h4 className="font-bold text-base md:text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 w-max"><BookOpen size={18}/> كتاب: {bookName}</h4>
                                    <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4 w-max min-w-full">
                                        {hws.map(hw => (
                                            <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-amber-400 transition">
                                                <div className="flex-1">
                                                    <p className="font-bold text-base md:text-lg text-slate-800">{hw.homeworkTitle}</p>
                                                    <p className="text-xs md:text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded text-wrap break-words whitespace-normal">تعليق المصحح: <span className="font-bold text-blue-600">{hw.feedback}</span></p>
                                                </div>
                                                <div className="flex flex-col md:items-end gap-2 flex-shrink-0 border-t md:border-t-0 pt-2 md:pt-0 mt-2 md:mt-0">
                                                    <span className="text-lg md:text-xl font-black text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200 w-fit">{hw.score} / {hw.total}</span>
                                                    <span className="text-xs text-slate-400">{hw.submittedAt?.toDate().toLocaleDateString('ar-EG')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'settings' && (
              <div className="glass-panel p-4 md:p-8 rounded-xl max-w-2xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2 font-arabic text-slate-800"><Settings className="text-slate-700"/> إعدادات الحساب</h2>
                {userData.gradeUpdateStatus === 'pending' && (
                    <div className="mb-4 bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex flex-col md:flex-row items-center gap-2 font-bold text-center md:text-right text-sm">
                        <RefreshCw className="animate-spin-slow" size={20} /> 
                        لقد قمت بطلب تغيير المرحلة إلى {getGradeLabel(userData.requestedGrade)}. الطلب قيد المراجعة.
                    </div>
                )}
                <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.name} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير الاسم (تواصل مع الإدارة).</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label><input className="w-full border p-3 rounded-xl" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone:e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم ولي الأمر</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.parentPhone} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير رقم ولي الأمر.</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي (يتطلب موافقة الأدمن)</label><select className="w-full border p-3 rounded-xl bg-white" value={editFormData.grade} onChange={e=>setEditFormData({...editFormData, grade:e.target.value})}><GradeOptions /></select></div>
                  <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/40 transition mt-4">حفظ التعديلات</button>
                </form>
              </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;