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
} from '../shared/icons/lucide-shim.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, savePushTokenForUser, setupForegroundPushListener } from '../services/firebase';
import { isVisibleLiveSession } from '../utils/liveSessions';
import SecureVideoPlayer from '../features/lectures/SecureVideoPlayer';
import MobileStudentBottomNav from '../features/student/MobileStudentBottomNav';
import MobileExamHelperStyles from '../shared/components/MobileExamHelperStyles';
import DesignSystemLoader from '../shared/components/DesignSystemLoader';
import { GradeOptions, getGradeLabel } from '../shared/constants/grades';
import { normalizeEgyptPhone, isValidEgyptPhone, validateEgyptianPhones } from '../shared/utils/phone';
import { AdminStudentMessaging, StudentMessagesPanel, StudentAdminMessagePopup } from '../features/messages/StudentMessages';
import { PWAInstallBox, ModernLogo, FloatingArabicBackground, WisdomBox, Announcements, Leaderboard, ChatWidget } from '../features/home/HomeWidgets';
import PomodoroFocusMode from '../features/study/PomodoroFocusMode';
import InteractiveViewer from '../features/content/InteractiveViewer';
import SmartHomeworkScanner from '../features/homework/SmartHomeworkScanner';

const getAdminAIHeaders = async () => {
  const token = await auth?.currentUser?.getIdToken?.();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const formatWatchTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return 'أقل من ثانية';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    let res = [];
    if (h > 0) res.push(`${h} ساعة`);
    if (m > 0) res.push(`${m} دقيقة`);
    if (s > 0 || res.length === 0) res.push(`${s} ثانية`);
    return res.join(' و ');
};

const requestNotificationPermission = () => {
  // Browser push notifications are paused for now to avoid VAPID prompts.
  // In-app Firestore notifications still work inside the platform.
  return;
};

const sendSystemNotification = () => {
  // System notifications are disabled temporarily for better UX/performance.
  return;
};

const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};


const renderBracketHighlightedText = (text = '') => {
    const source = String(text || '');
    if (!source) return null;

    return source.split(/(\[[^\]]+\])/g).map((part, idx) => {
        const isHighlighted = /^\[[^\]]+\]$/.test(part);
        const cleanPart = isHighlighted ? part.slice(1, -1) : part;

        const renderedLines = cleanPart.split('\n').map((line, lineIdx, arr) => (
            <React.Fragment key={`${idx}-${lineIdx}`}>
                {line}
                {lineIdx !== arr.length - 1 && <br />}
            </React.Fragment>
        ));

        if (!isHighlighted) {
            return <React.Fragment key={idx}>{renderedLines}</React.Fragment>;
        }

        return (
            <mark
                key={idx}
                className="bg-yellow-200 text-yellow-950 px-2 py-1 rounded-lg border border-yellow-400 shadow-sm font-black"
                title="موضع السؤال داخل القطعة"
            >
                {renderedLines}
            </mark>
        );
    });
};

const getQuestionsForExam = (examData) => {
    if (!examData?.questions) return [];
    const flat = [];
    examData.questions.forEach((block) => {
        const subQuestions = Array.isArray(block?.subQuestions) ? block.subQuestions : [];
        subQuestions.forEach((q) => {
            flat.push({
                ...q,
                blockText: block?.text || '',
                branch: q?.branch || 'عام'
            });
        });
    });
    return flat;
};


const generatePDF = (type, data) => {
    if (!window.html2pdf) return alert("جاري تحميل نظام الطباعة... يرجى الانتظار ثوانٍ والمحاولة مرة أخرى.");
    const percentage = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
    const date = new Date().toLocaleDateString('ar-EG');
    const element = document.createElement('div');
    let answersTable = '';
    if (data.questions && data.answers) {
        answersTable = `
        <div style="margin-top: 30px; page-break-before: always;">
            <h3 style="background: #eee; padding: 10px; border-right: 5px solid #d97706; font-family: 'Cairo', sans-serif;">تفاصيل الإجابات</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 15px; font-family: 'Cairo', sans-serif;">
                <thead>
                    <tr style="background-color: #f3f4f6; color: #333;">
                        <th style="border: 1px solid #ddd; padding: 10px; width: 5%;">#</th>
                        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">السؤال</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الفرع</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">إجابتك</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 15%;">الصح</th>
                        <th style="border: 1px solid #ddd; padding: 10px; width: 10%;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.questions.map((q, i) => {
                        const branchName = q.branch || 'عام';

                        if (q.type === 'essay') {
                            const essayAnswer = data.answers?.[q.id];
                            const studentEssayText = typeof essayAnswer === 'object'
                                ? (essayAnswer?.text || (essayAnswer?.image ? 'تم رفع صورة إجابة' : 'لم يجب'))
                                : (essayAnswer || 'لم يجب');
                            const modelEssayAnswer = q.modelAnswer || 'سؤال مقالي - يحتاج مراجعة يدوية';
                            return `
                            <tr style="background-color: #eff6ff;">
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentEssayText}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; color: #1d4ed8;">${modelEssayAnswer}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><span style="color:#1d4ed8">📝 مقالي</span></td>
                            </tr>`;
                        }

                        const studentAnsIdx = data.answers[q.id];
                        const correctAnsIdx = q.correctIdx;
                        const isCorrect = studentAnsIdx === correctAnsIdx;
                        const studentAnsText = studentAnsIdx !== undefined ? q.options?.[studentAnsIdx] || 'لم يجب' : 'لم يجب';
                        const correctAnsText = q.options?.[correctAnsIdx] || 'غير محدد';
                        return `
                        <tr style="background-color: ${isCorrect ? '#f0fdf4' : '#fef2f2'};">
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${i + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${q.text.replace(/\|/g, '<br>')}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #0284c7;">${branchName}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${studentAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; color: green;">${correctAnsText}</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${isCorrect ? '<span style="color:green">✔ صحيح</span>' : '<span style="color:red">✘ خطأ</span>'}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }

    const header = `
      <div style="padding: 40px; font-family: 'Cairo', sans-serif; direction: rtl; color: #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="text-align: right;"><h1 style="margin: 0; color: #d97706; font-size: 28px;">منصة النحاس التعليمية</h1><p style="margin: 5px 0 0; color: #666;">للغة العربية - أ/ محمد النحاس</p></div>
            <div style="text-align: left;"><p style="margin: 0; font-weight: bold;">تقرير نتيجة امتحان</p><p style="margin: 5px 0 0; color: #666;">${date}</p></div>
        </div>
        <div style="background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <table style="width: 100%; font-size: 18px; font-family: 'Cairo', sans-serif;">
                <tr><td style="padding: 10px; font-weight: bold; width: 20%;">اسم الطالب:</td><td style="padding: 10px;">${data.studentName}</td><td style="padding: 10px; font-weight: bold; width: 20%;">الامتحان:</td><td style="padding: 10px;">${data.examTitle || 'اختبار عام'}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; vertical-align: middle;">الدرجة:</td><td style="padding: 10px;"><div style="display: inline-block; border: 3px solid #d97706; border-radius: 8px; padding: 5px 20px; font-weight: bold; color: #d97706; direction: ltr; font-family: sans-serif; font-size: 20px; background: #fffbeb;">${data.score} / ${data.total}</div></td><td style="padding: 10px; font-weight: bold; vertical-align: middle;">النسبة:</td><td style="padding: 10px; font-size: 20px; font-weight: bold;">${percentage}%</td></tr>
                <tr><td style="padding: 10px; font-weight: bold;">الحالة:</td><td style="padding: 10px;" colspan="3"><span style="background: ${data.status === 'cheated' ? '#fee2e2' : '#dcfce7'}; color: ${data.status === 'cheated' ? '#991b1b' : '#166534'}; padding: 5px 15px; border-radius: 20px; font-size: 14px;">${data.status === 'cheated' ? 'تم إلغاؤه (غش)' : percentage >= 50 ? 'ناجح' : 'راسب'}</span></td></tr>
            </table>
        </div>
        ${answersTable}
        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;"><p style="font-size: 14px; color: #999;">تم استخراج هذا التقرير آلياً من منصة النحاس التعليمية</p></div>
      </div>`;
    element.innerHTML = header;
    const opt = { margin: 0.5, filename: `تقرير_${data.studentName}_${date}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, logging: false }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    window.html2pdf().set(opt).from(element).save();
};

const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const getResultPercentage = (result) => {
    const total = safeNumber(result?.total ?? result?.totalPossible, 0);
    if (safeNumber(result?.percentage, -1) >= 0) return safeNumber(result.percentage, 0);
    return total > 0 ? Math.round((safeNumber(result?.score ?? result?.totalScore, 0) / total) * 100) : 0;
};

const getGradeBadge = (percentage = 0) => {
    const pct = safeNumber(percentage, 0);
    if (pct >= 85) return { text: 'ممتاز', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 70) return { text: 'جيد جدًا', tone: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 50) return { text: 'جيد', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: 'يحتاج مراجعة', tone: 'text-red-700 bg-red-50 border-red-200' };
};

const VIDEO_EXAM_UNLOCK_PERCENT = 75;

const getQuestionMaxScore = (q) => safeNumber(q?.maxScore ?? q?.mark ?? q?.points, q?.type === 'essay' ? 10 : 1);

const extractAllQuestions = (exam) => (exam?.questions || []).flatMap(block =>
    (block?.subQuestions || []).map(q => ({ ...q, blockText: block?.text || '', branch: q?.branch || 'عام' }))
);

const calculateDetailedExamMetrics = (exam, answers = {}, essayGrades = {}) => {
    const questions = extractAllQuestions(exam);
    const branchStats = {};
    let totalScore = 0;
    let totalPossible = 0;
    let mcqCount = 0;
    let essayCount = 0;

    questions.forEach(q => {
        const branch = q.branch || 'عام';
        branchStats[branch] = branchStats[branch] || { earned: 0, possible: 0, answered: 0, total: 0, correct: 0, wrong: 0, essay: 0 };
        const maxScore = getQuestionMaxScore(q);
        totalPossible += maxScore;
        branchStats[branch].possible += maxScore;
        branchStats[branch].total += 1;
        const answerValue = answers[q.id];
        const answered = q.type === 'essay'
            ? !!(answerValue && ((typeof answerValue === 'string' && answerValue.trim()) || answerValue.text || answerValue.image))
            : answerValue !== undefined;
        if (answered) branchStats[branch].answered += 1;

        if (q.type === 'essay') {
            essayCount += 1;
            branchStats[branch].essay += 1;
            const gradeInfo = essayGrades[q.id] || {};
            const earned = safeNumber(gradeInfo.score, 0);
            totalScore += earned;
            branchStats[branch].earned += earned;
        } else {
            mcqCount += 1;
            const isCorrect = answerValue === q.correctIdx;
            if (isCorrect) {
                totalScore += maxScore;
                branchStats[branch].earned += maxScore;
                branchStats[branch].correct += 1;
            } else if (answered) {
                branchStats[branch].wrong += 1;
            }
        }
    });

    return {
        totalScore,
        totalPossible,
        percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
        branchStats,
        mcqCount,
        essayCount,
        questions
    };
};

const getPerformanceInsights = (metrics) => {
    const branches = Object.entries(metrics?.branchStats || {});
    if (branches.length === 0) return [];
    const enriched = branches.map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0, ...data })).sort((a, b) => b.pct - a.pct);
    const best = enriched[0];
    const worst = enriched[enriched.length - 1];
    const notes = [];
    if (best) notes.push(`أفضل فروعك حالياً: ${best.branch} (${best.pct}%)`);
    if (worst && worst.branch !== best?.branch) notes.push(`أكثر فرع يحتاج مراجعة: ${worst.branch} (${worst.pct}%)`);
    if ((metrics?.essayCount || 0) > 0) notes.push('تأكد من متابعة تصحيح الأسئلة المقالية بعد اعتمادها من الأدمن.');
    if ((metrics?.percentage || 0) >= 85) notes.push('أداء ممتاز جدًا، استمر على نفس المستوى.');
    else if ((metrics?.percentage || 0) >= 70) notes.push('أداؤك جيد جدًا، ركز على الفروع الأضعف لرفع النسبة.');
    else notes.push('راجع بنك الأخطاء والمراجعة الذكية قبل الامتحان التالي.');
    return notes;
};

const getReviewRecommendations = (branchStats = {}, content = []) => {
    const weakBranches = Object.entries(branchStats)
        .map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0 }))
        .filter(item => item.pct < 70)
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 3);
    return weakBranches.map(item => {
        const related = content.find(c => (c.branch || '').trim() === item.branch || (c.title || '').includes(item.branch));
        return { branch: item.branch, pct: item.pct, title: related?.title || `راجع فرع ${item.branch}` };
    });
};



const isZoomLink = (url = '') => /(^|\/\/|\.)(zoom\.us|zoomgov\.com)\//i.test(url || '');
const isMeetLink = (url = '') => /(^|\/\/|\.)(meet\.google\.com)\//i.test(url || '');
const isJitsiLink = (url = '') => /(^|\/\/|\.)(meet\.jit\.si|8x8\.vc)\//i.test(url || '');
const isYouTubeLink = (url = '') => /(youtube\.com|youtu\.be)/i.test(url || '');

const normalizeExternalUrl = (url = '') => {
    const clean = String(url || '').trim();
    if (!clean) return '';
    return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
};

const normalizeJitsiUrl = (url = '') => {
    const clean = normalizeExternalUrl(url);
    if (!clean) return '';
    try {
        const u = new URL(clean);
        if (!isJitsiLink(clean)) return clean;

        const room = (u.pathname || '').replace(/^\/+/, '').split(/[?#]/)[0];
        const safeRoom = room || `nahhas-live-${Date.now()}`;

        // مهم للموبايل:
        // disableDeepLinking يمنع Jitsi من تحويل الطالب لتحميل التطبيق
        // ويجبر المحاضرة تفتح داخل iframe في المنصة قدر الإمكان.
        const jitsiHashParams = [
            'config.disableDeepLinking=true',
            'config.prejoinPageEnabled=false',
            'config.startWithAudioMuted=true',
            'config.startWithVideoMuted=false',
            'config.enableWelcomePage=false',
            'interfaceConfig.MOBILE_APP_PROMO=false',
            'interfaceConfig.SHOW_JITSI_WATERMARK=false',
            'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false'
        ].join('&');

        return `${u.origin}/${safeRoom}#${jitsiHashParams}`;
    } catch {
        return clean;
    }
};

const getYouTubeEmbedUrl = (url = '') => {
    const clean = normalizeExternalUrl(url);
    const id = getYouTubeID(clean);
    if (!id) return '';
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1`;
};

const getLiveEmbedInfo = (session = {}) => {
    const liveUrl = normalizeExternalUrl(session.liveUrl || session.url || session.streamUrl || '');
    const embedUrl = normalizeExternalUrl(session.embedUrl || session.optionalEmbedUrl || '');
    const detectedType = isJitsiLink(liveUrl) ? 'jitsi'
        : isYouTubeLink(liveUrl) ? 'youtube'
        : isZoomLink(liveUrl) ? 'zoom'
        : isMeetLink(liveUrl) ? 'meet'
        : 'external';

    const sessionType = session.sessionType && session.sessionType !== 'external' ? session.sessionType : detectedType;

    if (embedUrl) {
        return {
            type: sessionType || 'embed',
            canEmbed: true,
            embedSrc: embedUrl,
            externalUrl: liveUrl || embedUrl,
            note: 'سيتم تشغيل رابط التضمين داخل المنصة.'
        };
    }

    if (sessionType === 'youtube') {
        const embedSrc = getYouTubeEmbedUrl(liveUrl);
        return {
            type: 'youtube',
            canEmbed: !!embedSrc,
            embedSrc,
            externalUrl: liveUrl,
            note: embedSrc ? 'YouTube يعمل داخل المنصة، وتم تحويل الرابط تلقائيًا إلى Embed.' : 'رابط YouTube غير واضح.'
        };
    }

    if (sessionType === 'jitsi') {
        const embedSrc = normalizeJitsiUrl(liveUrl);
        return {
            type: 'jitsi',
            canEmbed: !!embedSrc,
            embedSrc,
            externalUrl: embedSrc,
            note: 'Jitsi يعمل داخل المنصة. استخدم رابط غرفة مباشر مثل https://meet.jit.si/nahhas-live-room'
        };
    }

    if (sessionType === 'zoom') {
        return {
            type: 'zoom',
            canEmbed: false,
            embedSrc: '',
            externalUrl: liveUrl,
            note: 'Zoom العادي لا يعمل داخل iframe. سيظهر للطالب زر فتح خارجي. للتشغيل داخل المنصة نحتاج Zoom SDK لاحقًا.'
        };
    }

    if (sessionType === 'meet') {
        return {
            type: 'meet',
            canEmbed: false,
            embedSrc: '',
            externalUrl: liveUrl,
            note: 'Google Meet العادي لا يعمل داخل iframe غالبًا. استخدم Jitsi للتشغيل داخل المنصة أو افتحه خارجيًا.'
        };
    }

    return {
        type: 'external',
        canEmbed: false,
        embedSrc: '',
        externalUrl: liveUrl,
        note: 'هذا الرابط لا يدعم التضمين داخل المنصة. استخدم Jitsi أو YouTube.'
    };
};

const getLiveStatus = (session = {}) => {
    if (session.status === 'ended') return { label: 'انتهت', tone: 'bg-slate-100 text-slate-600' };
    const startMs = session.scheduledAt ? new Date(session.scheduledAt).getTime() : null;
    if (startMs && Date.now() + 10 * 60 * 1000 < startMs) return { label: 'قادمة', tone: 'bg-blue-100 text-blue-700' };
    return { label: 'مباشرة الآن', tone: 'bg-red-100 text-red-700' };
};


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callPlatformAIWithRetry = async (payload, attempts = 3) => {
    let lastError = null;
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await fetch('/api/ai-coach', {
                method: 'POST',
                headers: await getAdminAIHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) {
                throw new Error(data?.error || data?.message || 'تعذر تشغيل الذكاء الاصطناعي الآن.');
            }
            return data;
        } catch (error) {
            lastError = error;
            await sleep(900 * (i + 1));
        }
    }
    throw lastError;
};


const LiveSessionView = ({ session, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [liveExam, setLiveExam] = useState(null);
  const chatRef = useRef(null);
  const embedInfo = useMemo(() => getLiveEmbedInfo(session), [session]);

  useEffect(() => {
    if (!session?.id) return;
    const q = query(collection(db, 'live_sessions', session.id, 'chat'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      chatRef.current?.scrollIntoView({ behavior: "smooth" });
    }, (error) => {
      console.warn('live chat listener blocked:', error?.message);
      setMessages([]);
    });
    return () => unsub();
  }, [session?.id]);

  useEffect(() => {
    if (!user || !session?.id) return;
    const attendanceId = `${session.id}_${user.uid}`;
    setDoc(doc(db, 'live_attendance', attendanceId), {
      sessionId: session.id,
      sessionTitle: session.title || '',
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || user.email || 'طالب',
      joinedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      platformView: embedInfo.canEmbed,
      sessionType: embedInfo.type
    }, { merge: true }).catch((e) => console.warn('attendance write blocked:', e?.message));
    const interval = setInterval(() => {
      setDoc(doc(db, 'live_attendance', attendanceId), { lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.uid, session?.id, session?.title, embedInfo.canEmbed, embedInfo.type]);

  const askLiveAI = async () => {
    if (!aiQuestion.trim()) return alert('اكتب سؤالك الأول.');
    setAiLoading(true);
    setAiAnswer('');
    try {
      const data = await callPlatformAIWithRetry({
        mode: 'live_question',
        question: aiQuestion,
        grade: session?.grade || '',
        context: `محاضرة مباشرة بعنوان: ${session?.title || ''}`
      });
      const answer = data.analysis?.answer || data.data?.answer || data.analysis?.summary || data.data?.summary || 'تم التحليل بنجاح.';
      setAiAnswer(answer);
    } catch (error) {
      setAiAnswer('مزود الذكاء الاصطناعي عليه ضغط مؤقت. جرّب بعد دقيقة أو اكتب السؤال بصيغة أقصر.');
    } finally {
      setAiLoading(false);
    }
  };

  const generateLiveExam = async () => {
    setAiLoading(true);
    setLiveExam(null);
    try {
      const data = await callPlatformAIWithRetry({
        mode: 'generate_exam',
        topic: session?.title || 'المحاضرة المباشرة',
        branches: session?.branch || session?.title || 'المحاضرة',
        grade: session?.grade || '',
        mcqCount: 15,
        difficultyMix: ['easy','medium','hard','very_hard'],
        instructions: 'ولد امتحان اختيار من متعدد من 15 إلى 20 سؤال من محتوى المحاضرة المباشرة، مناسب للمرحلة الدراسية فقط.'
      });
      const exam = data.analysis?.exam || data.data?.exam || data.analysis;
      const questions = Array.isArray(exam?.questions) ? exam.questions : [];
      setLiveExam({ title: exam?.title || `امتحان المحاضرة - ${session?.title || ''}`, questions });
    } catch (error) {
      setAiAnswer('تعذر توليد امتحان الآن بسبب ضغط مؤقت على الموديل. جرّب مرة أخرى بعد قليل.');
    } finally {
      setAiLoading(false);
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if(!session?.id) return alert('بيانات المحاضرة غير مكتملة.');
    if(!msgInput.trim()) return;
    try {
      await addDoc(collection(db, 'live_sessions', session.id, 'chat'), {
        text: msgInput,
        user: user?.displayName || user?.email || 'طالب',
        createdAt: serverTimestamp()
      });
      setMsgInput("");
    } catch (error) {
      alert('تعذر إرسال الرسالة. تحقق من صلاحيات المحادثة.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col md:flex-row font-['Cairo']" dir="rtl">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-3 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]"></span>
            <h2 className="font-bold">محاضرة مباشرة: {session?.title}</h2>
          </div>
          <button onClick={onClose} className="text-sm bg-black/30 hover:bg-black/50 px-3 py-1 rounded transition">العودة للمنصة</button>
        </div>

        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden min-h-[260px]">
          <div className="watermark-video z-50">{user?.displayName || user?.email || 'طالب'} — منصة النحاس</div>
          {embedInfo.canEmbed ? (
            <iframe
              width="100%"
              height="100%"
              src={embedInfo.embedSrc}
              title="Live Meeting"
              frameBorder="0"
              allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen; encrypted-media"
              allowFullScreen
              className="relative z-10 bg-black w-full h-full min-h-[260px]"
            ></iframe>
          ) : (
            <div className="relative z-20 max-w-xl mx-auto p-8 text-center text-white">
              <Radio size={72} className="mx-auto mb-5 text-red-400" />
              <h3 className="text-2xl font-black mb-3">الرابط لا يعمل داخل المنصة</h3>
              <p className="text-slate-300 leading-relaxed mb-6">{embedInfo.note}</p>
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 mb-6">
                استخدم Jitsi للتشغيل داخل المنصة. Zoom وGoogle Meet العاديين غالبًا يفتحوا خارجيًا بسبب قيود الأمان.
              </div>
              {embedInfo.externalUrl && (
                <a href={embedInfo.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-red-700 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-50 transition">
                  فتح المحاضرة خارجيًا <ExternalLink size={18}/>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-[420px] bg-white border-r flex flex-col h-[48vh] md:h-full">
        <div className="p-3 border-b bg-slate-50 font-bold text-slate-700">المحادثة المباشرة</div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-sm text-amber-800 font-bold leading-relaxed">تم إيقاف AI للطلاب داخل المحاضرات مؤقتًا لتوفير Gemini. استخدم الشات المباشر لكتابة سؤالك للمستر.</div>

          <div className="border-t pt-3">
            <p className="font-bold text-slate-700 mb-2">الشات المباشر</p>
            {messages.map((m, i) => (
              <div key={m.id || i} className="text-sm bg-slate-50 p-2 rounded mb-2"><span className="font-bold text-amber-700">{m.user}: </span><span className="text-slate-800">{m.text}</span></div>
            ))}
            {messages.length === 0 && <p className="text-xs text-slate-400 text-center mt-6">لا توجد رسائل حتى الآن.</p>}
            <div ref={chatRef} />
          </div>
        </div>
        <form onSubmit={sendChat} className="p-2 border-t flex gap-2">
          <input className="flex-1 border rounded px-2 py-1 text-sm" placeholder="اكتب تعليق..." value={msgInput} onChange={e=>setMsgInput(e.target.value)} />
          <button className="bg-blue-600 text-white p-2 rounded"><Send size={16}/></button>
        </form>
      </div>
    </div>
  );
};



const StudentLocalAdvice = ({ metrics = {}, content = [] }) => {
  const branches = Object.entries(metrics?.branchStats || {}).map(([branch, data]) => ({ branch, pct: data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 0)) * 100) : 0, wrong: safeNumber(data.wrong, 0) })).sort((a,b)=>a.pct-b.pct);
  const weakBranches = branches.filter(b => b.pct < 70).slice(0, 3);
  const recommendations = getReviewRecommendations(metrics?.branchStats || {}, content || []);
  return <div className="mt-5 bg-slate-900/70 border border-slate-700 rounded-3xl p-5 text-slate-100"><div className="flex items-center gap-2 mb-4"><BrainCircuit className="text-amber-400"/><h3 className="font-black text-xl">تحليل ذكي بدون استهلاك AI</h3></div><p className="text-sm text-slate-300 mb-4">التحليل مبني على إجابات الطالب ونسب الفروع داخل المنصة فقط، بدون Gemini.</p>{weakBranches.length===0?<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-200 font-bold">ممتاز يا بطل. لا توجد فروع أقل من 70%. راجع الأخطاء الفردية وحافظ على مستواك.</div>:<div className="space-y-3">{weakBranches.map((b,idx)=>{const rec=recommendations.find(r=>r.branch===b.branch);return <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4"><div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2"><p className="font-black text-red-300">راجع فرع: {b.branch}</p><span className="text-xs bg-red-500/20 text-red-200 px-3 py-1 rounded-full font-bold">{b.pct}%</span></div><p className="text-sm text-slate-200 leading-relaxed">عندك {b.wrong} أخطاء في هذا الفرع. ابدأ بمراجعة القاعدة، ثم حل أسئلة قصيرة، وبعدها ارجع لبنك الأخطاء.</p>{rec?.title && <p className="text-xs text-amber-200 mt-2">اقتراح مراجعة: {rec.title}</p>}</div>})}</div>}</div>;
};
const StudentLocalHomeCoach = ({ userResults = [], content = [] }) => { const branchStats={}; (userResults||[]).slice(0,10).forEach(r=>{const stats=r?.branchStats||r?.performanceAnalysis?.branchStats||r?.branchAnalysis||{}; Object.entries(stats).forEach(([branch,d])=>{branchStats[branch]=branchStats[branch]||{earned:0,possible:0,wrong:0}; branchStats[branch].earned+=safeNumber(d.earned,0); branchStats[branch].possible+=safeNumber(d.possible,d.total||0); branchStats[branch].wrong+=safeNumber(d.wrong,0);});}); return <StudentLocalAdvice metrics={{branchStats}} content={content}/>; };
const LocalQuestionExplanation = ({ question, answers }) => { if(!question||question.type==='essay') return null; const selectedIdx=answers?.[question.id]; const correctIdx=safeNumber(question.correctIdx,0); const selectedText=selectedIdx!==undefined?question.options?.[selectedIdx]:'لم يتم اختيار إجابة'; const correctText=question.options?.[correctIdx]||'غير محدد'; const isCorrect=selectedIdx===correctIdx; return <div className={`mb-6 rounded-2xl p-4 border ${isCorrect?'bg-emerald-50 border-emerald-200 text-emerald-800':'bg-amber-50 border-amber-200 text-amber-900'}`}><h4 className="font-black mb-2">شرح المنصة بدون AI</h4><p className="text-sm font-bold">إجابتك: {selectedText}</p><p className="text-sm font-bold">الإجابة الصحيحة: {correctText}</p>{question.explanation?<p className="text-sm mt-2 leading-relaxed">الشرح: {question.explanation}</p>:<p className="text-xs mt-2 opacity-80">راجع قاعدة هذا السؤال من فرع {question.branch || 'الدرس'} ثم أعد حل أسئلة مشابهة.</p>}</div>; };
const LocalEssayReviewBox = ({ question, answer }) => { const answerText=typeof answer==='object'?answer?.text:answer; const hasAnswer=!!String(answerText||'').trim()||!!answer?.image; return <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4"><h4 className="font-black text-purple-800 flex items-center gap-2"><PenTool size={18}/> مراجعة مقالي بدون AI</h4><p className="text-sm text-purple-700 mt-2">{hasAnswer?'تم حفظ إجابتك المقالية. التصحيح النهائي يتم من الأدمن حاليًا لحين تفعيل خطة AI المدفوعة.':'لا توجد إجابة مقالية محفوظة لهذا السؤال.'}</p>{question?.modelAnswer&&<p className="text-xs text-slate-600 mt-2"><b>نموذج إجابة:</b> {question.modelAnswer}</p>}</div>; };

const ExamRunner = ({ exam, user, onClose, isReviewMode = false, existingResult = null }) => {
  const [activeView, setActiveView] = useState(isReviewMode || existingResult ? 'dashboard' : 'questions');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState(existingResult?.answers || exam.resumeData?.answers || {});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(safeNumber(existingResult?.remainingTime ?? exam.resumeData?.remainingTime, exam.duration * 60));
  const [isCheating, setIsCheating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(isReviewMode || existingResult !== null);
  const [score, setScore] = useState(existingResult?.score || 0);
  const [startTime, setStartTime] = useState(Date.now());
  const [wmPositions, setWmPositions] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [activeBranchTab, setActiveBranchTab] = useState('الكل');
  const [antiCheatWarnings, setAntiCheatWarnings] = useState(existingResult?.antiCheatWarnings || exam.resumeData?.antiCheatWarnings || 0);
  const [antiCheatLog, setAntiCheatLog] = useState(existingResult?.antiCheatLog || exam.resumeData?.antiCheatLog || []);

  const [showAntiCheatChoice, setShowAntiCheatChoice] = useState(false);
  const [securityLockReason, setSecurityLockReason] = useState('');

  const fileDialogBypassRef = useRef(false);
  const antiCheatWarningsRef = useRef(existingResult?.antiCheatWarnings || exam.resumeData?.antiCheatWarnings || 0);
  const stateRefs = useRef({ isSubmitted, showSubmitConfirm, isCheating, showAntiCheatChoice });

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const flatQuestions = useMemo(() => {
    const flat = [];
    if (exam.questions) {
      let processedBlocks = [...exam.questions];
      if (!isReviewMode && !existingResult) processedBlocks = shuffleArray(processedBlocks);

      processedBlocks.forEach((block) => {
        let subQs = [...(block.subQuestions || [])];
        const hasEssay = subQs.some((q) => q.type === 'essay');
        if (!isReviewMode && !existingResult && !hasEssay) subQs = shuffleArray(subQs);

        subQs.forEach((q) => {
          flat.push({
            ...q,
            type: q.type || 'mcq',
            blockText: block.text || '',
            branch: q.branch || 'عام'
          });
        });
      });
    }
    return flat;
  }, [exam.questions, isReviewMode, existingResult]);

  const uniqueBranches = useMemo(() => ['الكل', ...new Set(flatQuestions.map(q => q.branch))], [flatQuestions]);

  const displayQuestions = useMemo(() => {
    if (!isSubmitted || activeBranchTab === 'الكل') return flatQuestions;
    return flatQuestions.filter(q => q.branch === activeBranchTab);
  }, [flatQuestions, isSubmitted, activeBranchTab]);

  const mcqQuestions = useMemo(() => flatQuestions.filter(q => q.type !== 'essay'), [flatQuestions]);
  const essayQuestions = useMemo(() => flatQuestions.filter(q => q.type === 'essay'), [flatQuestions]);

  useEffect(() => {
    if (isSubmitted) setCurrentQIndex(0);
  }, [activeBranchTab, isSubmitted]);

  useEffect(() => {
    stateRefs.current = { isSubmitted, showSubmitConfirm, isCheating, showAntiCheatChoice };
  }, [isSubmitted, showSubmitConfirm, isCheating, showAntiCheatChoice]);

  useEffect(() => {
    if (isReviewMode) return;

    const updatePositions = () => {
      const newPos = [...Array(6)].map(() => ({
        top: Math.floor(Math.random() * 90) + '%',
        left: Math.floor(Math.random() * 90) + '%'
      }));
      setWmPositions(newPos);
    };

    updatePositions();
    const interval = setInterval(updatePositions, 6000);
    return () => clearInterval(interval);
  }, [isReviewMode]);

  useEffect(() => {
    const restoreBypass = () => {
      setTimeout(() => {
        fileDialogBypassRef.current = false;
      }, 1200);
    };

    window.addEventListener('focus', restoreBypass);
    return () => window.removeEventListener('focus', restoreBypass);
  }, []);

  const saveExamProgress = async (extra = {}) => {
    if (!exam.attemptId || exam.id === 'custom_mistakes_exam') return;
    try {
      await setDoc(doc(db, 'exam_results', exam.attemptId), {
        examId: exam.id,
        studentId: user.uid,
        studentName: user.displayName,
        answers,
        remainingTime: timeLeft,
        currentQIndex,
        totalTime: exam.duration,
        status: extra.status || 'in_progress',
        antiCheatWarnings: antiCheatWarningsRef.current,
        antiCheatLog,
        lastSavedAt: serverTimestamp(),
        ...extra
      }, { merge: true });
    } catch (e) {
      console.warn('Could not save exam progress:', e?.message);
    }
  };

  const continueAfterSecurityWarning = async () => {
    setShowAntiCheatChoice(false);
    setSecurityLockReason('');
    await saveExamProgress({ status: 'in_progress', securityDecision: 'continue', continuedAt: serverTimestamp() });
  };

  const restartAfterSecurityWarning = async () => {
    const restartEvent = { type: 'student_restart_after_security_warning', warningNumber: antiCheatWarningsRef.current, at: new Date().toISOString() };
    const nextLog = [...antiCheatLog, restartEvent];
    setAnswers({});
    setFlagged({});
    setCurrentQIndex(0);
    setScore(0);
    setTimeLeft(exam.duration * 60);
    setStartTime(Date.now());
    setAntiCheatWarnings(0);
    antiCheatWarningsRef.current = 0;
    setAntiCheatLog(nextLog);
    setShowAntiCheatChoice(false);
    setSecurityLockReason('');
    if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
      try {
        await setDoc(doc(db, 'exam_results', exam.attemptId), {
          examId: exam.id,
          studentId: user.uid,
          studentName: user.displayName,
          answers: {},
          remainingTime: exam.duration * 60,
          currentQIndex: 0,
          score: 0,
          total: 0,
          status: 'in_progress',
          antiCheatWarnings: 0,
          antiCheatLog: nextLog,
          restartCount: increment(1),
          restartedAfterSecurityAt: serverTimestamp(),
          lastSavedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Could not restart attempt:', e?.message);
      }
    }
  };

  const handleCheatingRef = useRef();
  handleCheatingRef.current = async (eventType = 'focus_or_visibility_lost') => {
    const { isSubmitted, isCheating } = stateRefs.current;
    if (fileDialogBypassRef.current || isReviewMode || isSubmitted || isCheating) return;

    const nextWarning = antiCheatWarningsRef.current + 1;
    antiCheatWarningsRef.current = nextWarning;
    const event = { type: eventType, warningNumber: nextWarning, at: new Date().toISOString() };
    const nextLog = [...antiCheatLog, event];
    setAntiCheatWarnings(nextWarning);
    setAntiCheatLog(nextLog);

    if (nextWarning < 3) {
      alert(`تنبيه رقم ${nextWarning}: تم رصد حركة غير آمنة داخل الامتحان. عند التكرار للمرة الثالثة سيتم إيقاف المحاولة مؤقتًا لحين مراجعة الأدمن، والأدمن وحده يقرر السماح بالاستكمال أو إعادة الامتحان.`);
      await saveExamProgress({ antiCheatWarnings: nextWarning, antiCheatLog: nextLog });
      return;
    }

    setSecurityLockReason(eventType);
    setShowAntiCheatChoice(true);
    await saveExamProgress({
      status: 'security_hold',
      adminDecision: null,
      adminSecurityAction: 'pending',
      resumeApproved: false,
      antiCheatWarnings: nextWarning,
      antiCheatLog: nextLog,
      securityHoldAt: serverTimestamp(),
      securityReason: eventType
    });
  };

  useEffect(() => {
    if (isReviewMode) return;

    const handleBeforeUnload = (e) => {
      if (!stateRefs.current.isSubmitted) {
        e.preventDefault();
        e.returnValue = "هل أنت متأكد؟ الخروج سيمنعك من العودة للامتحان!";
        return e.returnValue;
      }
    };

    const handleAntiCheat = () => {
      const { showSubmitConfirm, isSubmitted, showAntiCheatChoice } = stateRefs.current;
      if (fileDialogBypassRef.current || showAntiCheatChoice) return;
      if (!showSubmitConfirm && !isSubmitted) handleCheatingRef.current('focus_or_visibility_lost');
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !fileDialogBypassRef.current) handleAntiCheat();
    };

    const blockContextMenu = (e) => {
      e.preventDefault();
      if (!stateRefs.current.isSubmitted && !stateRefs.current.showAntiCheatChoice) handleCheatingRef.current('right_click_attempt');
    };

    const handleBlockedClipboard = (e) => {
      if (fileDialogBypassRef.current || stateRefs.current.isSubmitted) return;
      e.preventDefault();
      handleCheatingRef.current(e.type === 'paste' ? 'paste_attempt' : 'copy_or_cut_attempt');
    };

    const handleExamKeyDown = (e) => {
      if (fileDialogBypassRef.current || stateRefs.current.isSubmitted) return;
      const key = String(e.key || '').toLowerCase();
      if (key === 'printscreen' || ((e.ctrlKey || e.metaKey) && ['c','v','x','p','s','u'].includes(key))) {
        e.preventDefault();
        handleCheatingRef.current('blocked_keyboard_shortcut');
      }
    };

    const handleFullScreenExit = () => {
      if (!document.fullscreenElement && !stateRefs.current.isSubmitted && !stateRefs.current.showAntiCheatChoice) handleCheatingRef.current('fullscreen_exit');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleAntiCheat);
    window.addEventListener("pagehide", handleAntiCheat);
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('copy', handleBlockedClipboard);
    document.addEventListener('cut', handleBlockedClipboard);
    document.addEventListener('paste', handleBlockedClipboard);
    document.addEventListener('keydown', handleExamKeyDown);
    document.addEventListener('fullscreenchange', handleFullScreenExit);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleAntiCheat);
      window.removeEventListener("pagehide", handleAntiCheat);
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('copy', handleBlockedClipboard);
      document.removeEventListener('cut', handleBlockedClipboard);
      document.removeEventListener('paste', handleBlockedClipboard);
      document.removeEventListener('keydown', handleExamKeyDown);
      document.removeEventListener('fullscreenchange', handleFullScreenExit);
    };
  }, [isReviewMode, mcqQuestions.length, exam.attemptId, exam.id, exam.duration, startTime, user.uid, user.displayName, showAntiCheatChoice]);

  useEffect(() => {
    if (isReviewMode || isSubmitted) return;
    if (timeLeft > 0 && !isCheating) {
      const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitted, isCheating, isReviewMode]);

  const handleAnswer = (qId, value) => {
    if (!isReviewMode && !isSubmitted && !showAntiCheatChoice) {
      setAnswers((prev) => {
        const nextAnswers = { ...prev, [qId]: value };
        if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
          setDoc(doc(db, 'exam_results', exam.attemptId), {
            answers: nextAnswers,
            remainingTime: timeLeft,
            currentQIndex,
            status: 'in_progress',
            lastSavedAt: serverTimestamp()
          }, { merge: true }).catch((e) => console.warn('answer autosave blocked:', e?.message));
        }
        return nextAnswers;
      });
    }
  };

  const handleEssayImageUpload = (qId, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الصورة كبير. الحد الأقصى 2 ميجا.");
      fileDialogBypassRef.current = false;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const previousAnswer = answers[qId];
      const currentText = typeof previousAnswer === 'object' ? previousAnswer?.text || '' : '';
      handleAnswer(qId, { text: currentText, image: reader.result, fileName: file.name });
      fileDialogBypassRef.current = false;
    };
    reader.onerror = () => {
      alert("حدث خطأ أثناء قراءة الصورة.");
      fileDialogBypassRef.current = false;
    };
    reader.readAsDataURL(file);
  };

  const calculateScore = () => {
    let rawScore = 0;
    mcqQuestions.forEach((q) => {
      if (answers[q.id] === q.correctIdx) rawScore++;
    });
    return rawScore;
  };

  const confirmSubmit = () => setShowSubmitConfirm(true);

  const handleSubmit = async (auto = false) => {
    setShowSubmitConfirm(false);
    const finalScore = calculateScore();
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const finalMetrics = calculateDetailedExamMetrics(exam, answers);
    const finalBranchStats = Object.fromEntries(
      Object.entries(finalMetrics.branchStats || {}).map(([branch, stat]) => [branch, {
        earned: safeNumber(stat.earned, 0),
        possible: safeNumber(stat.possible, 0),
        answered: safeNumber(stat.answered, 0),
        total: safeNumber(stat.total, 0),
        correct: safeNumber(stat.correct, 0),
        wrong: safeNumber(stat.wrong, 0),
        essay: safeNumber(stat.essay, 0),
        percentage: safeNumber(stat.possible, 0) > 0 ? Math.round((safeNumber(stat.earned, 0) / safeNumber(stat.possible, 0)) * 100) : 0
      }])
    );

    setScore(finalScore);
    setIsSubmitted(true);
    setActiveView('dashboard');

    const batch = writeBatch(db);

    mcqQuestions.forEach((q) => {
      const studentAns = answers[q.id];
      const isAnswered = studentAns !== undefined;
      const isCorrect = studentAns === q.correctIdx;

      if (isAnswered && !isCorrect) {
        const mistakeRef = doc(collection(db, 'student_mistakes'));
        batch.set(mistakeRef, {
          userId: user.uid,
          examTitle: exam.title,
          question: {
            ...q,
            studentAnswerText: q.options?.[studentAns],
            correctAnswerText: q.options?.[q.correctIdx]
          },
          timestamp: serverTimestamp()
        });
      }
    });

    if (exam.attemptId && exam.id !== 'custom_mistakes_exam') {
      const attemptRef = doc(db, 'exam_results', exam.attemptId);
      batch.set(attemptRef, {
        examId: exam.id,
        examTitle: exam.title || '',
        grade: exam.grade || '',
        studentId: user.uid,
        studentName: user.displayName || 'طالب',
        score: finalScore,
        mcqScore: finalScore,
        total: mcqQuestions.length,
        totalPossible: finalMetrics.totalPossible || mcqQuestions.length,
        answers,
        status: 'completed',
        timeTaken,
        totalTime: exam.duration,
        hasEssay: essayQuestions.length > 0,
        sourceVideoId: exam.sourceVideoId || null,
        startedFromVideo: !!exam.sourceVideoId,
        antiCheatWarnings,
        antiCheatLog,
        branchStats: finalBranchStats,
        weakBranches: Object.entries(finalBranchStats).map(([branch, stat]) => ({
          branch,
          percentage: stat.percentage,
          wrong: stat.wrong,
          correct: stat.correct,
          total: stat.total,
          possible: stat.possible,
          earned: stat.earned
        })).sort((a,b) => a.percentage - b.percentage),
        performanceAnalysis: {
          percentage: finalMetrics.percentage || (mcqQuestions.length > 0 ? Math.round((finalScore / mcqQuestions.length) * 100) : 0),
          totalScore: finalMetrics.totalScore || finalScore,
          totalPossible: finalMetrics.totalPossible || mcqQuestions.length,
          branchStats: finalBranchStats
        },
        percentage: finalMetrics.percentage || (mcqQuestions.length > 0 ? Math.round((finalScore / mcqQuestions.length) * 100) : 0),
        submittedAt: serverTimestamp()
      }, { merge: true });
    }

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error saving results or mistakes", err);
    }
  };

  if (flatQuestions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white font-['Cairo']">
        عفواً، لا توجد أسئلة.
        <button onClick={onClose} className="ml-4 bg-gray-200 px-4 py-2 rounded">خروج</button>
      </div>
    );
  }

  const currentQObj = displayQuestions[currentQIndex];
  if (!currentQObj) return null;

  if (isCheating) {
    return (
      <div className="fixed inset-0 z-[60] bg-red-900 flex items-center justify-center text-white text-center font-['Cairo']">
        <div>
          <AlertOctagon size={80} className="mx-auto mb-4" />
          <h1>تم رصد محاولة غش!</h1>
          <p className="text-red-200 mt-2">خرجت من الامتحان. تم رصد درجتك (صفر) وحظرك من الامتحانات القادمة.</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-white text-red-900 px-6 py-2 rounded-full font-bold">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const totalQs = flatQuestions.length;
  const solvedQs = flatQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null).length;
  const unsolvedQs = totalQs - solvedQs;
  const correctQs = score;
  const wrongQs = mcqQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== q.correctIdx).length;
  const percentage = mcqQuestions.length > 0 ? Math.round((score / mcqQuestions.length) * 100) : 0;
  const essayAnswered = essayQuestions.filter((q) => {
    const val = answers[q.id];
    if (typeof val === 'object') return !!(val?.text?.trim() || val?.image);
    return !!val;
  }).length;

  const branchStats = {};
  flatQuestions.forEach((q) => {
    const b = q.branch;
    if (!branchStats[b]) branchStats[b] = { total: 0, solved: 0, correct: 0, wrong: 0, unsolved: 0, essay: 0 };
    branchStats[b].total++;
    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null;
    if (isAnswered) branchStats[b].solved++;
    else branchStats[b].unsolved++;

    if (q.type === 'essay') {
      branchStats[b].essay++;
    } else if (answers[q.id] === q.correctIdx) {
      branchStats[b].correct++;
    } else if (answers[q.id] !== undefined) {
      branchStats[b].wrong++;
    }
  });

  const canReview = exam.id === 'custom_mistakes_exam' || Date.now() > new Date(exam.endTime).getTime();
  const detailedMetrics = calculateDetailedExamMetrics(exam, answers);
  const performanceInsights = getPerformanceInsights(detailedMetrics);
  const gradeBadge = getGradeBadge(detailedMetrics.percentage || percentage);

  if (activeView === 'dashboard') {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto p-4 md:p-8 font-['Cairo'] text-slate-200" dir="rtl">
        <div className="max-w-6xl mx-auto mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-slate-700 pb-4 gap-4">
            <div className="text-center md:text-right">
              <h2 className="text-3xl font-black text-white mb-2">{exam.title}</h2>
              {isSubmitted ? (
                <p className="text-lg text-slate-400">الطالب: {user.displayName}</p>
              ) : (
                <p className="text-amber-400 font-bold">⏳ الوقت المتبقي: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isSubmitted ? (
                <>
                  <button
                    onClick={() => generatePDF('student', { studentName: user.displayName, score, total: mcqQuestions.length, status: 'completed', examTitle: exam.title, questions: flatQuestions, answers })}
                    className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
                    title="تحميل التقرير PDF"
                  >
                    <FileText size={20} />
                  </button>
                  <button onClick={onClose} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-600 shadow-lg transition flex items-center gap-2">
                    خروج <LogOut size={18} />
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setActiveView('questions')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    استكمال الامتحان <Play size={18} />
                  </button>
                  <button onClick={confirmSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2">
                    تسليم الآن <CheckCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-10">
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">عدد الأسئلة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{totalQs}</p>
            </div>
            <div className="bg-[#1e293b] p-6 rounded-2xl text-center border-t-4 border-slate-500 shadow-xl flex flex-col justify-center">
              <p className="text-slate-400 text-sm mb-3 font-bold">{isSubmitted ? 'النتيجة' : 'تم الحل'}</p>
              <p className="text-4xl md:text-5xl font-black text-white">{isSubmitted ? `${percentage}%` : `${solvedQs}/${totalQs}`}</p>
            </div>
            <div className="bg-[#0e7490] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-cyan-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><CheckCircle size={16} /> المحلولة</p>
              <p className="text-4xl md:text-5xl font-black text-white">{solvedQs}</p>
            </div>
            <div className="bg-[#115e59] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-teal-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><Check size={16} /> الصحيحة</p>
              <p className="text-4xl md:text-5xl font-black text-teal-50">{correctQs}</p>
            </div>
            <div className="bg-[#831843] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-pink-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><XCircle size={16} /> الخاطئة</p>
              <p className="text-4xl md:text-5xl font-black text-pink-50">{wrongQs}</p>
            </div>
            <div className="bg-[#78350f] p-6 rounded-2xl text-center shadow-xl flex flex-col justify-center">
              <p className="text-amber-100 text-sm mb-3 flex items-center justify-center gap-2 font-bold"><PenTool size={16} /> المقالي</p>
              <p className="text-4xl md:text-5xl font-black text-amber-50">{essayAnswered}/{essayQuestions.length}</p>
            </div>
          </div>

          {!isSubmitted && (
            <div className="mb-6 bg-slate-800/60 text-slate-200 p-4 rounded-2xl border border-slate-700 text-center font-bold">
              وضع الأمان مفعل: يتم تسجيل الخروج من الصفحة، النسخ/اللصق، كليك يمين، والخروج من ملء الشاشة.
              زر ملء الشاشة موجود الآن بجانب زر التسليم داخل صفحة الأسئلة.
            </div>
          )}

          {antiCheatWarnings > 0 && !isSubmitted && (
            <div className="mb-6 bg-amber-900/30 text-amber-300 p-4 rounded-2xl border border-amber-700 text-center font-bold">
              تم تسجيل {antiCheatWarnings} تنبيه أمان. النظام يعطي تنبيهات قبل أي إجراء نهائي لتجنب ظلم الطالب.
            </div>
          )}

          {isSubmitted && (
            <div className="mb-10 bg-white/5 border border-slate-700 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2"><BrainCircuit className="text-amber-400"/> المراجعة الذكية</h3>
                <span className={`px-4 py-2 rounded-full border text-sm font-bold ${gradeBadge.tone}`}>{gradeBadge.text} - {detailedMetrics.percentage || percentage}%</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">إجمالي الدرجة</p><p className="text-2xl font-black text-emerald-300">{detailedMetrics.totalScore}/{detailedMetrics.totalPossible || mcqQuestions.length}</p></div>
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">اختياري</p><p className="text-2xl font-black text-blue-300">{detailedMetrics.mcqCount} سؤال</p></div>
                <div className="bg-slate-900/70 rounded-2xl p-4 border border-slate-700"><p className="text-slate-400 text-sm">مقالي</p><p className="text-2xl font-black text-amber-300">{detailedMetrics.essayCount} سؤال</p></div>
              </div>
              <div className="space-y-2">
                {performanceInsights.map((note, idx) => <div key={idx} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-slate-200 text-sm font-bold">{note}</div>)}
              </div>
              <div className="mt-5">
                <StudentLocalAdvice metrics={detailedMetrics} content={[]} />
              </div>
            </div>
          )}

          {!isSubmitted && (
            <div className="mb-6 bg-blue-900/20 text-blue-300 p-4 rounded-2xl border border-blue-900/40 text-center font-bold">
              زر التسليم أصبح ظاهرًا في أعلى صفحة الأسئلة وأيضًا داخل لوحة التحكم.
            </div>
          )}

          {Object.keys(branchStats).length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-teal-400"><Layers size={28} /> {isSubmitted ? 'ملخص الفروع' : 'أقسام الامتحان'}</h3>
                {(canReview || !isSubmitted) && (
                  <button onClick={() => { setActiveBranchTab('الكل'); setActiveView('questions'); }} className="text-teal-400 bg-teal-900/30 px-4 py-2 rounded-lg font-bold hover:bg-teal-900/50 transition text-sm flex items-center gap-2">
                    مراجعة الامتحان كله <ClipboardList size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(branchStats).map(([branch, stats], idx) => {
                  const branchMcqTotal = flatQuestions.filter(q => q.branch === branch && q.type !== 'essay').length;
                  const bPercent = branchMcqTotal > 0 ? Math.round((stats.correct / branchMcqTotal) * 100) : 100;
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
                        <span className={`${isSubmitted ? 'text-teal-400' : 'text-blue-400'} text-4xl font-black`}>{bPercent}%</span>
                        <span className="text-xl font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">{branch}</span>
                      </div>
                      <div className="w-full bg-[#0f172a] rounded-full h-2.5 mb-6 overflow-hidden">
                        <div className={`${isSubmitted ? 'bg-teal-400' : 'bg-blue-400'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${bPercent}%` }} />
                      </div>
                      <div className="text-sm mt-4 bg-[#0f172a] p-3 rounded-lg text-slate-300 space-y-1">
                        <div className="flex justify-between"><span>إجمالي</span><span>{stats.total}</span></div>
                        <div className="flex justify-between"><span>صحيحة</span><span className="text-teal-300">{stats.correct}</span></div>
                        <div className="flex justify-between"><span>خاطئة</span><span className="text-pink-300">{stats.wrong}</span></div>
                        <div className="flex justify-between"><span>مقالي</span><span className="text-amber-300">{stats.essay}</span></div>
                      </div>
                      {(canReview || !isSubmitted) && (
                        <div className="mt-4 text-center text-teal-300 text-xs font-bold">
                          اضغط لمراجعة هذا الفرع فقط
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!canReview && isSubmitted && (
            <div className="mt-8 bg-amber-900/30 text-amber-400 p-6 rounded-2xl border border-amber-900 text-center font-bold text-lg flex flex-col items-center gap-3">
              <Clock size={32} />
              نموذج الإجابة والمراجعة سيظهر هنا تلقائياً بعد انتهاء وقت الامتحان للأغلبية.
            </div>
          )}

          {!isSubmitted && (
            <div className="flex justify-end mt-8 border-t border-slate-700 pt-6">
              <button onClick={confirmSubmit} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                <CheckCircle size={20} /> تسليم الامتحان نهائياً
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col font-['Cairo'] no-select" dir="rtl">
      {!isSubmitted && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {wmPositions.map((pos, i) => (
            <div key={i} className="watermark-text" style={{ top: pos.top, left: pos.left }}>
              {user.displayName} - {user.email}
            </div>
          ))}
        </div>
      )}

      {showAntiCheatChoice && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 max-w-lg w-full shadow-2xl text-center border-t-8 border-red-500">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2 text-slate-900">تم إيقاف المحاولة مؤقتًا</h3>
            <p className="text-slate-600 mb-5 font-bold leading-relaxed">
              تم رصد أكثر من مخالفة أمان أثناء الامتحان. تم حفظ إجاباتك والوقت المتبقي، ولن يتم تصفيرك تلقائيًا.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-right text-sm text-red-800 mb-6 space-y-2">
              <p><b>القرار الآن عند الأدمن فقط:</b></p>
              <p>يمكن للأدمن من لوحة النتائج أن يسمح لك باستكمال الامتحان بنفس الإجابات والوقت المتبقي.</p>
              <p>أو يسمح بإعادة الامتحان من البداية إذا رأى أن الحالة تستحق ذلك.</p>
              <p className="font-black">نظام الأمان سيظل نشطًا بنفس الصرامة بعد السماح.</p>
            </div>
            <button onClick={onClose} className="bg-slate-900 text-white py-3 px-8 rounded-xl font-bold hover:bg-slate-800 shadow-md transition">
              العودة للمنصة وانتظار قرار الأدمن
            </button>
          </div>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-t-8 border-amber-500">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
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
              <Layout size={16} /> العودة للنتيجة
            </button>
          )}
          <h2 className="font-bold text-lg font-sans text-amber-400 truncate hidden md:block">{exam.title} {isSubmitted ? '(مراجعة الإجابات)' : ''}</h2>
          {!isSubmitted && (
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
              <div className="bg-slate-800 px-4 md:px-6 py-2 rounded-full font-mono shadow-inner border border-slate-700 font-bold text-amber-400 text-base md:text-lg flex items-center gap-2">
                <Timer size={18} /> {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <button
                onClick={() => document.documentElement.requestFullscreen?.().catch(() => alert('لو ملء الشاشة لم يعمل، افتح المنصة من المتصفح مباشرة وليس داخل تطبيق خارجي.'))}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 md:px-4 py-2 rounded-xl font-black transition whitespace-nowrap flex items-center gap-2 shadow-lg"
                title="تفعيل ملء الشاشة"
              >
                <Layout size={18} /> ملء الشاشة
              </button>
              <button onClick={confirmSubmit} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 shadow-lg">
                <CheckCircle size={18} /> تسليم
              </button>
            </div>
          )}
        </div>

        {isSubmitted && (
          <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide items-center">
            <button
              onClick={() => setActiveBranchTab('الكل')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === 'الكل' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60'}`}
            >
              مراجعة الامتحان كله
            </button>
            {uniqueBranches.filter(branch => branch !== 'الكل').map((branch, i) => (
              <button
                key={i}
                onClick={() => setActiveBranchTab(branch)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-colors ${activeBranchTab === branch ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {branch}
              </button>
            ))}
          </div>
        )}

        {!isSubmitted && (
          <button onClick={() => setActiveView('dashboard')} className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2">
            <Layout size={18} /> لوحة التحكم
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative z-50">
        <div className="w-16 md:w-24 bg-white border-l flex flex-col p-2 overflow-y-auto shadow-inner scrollbar-hide">
          <div className="grid grid-cols-1 gap-3">
            {displayQuestions.map((q, idx) => {
              let statusClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent';
              const currentAnswer = answers[q.id];
              const isAnswered = currentAnswer !== undefined && currentAnswer !== '' && currentAnswer !== null;

              if (isSubmitted) {
                if (q.type === 'essay') {
                  statusClass = isAnswered ? 'bg-blue-100 text-blue-700 border-blue-500 shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
                } else if (answers[q.id] === q.correctIdx) {
                  statusClass = 'bg-green-100 text-green-700 border-green-500 shadow-sm';
                } else if (isAnswered) {
                  statusClass = 'bg-red-100 text-red-700 border-red-500 shadow-sm';
                } else {
                  statusClass = 'bg-slate-100 text-slate-400 border-slate-300 border-dashed';
                }
              } else if (isAnswered) {
                statusClass = q.type === 'essay' ? 'bg-purple-100 text-purple-700 border-purple-400 shadow-sm' : 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm';
              }

              const originalIndex = flatQuestions.findIndex(origQ => origQ.id === q.id) + 1;
              return (
                <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`aspect-square rounded-xl font-bold text-base transition-all relative ${currentQIndex === idx ? 'ring-4 ring-amber-500 ring-offset-2 scale-105 z-10' : ''} ${statusClass}`}>
                  {originalIndex}
                  {flagged[q.id] && !isSubmitted && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'md:flex-row' : 'items-center'} h-full overflow-hidden bg-slate-100 w-full p-4 md:p-8 gap-6`}>
          {currentQObj?.blockText && currentQObj.blockText.trim().length > 0 && (
            <div className="flex-1 w-full bg-white p-6 md:p-10 overflow-y-auto rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-xl border-b border-blue-100 pb-4 font-['Cairo']"><FileText size={24} /> نص المراجعة / القراءة:</h3>
              <div className="leading-loose text-lg md:text-xl font-bold text-slate-700 font-['Cairo']">{renderBracketHighlightedText(currentQObj.blockText)}</div>
            </div>
          )}

          <div className={`${currentQObj?.blockText && currentQObj.blockText.trim().length > 0 ? 'flex-1' : 'w-full max-w-4xl mx-auto'} bg-white p-6 md:p-10 overflow-y-auto flex flex-col shadow-xl rounded-3xl h-full border border-slate-200 relative`}>
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <span className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md font-['Cairo']">سؤال {flatQuestions.findIndex(origQ => origQ.id === currentQObj.id) + 1}</span>
                {currentQObj.branch && currentQObj.branch !== 'عام' && (
                  <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2"><Layers size={16} /> {currentQObj.branch}</span>
                )}
                {currentQObj.type === 'essay' && (
                  <span className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold border border-purple-100 flex items-center gap-2"><PenTool size={16} /> سؤال مقالي</span>
                )}
              </div>
              {!isSubmitted && <button onClick={() => { setFlagged({ ...flagged, [currentQObj.id]: !flagged[currentQObj.id] }); }} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition shadow-sm ${flagged[currentQObj.id] ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}><Flag size={16} /> {flagged[currentQObj.id] ? 'محدد للمراجعة' : 'تحديد لمراجعته لاحقاً'}</button>}
            </div>

            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mb-8 shadow-inner text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-loose font-['Cairo'] drop-shadow-sm">
                {String(currentQObj.text || '').split('|').map((part, i) => (
                  <React.Fragment key={i}>
                    {renderBracketHighlightedText(part.trim())}
                    {i !== String(currentQObj.text || '').split('|').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h3>
            </div>

            {isSubmitted && (
              <div className="mb-6">
                <LocalQuestionExplanation question={currentQObj} answers={answers} />
              </div>
            )}

            {currentQObj.type === 'essay' ? (
              <div className="space-y-4">
                {isSubmitted && (
                  <LocalEssayReviewBox question={currentQObj} answer={answers[currentQObj.id]} />
                )}
                {!isSubmitted ? (
                  <>
                    <textarea
                      className="w-full min-h-[180px] border-2 border-slate-200 rounded-2xl p-4 text-lg focus:border-amber-500 outline-none transition"
                      placeholder="اكتب إجابتك المقالية هنا..."
                      value={typeof answers[currentQObj.id] === 'object' ? (answers[currentQObj.id]?.text || '') : (answers[currentQObj.id] || '')}
                      onChange={(e) => {
                        const previousImage = typeof answers[currentQObj.id] === 'object' ? answers[currentQObj.id]?.image : null;
                        const previousFileName = typeof answers[currentQObj.id] === 'object' ? answers[currentQObj.id]?.fileName : null;
                        handleAnswer(currentQObj.id, { text: e.target.value, image: previousImage, fileName: previousFileName });
                      }}
                    />
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50">
                      <label className="cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-700 flex items-center gap-2"><UploadCloud size={18} /> أو ارفع صورة لإجابة مكتوبة يدويًا</p>
                          <p className="text-sm text-slate-500 mt-1">فتح الكاميرا/الملفات لهذا السؤال لا يُعتبر غشًا.</p>
                        </div>
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold">اختيار صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onClick={() => { fileDialogBypassRef.current = true; }}
                          onChange={(e) => handleEssayImageUpload(currentQObj.id, e.target.files?.[0])}
                        />
                      </label>
                      {typeof answers[currentQObj.id] === 'object' && answers[currentQObj.id]?.image && (
                        <div className="mt-4">
                          <img src={answers[currentQObj.id].image} alt="إجابة مقالية" className="max-h-64 rounded-xl border border-slate-200 mx-auto" />
                          <p className="text-xs text-slate-500 mt-2">{answers[currentQObj.id]?.fileName || 'تم رفع صورة'}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                      <p className="font-bold text-blue-800 mb-2">إجابتك النصية</p>
                      <p className="whitespace-pre-wrap text-slate-700">
                        {typeof answers[currentQObj.id] === 'object' ? (answers[currentQObj.id]?.text || 'لم يتم إدخال نص') : (answers[currentQObj.id] || 'لم يتم إدخال نص')}
                      </p>
                    </div>
                    {typeof answers[currentQObj.id] === 'object' && answers[currentQObj.id]?.image && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                        <p className="font-bold text-slate-800 mb-2">الصورة المرفوعة</p>
                        <img src={answers[currentQObj.id].image} alt="إجابة مقالية" className="max-h-80 rounded-xl border border-slate-200 mx-auto" />
                      </div>
                    )}
                    {currentQObj.modelAnswer && (
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                        <p className="font-bold text-green-800 mb-2">نموذج الإجابة</p>
                        <p className="whitespace-pre-wrap text-slate-700">{currentQObj.modelAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(Array.isArray(currentQObj.options) ? currentQObj.options : []).map((opt, idx) => {
                  let optionClass = 'border-slate-200 hover:bg-slate-50 bg-white text-slate-700';
                  const isSelected = answers[currentQObj.id] === idx;

                  if (isSubmitted) {
                    if (idx === currentQObj.correctIdx) optionClass = 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200';
                    else if (isSelected) optionClass = 'border-red-500 bg-red-50 text-red-900 shadow-md';
                    else optionClass = 'border-slate-200 bg-slate-50 opacity-50';
                  } else if (isSelected) {
                    optionClass = 'border-amber-500 bg-amber-50 text-amber-900 shadow-md transform scale-[1.02] ring-2 ring-amber-200';
                  }

                  return (
                    <div key={idx} onClick={() => handleAnswer(currentQObj.id, idx)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${optionClass}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && idx === currentQObj.correctIdx) ? 'border-transparent bg-current' : 'border-slate-300'}`}>
                        {(isSubmitted && idx === currentQObj.correctIdx) && <Check size={16} className="text-white" />}
                        {(isSubmitted && isSelected && idx !== currentQObj.correctIdx) && <X size={16} className="text-white" />}
                      </div>
                      <span className="font-['Cairo'] text-xl font-bold leading-relaxed">{opt}</span>
                      {isSubmitted && idx === currentQObj.correctIdx && <span className="mr-auto text-green-600 bg-green-100 px-3 py-1 rounded-lg text-xs font-bold">الإجابة الصحيحة</span>}
                      {isSubmitted && isSelected && idx !== currentQObj.correctIdx && <span className="mr-auto text-red-600 bg-red-100 px-3 py-1 rounded-lg text-xs font-bold">إجابتك (خطأ)</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {isSubmitted && currentQObj.explanation && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-right">
                <p className="font-bold text-blue-800 mb-2 flex items-center gap-2"><HelpCircle size={18}/> شرح الإجابة</p>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{currentQObj.explanation}</p>
              </div>
            )}

            <div className="mt-auto pt-10 flex justify-between">
              <button disabled={currentQIndex === 0} onClick={() => setCurrentQIndex((p) => p - 1)} className="px-8 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold disabled:opacity-50 hover:bg-slate-300 transition shadow-sm font-['Cairo'] flex items-center gap-2"><ChevronRight size={20} /> السابق</button>
              <button disabled={currentQIndex === displayQuestions.length - 1} onClick={() => setCurrentQIndex((p) => p + 1)} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 hover:bg-slate-800 transition shadow-lg font-['Cairo'] flex items-center gap-2">التالي <ChevronRight size={20} className="rotate-180" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlatformPerformanceBooster = () => {
  useEffect(() => {
    if (import.meta.env.PROD) console.debug = () => {};
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        try { sessionStorage.setItem('platform_warmup', String(Date.now())); } catch(e) {}
      });
    }
  }, []);
  return null;
};












const AIQuickHealthCheck = () => {
  const [status, setStatus] = useState(null);
  const checkAI = async () => {
    setStatus('checking');
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({ mode: 'generate_questions', question: 'اختبار تشغيل سريع', topic: 'النحو', count: 1, adminOnly: true })
      });
      const data = await res.json().catch(() => ({}));
      setStatus(res.ok && data.ok ? 'ok' : 'bad');
    } catch {
      setStatus('bad');
    }
  };
  return (
    <button onClick={checkAI} className={`text-xs px-3 py-2 rounded-xl font-bold ${status === 'ok' ? 'bg-emerald-100 text-emerald-700' : status === 'bad' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
      {status === 'checking' ? 'فحص AI...' : status === 'ok' ? 'AI يعمل ✅' : status === 'bad' ? 'AI لا يعمل - راجع API' : 'فحص AI'}
    </button>
  );
};



const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};


const LiveAICoachPanel = ({ session, user, userData }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [examDraft, setExamDraft] = useState(null);

  const lessonContext = {
    title: session?.title || '',
    branch: session?.branch || '',
    grade: session?.grade || userData?.grade || '',
    description: session?.description || session?.notes || '',
    streamUrl: session?.streamUrl || session?.url || ''
  };

  const askAI = async () => {
    if (!question.trim()) return alert('اكتب سؤالك الأول.');
    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'student_chat',
          studentName: userData?.name || user?.displayName || user?.email || '',
          grade: lessonContext.grade,
          question: `سؤال الطالب أثناء المحاضرة: ${question}\n\nسياق المحاضرة: ${JSON.stringify(lessonContext)}`,
          recentResults: []
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'AI لم يرد الآن.');
      const a = data.analysis || data.data || {};
      setAnswer(a.answer || a.explanation || a.summary || 'تم.');
    } catch (e) {
      setAnswer(e.message || 'تعذر تشغيل AI الآن.');
    } finally {
      setLoading(false);
    }
  };

  const summarizeLesson = async () => {
    setLoading(true);
    setSummary('');
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'student_chat',
          grade: lessonContext.grade,
          question: `لخص هذه المحاضرة للطلاب بنقاط منظمة، ثم اكتب أهم الأفكار، ثم أسئلة مراجعة قصيرة. بيانات المحاضرة: ${JSON.stringify(lessonContext)}`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر تلخيص المحاضرة.');
      const a = data.analysis || data.data || {};
      setSummary(a.answer || a.explanation || a.summary || JSON.stringify(a));
    } catch (e) {
      setSummary(e.message || 'تعذر التلخيص الآن.');
    } finally {
      setLoading(false);
    }
  };

  const generateLessonExam = async () => {
    setLoading(true);
    setExamDraft(null);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'generate_exam',
          topic: `${lessonContext.title} ${lessonContext.description}`,
          branches: lessonContext.branch || lessonContext.title,
          grade: lessonContext.grade,
          mcqCount: 15,
          essayCount: 0,
          duration: 20,
          instructions: 'امتحان سريع من محتوى المحاضرة فقط. لا تخرج عن عنوان ووصف المحاضرة.'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر توليد امتحان المحاضرة.');
      setExamDraft((data.analysis || data.data || {}).exam || data.analysis || data.data);
    } catch (e) {
      alert(e.message || 'تعذر توليد الامتحان.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 border border-fuchsia-100 rounded-2xl p-4 space-y-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <Sparkles className="text-fuchsia-600"/> Live AI Coach
          </h3>
          <p className="text-xs text-slate-500">AI يعتمد على عنوان ووصف المحاضرة وشات الطلبة، وليس على صوت الفيديو مباشرة.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={loading} onClick={summarizeLesson} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold">تلخيص المحاضرة</button>
          <button disabled={loading} onClick={generateLessonExam} className="bg-fuchsia-600 text-white px-4 py-2 rounded-xl font-black">توليد امتحان</button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <input value={question} onChange={(e)=>setQuestion(e.target.value)} onKeyDown={(e)=>{ if(e.key === 'Enter') askAI(); }} className="flex-1 border rounded-xl p-3" placeholder="اسأل AI أثناء المحاضرة..." />
        <button disabled={loading} onClick={askAI} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black">{loading ? 'جاري...' : 'اسأل AI'}</button>
      </div>
      {answer && <div className="bg-sky-50 border border-sky-100 text-slate-800 rounded-xl p-3 font-bold leading-relaxed whitespace-pre-wrap">{answer}</div>}
      {summary && <div className="bg-emerald-50 border border-emerald-100 text-slate-800 rounded-xl p-3 font-bold leading-relaxed whitespace-pre-wrap">{summary}</div>}
      {examDraft && (
        <details className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-3">
          <summary className="cursor-pointer font-black text-fuchsia-700">امتحان المحاضرة الناتج من AI</summary>
          <pre dir="ltr" className="mt-3 bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-[360px]">{JSON.stringify(examDraft, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

const LiveSessionCreator = ({ adminGradeFilter = 'all' }) => {
  const [title, setTitle] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [platform, setPlatform] = useState('jitsi');
  const [grade, setGrade] = useState(adminGradeFilter === 'all' ? '3sec' : adminGradeFilter);
  const [branch, setBranch] = useState('');
  const [description, setDescription] = useState('');

  const createSession = async () => {
    if (!title.trim()) return alert('اكتب عنوان المحاضرة.');
    let finalUrl = streamUrl.trim();
    if (platform === 'jitsi' && !finalUrl) {
      const room = `Nahhas-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      finalUrl = `https://meet.jit.si/${room}`;
    }
    if (!finalUrl) return alert('ضع رابط البث أو اختر Jitsi لإنشاء غرفة تلقائيًا.');

    await addDoc(collection(db, 'live_sessions'), {
      title: title.trim(),
      streamUrl: finalUrl,
      url: finalUrl,
      platform,
      grade,
      branch: branch.trim(),
      description: description.trim(),
      notes: description.trim(),
      isLive: true,
      createdAt: serverTimestamp()
    });

    setTitle('');
    setStreamUrl('');
    setBranch('');
    setDescription('');
    alert('تم إنشاء المحاضرة المباشرة.');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-sky-600 mb-6">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Radio className="text-sky-600"/> إنشاء محاضرة Live + AI</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input className="border rounded-xl p-3" placeholder="عنوان المحاضرة" value={title} onChange={e=>setTitle(e.target.value)} />
        <select className="border rounded-xl p-3" value={platform} onChange={e=>setPlatform(e.target.value)}>
          <option value="jitsi">Jitsi Meet - مجاني داخل المنصة</option>
          <option value="youtube">YouTube Live</option>
          <option value="zoom">Zoom / رابط خارجي</option>
          <option value="custom">رابط مخصص iframe</option>
        </select>
        <select className="border rounded-xl p-3" value={grade} onChange={e=>setGrade(e.target.value)}><GradeOptions/></select>
        <input className="border rounded-xl p-3" placeholder="الفرع: نحو / قراءة / بلاغة..." value={branch} onChange={e=>setBranch(e.target.value)} />
      </div>
      <input className="border rounded-xl p-3 w-full mb-3" placeholder="رابط البث - اتركه فارغًا مع Jitsi لإنشاء غرفة تلقائيًا" value={streamUrl} onChange={e=>setStreamUrl(e.target.value)} />
      <textarea className="border rounded-xl p-3 w-full mb-3 min-h-[100px]" placeholder="اكتب وصف المحاضرة أو نقاط الدرس حتى يفهم AI المحتوى..." value={description} onChange={e=>setDescription(e.target.value)} />
      <button onClick={createSession} className="bg-sky-600 text-white px-6 py-3 rounded-xl font-black hover:bg-sky-700">إنشاء المحاضرة</button>
    </div>
  );
};


const LiveAttendanceModal = ({ session, onClose }) => {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (!session?.id) return;

    const unsub = onSnapshot(collection(db, 'live_attendance'), (snap) => {
      const rows = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.sessionId === session.id)
        .sort((a, b) => (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0));

      setAttendance(rows);
    }, (error) => {
      pushDebugLog?.('live-attendance-error', error.message, {});
      setAttendance([]);
    });

    return () => unsub();
  }, [session?.id]);

  const exportCSV = () => {
    const header = ['studentName', 'grade', 'userEmail', 'joinedAt'];
    const rows = attendance.map(r => {
      const joined = r.joinedAt?.toDate?.()?.toLocaleString('ar-EG') || '';
      return [
        r.studentName || '',
        getGradeLabel(r.grade || ''),
        r.userEmail || r.email || '',
        joined
      ].map(v => `"${String(v).replaceAll('"', '""')}"`).join(',');
    });

    const csv = [header.join(','), ...rows].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live_attendance_${session?.title || session?.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyNames = async () => {
    await navigator.clipboard?.writeText(attendance.map(a => a.studentName || a.userId).join('\\n'));
    alert('تم نسخ أسماء الحضور.');
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto border-t-8 border-sky-600">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="font-black text-2xl">حضور المحاضرة</h2>
            <p className="text-xs text-slate-300 mt-1">{session?.title} • عدد الحضور: {attendance.length}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 rounded-full p-2"><X/></button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-sky-600">إجمالي الحضور</p>
              <p className="text-4xl font-black text-sky-800">{attendance.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-600">الصف</p>
              <p className="text-xl font-black text-emerald-800">{getGradeLabel(session?.grade)}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-purple-600">الفرع</p>
              <p className="text-xl font-black text-purple-800">{session?.branch || 'عام'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={exportCSV} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black">تصدير CSV</button>
            <button onClick={copyNames} className="bg-sky-100 text-sky-700 px-4 py-2 rounded-xl font-bold">نسخ الأسماء</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm border rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-3 text-right">الطالب</th>
                  <th className="p-3">الصف</th>
                  <th className="p-3">الإيميل / ID</th>
                  <th className="p-3">وقت الدخول</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(row => (
                  <tr key={row.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-black text-slate-800">{row.studentName || 'طالب'}</td>
                    <td className="p-3 text-center font-bold">{getGradeLabel(row.grade)}</td>
                    <td className="p-3 text-center text-xs text-slate-500">{row.userEmail || row.email || row.userId}</td>
                    <td className="p-3 text-center font-bold">{row.joinedAt?.toDate?.()?.toLocaleString('ar-EG') || 'غير محدد'}</td>
                  </tr>
                ))}

                {attendance.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-400 font-bold">
                      لا يوجد حضور مسجل لهذه المحاضرة حتى الآن.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mt-5 text-sm font-bold text-amber-800 leading-relaxed">
            ملاحظة: الطالب يتسجل حضوره عندما يدخل المحاضرة من داخل المنصة. لو دخل مباشرة من رابط Jitsi خارج المنصة، لن يظهر في الحضور.
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveSessionsAdminPanel = ({ adminGradeFilter = 'all' }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedAttendanceSession, setSelectedAttendanceSession] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'live_sessions'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setSessions(rows);
    }, () => setSessions([]));

    return () => unsub();
  }, []);

  const toggleLive = async (s) => {
    await updateDoc(doc(db, 'live_sessions', s.id), { isLive: !s.isLive });
  };

  const remove = async (s) => {
    if (!window.confirm('حذف المحاضرة؟')) return;
    await deleteDoc(doc(db, 'live_sessions', s.id));
  };

  return (
    <>
      <div className="space-y-6">
        <LiveSessionCreator adminGradeFilter={adminGradeFilter} />

        <div className="glass-panel rounded-2xl p-5 border-t-4 border-slate-700">
          <h2 className="text-2xl font-black text-slate-800 mb-4">إدارة المحاضرات المباشرة</h2>

          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-800">{s.title}</h3>
                  <p className="text-xs text-slate-500">{getGradeLabel(s.grade)} • {s.branch || 'عام'} • {s.platform || 'custom'}</p>
                  <p className="text-xs text-slate-400 break-all mt-1">{s.streamUrl || s.url}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => toggleLive(s)} className={`${s.isLive ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} px-4 py-2 rounded-xl font-bold`}>
                    {s.isLive ? 'إيقاف' : 'تشغيل'}
                  </button>

                  <button onClick={() => setSelectedAttendanceSession(s)} className="bg-sky-100 text-sky-700 px-4 py-2 rounded-xl font-bold">
                    عرض الحضور
                  </button>

                  <button onClick={() => remove(s)} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold">
                    حذف
                  </button>
                </div>
              </div>
            ))}

            {!sessions.length && (
              <p className="text-center text-slate-400 py-8 font-bold">لا توجد محاضرات بعد.</p>
            )}
          </div>
        </div>
      </div>

      {selectedAttendanceSession && (
        <LiveAttendanceModal
          session={selectedAttendanceSession}
          onClose={() => setSelectedAttendanceSession(null)}
        />
      )}
    </>
  );
};


const LiveSessionStudentViewer = ({ session, user, userData, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!session?.id || !user?.uid) return;
    setDoc(doc(db, 'live_attendance', `${session.id}_${user.uid}`), {
      sessionId: session.id,
      userId: user.uid,
      userEmail: user?.email || '',
      studentName: userData?.name || user?.displayName || user?.email || 'طالب',
      grade: userData?.grade || '',
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(() => {});
  }, [session?.id, user?.uid]);

  useEffect(() => {
    if (!session?.id) return;
    const unsub = onSnapshot(collection(db, 'live_sessions', session.id, 'chat'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
      setMessages(rows.slice(-80));
    }, () => setMessages([]));
    return () => unsub();
  }, [session?.id]);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    await addDoc(collection(db, 'live_sessions', session.id, 'chat'), {
      userId: user.uid,
      studentName: userData?.name || user?.displayName || user?.email || 'طالب',
      message: msg.trim(),
      createdAt: serverTimestamp()
    });
    setMsg('');
  };

  const embedUrl = session?.streamUrl || session?.url || '';
  const isYouTube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');
  const normalizedUrl = isYouTube ? embedUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') : embedUrl;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 p-3 md:p-6 overflow-y-auto" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between text-white mb-4">
          <div>
            <h2 className="font-black text-2xl">{session?.title}</h2>
            <p className="text-sm text-slate-300">{getGradeLabel(session?.grade)} • {session?.branch || 'محاضرة مباشرة'}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 rounded-full p-3"><X/></button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              <iframe title={session?.title || 'live'} src={normalizedUrl} allow="camera; microphone; fullscreen; display-capture; autoplay" allowFullScreen className="w-full h-[62vh] min-h-[360px]" />
            </div>
            <LiveAICoachPanel session={session} user={user} userData={userData} />
          </div>

          <div className="bg-white rounded-2xl p-4 h-fit max-h-[82vh] flex flex-col">
            <h3 className="font-black text-slate-800 mb-3">شات المحاضرة</h3>
            <div className="flex-1 overflow-y-auto space-y-2 bg-slate-50 rounded-xl p-3 min-h-[320px]">
              {messages.map(m => (
                <div key={m.id} className="bg-white border rounded-xl p-2">
                  <p className="text-xs font-black text-sky-700">{m.studentName || 'طالب'}</p>
                  <p className="text-sm font-bold text-slate-700">{m.message}</p>
                </div>
              ))}
              {!messages.length && <p className="text-center text-slate-400 font-bold mt-10">لا توجد رسائل بعد.</p>}
            </div>
            <div className="flex gap-2 mt-3">
              <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{ if(e.key === 'Enter') sendMsg(); }} className="flex-1 border rounded-xl p-3" placeholder="اكتب رسالة..." />
              <button onClick={sendMsg} className="bg-sky-600 text-white px-4 rounded-xl font-black">إرسال</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveSessionsStudentPanel = ({ user, userData }) => {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'live_sessions'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const grade = userData?.grade || '';
      const filtered = rows.filter(s => s.isLive !== false && (!s.grade || !grade || s.grade === grade || s.grade === 'all'));
      filtered.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setSessions(filtered);
    }, () => setSessions([]));
    return () => unsub();
  }, [userData?.grade]);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-sky-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Radio className="text-sky-600"/> محاضرات أونلاين Live</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sessions.map(s => (
          <div key={s.id} className="bg-white border rounded-2xl p-4">
            <div className="flex justify-between gap-3 mb-2">
              <h3 className="font-black text-slate-800">{s.title}</h3>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-black">LIVE</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">{getGradeLabel(s.grade)} • {s.branch || 'عام'}</p>
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{s.description || s.notes || 'محاضرة مباشرة'}</p>
            <button onClick={() => setSelected(s)} className="bg-sky-600 text-white w-full py-3 rounded-xl font-black">دخول المحاضرة</button>
          </div>
        ))}
        {!sessions.length && <p className="text-center text-slate-400 font-bold py-10 md:col-span-2">لا توجد محاضرات مباشرة الآن.</p>}
      </div>
      {selected && <LiveSessionStudentViewer session={selected} user={user} userData={userData} onClose={() => setSelected(null)} />}
    </div>
  );
};

const AIUsageBadge = ({ user }) => {
  return (
    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-xl text-xs font-black">
      <Sparkles size={14}/> استخدام AI: غير محدود
    </div>
  );
};

const AIExamHistoryPanel = ({ user, userData }) => {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!user?.uid) return;
    const qRef = query(collection(db, 'ai_exam_results'), where('userId', '==', user.uid));
    const unsub = onSnapshot(qRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRows(list);
    }, () => setRows([]));
    return () => unsub();
  }, [user?.uid]);

  if (!rows.length) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-fuchsia-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><History className="text-fuchsia-600"/> سجل امتحانات AI</h2>
      <div className="space-y-3">
        {rows.slice(0, 8).map(r => (
          <div key={r.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-800">{r.title || 'امتحان AI'}</h3>
              <p className="text-xs text-slate-500">{r.topic || r.branch || 'عام'} • {getGradeLabel(r.grade || userData?.grade)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-bold">النتيجة</p>
              <p className="text-2xl font-black text-fuchsia-700">{safeNumber(r.score, 0)}/{safeNumber(r.total, 0)} - {safeNumber(r.percentage, 0)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminAIUsageAnalytics = ({ users = [] }) => {
  const [results, setResults] = useState([]);
  const [usage, setUsage] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ai_exam_results'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setResults(rows);
    }, () => setResults([]));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ai_usage'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
      setUsage(rows);
    }, () => setUsage([]));
    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    const totalAttempts = results.length;
    const avg = totalAttempts ? Math.round(results.reduce((s,r)=>s+safeNumber(r.percentage,0),0) / totalAttempts) : 0;
    const branchMap = {};
    results.forEach(r => {
      const key = r.branch || r.topic || 'عام';
      branchMap[key] = (branchMap[key] || 0) + 1;
    });
    const branches = Object.entries(branchMap).sort((a,b)=>b[1]-a[1]).slice(0, 8);
    const todayUsage = usage.filter(u => String(u.dateKey || '').includes(getTodayKey())).reduce((s,u)=>s+safeNumber(u.count,0),0);
    return { totalAttempts, avg, branches, todayUsage };
  }, [results, usage]);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-fuchsia-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><BarChart3 className="text-fuchsia-600"/> تحليلات AI للأدمن</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-2xl p-4"><p className="text-xs font-bold text-fuchsia-600">امتحانات AI</p><p className="text-3xl font-black text-fuchsia-800">{stats.totalAttempts}</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs font-bold text-blue-600">متوسط النتائج</p><p className="text-3xl font-black text-blue-800">{stats.avg}%</p></div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs font-bold text-amber-600">استخدام اليوم</p><p className="text-3xl font-black text-amber-800">{stats.todayUsage}</p></div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs font-bold text-emerald-600">أكثر فرع مطلوب</p><p className="text-lg font-black text-emerald-800">{stats.branches[0]?.[0] || 'لا يوجد'}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black text-slate-800 mb-3">أكثر الفروع طلبًا في AI</h3>
          <div className="space-y-2">
            {stats.branches.map(([branch, count]) => (
              <div key={branch} className="flex justify-between bg-slate-50 rounded-xl p-3 font-bold"><span>{branch}</span><span className="text-fuchsia-700">{count}</span></div>
            ))}
            {!stats.branches.length && <p className="text-center text-slate-400 py-5 font-bold">لا توجد بيانات بعد.</p>}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <h3 className="font-black text-slate-800 mb-3">آخر امتحانات AI</h3>
          <div className="space-y-2 max-h-[360px] overflow-auto">
            {results.slice(0, 10).map(r => (
              <div key={r.id} className="bg-slate-50 rounded-xl p-3">
                <p className="font-black text-slate-800">{r.studentName || 'طالب'} - {r.title || 'امتحان AI'}</p>
                <p className="text-xs text-slate-500">{r.topic || r.branch || 'عام'} • {safeNumber(r.percentage,0)}%</p>
              </div>
            ))}
            {!results.length && <p className="text-center text-slate-400 py-5 font-bold">لا توجد محاولات بعد.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};


const AIInteractiveExamModal = ({ user, userData, onClose }) => {
  const [topic, setTopic] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const generateExam = async () => {
    if (!topic.trim() && !branch.trim()) return alert('اكتب أي درس عايز تمتحن فيه، مثل: اسم الفاعل، اسم التفضيل، التشبيه، القراءة المتحررة...');
    setLoading(true);
    setFinished(false);
    setAnswers({});
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'generate_exam',
          language: 'ar-EG',
          lesson: topic.trim() || branch.trim(),
          topic: topic.trim() || branch.trim(),
          grade: userData?.grade || '1prep',
          branches: branch.trim() || topic.trim(),
          mcqCount: 18,
          essayCount: 0,
          duration: 25,
          difficultyMix: ['easy', 'medium', 'hard', 'very_hard'],
          instructions: 'استخدم Gemini فقط. أنشئ أسئلة حقيقية عن الدرس الذي كتبه الطالب تحديدًا، ولا تستخدم fallback أو أسئلة عامة.'
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر توليد الامتحان الآن.');

      const generatedExam = data.analysis?.exam || data.data?.exam || data.analysis || data.data || {};
      const rawQuestions = Array.isArray(generatedExam?.questions)
        ? generatedExam.questions
        : Array.isArray(data.analysis?.questions)
          ? data.analysis.questions
          : Array.isArray(data.data?.questions)
            ? data.data.questions
            : [];

      // إصلاح جذري:
      // الـ AI ممكن يرجع الأسئلة بطريقتين:
      // 1) blocks فيها subQuestions
      // 2) questions مباشرة كقائمة أسئلة
      // الكود القديم كان يتعامل مع الطريقة الأولى فقط، فكان يعرض 0 سؤال رغم إن الـ API رجع أسئلة.
      let flat = rawQuestions.flatMap((item, bi) => {
        if (Array.isArray(item?.subQuestions)) {
          return item.subQuestions.map((q, qi) => ({
            ...q,
            id: q.id || `ai_${bi}_${qi}_${Date.now()}`,
            blockText: item.text || '',
            branch: q.branch || branch || item.branch || 'عام',
            type: q.type || 'mcq',
            options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
            correctIdx: safeNumber(q.correctIdx, 0),
            difficulty: q.difficulty || ['سهل','متوسط','صعب','صعب جدًا'][qi % 4],
            explanation: q.explanation || 'راجع فكرة السؤال جيدًا.'
          }));
        }

        return [{
          ...item,
          id: item.id || `ai_${bi}_${Date.now()}`,
          blockText: item.blockText || '',
          branch: item.branch || branch || 'عام',
          type: item.type || 'mcq',
          options: Array.isArray(item.options) ? item.options.slice(0, 4) : [],
          correctIdx: safeNumber(item.correctIdx, 0),
          difficulty: item.difficulty || ['سهل','متوسط','صعب','صعب جدًا'][bi % 4],
          explanation: item.explanation || 'راجع فكرة السؤال جيدًا.'
        }];
      }).filter(q => {
        const questionText = String(q?.text || '').trim();
        const options = Array.isArray(q?.options) ? q.options.map(o => String(o || '').trim()) : [];
        const badOption = options.some(o => /^اختيار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(o) || /^اختبار\s*(أ|ب|ج|د|1|2|3|4)?$/i.test(o));
        const uniqueOptions = new Set(options.filter(Boolean)).size;
        const isPlaceholderQuestion = /^سؤال\s+تدريبي\s+\d+/i.test(questionText);
        return questionText && options.length >= 4 && uniqueOptions >= 4 && !badOption && !isPlaceholderQuestion;
      });

      if (flat.length === 0) {
        throw new Error('AI رجّع الامتحان بدون أسئلة صالحة. جرّب فرع أو موضوع أوضح.');
      }

      setExam({
        id: `ai_exam_${Date.now()}`,
        title: generatedExam?.title || `امتحان AI - ${topic || branch}`,
        topic: topic || branch,
        branch: branch || topic,
        grade: userData?.grade || '',
        questions: flat.slice(0, 20)
      });
    } catch (error) {
      console.error('AI interactive exam error:', error);
      alert(error.message || 'تعذر توليد الامتحان.');
    } finally {
      setLoading(false);
    }
  };

  const chooseAnswer = (q, idx) => {
    if (finished) return;
    setAnswers(prev => ({ ...prev, [q.id]: idx }));
  };

  const score = useMemo(() => {
    if (!exam?.questions?.length) return { correct: 0, total: 0, pct: 0 };
    const correct = exam.questions.reduce((sum, q) => sum + (answers[q.id] === q.correctIdx ? 1 : 0), 0);
    const total = exam.questions.length;
    return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
  }, [exam, answers]);

  return (
    <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[94vh] overflow-y-auto border-t-8 border-fuchsia-600">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="font-black text-xl md:text-2xl flex items-center gap-2"><Sparkles className="text-fuchsia-400"/> امتحان AI تفاعلي</h2>
            <p className="text-xs text-slate-300 mt-1">امتحان مخصص حسب مرحلتك: {getGradeLabel(userData?.grade)}</p>
            <div className="mt-2"><AIUsageBadge user={user} /></div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 rounded-full p-2"><X size={22}/></button>
        </div>

        <div className="p-4 md:p-6">
          {!exam && (
            <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-3xl p-5 mb-5">
              <h3 className="font-black text-slate-800 mb-3">اكتب عايز تمتحن في إيه</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="border rounded-xl p-3 md:col-span-2" placeholder="مثال: النحو - البلاغة - القراءة - الاستعارة..." value={topic} onChange={e=>setTopic(e.target.value)} />
                <input className="border rounded-xl p-3" placeholder="فرع معين اختياري" value={branch} onChange={e=>setBranch(e.target.value)} />
              </div>
              <div className="mt-3"><AIQuickHealthCheck /></div>
              <button disabled={loading} onClick={generateExam} className="mt-4 bg-fuchsia-600 text-white px-6 py-3 rounded-xl font-black hover:bg-fuchsia-700 disabled:opacity-50">
                {loading ? 'AI بيجهز الامتحان...' : 'توليد امتحان 15 - 20 سؤال'}
              </button>
            </div>
          )}

          {exam && (
            <div>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-5 bg-slate-50 border rounded-2xl p-4">
                <div>
                  <h3 className="font-black text-slate-800 text-xl">{exam.title}</h3>
                  <p className="text-sm text-slate-500">{exam.questions.length} سؤال • مستويات متعددة</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setExam(null); setAnswers({}); setFinished(false); }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold">امتحان جديد</button>
                  <button onClick={async () => {
                    setFinished(true);
                    try {
                      if (exam?.questions?.length) {
                        await addDoc(collection(db, 'ai_exam_results'), {
                          userId: user.uid,
                          studentName: userData?.name || user?.displayName || user?.email || 'طالب',
                          grade: userData?.grade || '',
                          title: exam.title,
                          topic: exam.topic || '',
                          branch: exam.branch || '',
                          score: score.correct,
                          total: score.total,
                          percentage: score.pct,
                          answers,
                          createdAt: serverTimestamp()
                        });
                      }
                    } catch (e) {
                      console.warn('save ai exam result failed:', e?.message);
                    }
                  }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black">إنهاء وحفظ النتيجة</button>
                </div>
              </div>

              {finished && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5 text-center">
                  <p className="text-sm font-bold text-emerald-700">نتيجتك</p>
                  <p className="text-4xl font-black text-emerald-800">{score.correct}/{score.total} - {score.pct}%</p>
                </div>
              )}

              <div className="space-y-4">
                {exam.questions.map((q, i) => {
                  const chosen = answers[q.id];
                  const answered = chosen !== undefined;
                  const isCorrect = answered && chosen === q.correctIdx;
                  return (
                    <div key={q.id} className="border rounded-2xl p-4 bg-white">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-bold">سؤال {i+1}</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{q.branch}</span>
                        <span className="bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-full text-xs font-bold">{q.difficulty}</span>
                      </div>
                      {q.blockText && <div className="bg-slate-50 border rounded-xl p-3 mb-3 font-bold leading-loose">{renderBracketHighlightedText(q.blockText)}</div>}
                      <h4 className="font-black text-slate-900 text-lg mb-3 leading-relaxed">{renderBracketHighlightedText(q.text)}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, idx) => {
                          const selected = chosen === idx;
                          const correct = q.correctIdx === idx;
                          const show = answered || finished;
                          return (
                            <button key={idx} onClick={() => chooseAnswer(q, idx)} className={`text-right border rounded-xl p-3 font-bold transition ${
                              show && correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                              show && selected && !correct ? 'bg-red-50 border-red-300 text-red-800' :
                              selected ? 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800' : 'bg-white hover:bg-slate-50'
                            }`}>
                              {idx+1}. {opt}
                            </button>
                          );
                        })}
                      </div>
                      {answered && (
                        <div className={`mt-3 rounded-xl p-3 text-sm font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                          {isCorrect ? 'إجابة صحيحة ✅' : `إجابة غير صحيحة ❌ — التصويب: ${q.options[q.correctIdx]}`}
                          <p className="mt-2 text-slate-700">شرح الفكرة: {q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentRequestStudentPanel = ({ user, userData }) => {
  const [method, setMethod] = useState('vodafone_cash');
  const [plan, setPlan] = useState('monthly');
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [note, setNote] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const planDays = plan === 'monthly' ? 30 : plan === 'quarter' ? 90 : plan === 'yearly' ? 365 : 30;

  useEffect(() => {
    if (!user?.uid) return;
    const qRef = query(collection(db, 'payment_requests'), where('userId', '==', user.uid));
    const unsub = onSnapshot(qRef, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(rows);
    }, (error) => {
      console.warn('payment requests listener blocked:', error?.message);
      setRequests([]);
    });
    return () => unsub();
  }, [user?.uid]);

  const submitRequest = async () => {
    if (!transactionRef.trim()) return alert('اكتب رقم العملية أو آخر 4 أرقام.');
    if (!amount || safeNumber(amount, 0) <= 0) return alert('اكتب المبلغ المدفوع.');

    setLoading(true);
    try {
      await addDoc(collection(db, 'payment_requests'), {
        userId: user.uid,
        studentName: userData?.name || user?.displayName || user?.email || 'طالب',
        studentEmail: user?.email || '',
        grade: userData?.grade || '',
        method,
        plan,
        durationDays: planDays,
        amount: safeNumber(amount, 0),
        transactionRef: transactionRef.trim(),
        note: note.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: ''
      });
      setAmount('');
      setTransactionRef('');
      setNote('');
      alert('تم إرسال طلب التفعيل للإدارة. سيتم المراجعة قريبًا.');
    } catch (error) {
      console.error('payment request error:', error);
      alert('تعذر إرسال طلب الدفع. راجع الاتصال أو الصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><CreditCard className="text-emerald-600"/> طلب تفعيل اشتراك</h2>

      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4 text-sm text-emerald-800 font-bold leading-relaxed">
        بعد الدفع خارج المنصة، اكتب رقم العملية هنا وسيتم تفعيل اشتراكك بعد مراجعة الإدارة.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <select className="border rounded-xl p-3" value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="vodafone_cash">Vodafone Cash</option>
          <option value="instapay">InstaPay</option>
          <option value="bank_transfer">تحويل بنكي</option>
          <option value="manual">دفع يدوي</option>
        </select>

        <select className="border rounded-xl p-3" value={plan} onChange={e=>setPlan(e.target.value)}>
          <option value="monthly">شهري - 30 يوم</option>
          <option value="quarter">3 شهور - 90 يوم</option>
          <option value="yearly">سنوي - 365 يوم</option>
        </select>

        <input className="border rounded-xl p-3" type="number" placeholder="المبلغ المدفوع" value={amount} onChange={e=>setAmount(e.target.value)} />
        <input className="border rounded-xl p-3" placeholder="رقم العملية / آخر 4 أرقام" value={transactionRef} onChange={e=>setTransactionRef(e.target.value)} />
      </div>

      <textarea className="w-full border rounded-xl p-3 mb-3" placeholder="ملاحظة اختيارية للإدارة..." value={note} onChange={e=>setNote(e.target.value)} />

      <button disabled={loading} onClick={submitRequest} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50">
        {loading ? 'جاري الإرسال...' : 'إرسال طلب التفعيل'}
      </button>

      {requests.length > 0 && (
        <div className="mt-5">
          <h3 className="font-black text-slate-800 mb-2">طلباتي السابقة</h3>
          <div className="space-y-2">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="bg-white border rounded-xl p-3 flex justify-between items-center gap-3">
                <div>
                  <p className="font-bold text-slate-800">{req.method} - {req.amount} جنيه</p>
                  <p className="text-xs text-slate-500">رقم العملية: {req.transactionRef}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-black ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {req.status === 'approved' ? 'تم التفعيل' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminPaymentRequestsPanel = ({ users = [] }) => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'payment_requests'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(rows);
    }, (error) => {
      console.warn('payment requests admin listener blocked:', error?.message);
      setRequests([]);
    });
    return () => unsub();
  }, []);

  const approveRequest = async (req) => {
    if (!window.confirm(`تفعيل اشتراك ${req.studentName} لمدة ${req.durationDays || 30} يوم؟`)) return;

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + safeNumber(req.durationDays, 30));

      const batch = writeBatch(db);
      batch.update(doc(db, 'payment_requests', req.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        approvedAt: serverTimestamp()
      });
      batch.set(doc(db, 'users', req.userId), {
        subscription: {
          active: true,
          plan: req.plan || 'manual',
          source: 'payment_request',
          expiresAt,
          activatedAt: serverTimestamp(),
          lastPaymentRequestId: req.id
        },
        isVIP: true,
        vipUntil: expiresAt,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await batch.commit();
      alert('تم تفعيل الاشتراك بنجاح.');
    } catch (error) {
      console.error('approve payment request error:', error);
      alert('تعذر تفعيل الاشتراك. راجع الصلاحيات.');
    }
  };

  const rejectRequest = async (req) => {
    const reason = window.prompt('سبب الرفض؟', 'بيانات الدفع غير واضحة');
    if (reason === null) return;
    await updateDoc(doc(db, 'payment_requests', req.id), {
      status: 'rejected',
      rejectReason: reason,
      reviewedAt: serverTimestamp()
    });
  };

  const filtered = requests.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><WalletCards className="text-emerald-600"/> طلبات الدفع والتفعيل</h2>
          <p className="text-sm text-slate-500">مراجعة مدفوعات الطلاب وتفعيل الاشتراك مباشرة.</p>
        </div>
        <select className="border rounded-xl p-3" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">مفعلة</option>
          <option value="rejected">مرفوضة</option>
          <option value="all">الكل</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs font-bold text-amber-600">قيد المراجعة</p><p className="text-3xl font-black text-amber-700">{requests.filter(r=>r.status==='pending').length}</p></div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs font-bold text-emerald-600">مفعلة</p><p className="text-3xl font-black text-emerald-700">{requests.filter(r=>r.status==='approved').length}</p></div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs font-bold text-red-600">مرفوضة</p><p className="text-3xl font-black text-red-700">{requests.filter(r=>r.status==='rejected').length}</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs font-bold text-blue-600">إجمالي مبالغ مفعلة</p><p className="text-3xl font-black text-blue-700">{requests.filter(r=>r.status==='approved').reduce((s,r)=>s+safeNumber(r.amount,0),0)}</p></div>
      </div>

      <div className="space-y-3">
        {filtered.map(req => (
          <div key={req.id} className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-800">{req.studentName}</h3>
                <p className="text-xs text-slate-500">{req.studentEmail} • {getGradeLabel(req.grade)}</p>
                <p className="text-sm text-slate-700 mt-2"><b>الطريقة:</b> {req.method} | <b>المبلغ:</b> {req.amount} | <b>العملية:</b> {req.transactionRef}</p>
                {req.note && <p className="text-sm text-slate-500 mt-1">ملاحظة: {req.note}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {req.status === 'pending' && (
                  <>
                    <button onClick={() => approveRequest(req)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold">تفعيل</button>
                    <button onClick={() => rejectRequest(req)} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold">رفض</button>
                  </>
                )}
                <span className={`px-3 py-2 rounded-xl text-xs font-black ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {req.status === 'approved' ? 'مفعل' : req.status === 'rejected' ? 'مرفوض' : 'انتظار'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">لا توجد طلبات في هذا القسم.</p>}
      </div>
    </div>
  );
};

const AdvancedAntiCheatInsights = ({ examResults = [] }) => {
  const risky = useMemo(() => {
    return (examResults || [])
      .map(r => {
        const warnings = safeNumber(r.antiCheatWarnings, 0);
        const logCount = Array.isArray(r.antiCheatLog) ? r.antiCheatLog.length : 0;
        const risk = warnings * 25 + logCount * 10 + (r.status === 'security_hold' ? 40 : 0) + (r.status === 'cheated' ? 70 : 0);
        return { ...r, risk: Math.min(100, risk) };
      })
      .filter(r => r.risk > 0)
      .sort((a,b)=>b.risk-a.risk)
      .slice(0, 30);
  }, [examResults]);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-red-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><ShieldAlert className="text-red-600"/> Anti-cheat Risk Center</h2>
      <div className="space-y-3">
        {risky.map(r => (
          <div key={r.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-800">{r.studentName || 'طالب'}</h3>
              <p className="text-xs text-slate-500">{r.examTitle || 'امتحان'} • تحذيرات: {safeNumber(r.antiCheatWarnings,0)}</p>
            </div>
            <div className="min-w-[180px]">
              <div className="flex justify-between text-xs font-bold mb-1"><span>Risk</span><span>{r.risk}%</span></div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`${r.risk >= 70 ? 'bg-red-600' : r.risk >= 40 ? 'bg-amber-500' : 'bg-emerald-500'} h-full`} style={{width:`${r.risk}%`}}></div>
              </div>
            </div>
          </div>
        ))}
        {risky.length === 0 && <p className="text-center text-slate-400 py-10 font-bold">لا توجد مخاطر غش مسجلة.</p>}
      </div>
    </div>
  );
};

const AppConversionGuidePanel = () => (
  <div className="glass-panel rounded-2xl p-5 border-t-4 border-sky-600">
    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Smartphone className="text-sky-600"/> تجهيز APK و iOS</h2>
    <div className="space-y-3 text-sm font-bold text-slate-700 leading-relaxed">
      <p>هذه الخطوة لا تغير المنصة، لكنها تجهزها للتحويل لتطبيق Android و iOS باستخدام Capacitor.</p>
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-left overflow-auto" dir="ltr">
        npm install @capacitor/core @capacitor/cli<br/>
        npx cap init NahhasPlatform com.nahhas.platform --web-dir=dist<br/>
        npm run build<br/>
        npx cap add android<br/>
        npx cap copy<br/>
        npx cap open android
      </div>
      <p>لـ iOS ستحتاج جهاز Mac ثم:</p>
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-left overflow-auto" dir="ltr">
        npx cap add ios<br/>
        npx cap copy<br/>
        npx cap open ios
      </div>
    </div>
  </div>
);


const AIQuestionGeneratorPanel = ({ userData = null, onAddQuestions = null }) => {
  const [topic, setTopic] = useState('');
  const [branch, setBranch] = useState('نحو');
  const [grade, setGrade] = useState(userData?.grade || '3sec');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState([]);

  const generateQuestions = async () => {
    if (!topic.trim()) return alert('اكتب موضوع أو درس الأسئلة.');
    setLoading(true);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'generate_questions',
          language: 'ar-EG',
          topic,
          branch,
          grade,
          count: safeNumber(count, 5),
          difficulty
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر توليد الأسئلة.');
      const questions = Array.isArray(data.analysis?.questions)
        ? data.analysis.questions
        : Array.isArray(data.data?.questions)
          ? data.data.questions
          : Array.isArray(data.analysis?.exam?.questions)
            ? data.analysis.exam.questions
            : Array.isArray(data.data?.exam?.questions)
              ? data.data.exam.questions
              : [];
      setGenerated(questions.map((q, idx) => ({
        id: `ai_${Date.now()}_${idx}`,
        text: q.text || '',
        type: q.type || 'mcq',
        branch: q.branch || branch,
        options: q.options || ['أ', 'ب', 'ج', 'د'],
        correctIdx: safeNumber(q.correctIdx, 0),
        explanation: q.explanation || '',
        maxScore: safeNumber(q.maxScore, 1),
        tags: q.tags || []
      })));
    } catch (error) {
      console.error('AI generate questions error:', error);
      alert(error.message || 'تعذر توليد الأسئلة.');
    } finally {
      setLoading(false);
    }
  };

  const copyJSON = async () => {
    await navigator.clipboard?.writeText(JSON.stringify(generated, null, 2));
    alert('تم نسخ الأسئلة بصيغة JSON.');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-cyan-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Wand2 className="text-cyan-600"/> AI مولد الأسئلة</h2>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <input className="border rounded-xl p-3 md:col-span-2" placeholder="اكتب الدرس أو الموضوع..." value={topic} onChange={e=>setTopic(e.target.value)} />
        <input className="border rounded-xl p-3" placeholder="الفرع" value={branch} onChange={e=>setBranch(e.target.value)} />
        <select className="border rounded-xl p-3" value={grade} onChange={e=>setGrade(e.target.value)}><GradeOptions/></select>
        <select className="border rounded-xl p-3" value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
          <option value="easy">سهل</option>
          <option value="medium">متوسط</option>
          <option value="hard">صعب</option>
        </select>
        <input type="number" min="1" max="20" className="border rounded-xl p-3" value={count} onChange={e=>setCount(e.target.value)} />
      </div>
      <button disabled={loading} onClick={generateQuestions} className="bg-cyan-600 text-white px-6 py-3 rounded-xl font-black hover:bg-cyan-700 disabled:opacity-50">
        {loading ? 'جاري التوليد...' : 'توليد الأسئلة'}
      </button>

      {generated.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={copyJSON} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">نسخ JSON</button>
            {onAddQuestions && <button onClick={() => onAddQuestions(generated)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold">إضافة للامتحان الحالي</button>}
          </div>
          {generated.map((q, idx) => (
            <div key={q.id} className="bg-white border rounded-2xl p-4">
              <div className="flex gap-2 mb-2">
                <span className="bg-cyan-100 text-cyan-700 text-xs px-2 py-1 rounded-full font-bold">سؤال {idx+1}</span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">{q.branch}</span>
              </div>
              <p className="font-black text-slate-800 mb-3">{q.text}</p>
              {q.type !== 'essay' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`border rounded-xl p-2 text-sm font-bold ${i === q.correctIdx ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50'}`}>
                      {i+1}. {opt}
                    </div>
                  ))}
                </div>
              )}
              {q.explanation && <p className="text-xs text-slate-500 mt-3">الشرح: {q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AIEssayCorrectorBox = ({ exam, question, answer, studentName = '' }) => {
  const [loading, setLoading] = useState(false);
  const [correction, setCorrection] = useState(null);

  const runCorrection = async () => {
    const answerText = typeof answer === 'object' ? answer?.text : answer;
    if (!answerText || !String(answerText).trim()) return alert('لا توجد إجابة نصية لتصحيحها.');
    setLoading(true);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'essay_correct',
          language: 'ar-EG',
          examTitle: exam?.title || '',
          studentName,
          question: {
            text: question?.text || '',
            branch: question?.branch || '',
            modelAnswer: question?.modelAnswer || question?.answer || question?.explanation || '',
            maxScore: getQuestionMaxScore(question)
          },
          studentAnswer: answerText
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر تصحيح المقالي.');
      setCorrection(data.analysis || data.data || null);
    } catch (error) {
      console.error('AI essay correction error:', error);
      alert(error.message || 'تعذر تصحيح المقالي.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-purple-800 flex items-center gap-2"><PenTool size={18}/> تصحيح AI للمقالي</h4>
          <p className="text-xs text-purple-600">اقتراح درجة وملاحظات، والقرار النهائي يظل للأدمن.</p>
        </div>
        <button disabled={loading} onClick={runCorrection} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50">
          {loading ? 'جاري التصحيح...' : 'تصحيح AI'}
        </button>
      </div>

      {correction && (
        <div className="mt-3 bg-white border rounded-xl p-3 space-y-2">
          <p className="font-black text-slate-800">الدرجة المقترحة: <span className="text-purple-700">{correction.suggestedScore ?? '-'}</span> / {getQuestionMaxScore(question)}</p>
          {correction.feedback && <p className="text-sm text-slate-700"><b>ملاحظات:</b> {correction.feedback}</p>}
          {Array.isArray(correction.strengths) && correction.strengths.length > 0 && <p className="text-sm text-emerald-700"><b>نقاط قوة:</b> {correction.strengths.join('، ')}</p>}
          {Array.isArray(correction.improvements) && correction.improvements.length > 0 && <p className="text-sm text-amber-700"><b>يحتاج تحسين:</b> {correction.improvements.join('، ')}</p>}
        </div>
      )}
    </div>
  );
};

const AIExamBuilderPanel = ({ userData = null }) => {
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState(userData?.grade || '3sec');
  const [branches, setBranches] = useState('نحو، قراءة، بلاغة');
  const [mcqCount, setMcqCount] = useState(10);
  const [essayCount, setEssayCount] = useState(2);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [examDraft, setExamDraft] = useState(null);

  const buildExam = async () => {
    if (!topic.trim()) return alert('اكتب موضوع الامتحان.');
    setLoading(true);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'generate_exam',
          language: 'ar-EG',
          topic,
          grade,
          branches,
          mcqCount: safeNumber(mcqCount, 10),
          essayCount: safeNumber(essayCount, 2),
          duration: safeNumber(duration, 30)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر بناء الامتحان.');
      setExamDraft(data.analysis?.exam || data.analysis);
    } catch (error) {
      console.error('AI exam builder error:', error);
      alert(error.message || 'تعذر بناء الامتحان.');
    } finally {
      setLoading(false);
    }
  };

  const copyExamJSON = async () => {
    await navigator.clipboard?.writeText(JSON.stringify(examDraft, null, 2));
    alert('تم نسخ الامتحان.');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-rose-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><ClipboardList className="text-rose-600"/> AI بناء امتحان كامل</h2>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <input className="border rounded-xl p-3 md:col-span-2" placeholder="موضوع الامتحان..." value={topic} onChange={e=>setTopic(e.target.value)} />
        <select className="border rounded-xl p-3" value={grade} onChange={e=>setGrade(e.target.value)}><GradeOptions/></select>
        <input className="border rounded-xl p-3" placeholder="الفروع" value={branches} onChange={e=>setBranches(e.target.value)} />
        <input type="number" className="border rounded-xl p-3" placeholder="اختياري" value={mcqCount} onChange={e=>setMcqCount(e.target.value)} />
        <input type="number" className="border rounded-xl p-3" placeholder="مقالي" value={essayCount} onChange={e=>setEssayCount(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-3">
        <input type="number" className="border rounded-xl p-3 w-40" placeholder="المدة" value={duration} onChange={e=>setDuration(e.target.value)} />
        <button disabled={loading} onClick={buildExam} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-black hover:bg-rose-700 disabled:opacity-50">{loading ? 'جاري البناء...' : 'بناء الامتحان'}</button>
      </div>

      {examDraft && (
        <div className="mt-5 bg-white border rounded-2xl p-4">
          <div className="flex justify-between items-center gap-3 mb-3">
            <h3 className="font-black text-slate-800">{examDraft.title || 'امتحان AI'}</h3>
            <button onClick={copyExamJSON} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">نسخ JSON</button>
          </div>
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-auto max-h-[420px]" dir="ltr">{JSON.stringify(examDraft, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const AIStudentChatCoach = ({ user, userData, examResults = [] }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'أهلًا 👋 أنا المدرب الذكي. اسألني عن أي سؤال أو خطة مذاكرة أو سبب ضعفك في فرع معين.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const nextMessages = [...messages, { role: 'user', text: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({
          mode: 'student_chat',
          language: 'ar-EG',
          studentName: userData?.name || user?.displayName || '',
          grade: userData?.grade || '',
          question: input.trim(),
          chatHistory: nextMessages.slice(-8),
          recentResults: (examResults || []).slice(0, 5).map(r => ({
            examTitle: r.examTitle,
            percentage: getResultPercentage(r),
            branchAnalysis: r.branchAnalysis || r.branchStats || {}
          }))
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'تعذر رد AI.');
      const answer = data.analysis?.answer || data.analysis?.summary || data.analysis?.explanation || 'تم.';
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'تعذر تشغيل المدرب الذكي الآن. جرّب بعد قليل.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-sky-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Bot className="text-sky-600"/> شات المدرب الذكي</h2>
      <div className="bg-slate-50 border rounded-2xl p-4 max-h-[460px] overflow-y-auto space-y-3 mb-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm font-bold ${m.role === 'user' ? 'bg-white border text-slate-800' : 'bg-sky-600 text-white'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <p className="text-center text-slate-400 font-bold">AI يكتب الآن...</p>}
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <input className="flex-1 border rounded-xl p-3" placeholder="اسأل المدرب الذكي..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key === 'Enter') send(); }} />
        <button onClick={send} className="bg-sky-600 text-white px-6 py-3 rounded-xl font-black">إرسال</button>
      </div>
    </div>
  );
};


const RealAIBox = ({ title = 'AI الحقيقي', payload = {}, compact = false }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  const askAI = async () => {
    setLoadingAI(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'AI غير متصل حاليًا. تأكد من وجود فولدر api في جذر المشروع ومن مفاتيح OPENAI_API_KEY أو GEMINI_API_KEY في Vercel ثم اعمل Redeploy.');
      }

      setAiResult(data.analysis || data.data || null);
    } catch (error) {
      console.error('Real AI error:', error);
      setAiError(error.message || 'حدث خطأ أثناء تشغيل AI.');
      pushDebugLog('ai-error', error.message || 'AI Error', { stack: error.stack });
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className={`${compact ? 'bg-white border' : 'glass-panel border'} rounded-2xl p-4 md:p-5 border-fuchsia-200`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <Sparkles className="text-fuchsia-600"/> {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">شرح ذكي، سبب الخطأ، وخطة مذاكرة مخصصة من AI</p>
          <div className="mt-2"><AIQuickHealthCheck /></div>
        </div>
        <button
          onClick={askAI}
          disabled={loadingAI}
          className="bg-fuchsia-600 text-white px-5 py-3 rounded-xl font-black hover:bg-fuchsia-700 disabled:opacity-50"
        >
          {loadingAI ? 'جاري التحليل...' : 'تشغيل AI'}
        </button>
      </div>

      {aiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-bold mb-3">
          {aiError}
        </div>
      )}

      {aiResult && (
        <div className="space-y-3">
          {aiResult.summary && (
            <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-3">
              <p className="text-xs font-bold text-fuchsia-600 mb-1">ملخص ذكي</p>
              <p className="font-bold text-slate-800 leading-relaxed">{aiResult.summary}</p>
            </div>
          )}

          {aiResult.answer && (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
              <p className="text-xs font-bold text-sky-600 mb-1">إجابة AI</p>
              <p className="font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{aiResult.answer}</p>
            </div>
          )}

          {aiResult.explanation && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-600 mb-1">شرح السؤال / الفكرة</p>
              <p className="font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{aiResult.explanation}</p>
            </div>
          )}

          {aiResult.mistakeReason && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-600 mb-1">سبب الخطأ المحتمل</p>
              <p className="font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{aiResult.mistakeReason}</p>
            </div>
          )}

          {Array.isArray(aiResult.studyPlan) && aiResult.studyPlan.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-600 mb-2">خطة مذاكرة</p>
              <ol className="list-decimal list-inside space-y-1 text-sm font-bold text-slate-800">
                {aiResult.studyPlan.map((step, idx) => <li key={idx}>{step}</li>)}
              </ol>
            </div>
          )}

          {Array.isArray(aiResult.quickExercises) && aiResult.quickExercises.length > 0 && (
            <div className="bg-slate-50 border rounded-xl p-3">
              <p className="text-xs font-bold text-slate-600 mb-2">تدريبات سريعة مقترحة</p>
              <ul className="list-disc list-inside space-y-1 text-sm font-bold text-slate-700">
                {aiResult.quickExercises.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const buildQuestionAIPayload = ({ exam, question, answers, user, result = null }) => {
  const studentAnswer = answers?.[question?.id];
  const isEssay = question?.type === 'essay';
  const correctAnswer = !isEssay && Array.isArray(question?.options) ? question.options[question.correctIdx] : (question?.modelAnswer || question?.answer || '');
  const chosenAnswer = !isEssay && Array.isArray(question?.options) ? question.options[studentAnswer] : (typeof studentAnswer === 'object' ? studentAnswer?.text : studentAnswer);

  return {
    mode: 'question_explain',
    language: 'ar-EG',
    examTitle: exam?.title || '',
    studentName: user?.displayName || '',
    grade: exam?.grade || '',
    questionText: question?.text || '',
    branch: question?.branch || '',
    studentAnswer: chosenAnswer || 'لم يجب',
    correctAnswer: correctAnswer || '',
    isCorrect: !isEssay ? studentAnswer === question?.correctIdx : null,
    question: {
      text: question?.text || '',
      branch: question?.branch || '',
      type: question?.type || 'mcq',
      options: question?.options || [],
      correctAnswer,
      chosenAnswer,
      explanation: question?.explanation || '',
      blockText: question?.blockText || ''
    },
    resultSummary: result ? {
      score: result.score,
      total: result.total,
      percentage: getResultPercentage(result)
    } : null
  };
};

const buildExamAIPayload = ({ exam, answers, metrics, user }) => {
  const questions = extractAllQuestions(exam).slice(0, 80).map(q => {
    const ans = answers?.[q.id];
    return {
      text: q.text,
      branch: q.branch,
      type: q.type || 'mcq',
      options: q.options || [],
      correctAnswer: q.type !== 'essay' && Array.isArray(q.options) ? q.options[q.correctIdx] : (q.modelAnswer || ''),
      chosenAnswer: q.type !== 'essay' && Array.isArray(q.options) ? q.options[ans] : (typeof ans === 'object' ? ans?.text : ans),
      isCorrect: q.type !== 'essay' ? ans === q.correctIdx : null
    };
  });

  const wrongQuestions = questions.filter(q => q.isCorrect === false).slice(0, 25);
  const weakBranches = Object.entries(metrics?.branchStats || {})
    .map(([branch, data]) => ({
      branch,
      percentage: data?.possible > 0 ? Math.round((safeNumber(data?.earned, 0) / safeNumber(data?.possible, 1)) * 100) : 0,
      wrong: safeNumber(data?.wrong, 0),
      correct: safeNumber(data?.correct, 0)
    }))
    .sort((a, b) => a.percentage - b.percentage);

  return {
    mode: 'exam_review',
    language: 'ar-EG',
    examTitle: exam?.title || '',
    studentName: user?.displayName || '',
    grade: exam?.grade || '',
    question: `حلل نتيجة الطالب بعد امتحان ${exam?.title || ''}. ركز على الأسئلة الخطأ، سبب الخطأ، وخطة مذاكرة مخصصة.`,
    metrics: {
      percentage: metrics?.percentage,
      totalScore: metrics?.totalScore,
      totalPossible: metrics?.totalPossible,
      branchStats: metrics?.branchStats || {}
    },
    questions,
    wrongQuestions,
    weakBranches
  };
};


const AdvancedAIStudentCoach = ({ userResults = [], exams = [], content = [], userData = null }) => {
  userResults = Array.isArray(userResults) ? userResults : [];
  exams = Array.isArray(exams) ? exams : [];
  content = Array.isArray(content) ? content : [];

  const analysis = useMemo(() => {
    const completed = userResults
      .filter(r => r.status === 'completed')
      .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));

    const branchMap = {};
    const tagMap = {};
    const questionMistakes = [];
    const timeline = completed.slice(0, 8).reverse().map(r => ({
      title: r.examTitle || 'امتحان',
      pct: getResultPercentage(r)
    }));

    completed.forEach(result => {
      const exam = exams.find(e => e.id === result.examId);
      const questions = exam ? extractAllQuestions(exam) : [];

      const branchRows = Array.isArray(result.branchAnalysis)
        ? result.branchAnalysis
        : Object.entries(result.branchStats || {}).map(([branch, data]) => ({
            branch,
            percentage: data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 1)) * 100) : 0,
            wrong: safeNumber(data.wrong, 0),
            correct: safeNumber(data.correct, 0)
          }));

      branchRows.forEach(row => {
        const branch = row.branch || 'عام';
        branchMap[branch] = branchMap[branch] || { branch, totalPct: 0, count: 0, wrong: 0, correct: 0 };
        branchMap[branch].totalPct += safeNumber(row.percentage, 0);
        branchMap[branch].count += 1;
        branchMap[branch].wrong += safeNumber(row.wrong, 0);
        branchMap[branch].correct += safeNumber(row.correct, 0);
      });

      questions.forEach(q => {
        if (q.type === 'essay') return;
        const ans = result.answers?.[q.id];
        if (ans === undefined || ans === null || ans === '') return;
        if (ans !== q.correctIdx) {
          const tags = Array.isArray(q.tags) && q.tags.length
            ? q.tags
            : [q.skill, q.lesson, q.topic, q.branch].filter(Boolean);

          tags.forEach(tag => {
            const key = String(tag || '').trim();
            if (!key) return;
            tagMap[key] = tagMap[key] || { tag: key, wrong: 0, branch: q.branch || 'عام', examples: [] };
            tagMap[key].wrong += 1;
            if (tagMap[key].examples.length < 3) {
              tagMap[key].examples.push(q.text || 'سؤال');
            }
          });

          questionMistakes.push({
            examTitle: result.examTitle || exam?.title || 'امتحان',
            branch: q.branch || 'عام',
            text: q.text || '',
            correct: Array.isArray(q.options) ? q.options[q.correctIdx] : '',
            chosen: Array.isArray(q.options) ? q.options[ans] : '',
            tags
          });
        }
      });
    });

    const branches = Object.values(branchMap)
      .map(b => ({ ...b, avg: b.count ? Math.round(b.totalPct / b.count) : 0 }))
      .sort((a, b) => a.avg - b.avg);

    const tags = Object.values(tagMap).sort((a, b) => b.wrong - a.wrong);

    const latest = completed[0];
    const latestPct = latest ? getResultPercentage(latest) : 0;
    const previous = completed[1] ? getResultPercentage(completed[1]) : null;
    const trendDirection = previous === null ? 'unknown' : latestPct > previous ? 'up' : latestPct < previous ? 'down' : 'same';

    const recommendations = [];

    branches.slice(0, 3).forEach(b => {
      const relatedVideo = content.find(c =>
        (c.type === 'video' || c.videoSection) &&
        ((c.branch || '').includes(b.branch) || (c.title || '').includes(b.branch))
      );

      const relatedExam = exams.find(e =>
        e.grade === userData?.grade &&
        ((e.title || '').includes(b.branch))
      );

      recommendations.push({
        level: b.avg < 50 ? 'عاجل' : b.avg < 70 ? 'مهم' : 'متابعة',
        title: `خطة علاج فرع ${b.branch}`,
        reason: `متوسطك في هذا الفرع ${b.avg}% مع ${b.wrong} أخطاء تقريبًا.`,
        steps: [
          'راجع القاعدة الأساسية للفرع لمدة 15 دقيقة.',
          relatedVideo ? `شاهد فيديو: ${relatedVideo.title}` : 'شاهد شرحًا قصيرًا لهذا الفرع.',
          relatedExam ? `حل امتحان تدريبي: ${relatedExam.title}` : 'حل 10 أسئلة تدريبية على نفس الفرع.',
          'راجع الأخطاء فقط بعد الحل ولا تعيد الامتحان كاملًا.'
        ]
      });
    });

    tags.slice(0, 3).forEach(t => {
      recommendations.push({
        level: t.wrong >= 3 ? 'دقيق' : 'ملاحظة',
        title: `أنت تحتاج تركيزًا في: ${t.tag}`,
        reason: `تكرر الخطأ في هذا الجزء ${t.wrong} مرة.`,
        steps: [
          `راجع أمثلة على ${t.tag}.`,
          'اكتب سبب الخطأ في ورقة صغيرة.',
          'حل 5 أسئلة قصيرة على نفس النقطة.'
        ]
      });
    });

    if (!recommendations.length) {
      recommendations.push({
        level: 'ابدأ',
        title: 'ابدأ بتكوين بيانات أداء',
        reason: 'لم يتم العثور على نتائج كافية لتحليل دقيق.',
        steps: ['حل امتحان قصير.', 'راجع النتيجة.', 'سيتم بناء خطة ذكية بعد ظهور نتائجك.']
      });
    }

    return {
      completed,
      latestPct,
      previous,
      trendDirection,
      branches,
      tags,
      questionMistakes: questionMistakes.slice(0, 8),
      timeline,
      recommendations: recommendations.slice(0, 8)
    };
  }, [userResults, exams, content, userData]);

  const trendText = analysis.trendDirection === 'up'
    ? 'مستواك يتحسن'
    : analysis.trendDirection === 'down'
      ? 'فيه انخفاض بسيط محتاج متابعة'
      : analysis.trendDirection === 'same'
        ? 'مستواك ثابت'
        : 'ابدأ بحل امتحان لتكوين تحليل';

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-fuchsia-600">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="text-fuchsia-600"/> المدرب الذكي AI
          </h2>
          <p className="text-sm text-slate-500 mt-1">تحليل ذكي لأخطاء الطالب حسب الفروع والنقاط المتكررة بدون تكلفة إضافية.</p>
        </div>
        <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-2xl px-4 py-3">
          <p className="text-xs font-bold text-fuchsia-600">حالة الطالب</p>
          <p className="font-black text-fuchsia-800">{trendText}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">آخر نتيجة</p>
          <p className="text-3xl font-black text-fuchsia-700">{analysis.latestPct || 0}%</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">عدد الامتحانات</p>
          <p className="text-3xl font-black text-blue-700">{analysis.completed.length}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">أضعف فرع</p>
          <p className="text-lg font-black text-red-700">{analysis.branches[0]?.branch || 'لا يوجد'}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">أكثر نقطة تكرارًا</p>
          <p className="text-lg font-black text-amber-700">{analysis.tags[0]?.tag || 'لا يوجد'}</p>
        </div>
      </div>

      {analysis.timeline.length > 0 && (
        <div className="bg-slate-50 border rounded-2xl p-4 mb-5">
          <h3 className="font-black text-slate-800 mb-3">منحنى الأداء</h3>
          <div className="flex items-end gap-2 h-32">
            {analysis.timeline.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="w-full bg-fuchsia-500 rounded-t-xl" style={{ height: `${Math.max(8, item.pct)}%` }} title={item.title}></div>
                <span className="text-[10px] font-bold text-slate-500">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-black text-slate-800 mb-3">خطة علاج ذكية</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {analysis.recommendations.map((rec, idx) => (
          <div key={idx} className="bg-white border rounded-2xl p-4">
            <div className="flex justify-between gap-3 mb-2">
              <h4 className="font-black text-slate-800">{rec.title}</h4>
              <span className={`text-xs px-3 py-1 rounded-full font-black ${rec.level === 'عاجل' ? 'bg-red-100 text-red-700' : rec.level === 'مهم' ? 'bg-amber-100 text-amber-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>{rec.level}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{rec.reason}</p>
            <ol className="space-y-1 text-sm text-slate-700 list-decimal list-inside">
              {rec.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        ))}
      </div>

      {analysis.questionMistakes.length > 0 && (
        <details className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <summary className="cursor-pointer font-black text-red-700">أمثلة من أخطائك المتكررة</summary>
          <div className="mt-3 space-y-2">
            {analysis.questionMistakes.map((m, idx) => (
              <div key={idx} className="bg-white border rounded-xl p-3 text-sm">
                <p className="font-bold text-slate-800">{String(m.text).replaceAll('|', ' / ')}</p>
                <p className="text-xs text-slate-500 mt-1">الفرع: {m.branch} • الامتحان: {m.examTitle}</p>
                {m.correct && <p className="text-xs text-emerald-700 mt-1">الصحيح: {m.correct}</p>}
                {m.chosen && <p className="text-xs text-red-700 mt-1">اختيارك: {m.chosen}</p>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

const AdminAIInsightsPanel = ({ examResults = [], examsList = [], content = [] }) => {
  const safeResults = Array.isArray(examResults) ? examResults : [];
  const safeExams = Array.isArray(examsList) ? examsList : [];
  const safeContent = Array.isArray(content) ? content : [];

  const insights = useMemo(() => {
    const completed = safeResults.filter(r => r && r.status === 'completed');
    const branchMap = {};
    const examMap = {};
    const gradeMap = {};

    completed.forEach(r => {
      const pct = getResultPercentage(r);
      const examTitle = r.examTitle || safeExams.find(e => e.id === r.examId)?.title || 'امتحان';
      examMap[r.examId || examTitle] = examMap[r.examId || examTitle] || { examId: r.examId || examTitle, title: examTitle, attempts: 0, avg: 0 };
      examMap[r.examId || examTitle].attempts += 1;
      examMap[r.examId || examTitle].avg += pct;

      const grade = r.grade || 'غير محدد';
      gradeMap[grade] = gradeMap[grade] || { grade, attempts: 0, avg: 0 };
      gradeMap[grade].attempts += 1;
      gradeMap[grade].avg += pct;

      const rows = Array.isArray(r.branchAnalysis)
        ? r.branchAnalysis
        : Object.entries(r.branchStats || {}).map(([branch, data]) => ({
            branch,
            percentage: data?.possible > 0 ? Math.round((safeNumber(data?.earned, 0) / safeNumber(data?.possible, 1)) * 100) : safeNumber(data?.percentage, 0),
            wrong: safeNumber(data?.wrong, 0)
          }));

      rows.forEach(b => {
        const branch = b?.branch || 'عام';
        branchMap[branch] = branchMap[branch] || { branch, total: 0, count: 0, wrong: 0 };
        branchMap[branch].total += safeNumber(b?.percentage, 0);
        branchMap[branch].count += 1;
        branchMap[branch].wrong += safeNumber(b?.wrong, 0);
      });
    });

    const branches = Object.values(branchMap).map(b => ({
      ...b,
      avg: b.count ? Math.round(b.total / b.count) : 0
    })).sort((a,b) => a.avg - b.avg);

    const exams = Object.values(examMap).map(e => ({
      ...e,
      avg: e.attempts ? Math.round(e.avg / e.attempts) : 0
    })).sort((a,b) => a.avg - b.avg);

    const grades = Object.values(gradeMap).map(g => ({
      ...g,
      avg: g.attempts ? Math.round(g.avg / g.attempts) : 0
    })).sort((a,b) => a.avg - b.avg);

    return { branches, exams, grades, totalAttempts: completed.length };
  }, [safeResults, safeExams]);

  const aiRecommendations = useMemo(() => {
    const weak = insights.branches.slice(0, 5);
    if (!weak.length) return [];
    return weak.map(item => {
      const related = safeContent.find(c => (c?.branch || '').trim() === item.branch || (c?.title || '').includes(item.branch));
      return {
        branch: item.branch,
        avg: item.avg,
        action: related?.title ? `راجع أو أعد شرح: ${related.title}` : `أضف مراجعة مركزة على فرع ${item.branch}`
      };
    });
  }, [insights.branches, safeContent]);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-fuchsia-600">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BrainCircuit className="text-fuchsia-600"/> AI Insights للأدمن</h2>
        <span className="text-xs bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 rounded-full px-3 py-1 font-bold">تحليل آمن بدون كراش</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-2xl p-4"><p className="text-xs font-bold text-fuchsia-600">محاولات مكتملة</p><p className="text-3xl font-black text-fuchsia-800">{insights.totalAttempts}</p></div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs font-bold text-red-600">أضعف فرع عام</p><p className="text-xl font-black text-red-800">{insights.branches[0]?.branch || 'لا يوجد'}</p></div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs font-bold text-amber-600">أصعب امتحان</p><p className="text-lg font-black text-amber-800">{insights.exams[0]?.title || 'لا يوجد'}</p></div>
      </div>

      {insights.totalAttempts === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500 font-bold">
          لا توجد نتائج مكتملة كافية للتحليل حتى الآن. بعد أول امتحانات مكتملة ستظهر التحليلات هنا تلقائيًا.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-4">
            <h3 className="font-black text-slate-800 mb-3">الفروع التي تحتاج إعادة شرح</h3>
            <div className="space-y-2">
              {insights.branches.slice(0, 8).map(b => (
                <div key={b.branch} className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                  <span className="font-bold">{b.branch}</span>
                  <span className="font-black text-red-600">{b.avg}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-4">
            <h3 className="font-black text-slate-800 mb-3">امتحانات تحتاج مراجعة</h3>
            <div className="space-y-2">
              {insights.exams.slice(0, 8).map(e => (
                <div key={e.examId} className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                  <span className="font-bold">{e.title}</span>
                  <span className="font-black text-amber-600">{e.avg}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border rounded-2xl p-4 lg:col-span-2">
            <h3 className="font-black text-slate-800 mb-3">اقتراحات عملية من البيانات</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {aiRecommendations.map((r, i) => (
                <div key={i} className="bg-fuchsia-50 border border-fuchsia-100 rounded-xl p-3">
                  <p className="font-black text-fuchsia-800">{r.branch} - متوسط {r.avg}%</p>
                  <p className="text-sm text-slate-700 mt-1">{r.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SmartSubscriptionManager = ({ users = [], adminGradeFilter = 'all' }) => {
  const [codes, setCodes] = useState([]);
  const [plan, setPlan] = useState('monthly');
  const [grade, setGrade] = useState(adminGradeFilter === 'all' ? '3sec' : adminGradeFilter);
  const [count, setCount] = useState(1);
  const [customPrefix, setCustomPrefix] = useState('VIP');
  const [durationDays, setDurationDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'subscription_codes'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCodes(rows);
    }, (error) => {
      console.warn('subscription codes listener blocked:', error?.message);
      setCodes([]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (plan === 'monthly') setDurationDays(30);
    if (plan === 'quarter') setDurationDays(90);
    if (plan === 'yearly') setDurationDays(365);
  }, [plan]);

  const generateCode = () => {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    return `${customPrefix || 'VIP'}-${random}-${stamp}`;
  };

  const createCodes = async () => {
    const safeCount = Math.min(Math.max(safeNumber(count, 1), 1), 100);
    if (!grade) return alert('اختار الصف.');
    if (safeNumber(durationDays, 0) <= 0) return alert('حدد مدة الاشتراك بالأيام.');

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const created = [];
      for (let i = 0; i < safeCount; i++) {
        const codeValue = generateCode();
        const ref = doc(collection(db, 'subscription_codes'));
        created.push(codeValue);
        batch.set(ref, {
          code: codeValue,
          grade,
          plan,
          type: plan,
          durationDays: safeNumber(durationDays, 30),
          expiresInDays: safeNumber(durationDays, 30),
          used: false,
          active: true,
          usedBy: null,
          usedByEmail: '',
          usedByName: '',
          usedAt: null,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      await navigator.clipboard?.writeText(created.join('\n')).catch(() => {});
      alert(`تم إنشاء ${safeCount} كود ونسخهم للحافظة.`);
    } catch (error) {
      console.error('create subscription codes error:', error);
      alert('تعذر إنشاء الأكواد. راجع الصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  const deleteCode = async (id) => {
    if (!window.confirm('حذف الكود؟')) return;
    await deleteDoc(doc(db, 'subscription_codes', id));
  };

  const copyAvailableCodes = async () => {
    const available = codes.filter(c => !c.used && c.active !== false).map(c => c.code);
    if (!available.length) return alert('لا توجد أكواد متاحة للنسخ.');
    await navigator.clipboard?.writeText(available.join('\n'));
    alert(`تم نسخ ${available.length} كود متاح.`);
  };

  const exportCSV = () => {
    const header = ['code','grade','plan','durationDays','used','usedByName','usedByEmail'];
    const rows = codes.map(c => header.map(h => `"${String(c[h] ?? '').replaceAll('"','""')}"`).join(','));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscription_codes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const total = codes.length;
    const used = codes.filter(c => c.used).length;
    const available = codes.filter(c => !c.used && c.active !== false).length;
    const disabled = codes.filter(c => c.active === false).length;
    return { total, used, available, disabled };
  }, [codes]);

  const vipUsers = useMemo(() => {
    return (users || []).filter(u => {
      const exp = u.subscription?.expiresAt?.toDate?.() || (u.subscription?.expiresAt ? new Date(u.subscription.expiresAt) : null);
      return u.subscription?.active && (!exp || exp > new Date());
    });
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-5 border-t-4 border-emerald-600">
        <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><CreditCard className="text-emerald-600"/> نظام الاشتراكات الذكي</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-50 border rounded-2xl p-4"><p className="text-xs font-bold text-slate-500">إجمالي الأكواد</p><p className="text-3xl font-black">{stats.total}</p></div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs font-bold text-emerald-600">متاحة</p><p className="text-3xl font-black text-emerald-700">{stats.available}</p></div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-xs font-bold text-amber-600">مستخدمة</p><p className="text-3xl font-black text-amber-700">{stats.used}</p></div>
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4"><p className="text-xs font-bold text-purple-600">طلاب VIP</p><p className="text-3xl font-black text-purple-700">{vipUsers.length}</p></div>
        </div>

        <div className="bg-white border rounded-2xl p-4 mb-6">
          <h3 className="font-black text-slate-800 mb-3">إنشاء أكواد جديدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input className="border rounded-xl p-3" placeholder="بادئة الكود" value={customPrefix} onChange={e => setCustomPrefix(e.target.value.toUpperCase())} />
            <select className="border rounded-xl p-3" value={grade} onChange={e => setGrade(e.target.value)}><GradeOptions/></select>
            <select className="border rounded-xl p-3" value={plan} onChange={e => setPlan(e.target.value)}>
              <option value="monthly">شهري</option>
              <option value="quarter">3 شهور</option>
              <option value="yearly">سنوي</option>
              <option value="custom">مدة مخصصة</option>
            </select>
            <input type="number" className="border rounded-xl p-3" placeholder="المدة بالأيام" value={durationDays} onChange={e => setDurationDays(e.target.value)} />
            <input type="number" min="1" max="100" className="border rounded-xl p-3" placeholder="عدد الأكواد" value={count} onChange={e => setCount(e.target.value)} />
            <button disabled={loading} onClick={createCodes} className="bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 disabled:opacity-50">{loading ? 'جاري...' : 'إنشاء'}</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <button onClick={copyAvailableCodes} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold">نسخ الأكواد المتاحة</button>
          <button onClick={exportCSV} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">تصدير CSV</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="bg-slate-100 text-slate-700">
              <th className="p-3 text-right">الكود</th><th className="p-3">الصف</th><th className="p-3">الخطة</th><th className="p-3">المدة</th><th className="p-3">الحالة</th><th className="p-3">استخدمه</th><th className="p-3">تحكم</th>
            </tr></thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-mono font-black">{c.code}</td>
                  <td className="p-3 text-center">{getGradeLabel(c.grade)}</td>
                  <td className="p-3 text-center">{c.plan || c.type}</td>
                  <td className="p-3 text-center">{c.durationDays || c.expiresInDays} يوم</td>
                  <td className="p-3 text-center">{c.used ? <span className="text-amber-600 font-bold">مستخدم</span> : <span className="text-emerald-600 font-bold">متاح</span>}</td>
                  <td className="p-3 text-center">{c.usedByName || c.usedByEmail || '-'}</td>
                  <td className="p-3 text-center"><button onClick={() => deleteCode(c.id)} className="text-red-600 bg-red-50 px-3 py-1 rounded-lg font-bold">حذف</button></td>
                </tr>
              ))}
              {codes.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-slate-400 font-bold">لا توجد أكواد بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LeaderboardPanel = ({ examResults = [], users = [], currentUserId = null, gradeFilter = 'all' }) => {
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

const AISmartRecommendations = ({ userResults = [], content = [], exams = [], userData = null }) => {
  userResults = Array.isArray(userResults) ? userResults : [];
  content = Array.isArray(content) ? content : [];
  exams = Array.isArray(exams) ? exams : [];

  const recommendations = useMemo(() => {
    const completed = userResults.filter(r => r.status === 'completed');
    const branches = {};
    completed.forEach(r => {
      const branchRows = Array.isArray(r.branchAnalysis) ? r.branchAnalysis : Object.entries(r.branchStats || {}).map(([branch, data]) => ({
        branch,
        percentage: data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 1)) * 100) : 0,
        wrong: safeNumber(data.wrong, 0)
      }));
      branchRows.forEach(b => {
        branches[b.branch] = branches[b.branch] || { branch: b.branch, total: 0, count: 0, wrong: 0 };
        branches[b.branch].total += safeNumber(b.percentage, 0);
        branches[b.branch].count += 1;
        branches[b.branch].wrong += safeNumber(b.wrong, 0);
      });
    });

    const weak = Object.values(branches).map(b => ({...b, avg: b.count ? Math.round(b.total / b.count) : 0})).sort((a,b)=>a.avg-b.avg).slice(0,4);
    const out = weak.map(b => {
      const relatedVideo = content.find(c => (c.type === 'video' || c.videoSection) && ((c.branch || '').includes(b.branch) || (c.title || '').includes(b.branch)));
      const relatedExam = exams.find(e => e.grade === userData?.grade && (e.title || '').includes(b.branch));
      return {
        priority: b.avg < 50 ? 'عاجل' : b.avg < 70 ? 'مهم' : 'مراجعة',
        title: `راجع فرع ${b.branch}`,
        reason: `متوسطك في هذا الفرع ${b.avg}% وعدد الأخطاء ${b.wrong}.`,
        action: relatedVideo ? `شاهد: ${relatedVideo.title}` : relatedExam ? `حل امتحان: ${relatedExam.title}` : 'راجع الدرس ثم حل تدريب قصير.'
      };
    });

    if (!out.length) out.push({ priority: 'ابدأ', title: 'ابدأ أول اختبار', reason: 'لسه مفيش بيانات كافية.', action: 'حل امتحان قصير حتى تظهر توصيات دقيقة.' });
    return out;
  }, [userResults, content, exams, userData]);

  return (
    <div className="glass-panel rounded-2xl p-5 border-t-4 border-purple-600">
      <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-4"><Sparkles className="text-purple-600"/> توصيات ذكية AI</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((r, i) => (
          <div key={i} className="bg-white border rounded-2xl p-4">
            <div className="flex justify-between gap-3 mb-2">
              <h3 className="font-black text-slate-800">{r.title}</h3>
              <span className={`text-xs px-3 py-1 rounded-full font-black ${r.priority === 'عاجل' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{r.priority}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{r.reason}</p>
            <div className="bg-purple-50 text-purple-800 rounded-xl p-3 text-sm font-bold">{r.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminQuestionDeepAnalytics = ({ examsList = [], examResults = [] }) => {
  const [selectedExamId, setSelectedExamId] = useState('');

  const selectedExam = useMemo(() => {
    return (examsList || []).find(e => e.id === selectedExamId) || (examsList || [])[0] || null;
  }, [examsList, selectedExamId]);

  useEffect(() => {
    if (!selectedExamId && examsList?.length) setSelectedExamId(examsList[0].id);
  }, [examsList, selectedExamId]);

  const analytics = useMemo(() => {
    if (!selectedExam) return { rows: [], branchSummary: [], resultCount: 0 };
    const questions = extractAllQuestions(selectedExam);
    const results = (examResults || []).filter(r => r.examId === selectedExam.id && (r.status === 'completed' || r.answers));

    const rows = questions.map((q, idx) => {
      const optionCounts = {};
      const wrongStudents = [];
      let answered = 0;
      let correct = 0;
      let wrong = 0;

      results.forEach(r => {
        const ans = r.answers?.[q.id];
        const hasAnswer = q.type === 'essay'
          ? !!(ans && ((typeof ans === 'string' && ans.trim()) || ans.text || ans.image))
          : ans !== undefined && ans !== null && ans !== '';

        if (hasAnswer) answered += 1;

        if (q.type !== 'essay') {
          if (hasAnswer) optionCounts[String(ans)] = safeNumber(optionCounts[String(ans)], 0) + 1;
          if (ans === q.correctIdx) correct += 1;
          else if (hasAnswer) {
            wrong += 1;
            wrongStudents.push(r.studentName || 'طالب');
          }
        }
      });

      const correctRate = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
      const difficulty = q.type === 'essay' ? 'مقالي' : correctRate >= 80 ? 'سهل' : correctRate >= 50 ? 'متوسط' : 'صعب';

      return {
        index: idx + 1,
        id: q.id,
        text: q.text || '',
        branch: q.branch || 'عام',
        type: q.type || 'mcq',
        correctRate,
        answered,
        correct,
        wrong,
        optionCounts,
        wrongStudents,
        difficulty
      };
    });

    const branchMap = {};
    rows.forEach(row => {
      branchMap[row.branch] = branchMap[row.branch] || { branch: row.branch, total: 0, avgCorrect: 0, hard: 0, wrong: 0 };
      branchMap[row.branch].total += 1;
      branchMap[row.branch].avgCorrect += row.correctRate;
      branchMap[row.branch].wrong += row.wrong;
      if (row.difficulty === 'صعب') branchMap[row.branch].hard += 1;
    });

    const branchSummary = Object.values(branchMap)
      .map(b => ({ ...b, avgCorrect: b.total ? Math.round(b.avgCorrect / b.total) : 0 }))
      .sort((a, b) => a.avgCorrect - b.avgCorrect);

    return { rows, branchSummary, resultCount: results.length };
  }, [selectedExam, examResults]);

  if (!examsList?.length) {
    return <div className="glass-panel p-6 rounded-2xl text-center text-slate-500 font-bold">لا توجد امتحانات لتحليلها بعد.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-5 border-t-4 border-indigo-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-indigo-600"/> تحليل الأسئلة المتقدم</h2>
            <p className="text-sm text-slate-500 mt-1">اعرف السؤال الصعب، نسبة الصح، واختيارات الطلاب لكل سؤال.</p>
          </div>
          <select className="border rounded-xl p-3 min-w-[260px]" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
            {examsList.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4"><p className="text-xs text-indigo-600 font-bold">عدد النتائج</p><p className="text-3xl font-black text-indigo-800">{analytics.resultCount || 0}</p></div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-xs text-blue-600 font-bold">عدد الأسئلة</p><p className="text-3xl font-black text-blue-800">{analytics.rows.length}</p></div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-xs text-red-600 font-bold">أسئلة صعبة</p><p className="text-3xl font-black text-red-800">{analytics.rows.filter(r => r.difficulty === 'صعب').length}</p></div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-xs text-emerald-600 font-bold">الفروع</p><p className="text-3xl font-black text-emerald-800">{analytics.branchSummary.length}</p></div>
        </div>

        <h3 className="font-black text-slate-800 mb-3">أضعف الفروع في هذا الامتحان</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {analytics.branchSummary.slice(0, 6).map(b => (
            <div key={b.branch} className="bg-white border rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2"><span className="font-black text-slate-800">{b.branch}</span><span className="font-black text-red-600">{b.avgCorrect}%</span></div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-red-500 h-2" style={{width: `${Math.max(0, Math.min(100, b.avgCorrect))}%`}} /></div>
              <p className="text-xs text-slate-500 mt-2">صعبة: {b.hard} / أخطاء: {b.wrong}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {analytics.rows.map(row => {
            const originalQuestion = extractAllQuestions(selectedExam).find(q => q.id === row.id) || {};
            return (
              <div key={`${row.id}-${row.index}`} className="bg-white border rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full font-bold">سؤال {row.index}</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">{row.branch}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${row.difficulty === 'صعب' ? 'bg-red-100 text-red-700' : row.difficulty === 'متوسط' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.difficulty}</span>
                    </div>
                    <p className="font-bold text-slate-800 leading-relaxed">{String(row.text).replaceAll('|', ' / ')}</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-xl p-3 min-w-[120px]">
                    <p className="text-xs text-slate-500 font-bold">نسبة الصح</p>
                    <p className="text-3xl font-black text-indigo-700">{row.correctRate}%</p>
                  </div>
                </div>

                {row.type !== 'essay' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    {Object.entries(row.optionCounts || {}).filter(([key]) => key !== 'undefined').map(([key, count]) => (
                      <div key={key} className={`rounded-xl p-2 text-xs font-bold border ${String(key) === String(originalQuestion.correctIdx) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600'}`}>
                        اختيار {safeNumber(key, 0) + 1}: {count} طالب
                      </div>
                    ))}
                  </div>
                )}

                {row.wrongStudents.length > 0 && (
                  <details className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
                    <summary className="cursor-pointer font-bold text-red-700 text-sm">الطلاب الذين أخطأوا ({row.wrongStudents.length})</summary>
                    <p className="text-xs text-red-700 mt-2 leading-relaxed">{row.wrongStudents.slice(0, 40).join('، ')}</p>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StudentSmartPerformanceReport = ({ userResults = [], content = [] }) => {
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

const QuestionBankManager = ({ adminGradeFilter }) => {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ grade: adminGradeFilter === 'all' ? '' : adminGradeFilter, branch: '', type: '' });
  const [form, setForm] = useState({ text: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'النحو', type: 'mcq', difficulty: 'medium', optionsText: '', correctIdx: 0, explanation: '', mark: 1, tags: '' });

  useEffect(() => {
      const unsub = onSnapshot(collection(db, 'question_bank'), (snap) => {
          const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setQuestions(rows);
      }, (error) => {
          console.warn('question_bank listener blocked:', error?.message);
          setQuestions([]);
      });
      return () => unsub();
  }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const options = form.type === 'mcq' ? form.optionsText.split('\n').map(o => o.trim()).filter(Boolean) : [];
    if (!form.text.trim()) return alert('اكتب نص السؤال أولاً');
    if (form.type === 'mcq' && options.length < 2) return alert('أضف اختيارين على الأقل');
    await addDoc(collection(db, 'question_bank'), {
      text: form.text.trim(),
      grade: form.grade,
      branch: form.branch,
      type: form.type,
      difficulty: form.difficulty,
      options,
      correctIdx: safeNumber(form.correctIdx, 0),
      explanation: form.explanation,
      mark: safeNumber(form.mark, form.type === 'essay' ? 10 : 1),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: serverTimestamp()
    });
    setForm(prev => ({ ...prev, text: '', optionsText: '', explanation: '', tags: '' }));
  };

  const createExamFromBank = async () => {
    const pool = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type));
    if (pool.length === 0) return alert('لا توجد أسئلة مطابقة للفلاتر الحالية');
    const selected = pool.slice(0, Math.min(pool.length, 20));
    const grouped = {};
    selected.forEach(q => {
      grouped[q.branch] = grouped[q.branch] || { text: '', subQuestions: [] };
      grouped[q.branch].subQuestions.push({
        id: `qb_${q.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        text: q.text,
        options: q.options || [],
        correctIdx: q.correctIdx ?? 0,
        branch: q.branch,
        type: q.type || 'mcq',
        explanation: q.explanation || '',
        maxScore: getQuestionMaxScore(q),
        modelAnswer: q.modelAnswer || ''
      });
    });
    await addDoc(collection(db, 'exams'), {
      title: `امتحان مُولَّد من بنك الأسئلة - ${getGradeLabel(filters.grade || selected[0].grade)}`,
      grade: filters.grade || selected[0].grade,
      duration: Math.max(15, selected.length * 2),
      startTime: new Date().toISOString().slice(0,16),
      endTime: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,16),
      accessCode: Math.random().toString(36).slice(2, 7).toUpperCase(),
      isPremium: false,
      questions: Object.values(grouped),
      createdAt: serverTimestamp(),
      source: 'question_bank'
    });
    alert('تم إنشاء امتحان جديد من بنك الأسئلة بنجاح');
  };

  const visible = questions.filter(q => (!filters.grade || q.grade === filters.grade) && (!filters.branch || q.branch === filters.branch) && (!filters.type || q.type === filters.type));

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 md:p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-indigo-700 flex items-center gap-2"><Layers/> بنك الأسئلة</h2>
        <form onSubmit={handleAddQuestion} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
            <input className="border p-3 rounded" placeholder="الفرع مثل النحو أو الأدب" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})}/>
            <select className="border p-3 rounded" value={form.type} onChange={e=>setForm({...form, type:e.target.value, mark: e.target.value === 'essay' ? 10 : 1})}>
              <option value="mcq">اختياري</option><option value="essay">مقالي</option>
            </select>
            <select className="border p-3 rounded" value={form.difficulty} onChange={e=>setForm({...form, difficulty:e.target.value})}>
              <option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option>
            </select>
          </div>
          <textarea className="border p-3 rounded h-24" placeholder="نص السؤال" value={form.text} onChange={e=>setForm({...form, text:e.target.value})}/>
          {form.type === 'mcq' && <textarea className="border p-3 rounded h-28 font-mono" placeholder="كل اختيار في سطر منفصل" value={form.optionsText} onChange={e=>setForm({...form, optionsText:e.target.value})}/>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {form.type === 'mcq' && <input type="number" min="0" className="border p-3 rounded" placeholder="رقم الإجابة الصحيحة" value={form.correctIdx} onChange={e=>setForm({...form, correctIdx:e.target.value})}/>}
            <input type="number" min="1" className="border p-3 rounded" placeholder="درجة السؤال" value={form.mark} onChange={e=>setForm({...form, mark:e.target.value})}/>
            <input className="border p-3 rounded" placeholder="tags مفصولة بفاصلة" value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})}/>
          </div>
          <textarea className="border p-3 rounded h-20" placeholder="شرح الإجابة / قاعدة المراجعة الذكية" value={form.explanation} onChange={e=>setForm({...form, explanation:e.target.value})}/>
          <div className="flex flex-col md:flex-row gap-3">
            <button className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold">إضافة للسجل</button>
            <button type="button" onClick={createExamFromBank} className="bg-emerald-600 text-white py-3 px-6 rounded-xl font-bold">توليد امتحان من الفلاتر الحالية</button>
          </div>
        </form>
      </div>
      <div className="glass-panel p-4 md:p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select className="border p-3 rounded" value={filters.grade} onChange={e=>setFilters({...filters, grade:e.target.value})}><option value="">كل المراحل</option><GradeOptions/></select>
          <input className="border p-3 rounded" placeholder="فلترة الفرع" value={filters.branch} onChange={e=>setFilters({...filters, branch:e.target.value})}/>
          <select className="border p-3 rounded" value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}><option value="">كل الأنواع</option><option value="mcq">اختياري</option><option value="essay">مقالي</option></select>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {visible.map(q => <div key={q.id} className="bg-white border rounded-xl p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(q.grade)}</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{q.branch}</span>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">{getQuestionMaxScore(q)} درجة</span>
            </div>
            <p className="font-bold text-slate-800">{q.text}</p>
            {q.explanation && <p className="text-xs text-slate-500 mt-2">شرح: {q.explanation}</p>}
          </div>)}
          {visible.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد أسئلة مطابقة.</p>}
        </div>
      </div>
    </div>
  );
};

const AssignmentsManager = ({ adminGradeFilter }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ title: '', grade: adminGradeFilter === 'all' ? '3sec' : adminGradeFilter, branch: 'التعبير', description: '', dueDate: '', totalMarks: 20, deliveryType: 'text_or_image' });
  const [submissionFilter, setSubmissionFilter] = useState('pending');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assignments'), snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAssignments(rows);
    }, error => { console.warn('assignments listener blocked:', error?.message); setAssignments([]); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assignment_submissions'), snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
      setSubmissions(rows);
    }, error => { console.warn('assignment_submissions listener blocked:', error?.message); setSubmissions([]); });
    return () => unsub();
  }, []);

  const createAssignment = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('اكتب عنوان الواجب');
    await addDoc(collection(db, 'assignments'), { ...form, totalMarks: safeNumber(form.totalMarks, 20), createdAt: serverTimestamp(), status: 'active' });
    setForm(prev => ({ ...prev, title: '', description: '' }));
  };

  const reviewSubmission = async (submission) => {
    const scoreValue = prompt('أدخل الدرجة التي حصل عليها الطالب', submission.score ?? 0);
    if (scoreValue === null) return;
    const maxValue = prompt('ومن كام؟', submission.maxScore ?? submission.totalMarks ?? 20);
    if (maxValue === null) return;
    const feedback = prompt('تعليقك على الواجب', submission.feedback || '');
    await updateDoc(doc(db, 'assignment_submissions', submission.id), {
      score: safeNumber(scoreValue, 0),
      maxScore: safeNumber(maxValue, submission.totalMarks ?? 20),
      feedback: feedback || '',
      reviewStatus: 'graded',
      gradedAt: serverTimestamp()
    });
    alert('تم حفظ تصحيح الواجب');
  };

  const visibleSubmissions = submissions.filter(item => {
    if (adminGradeFilter !== 'all' && item.grade !== adminGradeFilter) return false;
    if (submissionFilter === 'pending') return item.reviewStatus !== 'graded';
    if (submissionFilter === 'graded') return item.reviewStatus === 'graded';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2"><FileCheck/> نظام الواجبات</h2>
        <form onSubmit={createAssignment} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input className="border p-3 rounded md:col-span-2" placeholder="عنوان الواجب" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <select className="border p-3 rounded" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}><GradeOptions/></select>
            <input className="border p-3 rounded" placeholder="الفرع" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})} />
          </div>
          <textarea className="border p-3 rounded h-24" placeholder="وصف الواجب والتعليمات" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}></textarea>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="datetime-local" className="border p-3 rounded" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} />
            <input type="number" className="border p-3 rounded" value={form.totalMarks} onChange={e=>setForm({...form, totalMarks:e.target.value})} />
            <select className="border p-3 rounded" value={form.deliveryType} onChange={e=>setForm({...form, deliveryType:e.target.value})}>
              <option value="text_or_image">نص أو صورة</option><option value="image_only">صورة فقط</option><option value="text_only">نص فقط</option>
            </select>
          </div>
          <button className="bg-blue-600 text-white py-3 rounded-xl font-bold">نشر الواجب</button>
        </form>
      </div>
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-slate-800">التسليمات</h3>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {[["pending","غير مصحح"], ["graded","مصحح"], ["all","الكل"]].map(([key,label]) => (
              <button key={key} onClick={() => setSubmissionFilter(key)} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold ${submissionFilter === key ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3 max-h-[550px] overflow-y-auto">
          {visibleSubmissions.map(item => <div key={item.id} className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800">{item.studentName} — {item.assignmentTitle}</p>
                <p className="text-xs text-slate-500 mt-1">{item.branch} • {getGradeLabel(item.grade)}</p>
                {item.answerText && <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl mt-2 whitespace-pre-wrap">{item.answerText}</p>}
                {item.answerImage && <img src={item.answerImage} alt="assignment" className="w-40 h-40 object-cover rounded-xl border mt-2" />}
              </div>
              <div className="flex flex-col gap-2 min-w-[180px]">
                <div className="text-xs bg-slate-100 px-3 py-2 rounded-xl text-center">{item.reviewStatus === 'graded' ? `تم التصحيح: ${item.score}/${item.maxScore}` : 'بانتظار التصحيح'}</div>
                <button onClick={() => reviewSubmission(item)} className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold">تصحيح الواجب</button>
              </div>
            </div>
          </div>)}
          {visibleSubmissions.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد تسليمات مطابقة لهذا الفلتر.</p>}
        </div>
      </div>
    </div>
  );
};

const PerformanceOverview = ({ examResults = [], content = [] }) => {
  const metrics = useMemo(() => {
    const completed = examResults.filter(r => r.status === 'completed');
    const avg = completed.length ? Math.round(completed.reduce((acc, item) => acc + safeNumber(item.percentage, item.total ? (item.score / item.total) * 100 : 0), 0) / completed.length) : 0;
    return { completed, avg };
  }, [examResults]);

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800"><BarChart3/> تحليل الأداء</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">الاختبارات المكتملة</p><p className="text-3xl font-black text-blue-600">{metrics.completed.length}</p></div>
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">متوسط الأداء</p><p className="text-3xl font-black text-emerald-600">{metrics.avg}%</p></div>
        <div className="bg-white border rounded-2xl p-4 text-center"><p className="text-slate-500 text-sm">محتوى متاح للمراجعة</p><p className="text-3xl font-black text-amber-600">{content.length}</p></div>
      </div>
    </div>
  );
};

const StudentAssignmentsPanel = ({ assignments = [], submissions = [], user, userData }) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentView, setAssignmentView] = useState('open');
  const [answerText, setAnswerText] = useState('');
  const [answerImage, setAnswerImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadImage = (file) => { const reader = new FileReader(); reader.onloadend = () => setAnswerImage(reader.result); reader.readAsDataURL(file); };

  const submitAssignment = async () => {
    if (!selectedAssignment) return;
    if (!answerText.trim() && !answerImage) return alert('أضف نص الإجابة أو صورة واحدة على الأقل');
    setIsSubmitting(true);
    const existing = submissions.find(s => s.assignmentId === selectedAssignment.id);
    const payload = {
      assignmentId: selectedAssignment.id,
      assignmentTitle: selectedAssignment.title,
      grade: selectedAssignment.grade,
      branch: selectedAssignment.branch,
      studentId: user.uid,
      studentName: userData?.name,
      answerText,
      answerImage,
      reviewStatus: 'submitted',
      totalMarks: safeNumber(selectedAssignment.totalMarks, 20),
      submittedAt: serverTimestamp()
    };
    if (existing) await updateDoc(doc(db, 'assignment_submissions', existing.id), payload);
    else await addDoc(collection(db, 'assignment_submissions'), payload);
    setIsSubmitting(false);
    setSelectedAssignment(null);
    setAnswerText('');
    setAnswerImage('');
    alert('تم تسليم الواجب بنجاح');
  };

  const visibleAssignments = assignments.filter(item => {
    const sub = submissions.find(s => s.assignmentId === item.id);
    if (assignmentView === 'open') return !sub;
    if (assignmentView === 'submitted') return !!sub && sub.reviewStatus !== 'graded';
    if (assignmentView === 'graded') return !!sub && sub.reviewStatus === 'graded';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileCheck/> الواجبات</h2>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {[["open","المطلوب"], ["submitted","تم التسليم"], ["graded","تم التصحيح"], ["all","الكل"]].map(([key,label]) => (
              <button key={key} onClick={() => setAssignmentView(key)} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap ${assignmentView === key ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAssignments.map(item => {
            const sub = submissions.find(s => s.assignmentId === item.id);
            return <div key={item.id} className="bg-white border rounded-2xl p-4">
              <div className="flex flex-wrap gap-2 mb-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{item.branch}</span><span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(item.grade)}</span></div>
              <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
              <p className="text-sm text-slate-500 my-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500"><span>الدرجة: {item.totalMarks}</span><span>{sub ? (sub.reviewStatus === 'graded' ? `تم التصحيح: ${sub.score}/${sub.maxScore}` : 'تم التسليم') : 'لم يُسلَّم بعد'}</span></div>
              <button onClick={() => setSelectedAssignment(item)} className="mt-3 w-full bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold">{sub ? 'تعديل / عرض التسليم' : 'ابدأ الواجب'}</button>
            </div>;
          })}
          {visibleAssignments.length === 0 && <div className="col-span-full bg-white border rounded-2xl p-8 text-center text-slate-500">لا توجد واجبات في هذا القسم حالياً.</div>}
        </div>
      </div>
      {selectedAssignment && <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4">تسليم واجب: {selectedAssignment.title}</h3>
        <textarea className="w-full border rounded-xl p-3 h-32 mb-3" placeholder="اكتب إجابتك هنا" value={answerText} onChange={e=>setAnswerText(e.target.value)}></textarea>
        <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} className="mb-3" />
        {answerImage && <img src={answerImage} alt="submission" className="w-40 h-40 object-cover rounded-xl border mb-3" />}
        <div className="flex gap-3"><button onClick={submitAssignment} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">{isSubmitting ? 'جارٍ الحفظ...' : 'تسليم الواجب'}</button><button onClick={() => setSelectedAssignment(null)} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold">إلغاء</button></div>
      </div>}
    </div>
  );
};




const AdminProDashboard = ({ users = [], exams = [], results = [], content = [], subscriptionCodes = [], liveSessions = [], hwResults = [], adminGradeFilter = 'all' }) => {
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

const ActivityIcon = () => <BarChart3 size={20}/>;

const AdminPerformanceAnalytics = ({ examResults = [], examsList = [], users = [], adminGradeFilter = 'all' }) => {
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  const analytics = useMemo(() => {
    const examsById = Object.fromEntries((examsList || []).map(exam => [exam.id, exam]));
    const usersById = Object.fromEntries((users || []).map(u => [u.id, u]));
    const rowsByStudent = {};
    const branchTotals = {};

    const getMetricsForResult = (result) => {
      const savedBranchStats = result.performanceAnalysis?.branchStats || result.branchStats;
      if (savedBranchStats && Object.keys(savedBranchStats).length > 0) {
        const branchStats = Object.fromEntries(Object.entries(savedBranchStats).map(([branch, stat]) => [branch, {
          earned: safeNumber(stat.earned, 0),
          possible: safeNumber(stat.possible, 0),
          answered: safeNumber(stat.answered, 0),
          total: safeNumber(stat.total, 0),
          correct: safeNumber(stat.correct, 0),
          wrong: safeNumber(stat.wrong, 0),
          essay: safeNumber(stat.essay, 0),
        }]));
        const totalScore = safeNumber(result.performanceAnalysis?.totalScore, Object.values(branchStats).reduce((a, s) => a + safeNumber(s.earned, 0), 0));
        const totalPossible = safeNumber(result.performanceAnalysis?.totalPossible, Object.values(branchStats).reduce((a, s) => a + safeNumber(s.possible, 0), 0));
        return { branchStats, totalScore, totalPossible, percentage: totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : getResultPercentage(result) };
      }

      const exam = examsById[result.examId];
      if (exam) return calculateDetailedExamMetrics(exam, result.answers || {}, result.essayGrades || result.essayScores || {});

      return { branchStats: {}, totalScore: safeNumber(result.score, 0), totalPossible: safeNumber(result.totalPossible, safeNumber(result.total, 0)), percentage: getResultPercentage(result) };
    };

    (examResults || [])
      .filter(result => result.status === 'completed')
      .filter(result => selectedExamId === 'all' || result.examId === selectedExamId)
      .forEach(result => {
        const exam = examsById[result.examId] || {};
        const student = usersById[result.studentId] || {};
        const grade = result.grade || student.grade || exam.grade || 'غير محدد';
        if (adminGradeFilter !== 'all' && grade !== adminGradeFilter) return;

        const metrics = getMetricsForResult(result);
        const key = result.studentId || result.studentName || result.id;
        if (!rowsByStudent[key]) {
          rowsByStudent[key] = {
            studentId: result.studentId,
            studentName: result.studentName || student.name || student.displayName || 'طالب',
            grade,
            examsCount: 0,
            totalScore: 0,
            totalPossible: 0,
            branches: {},
            lastExamTitle: result.examTitle || exam.title || 'امتحان'
          };
        }
        const row = rowsByStudent[key];
        row.examsCount += 1;
        row.totalScore += safeNumber(metrics.totalScore, safeNumber(result.score, 0));
        row.totalPossible += safeNumber(metrics.totalPossible, safeNumber(result.totalPossible, safeNumber(result.total, 0)));
        row.lastExamTitle = result.examTitle || exam.title || row.lastExamTitle;

        Object.entries(metrics.branchStats || {}).forEach(([branch, stat]) => {
          row.branches[branch] = row.branches[branch] || { earned: 0, possible: 0, exams: 0, wrong: 0, total: 0, correct: 0 };
          row.branches[branch].earned += safeNumber(stat.earned, 0);
          row.branches[branch].possible += safeNumber(stat.possible, 0);
          row.branches[branch].wrong += safeNumber(stat.wrong, 0);
          row.branches[branch].correct += safeNumber(stat.correct, 0);
          row.branches[branch].total += safeNumber(stat.total, 0);
          row.branches[branch].exams += 1;

          branchTotals[branch] = branchTotals[branch] || { earned: 0, possible: 0, wrong: 0, correct: 0, total: 0, students: new Set() };
          branchTotals[branch].earned += safeNumber(stat.earned, 0);
          branchTotals[branch].possible += safeNumber(stat.possible, 0);
          branchTotals[branch].wrong += safeNumber(stat.wrong, 0);
          branchTotals[branch].correct += safeNumber(stat.correct, 0);
          branchTotals[branch].total += safeNumber(stat.total, 0);
          branchTotals[branch].students.add(key);
        });
      });

    const studentRows = Object.values(rowsByStudent).map(row => {
      const branchRows = Object.entries(row.branches).map(([branch, stat]) => ({
        branch,
        pct: stat.possible > 0 ? Math.round((stat.earned / stat.possible) * 100) : 0,
        ...stat
      })).sort((a,b) => a.pct - b.pct);
      return {
        ...row,
        average: row.totalPossible > 0 ? Math.round((row.totalScore / row.totalPossible) * 100) : 0,
        weakestBranches: branchRows,
        strongestBranch: [...branchRows].sort((a,b) => b.pct - a.pct)[0]
      };
    }).filter(row => !studentSearch.trim() || row.studentName.toLowerCase().includes(studentSearch.trim().toLowerCase()))
      .sort((a,b) => a.average - b.average);

    const branchRows = Object.entries(branchTotals).map(([branch, stat]) => ({
      branch,
      pct: stat.possible > 0 ? Math.round((stat.earned / stat.possible) * 100) : 0,
      wrong: stat.wrong,
      correct: stat.correct,
      total: stat.total,
      studentsCount: stat.students.size
    })).sort((a,b) => a.pct - b.pct);

    return { studentRows, branchRows };
  }, [examResults, examsList, users, adminGradeFilter, selectedExamId, studentSearch]);

  const riskStudents = analytics.studentRows.filter(row => row.average < 70).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 md:p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-blue-600"/> تحليل أداء الطلاب والفروع الضعيفة</h2>
            <p className="text-sm text-slate-500 mt-1">اعرف بسرعة الطالب ناقص في أي فرع، وأي فرع محتاج شرح أو واجب إضافي.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <select className="border p-3 rounded-xl bg-white" value={selectedExamId} onChange={e=>setSelectedExamId(e.target.value)}>
              <option value="all">كل الامتحانات</option>
              {(examsList || []).map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
            </select>
            <input className="border p-3 rounded-xl" placeholder="بحث باسم الطالب" value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-blue-600 text-sm font-bold">طلاب تم تحليلهم</p><p className="text-3xl font-black text-blue-900">{analytics.studentRows.length}</p></div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-red-600 text-sm font-bold">طلاب يحتاجون متابعة</p><p className="text-3xl font-black text-red-900">{riskStudents.length}</p></div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-amber-700 text-sm font-bold">أضعف فرع عام</p><p className="text-xl font-black text-amber-900">{analytics.branchRows[0]?.branch || 'لا يوجد'}</p></div>
        </div>

        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Target size={18}/> أضعف الفروع على مستوى الطلاب</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          {analytics.branchRows.slice(0, 8).map(item => (
            <div key={item.branch} className="bg-white border rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2"><span className="font-black text-slate-800">{item.branch}</span><span className={`text-sm font-bold px-2 py-1 rounded-full ${item.pct < 50 ? 'bg-red-100 text-red-700' : item.pct < 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.pct}%</span></div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-2 bg-blue-500 rounded-full" style={{width: `${item.pct}%`}} /></div>
              <p className="text-xs text-slate-500 mt-2">{item.studentsCount} طالب • {item.wrong} خطأ</p>
            </div>
          ))}
          {analytics.branchRows.length === 0 && <p className="text-slate-500 col-span-full text-center py-8">لا توجد نتائج كافية للتحليل بعد. تأكد أن الطالب سلّم امتحانًا يحتوي على فروع مثل النحو/البلاغة/الأدب.</p>}
        </div>
      </div>

      <div className="glass-panel p-5 md:p-6 rounded-2xl">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Users size={18}/> تقرير كل طالب</h3>
        <div className="space-y-3 max-h-[650px] overflow-y-auto">
          {analytics.studentRows.map(row => (
            <div key={row.studentId || row.studentName} className="bg-white border rounded-2xl p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="font-black text-slate-800 text-lg">{row.studentName}</p>
                  <p className="text-xs text-slate-500">{getGradeLabel(row.grade)} • {row.examsCount} امتحان • آخر امتحان: {row.lastExamTitle}</p>
                </div>
                <div className="text-center md:text-left">
                  <span className={`inline-flex px-4 py-2 rounded-full font-black border ${getGradeBadge(row.average).tone}`}>{row.average}% - {getGradeBadge(row.average).text}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {row.weakestBranches.map(branch => (
                  <div key={branch.branch} className="bg-slate-50 rounded-xl p-3 border">
                    <div className="flex justify-between text-sm font-bold"><span>{branch.branch}</span><span className={branch.pct < 50 ? 'text-red-600' : branch.pct < 70 ? 'text-amber-600' : 'text-emerald-600'}>{branch.pct}%</span></div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden mt-2"><div className={branch.pct < 50 ? 'h-2 bg-red-400' : branch.pct < 70 ? 'h-2 bg-amber-400' : 'h-2 bg-emerald-400'} style={{width: `${branch.pct}%`}} /></div>
                    <p className="text-xs text-slate-500 mt-1">أخطاء: {branch.wrong} • صحيح: {branch.correct}</p>
                  </div>
                ))}
                {row.weakestBranches.length === 0 && <p className="text-sm text-slate-400">لا توجد فروع كافية لهذا الطالب.</p>}
              </div>
            </div>
          ))}
          {analytics.studentRows.length === 0 && <p className="text-slate-500 text-center py-8">لا توجد بيانات مطابقة للفلاتر الحالية.</p>}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ user }) => {
  const userData = user || {};
  const [adminReviewExamData, setAdminReviewExamData] = useState(null);
  const [adminReviewResult, setAdminReviewResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [adminGradeFilter, setAdminGradeFilter] = useState('all'); 
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [messagesList, setMessagesList] = useState([]); 
  const [newContent, setNewContent] = useState({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '' });
  const [liveData, setLiveData] = useState({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '', sessionType: 'jitsi', embedUrl: '', scheduledAt: '', isOptional: true });
  const [activeLiveSessions, setActiveLiveSessions] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [examBuilder, setExamBuilder] = useState({ title: '', grade: '3sec', duration: 60, startTime: '', endTime: '', questions: [], accessCode: '', isPremium: false });
  const [bulkText, setBulkText] = useState('');
  const [examsList, setExamsList] = useState([]);
  const [examResults, setExamResults] = useState([]); 
  const [viewingResult, setViewingResult] = useState(null); 
  const [resultsFilter, setResultsFilter] = useState('all');
  const [essayScoreDrafts, setEssayScoreDrafts] = useState({});
  const [essayMaxDrafts, setEssayMaxDrafts] = useState({});
  const [newAnnouncement, setNewAnnouncement] = useState(""); 
  const [newStudentNotification, setNewStudentNotification] = useState({ title: '', text: '', grade: 'all', clickUrl: '/' }); 
  const [showLeaderboard, setShowLeaderboard] = useState(false);
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

  const [editingFullExam, setEditingFullExam] = useState(null);
  const [examEditMode, setExamEditMode] = useState('direct');
  const [recalculateAfterExamEdit, setRecalculateAfterExamEdit] = useState(true);
  const [examEditDraft, setExamEditDraft] = useState({
    title: '', grade: '3sec', duration: 60, startTime: '', endTime: '',
    accessCode: '', isPremium: false, questionsText: ''
  });

  const examEditQuestionsPreview = useMemo(() => {
    try {
      const blocks = JSON.parse(examEditDraft.questionsText || '[]');
      if (!Array.isArray(blocks)) return [];
      return blocks.flatMap((block, blockIndex) =>
        (Array.isArray(block?.subQuestions) ? block.subQuestions : []).map((q, questionIndex) => ({
          ...q,
          blockIndex,
          questionIndex,
          blockText: block?.text || ''
        }))
      );
    } catch (error) {
      return [];
    }
  }, [examEditDraft.questionsText]);

  const updateQuestionInExamDraft = (blockIndex, questionIndex, updates) => {
    try {
      const blocks = JSON.parse(examEditDraft.questionsText || '[]');
      if (!Array.isArray(blocks) || !blocks[blockIndex]?.subQuestions?.[questionIndex]) return;
      blocks[blockIndex].subQuestions[questionIndex] = {
        ...blocks[blockIndex].subQuestions[questionIndex],
        ...updates
      };
      setExamEditDraft(prev => ({
        ...prev,
        questionsText: JSON.stringify(blocks, null, 2)
      }));
    } catch (error) {
      alert('لا يمكن تعديل الأسئلة الآن لأن صيغة الأسئلة غير سليمة.');
    }
  };

  const [editingFullContent, setEditingFullContent] = useState(null);
  const [contentEditMode, setContentEditMode] = useState('direct');
  const [contentEditDraft, setContentEditDraft] = useState({
    title: '', url: '', type: 'video', videoSection: 'explanation',
    grade: '3sec', isPremium: false, isPublic: false, allowedEmailsText: '',
    linkedExamId: '', estimatedDurationMinutes: '', branch: ''
  });

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
  // Auto replies removed permanently.


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

  const copyUnusedSubscriptionCodes = async () => {
      const unused = subscriptionCodes.filter(c => !c.used).map(c => `${c.code} - ${c.days} يوم`).join('\n');
      if (!unused) return alert('لا توجد أكواد غير مستخدمة للنسخ.');
      await navigator.clipboard.writeText(unused);
      alert('تم نسخ الأكواد غير المستخدمة.');
  };

  const exportSubscriptionCodesCSV = () => {
      const rows = [['code','days','status','usedBy','usedAt']];
      subscriptionCodes.forEach(c => {
          rows.push([
              c.code || '',
              c.days || '',
              c.used ? 'used' : 'unused',
              c.usedBy || '',
              c.usedAt?.toDate ? c.usedAt.toDate().toLocaleString('ar-EG') : ''
          ]);
      });
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscription_codes_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const extendPremiumForAll = async () => {
      const days = prompt('كم يوم تريد إضافتها لكل طلاب VIP الحاليين؟', '7');
      if (!days || Number.isNaN(Number(days))) return;
      if (!window.confirm(`سيتم إضافة ${days} يوم لكل طلاب VIP الحاليين. هل أنت متأكد؟`)) return;
      const batch = writeBatch(db);
      activeUsersList.filter(u => u.subscriptionStatus === 'premium').forEach(u => {
          let expiry = u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : new Date();
          if (expiry < new Date()) expiry = new Date();
          expiry.setDate(expiry.getDate() + Number(days));
          batch.update(doc(db, 'users', u.id), { subscriptionExpiry: expiry, subscriptionStatus: 'premium' });
      });
      await batch.commit();
      alert('تم تمديد اشتراكات VIP الحالية.');
  };


  const handleDeleteUser = async (id) => { if(window.confirm("حذف نهائي؟")) await deleteDoc(doc(db,'users',id)); };
  const handleDeleteMessage = async (id) => { if(window.confirm("حذف الرسالة؟")) await deleteDoc(doc(db,'messages',id)); };
  const handleDeleteExam = async (id) => { if(window.confirm("حذف الامتحان؟")) await deleteDoc(doc(db, 'exams', id)); };
  const handleDeleteAnnouncement = async (id) => { if(window.confirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id)); };
  const handleDeleteResult = async (resultId) => { if(window.confirm("حذف النتيجة؟")) await deleteDoc(doc(db, 'exam_results', resultId)); };

  const openAdminResultReview = async (result) => {
    try {
      let examData = null;

      if (result.examId) {
        const cachedExam = examsList.find(e => e.id === result.examId);
        if (cachedExam) {
          examData = cachedExam;
        } else {
          const examSnap = await getDoc(doc(db, 'exams', result.examId));
          if (examSnap.exists()) examData = { id: examSnap.id, ...examSnap.data() };
        }
      }

      if (!examData) {
        return alert('لم يتم العثور على الامتحان الأصلي لهذه النتيجة. قد يكون الامتحان محذوفًا.');
      }

      const reviewExam = {
        ...examData,
        attemptId: result.id,
        title: `${examData.title || result.examTitle || 'مراجعة امتحان'} - مراجعة الأدمن`,
        endTime: examData.endTime || new Date(Date.now() - 1000).toISOString()
      };

      const reviewUser = {
        uid: result.studentId,
        displayName: result.studentName || 'طالب',
        email: result.studentEmail || ''
      };

      setAdminReviewExamData({ exam: reviewExam, user: reviewUser });
      setAdminReviewResult(result);
    } catch (error) {
      console.error('open admin result review error:', error);
      alert('تعذر فتح مراجعة الامتحان.');
    }
  };

  const openFullExamEditor = (exam) => {
    const hasResults = examResults.some(r => r.examId === exam.id);
    setEditingFullExam({ ...exam, hasResults });
    setExamEditMode(hasResults ? 'clone' : 'direct');
    setRecalculateAfterExamEdit(hasResults);
    setExamEditDraft({
      title: exam.title || '',
      grade: exam.grade || '3sec',
      duration: safeNumber(exam.duration, 60),
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      accessCode: exam.accessCode || '',
      isPremium: !!exam.isPremium,
      questionsText: JSON.stringify(exam.questions || [], null, 2)
    });
  };


  const recalculateExamResultsAfterAnswerEdit = async (examId, updatedExam) => {
    const resultsQuery = query(collection(db, 'exam_results'), where('examId', '==', examId));
    const snap = await getDocs(resultsQuery);

    if (snap.empty) {
      alert('تم تعديل الامتحان، ولا توجد نتائج قديمة لإعادة تصحيحها.');
      return { updated: 0 };
    }

    let updatedCount = 0;
    let batch = writeBatch(db);
    let batchOps = 0;

    for (const resultDoc of snap.docs) {
      const result = resultDoc.data();
      const answers = result.answers || {};
      const essayGrades = result.essayGrades || result.essayScores || result.manualEssayGrades || {};

      const metrics = calculateDetailedExamMetrics(updatedExam, answers, essayGrades);
      const branchRows = Object.entries(metrics.branchStats || {}).map(([branch, data]) => {
        const pct = data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 1)) * 100) : 0;
        return {
          branch,
          earned: safeNumber(data.earned, 0),
          possible: safeNumber(data.possible, 0),
          percentage: pct,
          correct: safeNumber(data.correct, 0),
          wrong: safeNumber(data.wrong, 0),
          answered: safeNumber(data.answered, 0),
          total: safeNumber(data.total, 0),
          essay: safeNumber(data.essay, 0)
        };
      }).sort((a, b) => a.percentage - b.percentage);

      const weakBranches = branchRows.filter(b => b.percentage < 70);
      const mcqScore = metrics.questions
        .filter(q => q.type !== 'essay')
        .reduce((sum, q) => sum + (answers[q.id] === q.correctIdx ? getQuestionMaxScore(q) : 0), 0);

      batch.update(resultDoc.ref, {
        score: metrics.totalScore,
        mcqScore,
        total: metrics.totalPossible,
        percentage: metrics.percentage,
        branchStats: metrics.branchStats,
        branchAnalysis: branchRows,
        weakBranches,
        performanceAnalysis: {
          percentage: metrics.percentage,
          totalScore: metrics.totalScore,
          totalPossible: metrics.totalPossible,
          weakBranches,
          recalculatedBecause: 'exam_answers_edited',
          recalculatedAt: new Date().toISOString()
        },
        examTitle: updatedExam.title,
        examVersionAtRecalculation: safeNumber(updatedExam.version, 1) + 1,
        recalculatedAt: serverTimestamp(),
        recalculatedByAdmin: true
      });

      updatedCount += 1;
      batchOps += 1;

      if (batchOps >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchOps = 0;
      }
    }

    if (batchOps > 0) await batch.commit();

    return { updated: updatedCount };
  };

  const saveFullExamEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingFullExam) return;
    if (!examEditDraft.title.trim()) return alert('اكتب عنوان الامتحان.');
    if (!examEditDraft.accessCode.trim()) return alert('اكتب كود الامتحان.');
    if (!examEditDraft.startTime || !examEditDraft.endTime) return alert('حدد وقت البداية والنهاية.');

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(examEditDraft.questionsText || '[]');
      if (!Array.isArray(parsedQuestions)) throw new Error('questions must be array');
    } catch (err) {
      return alert('صيغة الأسئلة غير صحيحة. يجب أن تكون JSON Array. لو مش متأكد، لا تعدل جزء الأسئلة.');
    }

    const payload = {
      title: examEditDraft.title.trim(),
      grade: examEditDraft.grade,
      duration: safeNumber(examEditDraft.duration, 60),
      startTime: examEditDraft.startTime,
      endTime: examEditDraft.endTime,
      accessCode: examEditDraft.accessCode.trim(),
      isPremium: !!examEditDraft.isPremium,
      questions: parsedQuestions,
      updatedAt: serverTimestamp()
    };

    if (examEditMode === 'direct') {
      if (editingFullExam.hasResults && !window.confirm('هذا الامتحان له نتائج سابقة. التعديل المباشر قد يغير شكل المراجعة والتحليل للنتائج القديمة. هل تريد التعديل المباشر فعلاً؟')) return;
      await updateDoc(doc(db, 'exams', editingFullExam.id), {
        ...payload,
        version: increment(1),
        lastEditMode: 'direct',
        answersLastEditedAt: serverTimestamp()
      });

      if (editingFullExam.hasResults && recalculateAfterExamEdit) {
        const recalc = await recalculateExamResultsAfterAnswerEdit(editingFullExam.id, { ...editingFullExam, ...payload });
        alert(`تم تعديل الامتحان مباشرة وإعادة تصحيح ${recalc.updated} نتيجة قديمة تلقائيًا.`);
      } else {
        alert('تم تعديل الامتحان مباشرة.');
      }
    } else {
      await addDoc(collection(db, 'exams'), {
        ...payload,
        title: payload.title.includes('نسخة') ? payload.title : `${payload.title} - نسخة جديدة`,
        originalExamId: editingFullExam.id,
        clonedFrom: editingFullExam.id,
        version: safeNumber(editingFullExam.version, 1) + 1,
        createdAt: serverTimestamp(),
        source: 'clone_edit'
      });
      alert('تم إنشاء نسخة جديدة من الامتحان بنجاح. النتائج القديمة محفوظة كما هي.');
    }

    setEditingFullExam(null);
  };

  const openFullContentEditor = (item) => {
    const allowedEmailsText = Array.isArray(item.allowedEmails) ? item.allowedEmails.join(', ') : (item.allowedEmails || '');
    setEditingFullContent(item);
    setContentEditMode('direct');
    setContentEditDraft({
      title: item.title || '',
      url: item.url || item.file || '',
      type: item.type || 'video',
      videoSection: item.videoSection || 'explanation',
      grade: item.grade || '3sec',
      isPremium: !!item.isPremium,
      isPublic: !!item.isPublic,
      allowedEmailsText,
      linkedExamId: item.linkedExamId || '',
      estimatedDurationMinutes: item.estimatedDurationMinutes || '',
      branch: item.branch || ''
    });
  };

  const saveFullContentEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingFullContent) return;
    if (!contentEditDraft.title.trim()) return alert('اكتب عنوان المحتوى.');
    if (!contentEditDraft.url.trim()) return alert('أدخل رابط المحتوى.');
    if (contentEditDraft.type === 'video' && contentEditDraft.linkedExamId && safeNumber(contentEditDraft.estimatedDurationMinutes, 0) <= 0) {
      return alert('لو الفيديو مربوط بامتحان لازم تكتب مدة الفيديو بالدقائق.');
    }

    const allowedEmails = contentEditDraft.allowedEmailsText
      ? contentEditDraft.allowedEmailsText.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    const payload = {
      title: contentEditDraft.title.trim(),
      url: contentEditDraft.url.trim(),
      file: contentEditDraft.url.trim(),
      type: contentEditDraft.type,
      videoSection: contentEditDraft.type === 'video' ? contentEditDraft.videoSection : '',
      grade: contentEditDraft.grade,
      isPremium: !!contentEditDraft.isPremium,
      isPublic: !!contentEditDraft.isPublic,
      allowedEmails,
      branch: contentEditDraft.branch || '',
      linkedExamId: contentEditDraft.type === 'video' ? (contentEditDraft.linkedExamId || '') : '',
      estimatedDurationMinutes: contentEditDraft.type === 'video' ? safeNumber(contentEditDraft.estimatedDurationMinutes, 0) : 0,
      videoExamUnlockPercent: contentEditDraft.type === 'video' && contentEditDraft.linkedExamId ? VIDEO_EXAM_UNLOCK_PERCENT : 0,
      updatedAt: serverTimestamp()
    };

    if (contentEditMode === 'direct') {
      await updateDoc(doc(db, 'content', editingFullContent.id), { ...payload, version: increment(1), lastEditMode: 'direct' });
      alert('تم تعديل المحتوى مباشرة.');
    } else {
      await addDoc(collection(db, 'content'), {
        ...payload,
        title: payload.title.includes('نسخة') ? payload.title : `${payload.title} - نسخة جديدة`,
        originalContentId: editingFullContent.id,
        clonedFrom: editingFullContent.id,
        version: safeNumber(editingFullContent.version, 1) + 1,
        createdAt: serverTimestamp(),
        source: 'clone_edit'
      });
      alert('تم إنشاء نسخة جديدة من المحتوى.');
    }

    setEditingFullContent(null);
  };

  const handleApproveSecurityContinue = async (result) => {
    if (!result?.id) return;
    if (!window.confirm(`السماح للطالب ${result.studentName || ''} باستكمال الامتحان بنفس الإجابات والوقت المتبقي؟`)) return;

    const safeRemainingTime = safeNumber(result.remainingTime, safeNumber(result.totalTime, 60) * 60);
    const payload = {
      status: 'in_progress',
      adminDecision: 'continue',
      adminSecurityAction: 'continue',
      securityReleased: true,
      resumeApproved: true,
      resumeApprovedAt: serverTimestamp(),
      remainingTime: safeRemainingTime,
      currentQIndex: safeNumber(result.currentQIndex, 0),
      answers: result.answers || {},
      adminApprovedBy: user.email || user.uid,
      adminApprovedAt: serverTimestamp(),
      antiCheatLog: [
        ...(result.antiCheatLog || []),
        { type: 'admin_allowed_continue', at: new Date().toISOString(), admin: user.email || user.uid }
      ]
    };
    await updateDoc(doc(db, 'exam_results', result.id), payload);
    const updated = { ...result, ...payload, remainingTime: safeRemainingTime, currentQIndex: safeNumber(result.currentQIndex, 0), answers: result.answers || {} };
    setExamResults(prev => prev.map(r => r.id === result.id ? updated : r));
    if (viewingResult?.id === result.id) setViewingResult(updated);
    alert('تم السماح للطالب باستكمال الامتحان. عندما يدخل نفس الامتحان سيظهر له زر الاستكمال ويكمل من نفس الإجابات والوقت المتبقي.');
  };

  const handleApproveSecurityRestart = async (result) => {
    if (!result?.id) return;
    if (!window.confirm(`السماح للطالب ${result.studentName || ''} بإعادة الامتحان من البداية؟ سيتم مسح الإجابات الحالية وإرجاع الوقت كاملًا.`)) return;
    const fullSeconds = safeNumber(result.totalTime, 60) * 60;
    const payload = {
      status: 'in_progress',
      adminDecision: 'restart',
      adminSecurityAction: 'restart',
      securityReleased: true,
      answers: {},
      remainingTime: fullSeconds,
      currentQIndex: 0,
      score: 0,
      total: 0,
      antiCheatWarnings: 0,
      restartCount: increment(1),
      adminApprovedBy: user.email || user.uid,
      adminApprovedAt: serverTimestamp(),
      antiCheatLog: [
        ...(result.antiCheatLog || []),
        { type: 'admin_allowed_restart', at: new Date().toISOString(), admin: user.email || user.uid }
      ]
    };
    await updateDoc(doc(db, 'exam_results', result.id), payload);
    const updated = { ...result, ...payload, restartCount: safeNumber(result.restartCount, 0) + 1 };
    setExamResults(prev => prev.map(r => r.id === result.id ? updated : r));
    if (viewingResult?.id === result.id) setViewingResult(updated);
    alert('تم السماح للطالب بإعادة الامتحان من البداية. عندما يدخل نفس الامتحان سيبدأ بمحاولة جديدة.');
  };

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

  const getEssayDraftKey = (resultId, questionId) => `${resultId}__${questionId}`;

  const handleSaveEssayGrade = async (resultDoc, question, questions) => {
      const draftKey = getEssayDraftKey(resultDoc.id, question.id);
      const rawScoreValue = essayScoreDrafts[draftKey] ?? resultDoc.essayScores?.[question.id] ?? '';
      const rawMaxValue = essayMaxDrafts[draftKey] ?? resultDoc.essayMaxScores?.[question.id] ?? '';

      const scoreValue = Number(rawScoreValue);
      const maxValue = Number(rawMaxValue);

      if (rawScoreValue === '' || rawMaxValue === '' || Number.isNaN(scoreValue) || Number.isNaN(maxValue)) {
          return alert("من فضلك أدخل الدرجة والدرجة النهائية لهذا السؤال.");
      }
      if (maxValue <= 0) {
          return alert("الدرجة النهائية يجب أن تكون أكبر من صفر.");
      }
      if (scoreValue < 0 || scoreValue > maxValue) {
          return alert("درجة الطالب يجب أن تكون بين صفر والدرجة النهائية.");
      }

      const nextEssayScores = { ...(resultDoc.essayScores || {}), [question.id]: scoreValue };
      const nextEssayMaxScores = { ...(resultDoc.essayMaxScores || {}), [question.id]: maxValue };

      const mcqQuestions = questions.filter((q) => q.type !== 'essay');
      const essayQuestions = questions.filter((q) => q.type === 'essay');

      const fallbackMcqScore = mcqQuestions.reduce((sum, q) => (
          resultDoc.answers?.[q.id] === q.correctIdx ? sum + 1 : sum
      ), 0);
      const mcqScore = typeof resultDoc.mcqScore === 'number' ? resultDoc.mcqScore : fallbackMcqScore;

      const essayTotal = essayQuestions.reduce((sum, q) => sum + Number(nextEssayScores[q.id] || 0), 0);
      const essayMaxTotal = essayQuestions.reduce((sum, q) => sum + Number(nextEssayMaxScores[q.id] || 0), 0);

      const reviewedEssayCount = essayQuestions.filter((q) => (
          nextEssayScores[q.id] !== undefined && nextEssayMaxScores[q.id] !== undefined
      )).length;

      const payload = {
          essayScores: nextEssayScores,
          essayMaxScores: nextEssayMaxScores,
          reviewedEssayCount,
          hasEssay: essayQuestions.length > 0,
          score: mcqScore + essayTotal,
          total: mcqQuestions.length + essayMaxTotal,
          essayReviewedAt: serverTimestamp()
      };

      try {
          await updateDoc(doc(db, 'exam_results', resultDoc.id), payload);
          const nextViewingResult = { ...resultDoc, ...payload };
          setViewingResult(nextViewingResult);
          setExamResults((prev) => prev.map((res) => res.id === resultDoc.id ? nextViewingResult : res));
          alert("تم حفظ تصحيح السؤال المقالي بنجاح.");
      } catch (error) {
          console.error("Error saving essay grade:", error);
          alert("حدث خطأ أثناء حفظ التصحيح.");
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

  const handleSendStudentNotification = async (e) => {
      e?.preventDefault?.();
      if(!newStudentNotification.text.trim()) return alert('اكتب نص الإشعار أولاً');
      const title = newStudentNotification.title?.trim() || 'تنبيه من منصة النحاس';
      await addDoc(collection(db, 'notifications'), {
        title,
        text: newStudentNotification.text.trim(),
        body: newStudentNotification.text.trim(),
        grade: newStudentNotification.grade || 'all',
        clickUrl: newStudentNotification.clickUrl || '/',
        pushStatus: 'pending',
        createdAt: serverTimestamp(),
        source: 'admin_manual'
      });
      setNewStudentNotification({ title: '', text: '', grade: newStudentNotification.grade || 'all', clickUrl: '/' });
      alert('تم حفظ الإشعار وسيتم إرساله كتطبيق/موبايل للطلاب المفعّلين للإشعارات بعد تفعيل Cloud Function');
  };

  const handleUpdateUser = async (e) => { 
      e.preventDefault(); 
      if(!editingUser) return; 

      const validation = validateEgyptianPhones(editingUser.phone, editingUser.parentPhone);
      if (!validation.ok) return alert(validation.message);

      await updateDoc(doc(db, 'users', editingUser.id), { 
          name: editingUser.name?.trim(), phone: validation.normalizedStudentPhone, parentPhone: validation.normalizedParentPhone, grade: editingUser.grade 
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

      if (!newContent.title.trim()) return alert('اكتب عنوان المحتوى أولاً.');
      if (!newContent.url.trim()) return alert('أضف رابط المحتوى أو ارفع ملفاً.');
      if (newContent.type === 'video' && newContent.linkedExamId && safeNumber(newContent.estimatedDurationMinutes, 0) <= 0) {
          return alert('مهم: أدخل مدة الفيديو بالدقائق حتى يتم فتح امتحان الفيديو بعد مشاهدة 75% بدقة، خصوصًا مع YouTube.');
      }

      const contentData = { 
          ...newContent, 
          title: newContent.title.trim(),
          url: newContent.url.trim(),
          file: newContent.url.trim(), 
          allowedEmails: allowedEmailsArray,
          linkedExamId: newContent.type === 'video' ? (newContent.linkedExamId || '') : '',
          estimatedDurationMinutes: newContent.type === 'video' ? safeNumber(newContent.estimatedDurationMinutes, 0) : 0,
          videoExamUnlockPercent: newContent.type === 'video' && newContent.linkedExamId ? VIDEO_EXAM_UNLOCK_PERCENT : 0,
          createdAt: new Date() 
      };
      
      await addDoc(collection(db, 'content'), contentData);
      
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), { text: `تم إضافة درس جديد: ${newContent.title}`, grade: newContent.grade, createdAt: serverTimestamp() });
      } 
      
      alert("تم النشر!"); 
      setNewContent({ title: '', url: '', type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '' });
  }; 
  
  const handleDeleteContent = async (id) => { 
      if(window.confirm("حذف هذا المحتوى؟")) await deleteDoc(doc(db, 'content', id)); 
  };

  const startLiveStream = async () => {
      if(!liveData.title?.trim()) return alert("اكتب عنوان المحاضرة.");
      if(!liveData.liveUrl?.trim()) return alert("الرابط مطلوب!");

      const allowedEmailsArray = liveData.allowedEmails
        ? liveData.allowedEmails.split(',').map(email => email.trim()).filter(Boolean)
        : [];

      const rawUrl = normalizeExternalUrl(liveData.liveUrl);
      const autoType = isJitsiLink(rawUrl) ? 'jitsi'
        : isYouTubeLink(rawUrl) ? 'youtube'
        : isZoomLink(rawUrl) ? 'zoom'
        : isMeetLink(rawUrl) ? 'meet'
        : liveData.sessionType || 'external';

      const finalLiveUrl = autoType === 'jitsi' ? normalizeJitsiUrl(rawUrl) : rawUrl;
      const livePayload = {
          ...liveData,
          title: liveData.title.trim(),
          liveUrl: finalLiveUrl,
          embedUrl: normalizeExternalUrl(liveData.embedUrl),
          sessionType: autoType,
          allowedEmails: allowedEmailsArray,
          status: 'active',
          isOptional: true,
          aiEnabled: true,
          liveAiMerged: true,
          createdAt: serverTimestamp()
      };

      const info = getLiveEmbedInfo(livePayload);
      if (!info.canEmbed && (autoType === 'zoom' || autoType === 'meet')) {
        const ok = window.confirm('هذا الرابط Zoom/Meet غالبًا لن يعمل داخل المنصة وسيظهر للطالب زر فتح خارجي. هل تريد نشره؟\n\nللتشغيل داخل المنصة استخدم Jitsi.');
        if (!ok) return;
      }

      await addDoc(collection(db, 'live_sessions'), livePayload);
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), {
            text: `🔴 محاضرة مباشرة الآن: ${liveData.title}`,
            grade: liveData.grade,
            createdAt: serverTimestamp()
          });
      }
      alert("تم نشر المحاضرة في Live + AI!");
      setLiveData({ title: '', liveUrl: '', grade: '3sec', passcode: '', allowedEmails: '', sessionType: 'jitsi', embedUrl: '', scheduledAt: '', isOptional: true });
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
    const blocks = [];
    let currentBlock = { text: '', subQuestions: [] };
    let currentQuestion = null;
    let currentBranch = 'عام';
    let isReadingPassage = false;

    const pushCurrentQuestion = () => {
        if (!currentQuestion) return;

        if (currentQuestion.type === 'essay') {
            currentBlock.subQuestions.push({
                id: currentQuestion.id,
                type: 'essay',
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch,
                modelAnswer: currentQuestion.modelAnswer || ''
            });
            currentQuestion = null;
            return;
        }

        if (currentQuestion.text?.trim() && currentQuestion.options.length >= 2) {
            if (currentQuestion.correctIdx < 0) currentQuestion.correctIdx = 0;
            currentBlock.subQuestions.push({
                ...currentQuestion,
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch
            });
        }
        currentQuestion = null;
    };

    const pushCurrentBlock = () => {
        pushCurrentQuestion();
        if (currentBlock.text.trim() || currentBlock.subQuestions.length > 0) {
            blocks.push({
                text: currentBlock.text.trim(),
                subQuestions: currentBlock.subQuestions
            });
        }
        currentBlock = { text: '', subQuestions: [] };
    };

    lines.forEach((line) => {
        if (!line) {
            pushCurrentQuestion();
            return;
        }

        const branchMatch = line.match(/^#\s*(?:فرع|الفرع)\s*:\s*(.+)$/);
        if (branchMatch) {
            pushCurrentQuestion();
            currentBranch = branchMatch[1].trim() || 'عام';
            return;
        }

        if (line === 'بداية القطعة') {
            pushCurrentBlock();
            isReadingPassage = true;
            return;
        }

        if (line === 'نهاية القطعة') {
            isReadingPassage = false;
            return;
        }

        if (line === 'حذف القطعة') {
            pushCurrentBlock();
            isReadingPassage = false;
            return;
        }

        if (isReadingPassage) {
            currentBlock.text += (currentBlock.text ? '\n' : '') + line;
            return;
        }

        const essayMatch = line.match(/^#?\s*(?:مقالي|essay)\s*[:：\-\)\.]?\s*(.+)$/i);
        if (essayMatch) {
            pushCurrentQuestion();
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'essay',
                text: (essayMatch[1] || '').trim(),
                branch: currentBranch,
                modelAnswer: ''
            };
            return;
        }

        const isCorrect = line.startsWith('*');
        const cleanLine = isCorrect ? line.slice(1).trim() : line.trim();

        if (!currentQuestion) {
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'mcq',
                text: cleanLine.replace(/^(س|سؤال)\s*[:：-]\s*/i, ''),
                options: [],
                correctIdx: -1,
                branch: currentBranch
            };
            return;
        }

        if (currentQuestion.type === 'essay') {
            if (cleanLine.startsWith('نموذج:') || cleanLine.startsWith('إجابة نموذجية:')) {
                currentQuestion.modelAnswer = cleanLine.replace('نموذج:', '').replace('إجابة نموذجية:', '').trim();
            } else {
                currentQuestion.text += '\n' + cleanLine;
            }
            return;
        }

        currentQuestion.options.push(cleanLine);
        if (isCorrect) currentQuestion.correctIdx = currentQuestion.options.length - 1;

        if (currentQuestion.options.length >= 4) {
            pushCurrentQuestion();
        }
    });

    pushCurrentBlock();

    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return alert("لم يتم التعرف على الأسئلة بشكل صحيح. افصل بين كل سؤال بسطر فارغ، واستخدم #فرع: للفروع و #مقالي: للسؤال المقالي.");

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
      await setDoc(doc(db, 'settings', 'leaderboard_config'), { show: !showLeaderboard }, { merge: true });
      setShowLeaderboard(!showLeaderboard);
  };

  const handleAddAutoReply = async () => { alert('تم حذف نظام الرد الآلي نهائيًا.'); };
  const toggleAutoReply = async () => {};
  const deleteAutoReply = async () => {};
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
  const filteredExamResultsForAdmin = examResults.filter(result => {
      const exam = examsList.find(e => e.id === result.examId);
      if (adminGradeFilter !== 'all' && exam?.grade && exam.grade !== adminGradeFilter) return false;
      if (resultsFilter === 'essay_pending') return !!result.hasEssay && getUnreviewedEssayCount(result, exam) > 0;
      if (resultsFilter === 'cheating_alerts') return safeNumber(result.antiCheatWarnings, 0) > 0 || result.status === 'cheated';
      return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      <DebugPanel user={user} />
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


      {adminReviewExamData && adminReviewResult && (
        <ExamRunner
          exam={adminReviewExamData.exam}
          user={adminReviewExamData.user}
          existingResult={adminReviewResult}
          isReviewMode={true}
          onClose={() => {
            setAdminReviewExamData(null);
            setAdminReviewResult(null);
          }}
        />
      )}

      {editingFullExam && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Edit size={22}/> تعديل الامتحان بالكامل</h3>
              <button onClick={() => setEditingFullExam(null)} className="text-slate-400 hover:text-red-600"><X size={26}/></button>
            </div>

            {editingFullExam.hasResults && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-sm font-bold leading-relaxed">
                هذا الامتحان له نتائج طلاب سابقة. عند تعديل الإجابات الصحيحة يمكنك إعادة تصحيح نتائج الطلاب تلقائيًا بناءً على الإجابات الجديدة.
              </div>
            )}

            {editingFullExam.hasResults && examEditMode === 'direct' && (
              <label className="mb-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl font-bold cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={recalculateAfterExamEdit}
                  onChange={e => setRecalculateAfterExamEdit(e.target.checked)}
                />
                <span>
                  إعادة تصحيح نتائج الطلاب القديمة تلقائيًا بعد حفظ التعديل
                  <span className="block text-xs font-normal mt-1 text-emerald-700">
                    استخدم هذا الخيار عند تعديل الإجابة الصحيحة أو درجة السؤال. سيعاد حساب الدرجة والفروع والتحليل لكل طالب حل الامتحان.
                  </span>
                </span>
              </label>
            )}

            <form onSubmit={saveFullExamEdit} className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={examEditMode === 'direct'} onChange={() => setExamEditMode('direct')} />
                  تعديل مباشر
                </label>
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={examEditMode === 'clone'} onChange={() => setExamEditMode('clone')} />
                  إنشاء نسخة جديدة آمنة
                </label>
                <label className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 font-bold text-amber-800">
                  <input type="checkbox" checked={examEditDraft.isPremium} onChange={e => setExamEditDraft({...examEditDraft, isPremium: e.target.checked})} />
                  VIP فقط
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border p-3 rounded-xl" placeholder="عنوان الامتحان" value={examEditDraft.title} onChange={e => setExamEditDraft({...examEditDraft, title: e.target.value})} />
                <select className="border p-3 rounded-xl" value={examEditDraft.grade} onChange={e => setExamEditDraft({...examEditDraft, grade: e.target.value})}><GradeOptions/></select>
                <input type="number" className="border p-3 rounded-xl" placeholder="المدة بالدقائق" value={examEditDraft.duration} onChange={e => setExamEditDraft({...examEditDraft, duration: e.target.value})} />
                <input className="border p-3 rounded-xl" placeholder="كود الامتحان" value={examEditDraft.accessCode} onChange={e => setExamEditDraft({...examEditDraft, accessCode: e.target.value})} />
                <input type="datetime-local" className="border p-3 rounded-xl" value={examEditDraft.startTime} onChange={e => setExamEditDraft({...examEditDraft, startTime: e.target.value})} />
                <input type="datetime-local" className="border p-3 rounded-xl" value={examEditDraft.endTime} onChange={e => setExamEditDraft({...examEditDraft, endTime: e.target.value})} />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <label className="block font-black text-slate-800 mb-1">تصحيح الإجابات من داخل المنصة</label>
                    <p className="text-xs text-slate-500">غيّر الإجابة الصحيحة أو درجة السؤال من هنا بدون كتابة كود. المادة/النص والامتحان يظلوا كما هم إلا لو عدلتهم بنفسك.</p>
                  </div>
                  <span className="bg-white border px-3 py-1 rounded-full text-xs font-bold text-slate-600">{examEditQuestionsPreview.length} سؤال</span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {examEditQuestionsPreview.length === 0 ? (
                    <div className="bg-white border border-dashed rounded-xl p-5 text-center text-slate-400 font-bold">
                      لا يمكن عرض محرر الأسئلة لأن صيغة الأسئلة غير مقروءة.
                    </div>
                  ) : examEditQuestionsPreview.map((q, idx) => (
                    <div key={`${q.blockIndex}-${q.questionIndex}-${q.id || idx}`} className="bg-white border rounded-xl p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-[220px]">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-bold">سؤال {idx + 1}</span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">{q.branch || 'عام'}</span>
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold">{q.type === 'essay' ? 'مقالي' : 'اختياري'}</span>
                          </div>
                          <p className="font-bold text-slate-800 leading-relaxed">{String(q.text || '').replaceAll('|', ' / ')}</p>
                        </div>
                      </div>

                      {q.type === 'essay' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">درجة السؤال المقالي من</span>
                            <input
                              type="number"
                              min="0"
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.maxScore ?? q.mark ?? 10}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { maxScore: safeNumber(e.target.value, 10), mark: safeNumber(e.target.value, 10) })}
                            />
                          </label>
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">نموذج إجابة مختصر</span>
                            <input
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.modelAnswer || ''}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { modelAnswer: e.target.value })}
                              placeholder="اختياري"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">الإجابة الصحيحة</span>
                            <select
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.correctIdx ?? 0}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { correctIdx: safeNumber(e.target.value, 0) })}
                            >
                              {(Array.isArray(q.options) ? q.options : []).map((opt, optIdx) => (
                                <option key={optIdx} value={optIdx}>{optIdx + 1} - {opt}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-xs font-bold text-slate-500">درجة السؤال</span>
                            <input
                              type="number"
                              min="0"
                              className="w-full border rounded-xl p-3 mt-1"
                              value={q.maxScore ?? q.mark ?? 1}
                              onChange={e => updateQuestionInExamDraft(q.blockIndex, q.questionIndex, { maxScore: safeNumber(e.target.value, 1), mark: safeNumber(e.target.value, 1) })}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <details className="bg-white border rounded-2xl p-4">
                  <summary className="cursor-pointer font-bold text-slate-700">تعديل متقدم للأسئلة بصيغة JSON</summary>
                  <p className="text-xs text-slate-500 my-2">استخدمه فقط لو عايز تعدل نص السؤال أو الاختيارات أو الفروع بشكل متقدم.</p>
                  <textarea className="w-full border rounded-xl p-3 min-h-[320px] font-mono text-xs text-left direction-ltr" dir="ltr" value={examEditDraft.questionsText} onChange={e => setExamEditDraft({...examEditDraft, questionsText: e.target.value})} />
                </details>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700">حفظ</button>
                <button type="button" onClick={() => setEditingFullExam(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black hover:bg-slate-300">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingFullContent && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Edit size={22}/> تعديل المحتوى بالكامل</h3>
              <button onClick={() => setEditingFullContent(null)} className="text-slate-400 hover:text-red-600"><X size={26}/></button>
            </div>

            <form onSubmit={saveFullContentEdit} className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={contentEditMode === 'direct'} onChange={() => setContentEditMode('direct')} />
                  تعديل مباشر
                </label>
                <label className="bg-slate-50 border rounded-xl p-3 flex items-center gap-2 font-bold">
                  <input type="radio" checked={contentEditMode === 'clone'} onChange={() => setContentEditMode('clone')} />
                  إنشاء نسخة جديدة
                </label>
                <label className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 font-bold text-amber-800">
                  <input type="checkbox" checked={contentEditDraft.isPremium} onChange={e => setContentEditDraft({...contentEditDraft, isPremium: e.target.checked})} />
                  VIP فقط
                </label>
              </div>

              <input className="border p-3 rounded-xl" placeholder="العنوان" value={contentEditDraft.title} onChange={e => setContentEditDraft({...contentEditDraft, title: e.target.value})} />
              <input className="border p-3 rounded-xl" placeholder="الرابط / رابط الفيديو / رابط الملف" value={contentEditDraft.url} onChange={e => setContentEditDraft({...contentEditDraft, url: e.target.value})} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="border p-3 rounded-xl" value={contentEditDraft.type} onChange={e => setContentEditDraft({...contentEditDraft, type: e.target.value})}>
                  <option value="video">فيديو مدمج</option><option value="file">ملف PDF</option><option value="html">HTML تفاعلي</option><option value="interactive_exam">امتحان تفاعلي</option><option value="link">رابط خارجي</option>
                </select>
                <select className="border p-3 rounded-xl" value={contentEditDraft.grade} onChange={e => setContentEditDraft({...contentEditDraft, grade: e.target.value})}><GradeOptions/></select>
                <input className="border p-3 rounded-xl" placeholder="الفرع" value={contentEditDraft.branch} onChange={e => setContentEditDraft({...contentEditDraft, branch: e.target.value})} />
              </div>

              {contentEditDraft.type === 'video' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <select className="border p-3 rounded-xl bg-white" value={contentEditDraft.videoSection} onChange={e => setContentEditDraft({...contentEditDraft, videoSection: e.target.value})}>
                    <option value="explanation">شرح الدرس</option><option value="exercises">حل التدريبات</option><option value="reviews">مراجعة نهائية</option>
                  </select>
                  <select className="border p-3 rounded-xl bg-white" value={contentEditDraft.linkedExamId} onChange={e => setContentEditDraft({...contentEditDraft, linkedExamId: e.target.value})}>
                    <option value="">بدون امتحان مرتبط</option>
                    {examsList.filter(exam => !contentEditDraft.grade || exam.grade === contentEditDraft.grade).map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                  </select>
                  <input type="number" min="1" className="border p-3 rounded-xl bg-white" placeholder="مدة الفيديو بالدقائق" value={contentEditDraft.estimatedDurationMinutes} onChange={e => setContentEditDraft({...contentEditDraft, estimatedDurationMinutes: e.target.value})} />
                </div>
              )}

              <textarea className="border p-3 rounded-xl min-h-[80px]" placeholder="إيميلات مسموحة مفصولة بفاصلة، أو اتركها فارغة للجميع" value={contentEditDraft.allowedEmailsText} onChange={e => setContentEditDraft({...contentEditDraft, allowedEmailsText: e.target.value})} />
              <label className="flex items-center gap-2 bg-slate-50 border rounded-xl p-3 font-bold"><input type="checkbox" checked={contentEditDraft.isPublic} onChange={e => setContentEditDraft({...contentEditDraft, isPublic: e.target.checked})}/> يظهر للزوار في الصفحة الرئيسية</label>

              <div className="flex flex-col md:flex-row gap-3">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black hover:bg-emerald-700">حفظ</button>
                <button type="button" onClick={() => setEditingFullContent(null)} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black hover:bg-slate-300">إلغاء</button>
              </div>
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
                                  <h3 className="font-bold text-lg mb-4 text-amber-800 flex items-center gap-2 border-b pb-2"><QrCode/> سجل الواجبات</h3>
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
          {['dashboard', 'users', 'all_users', 'subscriptions', 'payments', 'security_center', 'ai_analytics', 'live_ai', 'app_convert', 'ai_lab', 'ai_insights', 'leaderboard', 'question_bank', 'assignments', 'exams', 'results', 'analytics', 'question-analytics', 'smart_hw', 'content', 'notifications', 'student-messages', 'messages'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 transition-all ${activeTab===tab?'bg-amber-100 text-amber-700 shadow-sm border-b-4 md:border-b-0 md:border-r-4 border-amber-500':'hover:bg-slate-50 text-slate-600'}`}>
              {tab === 'dashboard' ? 'Dashboard' : tab === 'users' ? 'الطلبات' : tab === 'all_users' ? 'الطلاب' : tab === 'subscriptions' ? 'أكواد الاشتراكات' : tab === 'payments' ? 'طلبات الدفع' : tab === 'security_center' ? 'مركز الحماية' : tab === 'ai_analytics' ? 'تحليلات AI' : tab === 'live_ai' ? 'البث المباشر + Live AI' : tab === 'app_convert' ? 'تحويل App' : tab === 'ai_lab' ? 'AI Lab' : tab === 'ai_insights' ? 'AI Insights' : tab === 'leaderboard' ? 'لوحة الشرف' : tab === 'question_bank' ? 'بنك الأسئلة' : tab === 'assignments' ? 'الواجبات' : tab === 'exams' ? 'الامتحانات' : tab === 'results' ? 'النتائج' : tab === 'analytics' ? 'تحليل الطلاب' : tab === 'question-analytics' ? 'تحليل الأسئلة' : tab === 'smart_hw' ? 'الواجب الذكي (QR)' : tab === 'live' ? 'البث' : tab === 'content' ? 'المحتوى' : tab === 'notifications' ? 'إشعارات الطلاب' : tab === 'student-messages' ? 'رسائل الطلاب' : tab === 'messages' ? 'الرسائل' : 'الإعدادات'}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 w-full overflow-hidden">
          {activeTab === 'dashboard' && <AdminProDashboard users={activeUsersList} exams={examsList} results={examResults} content={contentList} subscriptionCodes={subscriptionCodes} liveSessions={activeLiveSessions} hwResults={hwResults} adminGradeFilter={adminGradeFilter} />}

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
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف الطالب</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.phone || ''} onChange={e=>setEditingUser({...editingUser, phone: normalizeEgyptPhone(e.target.value)})} required/></div>
                                  <div><label className="block text-sm font-bold mb-1 text-slate-700">رقم هاتف ولي الأمر</label><input type="tel" className="w-full border-2 border-blue-100 p-3 rounded-xl bg-blue-50 focus:border-blue-500 outline-none transition" value={editingUser.parentPhone || ''} onChange={e=>setEditingUser({...editingUser, parentPhone: normalizeEgyptPhone(e.target.value)})} required/></div>
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
            <SmartSubscriptionManager users={activeUsersList} adminGradeFilter={adminGradeFilter} />
          )}

          {activeTab === 'subscriptions_legacy' && (
              <div className="space-y-6">
                  {(() => {
                    const unusedCodes = subscriptionCodes.filter(c => !c.used);
                    const usedCodesList = subscriptionCodes.filter(c => c.used);
                    const premiumStudents = filteredActiveUsers.filter(u => u.subscriptionStatus === 'premium');
                    const expiringSoon = premiumStudents.filter(u => {
                      const d = u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : null;
                      return d && d > new Date() && (d.getTime() - Date.now()) / (1000*60*60*24) <= 7;
                    });
                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4"><p className="text-sm font-bold text-amber-700">أكواد متاحة</p><p className="text-3xl font-black text-amber-900">{unusedCodes.length}</p></div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4"><p className="text-sm font-bold text-emerald-700">أكواد مستخدمة</p><p className="text-3xl font-black text-emerald-900">{usedCodesList.length}</p></div>
                          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4"><p className="text-sm font-bold text-blue-700">طلاب VIP</p><p className="text-3xl font-black text-blue-900">{premiumStudents.length}</p></div>
                          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-sm font-bold text-red-700">ينتهي خلال 7 أيام</p><p className="text-3xl font-black text-red-900">{expiringSoon.length}</p></div>
                        </div>

                        <div className="glass-panel p-4 md:p-6 rounded-xl border-t-4 border-amber-500">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                            <div>
                              <h2 className="text-xl font-bold flex items-center gap-2 text-amber-700"><Key/> نظام الاشتراكات وكروت الشحن</h2>
                              <p className="text-sm text-slate-500 mt-1">ولّد أكواد، انسخها، صدّرها CSV، وراقب الطلاب المشتركين.</p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-2">
                              <button onClick={copyUnusedSubscriptionCodes} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><ClipboardList size={16}/> نسخ الأكواد الجديدة</button>
                              <button onClick={exportSubscriptionCodesCSV} className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={16}/> تصدير CSV</button>
                              <button onClick={extendPremiumForAll} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><Crown size={16}/> تمديد VIP</button>
                            </div>
                          </div>

                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                              <p className="text-sm text-amber-800 font-bold mb-4">هذه الأكواد يمكن طباعتها أو إرسالها للطلاب لتفعيل باقة VIP فورًا عند إدخال الكود من صفحة الاشتراك.</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأكواد المطلوبة</label>
                                      <input type="number" min="1" className="w-full border p-3 rounded-lg" value={codeGenCount} onChange={e=>setCodeGenCount(e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-600 mb-1">مدة الاشتراك بالأيام</label>
                                      <input type="number" min="1" className="w-full border p-3 rounded-lg" value={codeGenDays} onChange={e=>setCodeGenDays(e.target.value)} />
                                  </div>
                                  <div className="flex items-end">
                                      <button onClick={generateSubscriptionCodes} className="w-full bg-amber-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-amber-700 transition">توليد الأكواد</button>
                                  </div>
                              </div>
                          </div>

                          {expiringSoon.length > 0 && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
                              <h3 className="font-black text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={18}/> اشتراكات قربت تنتهي</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {expiringSoon.map(s => <div key={s.id} className="bg-white rounded-xl p-3 border"><p className="font-bold">{s.name || s.email}</p><p className="text-xs text-red-600">ينتهي: {s.subscriptionExpiry?.toDate?.().toLocaleDateString('ar-EG')}</p></div>)}
                              </div>
                            </div>
                          )}

                          <div className="overflow-x-auto">
                              <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm text-sm whitespace-nowrap">
                                  <thead className="bg-slate-800 text-white">
                                      <tr>
                                          <th className="p-3 text-right">الكود</th>
                                          <th className="p-3 text-center">المدة</th>
                                          <th className="p-3 text-center">الحالة</th>
                                          <th className="p-3 text-right">استخدم بواسطة</th>
                                          <th className="p-3 text-center">تاريخ الاستخدام</th>
                                          <th className="p-3 text-center">إجراء</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {subscriptionCodes.map((code) => (
                                          <tr key={code.id} className={`border-b ${code.used ? 'bg-red-50 opacity-70' : 'hover:bg-slate-50'}`}>
                                              <td className="p-3 font-mono font-black text-blue-700 select-all">{code.code}</td>
                                              <td className="p-3 text-center font-bold">{code.days} يوم</td>
                                              <td className="p-3 text-center">
                                                  {code.used ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">مُستخدم</span> : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">جديد</span>}
                                              </td>
                                              <td className="p-3 text-slate-600">{code.usedBy || '-'}</td>
                                              <td className="p-3 text-center text-slate-500">{code.usedAt?.toDate ? code.usedAt.toDate().toLocaleString('ar-EG') : '-'}</td>
                                              <td className="p-3 text-center">
                                                  <button onClick={() => navigator.clipboard.writeText(code.code)} className="text-blue-600 hover:bg-blue-100 p-2 rounded ml-1"><ClipboardList size={16}/></button>
                                                  <button onClick={() => handleDeleteCode(code.id)} className="text-red-500 hover:bg-red-100 p-2 rounded"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                      {subscriptionCodes.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">لم يتم توليد أي أكواد بعد.</td></tr>}
                                  </tbody>
                              </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
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

          {activeTab === 'question_bank' && <QuestionBankManager adminGradeFilter={adminGradeFilter} />}

          {activeTab === 'assignments' && <AssignmentsManager adminGradeFilter={adminGradeFilter} />}

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
                          <textarea className="w-full border p-4 rounded-lg h-96 font-mono text-sm" placeholder="اكتب الأسئلة هنا...&#10;(هام 1: افصل بين كل سؤال والذي يليه بسطر فارغ تماماً، وضع علامة * قبل الإجابة الصحيحة)&#10;(هام 2: لتحديد فرع، اكتب #فرع: اسم_الفرع في سطر لوحده)&#10;(هام 3: للسؤال المقالي اكتب #مقالي: نص السؤال)" value={bulkText} onChange={e=>setBulkText(e.target.value)}/>
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
                                          <button onClick={() => openFullExamEditor(exam)} className="text-emerald-600 p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200" title="تعديل كامل / نسخة جديدة"><Edit size={18}/></button>
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

          {activeTab === 'analytics' && <AdminPerformanceAnalytics examResults={examResults} examsList={examsList} users={activeUsersList} adminGradeFilter={adminGradeFilter} />}

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
                       {(['security_hold', 'in_progress', 'cheated'].includes(viewingResult.status) && !['continue', 'restart', 'continue_consumed', 'restart_consumed'].includes(viewingResult.adminDecision)) && (
                         <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
                           <p className="font-black mb-2 flex items-center gap-2"><ShieldAlert size={18}/> هذه المحاولة تحتاج قرار الأدمن</p>
                           <p className="text-sm font-bold mb-3">يمكنك السماح للطالب بالاستكمال من نفس الإجابات والوقت المتبقي، أو السماح بإعادة الامتحان من البداية.</p>
                           <div className="flex flex-col md:flex-row gap-2">
                             <button onClick={() => handleApproveSecurityContinue(viewingResult)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">السماح بالاستكمال</button>
                             <button onClick={() => handleApproveSecurityRestart(viewingResult)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700">السماح بالإعادة من البداية</button>
                           </div>
                         </div>
                       )}
                       {viewingResult.hasEssay && (
                           <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl font-bold text-sm">
                               هذا الامتحان يحتوي على أسئلة مقالية، ويمكنك تصحيح كل سؤال يدويًا وتحديد الدرجة النهائية له من نفس الصفحة.
                           </div>
                       )}
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
                                                   {q.type === 'essay' ? (
                                                       <div className="space-y-4">
                                                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                               <p className="font-bold text-slate-800 mb-2">إجابة الطالب النصية</p>
                                                               <p className="whitespace-pre-wrap text-slate-700">
                                                                   {typeof viewingResult.answers?.[q.id] === 'object'
                                                                       ? (viewingResult.answers?.[q.id]?.text || 'لم يكتب الطالب إجابة نصية')
                                                                       : (viewingResult.answers?.[q.id] || 'لم يكتب الطالب إجابة نصية')}
                                                               </p>
                                                           </div>
                                                           {typeof viewingResult.answers?.[q.id] === 'object' && viewingResult.answers?.[q.id]?.image && (
                                                               <div className="bg-white border border-slate-200 rounded-xl p-4">
                                                                   <p className="font-bold text-slate-800 mb-3">الصورة المرفوعة</p>
                                                                   <img src={viewingResult.answers[q.id].image} alt="إجابة مقالية" className="max-h-96 rounded-xl border border-slate-200 mx-auto" />
                                                               </div>
                                                           )}
                                                           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                               <p className="font-bold text-amber-800 mb-3">تصحيح السؤال المقالي</p>
                                                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                   <input
                                                                       type="number"
                                                                       min="0"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="درجة الطالب"
                                                                       value={essayScoreDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayScoreDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <input
                                                                       type="number"
                                                                       min="0.5"
                                                                       step="0.5"
                                                                       className="border p-3 rounded-lg"
                                                                       placeholder="من كام"
                                                                       value={essayMaxDrafts[getEssayDraftKey(viewingResult.id, q.id)] ?? (viewingResult.essayMaxScores?.[q.id] ?? '')}
                                                                       onChange={(e) => setEssayMaxDrafts((prev) => ({ ...prev, [getEssayDraftKey(viewingResult.id, q.id)]: e.target.value }))}
                                                                   />
                                                                   <button
                                                                       onClick={() => handleSaveEssayGrade(viewingResult, q, questions)}
                                                                       className="bg-amber-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-amber-700 transition"
                                                                   >
                                                                       حفظ التصحيح
                                                                   </button>
                                                               </div>
                                                               {(viewingResult.essayScores?.[q.id] !== undefined && viewingResult.essayMaxScores?.[q.id] !== undefined) && (
                                                                   <p className="text-sm text-amber-900 mt-3 font-bold">
                                                                       الدرجة المحفوظة: {viewingResult.essayScores[q.id]} / {viewingResult.essayMaxScores[q.id]}
                                                                   </p>
                                                               )}
                                                           </div>
                                                       </div>
                                                   ) : (
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
                                                   )}
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
                                   <div>
                                       <p className="font-bold flex items-center gap-2">
                                           {res.studentName}
                                           {res.hasEssay && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">مقالي</span>}
                                       </p>
                                       <p className="text-xs text-slate-500">
                                           {res.status==='security_hold'
                                             ? 'موقوف أمنيًا في انتظار قرار الأدمن 🛡️'
                                             : res.status==='cheated'
                                               ? 'غش 🚫'
                                               : res.status==='in_progress'
                                                 ? 'قيد التنفيذ (لم يسلم) ⏳'
                                                 : `درجة: ${res.score}/${res.total}`}
                                       </p>
                                   </div>
                                   <div className="flex gap-2 flex-wrap justify-end">
                                      {(['security_hold', 'in_progress', 'cheated'].includes(res.status) && !['continue', 'restart', 'continue_consumed', 'restart_consumed'].includes(res.adminDecision)) && (
                                        <>
                                          <button onClick={()=>handleApproveSecurityContinue(res)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">السماح بالاستكمال</button>
                                          <button onClick={()=>handleApproveSecurityRestart(res)} className="bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-amber-700">السماح بالإعادة</button>
                                        </>
                                      )}
                                      {res.status === 'completed' && <button onClick={()=>sendWhatsAppToParent(res)} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-200"><MessageCircle size={14}/><span className="hidden md:inline"> إرسال لولي الأمر</span></button>}
                                      <button onClick={()=>setViewingResult(res)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-xs font-bold">التفاصيل</button>
                                      <button onClick={()=>openAdminResultReview(res)} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Eye size={14}/> مراجعة الامتحان</button>
                                      <button onClick={()=>handleDeleteResult(res.id)} className="bg-amber-100 text-amber-600 px-3 py-1 rounded text-xs font-bold">إعادة</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
             </div>
          )}

          
          
          
          
          
          {activeTab === 'payments' && (
            <AdminPaymentRequestsPanel users={activeUsersList} />
          )}

          {activeTab === 'security_center' && (
            <AdvancedAntiCheatInsights examResults={examResults} />
          )}

          
          {activeTab === 'ai_analytics' && (
            <AdminAIUsageAnalytics users={activeUsersList} />
          )}


          {false && activeTab === 'live_ai' && (
            <LiveSessionsAdminPanel adminGradeFilter={adminGradeFilter} />
          )}

{activeTab === 'app_convert' && (
            <AppConversionGuidePanel />
          )}

{activeTab === 'ai_lab' && (
            <div className="space-y-6">
              <AIQuestionGeneratorPanel />
              <AIExamBuilderPanel />
            </div>
          )}

{activeTab === 'ai_insights' && (
            <AdminAIInsightsPanel examResults={examResults} examsList={examsList} content={contentList || []} />
          )}

{activeTab === 'leaderboard' && (
            <LeaderboardPanel examResults={examResults} users={activeUsersList} gradeFilter={adminGradeFilter} />
          )}

{activeTab === 'question-analytics' && (
            <AdminQuestionDeepAnalytics examsList={examsList} examResults={examResults} />
          )}

          {activeTab === 'live_ai' && (
              <div className="space-y-6">
                <div className="glass-panel p-4 md:p-8 rounded-xl border-t-4 border-red-600">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                      <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 text-red-600 font-arabic"><Radio size={32}/> المحاضرات المباشرة + Live AI</h2>
                        <p className="text-sm text-slate-500 mt-1">تم دمج صفحة البث المباشر مع Live AI في مكان واحد. الطالب يدخل اختياريًا، ويسأل AI من نفس نافذة المحاضرة.</p>
                      </div>
                      <span className="bg-fuchsia-50 text-fuchsia-700 px-4 py-2 rounded-full font-bold text-sm">Live + AI مدمج</span>
                    </div>

                    <div className="grid gap-4 mb-8 bg-white/70 border border-red-100 rounded-2xl p-4">
                        <input className="border p-3 rounded-xl w-full" placeholder="عنوان المحاضرة، مثال: بث مباشر نحو - تالتة ثانوي" value={liveData.title} onChange={e=>setLiveData({...liveData, title:e.target.value})}/>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select className="border p-3 rounded-xl w-full" value={liveData.sessionType} onChange={e=>setLiveData({...liveData, sessionType:e.target.value})}>
                              <option value="jitsi">Jitsi داخل المنصة - الأفضل</option>
                              <option value="youtube">YouTube Live داخل المنصة</option>
                              <option value="zoom">Zoom رابط خارجي</option>
                              <option value="meet">Google Meet رابط خارجي</option>
                              <option value="external">رابط خارجي / عام</option>
                          </select>
                          <select className="border p-3 rounded-xl w-full" value={liveData.grade} onChange={e=>setLiveData({...liveData, grade:e.target.value})}><GradeOptions/></select>
                        </div>

                        <input className="border p-3 rounded-xl w-full" placeholder="رابط المحاضرة الأساسي: Jitsi / YouTube / Zoom / Meet" value={liveData.liveUrl} onChange={e=>setLiveData({...liveData, liveUrl:e.target.value})}/>
                        <input className="border p-3 rounded-xl w-full" placeholder="رابط Embed اختياري داخل المنصة - اتركه فارغًا غالبًا" value={liveData.embedUrl} onChange={e=>setLiveData({...liveData, embedUrl:e.target.value})}/>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input type="datetime-local" className="border p-3 rounded-xl w-full" value={liveData.scheduledAt} onChange={e=>setLiveData({...liveData, scheduledAt:e.target.value})}/>
                          <input className="border p-3 rounded-xl w-full" placeholder="كود دخول اختياري" value={liveData.passcode} onChange={e=>setLiveData({...liveData, passcode:e.target.value})}/>
                          <input className="border p-3 rounded-xl w-full" placeholder="إيميلات مخصصة اختياري" value={liveData.allowedEmails} onChange={e=>setLiveData({...liveData, allowedEmails:e.target.value})}/>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-sm font-bold">
                            ✅ Jitsi يفتح داخل المنصة: https://meet.jit.si/nahhas-live-room — وتم تعطيل تحويل الطالب للتطبيق
                          </div>
                          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-sm font-bold">
                            ✅ YouTube: ضع رابط الفيديو العادي أو embed وسيتم تحويله تلقائيًا.
                          </div>
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-sm font-bold">
                            ⚠️ Zoom/Meet العادي لا يظهر داخل المنصة، وسيظهر زر فتح خارجي للطالب.
                          </div>
                        </div>

                        <button onClick={startLiveStream} className="bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30 w-full md:w-auto">نشر محاضرة Live + AI</button>
                    </div>

                    {filteredLiveSessions.length > 0 && (
                        <div className="mt-8 border-t pt-6">
                            <h3 className="font-bold mb-4">المحاضرات المباشرة الحالية</h3>
                            <div className="space-y-3">
                                {filteredLiveSessions.map(session => {
                                  const info = getLiveEmbedInfo(session);
                                  return (
                                    <div key={session.id} className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col md:flex-row gap-4 justify-between md:items-center">
                                        <div>
                                          <p className="font-bold text-red-800">{session.title} <span className="text-xs bg-red-200 px-2 py-1 rounded-full text-red-700">{getGradeLabel(session.grade)}</span></p>
                                          <p className="text-xs text-red-600 mt-1">النوع: {session.sessionType || info.type} {session.scheduledAt ? `• الموعد: ${new Date(session.scheduledAt).toLocaleString('ar-EG')}` : ''}</p>
                                          <p className="text-xs mt-1 font-bold">{info.canEmbed ? '✅ يعمل داخل المنصة' : '⚠️ يفتح خارجيًا'}</p>
                                          {session.passcode && <p className="text-xs text-red-600 mt-1">كود الدخول: {session.passcode}</p>}
                                        </div>
                                        <button onClick={() => stopLiveStream(session.id)} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 transition">إنهاء المحاضرة</button>
                                    </div>
                                  )
                                })}
                            </div>
                        </div>
                    )}
                </div>
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

                      {newContent.type === 'video' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <div>
                                  <label className="block text-sm font-bold text-blue-800 mb-1">ربط الفيديو بامتحان</label>
                                  <select
                                      className="border p-3 rounded w-full bg-white"
                                      value={newContent.linkedExamId || ''}
                                      onChange={(e) => setNewContent({ ...newContent, linkedExamId: e.target.value })}
                                  >
                                      <option value="">بدون امتحان مرتبط</option>
                                      {examsList
                                          .filter(exam => !newContent.grade || exam.grade === newContent.grade)
                                          .map(exam => (
                                              <option key={exam.id} value={exam.id}>{exam.title}</option>
                                          ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-blue-800 mb-1">مدة الفيديو بالدقائق</label>
                                  <input
                                      type="number"
                                      min="1"
                                      className="border p-3 rounded w-full bg-white"
                                      placeholder="مثال: 30"
                                      value={newContent.estimatedDurationMinutes || ''}
                                      onChange={(e) => setNewContent({ ...newContent, estimatedDurationMinutes: e.target.value })}
                                  />
                              </div>
                              <div className="md:col-span-2 bg-white/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 font-bold leading-relaxed">
                                  عند ربط الفيديو بامتحان لن يظهر زر دخول الامتحان للطالب إلا بعد مشاهدة {VIDEO_EXAM_UNLOCK_PERCENT}% من الفيديو.
                                  مع فيديوهات YouTube يجب إدخال مدة الفيديو يدويًا حتى يتم حساب النسبة بشكل صحيح.
                              </div>
                          </div>
                      )}

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
                                  <div className="flex gap-2">
                                      <button onClick={() => openFullContentEditor(c)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded" title="تعديل كامل / نسخة جديدة"><Edit size={18}/></button>
                                      <button onClick={() => handleDeleteContent(c.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}


          {activeTab === 'student-messages' && <AdminStudentMessaging users={activeUsersList} adminGradeFilter={adminGradeFilter} />}

          {activeTab === 'notifications' && (
            <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Bell className="text-amber-600"/> إرسال إشعار للطلاب</h2>
                <p className="text-sm text-slate-500 mt-1">الإشعار سيظهر داخل منصة الطالب فقط بدون طلب صلاحيات من المتصفح.</p>
              </div>
              <form onSubmit={handleSendStudentNotification} className="grid gap-4 bg-white border rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="border p-3 rounded-xl" placeholder="عنوان الإشعار مثل: امتحان جديد" value={newStudentNotification.title} onChange={e=>setNewStudentNotification({...newStudentNotification, title:e.target.value})} />
                  <select className="border p-3 rounded-xl" value={newStudentNotification.grade} onChange={e=>setNewStudentNotification({...newStudentNotification, grade:e.target.value})}>
                    <option value="all">كل الطلاب</option>
                    <GradeOptions />
                  </select>
                </div>
                <textarea className="border p-3 rounded-xl min-h-[120px]" placeholder="اكتب نص الإشعار... مثال: تم فتح امتحان فيديو جديد" value={newStudentNotification.text} onChange={e=>setNewStudentNotification({...newStudentNotification, text:e.target.value})} />
                <input className="border p-3 rounded-xl" placeholder="رابط الفتح داخل المنصة / اتركه /" value={newStudentNotification.clickUrl} onChange={e=>setNewStudentNotification({...newStudentNotification, clickUrl:e.target.value})} />
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-sm font-bold">
                  ملاحظة: الإشعار يظهر داخل المنصة فورًا كتنبيه داخلي للطالب.
                </div>
                <button className="bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 flex items-center justify-center gap-2"><Send size={18}/> إرسال الإشعار</button>
              </form>
              <div className="bg-slate-50 border rounded-2xl p-4">
                <h3 className="font-bold text-slate-700 mb-3">آخر الإشعارات</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {announcements.length === 0 ? <p className="text-slate-400 text-sm">لا توجد تنبيهات عامة بعد.</p> : announcements.slice(0, 10).map(item => <div key={item.id} className="bg-white border rounded-xl p-3 text-sm text-slate-700">{item.text}</div>)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && <StudentMessagesPanel user={user} userData={userData} />}

          {/* تم حذف صفحة الرد الآلي وإدارة الحكم من لوحة الأدمن */}
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ user, userData, installPrompt }) => {
  userData = userData || {
    name: user?.displayName || user?.email?.split('@')?.[0] || 'طالب',
    email: user?.email || '',
    grade: '1sec',
    phone: '',
    parentPhone: '',
    role: 'student',
    status: 'pending',
    subscriptionStatus: 'free',
    subscriptionExpiry: null
  };
  userData.name = userData?.name || user?.displayName || user?.email?.split('@')?.[0] || 'طالب';
  userData.grade = userData?.grade || '1sec';
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
  const [assignments, setAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [videoViews, setVideoViews] = useState([]);
  const [reviewingExam, setReviewingExam] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [pushStatus, setPushStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
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

    const unsubContent = onSnapshot(query(collection(db, 'content'), where('grade', '==', userData?.grade)), s => {
        const allContent = s.docs.map(d=>({id:d.id,...d.data()}));
        const visibleContent = allContent.filter(c => { if (!c.allowedEmails || c.allowedEmails.length === 0) return true; return c.allowedEmails.includes(user.email); });
        setContent(visibleContent);
    }, error => { console.warn('content listener blocked:', error?.message); setContent([]); });

    const unsubLive = onSnapshot(query(collection(db, 'live_sessions'), where('status', '==', 'active'), where('grade', '==', userData?.grade)), s => {
        const activeSessions = s.docs.map(d=>({id:d.id, ...d.data()}));
        const visibleSessions = activeSessions.filter(ls => {
            const allowedByEmail = !ls.allowedEmails || ls.allowedEmails.length === 0 || ls.allowedEmails.includes(user.email);
            const notDeleted = ls.deleted !== true && ls.isDeleted !== true;
            const isOpen = ls.status === 'active' && ls.isLive !== false && ls.ended !== true && ls.closed !== true;
            return allowedByEmail && notDeleted && isOpen;
        });
        setLiveSessions(visibleSessions);
    }, error => { console.warn('live_sessions listener blocked:', error?.message); setLiveSessions([]); });

    const unsubExams = onSnapshot(query(collection(db, 'exams'), where('grade', '==', userData?.grade)), s => setExams(s.docs.map(d=>({id:d.id,...d.data()}))), error => { console.warn('exams listener blocked:', error?.message); setExams([]); });
    const unsubResults = onSnapshot(query(collection(db, 'exam_results'), where('studentId', '==', user.uid)), s => {
        const rows = s.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        setExamResults(rows);
    }, error => { console.warn('exam_results listener blocked:', error?.message); setExamResults([]); });
    const unsubHwResults = onSnapshot(query(collection(db, 'homework_results'), where('studentId', '==', user.uid)), s => {
        const results = s.docs.map(d=>({id:d.id,...d.data()})); results.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)); setHwResults(results);
    }, error => { console.warn('homework_results listener blocked:', error?.message); setHwResults([]); });
    const unsubMistakes = onSnapshot(query(collection(db, 'student_mistakes'), where('userId', '==', user.uid)), s => {
        const rows = s.docs.map(d => ({id: d.id, ...d.data()})); rows.sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)); setMistakes(rows);
    }, error => { console.warn('student_mistakes listener blocked:', error?.message); setMistakes([]); });
    const unsubNotif = onSnapshot(query(collection(db, 'notifications'), where('grade', 'in', ['all', userData?.grade]), limit(10)), s => {
        const newNotifs = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setNotifications(newNotifs);
        if(newNotifs.length > 0) {
          setHasNewNotif(true);
          const latest = newNotifs[0];
          if(latest.text) sendSystemNotification(latest.title || "تنبيه جديد 🔔", latest.text);
        }
    }, error => { console.warn('notifications listener blocked:', error?.message); setNotifications([]); });

    const unsubAssignments = onSnapshot(query(collection(db, 'assignments'), where('grade', '==', userData?.grade)), s => {
        const rows = s.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAssignments(rows);
    }, error => { console.warn('assignments listener blocked:', error?.message); setAssignments([]); });

    const unsubAssignmentSubs = onSnapshot(query(collection(db, 'assignment_submissions'), where('studentId', '==', user.uid)), s => {
        const rows = s.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        setAssignmentSubmissions(rows);
    }, error => { console.warn('assignment_submissions listener blocked:', error?.message); setAssignmentSubmissions([]); });

    const unsubVideoViews = onSnapshot(query(collection(db, 'video_views'), where('userId', '==', user.uid)), s => {
        setVideoViews(s.docs.map(d=>({id:d.id,...d.data()})));
    }, error => { console.warn('video_views listener blocked:', error?.message); setVideoViews([]); });

    setEditFormData({ name: userData?.name, phone: userData.phone, parentPhone: userData.parentPhone, grade: userData?.grade });

    return () => { unsubContent(); unsubLive(); unsubExams(); unsubResults(); unsubHwResults(); unsubMistakes(); unsubNotif(); unsubAssignments(); unsubAssignmentSubs(); unsubVideoViews(); };
  }, [userData, user]);


  const enableMobilePushNotifications = async () => {
    setPushStatus('disabled');
    alert('إشعارات المتصفح متوقفة مؤقتًا. ستظهر تنبيهات المنصة داخل حساب الطالب فقط.');
  };

  const isPremium = userData.subscriptionStatus === 'premium' && (!userData?.subscriptionExpiry || userData?.subscriptionExpiry.toDate() > new Date());
  
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
          if(isPremium && userData?.subscriptionExpiry) {
              newExpiry = userData?.subscriptionExpiry.toDate();
          }
          newExpiry.setDate(newExpiry.getDate() + days);

          const batch = writeBatch(db);
          batch.update(doc(db, 'users', user.uid), { subscriptionStatus: 'premium', subscriptionExpiry: newExpiry });
          batch.update(doc(db, 'subscription_codes', codeDoc.id), { used: true, usedBy: user.displayName, usedById: user.uid, usedAt: serverTimestamp() });
          
          await batch.commit();
          alert(`تم شحن الكود بنجاح! تم تفعيل اشتراكك لمدة ${days} يوم.`);
          setSubscriptionCodeInput('');
      } catch (err) { console.error(err); alert("حدث خطأ أثناء الشحن"); }
      setIsCharging(false);
  };

  const videos = content.filter(c => c.type === 'video');
  const filesAndLinks = content.filter(c => c.type === 'file' || c.type === 'link');
  const htmls = content.filter(c => c.type === 'html');
  const interactiveExams = content.filter(c => c.type === 'interactive_exam');

  const handlePremiumClick = (callback) => {
      if(!isPremium) {
          alert("عفواً يا بطل، هذا المحتوى مخصص للطلاب المشتركين في الباقة المدفوعة (VIP). يرجى شحن حسابك أو التواصل مع المستر لترقية حسابك!");
          setActiveTab('subscription');
      } else {
          callback();
      }
  };

  const getVideoWatchPercent = (videoItem) => {
      const match = videoViews.find(v => v.videoId === videoItem.id);
      if (!match) return 0;
      if (safeNumber(match.watchedPercent, -1) >= 0) return safeNumber(match.watchedPercent, 0);
      const durationSeconds = safeNumber(videoItem.durationSeconds, safeNumber(videoItem.estimatedDurationMinutes, 0) * 60);
      return durationSeconds > 0 ? Math.min(100, Math.round((safeNumber(match.watchedSeconds, 0) / durationSeconds) * 100)) : 0;
  };

  const canOpenLinkedExam = (videoItem) => {
      if (!videoItem?.linkedExamId) return false;
      return getVideoWatchPercent(videoItem) >= VIDEO_EXAM_UNLOCK_PERCENT;
  };

  const openLinkedExamFromVideo = (videoItem) => {
      if (!videoItem?.linkedExamId) return;
      const watchPercent = getVideoWatchPercent(videoItem);
      if (watchPercent < VIDEO_EXAM_UNLOCK_PERCENT) {
          return alert(`امتحان الفيديو سيفتح بعد مشاهدة ${VIDEO_EXAM_UNLOCK_PERCENT}% من الفيديو. شاهدت الآن ${watchPercent}%.`);
      }
      const linkedExam = exams.find(e => e.id === videoItem.linkedExamId);
      if (!linkedExam) return alert('الامتحان المرتبط بهذا الفيديو غير موجود حالياً أو لم يتم نشره.');
      startExamWithCode(linkedExam, { skipCode: true, sourceVideoId: videoItem.id });
  };

  const handleVideoProgress = (videoId, percent, watchedSeconds) => {
      setVideoViews(prev => {
          const others = prev.filter(v => v.videoId !== videoId);
          return [...others, { videoId, watchedPercent: percent, watchedSeconds }];
      });
  };


  const latestVideoActivity = (() => {
      const views = Array.isArray(videoViews) ? videoViews : [];
      const byView = [...views].sort((a, b) => {
          const bTime = safeNumber(b?.viewedAt?.seconds, safeNumber(b?.updatedAt, safeNumber(b?.lastPositionSeconds, safeNumber(b?.watchedSeconds, 0))));
          const aTime = safeNumber(a?.viewedAt?.seconds, safeNumber(a?.updatedAt, safeNumber(a?.lastPositionSeconds, safeNumber(a?.watchedSeconds, 0))));
          return bTime - aTime;
      })[0];
      let localActivity = null;
      try {
          const raw = user?.uid ? localStorage.getItem('nahhas-latest-video-' + user.uid) : '';
          localActivity = raw ? JSON.parse(raw) : null;
      } catch (e) {}
      const picked = byView || localActivity;
      if (!picked) return null;
      const videoId = picked.videoId;
      const videoItem = videos.find(v => v.id === videoId) || (localActivity?.videoId === videoId ? videos.find(v => v.id === localActivity.videoId) : null);
      if (!videoItem) return null;
      const watchedSeconds = safeNumber(picked.lastPositionSeconds, safeNumber(picked.watchedSeconds, safeNumber(localActivity?.watchedSeconds, 0)));
      const percent = Math.max(0, Math.min(100, getVideoWatchPercent(videoItem)));
      return {
          video: videoItem,
          watchedSeconds,
          percent,
          isCompleted: percent >= 95
      };
  })();

  const latestCompletedResult = examResults.find(r => r.status === 'completed') || examResults[0] || null;
  const inProgressExamResult = examResults.find(r => ['in_progress', 'security_hold'].includes(r.status));
  const inProgressExam = inProgressExamResult ? exams.find(e => e.id === inProgressExamResult.examId) : null;
  const submittedAssignmentIds = new Set((assignmentSubmissions || []).map(s => s.assignmentId));
  const pendingAssignments = (assignments || []).filter(a => !submittedAssignmentIds.has(a.id));
  const pendingAssignmentsCount = pendingAssignments.length;
  const completedVideoCount = (videos || []).filter(v => getVideoWatchPercent(v) >= VIDEO_EXAM_UNLOCK_PERCENT).length;
  const videoCompletionPercent = videos.length > 0 ? Math.round((completedVideoCount / videos.length) * 100) : 0;
  const completedExamResults = (examResults || []).filter(r => r.status === 'completed');
  const averageScore = completedExamResults.length > 0
      ? Math.round(completedExamResults.reduce((sum, r) => sum + getResultPercentage(r), 0) / completedExamResults.length)
      : 0;
  const unseenNotificationCount = notifications.length;
  const recentNotificationItems = notifications.slice(0, 4);

  const smartWeakBranches = (() => {
      const totals = {};
      completedExamResults.slice(0, 8).forEach(result => {
          const stats = result.performanceAnalysis?.branchStats || result.branchStats || result.branchAnalysis || {};
          Object.entries(stats).forEach(([branch, data]) => {
              totals[branch] = totals[branch] || { earned: 0, possible: 0, wrong: 0 };
              totals[branch].earned += safeNumber(data.earned, 0);
              totals[branch].possible += safeNumber(data.possible, safeNumber(data.total, 0));
              totals[branch].wrong += safeNumber(data.wrong, 0);
          });
      });
      return Object.entries(totals)
          .map(([branch, data]) => ({
              branch,
              pct: data.possible > 0 ? Math.round((data.earned / data.possible) * 100) : 0,
              wrong: data.wrong
          }))
          .filter(item => item.pct < 75 || item.wrong > 0)
          .sort((a, b) => a.pct - b.pct)
          .slice(0, 3);
  })();

  const nextStudyAction = (() => {
      if (latestVideoActivity && !latestVideoActivity.isCompleted) {
          return {
              title: 'استكمل آخر محاضرة',
              text: latestVideoActivity.video?.title || 'محاضرة محفوظة',
              action: () => setPlayingVideo(latestVideoActivity.video),
              button: 'استكمال الآن',
              icon: <Play size={18} fill="currentColor" />,
              tone: 'from-amber-400 to-orange-500 text-slate-950'
          };
      }
      if (inProgressExam) {
          return {
              title: 'استكمل امتحانك',
              text: inProgressExam.title || 'امتحان محفوظ',
              action: () => startExamWithCode(inProgressExam, { skipCode: true }),
              button: 'دخول الامتحان',
              icon: <ClipboardList size={18} />,
              tone: 'from-blue-500 to-indigo-600 text-white'
          };
      }
      if (pendingAssignments[0]) {
          return {
              title: 'عندك واجب مطلوب',
              text: pendingAssignments[0].title || 'واجب جديد',
              action: () => setActiveTab('assignments'),
              button: 'فتح الواجبات',
              icon: <QrCode size={18} />,
              tone: 'from-emerald-500 to-teal-600 text-white'
          };
      }
      return {
          title: 'ابدأ خطوة جديدة',
          text: videos[0]?.title || 'افتح المحاضرات المتاحة لك',
          action: () => setActiveTab('videos'),
          button: 'فتح المحاضرات',
          icon: <PlayCircle size={18} />,
          tone: 'from-slate-900 to-slate-700 text-white'
      };
  })();

  const StudentHomeOverview = () => {
      const quickStats = [
          { label: 'محاضرة', value: videos.length, icon: <PlayCircle size={18} />, tone: 'bg-blue-50 text-blue-700 border-blue-100', action: () => !isBannedContent && setActiveTab('videos') },
          { label: 'امتحان', value: exams.length, icon: <ClipboardList size={18} />, tone: 'bg-amber-50 text-amber-700 border-amber-100', action: () => !isBannedExam && setActiveTab('exams') },
          { label: 'ملف', value: filesAndLinks.length, icon: <FileText size={18} />, tone: 'bg-orange-50 text-orange-700 border-orange-100', action: () => !isBannedContent && setActiveTab('files') },
          { label: 'تفاعلي', value: htmls.length, icon: <Code size={18} />, tone: 'bg-purple-50 text-purple-700 border-purple-100', action: () => !isBannedContent && setActiveTab('htmls') },
          { label: 'واجب', value: assignments.length, icon: <QrCode size={18} />, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100', action: () => !isBannedExam && setActiveTab('assignments') },
          { label: 'نتيجة', value: examResults.length, icon: <BarChart3 size={18} />, tone: 'bg-slate-50 text-slate-700 border-slate-100', action: () => setActiveTab('performance') }
      ];

      const currentTitle = latestVideoActivity?.video?.title || inProgressExam?.title || pendingAssignments[0]?.title || 'ابدأ مذاكرتك التالية';
      const currentSubtitle = latestVideoActivity
          ? ('آخر موضع مشاهدة: ' + formatWatchTime(Math.round(latestVideoActivity.watchedSeconds || 0)))
          : inProgressExam
            ? 'لديك محاولة امتحان محفوظة.'
            : pendingAssignments[0]
              ? 'لديك واجب مطلوب.'
              : 'اختر خطوة من خطة اليوم وابدأ مباشرة.';

      return (
        <section className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {quickStats.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`rounded-2xl border p-4 text-right shadow-sm hover:shadow-md transition ${item.tone}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black">{item.label}</span>
                  <span className="opacity-70">{item.icon}</span>
                </div>
                <p className="text-2xl font-black">{item.value}</p>
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-900 text-white rounded-3xl p-5 md:p-6 shadow-xl overflow-hidden relative border border-white/10">
            <div className="absolute -left-16 -top-16 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"></div>
            <div className="absolute right-8 bottom-4 opacity-10"><GraduationCap size={130}/></div>
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
              <div className="min-w-0">
                <p className="text-amber-200 text-sm font-bold mb-2 flex items-center gap-2"><Sparkles size={16}/> خطوتك التالية</p>
                <h3 className="text-2xl md:text-3xl font-black leading-relaxed truncate md:whitespace-normal">{currentTitle}</h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{currentSubtitle}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button onClick={nextStudyAction.action} className={`bg-gradient-to-r ${nextStudyAction.tone} px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition flex items-center justify-center gap-2`}>
                  {nextStudyAction.icon} {nextStudyAction.button}
                </button>
                <button onClick={() => setActiveTab('performance')} className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-2xl font-bold hover:bg-white/15 transition flex items-center justify-center gap-2"><BarChart3 size={18}/> أدائي</button>
              </div>
            </div>
            {latestVideoActivity && (
              <div className="relative z-10 mt-5">
                <div className="h-3 bg-white/15 rounded-full overflow-hidden"><div className="h-full bg-amber-300 rounded-full transition-all" style={{ width: String(Math.min(100, latestVideoActivity.percent || 0)) + '%' }} /></div>
                <p className="text-xs text-amber-100 mt-2 font-bold">نسبة المشاهدة: {latestVideoActivity.percent || 0}%</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-panel rounded-3xl p-5 md:p-6 border border-white/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><BrainCircuit className="text-amber-600"/> خطة اليوم</h2>
                  <p className="text-sm text-slate-500 mt-1">ثلاث خطوات مختصرة بدون زحمة.</p>
                </div>
                <button onClick={nextStudyAction.action} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black hover:bg-slate-800 transition">ابدأ الآن</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold mb-2">1. محاضرة</p><p className="font-black text-slate-800">{latestVideoActivity?.video?.title || videos[0]?.title || 'افتح أول محاضرة متاحة'}</p></div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold mb-2">2. تدريب</p><p className="font-black text-slate-800">{pendingAssignments[0]?.title || 'حل واجب أو تدريب قصير'}</p></div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100"><p className="text-xs text-slate-500 font-bold mb-2">3. مراجعة</p><p className="font-black text-slate-800">{smartWeakBranches[0]?.branch || 'راجع آخر أخطائك'}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-800 flex items-center gap-2 mb-3"><Target className="text-red-500"/> ركز على</h3>
              {smartWeakBranches.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-700 text-sm font-bold leading-relaxed">أداؤك مستقر. راجع آخر أخطائك وحافظ على الاستمرارية.</div>
              ) : (
                <div className="space-y-2">
                  {smartWeakBranches.map(item => (
                    <div key={item.branch} className="bg-red-50/70 border border-red-100 rounded-2xl p-3">
                      <div className="flex items-center justify-between gap-2"><span className="font-black text-red-800">{item.branch}</span><span className="text-xs bg-white text-red-700 px-2 py-1 rounded-full font-bold">{item.pct}%</span></div>
                      <p className="text-xs text-red-600 mt-1">{item.wrong} أخطاء تحتاج مراجعة.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-3xl p-5 text-center shadow-lg border border-amber-300/30">
            <p className="font-arabic text-xl md:text-2xl font-black">وَمَا نَيْلُ الْمَطَالِبِ بِالتَّمَنِّي</p>
            <p className="text-amber-100 text-sm mt-2">ولكن تؤخذ الدنيا غلابا</p>
          </div>
        </section>
      );
  };

  const handleJoinLive = (session) => {
      if (session.passcode) {
          const code = prompt('أدخل كود البث المباشر');
          if (code !== session.passcode) return alert('الكود غير صحيح');
      }
      setActiveLiveView(session);
  };

  const handleUpdateMyProfile = async (e) => {
      e.preventDefault();

      const normalizedPhone = normalizeEgyptPhone(editFormData.phone);
      if (!isValidEgyptPhone(normalizedPhone)) {
          return alert("رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015");
      }

      if (normalizedPhone === normalizeEgyptPhone(editFormData.parentPhone)) {
          return alert("لا يمكن أن يكون رقم الطالب هو نفسه رقم ولي الأمر.");
      }

      const payload = { phone: normalizedPhone };

      if (editFormData.grade !== userData?.grade) {
          payload.requestedGrade = editFormData.grade;
          payload.gradeUpdateStatus = 'pending';
      }

      await updateDoc(doc(db, 'users', user.uid), payload);
      alert(editFormData.grade !== userData?.grade ? "تم حفظ رقم الهاتف وإرسال طلب تغيير المرحلة إلى الأدمن." : "تم تحديث رقم الهاتف بنجاح.");
  };

  if (scanningHwId) return <SmartHomeworkScanner hwId={scanningHwId} user={user} onClose={() => setScanningHwId(null)} />;
  if (activeLiveView) return <LiveSessionView session={activeLiveView} user={user} onClose={() => setActiveLiveView(null)} />;
  if (activeExam) return <ExamRunner exam={activeExam} user={user} onClose={() => setActiveExam(null)} />;
  if (showFocusMode) return <PomodoroFocusMode onClose={() => setShowFocusMode(false)} />;
  if (reviewingExam) {
      const result = examResults.find(r => r.examId === reviewingExam.id);
      return <ExamRunner exam={reviewingExam} user={user} onClose={() => setReviewingExam(null)} isReviewMode={true} existingResult={result} />;
  }

  const isBannedAll = userData.status === 'banned_all';
  const isBannedExam = userData.status === 'banned_exam' || userData.status === 'banned_cheating'; 
  const isBannedContent = userData.status === 'banned_content';

  if(userData.status === 'pending') return <div className="h-screen flex items-center justify-center bg-amber-50 text-center p-4"><div className="bg-white p-8 rounded-2xl shadow-xl"><h2 className="text-2xl font-bold mb-2">طلبك قيد المراجعة ⏳</h2><button onClick={()=>signOut(auth)} className="mt-4 text-red-500 underline">خروج</button></div></div>;
  if(userData.status === 'rejected') return <div className="h-screen flex items-center justify-center bg-red-50"><div className="text-red-600 font-bold">تم رفض طلبك</div><button onClick={()=>signOut(auth)} className="ml-4 bg-white px-4 py-1 rounded">خروج</button></div>;
  if (isBannedAll) return (
      <div className="h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6"><Ban size={80} className="text-red-600 mb-4" /><h2 className="text-3xl font-bold text-red-800 mb-2 font-arabic">تم حظر حسابك</h2><p className="text-red-600 mb-6 font-bold">يرجى التواصل مع الإدارة أو المستر لمعرفة السبب.</p><button onClick={()=>signOut(auth)} className="bg-white text-red-600 px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-100">تسجيل الخروج</button></div>
  );

  const startExamWithCode = async (exam, options = {}) => {
    if (isBannedExam) return alert("أنت محظور من دخول الامتحانات.");

    const previousResult = examResults.find(r => r.examId === exam.id);
    const openExamFromSavedResult = (result, resumeData = null) => {
      setActiveExam({
        ...exam,
        attemptId: result.id,
        resumeData: resumeData || result,
        sourceVideoId: result.sourceVideoId || options.sourceVideoId || null
      });
    };

    if (previousResult) {
        const hasAdminContinueApproval = previousResult.adminDecision === 'continue';
        const hasAdminRestartApproval = previousResult.adminDecision === 'restart';

        if (previousResult.status === 'completed') {
          alert(`أنت امتحنت الامتحان ده قبل كده وجبت ${previousResult.score}.`);
          return;
        }

        if (hasAdminContinueApproval && ['security_hold', 'in_progress', 'cheated'].includes(previousResult.status)) {
          const approvedResume = {
            ...previousResult,
            status: 'in_progress',
            answers: previousResult.answers || {},
            remainingTime: safeNumber(previousResult.remainingTime, exam.duration * 60),
            currentQIndex: safeNumber(previousResult.currentQIndex, 0),
            antiCheatWarnings: safeNumber(previousResult.antiCheatWarnings, 0),
            antiCheatLog: previousResult.antiCheatLog || []
          };

          await setDoc(doc(db, 'exam_results', previousResult.id), {
            status: 'in_progress',
            adminDecision: 'continue_consumed',
            resumeApproved: false,
            adminSecurityAction: 'continue_consumed',
            resumedAfterAdminApprovalAt: serverTimestamp(),
            lastSavedAt: serverTimestamp(),
            sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
          }, { merge: true });

          openExamFromSavedResult({ ...previousResult, ...approvedResume, adminDecision: 'continue_consumed' }, approvedResume);
          return;
        }

        if (hasAdminRestartApproval && ['security_hold', 'in_progress', 'cheated'].includes(previousResult.status)) {
          const freshResume = {
            answers: {},
            remainingTime: exam.duration * 60,
            currentQIndex: 0,
            antiCheatWarnings: 0,
            antiCheatLog: previousResult.antiCheatLog || []
          };

          await setDoc(doc(db, 'exam_results', previousResult.id), {
            answers: {},
            remainingTime: exam.duration * 60,
            currentQIndex: 0,
            score: 0,
            total: 0,
            status: 'in_progress',
            adminDecision: 'restart_consumed',
            resumeApproved: false,
            antiCheatWarnings: 0,
            restartedByAdminDecisionAt: serverTimestamp(),
            sourceVideoId: previousResult.sourceVideoId || options.sourceVideoId || null
          }, { merge: true });

          openExamFromSavedResult({ ...previousResult, ...freshResume, status: 'in_progress', adminDecision: 'restart_consumed' }, freshResume);
          return;
        }

        if (previousResult.status === 'security_hold') {
          alert('تم إيقاف محاولتك مؤقتًا بسبب تنبيهات الأمان. انتظر موافقة الأدمن على الاستكمال أو الإعادة.');
          return;
        }

        if (previousResult.status === 'in_progress') {
          alert('لديك محاولة غير مكتملة. لا يمكن الاستكمال إلا بعد موافقة الأدمن من لوحة النتائج.');
          return;
        }

        if (previousResult.status === 'cheated') {
          alert('هذه المحاولة مسجلة كمخالفة أمان. لا يمكن إعادة الامتحان أو استكماله إلا إذا سمح الأدمن من لوحة النتائج.');
          return;
        }
    }

    const now = new Date(); const start = new Date(exam.startTime); const end = new Date(exam.endTime);
    if (now < start) return alert(`الامتحان لم يبدأ بعد. موعد البدء: ${start.toLocaleString('ar-EG')}`);
    if (now > end) return alert("عفواً، انتهى وقت الامتحان.");
    const code = options.skipCode ? exam.accessCode : prompt("أدخل كود الامتحان:");
    if (options.skipCode || code === exam.accessCode) {
        try {
            const attemptRef = await addDoc(collection(db, 'exam_results'), {
              examId: exam.id,
              studentId: user.uid,
              studentName: user.displayName,
              score: 0,
              total: 0,
              status: 'in_progress',
              adminDecision: null,
              resumeApproved: false,
              sourceVideoId: options.sourceVideoId || null,
              startedFromVideo: !!options.skipCode,
              submittedAt: serverTimestamp()
            });
            setActiveExam({ ...exam, attemptId: attemptRef.id, sourceVideoId: options.sourceVideoId || null });
        } catch (error) { console.error("Error creating attempt record:", error); alert("حدث خطأ أثناء بدء الامتحان. حاول مرة أخرى."); }
    } else { alert("كود خاطئ!"); }
  };

  const studentFirstName = String(userData?.name || user?.displayName || 'طالب').split(' ')[0];
  const StudentTopGreeting = () => (
    <section className="student-sticky-hero bg-white/95 backdrop-blur-xl border border-amber-100 rounded-3xl shadow-xl p-4 md:p-5 mb-6 overflow-hidden relative">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-arabic flex flex-wrap items-center gap-2">
            منور يا <span className="text-amber-600">{studentFirstName}</span> 👋
            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-sans">{getGradeLabel(userData?.grade)}</span>
            {isPremium ? (
              <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm"><Crown size={14}/> حساب VIP</span>
            ) : (
              <button className="bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 transition" onClick={()=>setActiveTab('subscription')}>مجاني (رقي حسابك)</button>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center min-w-[220px]">
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100"><p className="text-xl font-black text-amber-700">{videos.length}</p><p className="text-[11px] text-amber-800 font-bold">محاضرة</p></div>
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100"><p className="text-xl font-black text-blue-700">{exams.length}</p><p className="text-[11px] text-blue-800 font-bold">امتحان</p></div>
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100"><p className="text-xl font-black text-emerald-700">{examResults.length}</p><p className="text-[11px] text-emerald-800 font-bold">نتيجة</p></div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="bg-slate-50 relative font-['Cairo'] min-h-screen block" dir="rtl">
      <div className="hidden md:block"><StudentAdminMessagePopup user={user} userData={userData} /></div>

      <MobileStudentBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* تم حذف زر مراسلة الإدارة العائم للحفاظ على واجهة الطالب نظيفة وسلسة.
          تظل رسائل الإدارة المهمة تظهر تلقائياً من خلال StudentAdminMessagePopup على الشاشات الكبيرة. */}
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={user} userName={userData?.name} onClose={() => setPlayingVideo(null)} onProgress={handleVideoProgress} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} />}
      {/* AI امتحانات الطلاب متوقفة مؤقتًا لتوفير Gemini quota */}
      <FloatingArabicBackground />
      
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
                <div onClick={() => {setActiveTab('online_live'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='online_live'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><Radio/> محاضرة أون لاين</div>
                <div onClick={() => {setActiveTab('files'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='files'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><FileText/> الملفات و الروابط</div>
                <div onClick={() => {setActiveTab('htmls'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='htmls'?'bg-purple-100 text-purple-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-purple-600'}`}><Code/> محتوى تفاعلي</div>
              </>
          )}
          {!isBannedExam && (
              <>
                <div onClick={() => {setActiveTab('exams'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='exams'?'bg-amber-100 text-amber-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-amber-600'}`}><ClipboardList/> الامتحانات</div>
                <div onClick={() => {setActiveTab('assignments'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='assignments'?'bg-emerald-100 text-emerald-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'}`}><FileCheck/> الواجبات</div>
                <div onClick={() => {setActiveTab('smart_hw_results'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='smart_hw_results'?'bg-blue-100 text-blue-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}><QrCode/> سجل الالواجبات</div>
                <div onClick={() => {setActiveTab('mistakes_bank'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='mistakes_bank'?'bg-red-100 text-red-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-red-600'}`}><BrainCircuit/> بنك الأخطاء</div>
                <div onClick={() => {setActiveTab('performance'); setMobileMenu(false)}} className={`flex items-center gap-3 w-full p-4 rounded-xl transition cursor-pointer ${activeTab==='performance'?'bg-blue-100 text-blue-700 shadow-sm font-bold':'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}><BarChart3/> تحليل الأداء</div>
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
                {isPremium && <span className="hidden md:flex bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold items-center gap-1 border border-amber-200"><Crown size={14}/> VIP صالح حتى: {userData?.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</span>}
                <button onClick={() => {setShowNotifications(!showNotifications); setHasNewNotif(false);}} className="relative p-2 glass-panel rounded-full shadow-sm hover:bg-white transition">
                    <Bell className="text-slate-600"/>{hasNewNotif && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                </button>
            </div>
            {showNotifications && (
                <div className="absolute top-12 left-0 w-80 glass-panel rounded-xl shadow-xl border border-white/50 p-4 z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-sm text-slate-500">تنبيهات المنصة</h3>
                        <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700">داخلي</span>
                    </div>
                    {notifications.length === 0 ? <p className="text-xs text-slate-400">لا توجد إشعارات جديدة</p> : (
                        <div className="space-y-3">
                            {notifications.map((n, i) => (
                                <div key={n.id || i} className="text-sm bg-slate-50/50 p-2 rounded border-l-4 border-amber-500">
                                  {n.title && <div className="font-black text-slate-800 mb-1">{n.title}</div>}
                                  <div>{n.text || n.body}</div>
                                  <div className="text-[10px] text-slate-400 mt-1">{n.createdAt?.toDate?.().toLocaleDateString?.() || 'الآن'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        <StudentTopGreeting />

        {activeTab === 'home' && (
            <div className="space-y-8 page-soft-enter">
                <StudentHomeOverview />
                {liveSessions.length > 0 && (
                    <div className="bg-white border border-red-100 text-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                        <div>
                           <h3 className="font-bold font-arabic text-xl flex items-center gap-2 text-red-700"><Radio/> يوجد {liveSessions.length} محاضرة أون لاين متاحة</h3>
                           <p className="text-sm text-slate-500 mt-1">الدخول اختياري تمامًا. افتح قسم محاضرة أون لاين وقت ما تحب.</p>
                        </div>
                        <button onClick={() => setActiveTab('online_live')} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-red-700 transition w-full md:w-auto">عرض المحاضرات</button>
                    </div>
                )}
                <Announcements />
                <PWAInstallBox installPrompt={installPrompt} />
            </div>
        )}

        {activeTab === 'performance' && (
            <div className="space-y-6">
                <PerformanceOverview examResults={examResults} content={content} />
                <div className="glass-panel p-6 rounded-2xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3/> سجل الامتحانات</h2>
                    <div className="space-y-3">
                        {examResults.length === 0 ? <p className="text-slate-500 text-center py-8 bg-white rounded-xl border">لم يتم تسجيل نتائج بعد.</p> : examResults.map(result => {
                            const pct = getResultPercentage(result);
                            const badge = getGradeBadge(pct);
                            return <div key={result.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div><p className="font-bold text-slate-800">{result.examTitle || 'امتحان'}</p><p className="text-xs text-slate-500">{result.submittedAt?.toDate?.().toLocaleString('ar-EG') || 'بدون تاريخ'}</p></div>
                                <div className="flex items-center gap-2"><span className={`px-3 py-1 rounded-full border text-xs font-bold ${badge.tone}`}>{badge.text}</span><span className="font-black text-slate-800">{result.score}/{result.total} - {pct}%</span></div>
                            </div>;
                        })}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'subscription' && (
            <div className="glass-panel p-4 md:p-8 rounded-2xl max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <Crown size={64} className={`mx-auto mb-4 ${isPremium ? 'text-amber-500' : 'text-slate-300'}`} />
                    <h2 className="text-3xl font-bold font-arabic text-slate-800 mb-2">حالة اشتراكك</h2>
                    {isPremium ? (
                        <p className="text-green-600 font-bold text-lg bg-green-50 inline-block px-4 py-2 rounded-full border border-green-200">أنت الآن على الباقة المدفوعة (VIP). صالحة حتى: {userData?.subscriptionExpiry?.toDate().toLocaleDateString('ar-EG')}</p>
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
        
        {activeTab === 'online_live' && !isBannedContent && (
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-3xl border-t-4 border-red-500">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2"><Radio className="text-red-600"/> محاضرة أون لاين</h2>
                            <p className="text-slate-500 mt-1">هذا القسم اختياري. الطالب يدخل المحاضرة بنفسه فقط عند الضغط على زر الدخول.</p>
                        </div>
                        <span className="bg-red-50 text-red-700 px-4 py-2 rounded-full font-bold text-sm">{liveSessions.length} متاحة</span>
                    </div>
                    {liveSessions.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
                            <Radio className="mx-auto text-slate-300 w-16 h-16 mb-4"/>
                            <p className="text-slate-500 font-bold">لا توجد محاضرات أون لاين متاحة الآن.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {liveSessions.map(session => {
                                const embedInfo = getLiveEmbedInfo(session);
                                const status = getLiveStatus(session);
                                return (
                                    <div key={session.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                                        <div className="flex justify-between items-start gap-3 mb-3">
                                            <div>
                                                <h3 className="font-black text-xl text-slate-800">{session.title}</h3>
                                                <p className="text-xs text-slate-500 mt-1">{session.scheduledAt ? new Date(session.scheduledAt).toLocaleString('ar-EG') : 'متاحة الآن'}</p>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full font-bold ${status.tone}`}>{status.label}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(session.grade)}</span>
                                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">{session.sessionType || embedInfo.type}</span>
                                            {session.passcode && <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded">محمي بكود</span>}
                                            {embedInfo.canEmbed ? <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded">يعمل داخل المنصة</span> : <span className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded">قد يفتح خارجيًا</span>}
                                        </div>
                                        <p className="text-sm text-slate-500 mb-5 leading-relaxed">{embedInfo.note}</p>
                                        <button onClick={() => handleJoinLive(session)} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2">
                                            دخول المحاضرة <ExternalLink size={16}/>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
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
                    ) : videos.filter(v => (v.videoSection || 'explanation') === videoSectionTab).map(v => {
                        const watchPercent = getVideoWatchPercent(v);
                        return (
                        <div key={v.id} className="glass-card rounded-xl overflow-hidden cursor-pointer relative group">
                            <div className="h-48 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center relative" onClick={() => handlePremiumClick(() => setPlayingVideo(v))}>
                                {v.isPremium && !isPremium ? <Lock className="text-slate-400 w-16 h-16 opacity-80" /> : <PlayCircle className="text-white w-16 h-16 opacity-80 group-hover:scale-110 transition drop-shadow-lg"/>}
                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{getGradeLabel(v.grade)}</span>
                                {v.isPremium && <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-md"><Crown size={12}/> VIP</span>}
                            </div>
                            <div className="p-4 space-y-3">
                                <h3 className={`font-bold text-lg ${v.isPremium && !isPremium ? 'text-slate-400' : 'text-slate-800'}`}>{v.title}</h3>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${watchPercent}%` }} /></div>
                                <div className="flex items-center justify-between text-xs text-slate-500"><span>المشاهدة</span><span>{watchPercent}%</span></div>
                                {v.linkedExamId && (
                                  <div className="space-y-2">
                                    {watchPercent >= VIDEO_EXAM_UNLOCK_PERCENT ? (
                                      <button
                                        onClick={() => openLinkedExamFromVideo(v)}
                                        className="w-full py-2 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                                      >
                                        ابدأ امتحان الفيديو الآن
                                      </button>
                                    ) : (
                                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                        <p className="text-xs font-bold text-slate-600">
                                          شاهد {Math.max(0, VIDEO_EXAM_UNLOCK_PERCENT - watchPercent)}% إضافية لفتح امتحان الفيديو
                                        </p>
                                        <button
                                          onClick={() => handlePremiumClick(() => setPlayingVideo(v))}
                                          className="mt-2 w-full py-2 rounded-xl font-bold text-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        >
                                          استكمال مشاهدة الفيديو
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                        </div>
                    )})}
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
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:col-span-3 text-amber-800 font-bold">امتحان AI المخصص متوقف مؤقتًا للطلاب. ستظل الامتحانات التفاعلية المنشورة من الأدمن متاحة هنا.</div>
                
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
                const canResumeByAdmin = prevResult && prevResult.adminDecision === 'continue';
                const canRestartByAdmin = prevResult && prevResult.adminDecision === 'restart';
                const waitingAdminDecision = prevResult && ['security_hold', 'in_progress', 'cheated'].includes(prevResult.status) && !canResumeByAdmin && !canRestartByAdmin;
                if (prevResult) {
                    if (prevResult.status === 'completed') { statusText = `تم الحل: ${prevResult.score} درجة`; statusClass = "bg-green-500 text-white"; } 
                    else if (canResumeByAdmin) { statusText = "مسموح بالاستكمال ✅"; statusClass = "bg-blue-600 text-white"; }
                    else if (canRestartByAdmin) { statusText = "مسموح بالإعادة ✅"; statusClass = "bg-amber-600 text-white"; }
                    else if (prevResult.status === 'security_hold') { statusText = "موقوف في انتظار الأدمن 🛡️"; statusClass = "bg-red-600 text-white"; }
                    else if (prevResult.status === 'in_progress') { statusText = "ينتظر موافقة الأدمن ⏳"; statusClass = "bg-yellow-500 text-white"; } 
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
                                 <button onClick={() => generatePDF('student', {studentName: user.displayName, score: prevResult.score, total: e.questions.reduce((acc,g)=>acc+g.subQuestions.length,0), status: prevResult.status, examTitle: e.title, questions: e.questions.flatMap(q => q.subQuestions), answers: prevResult.answers })} className="flex-1 bg-green-100 text-green-700 py-2 md:py-3 rounded-xl font-bold hover:bg-green-200 flex items-center justify-center gap-1 transition shadow-sm text-xs md:text-sm"><Download size={14}/> شهادة</button>
                            </div>
                        ) : canResumeByAdmin ? (
                            <button onClick={() => startExamWithCode(e, { skipCode: true })} className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg transition text-sm">
                                <Play size={14}/> استكمال الامتحان بموافقة الأدمن
                            </button>
                        ) : canRestartByAdmin ? (
                            <button onClick={() => startExamWithCode(e, { skipCode: true })} className="w-full bg-amber-600 text-white py-2 md:py-3 rounded-xl font-bold hover:bg-amber-700 flex items-center justify-center gap-2 shadow-lg transition text-sm">
                                <RefreshCw size={14}/> بدء الامتحان من جديد بموافقة الأدمن
                            </button>
                        ) : waitingAdminDecision ? (
                            <div className="bg-amber-50 text-amber-700 p-2 md:p-3 rounded-xl font-bold text-center border border-amber-200 text-sm">
                                المحاولة محفوظة. انتظر موافقة الأدمن للاستكمال أو الإعادة.
                            </div>
                        ) : prevResult ? (
                            <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded-xl font-bold text-center border border-red-200 text-sm">لا يمكن دخول الامتحان</div>
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

        {activeTab === 'assignments' && !isBannedExam && (
            <StudentAssignmentsPanel assignments={assignments} submissions={assignmentSubmissions} user={user} userData={userData} />
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
              <div className="glass-panel p-4 md:p-6 rounded-xl max-w-2xl">
                <form onSubmit={handleUpdateMyProfile} className="space-y-4">
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">الاسم</label><input disabled className="w-full border p-3 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed" value={editFormData.name} /><p className="text-xs text-red-500 mt-1">لا يمكن تغيير الاسم (تواصل مع الإدارة).</p></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف</label><input className="w-full border p-3 rounded-xl" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
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

const LandingPage = ({ onAuthClick, installPrompt }) => {
  const [publicContent, setPublicContent] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null); 
  const [playingHtml, setPlayingHtml] = useState(null);
  
  useEffect(() => { const u = onSnapshot(query(collection(db, 'content'), where('isPublic', '==', true)), s => setPublicContent(s.docs.map(d=>d.data()))); return u; }, []);
  const openFacebook = () => window.open("https://www.facebook.com/share/17aiUQWKf5/", "_blank");

  return (
    <div className="min-h-screen font-['Cairo'] relative overflow-x-hidden" dir="rtl">
      {playingVideo && <SecureVideoPlayer video={playingVideo} user={null} userName="زائر" onClose={() => setPlayingVideo(null)} />}
      {playingHtml && <InteractiveViewer content={playingHtml} user={null} onClose={() => setPlayingHtml(null)} />}
      <FloatingArabicBackground />
      <ChatWidget />
      <nav className="relative z-10 flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto glass-panel mt-4 rounded-full mx-2 md:mx-4 shadow-lg">
        <div className="flex items-center gap-2"><ModernLogo /><span className="text-xl md:text-2xl font-bold font-arabic text-amber-800 hidden md:block">منصة النحاس</span></div>
        <div className="flex gap-2 md:gap-4 items-center">
          {installPrompt && ( <button onClick={installPrompt} className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-green-500/30 transition items-center gap-2"><DownloadCloud size={18}/> تثبيت</button> )}
          <button onClick={openFacebook} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-blue-500/50"><Facebook size={20}/></button>
          <button onClick={onAuthClick} className="bg-slate-900 text-white px-4 md:px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-slate-500/50 transition transform hover:-translate-y-0.5 text-sm md:text-base">دخول الطالب</button>
        </div>
      </nav>
      <main className="relative z-10 px-4 mt-10 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">اللغة العربية <span className="text-amber-600">لعبتك</span></h1>
        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">أقوى منصة تعليمية للمرحلة الإعدادية والثانوية.</p>
        <button onClick={onAuthClick} className="bg-amber-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl text-lg md:text-xl font-bold shadow-xl hover:bg-amber-700 transition transform hover:-translate-y-1">اشترك الآن 🚀</button>
        {installPrompt && (<div className="md:hidden mt-6"><button onClick={installPrompt} className="bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto text-sm"><DownloadCloud size={18}/> تثبيت المنصة على هاتفك</button></div>)}
        <div className="my-12 px-2"><WisdomBox /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-10 mb-20 px-2">
          <div className="bg-white/80 backdrop-blur p-4 md:p-6 rounded-3xl border border-white shadow-sm overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700"><Video /> فيديوهات للجميع</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'video').length > 0 ? publicContent.filter(c => c.type === 'video').map((v, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingVideo(v)}>
                     <div className="flex items-center gap-3 overflow-hidden">
                         <PlayCircle className="text-amber-500 shrink-0"/>
                         <span className="font-bold truncate text-sm md:text-base">{v.title}</span>
                     </div>
                     <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded shrink-0">مشاهدة</span>
                 </div>
               )) : <p className="text-slate-500 text-sm">لا توجد فيديوهات عامة حالياً</p>}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur p-4 md:p-6 rounded-3xl border border-white shadow-sm overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 text-purple-700"><Code /> تفاعلي للجميع</h3>
            <div className="space-y-4">
              {publicContent.filter(c => c.type === 'html').length > 0 ? publicContent.filter(c => c.type === 'html').map((h, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50" onClick={() => setPlayingHtml(h)}>
                     <div className="flex items-center gap-3 overflow-hidden">
                         <Code className="text-purple-500 shrink-0"/>
                         <span className="font-bold truncate text-sm md:text-base">{h.title}</span>
                     </div>
                     <span className="text-[10px] md:text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded shrink-0">تشغيل</span>
                 </div>
               )) : <p className="text-slate-500 text-sm">لا يوجد محتوى تفاعلي عام حالياً</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AuthPage = ({ onBack }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', grade: '1sec', phone: '', parentPhone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
        if (!formData.name.trim()) {
            alert("من فضلك اكتب اسم الطالب.");
            setLoading(false);
            return;
        }
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        if (!validation.ok) {
            alert(validation.message);
            setLoading(false);
            return;
        }
    }

    try {
      if (isRegister) {
        const validation = validateEgyptianPhones(formData.phone, formData.parentPhone);
        const userCred = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        await updateProfile(userCred.user, { displayName: formData.name.trim() });
        await setDoc(doc(db, 'users', userCred.user.uid), { 
            name: formData.name.trim(), email: formData.email.trim(), grade: formData.grade, phone: validation.normalizedStudentPhone, 
            parentPhone: validation.normalizedParentPhone, role: 'student', status: 'pending', 
            subscriptionStatus: 'free', subscriptionExpiry: null, createdAt: new Date() 
        });
        alert("تم إنشاء الحساب! انتظر تفعيل الأدمن.");
      } else { await signInWithEmailAndPassword(auth, formData.email, formData.password); }
    } catch (error) { alert("حدث خطأ: " + error.message); } 
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if(!formData.email) { alert("من فضلك اكتب الإيميل الأول."); return; }
    try { await sendPasswordResetEmail(auth, formData.email); alert("تم إرسال رابط استعادة كلمة السر."); } catch (error) { alert("حدث خطأ: " + error.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 font-['Cairo'] relative overflow-hidden" dir="rtl">
      <FloatingArabicBackground />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative z-10 my-10 overflow-y-auto max-h-[90vh] border border-white/50 scrollbar-hide">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-4 md:mb-6 flex items-center gap-1 font-bold"><ChevronRight size={18} /> العودة</button>
        <div className="flex justify-center mb-4"><ModernLogo /></div>
        <h2 className="text-2xl md:text-3xl font-bold font-arabic text-slate-800 mb-2 text-center">{isRegister ? 'حساب جديد' : 'تسجيل دخول'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-6">
          {isRegister && (
            <>
              <div className="relative"><User className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="text" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="الاسم ثلاثي" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم هاتفك" value={formData.phone} onChange={e => setFormData({...formData, phone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><Phone className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="tel" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="رقم ولي الأمر" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: normalizeEgyptPhone(e.target.value)})} /></div>
              <div className="relative"><GraduationCap className="absolute top-3.5 right-4 text-slate-400" size={18} /><select className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 appearance-none focus:border-amber-500 outline-none transition text-sm md:text-base" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}><GradeOptions /></select></div>
            </>
          )}
          <div className="relative"><Mail className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="email" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="البريد" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute top-3.5 right-4 text-slate-400" size={18} /><input required type="password" className="w-full py-3 pr-12 pl-4 rounded-xl border bg-slate-50 focus:border-amber-500 outline-none transition text-sm md:text-base" placeholder="كلمة السر" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          {!isRegister && (<div className="text-left"><button type="button" onClick={handleForgotPassword} className="text-xs text-amber-600 font-bold hover:underline">نسيت كلمة السر؟</button></div>)}
          <button disabled={loading} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/50 transition mt-2 flex justify-center">{loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'تسجيل' : 'دخول')}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="mt-4 md:mt-6 text-amber-800 font-bold hover:underline w-full text-center block text-sm">{isRegister ? 'تسجيل الدخول' : 'حساب جديد'}</button>
      </motion.div>
      <ChatWidget />
    </div>
  );
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'حدث خطأ غير متوقع' };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-['Cairo']" dir="rtl">
          <div className="max-w-lg w-full bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border-t-8 border-red-500 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={64}/>
            <h1 className="text-2xl font-black mb-2">هذا الجزء تحت الصيانة حاليًا</h1>
            <p className="text-slate-600 mb-4">نقوم بتحديث هذا الجزء من المنصة الآن. برجاء إعادة تحميل الصفحة أو المحاولة بعد قليل.</p>
            <details className="bg-slate-100 text-slate-600 p-3 rounded-xl text-sm mb-6 text-right">
              <summary className="cursor-pointer font-bold">تفاصيل تقنية للإدارة</summary>
              <code className="block text-red-700 mt-2 break-all text-left" dir="ltr">{this.state.message}</code>
            </details>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800">إعادة تحميل الصفحة</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const DEBUG_EVENT_NAME = 'nahhas-platform-debug-log';

const isDebugAdmin = (user) => {
  const email = (user?.email || '').toLowerCase();
  return email === 'mido16280@gmail.com';
};

const pushRemoteDebugLog = async (entry) => {
  try {
    const u = window.__nahhasDebugUser || {};
    if (!u?.uid || !db) return;
    await addDoc(collection(db, 'debug_logs'), {
      ...entry,
      userId: u.uid,
      userEmail: u.email || '',
      userName: u.displayName || u.email || '',
      createdAt: serverTimestamp(),
      page: window.location.href,
      userAgent: navigator.userAgent
    });
  } catch (e) {}
};

const pushDebugLog = (type, title, details = {}) => {
  try {
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      title,
      details,
      at: new Date().toLocaleString('ar-EG')
    };
    const current = JSON.parse(localStorage.getItem('nahhas_debug_logs') || '[]');
    localStorage.setItem('nahhas_debug_logs', JSON.stringify([entry, ...current].slice(0, 80)));
    window.dispatchEvent(new CustomEvent(DEBUG_EVENT_NAME, { detail: entry }));
    pushRemoteDebugLog(entry);
  } catch (e) {}
};

const explainDebugError = (errorText = '') => {
  const t = String(errorText || '').toLowerCase();
  if (t.includes('userdata') && t.includes('not defined')) return 'متغير userData مستخدم في مكان غير متاح. الحل استخدام userData?. أو تمرير بيانات المستخدم للكومبوننت.';
  if (t.includes('/api/ai-coach') || t.includes('gemini') || t.includes('ai')) return 'مشكلة في اتصال AI. راجع api/ai-coach.js ومفتاح GEMINI_API_KEY واضغط فحص AI.';
  if (t.includes('permission') || t.includes('insufficient permissions')) return 'مشكلة Firebase Rules. راجع صلاحيات الـ collection المستخدمة.';
  if (t.includes('failed to fetch') || t.includes('network')) return 'مشكلة اتصال أو API غير متاح حاليًا.';
  if (t.includes('undefined')) return 'يوجد متغير غير متعرف في هذا الجزء من الصفحة.';
  return 'خطأ عام. انسخ سجل التشخيص وابعت التفاصيل.';
};

class PlatformErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    pushDebugLog('react-error', error?.message || 'React Error', {
      stack: error?.stack,
      componentStack: info?.componentStack
    });
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || 'حدث خطأ غير معروف';
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border-t-8 border-amber-500">
            <h1 className="text-2xl font-black text-slate-900 mb-2">⚠️ الموقع تحت الصيانة مؤقتًا</h1>
            <p className="text-slate-600 font-bold mb-4">ظهر خطأ وتم منع انهيار الصفحة بالكامل.</p>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-3">
              <p className="font-black text-red-700">سبب الخطأ:</p>
              <p className="font-mono text-sm text-red-800 break-all" dir="ltr">{msg}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <p className="font-black text-blue-700">التفسير المقترح:</p>
              <p className="font-bold text-blue-900">{explainDebugError(msg)}</p>
            </div>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black">إعادة تحميل</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


const DebugCollector = ({ user }) => {
  useEffect(() => {
    window.__nahhasDebugUser = user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    } : null;

    const onError = (event) => {
      pushDebugLog('window-error', event.message || 'Window Error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const onRejection = (event) => {
      pushDebugLog('promise-error', event.reason?.message || String(event.reason || 'Unhandled Promise'), {
        stack: event.reason?.stack,
        reason: String(event.reason || '')
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [user?.uid, user?.email]);

  return null;
};


const DebugPanel = ({ user }) => {
  if (!isDebugAdmin(user)) return null;
  const [open, setOpen] = useState(false);
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const loadLogs = () => {
    try {
      setLogs(JSON.parse(localStorage.getItem('nahhas_debug_logs') || '[]'));
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    if (!isDebugAdmin(user) || !db) return;
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'debug_logs'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setRemoteLogs(rows.slice(0, 100));
    }, (error) => {
      pushDebugLog('debug-logs-read-error', error.message, {});
    });
    } catch (error) {
      pushDebugLog('debug-logs-init-error', error.message, {});
    }
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    loadLogs();
    const onDebug = () => loadLogs();
    const onError = (event) => pushDebugLog('window-error', event.message || 'Window Error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
    const onRejection = (event) => pushDebugLog('promise-error', event.reason?.message || String(event.reason || 'Unhandled Promise'), {
      stack: event.reason?.stack,
      reason: String(event.reason || '')
    });

    window.addEventListener(DEBUG_EVENT_NAME, onDebug);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    const originalError = console.error;
    console.error = (...args) => {
      try {
        pushDebugLog('console-error', args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '), {});
      } catch (e) {}
      originalError(...args);
    };

    return () => {
      window.removeEventListener(DEBUG_EVENT_NAME, onDebug);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      console.error = originalError;
    };
  }, []);

  const checkAI = async () => {
    setChecking(true);
    setAiStatus(null);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: await getAdminAIHeaders(),
        body: JSON.stringify({ mode: 'generate_questions', question: 'اختبار سريع للذكاء الاصطناعي', topic: 'النحو', count: 1, adminOnly: true })
      });
      const data = await res.json().catch(() => ({}));
      const status = { ok: res.ok && data.ok, status: res.status, data };
      setAiStatus(status);
      pushDebugLog(status.ok ? 'ai-ok' : 'ai-error', status.ok ? 'AI يعمل' : 'AI لا يعمل', status);
    } catch (e) {
      const status = { ok: false, error: e.message };
      setAiStatus(status);
      pushDebugLog('ai-error', e.message, { stack: e.stack });
    } finally {
      setChecking(false);
    }
  };

  const checkFirebase = async () => {
    try {
      await getDoc(doc(db, 'settings', 'public'));
      pushDebugLog('firebase-ok', 'Firebase متصل', {});
      alert('Firebase متصل ✅');
    } catch (e) {
      pushDebugLog('firebase-error', e.message, { stack: e.stack });
      alert(`Firebase Error: ${e.message}`);
    }
  };

  const copyLogs = async () => {
    await navigator.clipboard?.writeText(JSON.stringify({ localLogs: logs, platformLogs: remoteLogs }, null, 2));
    alert('تم نسخ سجل التشخيص.');
  };

  const clearLogs = () => {
    localStorage.removeItem('nahhas_debug_logs');
    setLogs([]);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-24 right-4 z-[99999] bg-slate-900 text-white rounded-full shadow-2xl px-4 py-3 font-black text-sm border border-white/20">
        🛠 Debug
      </button>

      {open && (
        <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm p-3 md:p-6 overflow-y-auto" dir="rtl">
          <div className="bg-white max-w-5xl mx-auto rounded-3xl shadow-2xl overflow-hidden border-t-8 border-slate-900">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">لوحة التشخيص الداخلية</h2>
                <p className="text-xs text-slate-300">بديل F12 على الموبايل والآيباد</p>
              </div>
              <button onClick={() => setOpen(false)} className="bg-white/10 hover:bg-white/20 rounded-full p-2"><X/></button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button onClick={checkAI} disabled={checking} className="bg-fuchsia-600 text-white rounded-xl p-3 font-black disabled:opacity-50">{checking ? 'فحص AI...' : 'فحص AI'}</button>
                <button onClick={checkFirebase} className="bg-blue-600 text-white rounded-xl p-3 font-black">فحص Firebase</button>
                <button onClick={copyLogs} className="bg-emerald-600 text-white rounded-xl p-3 font-black">نسخ السجل</button>
                <button onClick={clearLogs} className="bg-red-100 text-red-700 rounded-xl p-3 font-black">مسح السجل</button>
              </div>

              {aiStatus && (
                <div className={`rounded-2xl p-4 border ${aiStatus.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <p className={`font-black ${aiStatus.ok ? 'text-emerald-700' : 'text-red-700'}`}>{aiStatus.ok ? 'AI يعمل ✅' : 'AI لا يعمل ❌'}</p>
                  <pre dir="ltr" className="mt-2 bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-[260px]">{JSON.stringify(aiStatus, null, 2)}</pre>
                </div>
              )}


              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                <h3 className="font-black text-purple-800 mb-3">أخطاء المنصة من كل المستخدمين</h3>
                <div className="space-y-3 max-h-[420px] overflow-auto">
                  {remoteLogs.map(log => (
                    <div key={log.id} className="bg-white border rounded-2xl p-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <p className="font-black text-slate-800">{log.title}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-1 font-bold">{log.type} • {log.userEmail || 'مستخدم'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 break-all">{log.page}</p>
                      <p className="text-sm text-blue-700 font-bold mt-2">{explainDebugError(log.title)}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-500 font-bold">عرض التفاصيل</summary>
                        <pre dir="ltr" className="mt-2 bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-[260px]">{JSON.stringify(log.details || {}, null, 2)}</pre>
                      </details>
                    </div>
                  ))}
                  {!remoteLogs.length && <p className="text-center text-purple-400 font-bold py-8">لا توجد أخطاء مرسلة من المستخدمين بعد.</p>}
                </div>
              </div>

              <div className="bg-slate-50 border rounded-2xl p-4">
                <h3 className="font-black text-slate-800 mb-3">آخر الأخطاء والأحداث</h3>
                <div className="space-y-3 max-h-[520px] overflow-auto">
                  {logs.map(log => (
                    <div key={log.id} className="bg-white border rounded-2xl p-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <p className="font-black text-slate-800">{log.title}</p>
                        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-1 font-bold">{log.type} • {log.at}</span>
                      </div>
                      <p className="text-sm text-blue-700 font-bold mt-2">{explainDebugError(log.title)}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-500 font-bold">عرض التفاصيل</summary>
                        <pre dir="ltr" className="mt-2 bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-[260px]">{JSON.stringify(log.details || {}, null, 2)}</pre>
                      </details>
                    </div>
                  ))}
                  {!logs.length && <p className="text-center text-slate-400 font-bold py-8">لا توجد أخطاء مسجلة.</p>}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm font-bold text-amber-800 leading-relaxed">
                عند ظهور مشكلة: افتح هذه اللوحة، اضغط "نسخ السجل"، وابعتلي التفاصيل. كده نعرف السبب بدون F12.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState('landing');
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
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setLoading(true);
        const unsubUser = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
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
        return () => unsubUser();
      } else { setUserData(null); setLoading(false); }
    });
    return () => unsubAuth();
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
    <AnimatePresence mode='wait'>
      <DesignSystemLoader />
      <DebugCollector user={user} />
      <PlatformPerformanceBooster />
      <MobileExamHelperStyles />
      {!user ? (
        viewMode === 'landing' ? <LandingPage key="landing" onAuthClick={() => setViewMode('auth')} installPrompt={deferredPrompt ? handleInstallClick : null} /> : <AuthPage key="auth" onBack={() => setViewMode('landing')} />
      ) : (
        user.email === 'mido16280@gmail.com' ? <AdminDashboard key="admin" user={user} /> : <StudentDashboard key="student" user={user} userData={userData} installPrompt={deferredPrompt ? handleInstallClick : null} />
      )}
    </AnimatePresence>
    </AppErrorBoundary>
  );
}

export default App;
