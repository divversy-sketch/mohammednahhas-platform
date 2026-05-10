import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { getInitialRouteMode, isActiveAdminSnapshot, navigatePlatform } from '../../shared/core/debugTools.jsx';

const buildFallbackStudentProfile = (firebaseUser) => ({
  name: firebaseUser?.displayName || firebaseUser?.email?.split('@')?.[0] || 'طالب',
  email: firebaseUser?.email || '',
  grade: '1sec',
  phone: '',
  parentPhone: '',
  role: 'student',
  status: 'pending',
  subscriptionStatus: 'free',
  subscriptionExpiry: null,
});

const normalizeStudentProfile = (firebaseUser, dbUser = {}) => ({
  ...buildFallbackStudentProfile(firebaseUser),
  name: dbUser?.name || firebaseUser?.displayName || firebaseUser?.email?.split('@')?.[0] || 'طالب',
  email: dbUser?.email || firebaseUser?.email || '',
  grade: dbUser?.grade || '1sec',
  phone: dbUser?.phone || '',
  parentPhone: dbUser?.parentPhone || '',
  role: dbUser?.role || 'student',
  status: dbUser?.status || 'pending',
  subscriptionStatus: dbUser?.subscriptionStatus || 'free',
  subscriptionExpiry: dbUser?.subscriptionExpiry || null,
  ...dbUser,
});

export const useStudentSession = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      setLoading(false);
      return undefined;
    }

    let unsubscribeUserProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeUserProfile) {
        unsubscribeUserProfile();
        unsubscribeUserProfile = null;
      }

      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        if (isActiveAdminSnapshot(adminSnap)) {
          navigatePlatform('/admin');
          return;
        }
      } catch (adminError) {
        console.warn('admin access check skipped:', adminError?.message);
      }

      if (getInitialRouteMode() === 'public') {
        navigatePlatform('/student');
      }

      unsubscribeUserProfile = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (docSnap) => {
          setUserData(docSnap.exists()
            ? normalizeStudentProfile(currentUser, docSnap.data())
            : buildFallbackStudentProfile(currentUser));
          setLoading(false);
        },
        (error) => {
          console.warn('user profile listener blocked:', error?.message);
          setUserData(buildFallbackStudentProfile(currentUser));
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubscribeUserProfile) unsubscribeUserProfile();
      unsubscribeAuth();
    };
  }, []);

  return {
    user,
    userData,
    isLoading: authLoading || (user && loading),
  };
};

export default useStudentSession;
