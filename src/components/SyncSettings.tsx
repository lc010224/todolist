'use client';

import { useState, useEffect } from 'react';
import { 
  getSyncConfig, 
  saveSyncConfig, 
  testWebDAVConnection, 
  uploadData, 
  downloadData,
  SyncConfig 
} from '@/lib/webdav-sync';
import { useTodoStore } from '@/store/todoStore';

interface SyncSettingsProps {
  compact?: boolean;
  onClose?: () => void;
}

export function SyncSettings({ compact = false, onClose }: SyncSettingsProps) {
  const [config, setConfig] = useState<SyncConfig>(getSyncConfig());
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const store = useTodoStore();

  useEffect(() => {
    setConfig(getSyncConfig());
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    
    const result = await testWebDAVConnection(
      config.webdavUrl,
      config.webdavUsername,
      config.webdavPassword
    );
    
    setMessage({ 
      type: result.success ? 'success' : 'error', 
      text: result.message 
    });
    
    if (result.success) {
      const newConfig = saveSyncConfig({ enabled: true });
      setConfig(newConfig);
    }
    
    setTesting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      // 上传本地数据
      const localData = store.exportData();
      const uploadResult = await uploadData(localData, config);
      
      if (uploadResult.success) {
        setMessage({ type: 'success', text: '同步成功' });
        setConfig(getSyncConfig());
      } else {
        setMessage({ type: 'error', text: uploadResult.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }

    setSyncing(false);
  };

  const handleDownload = async () => {
    if (!confirm('下载云端数据会覆盖本地数据，确定继续吗？')) return;
    
    setSyncing(true);
    setMessage(null);

    try {
      const result = await downloadData(config);
      
      if (result.success && result.data) {
        const success = store.importData(result.data);
        if (success) {
          setMessage({ type: 'success', text: '下载成功' });
        } else {
          setMessage({ type: 'error', text: '数据格式错误' });
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }

    setSyncing(false);
  };

  const handleFieldChange = (field: keyof SyncConfig, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    saveSyncConfig({ [field]: value });
  };

  // 紧凑模式（用于设置列表中的条目）
  if (compact) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">数据同步 (WebDAV)</h3>
        
        {/* 消息提示 */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* WebDAV URL */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">服务器地址</label>
          <input
            type="url"
            value={config.webdavUrl}
            onChange={(e) => handleFieldChange('webdavUrl', e.target.value)}
            placeholder="https://dav.example.com"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                       rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <div className="text-xs text-gray-400 mt-1">
            支持坚果云、群晖NAS、阿里云盘WebDAV等
          </div>
        </div>

        {/* 用户名 */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">用户名</label>
          <input
            type="text"
            value={config.webdavUsername}
            onChange={(e) => handleFieldChange('webdavUsername', e.target.value)}
            placeholder="用户名"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                       rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* 密码 */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">密码</label>
          <input
            type="password"
            value={config.webdavPassword}
            onChange={(e) => handleFieldChange('webdavPassword', e.target.value)}
            placeholder="密码"
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                       rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* 按钮组 */}
        <div className="flex gap-2">
          <button
            onClick={handleTestConnection}
            disabled={testing || !config.webdavUrl || !config.webdavUsername || !config.webdavPassword}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm"
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
          
          <button
            onClick={handleSync}
            disabled={syncing || !config.enabled}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm"
          >
            {syncing ? '同步中...' : '上传同步'}
          </button>
          
          <button
            onClick={handleDownload}
            disabled={syncing || !config.enabled}
            className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm"
          >
            {syncing ? '下载中...' : '下载同步'}
          </button>
        </div>

        {/* 同步状态 */}
        {config.lastSynced && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            上次同步: {new Date(config.lastSynced).toLocaleString('zh-CN')}
          </div>
        )}

        {/* 提示 */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="text-xs text-amber-700 dark:text-amber-400">
            <strong>提示：</strong>WebDAV 支持多种云存储服务，如坚果云、群晖 NAS、阿里云盘等。
            请确保服务器支持 WebDAV 协议。
          </div>
        </div>

        {/* 关闭按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            关闭
          </button>
        )}
      </div>
    );
  }

  // 弹窗模式
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">数据同步设置</h2>
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
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* 消息提示 */}
          {message && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {/* WebDAV URL */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">服务器地址</label>
            <input
              type="url"
              value={config.webdavUrl}
              onChange={(e) => handleFieldChange('webdavUrl', e.target.value)}
              placeholder="https://dav.example.com"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="text-xs text-gray-400 mt-1">
              支持坚果云、群晖NAS、阿里云盘WebDAV等
            </div>
          </div>

          {/* 用户名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">用户名</label>
            <input
              type="text"
              value={config.webdavUsername}
              onChange={(e) => handleFieldChange('webdavUsername', e.target.value)}
              placeholder="用户名"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* 密码 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">密码</label>
            <input
              type="password"
              value={config.webdavPassword}
              onChange={(e) => handleFieldChange('webdavPassword', e.target.value)}
              placeholder="密码"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* 按钮组 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleTestConnection}
              disabled={testing || !config.webdavUrl || !config.webdavUsername || !config.webdavPassword}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {testing ? '测试中...' : '测试连接'}
            </button>
            
            <button
              onClick={handleSync}
              disabled={syncing || !config.enabled}
              className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {syncing ? '同步中...' : '上传同步'}
            </button>
            
            <button
              onClick={handleDownload}
              disabled={syncing || !config.enabled}
              className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-lg transition-colors text-sm font-medium"
            >
              {syncing ? '下载中...' : '下载同步'}
            </button>
          </div>

          {/* 同步状态 */}
          {config.lastSynced && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
              上次同步: {new Date(config.lastSynced).toLocaleString('zh-CN')}
            </div>
          )}

          {/* 提示 */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-xs text-amber-700 dark:text-amber-400">
              <strong>提示：</strong>WebDAV 支持多种云存储服务，如坚果云、群晖 NAS、阿里云盘等。
              请确保服务器支持 WebDAV 协议。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
