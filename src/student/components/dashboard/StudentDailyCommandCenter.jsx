import { Crown, PlayCircle, ClipboardList, QrCode } from '../../../shared/icons/lucide-shim.jsx';

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
  const subscriptionText = isPremium
    ? (subscriptionDaysLeft === null ? 'VIP مفعل' : `${subscriptionDaysLeft} يوم متبقي`)
    : 'مجاني / يحتاج تفعيل';

  const quickCards = [
    { label: 'حالة الاشتراك', value: subscriptionText, icon: <Crown size={18} />, action: () => setActiveTab('subscription'), tone: isPremium ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100' },
    { label: 'تقدم المحاضرات', value: `${videoCompletionPercent}%`, icon: <PlayCircle size={18} />, action: () => setActiveTab('videos'), tone: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'متوسط الامتحانات', value: averageScore ? `${averageScore}%` : 'ابدأ أول امتحان', icon: <ClipboardList size={18} />, action: () => setActiveTab('exams'), tone: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'واجبات مطلوبة', value: pendingAssignmentsCount ? `${pendingAssignmentsCount} واجب` : 'لا يوجد', icon: <QrCode size={18} />, action: () => setActiveTab('assignments'), tone: pendingAssignmentsCount ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100' }
  ];

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-4 md:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-amber-700">مركز اليوم الدراسي</p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">ابدأ من هنا يا {userData?.name || 'بطل'}</h2>
          <p className="text-sm text-slate-500 mt-2">خطوة واحدة واضحة بدل ما الطالب يلف في المنصة كأنه بيدوّر على ريموت التلفزيون.</p>
        </div>
        <button onClick={nextStudyAction.action} className={`rounded-2xl px-5 py-3 font-black shadow-lg transition hover:-translate-y-0.5 ${nextStudyAction.tone || 'bg-slate-900 text-white'}`}>
          <span className="flex items-center justify-center gap-2">{nextStudyAction.icon}{nextStudyAction.button}</span>
          <span className="block text-xs opacity-80 mt-1">{nextStudyAction.text}</span>
        </button>
      </div>

      {(inProgressExam || nextOpenExam) && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-black">{inProgressExam ? 'لديك محاولة محفوظة' : 'أقرب امتحان متاح'}</p>
              <p className="text-sm font-bold text-blue-700 mt-1">{(inProgressExam || nextOpenExam)?.title || 'امتحان متاح'}</p>
            </div>
            <button onClick={() => setActiveTab('exams')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700">فتح الامتحانات</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
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
