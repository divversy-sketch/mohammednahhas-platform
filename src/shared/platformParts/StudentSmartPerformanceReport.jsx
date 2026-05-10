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
} from '../icons/lucide-shim.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, savePushTokenForUser, setupForegroundPushListener } from '../../services/firebase';
import SecureVideoPlayer from '../../features/lectures/SecureVideoPlayer';
import MobileStudentBottomNav from '../../features/student/MobileStudentBottomNav';
import MobileExamHelperStyles from '../components/MobileExamHelperStyles';
import DesignSystemLoader from '../components/DesignSystemLoader';
import { GradeOptions, getGradeLabel } from '../constants/grades';
import { normalizeEgyptPhone, isValidEgyptPhone, validateEgyptianPhones } from '../utils/phone';
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
} from '../core/platformShared.jsx';
import { isActiveAdminSnapshot, getInitialRouteMode, navigatePlatform, DebugCollector, DebugPanel } from '../core/debugTools.jsx';




export const StudentSmartPerformanceReport = ({ userResults = [], content = [] }) => {
  userResults = Array.isArray(userResults) ? userResults : [];
  content = Array.isArray(content) ? content : [];
  const completed = useMemo(() => (userResults || []).filter(r => r.status === 'completed').sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)), [userResults]);
  const latest = completed[0];

  const trend = useMemo(() => completed.slice(0, 5).reverse().map((r, idx) => ({
    label: r.examTitle || `امتحان ${idx + 1}`,
    pct: getResultPercentage(r)
  })), [completed]);

  const branchSummary = useMemo(() => {
    const map = {};
    completed.forEach(r => {
      const branchRows = Array.isArray(r.branchAnalysis)
        ? r.branchAnalysis
        : Object.entries(r.branchStats || {}).map(([branch, data]) => ({
            branch,
            percentage: data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 1)) * 100) : 0,
            wrong: safeNumber(data.wrong, 0),
            correct: safeNumber(data.correct, 0)
          }));
      branchRows.forEach(b => {
        map[b.branch] = map[b.branch] || { branch: b.branch, totalPct: 0, count: 0, wrong: 0, correct: 0 };
        map[b.branch].totalPct += safeNumber(b.percentage, 0);
        map[b.branch].count += 1;
        map[b.branch].wrong += safeNumber(b.wrong, 0);
        map[b.branch].correct += safeNumber(b.correct, 0);
      });
    });
    return Object.values(map).map(b => ({ ...b, avg: b.count ? Math.round(b.totalPct / b.count) : 0 })).sort((a,b) => a.avg - b.avg);
  }, [completed]);

  const recommendations = useMemo(() => {
    return branchSummary.slice(0, 3).map(b => {
      const related = (content || []).find(c => (c.branch || '').trim() === b.branch || (c.title || '').includes(b.branch));
      return { branch: b.branch, avg: b.avg, title: related?.title || `راجع فرع ${b.branch}`, type: related?.type || 'مراجعة' };
    });
  }, [branchSummary, content]);

  if (!completed.length) {
    return (
      <div className="glass-panel rounded-2xl p-5 text-center text-slate-500">
        <BrainCircuit size={44} className="mx-auto mb-3 text-amber-500"/>
        <p className="font-bold">سيظهر تقريرك الذكي بعد أول امتحان مكتمل.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-amber-500">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><BrainCircuit className="text-amber-600"/> تقريرك الذكي</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs text-amber-700 font-bold">آخر نتيجة</p><p className="text-3xl font-black text-amber-800">{getResultPercentage(latest)}%</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs text-blue-700 font-bold">عدد الامتحانات</p><p className="text-3xl font-black text-blue-800">{completed.length}</p></div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs text-red-700 font-bold">أضعف فرع</p><p className="text-xl font-black text-red-800">{branchSummary[0]?.branch || 'لا يوجد'}</p></div>
      </div>

      <h3 className="font-black text-slate-800 mb-2">تطور آخر 5 امتحانات</h3>
      <div className="flex items-end gap-2 h-32 bg-slate-50 border rounded-2xl p-3 mb-5">
        {trend.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="w-full bg-amber-500 rounded-t-xl" style={{ height: `${Math.max(8, item.pct)}%` }} title={item.label}></div>
            <span className="text-[10px] font-bold text-slate-500">{item.pct}%</span>
          </div>
        ))}
      </div>

      <h3 className="font-black text-slate-800 mb-2">خطة مراجعة مقترحة</h3>
      <div className="space-y-2">
        {recommendations.map((r, idx) => (
          <div key={idx} className="bg-white border rounded-xl p-3 flex justify-between items-center gap-3">
            <div>
              <p className="font-black text-slate-800">{r.branch} <span className="text-red-600">({r.avg}%)</span></p>
              <p className="text-xs text-slate-500">{r.title}</p>
            </div>
            <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold">{r.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentSmartPerformanceReport;
