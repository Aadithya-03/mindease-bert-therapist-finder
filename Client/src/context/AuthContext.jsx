import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);

  const value = useMemo(() => ({
    user, loading,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUp: async (email, password, name) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      setUser({ ...cred.user, displayName: name });
    },
    google: () => signInWithPopup(auth, googleProvider),
    logout: () => signOut(auth),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function friendlyAuthError(err) {
  const map = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
    'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
    'auth/invalid-api-key': 'Firebase is not configured. Add your keys to client/.env.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase console.',
    'auth/unauthorized-domain': 'This domain is not authorised in Firebase > Authentication > Settings.',
  };
  return map[err.code] || 'Something went wrong. Please try again.';
}
