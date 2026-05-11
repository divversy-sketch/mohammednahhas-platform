
import AdminExamTimeModal from '../modals/AdminExamTimeModal.jsx';
import AdminReviewExamOverlay from '../modals/AdminReviewExamOverlay.jsx';
import AdminFullExamEditorModal from '../modals/AdminFullExamEditorModal.jsx';
import AdminFullContentEditorModal from '../modals/AdminFullContentEditorModal.jsx';
import AdminStudentProfileModal from '../modals/AdminStudentProfileModal.jsx';

export default function AdminDashboardModals({ ctx }) {
  const {
    editingExamTime,
    setEditingExamTime,
    newEndTime,
    setNewEndTime,
    handleUpdateExamTime,
    adminReviewExamData,
    adminReviewResult,
    setAdminReviewExamData,
    setAdminReviewResult,
    editingFullExam,
    setEditingFullExam,
    examEditMode,
    setExamEditMode,
    recalculateAfterExamEdit,
    setRecalculateAfterExamEdit,
    examEditDraft,
    setExamEditDraft,
    examEditQuestionsPreview,
    updateQuestionInExamDraft,
    saveFullExamEdit,
    editingFullContent,
    setEditingFullContent,
    contentEditMode,
    setContentEditMode,
    contentEditDraft,
    setContentEditDraft,
    examsList,
    saveFullContentEdit,
    viewingStudentProfile,
    setViewingStudentProfile,
    studentHistoryData,
    examResults,
    hwResults
  } = ctx;

  return (
    <>
      <AdminExamTimeModal
        editingExamTime={editingExamTime}
        setEditingExamTime={setEditingExamTime}
        newEndTime={newEndTime}
        setNewEndTime={setNewEndTime}
        handleUpdateExamTime={handleUpdateExamTime}
      />


      <AdminReviewExamOverlay
        adminReviewExamData={adminReviewExamData}
        adminReviewResult={adminReviewResult}
        onClose={() => {
          setAdminReviewExamData(null);
          setAdminReviewResult(null);
        }}
      />

      <AdminFullExamEditorModal
        editingFullExam={editingFullExam}
        setEditingFullExam={setEditingFullExam}
        examEditMode={examEditMode}
        setExamEditMode={setExamEditMode}
        recalculateAfterExamEdit={recalculateAfterExamEdit}
        setRecalculateAfterExamEdit={setRecalculateAfterExamEdit}
        examEditDraft={examEditDraft}
        setExamEditDraft={setExamEditDraft}
        examEditQuestionsPreview={examEditQuestionsPreview}
        updateQuestionInExamDraft={updateQuestionInExamDraft}
        saveFullExamEdit={saveFullExamEdit}
        examsList={examsList}
      />

      <AdminFullContentEditorModal
        editingFullContent={editingFullContent}
        setEditingFullContent={setEditingFullContent}
        contentEditMode={contentEditMode}
        setContentEditMode={setContentEditMode}
        contentEditDraft={contentEditDraft}
        setContentEditDraft={setContentEditDraft}
        examsList={examsList}
        saveFullContentEdit={saveFullContentEdit}
      />

      <AdminStudentProfileModal
        viewingStudentProfile={viewingStudentProfile}
        setViewingStudentProfile={setViewingStudentProfile}
        studentHistoryData={studentHistoryData}
        examResults={examResults}
        examsList={examsList}
        hwResults={hwResults}
      />

    </>
  );
}
