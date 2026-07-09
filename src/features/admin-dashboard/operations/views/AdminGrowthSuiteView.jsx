import PaginationBar from '@shared/components/PaginationBar.jsx';
import { GradeOptions, getGradeLabel } from '@shared/constants/grades.jsx';
import { StatBox } from '../components/StatBox.jsx';
import { GrowthSuiteHeader } from '../components/GrowthSuiteHeader.jsx';
import { GrowthSuiteTabs } from '../components/GrowthSuiteTabs.jsx';
import { GrowthSuiteStatsGrid } from '../components/GrowthSuiteStatsGrid.jsx';
import { MobileSettingsPanel } from '../components/MobileSettingsPanel.jsx';
import { SupportTicketsPanel } from '../components/SupportTicketsPanel.jsx';

export function AdminGrowthSuiteRuntimeView({ ctx }) {
  const {
    compact, tab, setTab, growthTabs, exportPlan, dashboardStats,
    plans, subscriptionCodes, planDraft, setPlanDraft, busy, savePlan,
    notifyExpiringSubscriptions, togglePlan, deletePlan, paymentFilter,
    setPaymentFilter, exportPayments, visiblePayments, paymentsPagination,
    statusLabel, toInputDate, decidePayment, units, content, exams, unitDraft,
    setUnitDraft, saveUnit, questions, filteredQuestions, questionDraft,
    setQuestionDraft, bulkQuestions, setBulkQuestions, saveQuestion, importQuestions,
    examDraft, setExamDraft, buildExamFromBank, exportQuestionBank,
    questionFilter, setQuestionFilter, questionsPagination, deleteQuestion,
    visibleStudentsAtRisk, assignmentSubmissions, examResults,
    analyticsGradeFilter, setAnalyticsGradeFilter, sendRiskFollowUp,
    exportAnalytics, messageDraft, setMessageDraft, users, sendMessage,
    messages, mobileSettings, setMobileSettings, saveMobileSettings,
    supportTickets, replyDrafts, setReplyDrafts, replyTicket, closeTicket,
  } = ctx;

  const renderPayments = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="طلبات دفع معلقة" value={dashboardStats.pendingPayments}/><StatBox title="باقات مفعلة" value={plans.filter((p)=>p.active !== false).length}/><StatBox title="طلاب VIP" value={dashboardStats.premium}/><StatBox title="أكواد غير مستخدمة" value={subscriptionCodes.filter((c)=>!c.used&&!c.isUsed).length}/></div>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-5 gap-3">
      <input className="border rounded-xl p-3" placeholder="اسم الباقة" value={planDraft.title} onChange={(e)=>setPlanDraft({...planDraft,title:e.target.value})}/>
      <input className="border rounded-xl p-3" type="number" placeholder="السعر" value={planDraft.price} onChange={(e)=>setPlanDraft({...planDraft,price:e.target.value})}/>
      <input className="border rounded-xl p-3" type="number" placeholder="الأيام" value={planDraft.days} onChange={(e)=>setPlanDraft({...planDraft,days:e.target.value})}/>
      <input className="border rounded-xl p-3" placeholder="المميزات" value={planDraft.features} onChange={(e)=>setPlanDraft({...planDraft,features:e.target.value})}/>
      <button disabled={busy} onClick={savePlan} className="bg-emerald-700 text-white rounded-xl p-3 font-black">حفظ الباقة</button>
    </section>
    <section className="bg-white rounded-3xl border p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="font-black">الباقات الحالية</h3>
        <button onClick={notifyExpiringSubscriptions} className="bg-amber-100 text-amber-800 rounded-xl px-4 py-2 font-black">تنبيه قرب انتهاء الاشتراك</button>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {plans.map((plan)=><div key={plan.id} className="border rounded-2xl p-4 bg-slate-50">
          <div className="flex justify-between gap-2"><b>{plan.title}</b><span className={plan.active === false ? 'text-red-600 font-black' : 'text-emerald-700 font-black'}>{plan.active === false ? 'متوقفة' : 'مفعلة'}</span></div>
          <p className="text-sm text-slate-600 mt-2">{plan.price || 0} جنيه • {plan.days || 30} يوم</p>
          <p className="text-xs text-slate-500 mt-2">{Array.isArray(plan.features) ? plan.features.join('، ') : plan.features}</p>
          <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>togglePlan(plan)} className="bg-white border rounded-xl p-2 font-bold">{plan.active === false ? 'تفعيل' : 'إيقاف'}</button><button onClick={()=>deletePlan(plan)} className="bg-red-50 text-red-700 rounded-xl p-2 font-bold">حذف</button></div>
        </div>)}
        {!plans.length && <p className="text-slate-500 font-bold">لا توجد باقات بعد.</p>}
      </div>
    </section>
    <section className="bg-white rounded-3xl border p-5 overflow-x-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3"><h3 className="font-black">طلبات الدفع</h3><div className="flex gap-2"><select className="border rounded-xl p-2" value={paymentFilter} onChange={(e)=>setPaymentFilter(e.target.value)}><option value="all">كل الطلبات</option><option value="pending">معلقة</option><option value="approved">مقبولة</option><option value="rejected">مرفوضة</option></select><button onClick={exportPayments} className="bg-slate-900 text-white rounded-xl px-4 py-2 font-black">تصدير Excel</button></div></div>
      {visiblePayments.length ? paymentsPagination.pageItems.map((p)=><div key={p.id} className="min-w-[760px] grid grid-cols-7 gap-2 border-b py-3 text-sm items-center"><b>{p.studentName || p.name || p.email || p.userId}</b><span>{p.amount || p.price || '—'} جنيه</span><span>{p.method || '—'}</span><span>{statusLabel(p.status)}</span><span>{toInputDate(p.createdAt) || '—'}</span><button disabled={p.status==='approved'} onClick={()=>decidePayment(p,'approved')} className="bg-emerald-600 disabled:bg-slate-200 text-white rounded-lg px-3 py-2 font-bold">قبول</button><button onClick={()=>decidePayment(p,'rejected')} className="bg-red-50 text-red-700 rounded-lg px-3 py-2 font-bold">رفض</button></div>) : <p className="text-slate-500 font-bold">لا توجد طلبات دفع حسب الفلتر.</p>}
      <PaginationBar page={paymentsPagination.page} totalPages={paymentsPagination.totalPages} totalItems={paymentsPagination.totalItems} pageSize={paymentsPagination.pageSize} onPageChange={paymentsPagination.setPage} label="طلبات الدفع" />
    </section>
  </div>;


  const renderCourses = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="وحدات منظمة" value={units.length}/><StatBox title="فيديوهات" value={content.filter((c)=>c.type==='video').length}/><StatBox title="ملفات وروابط" value={content.filter((c)=>['file','link','html','interactive_exam'].includes(c.type)).length}/><StatBox title="امتحانات مرتبطة" value={exams.length}/></div>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-6 gap-3">
      <input className="border rounded-xl p-3 md:col-span-2" placeholder="اسم الوحدة / الأسبوع" value={unitDraft.title} onChange={(e)=>setUnitDraft({...unitDraft,title:e.target.value})}/>
      <select className="border rounded-xl p-3" value={unitDraft.grade} onChange={(e)=>setUnitDraft({...unitDraft,grade:e.target.value})}><GradeOptions/></select>
      <input className="border rounded-xl p-3" type="number" placeholder="الأسبوع" value={unitDraft.week} onChange={(e)=>setUnitDraft({...unitDraft,week:e.target.value})}/>
      <input className="border rounded-xl p-3" type="date" value={unitDraft.publishAt} onChange={(e)=>setUnitDraft({...unitDraft,publishAt:e.target.value})}/>
      <button onClick={saveUnit} className="bg-blue-700 text-white rounded-xl p-3 font-black">حفظ الوحدة</button>
      <select className="border rounded-xl p-3 md:col-span-3" value={unitDraft.prerequisiteContentId} onChange={(e)=>setUnitDraft({...unitDraft,prerequisiteContentId:e.target.value})}><option value="">بدون شرط سابق</option>{content.map((c)=><option key={c.id} value={c.id}>{c.title}</option>)}</select>
      <select className="border rounded-xl p-3" value={unitDraft.status} onChange={(e)=>setUnitDraft({...unitDraft,status:e.target.value})}><option value="published">منشور</option><option value="draft">مسودة</option></select>
    </section>
    <section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">خريطة الكورس</h3>{units.length ? units.map((u)=><div key={u.id} className="grid md:grid-cols-5 gap-2 border-b py-3 text-sm"><b>{u.title}</b><span>{getGradeLabel(u.grade)}</span><span>الأسبوع {u.week}</span><span>{statusLabel(u.status)}</span><span>{u.publishAt || 'نشر فوري'}</span></div>) : <p className="text-slate-500 font-bold">ابدأ بإنشاء أول وحدة.</p>}</section>
  </div>;

  const renderQuestions = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="إجمالي الأسئلة" value={questions.length}/><StatBox title="نتائج الفلتر" value={filteredQuestions.length}/><StatBox title="نحو" value={questions.filter((q)=>q.branch==='النحو').length}/><StatBox title="صعبة" value={questions.filter((q)=>q.difficulty==='hard').length}/></div>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-4 gap-3">
      <textarea className="border rounded-xl p-3 md:col-span-2 min-h-28" placeholder="نص السؤال" value={questionDraft.text} onChange={(e)=>setQuestionDraft({...questionDraft,text:e.target.value})}/>
      <textarea className="border rounded-xl p-3 md:col-span-2 min-h-28" placeholder={'الاختيارات كل اختيار في سطر'} value={questionDraft.options} onChange={(e)=>setQuestionDraft({...questionDraft,options:e.target.value})}/>
      <select className="border rounded-xl p-3" value={questionDraft.grade} onChange={(e)=>setQuestionDraft({...questionDraft,grade:e.target.value})}><GradeOptions/></select>
      <select className="border rounded-xl p-3" value={questionDraft.branch} onChange={(e)=>setQuestionDraft({...questionDraft,branch:e.target.value})}><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option><option>عام</option></select>
      <input className="border rounded-xl p-3" placeholder="الدرس/الموضوع" value={questionDraft.topic} onChange={(e)=>setQuestionDraft({...questionDraft,topic:e.target.value})}/>
      <select className="border rounded-xl p-3" value={questionDraft.difficulty} onChange={(e)=>setQuestionDraft({...questionDraft,difficulty:e.target.value})}><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
      <input className="border rounded-xl p-3" type="number" min="0" placeholder="رقم الإجابة الصحيحة يبدأ من 0" value={questionDraft.correctIdx} onChange={(e)=>setQuestionDraft({...questionDraft,correctIdx:e.target.value})}/>
      <input className="border rounded-xl p-3 md:col-span-2" placeholder="شرح الإجابة" value={questionDraft.explanation} onChange={(e)=>setQuestionDraft({...questionDraft,explanation:e.target.value})}/>
      <button onClick={saveQuestion} className="bg-purple-700 text-white rounded-xl p-3 font-black">إضافة السؤال</button>
    </section>
    <section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-2">استيراد CSV</h3><p className="text-xs text-slate-500 font-bold mb-3">الصيغة: text,grade,branch,topic,difficulty,option1|option2|option3,correctIdx,explanation</p><textarea className="w-full border rounded-2xl p-3 min-h-32" value={bulkQuestions} onChange={(e)=>setBulkQuestions(e.target.value)} /><button onClick={importQuestions} className="mt-3 bg-slate-900 text-white rounded-xl px-5 py-3 font-black">استيراد الأسئلة</button></section>
    <section className="bg-white rounded-3xl border p-5 grid md:grid-cols-6 gap-3">
      <h3 className="font-black md:col-span-6">توليد مسودة امتحان من بنك الأسئلة</h3>
      <input className="border rounded-xl p-3 md:col-span-2" placeholder="عنوان الامتحان" value={examDraft.title} onChange={(e)=>setExamDraft({...examDraft,title:e.target.value})}/>
      <select className="border rounded-xl p-3" value={examDraft.grade} onChange={(e)=>setExamDraft({...examDraft,grade:e.target.value})}><option value="all">كل المراحل</option><GradeOptions/></select>
      <select className="border rounded-xl p-3" value={examDraft.branch} onChange={(e)=>setExamDraft({...examDraft,branch:e.target.value})}><option value="all">كل الفروع</option><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option><option>عام</option></select>
      <select className="border rounded-xl p-3" value={examDraft.difficulty} onChange={(e)=>setExamDraft({...examDraft,difficulty:e.target.value})}><option value="all">كل الصعوبات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select>
      <input className="border rounded-xl p-3" type="number" min="1" placeholder="عدد الأسئلة" value={examDraft.count} onChange={(e)=>setExamDraft({...examDraft,count:e.target.value})}/>
      <input className="border rounded-xl p-3" type="number" min="5" placeholder="المدة بالدقائق" value={examDraft.durationMinutes} onChange={(e)=>setExamDraft({...examDraft,durationMinutes:e.target.value})}/>
      <button onClick={buildExamFromBank} className="bg-indigo-700 text-white rounded-xl p-3 font-black md:col-span-5">إنشاء مسودة الامتحان</button>
    </section>
    <section className="bg-white rounded-3xl border p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4"><h3 className="font-black">إدارة الأسئلة</h3><button onClick={exportQuestionBank} className="bg-slate-900 text-white rounded-xl px-4 py-2 font-black">تصدير Excel</button></div>
      <div className="grid md:grid-cols-5 gap-3 mb-4"><input className="border rounded-xl p-3 md:col-span-2" placeholder="بحث في السؤال/الشرح" value={questionFilter.search} onChange={(e)=>setQuestionFilter({...questionFilter,search:e.target.value})}/><select className="border rounded-xl p-3" value={questionFilter.grade} onChange={(e)=>setQuestionFilter({...questionFilter,grade:e.target.value})}><option value="all">كل المراحل</option><GradeOptions/></select><select className="border rounded-xl p-3" value={questionFilter.branch} onChange={(e)=>setQuestionFilter({...questionFilter,branch:e.target.value})}><option value="all">كل الفروع</option><option>النحو</option><option>البلاغة</option><option>الأدب</option><option>القصة</option><option>عام</option></select><select className="border rounded-xl p-3" value={questionFilter.difficulty} onChange={(e)=>setQuestionFilter({...questionFilter,difficulty:e.target.value})}><option value="all">كل الصعوبات</option><option value="easy">سهل</option><option value="medium">متوسط</option><option value="hard">صعب</option></select></div>
      {questionsPagination.pageItems.map((q)=><div key={q.id} className="border-b py-3 text-sm"><div className="flex justify-between gap-3"><b>{q.text}</b><button onClick={()=>deleteQuestion(q)} className="text-red-700 bg-red-50 rounded-lg px-3 py-1 font-bold">حذف</button></div><p className="text-xs text-slate-500 mt-1">{getGradeLabel(q.grade)} • {q.branch} • {q.topic} • {statusLabel(q.difficulty)}</p></div>)}
      {!filteredQuestions.length && <p className="text-slate-500 font-bold">لا توجد أسئلة مطابقة.</p>}
      <PaginationBar page={questionsPagination.page} totalPages={questionsPagination.totalPages} totalItems={questionsPagination.totalItems} pageSize={questionsPagination.pageSize} onPageChange={questionsPagination.setPage} label="بنك الأسئلة" />
    </section>
  </div>;


  const renderAnalytics = () => <div className="space-y-5">
    <div className="grid md:grid-cols-4 gap-3"><StatBox title="طلاب يحتاجون متابعة" value={visibleStudentsAtRisk.length}/><StatBox title="متوسط الامتحانات" value={`${dashboardStats.avg}%`}/><StatBox title="تسليمات واجب" value={assignmentSubmissions.length}/><StatBox title="نتائج مكتملة" value={examResults.filter((r)=>r.status==='completed').length}/></div>
    <div className="bg-white rounded-3xl border p-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <select className="border rounded-xl p-3" value={analyticsGradeFilter} onChange={(e)=>setAnalyticsGradeFilter(e.target.value)}><option value="all">كل المراحل</option><GradeOptions/></select>
      <div className="flex flex-wrap gap-2"><button onClick={sendRiskFollowUp} className="bg-amber-600 text-white rounded-xl px-5 py-3 font-black">إرسال تنبيه متابعة</button><button onClick={exportAnalytics} className="bg-indigo-700 text-white rounded-xl px-5 py-3 font-black">تصدير Excel</button></div>
    </div>
    <section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">أولوية المتابعة</h3>{visibleStudentsAtRisk.slice(0,50).map((u)=><div key={u.id || u.uid || u.email} className="grid md:grid-cols-6 gap-2 border-b py-3 text-sm"><b>{u.name || u.email}</b><span>{getGradeLabel(u.grade)}</span><span>متوسط {u.avg}%</span><span>{u.resultsCount} امتحان</span><span>{u.submitted} واجب</span><span className="font-black text-red-700">خطر {u.risk}%</span></div>)}{!visibleStudentsAtRisk.length && <p className="text-slate-500 font-bold">لا يوجد طلاب يحتاجون متابعة حسب الفلتر.</p>}</section>
  </div>;


  const renderNotifications = () => {
    const recipientCount = messageDraft.audience === 'all'
      ? users.length
      : messageDraft.audience === 'grade'
        ? users.filter((u)=>messageDraft.grade === 'all' || u.grade === messageDraft.grade).length
        : messageDraft.userIdsText.split(/[\n,]+/).map((x)=>x.trim()).filter(Boolean).length;
    return <div className="space-y-5"><section className="bg-white rounded-3xl border p-5 grid md:grid-cols-4 gap-3"><input className="border rounded-xl p-3 md:col-span-2" placeholder="عنوان التنبيه" value={messageDraft.title} onChange={(e)=>setMessageDraft({...messageDraft,title:e.target.value})}/><select className="border rounded-xl p-3" value={messageDraft.audience} onChange={(e)=>setMessageDraft({...messageDraft,audience:e.target.value})}><option value="all">كل الطلاب</option><option value="grade">مرحلة محددة</option><option value="selected">طلاب محددين</option></select><select className="border rounded-xl p-3" value={messageDraft.grade} onChange={(e)=>setMessageDraft({...messageDraft,grade:e.target.value})}><option value="all">كل المراحل</option><GradeOptions/></select><textarea className="border rounded-xl p-3 md:col-span-2 min-h-28" placeholder="نص التنبيه" value={messageDraft.body} onChange={(e)=>setMessageDraft({...messageDraft,body:e.target.value})}/><textarea className="border rounded-xl p-3 min-h-28" placeholder="IDs الطلاب لو التنبيه محدد" value={messageDraft.userIdsText} onChange={(e)=>setMessageDraft({...messageDraft,userIdsText:e.target.value})}/><div className="space-y-2"><input type="datetime-local" className="border rounded-xl p-3 w-full" value={messageDraft.scheduledAt} onChange={(e)=>setMessageDraft({...messageDraft,scheduledAt:e.target.value})}/><p className="text-xs font-black text-slate-500">عدد المستلمين المتوقع: {recipientCount}</p></div><button onClick={sendMessage} className="bg-amber-600 text-white rounded-xl p-3 font-black">إرسال التنبيه</button></section><section className="bg-white rounded-3xl border p-5"><h3 className="font-black mb-3">آخر التنبيهات</h3>{messages.slice(0,30).map((m)=><div key={m.id} className="border-b py-3"><b>{m.title}</b><p className="text-sm text-slate-600">{m.body}</p><p className="text-xs text-slate-400">{statusLabel(m.audience)} • {m.grade || 'all'} {m.scheduledAt ? `• مجدول: ${m.scheduledAt}` : ''}</p></div>)}</section></div>;
  };


  const renderMobile = () => (
    <MobileSettingsPanel
      mobileSettings={mobileSettings}
      onChange={setMobileSettings}
      onSave={saveMobileSettings}
    />
  );

  const renderSupport = () => (
    <SupportTicketsPanel
      supportTickets={supportTickets}
      openTickets={dashboardStats.openTickets}
      replyDrafts={replyDrafts}
      setReplyDrafts={setReplyDrafts}
      replyTicket={replyTicket}
      closeTicket={closeTicket}
      statusLabel={statusLabel}
    />
  );

  const renderActive = () => ({ payments: renderPayments, courses: renderCourses, questions: renderQuestions, analytics: renderAnalytics, notifications: renderNotifications, mobile: renderMobile, support: renderSupport }[tab] || renderPayments)();


  return (
    <div className="space-y-6" dir="rtl">
      {!compact && <GrowthSuiteHeader onExport={exportPlan} />}
      {!compact && <GrowthSuiteTabs tabs={growthTabs} activeTab={tab} onChange={setTab} />}
      {!compact && <GrowthSuiteStatsGrid stats={dashboardStats} />}
      {renderActive()}
    </div>
  );
}
