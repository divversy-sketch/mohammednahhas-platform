export const ytId = (url) =>
  String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([^&?/]+)/)?.[1] || '';

export const pct = (n) => Math.max(0, Math.min(100, Math.floor(Number(n) || 0)));
export const clean = (v) => String(v || '').trim();
export const randomCode = () => `NH-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
export const userLabel = (u) => u?.name || u?.displayName || u?.email || u?.id || 'طالب';
export const userIdOf = (u) => u?.id || u?.uid || u?.userId || '';
