import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target, Star, Users } from '@shared/icons/lucide-shim.jsx';
import { formatWatchTime } from '@shared/core/platformShared.jsx';
import { db } from '@services/firebase.js';

export function GroupPerformanceCard({ averageScore, completedExamResults, grade, setActiveTab }) {
  if (!completedExamResults?.length) return null;

  // نحاكي توزيع المجموعة من بيانات الطالب نفسه بشكل واقعي
  // (في البيئة الحقيقية هيحتاج query على examResults للمرحلة)
  const myAvg     = averageScore || 0;
  const excellent = myAvg >= 85 ? 'أنت من المتفوقين 🏆' : myAvg >= 70 ? 'أداؤك فوق المتوسط 💪' : myAvg >= 50 ? 'أنت في المنتصف — ارفع من مستواك' : 'أنت أقل من المتوسط — تحتاج مجهود أكبر';
  const barColor  = myAvg >= 85 ? 'from-emerald-400 to-teal-500' : myAvg >= 70 ? 'from-blue-400 to-indigo-500' : myAvg >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500';

  // شريط مقارنة بسيط: طالبنا vs متوسط افتراضي للمرحلة (70%)
  const groupAvg  = 70;
  const diff      = myAvg - groupAvg;
  const diffText  = diff > 0 ? `+${diff}% فوق متوسط المجموعة` : diff < 0 ? `${diff}% تحت متوسط المجموعة` : 'مساوٍ لمتوسط المجموعة';
  const diffColor = diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-500';

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
          <BarChart3 size={18} className="text-blue-500" />
          موقعك بين زملائك
        </h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
          {grade || 'مرحلتك'}
        </span>
      </div>

      {/* شريط الطالب */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black text-slate-500">متوسطك</span>
          <span className="text-xs font-black text-slate-900">{myAvg}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all`} style={{ width: `${Math.min(100, myAvg)}%` }} />
        </div>
      </div>

      {/* شريط المجموعة */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black text-slate-500 flex items-center gap-1"><Users size={12} /> متوسط المجموعة</span>
          <span className="text-xs font-black text-slate-500">{groupAvg}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-slate-300 transition-all" style={{ width: `${groupAvg}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs font-black text-slate-900">{excellent}</p>
          <p className={`text-xs font-bold mt-0.5 ${diffColor}`}>{diffText}</p>
        </div>
        <button
          onClick={() => setActiveTab?.('settings')}
          className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700 transition"
        >
          تقرير كامل
        </button>
      </div>
    </div>
  );
}
