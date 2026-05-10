import React from 'react';
import { X, Phone, Users, PlayCircle, ClipboardList, QrCode, Crown } from '../../shared/icons/lucide-shim.jsx';
import { getGradeLabel } from '../../shared/constants/grades';
import { formatWatchTime } from '../../shared/core/platformShared.jsx';

export default function AdminStudentProfileModal({
  viewingStudentProfile, setViewingStudentProfile,
  studentHistoryData, examResults, examsList, hwResults
}) {
  if (!viewingStudentProfile) return null;
  return (
<div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
    <div className="bg-slate-50 rounded-3xl w-full max-w-6xl h-full md:h-[90vh] shadow-2xl flex flex-col relative overflow-hidden border border-slate-300">
        <button onClick={() => setViewingStudentProfile(null)} className="absolute top-4 left-4 md:top-6 md:left-6 z-50 bg-red-100 p-2 md:p-3 rounded-full text-red-600 hover:bg-red-200 hover:text-red-700 transition shadow-md border border-red-200"><X size={24}/></button>
        <div className="bg-white border-b border-slate-200 p-6 pt-16 md:pt-6 flex justify-between items-start flex-shrink-0">
            <div className="flex gap-4 items-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
                    {viewingStudentProfile.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {viewingStudentProfile.name} 
                        <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{getGradeLabel(viewingStudentProfile.grade)}</span>
                        {viewingStudentProfile.subscriptionStatus === 'premium' && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1"><Crown size={12}/> VIP</span>}
                    </h2>
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-sm text-slate-500 font-bold">
                        <span className="flex items-center gap-1"><Phone size={14}/> {viewingStudentProfile.phone}</span>
                        <span className="flex items-center gap-1 text-amber-600"><Users size={14}/> ولي الأمر: {viewingStudentProfile.parentPhone}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
                    <h3 className="font-bold text-lg mb-4 text-blue-800 flex items-center gap-2 border-b pb-2"><PlayCircle/> سجل مشاهدات الفيديوهات</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {studentHistoryData.length === 0 ? <p className="text-slate-400 text-center py-10">لم يفتح أي فيديو.</p> : studentHistoryData.map((v, i) => (
                            <div key={i} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center border border-slate-100">
                                <div>
                                    <p className="font-bold text-slate-800">{v.videoTitle}</p>
                                    <p className="text-xs text-slate-400 mt-1">آخر فتح: {v.viewedAt?.toDate().toLocaleString('ar-EG')}</p>
                                </div>
                                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold text-center">شاهد لمدة<br/><span className="text-sm">{formatWatchTime(v.watchedSeconds)}</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-6 h-[500px]">
                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                        <h3 className="font-bold text-lg mb-4 text-emerald-800 flex items-center gap-2 border-b pb-2"><ClipboardList/> نتائج الامتحانات</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {(() => {
                                const sExams = examResults.filter(r => r.studentId === viewingStudentProfile.id);
                                if (sExams.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بحل أي امتحان.</p>;
                                return sExams.map(ex => (
                                    <div key={ex.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="font-bold text-slate-700 text-sm">{examsList.find(e => e.id === ex.examId)?.title || 'امتحان محذوف'}</p>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${ex.status === 'cheated' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{ex.status === 'cheated' ? 'غش 🚫' : `${ex.score}/${ex.total}`}</span>
                                    </div>
                                ))
                            })()}
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
                        <h3 className="font-bold text-lg mb-4 text-amber-800 flex items-center gap-2 border-b pb-2"><QrCode/> سجل الواجبات</h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {(() => {
                                const sHw = hwResults.filter(r => r.studentId === viewingStudentProfile.id);
                                if (sHw.length === 0) return <p className="text-slate-400 text-center py-4">لم يقم بتسليم أي واجب QR.</p>;
                                return sHw.map(hw => (
                                    <div key={hw.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{hw.homeworkTitle}</p>
                                            <p className="text-xs text-slate-400">{hw.bookName}</p>
                                        </div>
                                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-bold">{hw.score}/${hw.total}</span>
                                    </div>
                                ))
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
  );
}
