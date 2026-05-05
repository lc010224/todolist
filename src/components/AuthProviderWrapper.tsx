'use client';

import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { db, isValidConfig } from '@/lib/firebase';
import { subscribeToUserData, saveUserData } from '@/lib/sync';
import { useTodoStore } from '@/store/todoStore';

function SyncHandler() {
  const { user, loading } = useAuth();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (loading || !isValidConfig) return;

    if (user) {
      // 用户已登录，设置云端同步
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = subscribeToUserData(
        db!,
        user,
        (cloudData) => {
          // 合并数据到本地 store
          const store = useTodoStore.getState();
          store.tasks = cloudData.tasks || [];
          store.lists = cloudData.lists || [];
          if (cloudData.settings) {
            store.settings = { ...store.settings, ...cloudData.settings };
          }
        },
        (error) => {
          console.error('Sync error:', error);
        }
      );
    } else {
      // 用户未登录，取消订阅
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, loading]);

  // 保存数据到云端
  useEffect(() => {
    if (!user || loading || !isValidConfig) return;

    const saveTimer = setTimeout(() => {
      const store = useTodoStore.getState();
      saveUserData(db!, user, {
        tasks: store.tasks,
        lists: store.lists,
        settings: { ...store.settings, lastLocalUpdate: new Date().toISOString() },
        lastSynced: new Date().toISOString(),
      }).catch(console.error);
    }, 2000); // 延迟2秒保存，避免频繁写入

    return () => clearTimeout(saveTimer);
  }, [user, loading]);

  return null;
}

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncHandler />
      {children}
    </AuthProvider>
  );
}
