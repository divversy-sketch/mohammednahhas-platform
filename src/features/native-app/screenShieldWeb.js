import { WebPlugin } from '@capacitor/core';

export class ScreenShieldWeb extends WebPlugin {
  async enable() {
    document.documentElement.dataset.screenShield = 'web-limited';
    return { enabled: false, reason: 'browser-limitations' };
  }

  async disable() {
    delete document.documentElement.dataset.screenShield;
    return { enabled: false };
  }
}
