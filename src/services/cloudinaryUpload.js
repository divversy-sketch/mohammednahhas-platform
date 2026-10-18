// Uploads to Cloudinary.
// 1) Signed upload through /api/cloudinary-signature when the server has CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.
// 2) Otherwise (no server, the Android app, or the signature call fails) the unsigned preset from .env
//    (VITE_CLOUDINARY_UPLOAD_PRESET). Set VITE_CLOUDINARY_ALLOW_UNSIGNED_FALLBACK=false to forbid it.
import { auth } from './firebase';
import { apiUrl } from './callFunction.js';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const RAW_SIGNATURE_ENDPOINT = import.meta.env.VITE_CLOUDINARY_SIGNATURE_ENDPOINT || '/api/cloudinary-signature';
const SIGNATURE_ENDPOINT = RAW_SIGNATURE_ENDPOINT.startsWith('/') ? apiUrl(RAW_SIGNATURE_ENDPOINT) : RAW_SIGNATURE_ENDPOINT;
const FALLBACK_SETTING = String(import.meta.env.VITE_CLOUDINARY_ALLOW_UNSIGNED_FALLBACK || '').toLowerCase();
const ALLOW_UNSIGNED_FALLBACK = FALLBACK_SETTING ? FALLBACK_SETTING === 'true' : Boolean(UPLOAD_PRESET);

export const CLOUDINARY_LIMITS = {
  image: 20 * 1024 * 1024,
  pdf: 100 * 1024 * 1024,
  file: 100 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  auto: 100 * 1024 * 1024,
};

const EXT = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'bmp', 'svg'],
  pdf: ['pdf'],
  doc: ['doc', 'docx', 'ppt', 'pptx', 'pps', 'ppsx', 'xls', 'xlsx', 'csv', 'txt', 'rtf', 'odt', 'odp', 'ods', 'zip', 'rar', '7z'],
  media: ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', 'mp3', 'm4a', 'wav', 'ogg', 'aac'],
};

const extOf = (name = '') => { const i = String(name).lastIndexOf('.'); return i >= 0 ? String(name).slice(i + 1).toLowerCase() : ''; };

/** image | pdf | doc | media | '' — from the MIME type, or the extension when Windows sends no type. */
export function fileFamily(file) {
  const type = String(file?.type || '').toLowerCase();
  const ext = extOf(file?.name);
  if (type.startsWith('image/') || EXT.image.includes(ext)) return 'image';
  if (type === 'application/pdf' || type === 'application/x-pdf' || ext === 'pdf') return 'pdf';
  if (type.startsWith('video/') || type.startsWith('audio/') || EXT.media.includes(ext)) return 'media';
  if (EXT.doc.includes(ext) || type.includes('officedocument') || type.includes('msword') || type.includes('ms-excel') || type.includes('ms-powerpoint') || type.startsWith('text/') || type.includes('zip')) return 'doc';
  return '';
}

const mb = (bytes) => `${Math.round(bytes / 1024 / 1024)} ميجا`;

export function validateCloudinaryFile(file, kind = 'auto') {
  if (!file) throw new Error('ما اخترتش ملف.');
  const family = fileFamily(file);
  const ok = kind === 'image' ? family === 'image'
    : kind === 'pdf' ? family === 'pdf'
      : kind === 'video' ? family === 'media'
        : Boolean(family);
  if (!ok) {
    throw new Error(kind === 'image' ? 'ارفع صورة (JPG أو PNG أو WEBP).'
      : kind === 'pdf' ? 'ارفع ملف PDF.'
        : kind === 'video' ? 'ارفع فيديو أو ملف صوت.'
          : 'نوع الملف ده مش مدعوم. المدعوم: صور، PDF، Word، PowerPoint، Excel، فيديو، صوت، ZIP.');
  }
  const max = CLOUDINARY_LIMITS[kind] || CLOUDINARY_LIMITS.auto;
  if (file.size > max) throw new Error(`الملف كبير (${mb(file.size)}). الحد ${mb(max)}.`);
}

function resourceTypeFor(file, kind) {
  if (kind === 'image') return 'image';
  const family = fileFamily(file);
  if (family === 'image') return 'image';
  if (family === 'media') return 'video'; // Cloudinary keeps audio under "video"
  return 'raw'; // PDF and documents: delivered as-is (free accounts block PDFs under "image")
}

/** Cloudinary's English errors → what to do, in Arabic. */
function explain(message = '', status = 0) {
  const m = String(message);
  if (/preset.*not found/i.test(m)) return 'اسم الـ Upload preset اللي في ملف .env مش موجود في حساب Cloudinary. راجع VITE_CLOUDINARY_UPLOAD_PRESET.';
  if (/whitelisted for unsigned|must be.*unsigned|unsigned upload/i.test(m)) return 'الـ Upload preset لازم يكون «Unsigned». من Cloudinary: Settings ← Upload ← Upload presets ← غيّر Signing mode لـ Unsigned.';
  if (/file size too large|too large/i.test(m)) return `الملف أكبر من المسموح في حساب Cloudinary (الباقة المجانية: ١٠ ميجا للصور والملفات و١٠٠ ميجا للفيديو). ${m}`;
  if (/invalid cloud name|cloud_name/i.test(m)) return 'اسم الـ Cloud في ملف .env غلط. راجع VITE_CLOUDINARY_CLOUD_NAME.';
  if (/resource type|not allowed/i.test(m)) return `الـ Upload preset مش مسموح له بالنوع ده من الملفات. ${m}`;
  if (status === 0) return 'الاتصال بـ Cloudinary اتقطع. اتأكد من النت وجرب تاني.';
  return m || 'الرفع على Cloudinary ما نجحش.';
}

function post(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.max(1, Math.round((e.loaded / e.total) * 100))); };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch { /* not json */ }
      if (xhr.status >= 200 && xhr.status < 300 && !data.error) resolve(data);
      else reject(new Error(explain(data?.error?.message, xhr.status)));
    };
    xhr.onerror = () => reject(new Error(explain('', 0)));
    xhr.send(formData);
  });
}

async function requestSignature({ folder, resourceType }) {
  const user = auth.currentUser;
  if (!user) throw new Error('لازم تكون مسجّل دخول عشان ترفع ملفات.');
  const token = await user.getIdToken();
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : 0;
  try {
    const res = await fetch(SIGNATURE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ folder, resourceType }),
      signal: ctrl?.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false || !data?.signature) throw new Error(data?.message || 'توقيع الرفع من السيرفر مش متاح.');
    return data;
  } finally { clearTimeout(timer); }
}

async function uploadSigned(file, { resourceType, folder, onProgress }) {
  const s = await requestSignature({ folder, resourceType });
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', s.apiKey);
  fd.append('timestamp', s.timestamp);
  fd.append('signature', s.signature);
  fd.append('folder', s.folder || folder);
  if (s.context) fd.append('context', s.context);
  return post(`https://api.cloudinary.com/v1_1/${s.cloudName || CLOUD_NAME}/${resourceType}/upload`, fd, onProgress);
}

async function uploadUnsigned(file, { resourceType, folder, onProgress }) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('بيانات Cloudinary مش موجودة في ملف .env (VITE_CLOUDINARY_CLOUD_NAME و VITE_CLOUDINARY_UPLOAD_PRESET).');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', folder);
  return post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, fd, onProgress);
}

export const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && (UPLOAD_PRESET || import.meta.env.VITE_CLOUDINARY_SIGNATURE_ENDPOINT));

export async function uploadToCloudinary(file, { kind = 'auto', folder = 'nahhas-platform', onProgress } = {}) {
  validateCloudinaryFile(file, kind);
  const resourceType = resourceTypeFor(file, kind);
  const opts = { resourceType, folder, onProgress };
  let data;
  try {
    data = await uploadSigned(file, opts);
  } catch (signedError) {
    if (!ALLOW_UNSIGNED_FALLBACK) throw signedError;
    data = await uploadUnsigned(file, opts);
  }
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    bytes: data.bytes,
    format: data.format || extOf(file.name),
    originalFilename: data.original_filename || file.name,
  };
}
