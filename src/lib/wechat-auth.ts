/**
 * 微信登录授权工具
 * 
 * 使用说明：
 * 1. 在微信开放平台 (https://open.weixin.qq.com) 注册应用
 * 2. 获取 AppID 和 AppSecret
 * 3. 配置授权回调域名
 * 4. 将配置填入下方 WECHAT_CONFIG
 */

// 微信开放平台配置（请替换为实际值）
export const WECHAT_CONFIG = {
  AppID: 'YOUR_WECHAT_APP_ID',        // 替换为你的 AppID
  AppSecret: 'YOUR_WECHAT_APP_SECRET', // 替换为你的 AppSecret
  RedirectUri: encodeURIComponent(window.location.origin + '/auth/wechat/callback'),
  Scope: 'snsapi_login', // 请求授权作用域
};

// 微信 OAuth2 授权地址
export const WECHAT_AUTH_URL = 'https://open.weixin.qq.com/connect/qrconnect';

/**
 * 获取微信授权链接
 */
export function getWechatAuthUrl(): string {
  const params = new URLSearchParams({
    appid: WECHAT_CONFIG.AppID,
    redirect_uri: decodeURIComponent(WECHAT_CONFIG.RedirectUri),
    response_type: 'code',
    scope: WECHAT_CONFIG.Scope,
    state: generateState(),
  });
  return `${WECHAT_AUTH_URL}?${params.toString()}#wechat_redirect`;
}

/**
 * 生成随机 state 参数（防 CSRF 攻击）
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 通过 code 获取 access_token
 */
export async function getAccessToken(code: string): Promise<WechatTokenResponse> {
  const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
  const params = new URLSearchParams({
    appid: WECHAT_CONFIG.AppID,
    secret: WECHAT_CONFIG.AppSecret,
    code,
    grant_type: 'authorization_code',
  });

  const response = await fetch(`${url}?${params.toString()}`);
  return response.json();
}

/**
 * 获取用户信息
 */
export async function getWechatUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
  const url = 'https://api.weixin.qq.com/sns/userinfo';
  const params = new URLSearchParams({
    access_token: accessToken,
    openid,
  });

  const response = await fetch(`${url}?${params.toString()}`);
  return response.json();
}

/**
 * 检查 access_token 是否有效
 */
export async function checkAccessToken(accessToken: string, openid: string): Promise<boolean> {
  const url = 'https://api.weixin.qq.com/sns/auth';
  const params = new URLSearchParams({
    access_token: accessToken,
    openid,
  });

  const response = await fetch(`${url}?${params.toString()}`);
  const result = await response.json();
  return result.errcode === 0;
}

// 类型定义
export interface WechatTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatLoginResult {
  success: boolean;
  user?: {
    name: string;
    avatar: string;
    openid: string;
    unionid?: string;
  };
  error?: string;
}

/**
 * 完整的微信登录流程
 */
export async function wechatLogin(): Promise<WechatLoginResult> {
  try {
    // 1. 获取授权码（通过跳转页面）
    const authUrl = getWechatAuthUrl();
    
    // 在移动端或 App 中，可以使用微信开放平台 SDK
    // 这里提供两种方式：
    
    // 方式一：网页授权（跳转到微信授权页面）
    if (typeof window !== 'undefined') {
      // 检查是否在微信内置浏览器中
      const isWechatBrowser = /MicroMessenger/.test(navigator.userAgent);
      
      if (isWechatBrowser) {
        // 微信内置浏览器：使用微信 JS-SDK 进行授权
        return await wechatBrowserLogin();
      } else {
        // 非微信浏览器：跳转到授权页面
        window.location.href = authUrl;
        return { success: false, error: '正在跳转到微信授权页面...' };
      }
    }
    
    return { success: false, error: '无法获取授权' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 微信内置浏览器登录
 */
async function wechatBrowserLogin(): Promise<WechatLoginResult> {
  // 在微信内置浏览器中，需要先引入微信 JS-SDK
  // 然后使用 wx.openEnterpriseChat 或自行实现授权
  
  return new Promise((resolve) => {
    // 模拟登录（实际需要调用微信 API）
    setTimeout(() => {
      resolve({
        success: true,
        user: {
          name: '微信用户',
          avatar: '',
          openid: 'mock_openid',
        },
      });
    }, 1000);
  });
}

/**
 * 处理微信回调
 */
export async function handleWechatCallback(code: string): Promise<WechatLoginResult> {
  try {
    // 通过 code 获取 access_token
    const tokenResult = await getAccessToken(code);
    
    if (tokenResult.errcode) {
      return { success: false, error: tokenResult.errmsg || '获取 token 失败' };
    }

    // 通过 access_token 获取用户信息
    const userInfo = await getWechatUserInfo(tokenResult.access_token, tokenResult.openid);
    
    if (userInfo.errcode) {
      return { success: false, error: userInfo.errmsg || '获取用户信息失败' };
    }

    return {
      success: true,
      user: {
        name: userInfo.nickname,
        avatar: userInfo.headimgurl,
        openid: userInfo.openid,
        unionid: userInfo.unionid,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 刷新 access_token
 */
export async function refreshAccessToken(refreshToken: string): Promise<WechatTokenResponse> {
  const url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
  const params = new URLSearchParams({
    appid: WECHAT_CONFIG.AppID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(`${url}?${params.toString()}`);
  return response.json();
}
