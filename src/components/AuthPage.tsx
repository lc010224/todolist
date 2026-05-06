'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const { user, signIn, signUp, signOut, loading, error, isConfigured } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // 登录表单
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 注册表单
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);

  // 如果已登录，跳转到首页
  if (user && !loading) {
    router.push('/');
    return null;
  }

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    try {
      await signIn(loginEmail, loginPassword);
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '登录失败，请检查邮箱和密码';
      if (message.includes('user-not-found') || message.includes('wrong-password') || message.includes('invalid-credential')) {
        setFormError('邮箱或密码错误');
      } else if (message.includes('too-many-requests')) {
        setFormError('登录尝试次数过多，请稍后再试');
      } else {
        setFormError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!regEmail) {
      setFormError('请输入邮箱地址');
      return;
    }
    if (!regNickname) {
      setFormError('请输入昵称');
      return;
    }
    if (regPassword.length < 6) {
      setFormError('密码至少6个字符');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setFormError('两次密码不一致');
      return;
    }

    setIsLoading(true);

    try {
      await signUp(regEmail, regPassword, regNickname);
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '注册失败，请稍后再试';
      if (message.includes('email-already-in-use')) {
        setFormError('该邮箱已被注册');
      } else if (message.includes('weak-password')) {
        setFormError('密码强度太弱');
      } else if (message.includes('invalid-email')) {
        setFormError('邮箱格式不正确');
      } else {
        setFormError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 显示配置错误
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">配置未完成</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Firebase 尚未配置，无法使用登录功能。
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">请按以下步骤配置：</p>
              <ol className="text-sm text-gray-500 dark:text-gray-400 list-decimal list-inside space-y-1">
                <li>登录 <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Firebase Console</a></li>
                <li>创建或选择一个项目</li>
                <li>添加 Web 应用</li>
                <li>复制配置信息到 <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">.env.local</code> 文件</li>
                <li>重启开发服务器</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Logo 和标题 */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 py-8 px-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">待办软件</h1>
          <p className="text-purple-100 text-sm">高效管理你的待办事项</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { setActiveTab('login'); setFormError(''); }}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setActiveTab('register'); setFormError(''); }}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            注册
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6">
          {(formError || error) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{formError || error}</p>
            </div>
          )}

          {activeTab === 'login' ? (
            // 登录表单
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  邮箱
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                               rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                               text-gray-800 dark:text-white placeholder-gray-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 
                           text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </form>
          ) : (
            // 注册表单
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  邮箱
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  昵称
                </label>
                <input
                  type="text"
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  placeholder="2-20个字符"
                  maxLength={20}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="至少6个字符"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                               rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                               text-gray-800 dark:text-white placeholder-gray-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {regShowPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  确认密码
                </label>
                <input
                  type={regShowPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 
                           text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    注册中...
                  </>
                ) : (
                  '注册'
                )}
              </button>
            </form>
          )}
        </div>

        {/* 底部说明 */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            注册即表示同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
