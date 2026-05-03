// Firebase ADMIN SDK – server-side ONLY (API routes, server components).
// NEVER import this file from client components.
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App;

function ensureAdminInitialised(): void {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin env vars are missing. " +
        "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    );
  }

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

/** Returns the Firebase Admin Auth instance. */
export function getAdminAuth(): Auth {
  ensureAdminInitialised();
  return getAuth(adminApp);
}

/** Returns the Firebase Admin Firestore instance. */
export function getAdminDb(): Firestore {
  ensureAdminInitialised();
  return getFirestore(adminApp);
}
