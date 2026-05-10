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



import ExamRunner from '../parts/ExamRunner.jsx';
import AppErrorBoundary from '../parts/AppErrorBoundary.jsx';
import PerformanceOverview from '../parts/PerformanceOverview.jsx';
import PlatformPerformanceBooster from '../parts/PlatformPerformanceBooster.jsx';
import PaymentRequestStudentPanel from '../parts/PaymentRequestStudentPanel.jsx';
import LeaderboardPanel from '../parts/LeaderboardPanel.jsx';
import StudentSmartPerformanceReport from '../parts/StudentSmartPerformanceReport.jsx';
import StudentDashboard from '../parts/StudentDashboard.jsx';
import LandingPage from '../parts/LandingPage.jsx';
import AuthPage from '../parts/AuthPage.jsx';

// ExamRunner moved to src/student/parts/ExamRunner.jsx

// AppErrorBoundary moved to src/student/parts/AppErrorBoundary.jsx

// PerformanceOverview moved to src/student/parts/PerformanceOverview.jsx

// PlatformPerformanceBooster moved to src/student/parts/PlatformPerformanceBooster.jsx

// PaymentRequestStudentPanel moved to src/student/parts/PaymentRequestStudentPanel.jsx

// LeaderboardPanel moved to src/student/parts/LeaderboardPanel.jsx

// StudentSmartPerformanceReport moved to src/student/parts/StudentSmartPerformanceReport.jsx

// StudentDashboard moved to src/student/parts/StudentDashboard.jsx

// LandingPage moved to src/student/parts/LandingPage.jsx

// AuthPage moved to src/student/parts/AuthPage.jsx

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => 'landing');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
      const handleBeforeInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
      if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker registration failed:', error?.message));
          });
      }
  }, []);

  const handleInstallClick = async () => {
      if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { setDeferredPrompt(null); } }
  };

  useEffect(() => {
    if (!auth) return;
    let unsubUserProfile = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (unsubUserProfile) {
        unsubUserProfile();
        unsubUserProfile = null;
      }

      setUser(u);
      setAuthLoading(false);

      if (!u) {
        setUserData(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const adminSnap = await getDoc(doc(db, 'admins', u.uid));
        if (isActiveAdminSnapshot(adminSnap)) {
          navigatePlatform('/admin');
          return;
        }
      } catch (adminError) {
        console.warn('admin access check skipped:', adminError?.message);
      }

      if (getInitialRouteMode() === 'public') {
        navigatePlatform('/student');
      }

      unsubUserProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
        if (docSnap.exists()) {
          const dbUser = docSnap.data();
          setUserData({
            name: dbUser?.name || u.displayName || u.email?.split('@')?.[0] || 'طالب',
            email: dbUser?.email || u.email || '',
            grade: dbUser?.grade || '1sec',
            phone: dbUser?.phone || '',
            parentPhone: dbUser?.parentPhone || '',
            role: dbUser?.role || 'student',
            status: dbUser?.status || 'pending',
            subscriptionStatus: dbUser?.subscriptionStatus || 'free',
            subscriptionExpiry: dbUser?.subscriptionExpiry || null,
            ...dbUser
          });
        } else {
          setUserData({
            name: u.displayName || u.email?.split('@')?.[0] || 'طالب',
            email: u.email || '',
            grade: '1sec',
            phone: '',
            parentPhone: '',
            role: 'student',
            status: 'pending',
            subscriptionStatus: 'free',
            subscriptionExpiry: null
          });
        }
        setLoading(false);
      }, (error) => {
        console.warn('user profile listener blocked:', error?.message);
        setUserData({
          name: u.displayName || u.email?.split('@')?.[0] || 'طالب',
          email: u.email || '',
          grade: '1sec',
          role: 'student',
          status: 'pending',
          subscriptionStatus: 'free',
          subscriptionExpiry: null
        });
        setLoading(false);
      });
    });

    return () => {
      if (unsubUserProfile) unsubUserProfile();
      unsubAuth();
    };
  }, []);

  if (authLoading || (user && loading)) return (
    <div className="h-screen live-loading-screen flex items-center justify-center font-['Cairo']" dir="rtl">
      <div className="live-loader-card bg-white/90 border border-amber-100 rounded-3xl shadow-2xl p-8 w-[88%] max-w-sm text-center relative overflow-hidden">
        <div className="live-loader-orb w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 mx-auto mb-5 flex items-center justify-center text-white shadow-xl relative">
          <GearIcon className="gear-loader-main w-10 h-10" />
          <GearIcon className="gear-loader-small w-5 h-5 absolute -bottom-1 -left-1 text-amber-100" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">منصة النحاس التعليمية</h2>
        <p className="text-slate-500 font-bold">بنجهز تجربتك التعليمية...</p>
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
          viewMode === 'landing'
            ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={deferredPrompt ? handleInstallClick : null} />
            : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
        ) : (
          <StudentDashboard key="student" user={user} userData={userData} installPrompt={deferredPrompt ? handleInstallClick : null} />
        )}
      </AnimatePresence>
    </AppErrorBoundary>
  );
}

export default App;
