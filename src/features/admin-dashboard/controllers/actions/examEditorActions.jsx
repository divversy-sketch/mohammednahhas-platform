import { doc, setDoc, getDoc, getDocs, collection, addDoc, query, where, updateDoc, deleteDoc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';

import { db } from '@services/firebase';
import { validateEgyptianPhones } from '@shared/utils/phone';
import { FloatingArabicBackground } from '@features/home/HomeWidgets';
import { uploadToFirebaseContent, detectContentType, readHtmlFileAsInlineContent } from '@services/firebaseContentUpload';
import { uploadToCloudinary } from '@services/cloudinaryUpload';
import { downloadXlsx } from '@shared/utils/exportData.js';
import { platformNotify, platformConfirm, platformPrompt, sendSystemNotification, safeNumber, VIDEO_EXAM_UNLOCK_PERCENT, getQuestionMaxScore, calculateDetailedExamMetrics } from '@shared/core/platformShared.jsx';
import { normalizeImagePlacement, defaultImagePlacement } from '@shared/utils/imagePlacement.js';
import { adminSecureFunctions } from '@features/admin-dashboard/services/adminSecureFunctions.js';
import { confirmSensitiveAction } from '@features/admin-dashboard/services/adminAudit.js';

export const createExamEditorActions = (ctx) => {
  const {
    adminReviewExamData,
    setAdminReviewExamData,
    adminReviewResult,
    setAdminReviewResult,
    activeTab,
    setActiveTab,
    adminExamView,
    setAdminExamView,
    adminGradeFilter,
    setAdminGradeFilter,
    newContent,
    setNewContent,
    editingUser,
    setEditingUser,
    replyTexts,
    setReplyTexts,
    examBuilder,
    setExamBuilder,
    examOverrideDraft,
    setExamOverrideDraft,
    bulkText,
    setBulkText,
    viewingResult,
    setViewingResult,
    resultsFilter,
    setResultsFilter,
    essayScoreDrafts,
    setEssayScoreDrafts,
    essayMaxDrafts,
    setEssayMaxDrafts,
    newAnnouncement,
    setNewAnnouncement,
    newStudentNotification,
    setNewStudentNotification,
    showLeaderboard,
    setShowLeaderboard,
    autoReplies,
    setAutoReplies,
    newAutoReply,
    setNewAutoReply,
    newQuote,
    setNewQuote,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    viewingStudentProfile,
    setViewingStudentProfile,
    studentHistoryData,
    setStudentHistoryData,
    editingExamTime,
    setEditingExamTime,
    newEndTime,
    setNewEndTime,
    editingFullExam,
    setEditingFullExam,
    examEditMode,
    setExamEditMode,
    recalculateAfterExamEdit,
    setRecalculateAfterExamEdit,
    examEditDraft,
    setExamEditDraft,
    editingFullContent,
    setEditingFullContent,
    contentEditMode,
    setContentEditMode,
    contentEditDraft,
    setContentEditDraft,
    newSmartHw,
    setNewSmartHw,
    codeGenCount,
    setCodeGenCount,
    codeGenDays,
    setCodeGenDays,
    userData,
    adminProfile,
    examEditQuestionsPreview,
    updateQuestionInExamDraft,
    pendingUsers,
    activeUsersList,
    contentList,
    messagesList,
    examsList,
    examResults,
    examAccessOverrides,
    announcements,
    quotesList,
    smartHomeworks,
    hwResults,
    subscriptionCodes,
    assignments,
    assignmentSubmissions,
    mistakes,
    videoViews,
    passwordResetRequests,
    setPendingUsers,
    setActiveUsersList,
    setContentList,
    setMessagesList,
    setExamsList,
    setExamResults,
    setExamAccessOverrides,
    setAnnouncements,
    setQuotesList,
    setSmartHomeworks,
    setHwResults,
    setSubscriptionCodes,
    setPasswordResetRequests,
    audit
  } = ctx;

  const openFullExamEditor = (exam) => {
    const hasResults = examResults.some(r => r.examId === exam.id);
    setEditingFullExam({ ...exam, hasResults });
    setExamEditMode(hasResults ? 'clone' : 'direct');
    setRecalculateAfterExamEdit(hasResults);
    setExamEditDraft({
      title: exam.title || '',
      grade: exam.grade || '3sec',
      duration: safeNumber(exam.duration, 60),
      startTime: exam.startTime || '',
      endTime: exam.endTime || '',
      accessCode: exam.accessCode || '',
      isPremium: !!exam.isPremium,
      examImageUrl: exam.examImageUrl || exam.thumbnailUrl || exam.image || '',
      imagePlacement: normalizeImagePlacement(exam.imagePlacement),
      questionsText: JSON.stringify(exam.questions || [], null, 2),
      accessRule: {
        enabled: !!exam.accessRule?.enabled,
        requiredExamId: exam.accessRule?.requiredExamId || '',
        requiredPercentage: safeNumber(exam.accessRule?.requiredPercentage, 70),
        visibilityWhenLocked: 'locked',
        useBestAttempt: exam.accessRule?.useBestAttempt !== false,
        allowAdminOverride: exam.accessRule?.allowAdminOverride !== false
      }
    });
  };


  const recalculateExamResultsAfterAnswerEdit = async (examId, updatedExam) => {
    const resultsQuery = query(collection(db, 'exam_results'), where('examId', '==', examId));
    const snap = await getDocs(resultsQuery);

    if (snap.empty) {
      platformNotify('تم تعديل الامتحان، ولا توجد نتائج قديمة لإعادة تصحيحها.');
      return { updated: 0 };
    }

    let updatedCount = 0;
    let batch = writeBatch(db);
    let batchOps = 0;

    for (const resultDoc of snap.docs) {
      const result = resultDoc.data();
      const answers = result.answers || {};
      const essayGrades = result.essayGrades || result.essayScores || result.manualEssayGrades || {};

      const metrics = calculateDetailedExamMetrics(updatedExam, answers, essayGrades);
      const branchRows = Object.entries(metrics.branchStats || {}).map(([branch, data]) => {
        const pct = data.possible > 0 ? Math.round((safeNumber(data.earned, 0) / safeNumber(data.possible, 1)) * 100) : 0;
        return {
          branch,
          earned: safeNumber(data.earned, 0),
          possible: safeNumber(data.possible, 0),
          percentage: pct,
          correct: safeNumber(data.correct, 0),
          wrong: safeNumber(data.wrong, 0),
          answered: safeNumber(data.answered, 0),
          total: safeNumber(data.total, 0),
          essay: safeNumber(data.essay, 0)
        };
      }).sort((a, b) => a.percentage - b.percentage);

      const weakBranches = branchRows.filter(b => b.percentage < 70);
      const mcqScore = metrics.questions
        .filter(q => q.type !== 'essay')
        .reduce((sum, q) => sum + (answers[q.id] === q.correctIdx ? getQuestionMaxScore(q) : 0), 0);

      batch.update(resultDoc.ref, {
        score: metrics.totalScore,
        mcqScore,
        total: metrics.totalPossible,
        percentage: metrics.percentage,
        branchStats: metrics.branchStats,
        branchAnalysis: branchRows,
        weakBranches,
        performanceAnalysis: {
          percentage: metrics.percentage,
          totalScore: metrics.totalScore,
          totalPossible: metrics.totalPossible,
          weakBranches,
          recalculatedBecause: 'exam_answers_edited',
          recalculatedAt: new Date().toISOString()
        },
        examTitle: updatedExam.title,
        examVersionAtRecalculation: safeNumber(updatedExam.version, 1) + 1,
        recalculatedAt: serverTimestamp(),
        recalculatedByAdmin: true
      });

      updatedCount += 1;
      batchOps += 1;

      if (batchOps >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchOps = 0;
      }
    }

    if (batchOps > 0) await batch.commit();

    return { updated: updatedCount };
  };

  const saveFullExamEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingFullExam) return;
    if (!examEditDraft.title.trim()) return platformNotify('اكتب عنوان الامتحان.');
    if (!examEditDraft.accessCode.trim()) return platformNotify('اكتب كود الامتحان.');
    if (!examEditDraft.startTime || !examEditDraft.endTime) return platformNotify('حدد وقت البداية والنهاية.');

    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(examEditDraft.questionsText || '[]');
      if (!Array.isArray(parsedQuestions)) throw new Error('questions must be array');
    } catch (err) {
      return platformNotify('صيغة الأسئلة غير صحيحة. يجب أن تكون JSON Array. لو مش متأكد، لا تعدل جزء الأسئلة.');
    }

    const payload = {
      title: examEditDraft.title.trim(),
      grade: examEditDraft.grade,
      duration: safeNumber(examEditDraft.duration, 60),
      startTime: examEditDraft.startTime,
      endTime: examEditDraft.endTime,
      accessCode: examEditDraft.accessCode.trim(),
      isPremium: !!examEditDraft.isPremium,
      examImageUrl: examEditDraft.examImageUrl || '',
      imagePlacement: normalizeImagePlacement(examEditDraft.imagePlacement),
      accessRule: {
        enabled: !!examEditDraft.accessRule?.enabled && !!examEditDraft.accessRule?.requiredExamId,
        requiredExamId: examEditDraft.accessRule?.requiredExamId || '',
        requiredPercentage: Math.min(100, Math.max(0, safeNumber(examEditDraft.accessRule?.requiredPercentage, 70))),
        visibilityWhenLocked: 'locked',
        useBestAttempt: examEditDraft.accessRule?.useBestAttempt !== false,
        allowAdminOverride: true
      },
      questions: parsedQuestions,
      updatedAt: serverTimestamp()
    };

    if (examEditMode === 'direct') {
      if (editingFullExam.hasResults && !platformConfirm('هذا الامتحان له نتائج سابقة. التعديل المباشر قد يغير شكل المراجعة والتحليل للنتائج القديمة. هل تريد التعديل المباشر فعلاً؟')) return;
      await updateDoc(doc(db, 'exams', editingFullExam.id), {
        ...payload,
        version: increment(1),
        lastEditMode: 'direct',
        answersLastEditedAt: serverTimestamp()
      });

      if (editingFullExam.hasResults && recalculateAfterExamEdit) {
        const recalc = await recalculateExamResultsAfterAnswerEdit(editingFullExam.id, { ...editingFullExam, ...payload });
        platformNotify(`تم تعديل الامتحان مباشرة وإعادة تصحيح ${recalc.updated} نتيجة قديمة تلقائيًا.`);
      } else {
        platformNotify('تم تعديل الامتحان مباشرة.');
      }
    } else {
      await addDoc(collection(db, 'exams'), {
        ...payload,
        title: payload.title.includes('نسخة') ? payload.title : `${payload.title} - نسخة جديدة`,
        originalExamId: editingFullExam.id,
        clonedFrom: editingFullExam.id,
        version: safeNumber(editingFullExam.version, 1) + 1,
        createdAt: serverTimestamp(),
        source: 'clone_edit'
      });
      platformNotify('تم إنشاء نسخة جديدة من الامتحان بنجاح. النتائج القديمة محفوظة كما هي.');
    }

    await audit(examEditMode === 'direct' ? 'exam_updated' : 'exam_cloned', { title: examEditMode === 'direct' ? 'تعديل امتحان' : 'إنشاء نسخة امتحان معدلة', severity: editingFullExam.hasResults ? 'warning' : 'info', targetCollection: 'exams', targetDocId: editingFullExam.id, before: { title: editingFullExam.title, version: editingFullExam.version || 1 }, after: { title: payload.title, grade: payload.grade, duration: payload.duration } });
    setEditingFullExam(null);
  };

  const handleUpdateExamTime = async (e) => {
      e.preventDefault();
      if (!newEndTime) return;
      try {
          await updateDoc(doc(db, 'exams', editingExamTime.id), { endTime: newEndTime });
          platformNotify("تم تمديد وقت الامتحان بنجاح!");
          setEditingExamTime(null);
          setNewEndTime('');
      } catch (error) { console.error("Error updating exam time:", error); platformNotify("حدث خطأ أثناء تعديل الوقت."); }
  };

  return {
    openFullExamEditor,
    recalculateExamResultsAfterAnswerEdit,
    saveFullExamEdit,
    handleUpdateExamTime
  };
};

export default createExamEditorActions;
