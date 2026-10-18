// Development-only preview of the student app with sample data (never bundled in production).
// Open: /?nxPreview=student&nxPlatform=ios|android|web&nxForm=phone|tablet|desktop&tab=exams:open
import { useState } from 'react';
import StudentAppV2 from '../student/StudentAppV2.jsx';
import { platformNotify, platformPromptAsync } from '@shared/core/platformShared.jsx';

const day = 86400e3;
const now = Date.now();
const ts = (ms) => new Date(ms);

const videos = [
  'النحو: المبتدأ والخبر', 'البلاغة: التشبيه وأركانه', 'القصة: الفصل الأول', 'النصوص: قصيدة الوطن', 'القراءة: فن الإلقاء', 'النحو: كان وأخواتها', 'الأدب: مدرسة الإحياء', 'التعبير: كتابة المقال',
].map((title, i) => ({ id: `v${i}`, type: 'video', title, order: i + 1, isPremium: i > 2, duration: `${30 + i * 4} دقيقة`, linkedExamId: i === 0 ? 'e1' : undefined }));

const exams = [
  { id: 'e1', title: 'امتحان النحو الشامل', duration: 45, startTime: ts(now - day), endTime: ts(now + 2 * day + 3600e3), accessCode: '1234', questions: [{ subQuestions: new Array(20).fill({}) }] },
  { id: 'e2', title: 'اختبار البلاغة القصير', duration: 20, startTime: ts(now - 2 * day), endTime: ts(now + 5 * 3600e3), accessCode: '', questions: [{ subQuestions: new Array(10).fill({}) }] },
  { id: 'e3', title: 'امتحان الشهر — أكتوبر', duration: 90, startTime: ts(now + 3 * day), endTime: ts(now + 3 * day + 7200e3), questions: [{ subQuestions: new Array(40).fill({}) }] },
  { id: 'e4', title: 'تقييم القصة', duration: 30, startTime: ts(now - 20 * day), endTime: ts(now - 18 * day), questions: [] },
  { id: 'e5', title: 'امتحان التشبيه', duration: 30, startTime: ts(now - 14 * day), endTime: ts(now - 13 * day), questions: [] },
  { id: 'e6', title: 'امتحان كان وأخواتها', duration: 30, startTime: ts(now - 9 * day), endTime: ts(now - 8 * day), questions: [] },
  { id: 'e7', title: 'تقييم النصوص', duration: 30, startTime: ts(now - 5 * day), endTime: ts(now - 4 * day), questions: [] },
  { id: 'e8', title: 'مراجعة الأسبوع', duration: 25, startTime: ts(now - 2 * day), endTime: ts(now - day), questions: [] },
];
const examResults = [
  ['e4', 62, 19], ['e5', 71, 13.5], ['e6', 68, 8.5], ['e7', 84, 4.5], ['e8', 91, 1.5],
].map(([examId, percentage, ago], i) => ({ id: `r${i}`, examId, status: 'completed', percentage, score: Math.round(percentage / 5), total: 20, submittedAt: ts(now - ago * day) }));

const mistakes = [
  { id: 'm1', examTitle: 'امتحان التشبيه', question: { blockText: 'قال الشاعر في وصف العلم: «العلمُ نورٌ يُستضاءُ به، والجهلُ ظلامٌ يُضِلُّ صاحبه». فالعلم عند الشاعر [سراج] يهدي السائرين.', text: 'حدد أركان التشبيه في: «العلم نور».', studentAnswerText: 'مشبه ومشبه به فقط', correctAnswerText: 'مشبه + مشبه به (تشبيه بليغ)' }, timestamp: ts(now - 13 * day) },
  { id: 'm2', examTitle: 'امتحان كان وأخواتها', question: { text: 'ما إعراب «مجتهدًا» في: كان الطالبُ مجتهدًا؟', studentAnswerText: 'حال منصوب', correctAnswerText: 'خبر كان منصوب' }, timestamp: ts(now - 8 * day) },
  { id: 'm3', examTitle: 'امتحان كان وأخواتها', question: { text: 'أي الأفعال التالية من أخوات كان؟', studentAnswerText: 'ظنّ', correctAnswerText: 'صار' }, timestamp: ts(now - 8 * day) },
];

const videoViews = [0, 1, 2, 4, 5].map((d, i) => ({ id: `vv${i}`, videoId: `v${i}`, updatedAt: ts(now - d * day) }));
const watch = { v0: 100, v1: 100, v2: 64, v3: 12 };

export default function StudentPreview() {
  const params = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(params.get('tab') || 'home');
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingHtml, setPlayingHtml] = useState(null);
  const [preExam, setPreExam] = useState(null);
  const [scanningHwId, setScanningHwId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(params.get('sheet') === 'notifications');
  const [editFormData, setEditFormData] = useState({ name: 'محمد أحمد محمود', phone: '01012345678', parentPhone: '01198765432', grade: '3sec' });
  const [paymentDraft, setPaymentDraft] = useState({ amount: '', method: 'vodafone_cash', transactionId: '', note: '' });
  const [supportDraft, setSupportDraft] = useState({ category: 'exam', message: '' });
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const premium = params.get('free') ? false : true;

  const ctx = {
    user: { uid: 'preview', email: 'mohamed@example.com', displayName: 'محمد أحمد' },
    userData: { name: 'محمد أحمد محمود', grade: '3sec', status: 'active', subscriptionStatus: premium ? 'premium' : 'free', subscriptionExpiry: { toDate: () => ts(now + 5 * day) } },
    activeTab, setActiveTab, playingVideo, setPlayingVideo, playingHtml, setPlayingHtml, preExam, setPreExam, scanningHwId, setScanningHwId,
    showNotifications, setShowNotifications, setHasNewNotif: () => {}, editFormData, setEditFormData, setShowFocusMode: () => platformNotify('وضع التركيز'),
    paymentDraft, setPaymentDraft, isSendingPayment: false, handleSubmitPaymentRequest: () => platformNotify('تم إرسال طلب الدفع', 'success'),
    supportDraft, setSupportDraft, isSendingSupport: false, handleSendSupportTicket: () => platformNotify('وصلت رسالتك للدعم', 'success'),
    subscriptionCodeInput, setSubscriptionCodeInput, isCharging: false, handleChargeSubscriptionCode: () => platformNotify('الكود غير صحيح', 'error'),
    handleUpdateMyProfile: () => platformNotify('اتحفظت بياناتك', 'success'),
    content: videos, exams, examResults, hwResults: [{ id: 'h1', homeworkTitle: 'واجب الدرس الأول', bookName: 'كتاب الامتحان', score: 17, total: 20, feedback: 'ممتاز، راجع إعراب الخبر.', submittedAt: ts(now - 3 * day) }],
    assignments: [{ id: 'a1', title: 'تلخيص الفصل الأول من القصة', dueDate: ts(now + 2 * day) }], assignmentSubmissions: [],
    videoViews, mistakes,
    notifications: [{ id: 'n1', title: 'امتحان جديد', body: 'امتحان النحو الشامل متاح دلوقتي لحد يوم الجمعة.', createdAt: ts(now - 3600e3) }, { id: 'n2', title: 'محاضرة جديدة', body: 'نزلت محاضرة «التعبير: كتابة المقال».', createdAt: ts(now - day), read: true }],
    unseenNotificationCount: 1, isPremium: premium, subscriptionDaysLeft: 5,
    startMistakesExam: () => platformNotify('بيبدأ امتحان الأخطاء'),
    videos, filesAndLinks: [{ id: 'f1', title: 'مذكرة النحو كاملة', url: '#', description: 'PDF · ٤٢ صفحة' }, { id: 'f2', title: 'ملخص البلاغة', url: '#' }, { id: 'f3', title: 'قناة المستر على يوتيوب', type: 'link', url: '#' }],
    htmls: [{ id: 'h1', title: 'لعبة الإعراب التفاعلية' }], interactiveExams: [{ id: 'i1', title: 'تدريب: أنواع التشبيه' }],
    handlePremiumClick: (cb) => (premium ? cb() : (platformNotify('المحتوى ده للمشتركين'), setActiveTab('subscription'))),
    getVideoWatchPercent: (v) => watch[v.id] || 0,
    canOpenLinkedExam: (v) => (watch[v.id] || 0) >= 75, openLinkedExamFromVideo: () => platformNotify('بيفتح امتحان المحاضرة'),
    latestVideoActivity: { video: videos[2], isCompleted: false },
    inProgressExam: null, pendingAssignments: [{ id: 'a1', title: 'تلخيص الفصل الأول من القصة', dueDate: ts(now + 2 * day) }], pendingAssignmentsCount: 1,
    completedVideoCount: 2, videoCompletionPercent: 25, completedExamResults: examResults, averageScore: 75.2,
    weakBranches: ['التشبيه', 'إعراب الخبر', 'أخوات كان'],
    isBannedExam: false, isBannedContent: false,
    getExamAccessState: () => ({ allowed: true }),
    startExamWithCode: async (exam) => { const code = await platformPromptAsync(`اكتب كود «${exam.title}» اللي المستر إداه لك.`, { title: 'كود الامتحان', placeholder: 'الكود', icon: 'key', confirmLabel: 'ابدأ الامتحان' }); if (code !== null) platformNotify(code === exam.accessCode ? 'هيبدأ الامتحان' : 'الكود غلط', code === exam.accessCode ? 'success' : 'error'); },
    setReviewingExam: () => platformNotify('مراجعة الإجابات'),
    notify: platformNotify,
  };

  return <StudentAppV2 ctx={ctx} />;
}
