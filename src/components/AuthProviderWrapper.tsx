'use client';

import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { subscribeToUserData, mergeUserData, saveUserData } from '@/lib/sync';
import { useTodoStore } from '@/store/todoStore';

function SyncHandler() {
  const { user, loading } = useAuth();
  const store = useTodoStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (user) {
      // 用户已登录，设置云端同步
      const loadAndMergeData = async () => {
        try {
          // 订阅云端数据变化
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }

          unsubscribeRef.current = subscribeToUserData(
            db,
            user,
            (cloudData) => {
              if (isSyncingRef.current) return;
              isSyncingRef.current = true;

              // 合并数据
              const merged = mergeUserData(
                {
                  tasks: store.tasks,
                  lists: store.lists,
                  settings: { ...store.settings, lastLocalUpdate: new Date().toISOString() }
                },
                cloudData
              );

              // 更新本地 store
              store.tasks = merged.tasks;
              store.lists = merged.lists;
              store.settings = { ...store.settings, ...merged.settings };

              setTimeout(() => {
                isSyncingRef.current = false;
              }, 1000);
            },
            (error) => {
              console.error('Sync error:', error);
              isSyncingRef.current = false;
            }
          );
        } catch (error) {
          console.error('Failed to setup sync:', error);
        }
      };

      loadAndMergeData();
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
    if (!user || loading) return;

    const saveTimer = setTimeout(() => {
      saveUserData(db, user, {
        tasks: store.tasks,
        lists: store.lists,
        settings: { ...store.settings, lastLocalUpdate: new Date().toISOString() },
        lastSynced: new Date().toISOString(),
      }).catch(console.error);
    }, 2000); // 延迟2秒保存，避免频繁写入

    return () => clearTimeout(saveTimer);
  }, [store.tasks, store.lists, store.settings, user, loading]);

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
