// شكل واحد لكل الإشعارات (قبل كده كان فيه أكتر من شكل: text مرة و body مرة، وإشعار لكل طالب لوحده).
import { serverTimestamp } from 'firebase/firestore';

export const NOTIFY_CATEGORIES = {
  announcement: { label: 'إعلان', icon: 'bell', tone: 'copper' },
  exam: { label: 'امتحان', icon: 'exam', tone: 'info' },
  reminder: { label: 'تذكير', icon: 'clock', tone: 'warn' },
  result: { label: 'نتيجة', icon: 'trophy', tone: 'ok' },
  content: { label: 'محاضرة', icon: 'video', tone: 'copper' },
  homework: { label: 'واجب', icon: 'file', tone: 'info' },
  congrats: { label: 'تهنئة', icon: 'medal', tone: 'gold' },
  warning: { label: 'تنبيه مهم', icon: 'alert', tone: 'bad' },
  payment: { label: 'الاشتراك', icon: 'wallet', tone: 'gold' },
  general: { label: 'رسالة', icon: 'message', tone: 'mute' },
};

const keysFromLegacy = (audience) => {
  if (!audience || audience === 'all') return ['all'];
  if (String(audience).startsWith('user:')) return [audience];
  return [`grade:${audience}`];
};
const legacyFromKeys = (keys) => {
  if (keys.length !== 1) return 'custom';
  const k = keys[0];
  if (k === 'all') return 'all';
  if (k.startsWith('grade:')) return k.slice(6);
  return k; // user:<uid>
};

/**
 * إشعار جاهز للحفظ في notifications.
 * target: إما { audienceKeys, audience: {mode…} } (من AudiencePicker) أو { audience: 'all' | '<grade>' | 'user:<uid>' } (القديم).
 */
export function buildNotification({ audienceKeys, audience, grade, category = 'general', priority = 'normal', title, body, link = null, sendAt = null, expiresAt = null, source = 'admin', createdBy = '' }) {
  const keys = Array.isArray(audienceKeys) && audienceKeys.length ? audienceKeys : keysFromLegacy(typeof audience === 'string' ? audience : grade);
  const legacy = legacyFromKeys(keys);
  return {
    title: String(title || 'تنبيه جديد').trim(),
    body: String(body || '').trim(),
    text: String(body || title || '').trim(),
    category,
    priority,
    link: link || null,
    sendAt: sendAt || null,
    expiresAt: expiresAt || null,
    audience: legacy,
    audienceKeys: keys,
    audienceInfo: audience && typeof audience === 'object' ? audience : null,
    grade: legacy !== 'custom' && !legacy.startsWith('user:') ? legacy : 'custom',
    source,
    createdBy,
    createdAt: serverTimestamp(),
  };
}
