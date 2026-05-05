import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDemo-key-replace-with-yours",
  authDomain: "todo-app-demo.firebaseapp.com",
  projectId: "todo-app-demo",
  storageBucket: "todo-app-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, onSnapshot };
export type { User };
