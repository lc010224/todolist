import { NextRequest, NextResponse } from 'next/server';
import { verifyCode, getPendingUser, createUser, clearPendingUser, findUserByEmail } from '@/lib/db';
import crypto from 'crypto';

function generateToken(userId: string): string {
  const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }; // 7天有效期
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return base64;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // 验证必填字段
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: '请填写邮箱和验证码' },
        { status: 400 }
      );
    }

    // 验证验证码
    const isValid = verifyCode(email.toLowerCase(), code);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '验证码错误或已过期' },
        { status: 400 }
      );
    }

    // 获取待注册用户信息
    const pendingUser = getPendingUser(email.toLowerCase());
    if (!pendingUser) {
      return NextResponse.json(
        { success: false, error: '注册信息已过期，请重新注册' },
        { status: 400 }
      );
    }

    // 再次验证邮箱是否已被注册（防止竞态条件）
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      clearPendingUser(email);
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    // 创建用户
    const user = createUser(email.toLowerCase(), pendingUser.nickname, pendingUser.passwordHash);

    // 清除待注册信息
    clearPendingUser(email);

    // 生成 token
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
      token,
    });
  } catch (error) {
    console.error('验证请求错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
