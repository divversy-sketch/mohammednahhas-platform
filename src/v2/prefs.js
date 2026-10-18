// Per-device display preferences: skin, theme, text size, motion and haptics.
// skin '' means "use the platform default" that the admin picks in إعدادات المنصة.
import { useEffect, useState } from 'react';
import { setChromeColor } from './device/native.js';
import { DEFAULT_SKIN, SKINS, getSkin } from './skins.js';

// motion 'full' by default: many Windows PCs ship with system animations off, which would freeze the design.
// Students who want less motion pick «أقل» in الإعدادات.
const DEFAULTS = { theme: 'system', text: 'normal', motion: 'full', haptics: 'on', skin: '', v: 2 };
const PLATFORM_SKIN_KEY = 'nx-platform-skin-v2'; // v2: the cinema design; older saved skins are dropped
let platformSkin = (() => { try { return localStorage.getItem(PLATFORM_SKIN_KEY) || DEFAULT_SKIN; } catch { return DEFAULT_SKIN; } })();
const KEY = 'nx-prefs-v1';
const listeners = new Set();

function readStored() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // before v2 a device could keep one of the old colour-only skins; start everyone on the cinema design
      if (!saved.v || saved.v < 2) return { ...DEFAULTS, theme: saved.theme || 'system', text: saved.text || 'normal', haptics: saved.haptics || 'on' };
      return { ...DEFAULTS, ...saved };
    }
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

export function resolvedSkin(p = prefs) {
  const id = p.skin || platformSkin;
  return SKINS.some((s) => s.id === id) ? id : DEFAULT_SKIN;
}

const loadedFonts = new Set(['nahhas', 'cinema']); // these two ship with the app (offline-safe)
function loadSkinFonts(skin) {
  if (loadedFonts.has(skin.id) || typeof document === 'undefined') return;
  loadedFonts.add(skin.id);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${skin.fonts}&display=swap`;
  link.dataset.nxSkin = skin.id;
  document.head.appendChild(link);
}

export function applyPrefs() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const theme = resolvedTheme();
  const skin = getSkin(resolvedSkin());
  loadSkinFonts(skin);
  root.dataset.skin = skin.id;
  root.dataset.flavor = skin.flavor;
  root.dataset.theme = theme;
  root.dataset.text = prefs.text;
  root.dataset.haptics = prefs.haptics;
  if (prefs.motion === 'auto') delete root.dataset.motion; else root.dataset.motion = prefs.motion;
  root.style.colorScheme = theme;
  setChromeColor(skin[theme].bg, theme !== 'dark');
}

export function getPrefs() { return prefs; }

/** The skin every device uses until its owner picks one (set by the admin, cached on the device). */
export function setPlatformSkin(id) {
  if (!id || id === platformSkin || !SKINS.some((s) => s.id === id)) return;
  platformSkin = id;
  try { localStorage.setItem(PLATFORM_SKIN_KEY, id); } catch { /* storage blocked */ }
  applyPrefs();
  listeners.forEach((fn) => fn(prefs));
}
export function getPlatformSkin() { return platformSkin; }

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
  return { prefs: state, theme: resolvedTheme(state), skin: resolvedSkin(state), platformSkin, setPref, toggleTheme };
}
