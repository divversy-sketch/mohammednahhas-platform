import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target, Star, Users } from '@shared/icons/lucide-shim.jsx';
import { formatWatchTime } from '@shared/core/platformShared.jsx';
import { db } from '@services/firebase.js';

export function ContinueWatchingCard({ latestVideoActivity, inProgressExam, nextStudyAction }) {
  if (!latestVideoActivity && !inProgressExam) return null;

  const isVideo = !!latestVideoActivity && !latestVideoActivity.isCompleted;
  const isExam  = !isVideo && !!inProgressExam;
  if (!isVideo && !isExam) return null;

  const title    = isVideo ? latestVideoActivity.video?.title    : inProgressExam?.title;
  const subject  = isVideo ? latestVideoActivity.video?.subject  : inProgressExam?.subject;
  const percent  = isVideo ? (latestVideoActivity.percent || 0)  : null;
  const watched  = isVideo
    ? (() => {
        const s = Math.round(latestVideoActivity.watchedSeconds || 0);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}د ${sec}ث` : `${sec}ث`;
      })()
    : null;

  return (
    <div className="rounded-3xl overflow-hidden border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch">

        {/* الأيقونة / الصورة */}
        <div className="flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 sm:w-36 p-6 shrink-0">
          {isVideo
            ? <PlayCircle size={52} className="text-white drop-shadow" />
            : <ClipboardList size={52} className="text-white drop-shadow" />
          }
        </div>

        {/* المحتوى */}
        <div className="flex flex-col justify-between gap-3 p-4 flex-1 min-w-0">
          <div>
            <p className="text-xs font-black text-amber-600 flex items-center gap-1 mb-1">
              <Sparkles size={13} />
              {isVideo ? 'أكمل من حيث توقفت' : 'لديك محاولة امتحان محفوظة'}
            </p>
            <h3 className="text-base md:text-lg font-black text-slate-900 leading-snug line-clamp-2">
              {title || 'محتوى محفوظ'}
            </h3>
            {subject && (
              <p className="text-xs text-slate-500 font-bold mt-0.5">{subject}</p>
            )}
            {isVideo && watched && (
              <p className="text-xs text-amber-700 font-bold mt-1">⏱ شاهدت {watched}</p>
            )}
          </div>

          {/* شريط التقدم (للفيديو فقط) */}
          {isVideo && percent !== null && (
            <div>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
              <p className="text-xs text-amber-600 font-black mt-1">{percent}% مكتمل</p>
            </div>
          )}
        </div>

        {/* زر الاستكمال */}
        <div className="flex items-center justify-center p-4 shrink-0">
          <button
            onClick={nextStudyAction?.action}
            className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black px-5 py-3 rounded-2xl shadow hover:scale-[1.03] transition flex items-center gap-2 whitespace-nowrap"
          >
            {isVideo ? <PlayCircle size={18} fill="currentColor" /> : <ClipboardList size={18} />}
            {isVideo ? 'استكمل الآن' : 'أكمل الامتحان'}
          </button>
        </div>

      </div>
    </div>
  );
}
