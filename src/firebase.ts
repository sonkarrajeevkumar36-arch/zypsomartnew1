import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  getDocFromServer,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';

const defaultFirebaseConfig = {
  apiKey: "AIzaSyDxztzPoCTCzckaEsvupHJOyCHEhAxr9DU",
  authDomain: "zypso-mart-cd989.firebaseapp.com",
  projectId: "zypso-mart-cd989",
  storageBucket: "zypso-mart-cd989.firebasestorage.app",
  messagingSenderId: "91046649188",
  appId: "1:91046649188:web:0472d26bc617a5396f2e71"
};

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Auto-detect buffering proxies with a 8s long-polling timeout (below the 10s offline heuristic)
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    experimentalLongPollingOptions: {
      timeoutSeconds: 8
    },
    ignoreUndefinedProperties: true
  });
} catch {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

// Sync Firestore network state cleanly with browser online/offline events
if (typeof window !== 'undefined') {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    disableNetwork(db).catch(() => {});
  }
  window.addEventListener('offline', () => {
    disableNetwork(db).catch(() => {});
  });
  window.addEventListener('online', () => {
    enableNetwork(db).catch(() => {});
  });
}

// Verify Firestore connectivity non-blockingly at startup without spamming 10s watch-stream timeouts
async function verifyFirestoreConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  let controller: AbortController | null = null;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  try {
    if (typeof fetch === 'function' && typeof AbortController === 'function') {
      controller = new AbortController();
      timerId = setTimeout(() => controller?.abort(), 5000);
      const pingUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/shopControl/status?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
      const res = await fetch(pingUrl, { method: 'GET', signal: controller.signal });
      if (!res.ok && res.status >= 500) {
        console.warn('[Firestore Connectivity Notice]: Cloud Firestore returned status', res.status);
        return;
      }
    }
    await getDocFromServer(doc(db, 'shopControl', 'status'));
  } catch (err: any) {
    if (
      err?.name === 'AbortError' ||
      err?.code === 'unavailable' ||
      (err instanceof Error && (err.message.includes('the client is offline') || err.message.includes('Failed to fetch')))
    ) {
      console.warn('[Firestore Connectivity Notice]: Client operating in offline mode until backend is reachable.');
    }
  } finally {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
  }
}
verifyFirestoreConnection();

// Enforce browser local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Persistence error:', err);
});

export function getFriendlyErrorMessage(err: any): string {
  const code = err?.code || '';
  const message = err?.message || String(err);

  switch (code) {
    case 'permission-denied':
      return 'Action not permitted. Please check if you are logged in with the correct permissions.';
    case 'unavailable':
      return 'Network is currently offline or unreachable. Please check your internet connection and try again.';
    case 'not-found':
      return 'Requested order or item was not found.';
    case 'auth/invalid-email':
      return 'The email format is invalid. Please check your spelling.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your details or sign up.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access temporarily blocked for security. Please try again in a few minutes.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please login instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups or use email and password.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'The sign-in operation was cancelled.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently disabled. Please contact support or use another method.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
}
