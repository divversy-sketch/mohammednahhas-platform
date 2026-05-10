import React, { useState, useEffect, useRef, useMemo } from 'react';
import {  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail 
} from 'firebase/auth';
import {  doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, 
  onSnapshot, updateDoc, deleteDoc, orderBy, serverTimestamp, writeBatch, limit, increment 
} from 'firebase/firestore';
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
  Target, AlertCircle, Crown, CreditCard, Key, Wand2, WalletCards, Smartphone
} from '../../shared/icons/lucide-shim.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, savePushTokenForUser, setupForegroundPushListener } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import MobileStudentBottomNav from '../../features/student/MobileStudentBottomNav';
import MobileExamHelperStyles from '../../shared/components/MobileExamHelperStyles';
import DesignSystemLoader from '../../shared/components/DesignSystemLoader';
import { GradeOptions, getGradeLabel } from '../../shared/constants/grades';
import { normalizeEgyptPhone, isValidEgyptPhone, validateEgyptianPhones } from '../../shared/utils/phone';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground, WisdomBox, Announcements, Leaderboard } from '../../features/home/HomeWidgets';
import PomodoroFocusMode from '../../features/study/PomodoroFocusMode';
import InteractiveViewer from '../../features/content/InteractiveViewer';
import { AdminCoursesManager, StudentCoursesHub } from '../../features/courses/CourseSystem';
import { uploadToCloudinary } from '../../services/cloudinaryUpload';
import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '../../services/firebaseContentUpload';
import {
  platformNotify,
  platformConfirm,
  platformPrompt,
  ToastCenter,
  formatWatchTime,
  requestNotificationPermission,
  sendSystemNotification,
  getYouTubeID,
  PLATFORM_WHATSAPP_NUMBER,
  openPlatformWhatsApp,
  WhatsAppContactButton,
  renderBracketHighlightedText,
  getQuestionsForExam,
  generatePDF,
  safeNumber,
  getResultPercentage,
  getGradeBadge,
  VIDEO_EXAM_UNLOCK_PERCENT,
  InlineTabs,
  TabPaneCard,
  getQuestionMaxScore,
  extractAllQuestions,
  calculateDetailedExamMetrics,
  getPerformanceInsights,
  getReviewRecommendations,
  StudentLocalAdvice,
  StudentLocalHomeCoach,
  LocalQuestionExplanation,
  LocalEssayReviewBox
} from '../../shared/core/platformShared.jsx';
import { isActiveAdminSnapshot, getInitialRouteMode, navigatePlatform, DebugCollector, DebugPanel } from '../../shared/core/debugTools.jsx';



import ExamRunner from '../../shared/platformParts/ExamRunner.jsx';
import PlatformPerformanceBooster from '../parts/PlatformPerformanceBooster.jsx';
import PaymentRequestStudentPanel from '../../shared/platformParts/PaymentRequestStudentPanel.jsx';
import AdminPaymentRequestsPanel from '../parts/AdminPaymentRequestsPanel.jsx';
import AdvancedAntiCheatInsights from '../parts/AdvancedAntiCheatInsights.jsx';
import AppConversionGuidePanel from '../parts/AppConversionGuidePanel.jsx';
import SmartSubscriptionManager from '../parts/SmartSubscriptionManager.jsx';
import LeaderboardPanel from '../../shared/platformParts/LeaderboardPanel.jsx';
import AdminQuestionDeepAnalytics from '../parts/AdminQuestionDeepAnalytics.jsx';
import StudentSmartPerformanceReport from '../../shared/platformParts/StudentSmartPerformanceReport.jsx';
import QuestionBankManager from '../parts/QuestionBankManager.jsx';
import AssignmentsManager from '../parts/AssignmentsManager.jsx';
import PerformanceOverview from '../parts/PerformanceOverview.jsx';
import StudentAssignmentsPanel from '../parts/StudentAssignmentsPanel.jsx';
import AdminProDashboard from '../parts/AdminProDashboard.jsx';
import ActivityIcon from '../parts/ActivityIcon.jsx';
import AdminPerformanceAnalytics from '../parts/AdminPerformanceAnalytics.jsx';
import AdminDashboard from '../parts/AdminDashboard.jsx';
import AuthPage from '../../shared/platformParts/AuthPage.jsx';
import AdminAccessDenied from '../parts/AdminAccessDenied.jsx';
import AppErrorBoundary from '../parts/AppErrorBoundary.jsx';

// ExamRunner moved to src/admin/parts/ExamRunner.jsx

// PlatformPerformanceBooster moved to src/admin/parts/PlatformPerformanceBooster.jsx

// PaymentRequestStudentPanel moved to src/admin/parts/PaymentRequestStudentPanel.jsx

// AdminPaymentRequestsPanel moved to src/admin/parts/AdminPaymentRequestsPanel.jsx

// AdvancedAntiCheatInsights moved to src/admin/parts/AdvancedAntiCheatInsights.jsx

// AppConversionGuidePanel moved to src/admin/parts/AppConversionGuidePanel.jsx

// SmartSubscriptionManager moved to src/admin/parts/SmartSubscriptionManager.jsx

// LeaderboardPanel moved to src/admin/parts/LeaderboardPanel.jsx

// AdminQuestionDeepAnalytics moved to src/admin/parts/AdminQuestionDeepAnalytics.jsx

// StudentSmartPerformanceReport moved to src/admin/parts/StudentSmartPerformanceReport.jsx

// QuestionBankManager moved to src/admin/parts/QuestionBankManager.jsx

// AssignmentsManager moved to src/admin/parts/AssignmentsManager.jsx

// PerformanceOverview moved to src/admin/parts/PerformanceOverview.jsx

// StudentAssignmentsPanel moved to src/admin/parts/StudentAssignmentsPanel.jsx

// AdminProDashboard moved to src/admin/parts/AdminProDashboard.jsx

// ActivityIcon moved to src/admin/parts/ActivityIcon.jsx

// AdminPerformanceAnalytics moved to src/admin/parts/AdminPerformanceAnalytics.jsx

// AdminDashboard moved to src/admin/parts/AdminDashboard.jsx

// AuthPage moved to src/admin/parts/AuthPage.jsx

// AdminAccessDenied moved to src/admin/parts/AdminAccessDenied.jsx

// AppErrorBoundary moved to src/admin/parts/AppErrorBoundary.jsx

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminChecking, setAdminChecking] = useState(false);
  const [isAdminAccount, setIsAdminAccount] = useState(false);

  useEffect(() => {
    if (!auth) return;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAdminAccount(false);
      setAuthLoading(false);

      if (!u) {
        setAdminChecking(false);
        return;
      }

      setAdminChecking(true);
      let adminVerified = false;
      try {
        const adminSnap = await getDoc(doc(db, 'admins', u.uid));
        adminVerified = isActiveAdminSnapshot(adminSnap);
      } catch (adminError) {
        console.warn('admin access check skipped:', adminError?.message);
      }
      setIsAdminAccount(adminVerified);
      setAdminChecking(false);
    });

    return () => unsubAuth();
  }, []);

  if (authLoading || adminChecking) return (
    <div className="h-screen live-loading-screen flex items-center justify-center font-['Cairo']" dir="rtl">
      <div className="live-loader-card bg-white/90 border border-amber-100 rounded-3xl shadow-2xl p-8 w-[88%] max-w-sm text-center relative overflow-hidden">
        <div className="live-loader-orb w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 mx-auto mb-5 flex items-center justify-center text-white shadow-xl relative">
          <GearIcon className="gear-loader-main w-10 h-10" />
          <GearIcon className="gear-loader-small w-5 h-5 absolute -bottom-1 -left-1 text-amber-100" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">لوحة إدارة منصة النحاس</h2>
        <p className="text-slate-500 font-bold">جاري التحقق من صلاحيات الإدارة...</p>
      </div>
    </div>
  );

  return (
    <AppErrorBoundary>
      <ToastCenter />
      <AnimatePresence mode='wait'>
        <DesignSystemLoader />
        <DebugCollector user={user} />
        <PlatformPerformanceBooster />
        <MobileExamHelperStyles />
        {!user ? (
          <AuthPage key="admin-auth" onBack={() => navigatePlatform('/')} />
        ) : isAdminAccount ? (
          <AdminDashboard key="admin" user={user} />
        ) : (
          <AdminAccessDenied key="admin-denied" user={user} />
        )}
      </AnimatePresence>
    </AppErrorBoundary>
  );
}

export default App;
