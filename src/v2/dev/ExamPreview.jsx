// Development-only: the exam runner with a sample exam (writes to Firestore are blocked by the preview script).
import { Suspense, lazy } from 'react';

const ExamRunner = lazy(() => import('@features/exams/runner/ExamRunner.jsx'));
const passage = 'قال الشاعر في وصف الوطن: «وطني لو شُغلت بالخلد عنه نازعتني إليه في الخلد نفسي». والوطن عند الشاعر ليس أرضًا فقط، بل ذكريات وأهل وتاريخ يسكن القلب. '.repeat(4);
const exam = {
  id: 'preview-exam', title: 'امتحان النحو الشامل', duration: 45, accessCode: '', startTime: new Date(Date.now() - 864e5).toISOString(), endTime: new Date(Date.now() + 864e5).toISOString(),
  questions: [
    { text: passage, subQuestions: [
      { id: 'q1', type: 'mcq', text: 'ما الفكرة الرئيسية للأبيات؟', options: ['حب الوطن والحنين إليه', 'وصف الطبيعة', 'الفخر بالنفس', 'الرثاء'], correctIdx: 0, branch: 'النصوص' },
      { id: 'q2', type: 'mcq', text: 'ما إعراب كلمة «نفسي»؟', options: ['فاعل مرفوع', 'مفعول به', 'مبتدأ', 'خبر'], correctIdx: 0, branch: 'النحو' },
    ] },
    { text: '', subQuestions: [
      { id: 'q3', type: 'mcq', text: 'أي الأفعال التالية من أخوات كان؟', options: ['ظنّ', 'صار', 'علم', 'رأى'], correctIdx: 1, branch: 'النحو' },
    ] },
  ],
};

export default function ExamPreview() {
  return <Suspense fallback={null}><ExamRunner exam={{ ...exam, attemptId: 'preview-attempt' }} user={{ uid: 'preview', displayName: 'يوسف' }} onClose={() => {}} /></Suspense>;
}
