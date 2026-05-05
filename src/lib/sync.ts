'use client';

import { doc, setDoc, getDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface TodoData {
  tasks: any[];
  lists: any[];
  settings: any;
  lastSynced: string;
}

let unsubscribeSnapshot: (() => void) | null = null;

export async function saveUserData(db: Firestore, user: User, data: TodoData): Promise<void> {
  const userDoc = doc(db, 'users', user.uid);
  await setDoc(userDoc, {
    ...data,
    lastSynced: new Date().toISOString(),
  }, { merge: true });
}

export async function loadUserData(db: Firestore, user: User): Promise<TodoData | null> {
  const userDoc = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDoc);
  
  if (snapshot.exists()) {
    return snapshot.data() as TodoData;
  }
  return null;
}

export function subscribeToUserData(
  db: Firestore, 
  user: User, 
  onData: (data: TodoData) => void,
  onError: (error: any) => void
): () => void {
  // 取消之前的订阅
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
  }

  const userDoc = doc(db, 'users', user.uid);
  
  unsubscribeSnapshot = onSnapshot(
    userDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as TodoData);
      }
    },
    onError
  );

  return () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
  };
}

export async function mergeUserData(
  localData: { tasks: any[]; lists: any[]; settings: any },
  cloudData: TodoData | null
): Promise<{ tasks: any[]; lists: any[]; settings: any }> {
  if (!cloudData) {
    return localData;
  }

  // 简单的合并策略：取最新的数据
  // 如果本地数据比云端新，使用本地数据
  const localTime = new Date(localData.settings?.lastLocalUpdate || 0).getTime();
  const cloudTime = new Date(cloudData.lastSynced || 0).getTime();

  if (localTime > cloudTime) {
    return localData;
  }

  return {
    tasks: cloudData.tasks || [],
    lists: cloudData.lists || [],
    settings: cloudData.settings || localData.settings,
  };
}
