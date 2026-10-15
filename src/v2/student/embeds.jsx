// Feature panels that already work (courses, messages, live classes, learning path...).
// They load only when their page opens, and render inside .nx-bridge so their Tailwind colours follow the v2 theme.
import { lazy, Suspense } from 'react';
import { Skeleton } from '../ui/kit.jsx';

const pick = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

export const SecureVideoPlayer = lazy(() => import('@features/video-security/player/SecureVideoPlayer.jsx'));
export const InteractiveViewer = lazy(() => import('@features/content/InteractiveViewer'));
export const ExamPreStartPanel = pick(() => import('@features/smartLearning/SmartLearningEngine.jsx'), 'ExamPreStartPanel');
export const SmartHomeworkScanner = lazy(() => import('@features/homework/SmartHomeworkScanner.jsx'));

export const StudentCoursesHub = pick(() => import('@features/courses/CourseSystem'), 'StudentCoursesHub');
export const StudentMessagesInbox = pick(() => import('@features/smartLearning/SmartLearningEngine.jsx'), 'StudentMessagesInbox');
export const StudentRemediationCenter = pick(() => import('@features/smartLearning/SmartLearningEngine.jsx'), 'StudentRemediationCenter');
export const StudentLiveClassesPanel = pick(() => import('@features/product/ProductExperienceSuite.jsx'), 'StudentLiveClassesPanel');
export const StudentCertificatePanel = pick(() => import('@features/product/ProductExperienceSuite.jsx'), 'StudentCertificatePanel');
export const StudentReviewQuiz = pick(() => import('@features/review/ReviewQuizSystem.jsx'), 'StudentReviewQuiz');
export const StudentLearningPath = lazy(() => import('@features/student/StudentLearningPath.jsx'));
export const StudentGrowthPanel = lazy(() => import('@features/insights/StudentGrowthPanel.jsx'));
export const LeaderboardV2 = lazy(() => import('./Leaderboard.jsx'));

export function EmbedFallback() {
  return (
    <div className="nx-card nx-stack" aria-busy="true" aria-label="بيحمّل">
      <Skeleton h={22} w="45%" />
      <Skeleton h={14} />
      <Skeleton h={14} w="80%" />
      <Skeleton h={120} r={18} />
    </div>
  );
}

/** Hosts an older panel inside the new look. */
export function Embed({ children }) {
  return (
    <div className="nx-embed nx-bridge">
      <Suspense fallback={<EmbedFallback />}>{children}</Suspense>
    </div>
  );
}

/** Full-screen overlays (players, scanners) — no bridge, they keep their own dark styling. */
export function Overlay({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
