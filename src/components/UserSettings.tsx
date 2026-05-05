'use client';

import { useState, useRef } from 'react';
import { useTodoStore } from '@/store/todoStore';

interface UserSettingsProps {
  onClose: () => void;
}

export function UserSettings({ onClose }: UserSettingsProps) {
  const user = useTodoStore((state) => state.user);
  const setUser = useTodoStore((state) => state.setUser);
  
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [showWechatLogin, setShowWechatLogin] = useState(false);
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

  // 微信登录处理
  const handleWechatLogin = () => {
    setShowWechatLogin(true);
  };

  // 模拟微信登录成功（实际需要后端配合）
  const simulateWechatLogin = () => {
    setUser({
      name: '微信用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
      isLoggedIn: true,
      loginType: 'wechat',
    });
    setShowWechatLogin(false);
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
          {/* 头像选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">选择头像</label>
            
            {/* 当前头像预览 */}
            <div className="mb-3 flex items-center justify-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden"
                style={{ 
                  backgroundColor: isImageAvatar ? '#f0f0f0' : (avatarColors.includes(avatar) ? avatar : '#3b82f6') 
                }}
              >
                {isImageAvatar ? (
                  <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                ) : avatarEmojis.includes(avatar) ? (
                  <span className="text-3xl">{avatar}</span>
                ) : (
                  name.charAt(0).toUpperCase() || 'U'
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
                    {name.charAt(0).toUpperCase() || 'U'}
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
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden"
                style={{ 
                  backgroundColor: isImageAvatar ? '#f0f0f0' : (avatarColors.includes(avatar) ? avatar : '#3b82f6')
                }}
              >
                {isImageAvatar ? (
                  <img src={avatar} alt="头像" className="w-full h-full object-cover" />
                ) : avatarEmojis.includes(avatar) ? (
                  <span className="text-2xl">{avatar}</span>
                ) : (
                  name.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {name.trim() || '用户'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.loginType === 'wechat' ? '微信用户' : '本地用户'}
                </div>
              </div>
            </div>
          </div>

          {/* 登录方式 */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">其他登录方式</div>
            <button
              onClick={handleWechatLogin}
              className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89l-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
              微信登录
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
              微信登录需要在微信开放平台配置
            </p>
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

        {/* 微信登录弹窗 */}
        {showWechatLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowWechatLogin(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">微信登录</h3>
              
              {/* 二维码区域 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                  {/* 这里放置实际的微信二维码 */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-2 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">请使用微信扫码</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                打开微信扫一扫上方二维码进行登录
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowWechatLogin(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={simulateWechatLogin}
                  className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600"
                >
                  模拟登录（开发用）
                </button>
              </div>

              {/* 实际微信登录说明 */}
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>提示：</strong>正式使用时，需要在微信开放平台(open.weixin.qq.com)注册应用，获取 AppID 和 AppSecret，并配置回调地址。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
