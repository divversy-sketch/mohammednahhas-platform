import { getUnifiedUserProfile } from '../data/userProfile.js';
import { ROLES } from '../../config/roles';
import { normalizeAdminProfile } from '../../config/adminPermissions';

export async function getAdminAccessProfile(user) {
  if (!user?.uid) return null;
  const profile = await getUnifiedUserProfile(user);
  if (!profile || profile.active !== true || profile.role !== ROLES.ADMIN) return null;
  return normalizeAdminProfile(user, profile);
}

export async function checkAdminAccess(user) {
  return !!(await getAdminAccessProfile(user));
}
