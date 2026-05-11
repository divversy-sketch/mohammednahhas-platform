import React, { useMemo, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { platformNotify } from '../../shared/core/platformShared.jsx';
import {
  DEFAULT_PLATFORM_SETTINGS,
  buildCourseTree,
  calculateStudentPerformance,
  detectWeaknesses,
  generateSmartExamFromQuestionBank,
  buildSmartReviewPlan,
  canAdmin,
} from './learningIntelligence.js';

const featureCards = [
  ['هيكلة الكورسات', 'كورس ← وحدة/باب ← درس ← فيديو/واجب/امتحان'],
  ['فتح الدروس بالتتابع', 'قواعد جاهزة للمشاهدة أو اجتياز امتحان قبل فتح المحتوى التالي'],
  ['تقرير أداء الطالب', 'ملخص مشاهدات وامتحانات وواجبات وآخر نشاط'],
  ['نقاط الضعف', 'تحليل أخطاء الطالب حسب الباب والدرس'],
  ['امتحان تلقائي', 'اختيار أسئلة من بنك الأسئلة حسب القسم والموضوع والصعوبة'],
  ['مراجعة ذكية', 'خطة مراجعة تربط الضعف بالدروس والأسئلة التدريبية'],
  ['واجبات مرتبطة بالدروس', 'نموذج ربط الدرس بواجب واختبار قصير'],
  ['إشعارات داخلية', 'تجهيز collection للإشعارات داخل حساب الطالب'],
  ['سجل نشاط الأدمن', 'تسجيل العمليات المهمة في admin_audit_logs'],
  ['صلاحيات الأدمن', 'أدوار: مالك، مدير، مشرف امتحانات، مشرف طلاب، مشرف محتوى'],
  ['Dashboard الطالب', 'تصميم ملخص: أكمل آخر درس، امتحانات، واجبات، تقدم'],
  ['مساري التعليمي', 'تقدم النحو والبلاغة والأدب والقصة'],
  ['صفحة قبل الامتحان', 'حالة التأهيل، النسبة المطلوبة، المحاولات والمدة'],
  ['هيكلة الامتحانات', 'خدمات ودوال مستقلة تسهّل التطوير لاحقًا'],
  ['هيكلة بنك الأسئلة', 'فصل المنطق عن واجهة الإدارة'],
  ['إعدادات عامة', 'اسم المنصة، التسجيل، نسب الفتح، رسائل الترحيب'],
];

function StatBox({ label, value }) {
  return <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm"><div className="text-xs text-slate-500">{label}</div><div className="text-2xl font-black text-slate-800 mt-1">{value}</div></div>;
}

export default function AdminPlatformUpgradeCenter({ ctx }) {
  const {
    activeUsersList = [], contentList = [], examsList = [], examResults = [], assignments = [], assignmentSubmissions = [], mistakes = [], videoViews = [], userData = {},
  } = ctx || {};
  const [selectedStudentId, setSelectedStudentId] = useState(activeUsersList?.[0]?.id || '');
  const [examDraft, setExamDraft] = useState({ branch: 'all', topics: '', difficulty: 'all', count: 20, title: 'امتحان ذكي من بنك الأسئلة' });
  const selectedStudent = activeUsersList.find((u) => u.id === selectedStudentId) || activeUsersList[0];

  const courseTree = useMemo(() => buildCourseTree(contentList), [contentList]);
  const performance = useMemo(() => selectedStudent ? calculateStudentPerformance({
    studentId: selectedStudent.id, content: contentList, videoViews, exams: examsList, results: examResults, assignments, assignmentSubmissions,
  }) : null, [selectedStudent, contentList, videoViews, examsList, examResults, assignments, assignmentSubmissions]);
  const weaknesses = useMemo(() => selectedStudent ? detectWeaknesses({ studentId: selectedStudent.id, results: examResults, mistakes }) : [], [selectedStudent, examResults, mistakes]);
  const reviewPlan = useMemo(() => buildSmartReviewPlan({ weaknesses, content: contentList, questionBank: [] }), [weaknesses, contentList]);

  const savePlatformDefaults = async () => {
    await addDoc(collection(db, 'platform_settings_history'), {
      ...DEFAULT_PLATFORM_SETTINGS,
      createdBy: userData.uid || userData.id || 'admin',
      createdAt: serverTimestamp(),
    });
    platformNotify('تم حفظ نسخة إعدادات المنصة الافتراضية.');
  };

  const createSmartExamDraft = async () => {
    const generatedQuestions = generateSmartExamFromQuestionBank({
      questions: [],
      branch: examDraft.branch,
      topics: examDraft.topics.split(',').map((x) => x.trim()).filter(Boolean),
      difficulty: examDraft.difficulty,
      count: Number(examDraft.count || 20),
    });
    await addDoc(collection(db, 'smart_exam_drafts'), {
      title: examDraft.title,
      filters: examDraft,
      generatedQuestionsCount: generatedQuestions.length,
      status: 'draft_filters_saved',
      createdBy: userData.uid || userData.id || 'admin',
      createdAt: serverTimestamp(),
    });
    platformNotify('تم حفظ مسودة فلتر الامتحان الذكي. اربطها ببنك الأسئلة لتوليد الأسئلة تلقائيًا.');
  };

  return (
    <div className="space-y-6 font-arabic">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6 shadow-xl">
        <h2 className="text-2xl font-black mb-2">مركز تطوير المنصة</h2>
        <p className="text-slate-200">تم تجميع الـ 16 تطوير في مركز واحد: بعضها أدوات تشغيل مباشرة، وبعضها بنية جاهزة آمنة للتفعيل التدريجي بدون كسر النظام.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <StatBox label="الطلاب" value={activeUsersList.length} />
        <StatBox label="المحتوى" value={contentList.length} />
        <StatBox label="الامتحانات" value={examsList.length} />
        <StatBox label="وحدات الكورس المكتشفة" value={courseTree.length} />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {featureCards.map(([title, body], index) => (
          <div key={title} className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md transition">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black mb-3">{index + 1}</div>
            <h3 className="font-black text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-6">{body}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
          <h3 className="font-black text-xl mb-4">هيكلة الكورسات الحالية</h3>
          <div className="space-y-3 max-h-96 overflow-auto pr-1">
            {courseTree.length ? courseTree.map((unit) => (
              <div key={unit.unitTitle} className="border rounded-2xl p-3 bg-slate-50">
                <div className="font-black text-slate-800">{unit.unitTitle}</div>
                <div className="mt-2 space-y-2">
                  {unit.lessons.map((lesson) => (
                    <div key={lesson.lessonTitle} className="bg-white rounded-xl p-3 border text-sm flex justify-between gap-2">
                      <span>{lesson.lessonTitle}</span>
                      <span className="text-slate-400">{lesson.resources.length} عنصر</span>
                    </div>
                  ))}
                </div>
              </div>
            )) : <p className="text-slate-500">لا يوجد محتوى كافٍ لبناء شجرة كورسات بعد.</p>}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
          <h3 className="font-black text-xl mb-4">تقرير أداء طالب</h3>
          <select className="w-full border rounded-xl p-3 mb-4" value={selectedStudent?.id || ''} onChange={(e) => setSelectedStudentId(e.target.value)}>
            {activeUsersList.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
          {performance ? <div className="grid grid-cols-2 gap-3">
            <StatBox label="فيديوهات مشاهدة" value={`${performance.watchedVideos}/${performance.totalVideos}`} />
            <StatBox label="امتحانات محلولة" value={`${performance.solvedExams}/${performance.totalExams}`} />
            <StatBox label="واجبات مرسلة" value={`${performance.submittedAssignments}/${performance.totalAssignments}`} />
            <StatBox label="متوسط الامتحانات" value={`${performance.averageExamPercentage}%`} />
          </div> : <p className="text-slate-500">اختر طالبًا لعرض التقرير.</p>}

          <div className="mt-5">
            <h4 className="font-black mb-2">نقاط الضعف</h4>
            {weaknesses.length ? weaknesses.map((w) => <div key={w.topic} className="flex justify-between rounded-xl bg-red-50 text-red-700 p-3 mb-2"><span>{w.topic}</span><b>{w.count}</b></div>) : <p className="text-slate-500 text-sm">لا توجد نقاط ضعف كافية لعرضها.</p>}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
          <h3 className="font-black text-xl mb-4">إنشاء امتحان تلقائي من بنك الأسئلة</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded-xl p-3" placeholder="عنوان الامتحان" value={examDraft.title} onChange={(e) => setExamDraft({ ...examDraft, title: e.target.value })} />
            <select className="border rounded-xl p-3" value={examDraft.branch} onChange={(e) => setExamDraft({ ...examDraft, branch: e.target.value })}>
              <option value="all">كل الأقسام</option><option value="النحو">النحو</option><option value="البلاغة">البلاغة</option><option value="الأدب">الأدب</option><option value="القصة">القصة</option>
            </select>
            <input className="border rounded-xl p-3" placeholder="موضوعات مفصولة بفواصل" value={examDraft.topics} onChange={(e) => setExamDraft({ ...examDraft, topics: e.target.value })} />
            <select className="border rounded-xl p-3" value={examDraft.difficulty} onChange={(e) => setExamDraft({ ...examDraft, difficulty: e.target.value })}>
              <option value="all">كل الصعوبات</option><option value="سهل">سهل</option><option value="متوسط">متوسط</option><option value="صعب">صعب</option>
            </select>
            <input className="border rounded-xl p-3" type="number" min="1" max="100" value={examDraft.count} onChange={(e) => setExamDraft({ ...examDraft, count: e.target.value })} />
          </div>
          <button onClick={createSmartExamDraft} className="mt-4 bg-blue-600 text-white px-5 py-3 rounded-xl font-black hover:bg-blue-700">حفظ مسودة امتحان ذكي</button>
        </div>

        <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
          <h3 className="font-black text-xl mb-4">إعدادات وصلاحيات</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            {Object.entries(DEFAULT_PLATFORM_SETTINGS).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 border p-3"><b>{key}</b><div className="text-slate-500 mt-1">{String(value)}</div></div>)}
          </div>
          <button onClick={savePlatformDefaults} className="mt-4 bg-emerald-600 text-white px-5 py-3 rounded-xl font-black hover:bg-emerald-700">حفظ نسخة إعدادات</button>
          <div className="mt-5 rounded-2xl border bg-amber-50 p-4 text-amber-800">
            <b>صلاحية مشرف الامتحانات:</b> {canAdmin('exams_supervisor', 'exams:write') ? 'مسموح بتعديل الامتحانات' : 'غير مسموح'}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-xl mb-4">خطة المراجعة الذكية</h3>
        {reviewPlan.length ? reviewPlan.map((item) => (
          <div key={item.topic} className="rounded-2xl border p-4 mb-3">
            <div className="font-black">{item.topic}</div>
            <div className="text-sm text-slate-500">{item.reason}</div>
          </div>
        )) : <p className="text-slate-500">تظهر هنا خطة المراجعة عندما تتوفر أخطاء أو نتائج كافية.</p>}
      </div>
    </div>
  );
}
