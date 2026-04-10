'use client';

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
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
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
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

/** Hook para obtener el usuario autenticado en componentes cliente */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading };
}

export { onAuthStateChanged, auth };
export type { User };
