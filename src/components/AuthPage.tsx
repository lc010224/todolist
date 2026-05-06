'use client';

import { useState } from 'react';
import { useTodoStore } from '@/store/todoStore';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 登录表单
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 注册表单
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [devCode, setDevCode] = useState(''); // 开发模式下的验证码
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const setAuth = useTodoStore((state) => state.setAuth);

  // 发送验证码
  const handleSendCode = async () => {
    if (!regEmail) {
      setError('请输入邮箱地址');
      return;
    }
    if (!regNickname) {
      setError('请输入昵称');
      return;
    }
    if (regPassword.length < 6) {
      setError('密码至少6个字符');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          nickname: regNickname,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '发送验证码失败');
        setSendingCode(false);
        return;
      }

      setCodeSent(true);
      // 开发模式下显示验证码
      if (data.devCode) {
        setDevCode(data.devCode);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    }

    setSendingCode(false);
  };

  // 注册
  const handleRegister = async () => {
    if (!verifyCode) {
      setError('请输入验证码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          code: verifyCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '注册失败');
        setIsLoading(false);
        return;
      }

      // 保存认证信息到 store
      setAuth(data.user, data.token);
    } catch (err) {
      setError('网络错误，请稍后重试');
    }

    setIsLoading(false);
  };

  // 登录
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError('请填写邮箱和密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '登录失败');
        setIsLoading(false);
        return;
      }

      // 保存认证信息到 store
      setAuth(data.user, data.token);
    } catch (err) {
      setError('网络错误，请稍后重试');
    }

    setIsLoading(false);
  };

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
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 开发模式验证码提示 */}
          {devCode && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                开发模式验证码：<span className="font-mono font-bold text-lg">{devCode}</span>
              </p>
            </div>
          )}

          {activeTab === 'login' ? (
            // 登录表单
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  邮箱
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  密码
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <button
                onClick={handleLogin}
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
            </div>
          ) : (
            // 注册表单
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  邮箱
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => { setRegEmail(e.target.value); setCodeSent(false); setDevCode(''); }}
                  placeholder="请输入邮箱"
                  disabled={codeSent}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400 disabled:opacity-60"
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
                  disabled={codeSent}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  密码
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="至少6个字符"
                  disabled={codeSent}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  确认密码
                </label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  disabled={codeSent}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                             rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                             text-gray-800 dark:text-white placeholder-gray-400 disabled:opacity-60"
                />
              </div>

              {!codeSent ? (
                <button
                  onClick={handleSendCode}
                  disabled={sendingCode}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 
                             text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {sendingCode ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      发送中...
                    </>
                  ) : (
                    '发送验证码'
                  )}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      验证码
                    </label>
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                                 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                 text-gray-800 dark:text-white placeholder-gray-400 text-center text-lg tracking-widest font-mono"
                    />
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={isLoading || verifyCode.length !== 6}
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
                      '完成注册'
                    )}
                  </button>

                  <button
                    onClick={() => { setCodeSent(false); setVerifyCode(''); }}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  >
                    重新填写信息
                  </button>
                </>
              )}
            </div>
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
