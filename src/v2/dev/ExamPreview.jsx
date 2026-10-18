// Development-only: the exam runner with a sample exam (writes to Firestore are blocked by the preview script).
import { Suspense, lazy } from 'react';

const ExamRunner = lazy(() => import('@features/exams/runner/ExamRunner.jsx'));
const passage = 'قال الشاعر في وصف الوطن: «وطني لو شُغلت بالخلد عنه نازعتني إليه في الخلد نفسي». والوطن عند الشاعر ليس أرضًا فقط، بل ذكريات وأهل وتاريخ يسكن القلب. '.repeat(4);
const exam = {
  id: 'preview-exam', title: 'امتحان النحو الشامل', duration: 45, accessCode: '', startTime: new Date(Date.now() - 864e5).toISOString(), endTime: new Date(Date.now() + 864e5).toISOString(),
  questions: [
    { text: passage, subQuestions: [
      { id: 'q1', type: 'mcq', text: 'ما الفكرة الرئيسية للأبيات؟', options: ['حب الوطن والحنين إليه', 'وصف الطبيعة', 'الفخر بالنفس', 'الرثاء'], correctIdx: 0, branch: 'النصوص' },
      { id: 'q2', type: 'mcq', text: 'ما إعراب كلمة «نفسي»؟', options: ['فاعل مرفوع', 'مفعول به', 'مبتدأ', 'خبر'], correctIdx: 0, branch: 'النصوص' },
      { id: 'q3', type: 'mcq', text: 'في قوله «وطني لو شُغلت بالخلد عنه» أسلوب:', options: ['شرط', 'نداء', 'تعجب', 'استفهام'], correctIdx: 0, branch: 'النصوص' },
    ] },
    { text: '', subQuestions: [
      { id: 'q4', type: 'mcq', text: 'أي الأفعال التالية من أخوات كان؟', options: ['ظنّ', 'صار', 'علم', 'رأى'], correctIdx: 1, branch: 'النحو' },
      { id: 'q5', type: 'mcq', text: 'الفعل «أصبح» في جملة «أصبح الجو جميلًا»:', options: ['فعل تام', 'فعل ناسخ', 'فعل جامد', 'فعل أمر'], correctIdx: 1, branch: 'النحو' },
      { id: 'q6', type: 'mcq', text: '«العلم نور» نوع التشبيه:', options: ['تمثيلي', 'بليغ', 'ضمني', 'مجمل'], correctIdx: 1, branch: 'البلاغة' },
      { id: 'q7', type: 'mcq', text: 'سر جمال التشبيه في «العلم نور»:', options: ['التوضيح', 'التشخيص', 'السجع', 'الطباق'], correctIdx: 0, branch: 'البلاغة' },
      { id: 'q8', type: 'essay', text: 'اكتب فقرة من ثلاثة أسطر عن حب الوطن.', branch: 'التعبير' },
    ] },
  ],
};

export default function ExamPreview() {
  return <Suspense fallback={null}><ExamRunner exam={{ ...exam, attemptId: 'preview-attempt' }} user={{ uid: 'preview', displayName: 'محمد' }} onClose={() => {}} /></Suspense>;
}
