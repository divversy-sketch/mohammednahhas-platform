import { lazy, Suspense } from 'react';
import { Bell, X } from '@shared/icons/lucide-shim.jsx';
import { FloatingArabicBackground, PWAInstallBox } from '@features/home/HomeWidgets';
import SmartHomeworkScanner from '@features/homework/SmartHomeworkScanner.jsx';
import StudentBottomNav from './StudentBottomNav.jsx';
import StudentSidebar from './StudentSidebar.jsx';
import StudentTopbar from './StudentTopbar.jsx';
import StudentMainContent from './StudentMainContent.jsx';

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

function StudentNotificationsModal({ ctx }) {
  if (!ctx.showNotifications) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => ctx.setShowNotifications(false)}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-auto p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2"><Bell className="text-amber-600"/> إشعارات المنصة</h2>
          <button onClick={() => ctx.setShowNotifications(false)} className="bg-slate-100 rounded-full p-2"><X size={18}/></button>
        </div>
        {(ctx.notifications || []).length ? (ctx.notifications || []).map((notification, index) => (
          <div key={notification.id || index} className="border rounded-2xl p-4 mb-3 bg-slate-50">
            <p className="font-black text-slate-900">{notification.title || 'تنبيه جديد'}</p>
            <p className="text-sm text-slate-600 mt-1 leading-6">{notification.body || notification.text || notification.message}</p>
            <p className="text-[11px] text-slate-400 mt-2">{notification.createdAt?.toDate ? notification.createdAt.toDate().toLocaleString('ar-EG') : ''}</p>
          </div>
        )) : <div className="text-center text-slate-500 font-bold py-8">لا توجد إشعارات حاليًا.</div>}
      </div>
    </div>
  );
}

export default function StudentDashboardShell({ ctx }) {
  return (
    <LazyPanel>
      <div className="v2-student-shell relative font-['Cairo'] min-h-screen block" dir="rtl">
        <StudentBottomNav activeTab={ctx.activeTab} setActiveTab={ctx.setActiveTab} />
        {ctx.playingVideo && <LazyPanel><SecureVideoPlayer video={ctx.playingVideo} user={ctx.user} userName={ctx.userData?.name} onClose={() => ctx.setPlayingVideo(null)} onProgress={ctx.handleVideoProgress} /></LazyPanel>}
        {ctx.playingHtml && <LazyPanel><InteractiveViewer content={ctx.playingHtml} user={ctx.userData} onClose={() => ctx.setPlayingHtml(null)} /></LazyPanel>}
        <FloatingArabicBackground />
        <PWAInstallBox installPrompt={ctx.installPrompt} />
        <StudentNotificationsModal ctx={ctx} />
        <StudentSidebar ctx={ctx} />
        <main className="v2-student-main relative z-10">
          <StudentTopbar ctx={ctx} />
          <StudentMainContent ctx={ctx} />
        </main>
        {ctx.preExam && (
          <LazyPanel>
            <ExamPreStartPanel
              exam={ctx.preExam}
              results={ctx.examResults}
              previousExam={ctx.preExam.accessRule?.requiredExamId ? ctx.exams.find((exam) => exam.id === ctx.preExam.accessRule.requiredExamId) : null}
              previousPercent={(() => {
                const previousResults = ctx.preExam.accessRule?.requiredExamId ? ctx.examResults.filter((result) => result.examId === ctx.preExam.accessRule.requiredExamId && result.status === 'completed') : [];
                return previousResults.length ? Math.max(...previousResults.map((result) => Number(result.percentage ?? result.percent ?? result.scorePercentage ?? result.score ?? 0))) : null;
              })()}
              onStart={() => { const target = ctx.preExam; ctx.setPreExam(null); ctx.startExamWithCode(target); }}
              onClose={() => ctx.setPreExam(null)}
            />
          </LazyPanel>
        )}
        {ctx.scanningHwId && <LazyPanel><SmartHomeworkScanner hwId={ctx.scanningHwId} user={ctx.user} onClose={() => ctx.setScanningHwId(null)} /></LazyPanel>}
      </div>
    </LazyPanel>
  );
}
