import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User as FbUser,
  type Auth
} from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function ensureApp(): { app: FirebaseApp; auth: Auth } {
  if (app && auth) return { app, auth };

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (!config.apiKey) {
    throw new Error('Firebase config missing. Fill VITE_FIREBASE_* vars in .env.local');
  }

  app = initializeApp(config);
  auth = getAuth(app);
  void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
  return { app, auth };
}

export interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
}

function toAppUser(u: FbUser | null): AppUser | null {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email,
    name: u.displayName,
    photoURL: u.photoURL
  };
}

export function watchAuth(cb: (user: AppUser | null) => void): () => void {
  const { auth } = ensureApp();
  // Surface any post-redirect result errors but rely on onAuthStateChanged for the user.
  void getRedirectResult(auth).catch(() => undefined);
  return onAuthStateChanged(auth, (u) => cb(toAppUser(u)));
}

function isMobileOrStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Android/.test(ua)) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  type IosNav = Navigator & { standalone?: boolean };
  if ((navigator as IosNav).standalone) return true;
  return false;
}

export async function signInWithGoogle(): Promise<void> {
  const { auth } = ensureApp();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  if (isMobileOrStandalone()) {
    // Redirect-based flow: full page redirect → Google → back.
    // onAuthStateChanged fires after the redirect completes.
    await signInWithRedirect(auth, provider);
    return;
  }

  // Desktop browser: popup feels lighter.
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as { code?: string }).code;
    // If popup gets blocked or closed, fall back to redirect.
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
}

export async function signOut(): Promise<void> {
  const { auth } = ensureApp();
  await fbSignOut(auth);
}
