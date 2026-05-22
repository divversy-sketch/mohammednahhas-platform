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
import SecureVideoPlayer from '@features/video-security/player/SecureVideoPlayer.jsx';
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




export const LeaderboardPanel = ({ examResults = [], users = [], currentUserId = null, gradeFilter = 'all' }) => {
  const rows = useMemo(() => {
    const map = {};
    (examResults || []).filter(r => r.status === 'completed').forEach(r => {
      const id = r.studentId || r.userId || r.uid;
      if (!id) return;
      const userInfo = (users || []).find(u => u.id === id || u.uid === id) || {};
      if (gradeFilter !== 'all' && userInfo.grade && userInfo.grade !== gradeFilter) return;
      map[id] = map[id] || {
        userId: id,
        name: r.studentName || userInfo.name || userInfo.email || 'طالب',
        grade: userInfo.grade || r.grade || '',
        exams: 0,
        totalPct: 0,
        bestPct: 0
      };
      const pct = getResultPercentage(r);
      map[id].exams += 1;
      map[id].totalPct += pct;
      map[id].bestPct = Math.max(map[id].bestPct, pct);
    });
    return Object.values(map).map(x => ({
      ...x,
      avgPct: x.exams ? Math.round(x.totalPct / x.exams) : 0,
      points: Math.round((x.exams ? x.totalPct / x.exams : 0) + Math.min(x.exams * 2, 20) + x.bestPct * 0.2)
    })).sort((a,b) => b.points - a.points).slice(0, 50);
  }, [examResults, users, gradeFilter]);

  const myRank = currentUserId ? rows.findIndex(r => r.userId === currentUserId) + 1 : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-yellow-500">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Trophy className="text-yellow-500"/> لوحة الشرف</h2>
        {myRank > 0 && <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-black">ترتيبك #{myRank}</span>}
      </div>
      <div className="space-y-3">
        {rows.slice(0, 10).map((row, idx) => (
          <div key={row.userId} className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${row.userId === currentUserId ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-500' : 'bg-slate-700'}`}>{idx + 1}</div>
              <div>
                <p className="font-black text-slate-800">{row.name}</p>
                <p className="text-xs text-slate-500">{getGradeLabel(row.grade)} • {row.exams} امتحان</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-yellow-600">{row.points}</p>
              <p className="text-xs text-slate-500">متوسط {row.avgPct}%</p>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-center py-10 text-slate-400 font-bold">لا توجد نتائج كافية بعد.</p>}
      </div>
    </div>
  );
};

export default LeaderboardPanel;
