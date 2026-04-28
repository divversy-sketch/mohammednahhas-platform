export function isVisibleLiveSession(session = {}, userEmail = '') {
  const now = Date.now();
  if (!session) return false;
  if (session.deleted || session.isDeleted) return false;
  if (['ended', 'closed', 'deleted', 'archived'].includes(session.status)) return false;
  if (session.isLive === false) return false;
  if (session.endsAt && new Date(session.endsAt).getTime() <= now) return false;
  if (Array.isArray(session.allowedEmails) && session.allowedEmails.length > 0 && !session.allowedEmails.includes(userEmail)) return false;
  return true;
}
