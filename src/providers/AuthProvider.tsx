'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { User } from '@/types/todo';

interface AuthContextValue {
  user: User | null;
  firebaseUser: any; // Firebase User 类型
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const { setAuth, logout } = useTodoStore();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        // 动态导入以避免在配置不完整时立即崩溃
        const authModule = await import('@/lib/auth');
        const { onAuthChange: subscribeAuth, isConfigured: checkConfig, firebaseUserToUser } = authModule;

        // 检查 Firebase 是否配置
        if (!checkConfig()) {
          setIsConfigured(false);
          setError('Firebase 未配置。请创建 .env.local 文件并填入 Firebase 配置。');
          setLoading(false);
          return;
        }

        setIsConfigured(true);
        setError(null);

        unsubscribe = subscribeAuth(async (user: any) => {
          setFirebaseUser(user);
          if (user) {
            try {
              const token = await user.getIdToken();
              const { firebaseUserToUser: convertUser } = await import('@/lib/auth');
              setAuth(convertUser(user), token);
            } catch (tokenError) {
              console.error('获取 ID Token 失败:', tokenError);
            }
          } else {
            logout();
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Auth 初始化失败:', err);
        setError('认证服务初始化失败');
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setAuth, logout]);

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      throw new Error('Firebase 未配置');
    }
    const { signIn: doSignIn, firebaseUserToUser: convertUser } = await import('@/lib/auth');
    const user = await doSignIn(email, password);
    const token = await user.getIdToken();
    setAuth(convertUser(user), token);
  };

  const signUp = async (email: string, password: string, nickname?: string) => {
    if (!isConfigured) {
      throw new Error('Firebase 未配置');
    }
    const { signUp: doSignUp, firebaseUserToUser: convertUser } = await import('@/lib/auth');
    const user = await doSignUp(email, password, nickname);
    const token = await user.getIdToken();
    setAuth(convertUser(user), token);
  };

  const signOut = async () => {
    const { signOut: doSignOut } = await import('@/lib/auth');
    await doSignOut();
    logout();
  };

  const user = firebaseUser ? {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    nickname: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '用户',
    avatar: firebaseUser.photoURL || undefined,
  } as User : null;

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, error, isConfigured, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
