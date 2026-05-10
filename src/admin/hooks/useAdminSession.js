import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { isActiveAdminSnapshot } from '../../shared/core/debugTools.jsx';

export const useAdminSession = () => {
  const [user, setUser] = useState(null);
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
      setIsAdminAccount(false);
      setAuthLoading(false);

      if (!currentUser) {
        setAdminChecking(false);
        return;
      }

      setAdminChecking(true);
      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        setIsAdminAccount(isActiveAdminSnapshot(adminSnap));
      } catch (adminError) {
        console.warn('admin access check skipped:', adminError?.message);
        setIsAdminAccount(false);
      } finally {
        setAdminChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isAdminAccount,
    isLoading: authLoading || adminChecking,
  };
};

export default useAdminSession;
