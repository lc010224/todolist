import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser, savePendingUser } from '@/lib/db';
import { sendVerifyCode } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nickname, password } = body;

    // 验证必填字段
    if (!email || !nickname || !password) {
      return NextResponse.json(
        { success: false, error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 验证昵称长度
    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      return NextResponse.json(
        { success: false, error: '昵称长度需要在 2-20 个字符之间' },
        { status: 400 }
      );
    }

    // 验证密码强度
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密码长度至少为 6 个字符' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    // 发送验证码并存储待注册信息
    // 密码先哈希存储
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    savePendingUser(email, nickname.trim(), passwordHash);
    const result = await sendVerifyCode(email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // 开发模式下返回验证码方便测试
    const response: Record<string, unknown> = {
      success: true,
      message: '验证码已发送，请查收邮件',
    };
    if (result.code) {
      response.devCode = result.code; // 开发模式下返回验证码
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('注册请求错误:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
