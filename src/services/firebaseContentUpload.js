import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

const MAX_CONTENT_FILE_SIZE = 100 * 1024 * 1024; // 100MB for public content uploads

const extensionFromName = (name = '') => {
  const clean = String(name).split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : '';
};

export function detectContentType(file) {
  const ext = extensionFromName(file?.name || '');
  const mime = file?.type || '';

  if (mime === 'text/html' || ext === 'html' || ext === 'htm') return 'html';
  if (mime === 'application/pdf' || ext === 'pdf') return 'file';
  if (mime.startsWith('video/')) return 'video';
  return 'file';
}

function safeFileName(name = 'file') {
  const ext = extensionFromName(name);
  const base = String(name)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'content-file';
  return `${base}-${Date.now()}${ext ? `.${ext}` : ''}`;
}

export function uploadToFirebaseContent(file, { folder = 'general-content', onProgress } = {}) {
  if (!file) return Promise.reject(new Error('لم يتم اختيار ملف.'));
  if (file.size > MAX_CONTENT_FILE_SIZE) {
    return Promise.reject(new Error('حجم الملف كبير جدًا. الحد الحالي 100MB للمحتوى العام.'));
  }

  const path = `content/${folder}/${safeFileName(file.name)}`;
  const storageRef = ref(storage, path);
  const metadata = {
    contentType: file.type || undefined,
    customMetadata: {
      originalName: file.name || '',
      uploadArea: 'general-content'
    }
  };

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, metadata);

    task.on('state_changed',
      (snapshot) => {
        const percent = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        onProgress?.(percent);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          url,
          path,
          name: file.name,
          size: file.size,
          mimeType: file.type || '',
          contentType: detectContentType(file),
          storageProvider: 'firebase'
        });
      }
    );
  });
}


export function readHtmlFileAsInlineContent(file, { maxInlineSize = 900 * 1024 } = {}) {
  if (!file) return Promise.reject(new Error('لم يتم اختيار ملف HTML.'));
  if (file.size > maxInlineSize) {
    return Promise.reject(new Error('ملف HTML كبير جدًا للحفظ المباشر داخل Firestore. ارفعه كرابط خارجي أو استخدم Firebase Storage بعد ضبط القواعد.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف HTML من الجهاز.'));
    reader.onload = () => resolve({
      url: 'inline-html',
      htmlContent: String(reader.result || ''),
      path: '',
      name: file.name,
      size: file.size,
      mimeType: file.type || 'text/html',
      contentType: 'html',
      storageProvider: 'firestore-inline'
    });
    reader.readAsText(file, 'UTF-8');
  });
}
