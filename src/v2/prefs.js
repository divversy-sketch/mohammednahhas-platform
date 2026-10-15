// Per-device display preferences: theme, text size, motion and haptics.
import { useEffect, useState } from 'react';
import { setChromeColor } from './device/native.js';

const DEFAULTS = { theme: 'system', text: 'normal', motion: 'auto', haptics: 'on' };
const KEY = 'nx-prefs-v1';
const listeners = new Set();

function readStored() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    // carry over the old per-page toggles if a student had picked dark mode before
    const legacy = localStorage.getItem('theme') || localStorage.getItem('platform-theme');
    if (legacy === 'dark' || legacy === 'light') return { ...DEFAULTS, theme: legacy };
  } catch { /* storage blocked */ }
  return { ...DEFAULTS };
}

let prefs = typeof window === 'undefined' ? { ...DEFAULTS } : readStored();

const darkQuery = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : null;

export function resolvedTheme(p = prefs) {
  if (p.theme === 'dark' || p.theme === 'light') return p.theme;
  return darkQuery?.matches ? 'dark' : 'light';
}

export function applyPrefs() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const theme = resolvedTheme();
  root.dataset.theme = theme;
  root.dataset.text = prefs.text;
  root.dataset.haptics = prefs.haptics;
  if (prefs.motion === 'auto') delete root.dataset.motion; else root.dataset.motion = prefs.motion;
  root.style.colorScheme = theme;
  setChromeColor(theme === 'dark' ? '#0F0B09' : '#FAF6F1', theme !== 'dark');
}

export function getPrefs() { return prefs; }

export function setPref(key, value) {
  prefs = { ...prefs, [key]: value };
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage blocked */ }
  applyPrefs();
  listeners.forEach((fn) => fn(prefs));
}

export function toggleTheme() {
  setPref('theme', resolvedTheme() === 'dark' ? 'light' : 'dark');
}

let watching = false;
export function startPrefs() {
  applyPrefs();
  if (watching || !darkQuery) return;
  watching = true;
  const onChange = () => { if (prefs.theme === 'system') { applyPrefs(); listeners.forEach((fn) => fn(prefs)); } };
  darkQuery.addEventListener?.('change', onChange);
}

export function usePrefs() {
  const [state, setState] = useState(prefs);
  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);
  return { prefs: state, theme: resolvedTheme(state), setPref, toggleTheme };
}
