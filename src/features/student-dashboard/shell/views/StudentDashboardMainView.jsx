import { lazy, Suspense } from 'react';
import { Bell, X } from '@shared/icons/lucide-shim.jsx';
import { auth } from '@services/firebase';
import MobileStudentBottomNav from '@features/student/MobileStudentBottomNav';
import { PWAInstallBox, FloatingArabicBackground } from '@features/home/HomeWidgets';
import { StudentV2Sidebar, StudentV2Topbar } from '@features/student-dashboard/components/chrome/StudentV2Chrome.jsx';
import SmartHomeworkScanner from '@features/homework/SmartHomeworkScanner.jsx';

import StudentHomeTab from '../tabs/StudentHomeTab.jsx';
import StudentPerformanceTab from '../tabs/StudentPerformanceTab.jsx';
import StudentSubscriptionTab from '../tabs/StudentSubscriptionTab.jsx';
import StudentMistakesBankTab from '../tabs/StudentMistakesBankTab.jsx';
import StudentCoursesTab from '../tabs/StudentCoursesTab.jsx';
import StudentReviewQuizTab from '../tabs/StudentReviewQuizTab.jsx';
import StudentLearningPathTab from '../tabs/StudentLearningPathTab.jsx';
import StudentRemediationTab from '../tabs/StudentRemediationTab.jsx';
import StudentMessagesTab from '../tabs/StudentMessagesTab.jsx';
import StudentSupportTab from '../tabs/StudentSupportTab.jsx';
import StudentVideosTab from '../tabs/StudentVideosTab.jsx';
import StudentFilesTab from '../tabs/StudentFilesTab.jsx';
import StudentHtmlsTab from '../tabs/StudentHtmlsTab.jsx';
import StudentInteractiveExamsTab from '../tabs/StudentInteractiveExamsTab.jsx';
import StudentExamsTab from '../tabs/StudentExamsTab.jsx';
import StudentAssignmentsTab from '../tabs/StudentAssignmentsTab.jsx';
import StudentSmartHomeworkResultsTab from '../tabs/StudentSmartHomeworkResultsTab.jsx';
import StudentSettingsTab from '../tabs/StudentSettingsTab.jsx';

const SecureVideoPlayer = lazy(() => import('@features/video-security/player/SecureVideoPlayer.jsx'));
const InteractiveViewer = lazy(() => import('@features/content/InteractiveViewer'));
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

export const StudentDashboardMainView = ({ ctx }) => {
  const {
    user,
    userData,
    installPrompt,
    activeTab,
    setActiveTab,
    mobileMenu,
    setMobileMenu,
    setLearningHubTab,
    playingVideo,
    setPlayingVideo,
    playingHtml,
    setPlayingHtml,
    showNotifications,
    setShowNotifications,
    setShowFocusMode,
    preExam,
    setPreExam,
    scanningHwId,
    setScanningHwId,
    exams,
    examResults,
    notifications,
    unseenNotificationCount,
    isPremium,
    isBannedContent,
    isBannedExam,
    handleVideoProgress,
    startExamWithCode
  } = ctx;

  const studentTabCtx = ctx;

  return (
    <LazyPanel>
    <div className="v2-student-shell relative font-['Cairo'] min-h-screen block" dir="rtl">

      <MobileStudentBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {playingVideo && <LazyPanel><SecureVideoPlayer video={playingVideo} user={user} userName={userData?.name} onClose={() => setPlayingVideo(null)} onProgress={handleVideoProgress} /></LazyPanel>}
      {playingHtml && <LazyPanel><InteractiveViewer content={playingHtml} user={userData} onClose={() => setPlayingHtml(null)} /></LazyPanel>}
      {/* النظام امتحانات الطلاب متوقفة مؤقتًا  */}
      <FloatingArabicBackground />
      <PWAInstallBox installPrompt={installPrompt} />
      {showNotifications && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNotifications(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-auto p-5" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-black flex items-center gap-2"><Bell className="text-amber-600"/> إشعارات المنصة</h2><button onClick={() => setShowNotifications(false)} className="bg-slate-100 rounded-full p-2"><X size={18}/></button></div>
            {(notifications || []).length ? (notifications || []).map((n, i) => (
              <div key={n.id || i} className="border rounded-2xl p-4 mb-3 bg-slate-50"><p className="font-black text-slate-900">{n.title || 'تنبيه جديد'}</p><p className="text-sm text-slate-600 mt-1 leading-6">{n.body || n.text || n.message}</p><p className="text-[11px] text-slate-400 mt-2">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString('ar-EG') : ''}</p></div>
            )) : <div className="text-center text-slate-500 font-bold py-8">لا توجد إشعارات حاليًا.</div>}
          </div>
        </div>
      )}
      
      <StudentV2Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        setLearningHubTab={setLearningHubTab}
        isBannedContent={isBannedContent}
        isBannedExam={isBannedExam}
        auth={auth}
        studentName={userData?.name}
        isPremium={isPremium}
      />

      <main className="v2-student-main relative z-10">
        <StudentV2Topbar
          installPrompt={installPrompt}
          setShowFocusMode={setShowFocusMode}
          setShowNotifications={setShowNotifications}
          unseenNotificationCount={unseenNotificationCount}
          isPremium={isPremium}
          subscriptionExpiry={userData?.subscriptionExpiry}
          setMobileMenu={setMobileMenu}
        />

        <div className="nh-page-body">

        <StudentHomeTab ctx={studentTabCtx} />


        <StudentPerformanceTab ctx={studentTabCtx} />

        <StudentSubscriptionTab ctx={studentTabCtx} />

        <StudentMistakesBankTab ctx={studentTabCtx} />

          <StudentCoursesTab ctx={studentTabCtx} />

          <StudentReviewQuizTab ctx={studentTabCtx} />

          <StudentLearningPathTab ctx={studentTabCtx} />

          <StudentRemediationTab ctx={studentTabCtx} />

          <StudentMessagesTab ctx={studentTabCtx} />

          <StudentSupportTab ctx={studentTabCtx} />

          <StudentVideosTab ctx={studentTabCtx} />

        <StudentFilesTab ctx={studentTabCtx} />
        
        <StudentHtmlsTab ctx={studentTabCtx} />

        <StudentInteractiveExamsTab ctx={studentTabCtx} />
        
        <StudentExamsTab ctx={studentTabCtx} />

        <StudentAssignmentsTab ctx={studentTabCtx} />

        <StudentSmartHomeworkResultsTab ctx={studentTabCtx} />

        <StudentSettingsTab ctx={studentTabCtx} />
        </div>
      </main>
      {preExam && (
        <LazyPanel>
        <ExamPreStartPanel
          exam={preExam}
          results={examResults}
          previousExam={preExam.accessRule?.requiredExamId ? exams.find((e) => e.id === preExam.accessRule.requiredExamId) : null}
          previousPercent={(() => {
            const prev = preExam.accessRule?.requiredExamId ? examResults.filter((r) => r.examId === preExam.accessRule.requiredExamId && r.status === 'completed') : [];
            return prev.length ? Math.max(...prev.map((r) => Number(r.percentage ?? r.percent ?? r.scorePercentage ?? r.score ?? 0))) : null;
          })()}
          onStart={() => { const target = preExam; setPreExam(null); startExamWithCode(target); }}
          onClose={() => setPreExam(null)}
        />
        </LazyPanel>
      )}
      {scanningHwId && <LazyPanel><SmartHomeworkScanner hwId={scanningHwId} user={user} onClose={() => setScanningHwId(null)} /></LazyPanel>}
    </div>
    </LazyPanel>
  );;
};

export default StudentDashboardMainView;
