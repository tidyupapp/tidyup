export type PlatformKind = 'ios' | 'ipad' | 'android' | 'desktop';
export type DisplayMode = 'browser' | 'standalone' | 'minimal-ui';

export function detectPlatform(): PlatformKind {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return 'ios';
  if (/iPad/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))) return 'ipad';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS quirk: navigator.standalone is non-standard but reliable.
  type IosNav = Navigator & { standalone?: boolean };
  if ((navigator as IosNav).standalone === true) return true;
  return false;
}

export function isInWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iOS in-app browsers (FB, IG, etc.) usually contain these markers.
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|wv\)/.test(ua);
}

export function isSafariOnIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) && /iPhone|iPad|iPod/.test(ua);
}
