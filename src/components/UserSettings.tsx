'use client';

import { useState, useEffect } from 'react';
import { useTodoStore } from '@/store/todoStore';

interface UserSettingsProps {
  onClose: () => void;
}

export function UserSettings({ onClose }: UserSettingsProps) {
  const user = useTodoStore((state) => state.user);
  const setUser = useTodoStore((state) => state.setUser);
  
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  
  const avatarColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];
  
  const avatarEmojis = ['😊', '😎', '🤗', '😇', '🥰', '😺', '🐱', '🦊'];
  
  const handleSave = () => {
    setUser({
      name: name.trim() || '用户',
      avatar: avatar || '😊',
      isLoggedIn: true,
    });
    onClose();
  };
  
  const handleLogout = () => {
    setUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm mx-4 shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">用户设置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4">
          {/* 头像选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">选择头像</label>
            
            {/* 颜色选择 */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">颜色</div>
              <div className="flex gap-2 flex-wrap">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAvatar(color)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform hover:scale-110 ${
                      avatar === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {name.charAt(0).toUpperCase() || 'U'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Emoji 选择 */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">表情</div>
              <div className="flex gap-2 flex-wrap">
                {avatarEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl transition-transform hover:scale-110 ${
                      avatar === emoji ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 名称输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              昵称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的昵称"
              maxLength={20}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          {/* 预览 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">预览</div>
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ 
                  backgroundColor: avatarColors.includes(avatar as any) ? avatar : '#3b82f6' 
                }}
              >
                {avatarEmojis.includes(avatar as any) ? avatar : name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {name.trim() || '用户'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  免费版
                </div>
              </div>
            </div>
          </div>
          
          {/* 按钮 */}
          <div className="space-y-2">
            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              保存设置
            </button>
            {user?.isLoggedIn && (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                退出登录
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
