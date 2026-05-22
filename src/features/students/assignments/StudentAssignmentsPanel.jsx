import { useState } from 'react';

import { doc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FileCheck } from '@shared/icons/lucide-shim.jsx';

import { db } from '@services/firebase';


import { getGradeLabel } from '@shared/constants/grades.jsx';


import { uploadToCloudinary } from '@services/cloudinaryUpload';

import { platformNotify, safeNumber } from '@shared/core/platformShared.jsx';


export const StudentAssignmentsPanel = ({ assignments = [], submissions = [], user, userData }) => {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentView, setAssignmentView] = useState('open');
  const [answerText, setAnswerText] = useState('');
  const [answerImage, setAnswerImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadImage = async (file) => {
    try {
      const uploaded = await uploadToCloudinary(file, { kind: 'image', folder: 'nahhas-platform/assignment-answers' });
      setAnswerImage(uploaded.url);
    } catch (err) {
      platformNotify(err?.message || 'فشل رفع الصورة على Cloudinary.');
    }
  };

  const submitAssignment = async () => {
    if (!selectedAssignment) return;
    if (!answerText.trim() && !answerImage) return platformNotify('أضف نص الإجابة أو صورة واحدة على الأقل');
    setIsSubmitting(true);
    const existing = submissions.find(s => s.assignmentId === selectedAssignment.id);
    const payload = {
      assignmentId: selectedAssignment.id,
      assignmentTitle: selectedAssignment.title,
      grade: selectedAssignment.grade,
      branch: selectedAssignment.branch,
      studentId: user.uid,
      studentName: userData?.name,
      answerText,
      answerImage,
      reviewStatus: 'submitted',
      totalMarks: safeNumber(selectedAssignment.totalMarks, 20),
      submittedAt: serverTimestamp()
    };
    if (existing) await updateDoc(doc(db, 'assignment_submissions', existing.id), payload);
    else await addDoc(collection(db, 'assignment_submissions'), payload);
    setIsSubmitting(false);
    setSelectedAssignment(null);
    setAnswerText('');
    setAnswerImage('');
    platformNotify('تم تسليم الواجب بنجاح');
  };

  const visibleAssignments = assignments.filter(item => {
    const sub = submissions.find(s => s.assignmentId === item.id);
    if (assignmentView === 'open') return !sub;
    if (assignmentView === 'submitted') return !!sub && sub.reviewStatus !== 'graded';
    if (assignmentView === 'graded') return !!sub && sub.reviewStatus === 'graded';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FileCheck/> الواجبات</h2>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {[["open","المطلوب"], ["submitted","تم التسليم"], ["graded","تم التصحيح"], ["all","الكل"]].map(([key,label]) => (
              <button key={key} onClick={() => setAssignmentView(key)} className={`px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap ${assignmentView === key ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAssignments.map(item => {
            const sub = submissions.find(s => s.assignmentId === item.id);
            return <div key={item.id} className="bg-white border rounded-2xl p-4">
              <div className="flex flex-wrap gap-2 mb-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{item.branch}</span><span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{getGradeLabel(item.grade)}</span></div>
              <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
              <p className="text-sm text-slate-500 my-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500"><span>الدرجة: {item.totalMarks}</span><span>{sub ? (sub.reviewStatus === 'graded' ? `تم التصحيح: ${sub.score}/${sub.maxScore}` : 'تم التسليم') : 'لم يُسلَّم بعد'}</span></div>
              <button onClick={() => setSelectedAssignment(item)} className="mt-3 w-full bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold">{sub ? 'تعديل / عرض التسليم' : 'ابدأ الواجب'}</button>
            </div>;
          })}
          {visibleAssignments.length === 0 && <div className="col-span-full bg-white border rounded-2xl p-8 text-center text-slate-500">لا توجد واجبات في هذا القسم حالياً.</div>}
        </div>
      </div>
      {selectedAssignment && <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-xl font-bold mb-4">تسليم واجب: {selectedAssignment.title}</h3>
        <textarea className="w-full border rounded-xl p-3 h-32 mb-3" placeholder="اكتب إجابتك هنا" value={answerText} onChange={e=>setAnswerText(e.target.value)}></textarea>
        <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} className="mb-3" />
        {answerImage && <img src={answerImage} alt="submission" className="w-40 h-40 object-cover rounded-xl border mb-3" />}
        <div className="flex gap-3"><button onClick={submitAssignment} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">{isSubmitting ? 'جارٍ الحفظ...' : 'تسليم الواجب'}</button><button onClick={() => setSelectedAssignment(null)} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold">إلغاء</button></div>
      </div>}
    </div>
  );
};

export default StudentAssignmentsPanel;
