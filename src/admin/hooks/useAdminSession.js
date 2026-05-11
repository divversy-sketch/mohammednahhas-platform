import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { isActiveAdminSnapshot } from '../../shared/core/debugTools.jsx';
import { isOwnerEmail, normalizeAdminProfile } from '../../config/adminPermissions';

export const useAdminSession = () => {
  const [user, setUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminChecking, setAdminChecking] = useState(false);
  const [isAdminAccount, setIsAdminAccount] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setAdminChecking(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAdminProfile(null);
      setIsAdminAccount(false);
      setAuthLoading(false);

      if (!currentUser) {
        setAdminChecking(false);
        return;
      }

      setAdminChecking(true);
      try {
        if (isOwnerEmail(currentUser.email)) {
          setAdminProfile(normalizeAdminProfile(currentUser, { adminRole: 'owner', role: 'admin', active: true }));
          setIsAdminAccount(true);
          return;
        }

        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        const allowed = isActiveAdminSnapshot(adminSnap);
        setIsAdminAccount(allowed);
        setAdminProfile(allowed ? normalizeAdminProfile(currentUser, adminSnap.data()) : null);
      } catch (adminError) {
        console.warn('admin access check skipped:', adminError?.message);
        setIsAdminAccount(false);
        setAdminProfile(null);
      } finally {
        setAdminChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    adminProfile,
    isAdminAccount,
    isLoading: authLoading || adminChecking,
  };
};

export default useAdminSession;
