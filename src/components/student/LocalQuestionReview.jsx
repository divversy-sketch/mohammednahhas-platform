
import { CheckCircle, XCircle, Lightbulb } from '../../shared/icons/lucide-shim.jsx';

export default function LocalQuestionReview({ question, answer }) {
  const isEssay = question?.type === 'essay';
  const correctIdx = question?.correctIdx;
  const isCorrect = !isEssay && answer === correctIdx;
  const correctText = Array.isArray(question?.options) ? question.options?.[correctIdx] : '';
  const studentText = Array.isArray(question?.options) ? question.options?.[answer] : '';
  return (
    <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right">
      <h4 className="font-black text-slate-800 flex items-center gap-2 mb-2"><Lightbulb size={18} className="text-amber-500" /> مراجعة السؤال داخلية</h4>
      {isEssay ? <p className="text-sm text-slate-600">السؤال مقالي ويحتاج مراجعة يدوية من الأدمن.</p> : <div className="space-y-2 text-sm"><p className={`font-bold flex items-center gap-2 ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>{isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}{isCorrect ? 'إجابتك صحيحة.' : 'إجابتك غير صحيحة.'}</p>{!isCorrect && <p className="text-slate-700">إجابتك: <b>{studentText || 'لم يتم الإجابة'}</b></p>}<p className="text-slate-700">الإجابة الصحيحة: <b>{correctText || 'غير محددة'}</b></p>{question?.explanation && <p className="bg-white rounded-xl p-3 border text-slate-700">{question.explanation}</p>}</div>}
    </div>
  );
}
