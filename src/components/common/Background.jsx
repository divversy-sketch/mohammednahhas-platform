import React from 'react';

const FloatingArabicBackground = React.memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0, background: 'radial-gradient(circle at center, #fdfbf7 0%, #e2e8f0 100%)' }}>
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/arabesque.png")` }} />
    {['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي', 'ض', 'ع'].map((char, i) => (
        <div key={i} className="absolute text-amber-500/15 font-arabic font-bold select-none floating-char" style={{ left: `${(i * 8.5) % 90 + 5}vw`, top: `${(i * 13) % 90 + 5}vh`, fontSize: `${(i % 3) + 3}rem`, animationDelay: `${i * 0.5}s`, animationDuration: `${15 + (i % 5)}s` }}>{char}</div>
    ))}
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-xl animate-pulse-slow" />
    <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
  </div>
));

export default FloatingArabicBackground;