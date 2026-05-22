import { uploadToCloudinary } from '@services/cloudinaryUpload';

export const uploadMedia = async (file, kind = 'image') => {
  if (!file) return '';
  const res = await uploadToCloudinary(file, {
    kind,
    folder: kind === 'pdf' ? 'nahhas-platform/pdfs' : 'nahhas-platform/images',
  });
  return res.url;
};
