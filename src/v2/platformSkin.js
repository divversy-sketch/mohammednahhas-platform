// Keeps the device in step with the platform's default skin (platform_settings/main.defaultSkin),
// which the admin picks in إعدادات المنصة. The document is publicly readable, so this runs before login too.
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@services/firebase';
import { setPlatformSkin } from './prefs.js';

let started = false;
export function watchPlatformSkin() {
  if (started) return;
  started = true;
  try {
    onSnapshot(doc(db, 'platform_settings', 'main'), (snap) => {
      const id = snap.exists() ? snap.data()?.designSkin : '';
      if (id) setPlatformSkin(id);
    }, () => { /* offline or blocked: keep the cached skin */ });
  } catch { /* firebase not configured (local preview) */ }
}
