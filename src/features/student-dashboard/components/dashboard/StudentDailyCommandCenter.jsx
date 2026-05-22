import { useEffect, useMemo, useState } from 'react';
import { Crown, PlayCircle, ClipboardList, QrCode, Quote, Sparkles } from '@shared/icons/lucide-shim.jsx';

const encouragements = [
  'خطوة صغيرة النهارده تفرق معاك آخر السنة.',
  'ركز في محاضرة واحدة كويس أحسن من فتح عشر حاجات وخلاص.',
  'الغلط مش مشكلة؛ المشكلة إنك تسيبه من غير مراجعة.',
  'شد حيلك يا بطل، المنهج بيتلم واحدة واحدة.',
];

const StudentDailyCommandCenter = ({
  userData,
  isPremium,
  nextStudyAction,
  inProgressExam,
  nextOpenExam,
  pendingAssignmentsCount,
  averageScore,
  videoCompletionPercent,
  subscriptionDaysLeft,
  setActiveTab
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setQuoteIndex((idx) => (idx + 1) % encouragements.length), 5500);
    return () => clearInterval(timer);
  }, []);

  const firstName = String(userData?.name || 'بطل').split(' ')[0];
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null ? 'VIP مفعل' : `${subscriptionDaysLeft} يوم متبقي`)
    : 'مجاني / يحتاج تفعيل';

  const quickCards = useMemo(() => ([
    { label: 'حالة الاشتراك', value: subscriptionText, icon: <Crown size={18} />, action: () => setActiveTab('subscription'), tone: isPremium ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100' },
    { label: 'تقدم المحاضرات', value: `${videoCompletionPercent}%`, icon: <PlayCircle size={18} />, action: () => setActiveTab('videos'), tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'متوسط الامتحانات', value: averageScore ? `${averageScore}%` : 'ابدأ أول امتحان', icon: <ClipboardList size={18} />, action: () => setActiveTab('exams'), tone: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'واجبات مطلوبة', value: pendingAssignmentsCount ? `${pendingAssignmentsCount} واجب` : 'لا يوجد', icon: <QrCode size={18} />, action: () => setActiveTab('assignments'), tone: pendingAssignmentsCount ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100' }
  ]), [subscriptionText, isPremium, videoCompletionPercent, averageScore, pendingAssignmentsCount, setActiveTab]);

  return (
    <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white/95 p-4 md:p-6 shadow-xl overflow-hidden relative">
      <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-teal-200/30 blur-3xl" />

      <div className="relative z-10 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-5 md:p-6 text-white shadow-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-200 border border-amber-300/20">
            <Sparkles size={14} /> رسالة اليوم
          </span>
          <h2 className="mt-4 text-2xl md:text-3xl font-black leading-tight">
            أهلاً <span className="text-amber-300">{firstName}</span>، خلّي بداية مذاكرتك واضحة.
          </h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <Quote className="mb-2 text-amber-300" size={22} />
            <p className="text-base md:text-lg font-black leading-8 text-white transition-all">{encouragements[quoteIndex]}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-4 md:p-5 flex flex-col justify-between gap-4">
          <div>
            <p className="text-sm font-black text-amber-700">خطوتك التالية</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-950 mt-1">{nextStudyAction.title}</h3>
            <p className="text-sm font-bold text-slate-600 mt-2 line-clamp-2">{nextStudyAction.text}</p>
          </div>
          <button onClick={nextStudyAction.action} className={`rounded-2xl px-5 py-3 font-black shadow-lg transition hover:-translate-y-0.5 ${nextStudyAction.tone || 'bg-slate-900 text-white'}`}>
            <span className="flex items-center justify-center gap-2">{nextStudyAction.icon}{nextStudyAction.button}</span>
          </button>
        </div>
      </div>

      {(inProgressExam || nextOpenExam) && (
        <div className="relative z-10 mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-black">{inProgressExam ? 'لديك محاولة محفوظة' : 'أقرب امتحان متاح'}</p>
              <p className="text-sm font-bold text-blue-700 mt-1">{(inProgressExam || nextOpenExam)?.title || 'امتحان متاح'}</p>
            </div>
            <button onClick={() => setActiveTab('exams')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700">فتح الامتحانات</button>
          </div>
        </div>
      )}

      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {quickCards.map((card) => (
          <button key={card.label} onClick={card.action} className={`text-right rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}>
            <div className="flex items-center justify-between gap-2"><span className="font-black text-xs">{card.label}</span>{card.icon}</div>
            <p className="text-lg font-black mt-2">{card.value}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudentDailyCommandCenter;
