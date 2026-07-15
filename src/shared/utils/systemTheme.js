export const getSystemTheme = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const subscribeToSystemTheme = (onChange) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (event) => onChange(event.matches ? 'dark' : 'light');
  media.addEventListener?.('change', listener);
  return () => media.removeEventListener?.('change', listener);
};
