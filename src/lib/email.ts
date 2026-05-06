/**
 * 邮件服务框架
 * 
 * 此文件提供邮件发送的基础架构。
 * 实际使用时需要配置真实的邮件服务（如 SendGrid、Nodemailer 等）。
 * 
 * 当前模式：开发/测试模式 - 验证码会记录到控制台和日志文件
 */

import { generateVerifyCode, saveVerifyCode } from './db';

// 邮件发送配置
interface EmailConfig {
  mode: 'console' | 'nodemailer' | 'sendgrid' | 'smtp';
  // nodemailer / smtp 配置
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  // sendgrid 配置
  sendgridApiKey?: string;
  // 发件人
  from?: string;
}

const config: EmailConfig = {
  mode: 'console', // 开发模式：输出到控制台
  // mode: 'smtp', // 正式使用时请切换
  // smtp: {
  //   host: 'smtp.example.com',
  //   port: 587,
  //   secure: false,
  //   auth: {
  //     user: 'your-email@example.com',
  //     pass: 'your-password',
  //   },
  // },
  from: 'TodoApp <noreply@todoapp.com>',
};

/**
 * 发送验证码邮件
 * @param to 收件人邮箱
 * @param code 验证码
 */
async function sendVerifyEmail(to: string, code: string): Promise<boolean> {
  const subject = '【待办软件】邮箱验证码';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">待办软件</h1>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">您好！</p>
        <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">您正在注册待办软件账号，您的验证码是：</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">验证码有效期为 <strong>5 分钟</strong>，请尽快完成验证。</p>
        <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">如果您没有发起注册，请忽略此邮件。</p>
      </div>
    </div>
  `;

  const text = `您好！您正在注册待办软件账号，您的验证码是：${code}。验证码有效期为5分钟，请尽快完成验证。`;

  switch (config.mode) {
    case 'console':
      // 开发模式：输出到控制台
      console.log('========== 邮件发送（开发模式）==========');
      console.log(`收件人: ${to}`);
      console.log(`主题: ${subject}`);
      console.log(`验证码: ${code}`);
      console.log('=========================================');
      return true;

    case 'smtp':
      // 使用 nodemailer（需要安装 nodemailer）
      // const nodemailer = await import('nodemailer');
      // const transporter = nodemailer.createTransport(config.smtp);
      // await transporter.sendMail({ from: config.from, to, subject, text, html });
      console.warn('SMTP 模式尚未配置，请完善 config 中的 smtp 配置');
      return false;

    case 'sendgrid':
      // 使用 SendGrid API
      // const sgMail = await import('@sendgrid/mail');
      // sgMail.setApiKey(config.sendgridApiKey!);
      // await sgMail.send({ from: config.from, to, subject, text, html });
      console.warn('SendGrid 模式尚未配置，请完善 config 中的 sendgridApiKey');
      return false;

    default:
      console.warn('邮件发送模式未配置');
      return false;
  }
}

/**
 * 发送验证码（带存储）
 * @param email 邮箱地址
 * @returns 验证码（开发模式下直接返回，生产模式下会发送到邮箱）
 */
export async function sendVerifyCode(email: string): Promise<{ success: boolean; code?: string; error?: string }> {
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: '请输入有效的邮箱地址' };
  }

  // 生成验证码
  const code = generateVerifyCode();

  try {
    // 存储验证码到数据库
    saveVerifyCode(email, code);

    // 发送邮件
    const sent = await sendVerifyEmail(email, code);

    if (sent) {
      return { success: true, code: config.mode === 'console' ? code : undefined };
    } else {
      return { success: false, error: '邮件发送失败，请稍后重试' };
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    return { success: false, error: '服务器错误，请稍后重试' };
  }
}

/**
 * 批量发送邮件（预留接口）
 */
export async function sendBatchEmail(
  recipients: { email: string; data?: Record<string, unknown> }[],
  template: 'verify' | 'reset' | 'notification'
): Promise<{ success: boolean; failed?: string[] }> {
  const failed: string[] = [];

  for (const recipient of recipients) {
    try {
      // 根据模板生成内容
      let code = '';
      if (template === 'verify') {
        code = generateVerifyCode();
        saveVerifyCode(recipient.email, code);
      }
      await sendVerifyEmail(recipient.email, code);
    } catch {
      failed.push(recipient.email);
    }
  }

  return { success: failed.length === 0, failed: failed.length > 0 ? failed : undefined };
}
