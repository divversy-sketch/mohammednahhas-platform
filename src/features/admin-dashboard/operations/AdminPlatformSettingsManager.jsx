import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@services/firebase';
import { downloadXlsx } from '@shared/utils/exportData.js';
import { usePagination } from '@shared/hooks/usePagination.js';
import PaginationBar from '@shared/components/PaginationBar.jsx';
import { platformConfirm, platformNotify } from '@shared/core/platformShared.jsx';
import { Bell, ClipboardList, History, Save, Settings, Shield, Users } from '@shared/icons/lucide-shim.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';

import { ADMIN_ROLE_LABELS as ROLE_LABELS, ADMIN_TAB_LABELS, ROLE_TAB_ACCESS, getRolePermissions, getRoleTabs, isOwnerEmail } from '@config/adminPermissions';

const DEFAULT_SETTINGS = {
  platformName: 'منصة النحاس التعليمية',
  welcomeMessage: 'ابدأ مذاكرتك بخطوة واضحة، وراجع تقدمك باستمرار.',
  supportWhatsapp: '201500076322',
  registrationOpen: true,
  defaultExamGatePercentage: 70,
  defaultLessonWatchPercentage: 75,
  showLockedExams: true,
  showLearningPath: true,
  primaryColor: '#f59e0b',
  logoUrl: '',
};

function Field({ label, children }) {
  return <label className="block"><span className="text-xs font-black text-slate-500 mb-1 block">{label}</span>{children}</label>;
}

export function AdminPlatformSettingsManager({ userData = {} }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);

  useEffect(() => onSnapshot(doc(db, 'platform_settings', 'main'), (snap) => {
    if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
  }, () => {}), []);

  const save = async () => {
    setBusy(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'main'), {
        ...settings,
        defaultExamGatePercentage: Number(settings.defaultExamGatePercentage || 70),
        defaultLessonWatchPercentage: Number(settings.defaultLessonWatchPercentage || 75),
        updatedAt: serverTimestamp(),
        updatedBy: userData?.email || userData?.uid || 'admin',
      }, { merge: true });
      await setDoc(doc(collection(db, 'admin_client_logs')), {
        action: 'platform_settings_update',
        title: 'تعديل إعدادات المنصة العامة',
        adminEmail: userData?.email || '',
        adminName: userData?.name || '',
        createdAt: serverTimestamp(),
      });
      platformNotify('تم حفظ إعدادات المنصة وتشغيلها للواجهات المرتبطة بها.');
    } catch (error) {
      platformNotify(error?.message || 'تعذر حفظ الإعدادات');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white rounded-3xl p-5 border shadow-sm">
        <h2 className="text-2xl font-black flex gap-2 text-slate-900"><Settings className="text-amber-600"/> إعدادات المنصة العامة</h2>
        <p className="text-slate-500 font-bold mt-1">الإعدادات هنا محفوظة في Firestore وتُستخدم في تجربة الطالب والتشغيل العام بدل التعديل من الكود.</p>
      </div>
      <div className="bg-white rounded-3xl p-5 border shadow-sm grid md:grid-cols-2 gap-4">
        <Field label="اسم المنصة"><input className="w-full border rounded-xl p-3" value={settings.platformName} onChange={(e)=>setSettings({...settings, platformName:e.target.value})}/></Field>
        <Field label="رقم واتساب الدعم"><input className="w-full border rounded-xl p-3" value={settings.supportWhatsapp} onChange={(e)=>setSettings({...settings, supportWhatsapp:e.target.value})}/></Field>
        <Field label="رابط اللوجو"><input className="w-full border rounded-xl p-3" value={settings.logoUrl} onChange={(e)=>setSettings({...settings, logoUrl:e.target.value})}/></Field>
        <Field label="لون المنصة الرئيسي"><input className="w-full border rounded-xl p-3" type="color" value={settings.primaryColor} onChange={(e)=>setSettings({...settings, primaryColor:e.target.value})}/></Field>
        <Field label="رسالة الترحيب"><textarea className="w-full border rounded-xl p-3 min-h-24" value={settings.welcomeMessage} onChange={(e)=>setSettings({...settings, welcomeMessage:e.target.value})}/></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نسبة فتح الامتحان الافتراضية"><input className="w-full border rounded-xl p-3" type="number" min="0" max="100" value={settings.defaultExamGatePercentage} onChange={(e)=>setSettings({...settings, defaultExamGatePercentage:e.target.value})}/></Field>
          <Field label="نسبة مشاهدة الدرس الافتراضية"><input className="w-full border rounded-xl p-3" type="number" min="0" max="100" value={settings.defaultLessonWatchPercentage} onChange={(e)=>setSettings({...settings, defaultLessonWatchPercentage:e.target.value})}/></Field>
        </div>
        <label className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 font-black"><input type="checkbox" checked={!!settings.registrationOpen} onChange={(e)=>setSettings({...settings, registrationOpen:e.target.checked})}/> التسجيل مفتوح للطلاب الجدد</label>
        <label className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 font-black"><input type="checkbox" checked={!!settings.showLockedExams} onChange={(e)=>setSettings({...settings, showLockedExams:e.target.checked})}/> إظهار الامتحانات المقفولة للطالب مع سبب القفل</label>
        <label className="flex items-center gap-2 bg-slate-50 rounded-2xl p-4 font-black"><input type="checkbox" checked={!!settings.showLearningPath} onChange={(e)=>setSettings({...settings, showLearningPath:e.target.checked})}/> تفعيل صفحة مساري التعليمي للطالب</label>
        <button disabled={busy} onClick={save} className="md:col-span-2 bg-amber-600 text-white rounded-2xl p-4 font-black flex items-center justify-center gap-2 hover:bg-amber-700 disabled:bg-slate-300"><Save/> حفظ الإعدادات</button>
      </div>
    </div>
  );
}
