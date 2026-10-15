import { useEffect, useState } from 'react';
import { getDevice, subscribeDevice } from './device.js';

/** Re-renders when the layout form (phone/tablet/desktop) or platform changes. */
export function useDevice() {
  const [device, setDevice] = useState(getDevice);
  useEffect(() => subscribeDevice(setDevice), []);
  return device;
}

/** Tracks navigator.onLine so screens can show an offline banner. */
export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}
