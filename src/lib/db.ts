import { randomUUID } from 'crypto';

// 简单的 JSON 文件数据库
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');

interface User {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  createdAt: string;
}

interface VerifyCode {
  email: string;
  code: string;
  expiresAt: number;
}

interface PendingUser {
  email: string;
  nickname: string;
  passwordHash: string;
  expiresAt: number;
}

interface DBData {
  users: User[];
  verifyCodes: VerifyCode[];
  pendingUsers: PendingUser[];
}

const defaultDB: DBData = {
  users: [],
  verifyCodes: [],
  pendingUsers: [],
};

function readDB(): DBData {
  const usersPath = path.join(DB_PATH, 'users.json');
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }
  if (!fs.existsSync(usersPath)) {
    writeDB(defaultDB);
    return defaultDB;
  }
  try {
    const data = fs.readFileSync(usersPath, 'utf-8');
    const parsed = JSON.parse(data);
    // 确保所有字段都存在
    return {
      users: parsed.users || [],
      verifyCodes: parsed.verifyCodes || [],
      pendingUsers: parsed.pendingUsers || [],
    };
  } catch {
    return defaultDB;
  }
}

function writeDB(data: DBData): void {
  const usersPath = path.join(DB_PATH, 'users.json');
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }
  fs.writeFileSync(usersPath, JSON.stringify(data, null, 2), 'utf-8');
}

// 用户操作
export function createUser(email: string, nickname: string, passwordHash: string): User {
  const db = readDB();
  const user: User = {
    id: randomUUID(),
    email,
    nickname,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDB(db);
  return user;
}

export function findUserByEmail(email: string): User | null {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserById(id: string): User | null {
  const db = readDB();
  return db.users.find(u => u.id === id) || null;
}

// 验证码操作
export function saveVerifyCode(email: string, code: string): void {
  const db = readDB();
  // 清除该邮箱之前的验证码
  db.verifyCodes = db.verifyCodes.filter(v => v.email !== email.toLowerCase());
  db.verifyCodes.push({
    email: email.toLowerCase(),
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟后过期
  });
  writeDB(db);
}

export function verifyCode(email: string, code: string): boolean {
  const db = readDB();
  const record = db.verifyCodes.find(
    v => v.email === email.toLowerCase() && v.code === code
  );
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    // 验证码已过期，删除
    db.verifyCodes = db.verifyCodes.filter(v => v.email !== email.toLowerCase());
    writeDB(db);
    return false;
  }
  // 验证成功后删除验证码
  db.verifyCodes = db.verifyCodes.filter(v => v.email !== email.toLowerCase());
  writeDB(db);
  return true;
}

export function clearVerifyCode(email: string): void {
  const db = readDB();
  db.verifyCodes = db.verifyCodes.filter(v => v.email !== email.toLowerCase());
  writeDB(db);
}

// 待注册用户操作
export function savePendingUser(email: string, nickname: string, passwordHash: string): void {
  const db = readDB();
  // 清除该邮箱之前的待注册信息
  db.pendingUsers = db.pendingUsers.filter(p => p.email !== email.toLowerCase());
  db.pendingUsers.push({
    email: email.toLowerCase(),
    nickname,
    passwordHash,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10分钟内必须验证
  });
  writeDB(db);
}

export function getPendingUser(email: string): PendingUser | null {
  const db = readDB();
  const pending = db.pendingUsers.find(p => p.email === email.toLowerCase());
  if (!pending) return null;
  if (Date.now() > pending.expiresAt) {
    // 已过期，删除
    db.pendingUsers = db.pendingUsers.filter(p => p.email !== email.toLowerCase());
    writeDB(db);
    return null;
  }
  return pending;
}

export function clearPendingUser(email: string): void {
  const db = readDB();
  db.pendingUsers = db.pendingUsers.filter(p => p.email !== email.toLowerCase());
  writeDB(db);
}

// 生成随机6位验证码
export function generateVerifyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
