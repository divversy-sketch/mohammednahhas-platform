import { useState, useEffect } from 'react';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PlayCircle, Video, Facebook, Code, DownloadCloud } from '../../shared/icons/lucide-shim.jsx';

import { db } from '../../services/firebase';
import SecureVideoPlayer from '@features/video-security/player/SecureVideoPlayer.jsx';


import { ModernLogo, FloatingArabicBackground, WisdomBox } from '../../features/home/HomeWidgets';

import InteractiveViewer from '../../features/content/InteractiveViewer';


import { WhatsAppContactButton } from '../../shared/core/platformShared.jsx';


export const LandingPage = ({ onAuthClick, installPrompt }) => {
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
      <WhatsAppContactButton />
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

export default LandingPage;
