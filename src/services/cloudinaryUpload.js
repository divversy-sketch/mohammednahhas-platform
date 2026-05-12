import { auth } from './firebase';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const SIGNATURE_ENDPOINT = import.meta.env.VITE_CLOUDINARY_SIGNATURE_ENDPOINT || '/api/cloudinary-signature';
const ALLOW_UNSIGNED_FALLBACK = String(import.meta.env.VITE_CLOUDINARY_ALLOW_UNSIGNED_FALLBACK || '').toLowerCase() === 'true';

export const CLOUDINARY_LIMITS = {
  image: 10 * 1024 * 1024,
  pdf: 25 * 1024 * 1024,
  auto: 25 * 1024 * 1024,
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PDF_TYPES = ['application/pdf'];

export function validateCloudinaryFile(file, kind = 'auto') {
  if (!file) throw new Error('لم يتم اختيار ملف.');
  const isImage = IMAGE_TYPES.includes(file.type);
  const isPdf = PDF_TYPES.includes(file.type);
  const allowed = kind === 'image' ? isImage : kind === 'pdf' ? isPdf : (isImage || isPdf);
  if (!allowed) throw new Error(kind === 'pdf' ? 'ارفع ملف PDF فقط.' : kind === 'image' ? 'ارفع صورة بصيغة JPG أو PNG أو WEBP أو GIF.' : 'ارفع صورة أو PDF فقط.');
  const max = CLOUDINARY_LIMITS[kind] || CLOUDINARY_LIMITS.auto;
  if (file.size > max) throw new Error(`حجم الملف كبير. الحد الأقصى ${Math.round(max / 1024 / 1024)}MB.`);
}

function getResourceType(kind) {
  return kind === 'pdf' ? 'raw' : kind === 'image' ? 'image' : 'auto';
}

async function requestCloudinarySignature({ folder, resourceType }) {
  const user = auth.currentUser;
  if (!user) throw new Error('يجب تسجيل الدخول قبل رفع الملفات.');
  const token = await user.getIdToken();
  const res = await fetch(SIGNATURE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ folder, resourceType })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.message || 'تعذر تجهيز توقيع الرفع الآمن.');
  return data;
}

async function uploadSigned(file, { kind, folder }) {
  const resourceType = getResourceType(kind);
  const signed = await requestCloudinarySignature({ folder, resourceType });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signed.apiKey);
  formData.append('timestamp', signed.timestamp);
  formData.append('signature', signed.signature);
  formData.append('folder', signed.folder || folder);
  if (signed.context) formData.append('context', signed.context);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName || CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data?.error?.message || 'فشل رفع الملف على Cloudinary.');
  return data;
}

async function uploadUnsignedFallback(file, { kind, folder }) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('بيانات Cloudinary غير موجودة في ملف .env.');
  if (!ALLOW_UNSIGNED_FALLBACK) throw new Error('الرفع غير الموقّع متوقف. فعّل signed upload من متغيرات السيرفر.');

  const resourceType = getResourceType(kind);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data?.error?.message || 'فشل رفع الملف على Cloudinary.');
  return data;
}

export async function uploadToCloudinary(file, { kind = 'auto', folder = 'nahhas-platform' } = {}) {
  validateCloudinaryFile(file, kind);

  let data;
  try {
    data = await uploadSigned(file, { kind, folder });
  } catch (error) {
    if (!ALLOW_UNSIGNED_FALLBACK) throw error;
    console.warn('Signed Cloudinary upload failed; trying unsigned fallback:', error?.message);
    data = await uploadUnsignedFallback(file, { kind, folder });
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    bytes: data.bytes,
    format: data.format,
    originalFilename: data.original_filename || file.name,
  };
}
