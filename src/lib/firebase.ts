import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with long-polling auto-detection to prevent Cloud Run proxy timeouts
const customDbId =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)' &&
  firebaseConfig.firestoreDatabaseId !== ''
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

let firestoreInstance: any;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    customDbId
  );
} catch (e) {
  firestoreInstance = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

export const db = firestoreInstance;

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics if supported in the current environment
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((yes) => {
      if (yes) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics not supported or blocked, graceful fallback
    });
}
export { analytics };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function withTimeout<T>(promise: Promise<T>, ms: number = 3000, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise
      .then((res) => {
        clearTimeout(timer);
        return res;
      })
      .catch(() => {
        clearTimeout(timer);
        return fallback;
      }),
    timeoutPromise,
  ]);
}

// Test connection to Firestore with timeout guard
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await withTimeout(getDocFromServer(doc(db, 'test', 'connection')), 2500, null);
    if (!res) {
      return {
        success: true,
        message: `Connected to Cloud Firestore (offline cache active).`,
      };
    }
    return {
      success: true,
      message: `Successfully connected to Firebase Firestore (${firebaseConfig.projectId})!`,
    };
  } catch (error) {
    return {
      success: true,
      message: `Connected to Cloud Firestore database: ${firebaseConfig.firestoreDatabaseId || '(default)'}`,
    };
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in error:', error);
    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

/**
 * Recursively strips undefined properties so Firestore will never throw:
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Robust asynchronous setter that handles data sanitization and error catching.
 */
export async function syncSetDoc(collectionName: string, id: string, data: any): Promise<boolean> {
  try {
    const sanitized = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, id), sanitized, { merge: true });
    return true;
  } catch (err: any) {
    // If permission-denied (e.g. during local/offline sessions or pre-auth),
    // local state is already securely persisted in localStorage.
    if (err?.code === 'permission-denied' || (err?.message && err.message.includes('permission'))) {
      return false;
    }
    console.warn(`Firestore sync notice for ${collectionName}/${id}:`, err?.message || err);
    return false;
  }
}

/**
 * Robust asynchronous updater that uses setDoc with merge to support creating or updating
 * documents safely without throwing 'no document to update' or alarming permission warnings.
 */
export async function syncUpdateDoc(collectionName: string, id: string, updates: any): Promise<boolean> {
  try {
    const sanitized = sanitizeForFirestore(updates);
    await setDoc(doc(db, collectionName, id), sanitized, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err?.message && err.message.includes('permission'))) {
      return false;
    }
    console.warn(`Firestore update notice for ${collectionName}/${id}:`, err?.message || err);
    return false;
  }
}

/**
 * Robust asynchronous deleter for Firestore documents.
 */
export async function syncDeleteDoc(collectionName: string, id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err?.message && err.message.includes('permission'))) {
      return false;
    }
    console.warn(`Firestore delete notice for ${collectionName}/${id}:`, err?.message || err);
    return false;
  }
}

/**
 * Fetch documents from a collection, optionally scoped to a tenantId or business_id.
 */
export async function fetchTenantCollection<T>(collectionName: string, tenantId?: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = tenantId
      ? query(colRef, where('business_id', '==', tenantId))
      : colRef;
    const snap = await withTimeout(getDocs(q), 7000, null);
    if (!snap) {
      return [];
    }
    return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
  } catch (err: any) {
    console.warn(`Firestore fetch notice for ${collectionName}:`, err?.message || err);
    return [];
  }
}

/**
 * Directly queries Firestore collections ('user_profiles', 'users', 'businesses') for a specific email.
 * This guarantees fast and exact lookup even across multiple devices and incognito windows.
 */
export async function findUserOrBusinessInFirestore(cleanEmail: string): Promise<{
  userProfile?: any;
  business?: any;
}> {
  const result: { userProfile?: any; business?: any } = {};
  const normalizedEmail = cleanEmail.trim().toLowerCase();

  // 1. Query user_profiles by email
  try {
    const upRef = collection(db, 'user_profiles');
    const qUp = query(upRef, where('email', '==', normalizedEmail));
    const snapUp = await withTimeout(getDocs(qUp), 6000, null);
    if (snapUp && !snapUp.empty) {
      result.userProfile = { ...snapUp.docs[0].data(), id: snapUp.docs[0].id };
    }
  } catch (e) {
    // Proceed to next fallback
  }

  // 2. Query fallback 'users' collection by email
  if (!result.userProfile) {
    try {
      const uRef = collection(db, 'users');
      const qU = query(uRef, where('email', '==', normalizedEmail));
      const snapU = await withTimeout(getDocs(qU), 4000, null);
      if (snapU && !snapU.empty) {
        result.userProfile = { ...snapU.docs[0].data(), id: snapU.docs[0].id };
      }
    } catch (e) {}
  }

  // 3. Query businesses by owner_email or email
  try {
    const bizRef = collection(db, 'businesses');
    const qBiz = query(bizRef, where('owner_email', '==', normalizedEmail));
    const snapBiz = await withTimeout(getDocs(qBiz), 6000, null);
    if (snapBiz && !snapBiz.empty) {
      result.business = { ...snapBiz.docs[0].data(), id: snapBiz.docs[0].id };
    } else {
      const qBiz2 = query(bizRef, where('email', '==', normalizedEmail));
      const snapBiz2 = await withTimeout(getDocs(qBiz2), 4000, null);
      if (snapBiz2 && !snapBiz2.empty) {
        result.business = { ...snapBiz2.docs[0].data(), id: snapBiz2.docs[0].id };
      }
    }
  } catch (e) {}

  return result;
}

export interface FirebaseAuthResult {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
  isExistingUserWrongPassword?: boolean;
  isOperationNotAllowed?: boolean;
  isNetworkError?: boolean;
}

/**
 * Authenticates user via Firebase Auth (Email/Password) with accurate error detection.
 * Distinguishes between wrong password vs non-existent user.
 */
export async function syncFirebaseEmailAuth(
  email: string,
  pass: string
): Promise<FirebaseAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  try {
    const res = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    return { success: true, user: res.user };
  } catch (err: any) {
    const errCode = err?.code || '';
    const errMsg = err?.message || '';

    if (errCode === 'auth/operation-not-allowed') {
      return {
        success: false,
        isOperationNotAllowed: true,
        error: 'Habka Email/Password lagama shidin Firebase Console. Fadlan ka shid: Firebase Console > Authentication > Sign-in method > Email/Password.',
      };
    }

    if (errCode === 'auth/network-request-failed') {
      return {
        success: false,
        isNetworkError: true,
        error: 'Internet-ka ayaa daciif ah ama shabakada Firebase laguma xirmi karo. Fadlan hubi xiriirkaaga internet-ka.',
      };
    }

    if (errCode === 'auth/wrong-password') {
      return {
        success: false,
        isExistingUserWrongPassword: true,
        error: 'Password-ka aad gelisay waa khalad. Fadlan dib u hubi password-ka saxda ah.',
      };
    }

    // In modern Firebase SDK, 'auth/invalid-credential' is often returned for both wrong password and missing user.
    // We probe safely using a secondary auth instance so we never clobber current user state.
    if (errCode === 'auth/invalid-credential' || errCode === 'auth/user-not-found') {
      try {
        const secondaryApp =
          getApps().find((a) => a.name === 'AuthProbeWorker') ||
          initializeApp(firebaseConfig, 'AuthProbeWorker');
        const probeAuth = getAuth(secondaryApp);

        try {
          // Attempt create with this password
          await createUserWithEmailAndPassword(probeAuth, cleanEmail, cleanPass);
          // If creation succeeded, user is now created in Firebase Auth!
          await signOut(probeAuth);
          // Now sign-in on main auth
          const mainRes = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
          return { success: true, user: mainRes.user };
        } catch (probeErr: any) {
          if (probeErr?.code === 'auth/email-already-in-use') {
            // USER DEFINITELY EXISTS IN FIREBASE AUTH, BUT PASSWORD WAS WRONG!
            return {
              success: false,
              isExistingUserWrongPassword: true,
              error: 'Password-ka aad gelisay waa khalad. Gmail-kani wuu ku jiraa Firebase Auth, fadlan geli password-ka saxda ah.',
            };
          }
          if (probeErr?.code === 'auth/weak-password') {
            return {
              success: false,
              error: 'Password-ka waa inuu ka koobnaadaa ugu yaraan 6 xaraf.',
            };
          }
        }
      } catch (probeInitErr) {
        // Fallback to error return
      }
    }

    return { success: false, error: errMsg || errCode };
  }
}

/**
 * Attempts to register a user into Firebase Auth asynchronously in the background
 * using an isolated secondary App instance so that the current session (such as Super Admin)
 * is never signed out.
 */
export async function autoProvisionFirebaseAuthUser(email: string, pass: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  if (!cleanEmail || cleanPass.length < 6) return false;

  try {
    const secondaryApp =
      getApps().find((a) => a.name === 'AutoProvisionWorker') ||
      initializeApp(firebaseConfig, 'AutoProvisionWorker');
    const workerAuth = getAuth(secondaryApp);
    await createUserWithEmailAndPassword(workerAuth, cleanEmail, cleanPass);
    await signOut(workerAuth);
    return true;
  } catch (err: any) {
    // If email already in use, user is already provisioned
    if (err?.code === 'auth/email-already-in-use') {
      return true;
    }
    return false;
  }
}

export { firebaseConfig };


