import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLLECTIONS } from '../../config/collections';
import { ROLES } from '../../config/roles';
import { isOwnerEmail, normalizeAdminProfile } from '../../config/adminPermissions';

export async function getAdminAccessProfile(user) {
  if (!user?.uid) return null;
  if (isOwnerEmail(user.email)) return normalizeAdminProfile(user, { role: ROLES.ADMIN, adminRole: 'owner' });
  const adminSnap = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
  if (!adminSnap.exists()) return null;
  const admin = adminSnap.data() || {};
  if (admin?.active !== true || admin?.role !== ROLES.ADMIN) return null;
  return normalizeAdminProfile(user, admin);
}

export async function checkAdminAccess(user) {
  return !!(await getAdminAccessProfile(user));
}
