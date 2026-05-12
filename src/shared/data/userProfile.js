import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

export function mergeUserAndAdminProfiles(userData = null, adminData = null, authUser = null) {
  const base = { ...(userData || {}), ...(adminData || {}) };
  return {
    ...base,
    uid: authUser?.uid || base.uid || base.id || '',
    email: authUser?.email || base.email || '',
    role: adminData?.role === 'admin' ? 'admin' : (base.role || 'student'),
    adminRole: adminData?.adminRole || base.adminRole || '',
    permissions: Array.from(new Set([...(Array.isArray(userData?.permissions) ? userData.permissions : []), ...(Array.isArray(adminData?.permissions) ? adminData.permissions : [])])),
    active: adminData?.active ?? userData?.active ?? true,
    status: userData?.status || base.status || 'active',
  };
}

export async function getUnifiedUserProfile(authUser) {
  if (!authUser?.uid) return null;
  const [userSnap, adminSnap] = await Promise.all([
    getDoc(doc(db, 'users', authUser.uid)),
    getDoc(doc(db, 'admins', authUser.uid)),
  ]);
  return mergeUserAndAdminProfiles(
    userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null,
    adminSnap.exists() ? { id: adminSnap.id, ...adminSnap.data() } : null,
    authUser,
  );
}

export async function ensureUnifiedUserMirror(authUser, profile = {}) {
  if (!authUser?.uid) return;
  const payload = {
    email: authUser.email || profile.email || '',
    name: profile.name || authUser.displayName || authUser.email?.split('@')?.[0] || '',
    role: profile.role || 'student',
    adminRole: profile.adminRole || '',
    permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', authUser.uid), payload, { merge: true });
}
