import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { Button, Sheet } from './kit.jsx';
import { haptic } from '../device/native.js';

/* Toasts: frosted banner from the top on iPhone and desktop, Material snackbar on Android. */
export function NxToastCenter() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (event) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const type = event.detail?.type || 'info';
      const message = String(event.detail?.message || '').trim();
      if (!message) return;
      if (type === 'error') haptic('error'); else if (type === 'success') haptic('success');
      setItems((prev) => [{ id, type, message }, ...prev.filter((p) => p.message !== message)].slice(0, 3));
      const ttl = Math.min(7000, 2600 + message.length * 35);
      window.setTimeout(() => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, leaving: true } : p))), ttl);
      window.setTimeout(() => setItems((prev) => prev.filter((p) => p.id !== id)), ttl + 320);
    };
    window.addEventListener('nahhas-toast', onToast);
    return () => window.removeEventListener('nahhas-toast', onToast);
  }, []);
  if (!items.length) return null;
  return (
    <div className="nx nx-toasts" dir="rtl" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`nx-toast nx-toast--${item.type} ${item.leaving ? 'is-leaving' : ''}`}
          onClick={() => setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, leaving: true } : p)))}>
          <span className="nx-toast__ico"><Icon name={item.type === 'error' ? 'alert' : item.type === 'success' ? 'checkCircle' : 'bell'} /></span>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}

/* In-app replacement for window.prompt / window.confirm (they look broken inside the installed app). */
export function NxPromptCenter() {
  const [req, setReq] = useState(null);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  useEffect(() => {
    window.__nxPromptReady = true;
    const onAsk = (event) => {
      setValue(event.detail?.defaultValue || '');
      setReq(event.detail);
    };
    window.addEventListener('nahhas-prompt', onAsk);
    return () => { window.__nxPromptReady = false; window.removeEventListener('nahhas-prompt', onAsk); };
  }, []);
  useEffect(() => {
    if (req?.kind === 'prompt') window.setTimeout(() => inputRef.current?.focus(), 320);
  }, [req]);
  const finish = (result) => {
    req?.resolve?.(result);
    setReq(null);
  };
  const isPrompt = req?.kind === 'prompt';
  return (
    <Sheet open={Boolean(req)} dialog onClose={() => finish(isPrompt ? null : false)} title={req?.title || (isPrompt ? 'محتاجين منك حاجة' : 'تأكيد')}
      footer={<>
        <Button variant="ghost" onClick={() => finish(isPrompt ? null : false)}>{req?.cancelLabel || 'إلغاء'}</Button>
        <Button variant={req?.danger ? 'danger' : 'pri'} onClick={() => finish(isPrompt ? value : true)} disabled={isPrompt && req?.required !== false && !String(value).trim()}>{req?.confirmLabel || 'تمام'}</Button>
      </>}>
      {req?.message && <p className="dim" style={{ whiteSpace: 'pre-line' }}>{req.message}</p>}
      {isPrompt && (
        <form onSubmit={(e) => { e.preventDefault(); if (String(value).trim() || req?.required === false) finish(value); }}>
          <label className="nx-input">
            <Icon name={req?.icon || 'key'} />
            <input ref={inputRef} id="nx-prompt-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder={req?.placeholder || ''}
              inputMode={req?.inputMode} autoComplete="off" autoCapitalize="off" spellCheck={false} dir="auto" />
          </label>
        </form>
      )}
    </Sheet>
  );
}
