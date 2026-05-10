import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { COLLECTIONS } from '../../config/collections';
import { ROLES } from '../../config/roles';

export async function checkAdminAccess(user) {
  if (!user?.uid) return false;
  const adminSnap = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
  if (!adminSnap.exists()) return false;
  const admin = adminSnap.data();
  return admin?.active === true && admin?.role === ROLES.ADMIN;
}
