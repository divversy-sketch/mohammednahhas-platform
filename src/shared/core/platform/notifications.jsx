import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const platformNotify = (message, type = 'info') => {
  const text = typeof message === 'string' ? message : String(message || '');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nahhas-toast', { detail: { message: text, type } }));
  }
  return undefined;
};

export const platformConfirm = (message) => {
  // Central wrapper so the remaining destructive actions have one upgrade point.
  // The student-facing validation messages now use platformNotify instead of blocking alerts.
  return window.confirm(message);
};

export const platformPrompt = (message, defaultValue = '') => {
  return window.prompt(message, defaultValue);
};

// Promise-based prompt/confirm drawn inside the app (v2). Falls back to the browser dialogs
// when the v2 overlay is not mounted (for example inside the admin dashboard).
export const platformPromptAsync = (message, options = {}) => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!window.__nxPromptReady) return Promise.resolve(window.prompt(message, options.defaultValue || ''));
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('nahhas-prompt', { detail: { kind: 'prompt', message, ...options, resolve } }));
  });
};

export const platformConfirmAsync = (message, options = {}) => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!window.__nxPromptReady) return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('nahhas-prompt', { detail: { kind: 'confirm', message, ...options, resolve } }));
  });
};

export const ToastCenter = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (event) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const payload = { id, type: event.detail?.type || 'info', message: event.detail?.message || '' };
      setItems(prev => [payload, ...prev].slice(0, 4));
      window.setTimeout(() => setItems(prev => prev.filter(item => item.id !== id)), 3600);
    };
    window.addEventListener('nahhas-toast', onToast);
    return () => window.removeEventListener('nahhas-toast', onToast);
  }, []);
  return (
    <div className="fixed top-4 left-4 z-[10000] space-y-3 w-[min(92vw,380px)]" dir="rtl">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className={`rounded-2xl border p-4 shadow-2xl font-black ${item.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : item.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-950 border-slate-800 text-white'}`}
          >
            {item.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

