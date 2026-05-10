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



import ActivityIcon from './ActivityIcon.jsx';

export const AdminProDashboard = ({ users = [], exams = [], results = [], content = [], subscriptionCodes = [], hwResults = [], adminGradeFilter = 'all' }) => {
  const filteredUsers = useMemo(() => users.filter(u => adminGradeFilter === 'all' || u.grade === adminGradeFilter), [users, adminGradeFilter]);
  const filteredResults = useMemo(() => results.filter(r => {
    if (adminGradeFilter === 'all') return true;
    const student = users.find(u => u.id === r.studentId);
    return r.grade === adminGradeFilter || student?.grade === adminGradeFilter;
  }), [results, users, adminGradeFilter]);

  const dashboard = useMemo(() => {
    const completed = filteredResults.filter(r => r.status === 'completed');
    const securityHolds = filteredResults.filter(r => r.status === 'security_hold');
    const avg = completed.length
      ? Math.round(completed.reduce((sum, r) => sum + getResultPercentage(r), 0) / completed.length)
      : 0;

    const branchMap = {};
    completed.forEach(result => {
      const stats = result.performanceAnalysis?.branchStats || result.branchStats || {};
      Object.entries(stats).forEach(([branch, s]) => {
        branchMap[branch] = branchMap[branch] || { earned: 0, possible: 0, wrong: 0, correct: 0, count: 0 };
        branchMap[branch].earned += safeNumber(s.earned, 0);
        branchMap[branch].possible += safeNumber(s.possible, 0);
        branchMap[branch].wrong += safeNumber(s.wrong, 0);
        branchMap[branch].correct += safeNumber(s.correct, 0);
        branchMap[branch].count += 1;
      });
    });

    const branches = Object.entries(branchMap).map(([branch, s]) => ({
      branch,
      pct: s.possible > 0 ? Math.round((s.earned / s.possible) * 100) : 0,
      wrong: s.wrong,
      correct: s.correct,
      count: s.count
    })).sort((a, b) => a.pct - b.pct);

    const studentScores = {};
    completed.forEach(r => {
      const key = r.studentId || r.studentName || r.id;
      studentScores[key] = studentScores[key] || { name: r.studentName || 'طالب', score: 0, possible: 0, exams: 0 };
      studentScores[key].score += safeNumber(r.performanceAnalysis?.totalScore, safeNumber(r.score, 0));
      studentScores[key].possible += safeNumber(r.performanceAnalysis?.totalPossible, safeNumber(r.totalPossible, safeNumber(r.total, 0)));
      studentScores[key].exams += 1;
    });

    const students = Object.values(studentScores).map(s => ({
      ...s,
      pct: s.possible > 0 ? Math.round((s.score / s.possible) * 100) : 0
    }));

    const topStudents = [...students].sort((a,b) => b.pct - a.pct).slice(0, 5);
    const needsFollowUp = [...students].filter(s => s.pct < 70).sort((a,b) => a.pct - b.pct).slice(0, 6);

    const monthly = {};
    completed.forEach(r => {
      const d = r.submittedAt?.toDate ? r.submittedAt.toDate() : (r.submittedAt ? new Date(r.submittedAt) : null);
      const label = d && !Number.isNaN(d.getTime()) ? `${d.getMonth()+1}/${d.getDate()}` : 'غير محدد';
      monthly[label] = monthly[label] || { count: 0, totalPct: 0 };
      monthly[label].count += 1;
      monthly[label].totalPct += getResultPercentage(r);
    });
    const trend = Object.entries(monthly).slice(-8).map(([label, v]) => ({ label, avg: v.count ? Math.round(v.totalPct / v.count) : 0, count: v.count }));

    return {
      completedCount: completed.length,
      securityHolds,
      avg,
      branches,
      topStudents,
      needsFollowUp,
      trend
    };
  }, [filteredResults]);

  const premiumUsers = filteredUsers.filter(u => u.subscriptionStatus === 'premium');
  const activeCodes = subscriptionCodes.filter(c => !c.used);
  const usedCodes = subscriptionCodes.filter(c => c.used);

  const quickReports = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const completed = filteredResults.filter(r => r.status === 'completed');
    const todayResults = completed.filter(r => {
      const d = r.submittedAt?.toDate ? r.submittedAt.toDate() : (r.submittedAt ? new Date(r.submittedAt) : null);
      return d && !Number.isNaN(d.getTime()) && now - d.getTime() <= dayMs;
    });
    const activeToday = new Set(todayResults.map(r => r.studentId || r.studentName).filter(Boolean)).size;
    const lowScores = completed.filter(r => getResultPercentage(r) < 60).length;
    const completionRate = exams.length > 0 && filteredUsers.length > 0 ? Math.round((completed.length / Math.max(1, exams.length * filteredUsers.length)) * 100) : 0;
    return { activeToday, todayResults: todayResults.length, lowScores, completionRate };
  }, [filteredResults, filteredUsers.length, exams.length]);

  const StatCard = ({ title, value, icon, hint, tone = 'bg-white' }) => (
    <div className={`${tone} border border-white/70 rounded-3xl p-5 shadow-sm`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
          {hint && <p className="text-xs text-slate-500 mt-2">{hint}</p>}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative">
        <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black flex items-center gap-3"><BarChart3 className="text-amber-300"/> Dashboard احترافي</h2>
          <p className="text-slate-300 mt-2">نظرة سريعة على المنصة، أداء الطلاب، الاشتراكات، وحالات الأمان.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="الطلاب النشطون" value={filteredUsers.length} icon={<Users size={22}/>} hint="حسب فلتر المرحلة الحالي" tone="bg-blue-50" />
        <StatCard title="متوسط التحصيل" value={`${dashboard.avg}%`} icon={<Target size={22}/>} hint={`${dashboard.completedCount} نتيجة مكتملة`} tone="bg-emerald-50" />
        <StatCard title="حالات تحتاج قرار أمني" value={dashboard.securityHolds.length} icon={<ShieldAlert size={22}/>} hint="محاولات موقوفة بسبب تنبيهات" tone="bg-red-50" />
        <StatCard title="اشتراكات VIP" value={premiumUsers.length} icon={<Crown size={22}/>} hint={`${activeCodes.length} كود متاح • ${usedCodes.length} مستخدم`} tone="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">نشاط آخر 24 ساعة</p><p className="text-2xl font-black text-slate-900 mt-1">{quickReports.activeToday} طالب</p><p className="text-xs text-slate-400 mt-1">{quickReports.todayResults} نتيجة جديدة</p></div>
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">نسبة إكمال الامتحانات</p><p className="text-2xl font-black text-blue-700 mt-1">{quickReports.completionRate}%</p><p className="text-xs text-slate-400 mt-1">تقدير سريع حسب الطلاب والامتحانات</p></div>
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">نتائج أقل من 60%</p><p className="text-2xl font-black text-red-700 mt-1">{quickReports.lowScores}</p><p className="text-xs text-slate-400 mt-1">تحتاج متابعة أو مراجعة</p></div>
        <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">توصية اليوم</p><p className="text-sm font-black text-slate-800 mt-2 leading-relaxed">{dashboard.avg < 70 ? 'ركز على أضعف الفروع وأرسل واجب قصير.' : 'الأداء جيد، حافظ على المتابعة اليومية.'}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-panel p-5 rounded-3xl">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Layers size={20}/> أضعف الفروع حاليًا</h3>
          <div className="space-y-3">
            {dashboard.branches.slice(0, 8).map(branch => (
              <div key={branch.branch} className="bg-white rounded-2xl p-4 border">
                <div className="flex justify-between mb-2 font-bold">
                  <span>{branch.branch}</span>
                  <span className={branch.pct < 50 ? 'text-red-600' : branch.pct < 70 ? 'text-amber-600' : 'text-emerald-600'}>{branch.pct}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={branch.pct < 50 ? 'h-3 bg-red-500' : branch.pct < 70 ? 'h-3 bg-amber-500' : 'h-3 bg-emerald-500'} style={{ width: `${branch.pct}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">أخطاء: {branch.wrong} • صحيح: {branch.correct} • ظهر في {branch.count} نتيجة</p>
              </div>
            ))}
            {dashboard.branches.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد بيانات فروع كافية بعد.</p>}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Trophy size={20}/> أفضل الطلاب</h3>
          <div className="space-y-3">
            {dashboard.topStudents.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-white border rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black">{i+1}</div>
                  <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.exams} امتحان</p>
                  </div>
                </div>
                <span className="font-black text-emerald-600">{s.pct}%</span>
              </div>
            ))}
            {dashboard.topStudents.length === 0 && <p className="text-center text-slate-500 py-8">لا توجد نتائج مكتملة بعد.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-3xl">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={20}/> طلاب يحتاجون متابعة</h3>
          <div className="space-y-3">
            {dashboard.needsFollowUp.map((s, i) => (
              <div key={i} className="bg-white border border-red-100 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-black text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.exams} امتحان • يحتاج خطة مراجعة</p>
                </div>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-black">{s.pct}%</span>
              </div>
            ))}
            {dashboard.needsFollowUp.length === 0 && <p className="text-center text-slate-500 py-8">لا يوجد طلاب أقل من 70% حسب الفلتر الحالي.</p>}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><ActivityIcon/> تطور متوسط النتائج</h3>
          <div className="flex items-end gap-3 h-64 bg-white rounded-2xl border p-4 overflow-x-auto">
            {dashboard.trend.map((item, i) => (
              <div key={i} className="flex flex-col items-center justify-end gap-2 min-w-[48px] h-full">
                <span className="text-xs font-bold text-slate-600">{item.avg}%</span>
                <div className="w-8 bg-blue-500 rounded-t-xl" style={{ height: `${Math.max(8, item.avg * 1.8)}px` }}></div>
                <span className="text-[10px] text-slate-400">{item.label}</span>
              </div>
            ))}
            {dashboard.trend.length === 0 && <p className="m-auto text-slate-500">لا توجد نتائج كافية لرسم الاتجاه.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProDashboard;
