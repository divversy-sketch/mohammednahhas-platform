import { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BarChart3, Bell, BookOpen, BrainCircuit, ClipboardList, Code, Crown, FileCheck, FileText, GraduationCap, MessageSquare, PlayCircle, Sparkles, Target, Star, Users } from '@shared/icons/lucide-shim.jsx';
import { formatWatchTime } from '@shared/core/platformShared.jsx';
import { db } from '@services/firebase.js';

export function StudentNotificationCenter({ setShowNotifications, setHasNewNotif, recentNotificationItems }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Bell className="text-amber-600"/> مركز الإشعارات</h3>
            <p className="text-sm text-slate-500 mt-1">المحاضرات والامتحانات والواجبات في مكان واحد، والتواصل عبر واتساب فقط.</p>
          </div>
          <button onClick={() => { setShowNotifications(true); setHasNewNotif(false); }} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold hover:bg-slate-800 transition">عرض الكل</button>
        </div>
        <div className="space-y-2">
          {recentNotificationItems.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-5 text-center text-slate-500 font-bold">لا توجد إشعارات جديدة حاليًا.</div>
          ) : recentNotificationItems.map((n, i) => (
            <div key={n.id || i} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Bell size={17}/></div>
              <div className="min-w-0"><p className="font-black text-slate-800 truncate">{n.title || 'تنبيه جديد'}</p><p className="text-sm text-slate-600 leading-relaxed">{n.text || n.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 flex items-center gap-2 mb-2"><Bell className="text-amber-600"/> تنبيهات داخل المنصة</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">لأي استفسار أو مشكلة في التفعيل استخدم واتساب الإدارة فقط، بدون رسائل داخلية أو إشعارات داخل المنصة.</p>
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl p-3 text-sm font-black">النظام الداخلي للتنبيهات يعمل بدون طلب صلاحيات من المتصفح.</div>
      </div>
    </section>
  );
}
