# 待办清单

一个简洁高效的待办事项管理应用，支持 Web 端和移动端。

## 功能特点

- ✅ 创建、编辑、删除待办任务
- ⭐ 任务优先级管理（高/中/低）
- 📅 截止日期设置
- 📝 子任务支持
- 🏷️ 标签分类
- 📱 移动端应用支持（Android/iOS）
- 🌙 暗色模式
- 💾 本地数据持久化

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 移动端开发

### 添加 Android 平台

```bash
npm run android:init
```

### 同步 Web 内容到 Android

```bash
npm run android:sync
```

### 构建 Android APK

```bash
npm run android:build
```

APK 文件将生成在 `android/app/build/outputs/apk/` 目录。

### 在模拟器或真机上运行

```bash
# 在模拟器上运行
npm run android:open

# 或手动安装 APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 项目结构

```
待办软件/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 主页面
│   │   └── globals.css      # 全局样式
│   ├── components/          # React 组件
│   │   ├── AddTaskInput.tsx # 添加任务输入框
│   │   ├── TaskItem.tsx     # 任务项
│   │   ├── SubTaskItem.tsx  # 子任务项
│   │   ├── Sidebar.tsx      # 侧边栏
│   │   ├── Header.tsx       # 头部
│   │   └── TaskEditModal.tsx# 任务编辑弹窗
│   ├── store/               # 状态管理
│   │   └── todoStore.ts     # Zustand store
│   └── types/               # TypeScript 类型
│       └── todo.ts          # 类型定义
├── public/                  # 静态资源
├── android/                 # Android 原生项目
├── capacitor.config.ts      # Capacitor 配置
└── package.json
```

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **移动端**: Capacitor
- **日期处理**: date-fns
- **ID 生成**: uuid

## 上传到 GitHub

### 1. 初始化 Git 仓库

```bash
git init
```

### 2. 添加所有文件

```bash
git add .
```

### 3. 提交

```bash
git commit -m "Initial commit: 待办清单应用"
```

### 4. 在 GitHub 创建仓库

访问 [https://github.com/new](https://github.com/new) 创建新仓库。

### 5. 关联远程仓库并推送

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

## 在手机上安装 APK

1. 在 Android 手机上启用"安装未知来源应用"
2. 通过数据线传输或网盘下载 APK 文件到手机
3. 在文件管理器中找到 APK 文件
4. 点击安装

或者使用 ADB 安装：

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 许可证

MIT License
