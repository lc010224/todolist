'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export function LoginButton() {
  const { user, loading, signIn, signOutUser } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('确定要退出登录吗？')) {
      await signOutUser();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>加载中...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {user.displayName?.[0] || user.email?.[0] || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
            {user.displayName || '用户'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isSigningIn}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>{isSigningIn ? '登录中...' : '登录以同步'}</span>
    </button>
  );
}
