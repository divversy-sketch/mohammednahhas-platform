import crypto from 'node:crypto';
import { assertAuthenticatedRequest, requirePost, sendApiError } from './_firebaseAdmin.js';

const CLOUDINARY_UPLOAD_FOLDERS = ['nahhas-platform'];

function cleanFolder(folder) {
  const requested = String(folder || 'nahhas-platform').trim().replace(/[^a-zA-Z0-9_\-/]/g, '');
  const allowedRoot = CLOUDINARY_UPLOAD_FOLDERS.find((root) => requested === root || requested.startsWith(`${root}/`));
  return allowedRoot ? requested : 'nahhas-platform';
}

function cleanResourceType(value) {
  return ['image', 'raw', 'auto', 'video'].includes(value) ? value : 'auto';
}

export default async function handler(req, res) {
  try {
    requirePost(req);
    const actor = await assertAuthenticatedRequest(req);

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      const error = new Error('إعدادات Cloudinary signed upload غير مكتملة على السيرفر.');
      error.statusCode = 500;
      throw error;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = cleanFolder(req.body?.folder);
    const resourceType = cleanResourceType(req.body?.resourceType);
    const context = `actor=${actor.uid}|role=${actor.role}`;

    const params = {
      folder,
      timestamp,
      context
    };

    const signatureBase = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(`${signatureBase}${apiSecret}`)
      .digest('hex');

    return res.status(200).json({
      ok: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      context,
      signature,
      resourceType
    });
  } catch (error) {
    return sendApiError(res, error);
  }
}
