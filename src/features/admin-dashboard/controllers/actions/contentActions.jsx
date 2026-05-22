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

export const createContentManagementActions = (ctx) => {
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

  const openFullContentEditor = (item) => {
    const allowedEmailsText = Array.isArray(item.allowedEmails) ? item.allowedEmails.join(', ') : (item.allowedEmails || '');
    setEditingFullContent(item);
    setContentEditMode('direct');
    setContentEditDraft({
      title: item.title || '',
      url: item.url || item.file || '',
      type: item.type || 'video',
      videoSection: item.videoSection || 'explanation',
      grade: item.grade || '3sec',
      isPremium: !!item.isPremium,
      isPublic: !!item.isPublic,
      allowedEmailsText,
      linkedExamId: item.linkedExamId || '',
      estimatedDurationMinutes: item.estimatedDurationMinutes || '',
      branch: item.branch || '',
      thumbnailUrl: item.thumbnailUrl || item.posterUrl || item.image || '',
      imagePlacement: normalizeImagePlacement(item.imagePlacement)
    });
  };

  const saveFullContentEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingFullContent) return;
    if (!contentEditDraft.title.trim()) return platformNotify('اكتب عنوان المحتوى.');
    if (!contentEditDraft.url.trim()) return platformNotify('أدخل رابط المحتوى.');
    if (contentEditDraft.type === 'video' && contentEditDraft.linkedExamId && safeNumber(contentEditDraft.estimatedDurationMinutes, 0) <= 0) {
      return platformNotify('لو الفيديو مربوط بامتحان لازم تكتب مدة الفيديو بالدقائق.');
    }

    const allowedEmails = contentEditDraft.allowedEmailsText
      ? contentEditDraft.allowedEmailsText.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    const payload = {
      title: contentEditDraft.title.trim(),
      url: contentEditDraft.url.trim(),
      file: contentEditDraft.url.trim(),
      type: contentEditDraft.type,
      videoSection: contentEditDraft.type === 'video' ? contentEditDraft.videoSection : '',
      grade: contentEditDraft.grade,
      isPremium: !!contentEditDraft.isPremium,
      isPublic: !!contentEditDraft.isPublic,
      allowedEmails,
      branch: contentEditDraft.branch || '',
      thumbnailUrl: contentEditDraft.thumbnailUrl || '',
      posterUrl: contentEditDraft.thumbnailUrl || '',
      image: contentEditDraft.thumbnailUrl || '',
      imagePlacement: normalizeImagePlacement(contentEditDraft.imagePlacement),
      linkedExamId: contentEditDraft.type === 'video' ? (contentEditDraft.linkedExamId || '') : '',
      estimatedDurationMinutes: contentEditDraft.type === 'video' ? safeNumber(contentEditDraft.estimatedDurationMinutes, 0) : 0,
      videoExamUnlockPercent: contentEditDraft.type === 'video' && contentEditDraft.linkedExamId ? VIDEO_EXAM_UNLOCK_PERCENT : 0,
      updatedAt: serverTimestamp()
    };

    if (contentEditMode === 'direct') {
      await updateDoc(doc(db, 'content', editingFullContent.id), { ...payload, version: increment(1), lastEditMode: 'direct' });
      platformNotify('تم تعديل المحتوى مباشرة.');
    } else {
      await addDoc(collection(db, 'content'), {
        ...payload,
        title: payload.title.includes('نسخة') ? payload.title : `${payload.title} - نسخة جديدة`,
        originalContentId: editingFullContent.id,
        clonedFrom: editingFullContent.id,
        version: safeNumber(editingFullContent.version, 1) + 1,
        createdAt: serverTimestamp(),
        source: 'clone_edit'
      });
      platformNotify('تم إنشاء نسخة جديدة من المحتوى.');
    }

    setEditingFullContent(null);
  };

  const handleImageUpload = async (file, onUploaded, successMessage = 'تم رفع الصورة بنجاح.') => {
      if (!file) return;
      try {
          setIsUploading(true);
          setUploadProgress(10);
          const uploaded = await uploadToCloudinary(file, { kind: 'image', folder: 'nahhas-platform/images' });
          onUploaded(uploaded.url);
          setUploadProgress(100);
          platformNotify(successMessage);
          setTimeout(() => setUploadProgress(0), 1200);
      } catch (err) {
          platformNotify(err?.message || 'فشل رفع الصورة.');
      } finally {
          setIsUploading(false);
      }
  };

  const handleVideoThumbnailSelect = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleImageUpload(file, (url) => setNewContent((prev) => ({ ...prev, thumbnailUrl: url })), 'تم رفع صورة المحتوى بنجاح.');
      e.target.value = null;
  };

  const handleExamImageSelect = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleImageUpload(file, (url) => setExamBuilder((prev) => ({ ...prev, examImageUrl: url })), 'تم رفع صورة الامتحان بنجاح.');
      e.target.value = null;
  };

  const handleFileSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setIsUploading(true);
      setUploadProgress(1);
      try {
          // صفحة المحتوى العام منفصلة عن الكورسات:
          // HTML صغير مثل 120KB يتم حفظه كنص داخل Firestore ويفتح داخل المنصة فورًا.
          // باقي الملفات تترفع على Firebase Storage. الكورسات فقط تستخدم Cloudinary.
          const autoType = detectContentType(file);
          const uploaded = autoType === 'html'
            ? await readHtmlFileAsInlineContent(file)
            : await uploadToFirebaseContent(file, {
                folder: newContent.type || 'general',
                onProgress: (percent) => setUploadProgress(percent)
            });
          setNewContent({
              ...newContent,
              url: uploaded.url,
              htmlContent: uploaded.htmlContent || '',
              fileName: uploaded.name,
              fileSize: uploaded.size,
              mimeType: uploaded.mimeType,
              firebaseStoragePath: uploaded.path,
              storageProvider: uploaded.storageProvider || 'firebase',
              type: autoType === 'html' ? 'html' : (newContent.type === 'video' && autoType !== 'video' ? autoType : (newContent.type || autoType))
          });
          setUploadProgress(100);
          setTimeout(() => setUploadProgress(0), 2000);
      } catch (err) {
          platformNotify(err?.message || 'فشل تجهيز/رفع الملف.');
      } finally {
          setIsUploading(false);
          e.target.value = null;
      }
  };

  const handleAddContent = async (e) => { 
      e.preventDefault(); 
      const allowedEmailsArray = newContent.allowedEmails 
        ? newContent.allowedEmails.split(',').map(email => email.trim()) 
        : [];

      if (!newContent.title.trim()) return platformNotify('اكتب عنوان المحتوى أولاً.');
      if (!newContent.url.trim()) return platformNotify('أضف رابط المحتوى أو ارفع ملفاً.');
      if (newContent.type === 'video' && newContent.linkedExamId && safeNumber(newContent.estimatedDurationMinutes, 0) <= 0) {
          return platformNotify('مهم: أدخل مدة الفيديو بالدقائق حتى يتم فتح امتحان الفيديو بعد مشاهدة 75% بدقة، خصوصًا مع YouTube.');
      }

      const contentData = { 
          ...newContent, 
          title: newContent.title.trim(),
          url: newContent.url.trim(),
          file: newContent.url.trim(), 
          allowedEmails: allowedEmailsArray,
          thumbnailUrl: newContent.thumbnailUrl || '',
          posterUrl: newContent.thumbnailUrl || '',
          image: newContent.thumbnailUrl || '',
          imagePlacement: normalizeImagePlacement(newContent.imagePlacement),
          linkedExamId: newContent.type === 'video' ? (newContent.linkedExamId || '') : '',
          estimatedDurationMinutes: newContent.type === 'video' ? safeNumber(newContent.estimatedDurationMinutes, 0) : 0,
          videoExamUnlockPercent: newContent.type === 'video' && newContent.linkedExamId ? VIDEO_EXAM_UNLOCK_PERCENT : 0,
          storageProvider: newContent.storageProvider || (newContent.firebaseStoragePath ? 'firebase' : ''),
          firebaseStoragePath: newContent.firebaseStoragePath || '',
          mimeType: newContent.mimeType || '',
          fileName: newContent.fileName || '',
          fileSize: newContent.fileSize || 0,
          htmlContent: newContent.type === 'html' ? (newContent.htmlContent || '') : '',
          createdAt: new Date() 
      };
      
      const addedContentRef = await addDoc(collection(db, 'content'), contentData);
      await audit('content_created', { title: 'إضافة محتوى جديد', targetCollection: 'content', targetDocId: addedContentRef.id, after: { title: newContent.title, type: contentData.type, grade: contentData.grade, isPremium: contentData.isPremium } });
      
      if (allowedEmailsArray.length === 0) {
          await addDoc(collection(db, 'notifications'), { text: `تم إضافة درس جديد: ${newContent.title}`, grade: newContent.grade, createdAt: serverTimestamp() });
      } 
      
      platformNotify("تم النشر!"); 
      setNewContent({ title: '', url: '', thumbnailUrl: '', imagePlacement: defaultImagePlacement, type: 'video', videoSection: 'explanation', isPublic: false, grade: '3sec', allowedEmails: '', isPremium: false, linkedExamId: '', estimatedDurationMinutes: '', branch: '', storageProvider: '', firebaseStoragePath: '', mimeType: '', fileName: '', fileSize: 0, htmlContent: '' });
  }; 
  
  const handleDeleteContent = async (id) => { 
      const item = contentList.find((c) => c.id === id) || {};
      if(confirmSensitiveAction(`حذف المحتوى "${item.title || id}"؟`, { confirmText: 'حذف' })) {
        await deleteDoc(doc(db, 'content', id));
        await audit('content_deleted', { title: 'حذف محتوى', severity: 'warning', targetCollection: 'content', targetDocId: id, before: { title: item.title || '', type: item.type || '', grade: item.grade || '' } });
      }
  };

  return {
    openFullContentEditor,
    saveFullContentEdit,
    handleImageUpload,
    handleVideoThumbnailSelect,
    handleExamImageSelect,
    handleFileSelect,
    handleAddContent,
    handleDeleteContent
  };
};

export default createContentManagementActions;
