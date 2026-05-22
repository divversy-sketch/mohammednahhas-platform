import { useEffect, useMemo, useState } from 'react';
import {
  defaultStudentPortalGate,
  isStudentAllowedDuringMaintenance,
  subscribeStudentPortalGate,
} from '../services/studentPortalGate.service.js';

export function useStudentPortalGate(user) {
  const [gate, setGate] = useState(defaultStudentPortalGate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeStudentPortalGate(
      (nextGate) => {
        if (!mounted) return;
        setGate(nextGate);
        setError(null);
        setLoading(false);
      },
      (gateError) => {
        if (!mounted) return;
        console.warn('student portal gate listener blocked:', gateError?.message);
        setGate(defaultStudentPortalGate);
        setError(gateError);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const isAllowed = useMemo(() => isStudentAllowedDuringMaintenance(gate, user), [gate, user]);

  return {
    gate,
    loading,
    error,
    isMaintenanceEnabled: Boolean(gate.enabled),
    isAllowed,
    shouldBlockStudent: Boolean(gate.enabled && !isAllowed),
  };
}

export default useStudentPortalGate;
