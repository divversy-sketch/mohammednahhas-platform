const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'df7wxvb0a';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'nahhas-platform';

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

export async function uploadToCloudinary(file, { kind = 'auto', folder = 'nahhas-platform' } = {}) {
  validateCloudinaryFile(file, kind);
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('بيانات Cloudinary غير موجودة في ملف .env');

  const resourceType = kind === 'pdf' ? 'raw' : kind === 'image' ? 'image' : 'auto';
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
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    bytes: data.bytes,
    format: data.format,
    originalFilename: data.original_filename || file.name,
  };
}
