import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { platformConfirm, platformPrompt } from '../../shared/core/platformShared.jsx';

const sanitizeAuditPayload = (payload = {}) => {
  const cleaned = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || typeof value === 'function') return;
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) cleaned[key] = value;
    else if (value?.toDate) cleaned[key] = value;
    else {
      try { cleaned[key] = JSON.parse(JSON.stringify(value)); }
      catch { cleaned[key] = String(value); }
    }
  });
  return cleaned;
};

export async function logAdminAction(action, details = {}, admin = {}) {
  try {
    await addDoc(collection(db, 'admin_client_logs'), {
      action,
      title: details.title || action,
      severity: details.severity || 'info',
      targetUserId: details.targetUserId || '',
      targetEmail: details.targetEmail || '',
      targetCollection: details.targetCollection || '',
      targetDocId: details.targetDocId || '',
      before: details.before || null,
      after: details.after || null,
      meta: sanitizeAuditPayload(details.meta || {}),
      adminUid: admin?.uid || admin?.id || '',
      adminEmail: admin?.email || '',
      adminName: admin?.name || admin?.displayName || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('admin audit log failed:', error?.message || error);
  }
}

export function confirmSensitiveAction(message, options = {}) {
  const ok = platformConfirm(message);
  if (!ok || !options.confirmText) return ok;
  const typed = platformPrompt(`للتأكيد اكتب: ${options.confirmText}`, '');
  return String(typed || '').trim() === options.confirmText;
}
