'use client';

import { useState, useRef } from 'react';
import { useTodoStore } from '@/store/todoStore';

interface UserSettingsProps {
  onClose: () => void;
}

export function UserSettings({ onClose }: UserSettingsProps) {
  const user = useTodoStore((state) => state.user);
  const logout = useTodoStore((state) => state.logout);
  const updateUserProfile = useTodoStore((state) => state.updateUserProfile);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  const avatarEmojis = ['😊', '😎', '🤗', '😇', '🥰', '😺', '🐱', '🦊'];

  // 检查是否是图片头像
  const isImageAvatar = avatar.startsWith('data:image');

  // 处理本地照片选择
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 检查文件大小 (限制 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatar(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    updateUserProfile({
      nickname: nickname.trim() || '用户',
      avatar: avatar || '😊',
    });
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm mx-4 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
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
          {/* 账号信息 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">账号</div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.email}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">注册于 {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}</div>
              </div>
            </div>
          </div>

          {/* 头像选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">选择头像</label>

            {/* 当前头像预览 */}
            <div className="mb-3 flex items-center justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden"
                style={{
                  backgroundColor: isImageAvatar ? '#f0f0f0' : (avatarColors.includes(avatar || '') ? avatar : '#3b82f6')
                }}
              >
                {isImageAvatar ? (
                  <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                ) : avatarEmojis.includes(avatar || '') ? (
                  <span className="text-3xl">{avatar}</span>
                ) : (
                  nickname.charAt(0).toUpperCase() || 'U'
                )}
              </div>
            </div>

            {/* 选择照片按钮 */}
            <button
              onClick={triggerFileSelect}
              className="w-full mb-3 py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              选择本地照片
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">支持 JPG、PNG 格式，最大 2MB</p>

            {/* 颜色选择 */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">或选择颜色</div>
              <div className="flex gap-2 flex-wrap justify-center">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAvatar(color)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform hover:scale-110 ${
                      avatar === color && !isImageAvatar ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {nickname.charAt(0).toUpperCase() || 'U'}
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji 选择 */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">或选择表情</div>
              <div className="flex gap-2 flex-wrap justify-center">
                {avatarEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl transition-transform hover:scale-110 ${
                      avatar === emoji && !isImageAvatar ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
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
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
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
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden"
                style={{
                  backgroundColor: isImageAvatar ? '#f0f0f0' : (avatarColors.includes(avatar || '') ? avatar : '#3b82f6')
                }}
              >
                {isImageAvatar ? (
                  <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                ) : avatarEmojis.includes(avatar || '') ? (
                  <span className="text-2xl">{avatar}</span>
                ) : (
                  nickname.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {nickname.trim() || '用户'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
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
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
