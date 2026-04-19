import React, { useEffect } from 'react';

const DesignSystemLoader = () => {
  useEffect(() => {
    if (!document.getElementById('tailwind-script')) {
      const script = document.createElement('script'); script.id = 'tailwind-script'; script.src = "https://cdn.tailwindcss.com";
      script.onload = () => {
        if(window.tailwind) {
            window.tailwind.config = {
              theme: {
                extend: {
                  fontFamily: { sans: ['Cairo', 'sans-serif'], arabic: ['Aref Ruqaa', 'serif'] },
                  colors: { amber: { 50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 900: '#78350f' }, royal: { 900: '#0f172a', 800: '#1e293b' } },
                  backgroundImage: { 'arabesque': "url('https://www.transparenttextures.com/patterns/arabesque.png')" }
                }
              }
            }
        }
      };
      document.head.appendChild(script);
    }
    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link'); link.id = 'cairo-font'; link.rel = 'stylesheet'; link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Aref+Ruqaa:wght@400;700&display=swap"; document.head.appendChild(link);
    }
    if (!document.getElementById('html2pdf-script')) {
        const script = document.createElement('script'); script.id = 'html2pdf-script'; script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"; document.head.appendChild(script);
    }
  }, []);

  return (
    <style>{`
      html, body { font-family: 'Cairo', sans-serif; background-color: #f8fafc; direction: rtl; -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
      ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: #f1f1f1; } ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #d97706, #b45309); border-radius: 4px; }
      .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .glass-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(6px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: transform 0.2s ease, box-shadow 0.2s ease; will-change: transform; }
      .glass-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(217, 119, 6, 0.15); border-color: #fbbf24; }
      .text-gradient-gold { background: linear-gradient(45deg, #b45309, #d97706, #fbbf24, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: shine 3s linear infinite; }
      @keyframes shine { to { background-position: 200% center; } }
      @keyframes floatChar { 0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); } 50% { transform: translate3d(0, -30px, 0) rotate(10deg); } }
      .floating-char { animation: floatChar ease-in-out infinite; will-change: transform; }
      @keyframes pulseSlow { 0%, 100% { transform: scale3d(1, 1, 1); opacity: 0.2; } 50% { transform: scale3d(1.1, 1.1, 1); opacity: 0.4; } }
      .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite; will-change: transform, opacity; }
      .watermark-text { position: absolute; pointer-events: none; z-index: 9999; color: rgba(0, 0, 0, 0.08); font-weight: 900; font-size: 1.5rem; transform: rotate(-30deg); white-space: nowrap; text-shadow: 0 0 2px rgba(255,255,255,0.5); }
      .watermark-video { position: absolute; pointer-events: none; z-index: 9999; color: rgba(255, 255, 255, 0.4); font-weight: 900; font-size: 1.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); white-space: nowrap; animation: moveWatermark 25s linear infinite; }
      @keyframes moveWatermark { 0% { top: 10%; left: 10%; transform: rotate(-5deg); } 25% { top: 80%; left: 50%; transform: rotate(5deg); } 50% { top: 30%; left: 80%; transform: rotate(-5deg); } 75% { top: 70%; left: 10%; transform: rotate(5deg); } 100% { top: 10%; left: 10%; transform: rotate(-5deg); } }
      .no-select { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
    `}</style>
  );
};

export default DesignSystemLoader;