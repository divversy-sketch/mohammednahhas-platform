export const adminPageMeta = {
  dashboard: {
    eyebrow: 'V2 Admin Command Center',
    title: 'مركز قيادة المنصة',
    description: 'نظرة تشغيلية موحدة على الطلاب، الامتحانات، المحتوى، المتابعة، والتحليلات بدون تغيير أي منطق داخلي.',
  },
  users: {
    eyebrow: 'Admissions',
    title: 'طلبات التسجيل',
    description: 'مراجعة الطلاب الجدد وقبولهم أو رفضهم بسرعة مع الحفاظ على نفس صلاحيات الإدارة.',
  },
  all_users: {
    eyebrow: 'Students CRM',
    title: 'إدارة الطلاب',
    description: 'بحث، فلاتر، تصدير، وإجراءات سريعة لإدارة الطلاب النشطين من شاشة واحدة.',
  },
  password_resets: {
    eyebrow: 'Security Desk',
    title: 'طلبات تغيير كلمة السر',
    description: 'متابعة طلبات استعادة الدخول بدون كشف كلمات السر داخل التنبيهات.',
  },
  payments: {
    eyebrow: 'Revenue Operations',
    title: 'المدفوعات والاشتراكات',
    description: 'طلبات الدفع، الاشتراكات، الأكواد، ولوحات النمو في واجهة أوضح للأدمن.',
  },
  subscriptions_legacy: {
    eyebrow: 'Subscriptions',
    title: 'أكواد الاشتراك',
    description: 'توليد ومتابعة أكواد الاشتراك مع أدوات نسخ وتصدير منظمة.',
  },
  courses: {
    eyebrow: 'Learning Content',
    title: 'الكورسات والحصص',
    description: 'إدارة الكورسات، الحصص المباشرة، وربط المحتوى بتجربة الطالب.',
  },
  content: {
    eyebrow: 'Content Library',
    title: 'مكتبة المحتوى',
    description: 'رفع وتنظيم الدروس، الملفات، والفيديوهات مع تحكم في المرحلة والصلاحية.',
  },
  exams: {
    eyebrow: 'Assessment Studio',
    title: 'الامتحانات والنتائج',
    description: 'بناء الامتحانات، إدارة الوقت، النتائج، والاستثناءات من نفس المركز.',
  },
  question_bank: {
    eyebrow: 'Question Bank',
    title: 'بنك الأسئلة',
    description: 'تنظيم الأسئلة وتحليلها تمهيدًا لاستخدامها داخل الامتحانات الذكية.',
  },
  assignments: {
    eyebrow: 'Homework Ops',
    title: 'الواجبات والتسليمات',
    description: 'متابعة الواجبات وتسليمات الطلاب ومؤشرات الالتزام.',
  },
  smart_hw: {
    eyebrow: 'Smart Homework',
    title: 'الواجب الذكي',
    description: 'إنشاء ومتابعة واجبات ذكية تعتمد على مفاتيح الإجابة والتحليل.',
  },
  student_reports: {
    eyebrow: 'Student Intelligence',
    title: 'تقارير الطلاب',
    description: 'رؤية أداء الطلاب، الشهادات، والنجاح الدراسي من شاشة موحدة.',
  },
  messages_center: {
    eyebrow: 'Support Inbox',
    title: 'الرسائل والدعم',
    description: 'إدارة رسائل الطلاب وأولياء الأمور والردود والمتابعة.',
  },
  finance_dashboard: {
    eyebrow: 'Finance',
    title: 'لوحة الماليات',
    description: 'ملخص الاشتراكات والإيرادات والطلبات المالية.',
  },
  platform_settings: {
    eyebrow: 'Platform Control',
    title: 'إعدادات المنصة',
    description: 'إعدادات التشغيل، الموبايل، الجماليات، وتجربة الطالب.',
  },
  admin_roles: {
    eyebrow: 'Permissions',
    title: 'صلاحيات الأدمن',
    description: 'إدارة أدوار المساعدين والصلاحيات التفصيلية.',
  },
  audit_logs: {
    eyebrow: 'Audit Trail',
    title: 'سجل العمليات',
    description: 'متابعة العمليات الحساسة ومعرفة من قام بماذا ومتى.',
  },
  notifications_admin: {
    eyebrow: 'Broadcast Center',
    title: 'إدارة الإشعارات',
    description: 'إرسال وإدارة التنبيهات العامة والموجهة للطلاب.',
  },
};

export function getAdminPageMeta(activeTab) {
  return adminPageMeta[activeTab] || {
    eyebrow: 'Admin Workspace',
    title: 'مساحة الإدارة',
    description: 'صفحة إدارية ضمن نظام V2 الجديد.',
  };
}
