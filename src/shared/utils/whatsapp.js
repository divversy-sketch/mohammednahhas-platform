// One place to build and open WhatsApp links, so every "send to parent" button behaves the same
// in the browser, the installed PWA and the Capacitor app.

const isNative = () => {
  try { return Boolean(window.Capacitor?.isNativePlatform?.()); } catch { return false; }
};

// Accepts 01xxxxxxxxx, +201xxxxxxxxx, 00201xxxxxxxxx, 1xxxxxxxxx or 201xxxxxxxxx and returns 201xxxxxxxxx.
export const toWhatsAppPhone = (value = '') => {
  let p = String(value || '').replace(/\D/g, '');
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('0') && p.length === 11) p = `20${p.slice(1)}`;
  else if (p.length === 10 && p.startsWith('1')) p = `20${p}`;
  return p.length >= 11 ? p : '';
};

export const buildWhatsAppUrl = (phone, text = '') => {
  const p = toWhatsAppPhone(phone);
  return p ? `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
};

// Call synchronously inside a click handler when the phone number is only known after an await:
// browsers block window.open once the click's user gesture has passed.
export const reserveWhatsAppWindow = () => {
  if (isNative()) return null;
  try { return window.open('', '_blank'); } catch { return null; }
};

export const openWhatsApp = (phone, text = '', reservedWindow = null) => {
  const url = buildWhatsAppUrl(phone, text);
  if (!url) {
    try { reservedWindow?.close(); } catch { /* already closed */ }
    return false;
  }
  // Inside the app the WebView hands external links to the system, which opens WhatsApp itself.
  if (isNative()) {
    window.location.href = url;
    return true;
  }
  if (reservedWindow && !reservedWindow.closed) {
    reservedWindow.location.href = url;
    return true;
  }
  const win = window.open(url, '_blank');
  if (!win) window.location.href = url;
  return true;
};
