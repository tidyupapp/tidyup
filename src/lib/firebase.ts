import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
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
  return onAuthStateChanged(auth, (u) => cb(toAppUser(u)));
}

export async function signInWithGoogle(): Promise<AppUser> {
  const { auth } = ensureApp();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = toAppUser(result.user);
  if (!user) throw new Error('Sign-in returned no user');
  return user;
}

export async function signOut(): Promise<void> {
  const { auth } = ensureApp();
  await fbSignOut(auth);
}
