import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth, isConfigured } from './firebase';
import { User } from '@/types/todo';

export { FirebaseUser };
export { isConfigured };

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

export function firebaseUserToUser(firebaseUser: FirebaseUser): User {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    nickname: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '用户',
    avatar: firebaseUser.photoURL || undefined,
  };
}

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUp(email: string, password: string, nickname?: string): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (nickname) {
    await updateProfile(result.user, { displayName: nickname });
  }
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}
