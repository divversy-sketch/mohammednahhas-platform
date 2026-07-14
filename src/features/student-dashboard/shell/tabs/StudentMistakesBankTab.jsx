import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { PlayCircle, FileText, LogOut, User, Lock, Menu, X, Loader2, Phone, MessageSquare, BookOpen, ClipboardList, Unlock, Settings, Bell, Download, Code, Sparkles, Ban, RefreshCw, Link as LinkIcon, QrCode, FileCheck, BarChart3, BrainCircuit, Headphones, DownloadCloud, Play, Target, Crown, CreditCard, Key } from '@shared/icons/lucide-shim.jsx';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import { auth, db } from '@services/firebase';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground } from '@features/home/HomeWidgets';
import PomodoroFocusMode from '@features/study/PomodoroFocusMode';
import { platformNotify, platformPrompt, generatePDF, safeNumber, getResultPercentage, VIDEO_EXAM_UNLOCK_PERCENT } from '@shared/core/platformShared.jsx';
import PerformanceOverview from '@features/student-dashboard/components/PerformanceOverview.jsx';
import { StudentUnifiedHomeDashboard } from '@features/student-dashboard/components/home/StudentHomeCards.jsx';
import { LearningHubTabs } from '@features/student-dashboard/components/layout/StudentLayoutParts.jsx';
import { StudentV2SectionTitle, StudentV2Sidebar, StudentV2Topbar } from '@features/student-dashboard/components/chrome/StudentV2Chrome.jsx';
import StudentAssignmentsPanel from '@features/admin-dashboard/legacy/parts/StudentAssignmentsPanel.jsx';
import StudentSuccessPanel from '@features/studentSuccess/StudentSuccessPanel.jsx';
import { imagePlacementStyle } from '@shared/utils/imagePlacement.js';
import { StudentLiveClassesPanel, StudentExamReviewCenter, StudentCertificatePanel } from '@features/product/ProductExperienceSuite.jsx';
import { StudentReviewQuiz } from '@features/review/ReviewQuizSystem.jsx';

const StudentCoursesHub = lazy(() => import('@features/courses/CourseSystem').then((module) => ({ default: module.StudentCoursesHub })));
const StudentMessagesInbox = lazy(() => import('@features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.StudentMessagesInbox })));
const StudentRemediationCenter = lazy(() => import('@features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.StudentRemediationCenter })));
const ExamPreStartPanel = lazy(() => import('@features/smartLearning/SmartLearningEngine.jsx').then((module) => ({ default: module.ExamPreStartPanel })));

const LazyPanelFallback = () => (
  <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 text-center text-sm font-bold text-amber-700 shadow-sm">
    جاري تحميل الجزء المطلوب...
  </div>
);

const LazyPanel = ({ children }) => (
  <Suspense fallback={<LazyPanelFallback />}>
    {children}
  </Suspense>
);


function StudentPracticeBuilder({ userData, setActiveExam }) {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ branch: '', topic: '', difficulty: '', count: 10 });
  const grade = userData?.grade || '3sec';
  useEffect(() => {
    const q = query(collection(db, 'question_bank'), where('grade', '==', grade), limit(1000));
    return onSnapshot(q, (snap) => setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setQuestions([]));
  }, [grade]);
  const branches = useMemo(() => Array.from(new Set(questions.map((q) => q.branch).filter(Boolean))).sort(), [questions]);
  const topics = useMemo(() => Array.from(new Set(questions.filter((q) => !form.branch || q.branch === form.branch).map((q) => q.topic || q.lesson).filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),'ar')), [questions, form.branch]);
  const pool = useMemo(() => questions.filter((q) => (!form.branch || q.branch === form.branch) && (!form.topic || (q.topic || q.lesson) === form.topic) && (!form.difficulty || q.difficulty === form.difficulty)), [questions, form]);
  const startPractice = () => {
    if (!pool.length) return platformNotify('لا توجد أسئلة مطابقة لهذا الجزء حاليًا.');
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(Number(form.count) || 10, pool.length));
    const grouped = {};
    picked.forEach((q) => {
      const branch = q.branch || 'تدريب';
      grouped[branch] = grouped[branch] || { text: branch, subQuestions: [] };
      grouped[branch].subQuestions.push({
        id: `practice_${q.id}_${Math.random().toString(36).slice(2,7)}`,
        text: q.text,
        options: q.options || [],
        correctIdx: Number(q.correctIdx ?? 0),
        branch,
        topic: q.topic || q.lesson || 'عام',
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || '',
        maxScore: Number(q.mark || q.maxScore || 1),
        sourceQuestionId: q.id,
      });
    });
    setActiveExam({
      id: `student_practice_${Date.now()}`,
      title: `تدريب ذكي: ${form.topic || form.branch || 'مراجعة شاملة'}`,
      duration: Math.max(10, picked.length * 2),
      questions: Object.values(grouped),
      source: 'student_self_practice',
      practiceConfig: form,
    });
  };
  return <section className="rounded-3xl border border-indigo-100 bg-gradient-to-l from-indigo-50 via-white to-white p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-black text-indigo-600">اختبار على الجزء الذي تختاره</p><h3 className="text-xl font-black text-slate-900">أنشئ تدريبك الذكي بنفسك</h3><p className="mt-1 text-sm font-bold text-slate-500">اختر مثلًا: البلاغة ← التشبيه، والمنصة تسحب لك أسئلة عشوائية مناسبة فورًا.</p></div><div className="rounded-2xl bg-indigo-600 px-4 py-3 text-center text-white"><p className="text-2xl font-black">{pool.length}</p><p className="text-xs font-bold">سؤال متاح</p></div></div>
    <div className="grid gap-3 md:grid-cols-4">
      <select className="rounded-xl border bg-white p-3 font-black" value={form.branch} onChange={(e)=>setForm({...form,branch:e.target.value,topic:''})}><option value="">كل الفروع</option>{branches.map((b)=><option key={b}>{b}</option>)}</select>
      <select className="rounded-xl border bg-white p-3 font-black" value={form.topic} onChange={(e)=>setForm({...form,topic:e.target.value})}><option value="">كل الدروس</option>{topics.map((t)=><option key={t}>{t}</option>)}</select>
      <select className="rounded-xl border bg-white p-3 font-black" value={form.difficulty} onChange={(e)=>setForm({...form,difficulty:e.target.value})}><option value="">كل المستويات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
      <select className="rounded-xl border bg-white p-3 font-black" value={form.count} onChange={(e)=>setForm({...form,count:Number(e.target.value)})}><option value={5}>5 أسئلة</option><option value={10}>10 أسئلة</option><option value={15}>15 سؤالًا</option><option value={20}>20 سؤالًا</option></select>
    </div>
    <button onClick={startPractice} className="mt-4 flex items-center gap-2 rounded-2xl bg-indigo-700 px-6 py-3 font-black text-white shadow-lg shadow-indigo-200"><Sparkles size={18}/> ابدأ الاختبار المختار</button>
  </section>;
}

export default function StudentMistakesBankTab({ ctx }) {
  const {
    user,
    userData,
    installPrompt,
    activeTab,
    setActiveTab,
    videoSectionTab,
    setVideoSectionTab,
    lectureInnerTab,
    setLectureInnerTab,
    learningHubTab,
    setLearningHubTab,
    mobileMenu,
    setMobileMenu,
    activeExam,
    setActiveExam,
    playingVideo,
    setPlayingVideo,
    playingHtml,
    setPlayingHtml,
    reviewingExam,
    setReviewingExam,
    showNotifications,
    setShowNotifications,
    pushStatus,
    setPushStatus,
    editFormData,
    setEditFormData,
    showFocusMode,
    setShowFocusMode,
    preExam,
    setPreExam,
    scanningHwId,
    setScanningHwId,
    subscriptionCodeInput,
    setSubscriptionCodeInput,
    isCharging,
    handleChargeSubscriptionCode,
    paymentDraft,
    setPaymentDraft,
    isSendingPayment,
    handleSubmitPaymentRequest,
    supportDraft,
    setSupportDraft,
    isSendingSupport,
    handleSendSupportTicket,
    handleUpdateMyProfile,
    content,
    exams,
    examResults,
    hwResults,
    assignments,
    assignmentSubmissions,
    videoViews,
    mistakes,
    notifications,
    hasNewNotif,
    examAccessOverrides,
    setContent,
    setExams,
    setExamResults,
    setHwResults,
    setAssignments,
    setAssignmentSubmissions,
    setVideoViews,
    setMistakes,
    setNotifications,
    setHasNewNotif,
    enableMobilePushNotifications,
    isPremium,
    startMistakesExam,
    videos,
    filesAndLinks,
    htmls,
    interactiveExams,
    handlePremiumClick,
    getStoredLocalVideoProgress,
    getVideoWatchPercent,
    canOpenLinkedExam,
    openLinkedExamFromVideo,
    handleVideoProgress,
    latestVideoActivity,
    latestCompletedResult,
    inProgressExamResult,
    inProgressExam,
    pendingAssignments,
    pendingAssignmentsCount,
    completedVideoCount,
    videoCompletionPercent,
    completedExamResults,
    averageScore,
    recentNotificationItems,
    unseenNotificationCount,
    nowForStudentDashboard,
    nextOpenExam,
    weakBranches,
    subscriptionDaysLeft,
    isBannedAll,
    isBannedContent,
    isBannedExam,
    getExamAccessState,
    startExamWithCode,
  } = ctx;

  return (
    <>
{activeTab === 'mistakes_bank' && !isBannedExam && (
            <div className="space-y-5">
              <LearningHubTabs activeTab={activeTab} setActiveTab={setActiveTab} setLearningHubTab={setLearningHubTab} />
              <StudentPracticeBuilder userData={userData} setActiveExam={setActiveExam} />
              <StudentGrowthPanel
                user={user}
                userData={userData}
                exams={exams}
                examResults={examResults}
                assignments={assignments}
                assignmentSubmissions={assignmentSubmissions}
                hwResults={hwResults}
                mistakes={mistakes}
                videoViews={videoViews}
                content={content}
                onStartMistakesExam={startMistakesExam}
              />
            </div>
        )}
    </>
  );
}
