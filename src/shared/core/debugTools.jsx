import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { X } from '../icons/lucide-shim.jsx';
import { platformNotify } from './platformShared.jsx';

export const DEBUG_EVENT_NAME = 'nahhas-platform-debug-log';

export const isActiveAdminSnapshot = (snap) => {
  if (!snap?.exists?.()) return false;
  const data = snap.data() || {};
  return data.active === true && data.role === 'admin';
};

// لا نعتمد على البريد الثابت ولا على users.role في صلاحيات الإدارة.
// المصدر الوحيد لصلاحية الإدارة هو: Firestore => admins/{uid} مع active=true و role='admin'.
export const isAdminIdentity = () => false;

export const getInitialRouteMode = () => {
  const path = window.location.pathname || '/';
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/student')) return 'student';
  return 'public';
};

export const navigatePlatform = (path) => {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

export const isDebugAdmin = (user, userData) => isAdminIdentity(user, userData);

export const pushRemoteDebugLog = async (entry) => {
  try {
    const u = window.__nahhasDebugUser || {};
    if (!u?.uid || !db) return;
    await addDoc(collection(db, 'debug_logs'), {
      ...entry,
      userId: u.uid,
      userEmail: u.email || '',
      userName: u.displayName || u.email || '',
      createdAt: serverTimestamp(),
      page: window.location.href,
      userAgent: navigator.userAgent
    });
  } catch (e) {}
};

export const pushDebugLog = (type, title, details = {}) => {
  try {
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      title,
      details,
      at: new Date().toLocaleString('ar-EG')
    };
    const current = JSON.parse(localStorage.getItem('nahhas_debug_logs') || '[]');
    localStorage.setItem('nahhas_debug_logs', JSON.stringify([entry, ...current].slice(0, 80)));
    window.dispatchEvent(new CustomEvent(DEBUG_EVENT_NAME, { detail: entry }));
    pushRemoteDebugLog(entry);
  } catch (e) {}
};

export const explainDebugError = (errorText = '') => {
  const t = String(errorText || '').toLowerCase();
  if (t.includes('userdata') && t.includes('not defined')) return 'متغير userData مستخدم في مكان غير متاح. الحل استخدام userData?. أو تمرير بيانات المستخدم للكومبوننت.';
  if (t.includes('permission') || t.includes('insufficient permissions')) return 'مشكلة Firebase Rules. راجع صلاحيات الـ collection المستخدمة.';
  if (t.includes('failed to fetch') || t.includes('network')) return 'مشكلة اتصال أو API غير متاح حاليًا.';
  if (t.includes('undefined')) return 'يوجد متغير غير متعرف في هذا الجزء من الصفحة.';
  return 'خطأ عام. انسخ سجل التشخيص وابعت التفاصيل.';
};

export class PlatformErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    pushDebugLog('react-error', error?.message || 'React Error', {
      stack: error?.stack,
      componentStack: info?.componentStack
    });
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || 'حدث خطأ غير معروف';
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border-t-8 border-amber-500">
            <h1 className="text-2xl font-black text-slate-900 mb-2">⚠️ الموقع تحت الصيانة مؤقتًا</h1>
            <p className="text-slate-600 font-bold mb-4">ظهر خطأ وتم منع انهيار الصفحة بالكامل.</p>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-3">
              <p className="font-black text-red-700">سبب الخطأ:</p>
              <p className="font-mono text-sm text-red-800 break-all" dir="ltr">{msg}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
              <p className="font-black text-blue-700">التفسير المقترح:</p>
              <p className="font-bold text-blue-900">{explainDebugError(msg)}</p>
            </div>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black">إعادة تحميل</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


export const DebugCollector = ({ user }) => {
  useEffect(() => {
    window.__nahhasDebugUser = user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    } : null;

    const onError = (event) => {
      pushDebugLog('window-error', event.message || 'Window Error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const onRejection = (event) => {
      pushDebugLog('promise-error', event.reason?.message || String(event.reason || 'Unhandled Promise'), {
        stack: event.reason?.stack,
        reason: String(event.reason || '')
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [user?.uid, user?.email]);

  return null;
};


export const DebugPanel = ({ user }) => {
  if (!isDebugAdmin(user)) return null;
  const [open, setOpen] = useState(false);
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [checking, setChecking] = useState(false);

  const loadLogs = () => {
    try {
      setLogs(JSON.parse(localStorage.getItem('nahhas_debug_logs') || '[]'));
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    if (!isDebugAdmin(user) || !db) return;
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'debug_logs'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setRemoteLogs(rows.slice(0, 100));
    }, (error) => {
      pushDebugLog('debug-logs-read-error', error.message, {});
    });
    } catch (error) {
      pushDebugLog('debug-logs-init-error', error.message, {});
    }
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    loadLogs();
    const onDebug = () => loadLogs();
    const onError = (event) => pushDebugLog('window-error', event.message || 'Window Error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
    const onRejection = (event) => pushDebugLog('promise-error', event.reason?.message || String(event.reason || 'Unhandled Promise'), {
      stack: event.reason?.stack,
      reason: String(event.reason || '')
    });

    window.addEventListener(DEBUG_EVENT_NAME, onDebug);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    const originalError = console.error;
    console.error = (...args) => {
      try {
        pushDebugLog('console-error', args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '), {});
      } catch (e) {}
      originalError(...args);
    };

    return () => {
      window.removeEventListener(DEBUG_EVENT_NAME, onDebug);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      console.error = originalError;
    };
  }, []);
  const checkFirebase = async () => {
    try {
      await getDoc(doc(db, 'settings', 'public'));
      pushDebugLog('firebase-ok', 'Firebase متصل', {});
      platformNotify('Firebase متصل ✅');
    } catch (e) {
      pushDebugLog('firebase-error', e.message, { stack: e.stack });
      platformNotify(`Firebase Error: ${e.message}`);
    }
  };

  const copyLogs = async () => {
    await navigator.clipboard?.writeText(JSON.stringify({ localLogs: logs, platformLogs: remoteLogs }, null, 2));
    platformNotify('تم نسخ سجل التشخيص.');
  };

  const clearLogs = () => {
    localStorage.removeItem('nahhas_debug_logs');
    setLogs([]);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-24 right-4 z-[99999] bg-slate-900 text-white rounded-full shadow-2xl px-4 py-3 font-black text-sm border border-white/20">
        🛠 Debug
      </button>

      {open && (
        <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm p-3 md:p-6 overflow-y-auto" dir="rtl">
          <div className="bg-white max-w-5xl mx-auto rounded-3xl shadow-2xl overflow-hidden border-t-8 border-slate-900">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">لوحة التشخيص الداخلية</h2>
                <p className="text-xs text-slate-300">بديل F12 على الموبايل والآيباد</p>
              </div>
              <button onClick={() => setOpen(false)} className="bg-white/10 hover:bg-white/20 rounded-full p-2"><X/></button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button onClick={checkFirebase} className="bg-blue-600 text-white rounded-xl p-3 font-black">فحص Firebase</button>
                <button onClick={copyLogs} className="bg-emerald-600 text-white rounded-xl p-3 font-black">نسخ السجل</button>
                <button onClick={clearLogs} className="bg-red-100 text-red-700 rounded-xl p-3 font-black">مسح السجل</button>
              </div>


              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                <h3 className="font-black text-purple-800 mb-3">أخطاء المنصة من كل المستخدمين</h3>
                <div className="space-y-3 max-h-[420px] overflow-auto">
                  {remoteLogs.map(log => (
                    <div key={log.id} className="bg-white border rounded-2xl p-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <p className="font-black text-slate-800">{log.title}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-1 font-bold">{log.type} • {log.userEmail || 'مستخدم'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 break-all">{log.page}</p>
                      <p className="text-sm text-blue-700 font-bold mt-2">{explainDebugError(log.title)}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-500 font-bold">عرض التفاصيل</summary>
                        <pre dir="ltr" className="mt-2 bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-[260px]">{JSON.stringify(log.details || {}, null, 2)}</pre>
                      </details>
                    </div>
                  ))}
                  {!remoteLogs.length && <p className="text-center text-purple-400 font-bold py-8">لا توجد أخطاء مرسلة من المستخدمين بعد.</p>}
                </div>
              </div>

              <div className="bg-slate-50 border rounded-2xl p-4">
                <h3 className="font-black text-slate-800 mb-3">آخر الأخطاء والأحداث</h3>
                <div className="space-y-3 max-h-[520px] overflow-auto">
                  {logs.map(log => (
                    <div key={log.id} className="bg-white border rounded-2xl p-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <p className="font-black text-slate-800">{log.title}</p>
                        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-1 font-bold">{log.type} • {log.at}</span>
                      </div>
                      <p className="text-sm text-blue-700 font-bold mt-2">{explainDebugError(log.title)}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-500 font-bold">عرض التفاصيل</summary>
                        <pre dir="ltr" className="mt-2 bg-slate-900 text-slate-100 rounded-xl p-3 text-xs overflow-auto max-h-[260px]">{JSON.stringify(log.details || {}, null, 2)}</pre>
                      </details>
                    </div>
                  ))}
                  {!logs.length && <p className="text-center text-slate-400 font-bold py-8">لا توجد أخطاء مسجلة.</p>}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm font-bold text-amber-800 leading-relaxed">
                عند ظهور مشكلة: افتح هذه اللوحة، اضغط "نسخ السجل"، وابعتلي التفاصيل. كده نعرف السبب بدون F12.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

