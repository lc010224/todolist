import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// 检查 Firebase 配置是否完整
export function isConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  if (!isConfigured()) {
    console.error('[Firebase] 配置错误: Firebase 未配置。请创建 .env.local 文件并填入 Firebase 配置。');
    throw new Error('Firebase 未配置。请创建 .env.local 文件并填入 Firebase 配置。');
  }

  const apps = getApps();
  app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return app;
}

function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const firebaseApp = getFirebaseApp();
  auth = getAuth(firebaseApp);

  // 开发环境下连接本地模拟器（可选）
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }

  return auth;
}

export { getFirebaseApp, getFirebaseAuth };
