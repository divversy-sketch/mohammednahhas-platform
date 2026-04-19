import React, { useState, useEffect } from 'react';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { 
  doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, 
  onSnapshot, updateDoc, deleteDoc, orderBy, serverTimestamp, writeBatch, increment 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase'; 
import { GradeOptions, getGradeLabel } from '../components/common/GradeOptions';
import { formatWatchTime, generatePDF, sendSystemNotification } from '../utils/helpers';
import FloatingArabicBackground from '../components/common/Background';
import { ExamRunner, SmartHomeworkScanner, LiveSessionView, Leaderboard } from '../components/features/SharedFeatures';
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

// دالة مساعدة لاستخراج الأسئلة لتقرير الـ PDF
const getQuestionsForExam = (examData) => {
    if (!examData || !examData.questions) return [];
    return examData.questions.flatMap(q => q.subQuestions);
};

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('users'); 
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); 
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [messagesList, setMessagesList] = useState([]); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false });
  const [liveData, setLiveData] = useState({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '' });
  const [activeLiveSessions, setActiveLiveSessions] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [examBuilder, setExamBuilder] = useState({ title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '', isPremium: false });
  const [bulkText, setBulkText] = useState('');
  const [examsList, setExamsList] = useState([]);
  const [examResults, setExamResults] = useState([]); 
  const [viewingResult, setViewingResult] = useState(null); 
  const [newAnnouncement, setNewAnnouncement] = useState(""); 
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  
  const [autoReplies, setAutoReplies] = useState([]);
  const [newAutoReply, setNewAutoReply] = useState({ keywords: '', response: '', isActive: true });
  const [quotesList, setQuotesList] = useState([]);
  const [newQuote, setNewQuote] = useState({ text: '', source: '' });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);
  const [studentHistoryData, setStudentHistoryData] = useState([]);

  const [editingExamTime, setEditingExamTime] = useState(null);
  const [newEndTime, setNewEndTime] = useState('');

  const [smartHomeworks, setSmartHomeworks] = useState([]);
  const [newSmartHw, setNewSmartHw] = useState({ title: '', answerKey: '', grade: '3sec', bookName: '' });
  const [hwResults, setHwResults] = useState([]);

  // أكواد الاشتراك
  const [subscriptionCodes, setSubscriptionCodes] = useState([]);
  const [codeGenCount, setCodeGenCount] = useState(10);
  const [codeGenDays, setCodeGenDays] = useState(30);

  // تحديث حالة زر الرجوع للموبايل للأدمن
  useEffect(() => {
      window.history.pushState({ tab: activeTab }, '');
      const handlePopState = (e) => {
          if (e.state && e.state.tab) { setActiveTab(e.state.tab); } 
          else { setActiveTab('users'); }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  useEffect(() => {
      const q = query(collection(db, 'users'), where('status','==','pending'));
      const u = onSnapshot(q, s => setPendingUsers(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'users'), where('status', 'in', ['active', 'banned_cheating', 'banned_all', 'banned_exam', 'banned_content', 'rejected']));
      const u = onSnapshot(q, s => setActiveUsersList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'content'), orderBy('createdAt','desc'));
      const u = onSnapshot(q, s => setContentList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'messages'), orderBy('createdAt','desc'));
      const u = onSnapshot(q, s => setMessagesList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'live_sessions'), where('status', '==', 'active'));
      const u = onSnapshot(q, s => setActiveLiveSessions(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
      const u = onSnapshot(q, s => setExamsList(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'exam_results'), orderBy('submittedAt', 'desc'));
      const u = onSnapshot(q, s => setExamResults(s.docs.map(d=>({id:d.id,...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const u = onSnapshot(q, s => setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const u = onSnapshot(collection(db, 'auto_replies'), s => setAutoReplies(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const u = onSnapshot(collection(db, 'quotes'), s => setQuotesList(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);
  
  useEffect(() => {
      const u = onSnapshot(collection(db, 'smart_homeworks'), s => setSmartHomeworks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'homework_results'), orderBy('submittedAt', 'desc'));
      const u = onSnapshot(q, s => setHwResults(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  useEffect(() => {
      const q = query(collection(db, 'subscription_codes'), orderBy('createdAt', 'desc'));
      const u = onSnapshot(q, s => setSubscriptionCodes(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return u;
  }, []);

  const handleApprove = async (id) => {
    await updateDoc(doc(db,'users',id), {status:'active'});
    sendSystemNotification("مبروك! 🎉", "تم تفعيل حسابك بنجاح.");
  };

  const handleReject = async (id) => {
      await updateDoc(doc(db,'users',id), {status:'rejected'});
  };
  
  const handleChangeUserStatus = async (id, newStatus) => {
      await updateDoc(doc(db,'users',id), {status: newStatus});
  };

  const handleToggleSubscription = async (user) => {
      const isCurrentlyPremium = user.subscriptionStatus === 'premium';
      if (isCurrentlyPremium) {
          if(window.confirm("تحويل الطالب لباقة مجانية؟")) {
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'free', subscriptionExpiry: null });
          }
      } else {
          const days = prompt("كم يوم تريد تفعيل الباقة لهذا الطالب؟", "30");
          if (days && !isNaN(days)) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + parseInt(days));
              await updateDoc(doc(db, 'users', user.id), { subscriptionStatus: 'premium', subscriptionExpiry: expiryDate });
              alert(`تم تفعيل الطالب لمدة ${days} يوم.`);
          }
      }
  };

  const generateSubscriptionCodes = async () => {
      if(!codeGenCount || !codeGenDays) return;
      if(window.confirm(`هل أنت متأكد من توليد ${codeGenCount} كود جديد لمدة ${codeGenDays} يوم؟`)) {
          const batch = writeBatch(db);
          for(let i=0; i<codeGenCount; i++) {
              const codeString = 'NAHAS-' + Math.random().toString(36).substring(2,8).toUpperCase();
              const newDocRef = doc(collection(db, 'subscription_codes'));
              batch.set(newDocRef, {
                  code: codeString,
                  days: parseInt(codeGenDays),
                  used: false,
                  usedBy: null,
                  createdAt: serverTimestamp()
              });
          }
          await batch.commit();
          alert("تم توليد الأكواد بنجاح!");
      }
  };

  const handleDeleteCode = async (id) => {
      if(window.confirm("حذف هذا الكود؟")) await deleteDoc(doc(db, 'subscription_codes', id));
  };

  const handleDeleteUser = async (id) => { if(window.confirm("حذف نهائي؟")) await deleteDoc(doc(db,'users',id)); };
  const handleDeleteMessage = async (id) => { if(window.confirm("حذف الرسالة؟")) await deleteDoc(doc(db,'messages',id)); };
  const handleDeleteExam = async (id) => { if(window.confirm("حذف الامتحان؟")) await deleteDoc(doc(db, 'exams', id)); };
  const handleDeleteAnnouncement = async (id) => { if(window.confirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id)); };
  const handleDeleteResult = async (resultId) => { if(window.confirm("حذف النتيجة؟")) await deleteDoc(doc(db, 'exam_results', resultId)); };
  
  const handleDeleteAllResults = async () => {
    if(window.confirm("تحذير خطير: سيتم حذف جميع نتائج الامتحانات لكل الطلاب. هل أنت متأكد؟")) {
      const batch = writeBatch(db);
      examResults.forEach(res => {
        batch.delete(doc(db, 'exam_results', res.id));
      });
      await batch.commit();
      alert("تم حذف جميع النتائج بنجاح.");
    }
  };

  const sendWhatsAppToParent = (result) => {
      const student = activeUsersList.find(u => u.id === result.studentId);
      if (!student || !student.parentPhone) return alert("لا يوجد رقم ولي أمر مسجل لهذا الطالب!");
      let phone = student.parentPhone.trim();
      if (phone.startsWith('0')) phone = '20' + phone.substring(1);
      const examName = examsList.find(e => e.id === result.examId)?.title || 'اختبار';
      const message = `مرحباً ولي أمر الطالب/ة: *${result.studentName}* 🎓\n\nنحيط سيادتكم علماً بنتيجة امتحان: *${examName}*\nالدرجة التي حصل عليها: *${result.score}* من *${result.total}* 📊\n\nمع خالص تحيات إدارة منصة النحاس - أ/ محمد النحاس.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
  };

  const openStudentProfile = async (student) => {
      setViewingStudentProfile(student);
      try {
          const q = query(collection(db, 'video_views'), where('userId', '==', student.id));
          const snap = await getDocs(q);
          const history = snap.docs.map(d => d.data());
          history.sort((a, b) => (b.viewedAt?.seconds || 0) - (a.viewedAt?.seconds || 0));
          setStudentHistoryData(history);
      } catch (error) { console.error("Error fetching history:", error); }
  };

  const handleUpdateExamTime = async (e) => {
      e.preventDefault();
      if (!newEndTime) return;
      try {
          await updateDoc(doc(db, 'exams', editingExamTime.id), { endTime: newEndTime });
          alert("تم تمديد وقت الامتحان بنجاح!");
          setEditingExamTime(null);
          setNewEndTime('');
      } catch (error) { console.error("Error updating exam time:", error); alert("حدث خطأ أثناء تعديل الوقت."); }
  };

  const handleCreateSmartHw = async (e) => {
      e.preventDefault();
      if (!newSmartHw.title || !newSmartHw.answerKey || !newSmartHw.bookName) return alert("أكمل البيانات (الاسم، الإجابة، والكتاب)");
      await addDoc(collection(db, 'smart_homeworks'), { ...newSmartHw, createdAt: serverTimestamp() });
      setNewSmartHw(prev => ({ ...prev, title: '', answerKey: '' }));
      alert("تم إنشاء الواجب! يمكنك نسخ الرابط الآن.");
  };

  const handleReplyMessage = async (msgId) => {
    const text = replyTexts[msgId];
    if (!text?.trim()) return;
    await updateDoc(doc(db, 'messages', msgId), { adminReply: text });
    setReplyTexts(prev => ({ ...prev, [msgId]: '' }));
    alert("تم إرسال الرد!");
  };
  
  const handleAddAnnouncement = async () => {
      if(!newAnnouncement.trim()) return;
      await addDoc(collection(db, 'announcements'), { text: newAnnouncement, createdAt: serverTimestamp() });
      await addDoc(collection(db, 'notifications'), { text: `تنبيه هام: ${newAnnouncement}`, grade: 'all', createdAt: serverTimestamp() });
      setNewAnnouncement("");
      alert("تم نشر الإعلان");
  };

  const handleUpdateUser = async (e) => { 
      e.preventDefault(); 
      if(!editingUser) return; 
      await updateDoc(doc(db, 'users', editingUser.id), { 
          name: editingUser.name, phone: editingUser.phone, parentPhone: editingUser.parentPhone, grade: editingUser.grade 
      }); 
      setEditingUser(null); 
  };
  
  const handleSendResetPassword = async (email) => { 
      if(window.confirm(`إرسال رابط تغيير كلمة السر لـ ${email}؟`)) await sendPasswordResetEmail(auth, email); 
  };
  
  const approveGrade = async (user) => {
      if (!user.requestedGrade) return;
      await updateDoc(doc(db, 'users', user.id), { grade: user.requestedGrade, requestedGrade: null, gradeUpdateStatus: null });
      alert(`تم تغيير مرحلة الطالب ${user.name} بنجاح.`);
  };

  const rejectGrade = async (user) => {
      await updateDoc(doc(db, 'users', user.id), { requestedGrade: null, gradeUpdateStatus: null });
      alert(`تم رفض طلب تغيير المرحلة للطالب ${user.name}.`);
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1048576) { 
          alert("⚠️ تنبيه: حجم الملف أكبر من 1 ميجا.\n\nقواعد البيانات لا تقبل ملفات ضخمة مباشرة. لرفع ملفات كبيرة (كتب كاملة أو فيديوهات)، يرجى رفعها على Google Drive ونسخ الرابط هنا في خانة 'الرابط'.");
          e.target.value = null; 
          return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onprogress = (event) => {
          if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
          }
      };
      reader.onloadend = () => {
          setNewContent({...newContent, url: reader.result});
          setIsUploading(false);
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 2000);
      };
      reader.readAsDataURL(file);
  };

  const handleAddContent = async (e) => { 
      e.preventDefault(); 
      const allowedEmailsArray = newContent.allowedEmails 
        ? newContent.allowedEmails.split(',').map(email => email.trim()) 
        : [];

      const contentData = { 
          ...newContent, 
          file: newContent.url, 
          allowedEmails: allowedEmailsArray,
          createdAt: new Date() 
      };
      
      await addDoc(collection(db, 'content'), contentData);
      
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), { text: `تم إضافة درس جديد: ${newContent.title}`, grade: newContent.grade, createdAt: serverTimestamp() });
      } 
      
      alert("تم النشر!"); 
      setNewContent({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false });
  }; 
  
  const handleDeleteContent = async (id) => { 
      if(window.confirm("حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id)); 
  };

  const startLiveStream = async () => { 
      if(!liveData.liveUrl) return alert("الرابط مطلوب!"); 
      const allowedEmailsArray = liveData.allowedEmails ? liveData.allowedEmails.split(',').map(email => email.trim()) : [];
      await addDoc(collection(db, 'live_sessions'), { 
          ...liveData, allowedEmails: allowedEmailsArray, status: 'active', createdAt: serverTimestamp() 
      }); 
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), { text: `🔴 بث مباشر الآن: ${liveData.title}`, grade: liveData.grade, createdAt: serverTimestamp() }); 
      }
      alert("بدأ البث!"); 
      setLiveData({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '' });
  };

  const stopLiveStream = async (id) => { 
      if(window.confirm("إنهاء البث؟")) { 
          await updateDoc(doc(db, 'live_sessions', id), { status: 'ended' }); 
          alert("تم الإنهاء"); 
      } 
  };

  const parseExam = async () => {
    if (!bulkText.trim()) return alert("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return alert("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return alert("يرجى تحديد وقت البدء والانتهاء");

    const lines = bulkText.split('\n').map(l => l.trim());
    const blocks = []; let currentBlock = { text: '', subQuestions: [] }; let currentQ = null; let isReadingPassage = false; let currentBranch = 'عام'; 

    lines.forEach(line => {
      if (line.startsWith('#فرع:') || line.startsWith('#الفرع:')) { currentBranch = line.replace('#فرع:', '').replace('#الفرع:', '').trim(); return; }
      if (line === 'بداية القطعة') { 
          if (currentQ) { currentBlock.subQuestions.push(currentQ); currentQ = null; }
          if (currentBlock.subQuestions.length > 0) { blocks.push(currentBlock); } 
          currentBlock = { text: '', subQuestions: [] }; isReadingPassage = true; return; 
      }
      if (line === 'نهاية القطعة') { isReadingPassage = false; return; }
      if (line === 'حذف القطعة') { 
          if(currentQ) { currentBlock.subQuestions.push(currentQ); currentQ = null; } 
          if (currentBlock.subQuestions.length > 0) { blocks.push(currentBlock); }
          currentBlock = { text: '', subQuestions: [] }; return; 
      }

      if (isReadingPassage) { if(line !== '') currentBlock.text += line + '\n'; } 
      else {
        if (line === '') { if (currentQ && currentQ.options.length > 0) { currentBlock.subQuestions.push(currentQ); currentQ = null; } return; }
        const isCorrect = line.startsWith('*'); const optText = isCorrect ? line.substring(1).trim() : line.trim();
        if (currentQ && currentQ.options.length >= 4 && !isCorrect) { currentBlock.subQuestions.push(currentQ); currentQ = null; }
        if (!currentQ) { currentQ = { id: Date.now() + Math.random(), text: optText, options: [], correctIdx: 0, branch: currentBranch }; } 
        else { if (isCorrect) { currentQ.correctIdx = currentQ.options.length; } currentQ.options.push(optText); }
      }
    });
    
    if (currentQ && currentQ.options.length > 0) currentBlock.subQuestions.push(currentQ);
    if (currentBlock.subQuestions.length > 0) blocks.push(currentBlock);

    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return alert("لم يتم التعرف على أسئلة بشكل صحيح. تأكد من وجود إجابات تحت كل سؤال.");

    await addDoc(collection(db, 'exams'), { 
        title: examBuilder.title, grade: examBuilder.grade, duration: examBuilder.duration, 
        startTime: examBuilder.startTime, endTime: examBuilder.endTime, accessCode: examBuilder.accessCode, 
        isPremium: examBuilder.isPremium,
        questions: finalBlocks, createdAt: serverTimestamp() 
    });
    
    await addDoc(collection(db, 'notifications'), { text: `امتحان جديد: ${examBuilder.title}`, grade: examBuilder.grade, createdAt: serverTimestamp() });
    setBulkText(""); 
    alert(`تم نشر الامتحان بنجاح!`);
  };

  const toggleLeaderboard = async () => {
      await setDoc(doc(db, 'settings', 'config'), { show: !showLeaderboard }, { merge: true });
      setShowLeaderboard(!showLeaderboard);
  };

  const handleAddAutoReply = async () => {
      if(!newAutoReply.keywords || !newAutoReply.response) return alert("أكمل البيانات");
      await addDoc(collection(db, 'auto_replies'), newAutoReply);
      setNewAutoReply({ keywords: '', response: '', isActive: true });
  };
  
  const toggleAutoReply = async (id, currentStatus) => { await updateDoc(doc(db, 'auto_replies', id), { isActive: !currentStatus }); };
  const deleteAutoReply = async (id) => { if(window.confirm("حذف هذا الرد؟")) await deleteDoc(doc(db, 'auto_replies', id)); };
  const handleAddQuote = async () => {
      if(!newQuote.text || !newQuote.source) return alert("أكمل البيانات");
      await addDoc(collection(db, 'quotes'), { ...newQuote, createdAt: serverTimestamp() });
      setNewQuote({ text: '', source: '' });
  };
  const deleteQuote = async (id) => { if(window.confirm("حذف هذه الحكمة؟")) await deleteDoc(doc(db, 'quotes', id)); };

  const filteredPendingUsers = pendingUsers.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredActiveUsers = activeUsersList.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter);
  const filteredContentList = contentList.filter(c => adminGradeFilter === 'all' || c.grade === adminGradeFilter);
  const filteredExamsList = examsList.filter(e => adminGradeFilter === 'all' || e.grade === adminGradeFilter);
  const filteredLiveSessions = activeLiveSessions.filter(ls => adminGradeFilter === 'all' || ls.grade === adminGradeFilter);

  return (
    <div className="min-h-screen bg-slate-100 font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      <FloatingArabicBackground />

      {editingExamTime && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                  <button onClick={() => setEditingExamTime(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                  <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2"><Calendar size={24}/> تمديد وقت الامتحان</h3>
                  <p className="text-sm text-slate-600 mb-6 font-bold">{editingExamTime.title}</p>
                  <form onSubmit={handleUpdateExamTime}>
                      <label className="block text-sm font-bold mb-2 text-slate-800">تاريخ ووقت الانتهاء الجديد:</label>
                      <input type="datetime-local" className="w-full border-2 border-blue-200 p-3 rounded-xl mb-6 bg-blue-50 focus:border-blue-500 outline-none transition" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} required />
                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50">حفظ التعديل</button>
                  </form>
              </div>
          </div>
      )}

      {viewingStudentProfile && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
              <div className="bg-slate-50 rounded-3xl w-full max-w-6xl h-full md:h-[90vh] shadow-2xl flex flex-col relative overflow-hidden border border-slate-300">
                  <button onClick={() => setViewingStudentProfile(null)} className="absolute top-4 left-4 md:top-6 md:left-6 z-50 bg-red-100 p-2 md:p-3 rounded-full text-red-600 hover:bg-red-200 hover:text-red-700 transition shadow-md border border-red-200"><X size={24}/></button>
                  <div className="bg-white border-b border-slate-200 p-6 pt-16 md:pt-6 flex justify-between items-start flex-shrink-0">
                      <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
                              {viewingStudentProfile.name.charAt(0)}
                          </div>
                          <div>
                              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                  {viewingStudentProfile.name} 
                                  <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(viewingStudentProfile.grade)}</span>
                                  {viewingStudentProfile.subscriptionStatus === 'premium' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>}
                              </h2>
                              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-sm text-slate-500 font-bold">
                                  <span className="flex items-center gap-1"><Phone size={14}/> {viewingStudentProfile.phone}</span>
                                  <span className="flex items-center gap-1 text-amber-600"><Users size={14}/> ولي الأمر: {viewingStudentProfile.parentPhone}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
                              <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2 border-b pb-2"><PlayCircle/> سجل مشاهدات الفيديوهات</h3>
                              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                  {studentHistoryData.length === 0 ? <p className="text-slate-400 text-center py-10">لم يفتح أي فيديو.</p> : studentHistoryData.map((v, i) => (
                                      <div key={i} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                                          <div>
                                              <p className="font-bold text-slate-800">{v.videoTitle}</p>
                                              <p className="text-xs text-slate-400 mt-1">آخر فتح: {v.viewedAt?.toDate().toLocaleString('ar-EG')}</p>
                                          </div>
                                          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold text-center">شاهد لمدة<br/><span className="text-sm">{formatWatchTime(v.watchedSeconds)}</span></div>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="flex flex-col gap-6 h-[500px]">
                              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-bold text-lg mb-4 text-emerald-800 flex items-center gap-2 border-b pb-2"><ClipboardList/> نتائج الامتحانات</h3>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                      {(() => {
                                          const sExams = examResults.filter(r => r.studentId === viewingStudentProfile.id);
                                          if (sExams.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بحل أي امتحان.</p>;
                                          return sExams.map(ex => (
                                              <div key={ex.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <p className="font-bold text-slate-700 text-sm">{examsList.find(e => e.id === ex.examId)?.title || 'امتحان محذوف'}</p>
                                                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${ex.status === 'cheated' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{ex.status === 'cheated' ? 'غش 🚫' : `${ex.score}/${ex.total}`}</span>
                                              </div>
                                          ))
                                      })()}
                                  </div>
                              </div>

                              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                                  <h3 className="font-bold text-lg mb-4 text-amber-800 flex items-center gap-2 border-b pb-2"><QrCode/> سجل واجبات (QR)</h3>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                      {(() => {
                                          const sHw = hwResults.filter(r => r.studentId === viewingStudentProfile.id);
                                          if (sHw.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بتسليم أي واجب QR.</p>;
                                          return sHw.map(hw => (
                                              <div key={hw.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                  <div>
                                                      <p className="font-bold text-slate-700 text-sm">{hw.homeworkTitle}</p>
                                                      <p className="text-xs text-slate-400">{hw.bookName}</p>
                                                  </div>
                                                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-bold">{hw.score}/${hw.total}</span>
                                              </div>
                                          ))
                                      })()}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <header className="flex justify-between items-center mb-8 glass-panel p-4 rounded-xl relative z-10 m-4">
        <div className="flex items-center gap-2"><ShieldAlert className="text-amber-600"/> <h1 className="text-2xl font-bold font-arabic text-slate-800">لوحة تحكم النحاس (الأدمن)</h1></div>
        <div className="flex gap-4 items-center">
            <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm cursor-pointer hidden md:block" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
                <option value="all">كل المراحل الدراسية</option>
                <GradeOptions />
            </select>
            <button onClick={() => signOut(auth)} className="text-red-500 font-bold px-4 py-2 flex gap-2 hover:bg-red-50 rounded-lg transition"><LogOut /> خروج</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4 md:p-6 relative z-10">
        <div className="glass-panel p-4 rounded-xl h-fit space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible whitespace-nowrap scrollbar-hide">
          {['users', 'all_users', 'subscriptions', 'exams', 'results', 'smart_hw', 'live', 'content', 'messages', 'auto_reply', 'quotes', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 transition-all ${activeTab===tab?'bg-amber-100 text-amber-700 shadow-sm border-b-4 md:border-b-0 md:border-r-4 border-amber-500':'hover:bg-slate-50 text-slate-600'}`}>
              {tab === 'users' ? 'الطلبات' : tab === 'all_users' ? 'الطلاب' : tab === 'subscriptions' ? 'أكواد الاشتراكات' : tab === 'exams' ? 'الامتحانات' : tab === 'results' ? 'النتائج' : tab === 'smart_hw' ? 'الواجب الذكي (QR)' : tab === 'live' ? 'البث' : tab === 'content' ? 'المحتوى' : tab === 'messages' ? 'الرسائل' : tab === 'auto_reply' ? 'الرد الآلي' : tab === 'quotes' ? 'إدارة الحكم' : 'الإعدادات'}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 w-full overflow-hidden">
          {activeTab === 'users' && <div className="glass-panel p-4 md:p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">طلبات الانضمام</h2>{filteredPendingUsers.map(u=><div key={u.id} className="border p-4 mb-2 rounded-lg flex flex-col md:flex-row gap-3 justify-between bg-white/50 backdrop-blur-sm"><div><p className="font-bold">{u.name}</p><p className="text-sm">{u.grade}</p></div><div className="flex gap-2"><button onClick={()=>handleApprove(u.id)} className="bg-green-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-green-500/50 transition flex-1"><Check className="mx-auto"/></button><button onClick={()=>handleReject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded shadow-lg hover:shadow-red-500/50 transition flex-1"><X className="mx-auto"/></button></div></div>)}</div>}

          {activeTab === 'all_users' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                      <h2 className="font-bold font-arabic text-xl">قائمة الطلاب ({filteredActiveUsers.length})</h2>
                      <div className="md:hidden">
                          <select className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm w-full" value={adminGradeFilter} onChange={(e) => setAdminGradeFilter(e.target.value)}>
                              <option value="all">كل المراحل</option><GradeOptions />
                          </select>
                      </div>
                  </div>
                  
                  {editingUser && (
                      <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                              <button onClick={() => setEditingUser(null)} className="absolute top-4 left-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                              <h3 className="text-xl font-bold mb-6 text-blue-800 flex items-center gap-2 border-b pb-2"><Edit size={24}/> تعديل بيانات الطالب</h3>
                              <form onSubmit={handleUpdateUser} className="space-y-4">
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">اسم الطالب</label><input className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.name || ''} onChange={e=>setEditingUser({...editingUser, name:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف الطالب</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.phone || ''} onChange={e=>setEditingUser({...editingUser, phone:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف ولي الأمر</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.parentPhone || ''} onChange={e=>setEditingUser({...editingUser, parentPhone:e.target.value})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">المرحلة الدراسية</label><select className="w-full border-2 border-blue-100 p-3 rounded-xl bg-white focus:border-blue-500 outline-none transition" value={editingUser.grade || '1sec'} onChange={e=>setEditingUser({...editingUser, grade:e.target.value})}><GradeOptions /></select></div>
                                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50 mt-2">حفظ التعديلات</button>
                              </form>
                          </div>
                      </div>
                  )}
                  
                  <div className="grid gap-4">
                      {filteredActiveUsers.map(u=>(
                          <div key={u.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all hover:shadow-lg ${u.status.startsWith('banned') ? 'bg-red-50 border-red-200' : 'bg-white/50 border-slate-100'}`}>
                              <div className="flex flex-col lg:flex-row justify-between w-full gap-4">
                                  <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                          <p className="font-bold text-lg text-slate-800">{u.name}</p>
                                          <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(u.grade)}</span>
                                          {u.subscriptionStatus === 'premium' ? (
                                              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>
                                          ) : (
                                              <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">مجاني</span>
                                          )}
                                          {u.status.startsWith('banned') && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold">محظور</span>}
                                      </div>
                                      <div className="text-sm text-slate-500 space-y-1">
                                          <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> الطالب: {u.phone}</p>
                                          <p className="flex items-center gap-2 font-bold text-amber-700"><Users size={14}/> ولي الأمر: {u.parentPhone}</p>
                                          {u.subscriptionStatus === 'premium' && u.subscriptionExpiry && (
                                              <p className="flex items-center gap-2 text-green-600 font-bold"><Clock size={14}/> ينتهي اشتراكه: {u.subscriptionExpiry.toDate().toLocaleDateString('ar-EG')}</p>
                                          )}
                                      </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                                      <div className="flex flex-wrap gap-2">
                                          <button onClick={() => handleToggleSubscription(u)} className={`flex-1 lg:flex-none px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${u.subscriptionStatus === 'premium' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                                              <Crown size={14}/> {u.subscriptionStatus === 'premium' ? 'إلغاء الباقة' : 'تفعيل باقة VIP'}
                                          </button>
                                          <select className="flex-1 lg:flex-none text-xs border p-2 rounded-lg bg-white font-bold" value={u.status} onChange={(e) => handleChangeUserStatus(u.id, e.target.value)}>
                                              <option value="active">نشط</option><option value="banned_all">حظر شامل</option><option value="banned_exam">حظر امتحانات</option><option value="banned_content">حظر محتوى</option>
                                          </select>
                                      </div>
                                      <div className="flex gap-2 justify-end mt-2">
                                          <button onClick={()=>openStudentProfile(u)} className="flex-1 lg:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-bold shadow-md flex items-center justify-center gap-2"><FileCheck size={16}/> ملف الطالب</button>
                                          <button onClick={()=>setEditingUser(u)} className="bg-blue-100 text-blue-600 p-2 rounded-lg hover:bg-blue-200"><Edit size={16}/></button>
                                          <button onClick={()=>handleSendResetPassword(u.email)} className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200"><KeyRound size={16}/></button>
                                          <button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>

                              {u.gradeUpdateStatus === 'pending' && (
                                  <div className="w-full bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3 mt-2">
                                      <div className="flex items-center gap-2 text-yellow-800 text-sm font-bold"><RefreshCw size={16} className="animate-spin-slow" /> يريد التحويل إلى: <span className="bg-white px-2 rounded border">{getGradeLabel(u.requestedGrade)}</span></div>
                                      <div className="flex gap-2 w-full md:w-auto"><button onClick={() => approveGrade(u)} className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-green-700">موافقة</button><button onClick={() => rejectGrade(u)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-red-700">رفض</button></div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                  <div className="glass-panel p-4 md:p-6 rounded-xl border-t-4 border-amber-500">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-700"><Key/> توليد أكواد اشتراكات (كروت شحن)</h2>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                          <p className="text-sm text-amber-800 font-bold mb-4">هذه الأكواد يمكن طباعتها وبيعها للطلاب لتفعيل باقة VIP لديهم فوراً عند إدخال الكود.</p>
                          <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأكواد المطلوبة</label>
                                  <input type="number" className="w-full border p-3 rounded-lg" value={codeGenCount} onChange={e=>setCodeGenCount(e.target.value)} />
                              </div>
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-slate-600 mb-1">مدة الاشتراك (بالأيام)</label>
                                  <input type="number" className="w-full border p-3 rounded-lg" value={codeGenDays} onChange={e=>setCodeGenDays(e.target.value)} />
                              </div>
                              <div className="flex items-end">
                                  <button onClick={generateSubscriptionCodes} className="w-full md:w-auto bg-amber-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-amber-700 transition">توليد الأكواد</button>
                              </div>
                          </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                          <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm text-sm whitespace-nowrap">
                              <thead className="bg-slate-800 text-white">
                                  <tr>
                                      <th className="p-3 text-right">الكود</th>
                                      <th className="p-3 text-center">المدة</th>
                                      <th className="p-3 text-center">الحالة</th>
                                      <th className="p-3 text-right">استخدم بواسطة</th>
                                      <th className="p-3 text-center">إجراء</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {subscriptionCodes.map((code, idx) => (
                                      <tr key={code.id} className={`border-b ${code.used ? 'bg-red-50 opacity-60' : 'hover:bg-slate-50'}`}>
                                          <td className="p-3 font-mono font-bold text-blue-700">{code.code}</td>
                                          <td className="p-3 text-center font-bold">{code.days} يوم</td>
                                          <td className="p-3 text-center">
                                              {code.used ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">مُستخدم</span> : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">جديد (صالح)</span>}
                                          </td>
                                          <td className="p-3 text-slate-600">{code.usedBy || '-'}</td>
                                          <td className="p-3 text-center">
                                              <button onClick={() => handleDeleteCode(code.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Trash2 size={16}/></button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'smart_hw' && (
              <div className="space-y-6">
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h2 className="text-xl font-bold mb-4 font-arabic text-blue-700 flex items-center gap-2"><QrCode/> إضافة واجب (للكتاب)</h2>
                      <form onSubmit={handleCreateSmartHw} className="grid gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">المرحلة الدراسية</label><select className="border p-3 rounded w-full bg-white" value={newSmartHw.grade} onChange={e=>setNewSmartHw({...newSmartHw, grade:e.target.value})}><GradeOptions/></select></div>
                              <div><label className="block text-xs font-bold mb-1 text-slate-500">اسم الكتاب</label><input className="border p-3 rounded w-full" placeholder="مثال: كتاب النحو الجزء الأول" value={newSmartHw.bookName} onChange={e=>setNewSmartHw({...newSmartHw, bookName:e.target.value})} required/></div>
                          </div>
                          <input className="border p-3 rounded" placeholder="اسم الواجب/رقم الصفحة (مثال: تدريبات صفحة 15)" value={newSmartHw.title} onChange={e=>setNewSmartHw({...newSmartHw, title:e.target.value})} required/>
                          <textarea className="border p-3 rounded h-24" placeholder="نموذج الإجابة (مثال: 1-أ, 2-ج, 3-د...)" value={newSmartHw.answerKey} onChange={e=>setNewSmartHw({...newSmartHw, answerKey:e.target.value})} required/>
                          <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/50">توليد رابط للصفحة</button>
                      </form>
                  </div>
                  
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4">الواجبات المضافة</h3>
                      <div className="space-y-6">
                          {(() => {
                              const filteredHw = smartHomeworks.filter(hw => adminGradeFilter === 'all' || hw.grade === adminGradeFilter);
                              if (filteredHw.length === 0) return <p className="text-slate-500">لا توجد واجبات في هذه المرحلة.</p>;
                              const hwByBook = filteredHw.reduce((acc, hw) => { const book = hw.bookName || 'كتب غير مصنفة'; if(!acc[book]) acc[book] = []; acc[book].push(hw); return acc; }, {});
                              return Object.entries(hwByBook).map(([bookName, hws]) => (
                                  <div key={bookName} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                                      <h4 className="font-bold text-lg text-amber-700 bg-amber-100 p-2 rounded-lg mb-4 flex items-center gap-2 w-max"><BookOpen size={20}/> كتاب: {bookName}</h4>
                                      <div className="space-y-3 pl-4 border-r-4 border-amber-300 pr-4 w-max min-w-full">
                                          {hws.map(hw => {
                                              const hwLink = `${window.location.origin}/?hw=${hw.id}`;
                                              return (
                                                  <div key={hw.id} className="bg-white border shadow-sm p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:border-amber-400 transition">
                                                      <div className="flex-1">
                                                          <p className="font-bold text-lg text-slate-800">{hw.title} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(hw.grade)}</span></p>
                                                          <p className="text-sm text-slate-500 mb-2 mt-1 bg-slate-50 p-2 rounded">الإجابات: <span className="font-mono text-blue-600">{hw.answerKey}</span></p>
                                                          <code className="bg-slate-100 p-2 rounded text-xs break-all border block select-all">{hwLink}</code>
                                                      </div>
                                                      <div className="flex gap-2 items-center flex-shrink-0">
                                                          <button onClick={() => { navigator.clipboard.writeText(hwLink); alert("تم نسخ الرابط!"); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 text-sm h-fit shadow-md">نسخ الرابط</button>
                                                          <button onClick={async () => { if(window.confirm('هل أنت متأكد من حذف هذه الصفحة؟')) await deleteDoc(doc(db, 'smart_homeworks', hw.id)); }} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg"><Trash2 size={18}/></button>
                                                      </div>
                                                  </div>
                                              )
                                          })}
                                      </div>
                                  </div>
                              ));
                          })()}
                      </div>
                  </div>

                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4 text-green-700">نتائج تصحيح الذكاء الاصطناعي</h3>
                      <div className="space-y-2 overflow-x-auto">
                          <div className="min-w-max">
                              {hwResults.filter(res => adminGradeFilter === 'all' || res.grade === adminGradeFilter).map(res => (
                                  <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50 mb-2">
                                      <div className="ml-4">
                                          <p className="font-bold">{res.studentName} <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600 mx-1">{getGradeLabel(res.grade)}</span></p>
                                          <p className="text-slate-500 text-xs font-bold mt-1">الكتاب: {res.bookName} - {res.homeworkTitle}</p>
                                          <p className="text-sm text-green-600 font-bold mt-1">الدرجة: {res.score}/{res.total}</p>
                                      </div>
                                      <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg text-center flex-shrink-0">
                                          {res.submittedAt?.toDate().toLocaleDateString('ar-EG')}<br/>{res.submittedAt?.toDate().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'exams' && (
              <div className="space-y-8">
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h2 className="text-xl font-bold mb-6 border-b pb-2 font-arabic text-amber-700">إنشاء امتحان</h2>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <input className="border p-2 rounded md:col-span-2" placeholder="العنوان" value={examBuilder.title} onChange={e=>setExamBuilder({...examBuilder, title:e.target.value})}/>
                          <input className="border p-2 rounded" placeholder="الكود" value={examBuilder.accessCode} onChange={e=>setExamBuilder({...examBuilder, accessCode:e.target.value})}/>
                          <input type="number" className="border p-2 rounded" placeholder="المدة (دقائق)" value={examBuilder.duration} onChange={e=>setExamBuilder({...examBuilder, duration:parseInt(e.target.value)})}/>
                          
                          <select className="border p-2 rounded md:col-span-2" value={examBuilder.grade} onChange={e=>setExamBuilder({...examBuilder, grade:e.target.value})}>
                              <GradeOptions/>
                          </select>
                          <div className="md:col-span-2 flex items-center bg-amber-50 border border-amber-200 rounded p-2">
                              <input type="checkbox" id="examVip" className="w-5 h-5 ml-2" checked={examBuilder.isPremium} onChange={e=>setExamBuilder({...examBuilder, isPremium: e.target.checked})} />
                              <label htmlFor="examVip" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={16}/> امتحان VIP (مغلق لغير المشتركين)</label>
                          </div>

                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت البدء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, startTime:e.target.value})}/>
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-xs font-bold mb-1">وقت الانتهاء</label>
                              <input type="datetime-local" className="border p-2 rounded w-full" onChange={e=>setExamBuilder({...examBuilder, endTime:e.target.value})}/>
                          </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                          <textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا...&#10;(هام 1: افصل بين كل سؤال والذي يليه بسطر فارغ تماماً، وضع علامة * قبل الإجابة الصحيحة)&#10;(هام 2: لتحديد فرع، اكتب #فرع: اسم_الفرع في سطر لوحده)" value={bulkText} onChange={e=>setBulkText(e.target.value)}/>
                          <button onClick={parseExam} className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-green-500/50 transition">نشر</button>
                      </div>
                  </div>
                  <div className="glass-panel p-4 md:p-6 rounded-xl">
                      <h3 className="font-bold mb-4 font-arabic">الامتحانات الحالية</h3>
                      <div className="overflow-x-auto">
                          <div className="min-w-[600px]">
                              {filteredExamsList.map(exam=>(
                                  <div key={exam.id} className="flex justify-between items-center border-b py-3 last:border-0 hover:bg-slate-50/50 px-2 rounded transition">
                                      <div>
                                          <p className="font-bold flex items-center gap-2">
                                              {exam.title}
                                              {exam.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                          </p>
                                          <p className="text-xs text-slate-500">من: {new Date(exam.startTime).toLocaleString('ar-EG')} | إلى: {new Date(exam.endTime).toLocaleString('ar-EG')}</p>
                                          <p className="text-xs text-slate-400">كود: {exam.accessCode}</p>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => { setEditingExamTime(exam); setNewEndTime(exam.endTime); }} className="text-blue-600 p-2 bg-blue-100 rounded-lg hover:bg-blue-200" title="تمديد الوقت"><Calendar size={18}/></button>
                                          <button onClick={()=>handleDeleteExam(exam.id)} className="text-red-600 p-2 bg-red-100 rounded-lg hover:bg-red-200" title="حذف"><Trash2 size={18}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'results' && (
             <div className="glass-panel p-4 md:p-6 rounded-xl">
               <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                 <h2 className="font-bold flex items-center gap-2 font-arabic text-xl"><Layout/> نتائج الامتحانات</h2>
                 {!viewingResult && examResults.length > 0 && (
                     <button onClick={handleDeleteAllResults} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition shadow-lg w-full md:w-auto justify-center"><Trash2 size={16}/> حذف جميع النتائج</button>
                 )}
               </div>
               {viewingResult ? (
                   <div className="bg-slate-50 p-4 rounded-xl border">
                       <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                           <button onClick={() => setViewingResult(null)} className="text-sm text-slate-500 underline font-bold text-right">العودة للقائمة</button>
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               const questions = getQuestionsForExam(examData);
                               return (
                                   <div className="flex gap-2">
                                       <button onClick={() => sendWhatsAppToParent(viewingResult)} className="flex-1 md:flex-none justify-center bg-green-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-bold hover:bg-green-600 shadow-sm"><MessageCircle size={16}/> واتساب لولي الأمر</button>
                                       <button onClick={() => generatePDF('admin', {...viewingResult, total: viewingResult.total || 0, examTitle: examData?.title, questions: questions, answers: viewingResult.answers })} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm"><Download size={16}/> التقرير</button>
                                   </div>
                               );
                           })()}
                       </div>
                       <h3 className="font-bold text-lg mb-2">إجابات الطالب: {viewingResult.studentName}</h3>
                       <div className="space-y-4 mt-4">
                           {(() => {
                               const examData = examsList.find(e => e.id === viewingResult.examId);
                               if(!examData) return <p>بيانات الامتحان محذوفة</p>;
                               const questions = getQuestionsForExam(examData);
                               const groupedQuestions = questions.reduce((acc, q) => { const b = q.branch || 'عام'; if(!acc[b]) acc[b] = []; acc[b].push(q); return acc; }, {});
                               return Object.entries(groupedQuestions).map(([branch, qs]) => (
                                   <div key={branch} className="mb-6">
                                       <h4 className="font-bold text-xl text-amber-700 bg-amber-100 p-2 rounded-lg mb-4">{branch}</h4>
                                       <div className="space-y-4">
                                           {qs.map((q, idx) => (
                                               <div key={idx} className="bg-white p-4 rounded border relative">
                                                   <p className="font-bold mb-2 text-lg md:text-xl text-blue-900 font-sans pr-10">
                                                       {q.text.split('|').map((part, i) => (<React.Fragment key={i}>{part.trim()}{i !== q.text.split('|').length - 1 && <br />}</React.Fragment>))}
                                                   </p>
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                                       {q.options.map((opt, oIdx) => {
                                                           const isCorrect = oIdx === q.correctIdx;
                                                           const isSelected = viewingResult.answers[q.id] === oIdx;
                                                           let style = "bg-gray-50 text-gray-500";
                                                           if (isCorrect) style = "bg-green-100 text-green-800 border-green-500 border font-bold md:text-lg";
                                                           if (isSelected && !isCorrect) style = "bg-red-100 text-red-800 border-red-500 border font-bold md:text-lg";
                                                           return <div key={oIdx} className={`p-3 rounded font-sans font-bold ${style}`}>{opt}</div>
                                                       })}
                                                   </div>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               ));
                           })()}
                       </div>
                   </div>
               ) : (
                   <div className="overflow-x-auto">
                       <div className="min-w-[600px] space-y-2">
                           {examResults.map(res => (
                               <div key={res.id} className="flex justify-between items-center border p-3 rounded hover:bg-slate-50 transition bg-white/50">
                                   <div><p className="font-bold">{res.studentName}</p><p className="text-xs text-slate-500">{res.status==='cheated'?'غش 🚫': res.status==='in_progress' ? 'قيد التنفيذ (لم يسلم) ⏳' : `درجة: ${res.score}/${res.total}`}</p></div>
                                   <div className="flex gap-2">
                                      {res.status === 'completed' && <button onClick={()=>sendWhatsAppToParent(res)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-200"><MessageCircle size={14}/><span className="hidden md:inline"> إرسال لولي الأمر</span></button>}
                                      <button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold">التفاصيل</button>
                                      <button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs font-bold">إعادة</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
             </div>
          )}

          {activeTab === 'live' && (
              <div className="glass-panel p-4 md:p-8 rounded-xl border-t-4 border-red-600">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-600 font-arabic"><Radio size={32}/> البث المباشر</h2>
                  <div className="grid gap-4 mb-8">
                      <input className="border p-3 rounded-xl w-full" placeholder="العنوان" value={liveData.title} onChange={e=>setLiveData({...liveData, title:e.target.value})}/>
                      <input className="border p-3 rounded-xl w-full" placeholder="رابط البث (Zoom/YouTube/Meet)" value={liveData.liveUrl} onChange={e=>setLiveData({...liveData, liveUrl:e.target.value})}/>
                      <input className="border p-3 rounded-xl w-full" placeholder="الرقم السري (اختياري، اتركه فارغاً للدخول بدون كود)" value={liveData.passcode} onChange={e=>setLiveData({...liveData, passcode:e.target.value})}/>
                      <input className="border p-3 rounded-xl w-full" placeholder="إيميلات مخصصة (اختياري، افصل بفاصلة)" value={liveData.allowedEmails} onChange={e=>setLiveData({...liveData, allowedEmails:e.target.value})}/>
                      <select className="border p-3 rounded-xl w-full" value={liveData.grade} onChange={e=>setLiveData({...liveData, grade:e.target.value})}><GradeOptions/></select>
                      <button onClick={startLiveStream} className="bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30 w-full md:w-auto">بدء بث جديد</button>
                  </div>
                  {filteredLiveSessions.length > 0 && (
                      <div className="mt-8 border-t pt-6">
                          <h3 className="font-bold mb-4">البث المباشر الحالي</h3>
                          <div className="space-y-3">
                              {filteredLiveSessions.map(session => (
                                  <div key={session.id} className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col md:flex-row gap-4 justify-between md:items-center">
                                      <div><p className="font-bold text-red-800">{session.title} <span className="text-xs bg-red-200 px-2 py-1 rounded-full text-red-700">{getGradeLabel(session.grade)}</span></p>{session.passcode && <p className="text-xs text-red-600 mt-1">كود الدخول: {session.passcode}</p>}</div>
                                      <button onClick={() => stopLiveStream(session.id)} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 transition">إنهاء البث</button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'content' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <h2 className="font-bold mb-4 font-arabic text-xl">إضافة محتوى</h2>
                  <form onSubmit={handleAddContent} className="grid gap-4 mb-6">
                      <input className="border p-3 rounded w-full" placeholder="العنوان" value={newContent.title} onChange={e=>setNewContent({...newContent, title:e.target.value})}/>
                      <input className="border p-3 rounded w-full" placeholder="الرابط (يفضل Google Drive للملفات الكبيرة)" value={newContent.url} onChange={e=>setNewContent({...newContent, url:e.target.value})}/>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition relative">
                          <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                              <Upload size={32} />
                              <span className="text-sm font-bold">اضغط هنا لرفع ملف (الحد الأقصى 1 ميجا)</span><span className="text-xs text-red-400">للملفات الأكبر، استخدم رابط خارجي</span>
                          </div>
                          {isUploading && (
                              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center rounded-xl z-10">
                                  <span className="text-sm font-bold text-amber-600 mb-1">جاري القراءة... {uploadProgress}%</span>
                                  <div className="w-3/4 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>
                              </div>
                          )}
                          {!isUploading && uploadProgress === 100 && (<div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl z-10"><span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={20}/> تم اختيار الملف</span></div>)}
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-2">
                          <select className="border p-3 rounded flex-1" value={newContent.type} onChange={e=>setNewContent({...newContent, type:e.target.value})}>
                              <option value="video">فيديو مدمج</option><option value="file">ملف (PDF)</option><option value="html">ملف تفاعلي (HTML)</option><option value="interactive_exam">امتحان تفاعلي (رابط/HTML)</option><option value="link">رابط خارجي (Google Meet, Drive, etc)</option>
                          </select>
                          {newContent.type === 'video' && (
                              <select className="border p-3 rounded flex-1" value={newContent.videoSection} onChange={e=>setNewContent({...newContent, videoSection:e.target.value})}>
                                  <option value="explanation">شرح الدرس</option>
                                  <option value="exercises">حل التدريبات</option>
                                  <option value="reviews">مراجعة نهائية</option>
                              </select>
                          )}
                          <select className="border p-3 rounded flex-1" value={newContent.grade} onChange={e=>setNewContent({...newContent, grade:e.target.value})}><GradeOptions/></select>
                      </div>

                      <div className="flex items-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <input type="checkbox" id="vipContent" className="w-5 h-5 ml-3" checked={newContent.isPremium} onChange={e=>setNewContent({...newContent, isPremium:e.target.checked})} />
                          <label htmlFor="vipContent" className="font-bold text-amber-800 text-sm flex items-center gap-1 cursor-pointer"><Crown size={18}/> محتوى VIP (مغلق ومخصص للمشتركين فقط)</label>
                      </div>
                      
                      <div className="border p-3 rounded-lg bg-gray-50">
                          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><Lock size={14}/> تخصيص لطلاب محددين (اختياري)</label>
                          <input className="border p-2 rounded w-full text-sm" placeholder="اكتب إيميلات الطلاب مفصولة بفاصلة" value={newContent.allowedEmails} onChange={e=>setNewContent({...newContent, allowedEmails:e.target.value})} />
                          <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لكي يظهر المحتوى للجميع.</p>
                      </div>
                      
                      <div className="flex items-center gap-2"><input type="checkbox" checked={newContent.isPublic} onChange={e=>setNewContent({...newContent, isPublic:e.target.checked})}/> <label>عام (يظهر للزوار في الصفحة الرئيسية)</label></div>
                      <button className="bg-amber-600 text-white p-3 rounded font-bold shadow-lg shadow-amber-500/30 w-full md:w-auto">نشر</button>
                  </form>
                  <div className="space-y-2 overflow-x-auto">
                      <div className="min-w-[600px]">
                          {filteredContentList.map(c=>(
                              <div key={c.id} className="flex justify-between border-b p-3 items-center bg-white/50 rounded hover:bg-white transition mb-2">
                                  <div className="flex items-center flex-wrap gap-2">
                                      <span className="font-bold ml-2">{c.title}</span>
                                      {c.type === 'video' && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold">{c.videoSection === 'exercises' ? 'حل تدريبات' : c.videoSection === 'reviews' ? 'مراجعة' : 'شرح'}</span>}
                                      {c.isPremium && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Crown size={10}/> VIP</span>}
                                      {c.allowedEmails && c.allowedEmails.length > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1 inline-flex"><Lock size={10}/> خاص</span>}
                                      {c.type === 'interactive_exam' && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded">امتحان تفاعلي</span>}
                                      {c.type === 'html' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded">HTML</span>}
                                      {c.type === 'link' && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded">رابط خارجي</span>}
                                  </div>
                                  <div className="flex gap-2"><button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button></div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'messages' && <div className="glass-panel p-4 md:p-6 rounded-xl"><h2 className="font-bold mb-4 font-arabic text-xl">الرسائل</h2>{messagesList.map(m=><div key={m.id} className="border-b p-4 bg-slate-50 mb-3 rounded-lg relative"><button onClick={()=>handleDeleteMessage(m.id)} className="absolute top-2 left-2 text-red-400 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button><div className="mb-2"><p className="font-bold text-amber-800">{m.senderName} <span className="text-xs text-slate-500">({m.sender})</span></p><p className="text-sm text-slate-400">{m.createdAt?.toDate?m.createdAt.toDate().toLocaleString():'الآن'}</p></div><p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 mb-3 text-sm md:text-base">{m.text}</p>{m.adminReply?<div className="bg-green-50 p-3 rounded-lg border border-green-200 text-sm"><span className="font-bold text-green-700">ردك: </span>{m.adminReply}</div>:<div className="flex flex-col md:flex-row gap-2"><input className="flex-1 border p-2 rounded text-sm w-full" placeholder="اكتب ردك..." value={replyTexts[m.id]||""} onChange={e=>setReplyTexts({...replyTexts,[m.id]:e.target.value})}/><button onClick={()=>handleReplyMessage(m.id)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm w-full md:w-auto flex justify-center"><Reply size={16}/></button></div>}</div>)}</div>}
           
          {activeTab === 'auto_reply' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <h2 className="font-bold mb-4 flex items-center gap-2 font-arabic text-xl"><Bot /> إعدادات الرد الآلي</h2>
                  <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                      <h3 className="font-bold mb-2 text-sm">إضافة قاعدة جديدة</h3>
                      <div className="grid gap-3">
                          <input className="border p-2 rounded w-full" placeholder="الكلمات المفتاحية (افصل بينها بفاصلة، مثال: سعر,حجز,مواعيد)" value={newAutoReply.keywords} onChange={e=>setNewAutoReply({...newAutoReply, keywords:e.target.value})} />
                          <textarea className="border p-2 rounded h-20 w-full" placeholder="الرد الذي سيظهر للطالب..." value={newAutoReply.response} onChange={e=>setNewAutoReply({...newAutoReply, response:e.target.value})} />
                          <button onClick={handleAddAutoReply} className="bg-amber-600 text-white py-2 rounded font-bold hover:bg-amber-700 w-full md:w-auto">إضافة القاعدة</button>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {autoReplies.map(rule => (
                          <div key={rule.id} className={`p-4 rounded-lg border flex flex-col md:flex-row justify-between md:items-center gap-4 ${rule.isActive ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
                              <div className="flex-1">
                                  <p className="font-bold text-sm text-slate-600 mb-1">الكلمات: <span className="text-blue-600">{rule.keywords}</span></p>
                                  <p className="text-slate-800 text-sm md:text-base">{rule.response}</p>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => toggleAutoReply(rule.id, rule.isActive)} className={`p-2 rounded-full ${rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`} title={rule.isActive ? "تعطيل" : "تنشيط"}><Power size={18} /></button>
                                  <button onClick={() => deleteAutoReply(rule.id)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><Trash2 size={18} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'quotes' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl">
                  <h2 className="font-bold mb-4 flex items-center gap-2 font-arabic text-xl"><PenTool /> إدارة الحكم والأقوال</h2>
                  <div className="bg-slate-50 p-4 rounded-xl border mb-6">
                      <h3 className="font-bold mb-2 text-sm">إضافة حكمة جديدة</h3>
                      <div className="grid gap-3">
                          <input className="border p-2 rounded w-full" placeholder="نص الحكمة" value={newQuote.text} onChange={e=>setNewQuote({...newQuote, text:e.target.value})} />
                          <input className="border p-2 rounded w-full" placeholder="المصدر (مثال: تحفيز، شعر، حكمة)" value={newQuote.source} onChange={e=>setNewQuote({...newQuote, source:e.target.value})} />
                          <button onClick={handleAddQuote} className="bg-amber-600 text-white py-2 rounded font-bold hover:bg-amber-700 w-full md:w-auto">إضافة</button>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {quotesList.map(q => (
                          <div key={q.id} className="p-3 rounded-lg border bg-white flex justify-between items-center gap-2">
                              <div><p className="font-bold text-slate-800 text-sm md:text-base">"{q.text}"</p><p className="text-xs text-slate-500">- {q.source}</p></div>
                              <button onClick={() => deleteQuote(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'settings' && (
              <div className="glass-panel p-4 md:p-6 rounded-xl space-y-6">
                  <h2 className="font-bold mb-4 font-arabic text-xl">إدارة الموقع</h2>
                  <div className="border p-4 rounded-xl">
                      <h3 className="font-bold mb-2 text-amber-600">شريط الإعلانات</h3>
                      <div className="flex flex-col md:flex-row gap-2 mb-4">
                          <input className="border p-2 flex-1 rounded w-full" placeholder="نص الإعلان" value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} />
                          <button onClick={handleAddAnnouncement} className="bg-green-600 text-white px-6 py-2 rounded font-bold w-full md:w-auto">نشر</button>
                      </div>
                      <div className="space-y-2">
                          {announcements.map(a => (
                              <div key={a.id} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                  <span className="text-sm">{a.text}</span><button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={14}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div><h3 className="font-bold text-blue-600">لوحة الشرف (الأوائل)</h3><p className="text-sm text-slate-500">إظهار أو إخفاء لوحة الأوائل في صفحة الطلاب</p></div>
                      <button onClick={toggleLeaderboard} className={`px-6 py-2 rounded-full font-bold w-full md:w-auto ${showLeaderboard ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{showLeaderboard ? 'ظاهرة' : 'مخفية'}</button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;