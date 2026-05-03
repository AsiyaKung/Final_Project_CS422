"use client";

// AuthProvider – wraps the app and exposes the current user via React context.
// Keeps the Firebase Auth listener in one place so no component tree leak occurs.
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { RegisterInput, LoginInput } from "@/lib/validations/schemas";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Returns Firebase ID token for API calls (auto-refreshed). */
  getToken: () => Promise<string>;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Update display name in Auth + Firestore */
  updateDisplayName: (name: string) => Promise<void>;
  /** Update photo URL in Auth + Firestore */
  updatePhotoURL: (photoURL: string) => Promise<void>;
  /** Change password (requires current password for re-auth) */
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  /** Send a password-reset email to the current user's email */
  sendResetEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      // Ensure a users/ doc exists (handles accounts created before this logic)
      if (u) {
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: u.uid,
            name: u.displayName ?? u.email?.split("@")[0] ?? "Unknown",
            email: u.email ?? "",
            createdAt: serverTimestamp(),
          });
        } else if (!snap.data()?.name) {
          // Doc exists but name is empty — patch it
          await updateDoc(userRef, {
            name: u.displayName ?? u.email?.split("@")[0] ?? "Unknown",
          });
        }
      }
    });
    return unsub;
  }, []);

  const getToken = useCallback(async (): Promise<string> => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  }, [user]);

  const login = async ({ identifier, password }: LoginInput) => {
    // Determine if the identifier is an email or a username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    let email = identifier;

    if (!isEmail) {
      // Resolve username → email via API route (Admin SDK bypasses Firestore auth rules)
      const res = await fetch("/api/auth/resolve-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? "No account found with that username.");
      }
      email = body.email as string;
    }

    await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
  };

  const register = async ({ name, email, password }: RegisterInput) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name on the Auth profile
    await updateProfile(cred.user, { displayName: name });
    // Persist a user document in Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      createdAt: serverTimestamp(),
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateDisplayName = async (name: string) => {
    if (!user) throw new Error("Not authenticated");
    await updateProfile(user, { displayName: name });
    await updateDoc(doc(db, "users", user.uid), { name });
    // Force token refresh so `user.displayName` updates in state
    setUser({ ...user, displayName: name } as User);
  };

  const updatePhotoURL = async (photoURL: string) => {
    if (!user) throw new Error("Not authenticated");
    await updateProfile(user, { photoURL });
    await updateDoc(doc(db, "users", user.uid), { photoURL });
    setUser({ ...user, photoURL } as User);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!user || !user.email) throw new Error("Not authenticated");
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword,
    );
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  const sendResetEmail = async () => {
    if (!user?.email) throw new Error("No email on account");
    await sendPasswordResetEmail(auth, user.email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        getToken,
        login,
        register,
        logout,
        updateDisplayName,
        updatePhotoURL,
        changePassword,
        sendResetEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
