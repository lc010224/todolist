export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'active' | 'completed';
export type Workload = 'quick' | 'medium' | 'long'; // 快速、中等、耗时

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  dueTime?: string;
  workload?: Workload;
  createdAt: string;
  createdDate: string; // 任务创建日期，格式 yyyy-MM-dd，用于判断任务是否当天创建
  updatedAt: string;
  completedAt?: string;
  listId: string;
  subTasks: SubTask[];
  tags: string[];
  isArchived: boolean;
  isRecurring?: boolean; // 是否为习惯/每日任务
  missed?: boolean; // 是否为未完成转移的任务（标记红叉）
  originalTaskId?: string; // 如果是转移的任务，记录原始任务ID
}

// 工作量配置
export const workloadConfig: Record<Workload, { label: string; color: string; icon: string }> = {
  quick: { label: '快速', color: '#22c55e', icon: '⚡' },
  medium: { label: '中等', color: '#f59e0b', icon: '⏱️' },
  long: { label: '耗时', color: '#ef4444', icon: '🔥' },
};

export interface TaskList {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  order: number;
  isDefault: boolean;
}

export interface AppState {
  tasks: Task[];
  lists: TaskList[];
  settings: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultListId: string;
  enableNotifications: boolean;
  enableHaptics: boolean;
}

// 默认列表 - 与底边栏顺序一致：收藏、清单、番茄、已完成
export const defaultLists: TaskList[] = [
  {
    id: 'important',
    name: '收藏',
    icon: '⭐',
    color: '#ef4444',
    createdAt: new Date().toISOString(),
    order: 0,
    isDefault: true,
  },
  {
    id: 'all',
    name: '清单',
    icon: '📋',
    color: '#64748b',
    createdAt: new Date().toISOString(),
    order: 1,
    isDefault: true,
  },
  {
    id: 'pomodoro',
    name: '番茄专注',
    icon: '🍅',
    color: '#ef4444',
    createdAt: new Date().toISOString(),
    order: 2,
    isDefault: true,
  },
  {
    id: 'completed',
    name: '已完成',
    icon: '✓',
    color: '#22c55e',
    createdAt: new Date().toISOString(),
    order: 3,
    isDefault: true,
  },
];

// 优先级配置
export const priorityConfig: Record<Priority, { label: string; color: string; icon: string }> = {
  high: { label: '高', color: '#ef4444', icon: '🔴' },
  medium: { label: '中', color: '#f59e0b', icon: '🟡' },
  low: { label: '低', color: '#22c55e', icon: '🟢' },
};
