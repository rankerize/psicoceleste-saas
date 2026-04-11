'use client';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useState, useEffect } from 'react';

const googleProvider = new GoogleAuthProvider();

export async function signUpWithEmail(email: string, password: string, profileData: {
  nombre: string;
  tarjetaProfesional: string;
  especializacion: string;
}) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', credential.user.uid), {
    email,
    ...profileData,
    plan: 'free',
    baterias_usadas: 0,
    createdAt: serverTimestamp(),
  });
  
  const token = await credential.user.getIdToken();
  document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
  
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const token = await result.user.getIdToken();
  document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
  return result;
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken();
  document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
  
  const userDoc = await getDoc(doc(db, 'users', result.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      nombre: result.user.displayName || '',
      plan: 'free',
      baterias_usadas: 0,
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
    });
  }
  return result.user;
}

export async function logout() {
  return signOut(auth);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

/** Hook para obtener el usuario autenticado en componentes cliente */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onIdTokenChanged(async (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        const token = await u.getIdToken();
        // Save the token to a cookie so middleware can see it
        document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      } else {
        // Clear cookie on logout
        document.cookie = `firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });

    return unsub;
  }, []);

  return { user, loading };
}

export { onAuthStateChanged, auth };
export type { User };
