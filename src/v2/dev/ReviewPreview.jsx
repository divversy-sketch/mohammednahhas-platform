// Development-only preview of the full exam review. /?nxPreview=review   (add &locked=1 for the "opens later" state)
import ExamReview from '../student/ExamReview.jsx';

const now = Date.now();
const locked = new URLSearchParams(window.location.search).get('locked');
const passage = 'قال الشاعر في وصف الوطن: «وطني لو شُغلت بالخلد عنه نازعتني إليه في الخلد نفسي». والوطن عند الشاعر ليس أرضًا فقط، بل [ذكريات] وأهل وتاريخ يسكن القلب.';
const exam = {
  id: 'e1', title: 'اختبار البلاغة القصير', duration: 20,
  startTime: new Date(now - 86400e3), endTime: new Date(locked ? now + 5 * 3600e3 : now - 3600e3),
  questions: [
    { text: passage, subQuestions: [
      { id: 'q1', text: 'ما الفكرة الرئيسية للأبيات؟', options: ['حب الوطن والحنين إليه', 'وصف الطبيعة', 'الفخر بالنفس', 'رثاء صديق'], correctIdx: 0, branch: 'النصوص', explanation: 'الشاعر بيأكد إن الوطن ساكن في قلبه لدرجة إنه هيحن له حتى لو دخل الجنة.' },
      { id: 'q2', text: 'نوع الأسلوب في «لو شُغلت بالخلد عنه»:', options: ['أمر', 'شرط', 'نداء', 'تعجب'], correctIdx: 1, branch: 'النحو', explanation: '«لو» حرف شرط غير جازم، وجوابه «نازعتني».' },
    ] },
    { text: '', subQuestions: [
      { id: 'q3', text: 'ما نوع الصورة في «وإذا المنيّةُ أنشبت أظفارَها»؟', options: ['تشبيه بليغ', 'استعارة مكنية', 'استعارة تصريحية', 'كناية عن صفة'], correctIdx: 1, branch: 'البلاغة', explanation: 'شبّه المنية بحيوان مفترس، وحذف المشبّه به وجاب حاجة من لوازمه وهي «الأظفار»، يبقى استعارة مكنية.' },
      { id: 'q4', text: 'التشبيه في «العلم نور» تشبيه:', options: ['تمثيلي', 'ضمني', 'بليغ', 'مرسل'], correctIdx: 2, branch: 'البلاغة', explanation: 'اتحذفت الأداة ووجه الشبه، فبقى تشبيه بليغ.' },
      { id: 'q5', text: 'أعرب «مجتهدًا» في: أصبح الطالبُ مجتهدًا', options: ['حال منصوب', 'خبر أصبح منصوب', 'مفعول به', 'نعت'], correctIdx: 1, branch: 'النحو' },
      { id: 'q6', type: 'essay', text: 'اكتب في ثلاثة أسطر رأيك في دور الوطن في حياة الإنسان.', branch: 'التعبير', maxScore: 4 },
    ] },
  ],
};
const result = { id: 'r1', examId: 'e1', status: 'completed', answers: { q1: 0, q2: 2, q3: 1, q5: 1, q6: { text: 'الوطن هو الأمان والذكريات، ومن غيره الإنسان يحس بالغربة.' } }, essayScores: { q6: 3 }, essayMaxScores: { q6: 4 }, score: 6, total: 9, percentage: 67, timeTaken: 754, submittedAt: new Date(now - 2 * 86400e3) };

export default function ReviewPreview() {
  return <ExamReview exam={exam} result={result} onClose={() => window.history.back()} onPracticeMistakes={() => {}} />;
}
