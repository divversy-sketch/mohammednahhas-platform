import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target, Star, Users } from '@shared/icons/lucide-shim.jsx';
import { formatWatchTime } from '@shared/core/platformShared.jsx';
import { db } from '@services/firebase.js';

export function ContentRatingCard({ userId, contentId, contentTitle }) {
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(false);

  const submit = useCallback(async (stars) => {
    if (!userId || !contentId || loading) return;
    setLoading(true);
    try {
      const docId = `${userId}_${contentId}`;
      await setDoc(doc(db, 'content_ratings', docId), {
        userId,
        contentId,
        contentTitle: contentTitle || '',
        rating: stars,
        ratedAt: serverTimestamp(),
      }, { merge: true });
      setRating(stars);
      setSaved(true);
    } catch (e) {
      console.error('rating error', e);
    } finally {
      setLoading(false);
    }
  }, [userId, contentId, contentTitle, loading]);

  if (!contentId) return null;

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-amber-700 mb-0.5">قيّم آخر محاضرة شاهدتها</p>
        <p className="text-sm font-bold text-slate-700 truncate">{contentTitle || 'المحاضرة الحالية'}</p>
      </div>
      {saved ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-black text-amber-600">شكراً على تقييمك!</span>
          <span className="text-lg">{'⭐'.repeat(rating)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              disabled={loading}
              onClick={() => submit(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-2xl transition-transform hover:scale-125 disabled:opacity-50"
              aria-label={`تقييم ${star} نجوم`}
            >
              <Star
                size={26}
                fill={(hover || rating) >= star ? '#f59e0b' : 'none'}
                className={(hover || rating) >= star ? 'text-amber-400' : 'text-slate-300'}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   📊  مقارنة الأداء مع المجموعة
   يعتمد على examResults الموجودة — بدون أي read جديد
───────────────────────────────────────── */
