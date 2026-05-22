export const APP_MODES = Object.freeze({
  public: 'public',
  student: 'student',
  admin: 'admin',
});

export function resolveAppMode(pathname = '/') {
  if (pathname.startsWith('/admin')) return APP_MODES.admin;
  if (pathname.startsWith('/auth') || pathname === '/') return APP_MODES.public;
  return APP_MODES.student;
}

export function getBrowserAppMode() {
  if (typeof window === 'undefined') return APP_MODES.student;
  return resolveAppMode(window.location.pathname || '/');
}
