
import { Trash2 } from '../../shared/icons/lucide-shim.jsx';
import { InlineTabs } from '../../shared/core/platformShared.jsx';
import AssignmentsManager from '../parts/AssignmentsManager.jsx';
import QuestionBankManager from '@features/question-bank/components/QuestionBankManager.jsx';

export function AdminQuestionBankPage({ adminGradeFilter }) {
  return <InlineTabs tabs={[{ key: 'bank', label: 'إدارة بنك الأسئلة', content: <QuestionBankManager adminGradeFilter={adminGradeFilter} /> }]} />;
}

export function AdminAssignmentsPage({ adminGradeFilter, handleDeleteAllHomework, users = [] }) {
  return (
    <div className="space-y-4">
      <AssignmentsManager adminGradeFilter={adminGradeFilter} users={users} />
      {handleDeleteAllHomework ? (
        <div className="flex justify-end">
          <button onClick={handleDeleteAllHomework} className="apl-btn apl-btn--danger"><Trash2 size={15}/> حذف كل الواجبات وسجلاتها</button>
        </div>
      ) : null}
    </div>
  );
}

export function AdminExamViewTabs({ adminExamView, setAdminExamView }) {
  const items = [['manage', 'إدارة الامتحانات'], ['results', 'النتائج']];
  return (
    <div className="adx-seg" role="tablist" aria-label="الامتحانات">
      {items.map(([k, label]) => (
        <button key={k} type="button" role="tab" aria-selected={adminExamView === k} className={adminExamView === k ? 'is-on' : ''} onClick={() => setAdminExamView(k)}>{label}</button>
      ))}
    </div>
  );
}
