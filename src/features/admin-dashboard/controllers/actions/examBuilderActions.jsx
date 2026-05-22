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

export const createExamBuilderActions = (ctx) => {
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

  const parseExam = async () => {
    if (!bulkText.trim()) return platformNotify("أدخل نص الامتحان");
    if (!examBuilder.accessCode) return platformNotify("أدخل كود للامتحان");
    if (!examBuilder.startTime || !examBuilder.endTime) return platformNotify("يرجى تحديد وقت البدء والانتهاء");

    const lines = bulkText.split('\n').map(l => l.trim());
    const blocks = [];
    let currentBlock = { text: '', subQuestions: [] };
    let currentQuestion = null;
    let currentBranch = 'عام';
    let isReadingPassage = false;

    const pushCurrentQuestion = () => {
        if (!currentQuestion) return;

        if (currentQuestion.type === 'essay') {
            currentBlock.subQuestions.push({
                id: currentQuestion.id,
                type: 'essay',
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch,
                modelAnswer: currentQuestion.modelAnswer || ''
            });
            currentQuestion = null;
            return;
        }

        if (currentQuestion.text?.trim() && currentQuestion.options.length >= 2) {
            if (currentQuestion.correctIdx < 0) currentQuestion.correctIdx = 0;
            currentBlock.subQuestions.push({
                ...currentQuestion,
                text: currentQuestion.text.trim(),
                branch: currentQuestion.branch || currentBranch
            });
        }
        currentQuestion = null;
    };

    const pushCurrentBlock = () => {
        pushCurrentQuestion();
        if (currentBlock.text.trim() || currentBlock.subQuestions.length > 0) {
            blocks.push({
                text: currentBlock.text.trim(),
                subQuestions: currentBlock.subQuestions
            });
        }
        currentBlock = { text: '', subQuestions: [] };
    };

    lines.forEach((line) => {
        if (!line) {
            pushCurrentQuestion();
            return;
        }

        const branchMatch = line.match(/^#\s*(?:فرع|الفرع)\s*:\s*(.+)$/);
        if (branchMatch) {
            pushCurrentQuestion();
            currentBranch = branchMatch[1].trim() || 'عام';
            return;
        }

        if (line === 'بداية القطعة') {
            pushCurrentBlock();
            isReadingPassage = true;
            return;
        }

        if (line === 'نهاية القطعة') {
            isReadingPassage = false;
            return;
        }

        if (line === 'حذف القطعة') {
            pushCurrentBlock();
            isReadingPassage = false;
            return;
        }

        if (isReadingPassage) {
            currentBlock.text += (currentBlock.text ? '\n' : '') + line;
            return;
        }

        const essayMatch = line.match(/^#?\s*(?:مقالي|essay)\s*[:：\-\)\.]?\s*(.+)$/i);
        if (essayMatch) {
            pushCurrentQuestion();
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'essay',
                text: (essayMatch[1] || '').trim(),
                branch: currentBranch,
                modelAnswer: ''
            };
            return;
        }

        const isCorrect = line.startsWith('*');
        const cleanLine = isCorrect ? line.slice(1).trim() : line.trim();

        if (!currentQuestion) {
            currentQuestion = {
                id: Date.now() + Math.random(),
                type: 'mcq',
                text: cleanLine.replace(/^(س|سؤال)\s*[:：-]\s*/i, ''),
                options: [],
                correctIdx: -1,
                branch: currentBranch
            };
            return;
        }

        if (currentQuestion.type === 'essay') {
            if (cleanLine.startsWith('نموذج:') || cleanLine.startsWith('إجابة نموذجية:')) {
                currentQuestion.modelAnswer = cleanLine.replace('نموذج:', '').replace('إجابة نموذجية:', '').trim();
            } else {
                currentQuestion.text += '\n' + cleanLine;
            }
            return;
        }

        currentQuestion.options.push(cleanLine);
        if (isCorrect) currentQuestion.correctIdx = currentQuestion.options.length - 1;

        if (currentQuestion.options.length >= 4) {
            pushCurrentQuestion();
        }
    });

    pushCurrentBlock();

    const finalBlocks = blocks.filter(b => b.subQuestions.length > 0);
    if (finalBlocks.length === 0) return platformNotify("لم يتم التعرف على الأسئلة بشكل صحيح. افصل بين كل سؤال بسطر فارغ، واستخدم #فرع: للفروع و #مقالي: للسؤال المقالي.");

    await addDoc(collection(db, 'exams'), { 
        title: examBuilder.title, grade: examBuilder.grade, duration: examBuilder.duration, 
        startTime: examBuilder.startTime, endTime: examBuilder.endTime, accessCode: examBuilder.accessCode, 
        isPremium: examBuilder.isPremium,
        examImageUrl: examBuilder.examImageUrl || '',
        imagePlacement: normalizeImagePlacement(examBuilder.imagePlacement),
        accessRule: {
          enabled: !!examBuilder.accessRule?.enabled && !!examBuilder.accessRule?.requiredExamId,
          requiredExamId: examBuilder.accessRule?.requiredExamId || '',
          requiredPercentage: Math.min(100, Math.max(0, safeNumber(examBuilder.accessRule?.requiredPercentage, 70))),
          visibilityWhenLocked: 'locked',
          useBestAttempt: examBuilder.accessRule?.useBestAttempt !== false,
          allowAdminOverride: true
        },
        questions: finalBlocks, createdAt: serverTimestamp() 
    });

    await addDoc(collection(db, 'notifications'), { text: `امتحان جديد: ${examBuilder.title}`, grade: examBuilder.grade, createdAt: serverTimestamp() });
    setBulkText(""); 
    platformNotify(`تم نشر الامتحان بنجاح!`);
  };

  return {
    parseExam
  };
};

export default createExamBuilderActions;
