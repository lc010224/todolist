import { NextResponse } from 'next/server';

export async function POST() {
  // 登出只需要前端清除 token
  // 后端可以在这里实现 token 黑名单等逻辑（当前为简化实现）
  return NextResponse.json({
    success: true,
    message: '已退出登录',
  });
}
