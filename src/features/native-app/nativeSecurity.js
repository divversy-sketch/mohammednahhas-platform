import { Capacitor, registerPlugin } from '@capacitor/core';

const ScreenShield = registerPlugin('ScreenShield', {
  web: () => import('./screenShieldWeb.js').then((m) => new m.ScreenShieldWeb()),
});

export const isNativeApp = () => Capacitor.isNativePlatform();

export async function enableNativeSecurity(options = {}) {
  const config = {
    preventScreenshots: true,
    preventScreenRecording: true,
    blurOnBackground: true,
    ...options,
  };

  try {
    await ScreenShield.enable(config);
    return { enabled: true, platform: Capacitor.getPlatform() };
  } catch (error) {
    console.warn('Native screen protection unavailable:', error);
    return { enabled: false, platform: Capacitor.getPlatform(), error };
  }
}

export async function disableNativeSecurity() {
  try {
    await ScreenShield.disable();
  } catch (error) {
    console.warn('Native screen protection disable failed:', error);
  }
}

export async function setSecureExamMode(enabled) {
  return enabled ? enableNativeSecurity({ blurOnBackground: true }) : disableNativeSecurity();
}

export { ScreenShield };
