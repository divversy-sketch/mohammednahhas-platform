import React from 'react';
import { Trash2 } from '../../shared/icons/lucide-shim.jsx';
import { InlineTabs } from '../../shared/core/platformShared.jsx';
import AssignmentsManager from '../parts/AssignmentsManager.jsx';
import QuestionBankManager from '../parts/QuestionBankManager.jsx';

export function AdminQuestionBankPage({ adminGradeFilter }) {
  return <InlineTabs tabs={[{ key: 'bank', label: 'إدارة بنك الأسئلة', content: <QuestionBankManager adminGradeFilter={adminGradeFilter} /> }]} />;
}

export function AdminAssignmentsPage({ adminGradeFilter, handleDeleteAllHomework }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleDeleteAllHomework} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Trash2 size={16}/> حذف كل الواجبات وسجلاتها</button>
      </div>
      <InlineTabs tabs={[{ key: 'assignments_admin', label: 'إدارة الواجبات', content: <AssignmentsManager adminGradeFilter={adminGradeFilter} /> }]} />
    </div>
  );
}

export function AdminExamViewTabs({ adminExamView, setAdminExamView }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button onClick={() => setAdminExamView('manage')} className={`px-5 py-3 rounded-2xl font-black ${adminExamView === 'manage' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}>إدارة الامتحانات</button>
      <button onClick={() => setAdminExamView('results')} className={`px-5 py-3 rounded-2xl font-black ${adminExamView === 'results' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>النتائج</button>
    </div>
  );
}
