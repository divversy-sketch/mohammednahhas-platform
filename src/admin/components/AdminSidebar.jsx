import React from 'react';

export const ADMIN_TABS = [
  ['dashboard', 'Dashboard شامل'],
  ['follow_up', 'المتابعة والتقارير'],
  ['users', 'طلبات الانضمام'],
  ['all_users', 'الطلاب'],
  ['password_resets', 'تغيير كلمات السر'],
  ['payments', 'الاشتراكات والدفع'],
  ['security_center', 'مركز الحماية'],
  ['app_convert', 'تحويل App'],
  ['question_bank', 'بنك الأسئلة'],
  ['smart_exam_engine', 'محرك الامتحانات الذكي'],
  ['student_reports', 'تقارير الطلاب'],
  ['student_groups', 'المجموعات والدفعات'],
  ['messages_center', 'رسائل الطلاب'],
  ['finance_dashboard', 'اللوحة المالية'],
  ['video_security', 'حماية الفيديوهات'],
  ['platform_settings', 'إعدادات المنصة'],
  ['admin_roles', 'صلاحيات الأدمن'],
  ['audit_logs', 'سجل الإدارة'],
  ['notifications_admin', 'الإشعارات'],
  ['assignments', 'الواجبات'],
  ['exams', 'الامتحانات والنتائج'],
  ['smart_hw', 'الواجب الذكي QR'],
  ['content', 'المحتوى'],
  ['courses', 'الكورسات التعليمية'],
  ['mistakes_admin', 'بنك الأخطاء']
];

export default function AdminSidebar({ activeTab, setActiveTab }) {
  return (
    <div className="glass-panel p-4 rounded-xl h-fit space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible whitespace-nowrap scrollbar-hide">
      {ADMIN_TABS.map(([tab, label]) => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-right p-3 rounded-lg font-bold flex gap-2 transition-all ${activeTab===tab?'bg-amber-100 text-amber-700 shadow-sm border-b-4 md:border-b-0 md:border-r-4 border-amber-500':'hover:bg-slate-50 text-slate-600'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
