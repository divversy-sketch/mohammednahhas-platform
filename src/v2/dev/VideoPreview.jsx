// Development-only: the lecture player with a local sample video and sample parts.
import { Suspense, lazy } from 'react';

const SecureVideoPlayer = lazy(() => import('@features/video-security/player/SecureVideoPlayer.jsx'));
const video = {
  id: 'preview-video', title: 'البلاغة: التشبيه وأنواعه', branch: 'البلاغة', grade: '3sec', url: '/dev-sample.webm' /* generate locally: not shipped */, estimatedDurationMinutes: 15,
  chaptersText: '00:00 مقدمة\n2:00 أنواع التشبيه\n7:00 التشبيه المفصل\n10:30 التشبيه البليغ\n13:00 تدريبات',
};
try { localStorage.setItem('nahhas-video-resume-preview-preview-video', '515'); } catch { /* storage blocked */ }

export default function VideoPreview() {
  return <Suspense fallback={null}><SecureVideoPlayer video={video} user={{ uid: 'preview' }} userName="محمد أحمد" onClose={() => {}} onProgress={() => {}} /></Suspense>;
}
