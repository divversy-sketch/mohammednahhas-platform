import React, { useEffect, useState } from 'react';
import { Headphones } from '../../shared/icons/lucide-shim.jsx';

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function StudyStreakFocusCard({ user, onStartFocus }) {
  const key = `nahhas_streak_${user?.uid || user?.email || 'guest'}`;
  const [streak, setStreak] = useState({ streak: 1, todayMinutes: 0, lastDate: '' });

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
    const next = { ...saved };
    if (next.lastDate !== today) {
      next.streak = next.lastDate === yesterday ? safeNumber(next.streak, 0) + 1 : 1;
      next.todayMinutes = 0;
      next.lastDate = today;
    }
    setStreak(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    const timer = setInterval(() => {
      setStreak(prev => {
        const updated = { ...prev, todayMinutes: safeNumber(prev.todayMinutes, 0) + 1, lastDate: today };
        try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [key]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 font-bold mb-1">سلسلة المذاكرة</p>
          <h3 className="text-2xl font-black text-slate-900">{safeNumber(streak.streak, 1)} يوم متواصل 🔥</h3>
          <p className="text-xs text-slate-500 mt-1">وقت المذاكرة اليوم: {safeNumber(streak.todayMinutes, 0)} دقيقة</p>
        </div>
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-2xl">{safeNumber(streak.streak, 1)}</div>
      </div>
      <button onClick={onStartFocus} className="bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 shadow-sm text-right flex items-center justify-between gap-4 transition">
        <div>
          <p className="text-sm text-amber-300 font-bold mb-1">وضع التركيز</p>
          <h3 className="text-2xl font-black">ابدأ جلسة مذاكرة هادئة</h3>
          <p className="text-xs text-slate-300 mt-1">مؤقت Pomodoro ومهام الجلسة بدون تشتيت.</p>
        </div>
        <Headphones size={34} className="text-amber-300" />
      </button>
    </section>
  );
}
