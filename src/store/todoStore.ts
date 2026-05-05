import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskList, AppSettings, defaultLists, Priority, SubTask, TaskStatus, Workload } from '@/types/todo';
import { startOfDay, isSameDay, addDays, parseISO, format } from 'date-fns';

interface TodoStore {
  // 状态
  tasks: Task[];
  lists: TaskList[];
  settings: AppSettings;
  lastCheckedDate: string; // 上次检查日期，用于每日检查
  pendingTransferTasks: Task[]; // 待转移的未完成任务（用于弹窗显示）
  
  // 设置
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultList: (listId: string) => void;
  toggleNotifications: () => void;
  toggleHaptics: () => void;
  setPomodoroSettings: (settings: { pomodoroWorkDuration?: number; pomodoroShortBreak?: number; pomodoroLongBreak?: number; pomodoroSoundEnabled?: boolean }) => void;
  togglePomodoroSound: () => void;
  
  // 列表操作
  addList: (name: string, icon: string, color: string) => void;
  updateList: (id: string, updates: Partial<TaskList>) => void;
  deleteList: (id: string) => void;
  
  // 任务操作
  addTask: (title: string, listId?: string, priority?: Priority, workload?: Workload, dueDate?: string, dueTime?: string, isRecurring?: boolean) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  archiveTask: (id: string) => void;
  
  // 子任务操作
  addSubTask: (taskId: string, title: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  
  // 工具方法
  getTasksByList: (listId: string) => Task[];
  getTodayTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getImportantTasks: () => Task[];
  getCompletedTasks: () => Task[];
  searchTasks: (query: string) => Task[];
  
  // 每日检查相关
  checkAndProcessDailyTasks: () => void;
  setPendingTransferTasks: (tasks: Task[]) => void;
  confirmTransferTasks: () => void;
  dismissTransferTasks: () => void;
  generateRecurringTasks: (today: Date) => void;
  
  // 数据管理
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  clearCompletedTasks: () => void;
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      lists: defaultLists,
      settings: {
        theme: 'system',
        defaultListId: 'all',
        enableNotifications: true,
        enableHaptics: true,
        pomodoroWorkDuration: 25,
        pomodoroShortBreak: 5,
        pomodoroLongBreak: 15,
        pomodoroSoundEnabled: true,
      },
      lastCheckedDate: '',
      pendingTransferTasks: [],

      // 设置操作
      setTheme: (theme) => set((state) => ({
        settings: { ...state.settings, theme }
      })),

      setDefaultList: (listId) => set((state) => ({
        settings: { ...state.settings, defaultListId: listId }
      })),

      toggleNotifications: () => set((state) => ({
        settings: { ...state.settings, enableNotifications: !state.settings.enableNotifications }
      })),

      toggleHaptics: () => set((state) => ({
        settings: { ...state.settings, enableHaptics: !state.settings.enableHaptics }
      })),

      setPomodoroSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings }
      })),

      togglePomodoroSound: () => set((state) => ({
        settings: { ...state.settings, pomodoroSoundEnabled: !state.settings.pomodoroSoundEnabled }
      })),

      // 列表操作
      addList: (name, icon, color) => {
        const newList: TaskList = {
          id: uuidv4(),
          name,
          icon,
          color,
          createdAt: new Date().toISOString(),
          order: get().lists.length,
          isDefault: false,
        };
        set((state) => ({ lists: [...state.lists, newList] }));
      },
      
      updateList: (id, updates) => set((state) => ({
        lists: state.lists.map((list) =>
          list.id === id ? { ...list, ...updates } : list
        ),
      })),
      
      deleteList: (id) => set((state) => ({
        lists: state.lists.filter((list) => list.id !== id),
        tasks: state.tasks.map((task) =>
          task.listId === id ? { ...task, listId: 'all' } : task
        ),
      })),
      
      // 任务操作
      addTask: (title, listId, priority = 'medium', workload, dueDate, dueTime, isRecurring = false) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const newTask: Task = {
          id,
          title,
          priority,
          status: 'active',
          createdAt: now,
          createdDate: todayStr,
          updatedAt: now,
          listId: listId || get().settings.defaultListId,
          subTasks: [],
          tags: [],
          isArchived: false,
          workload,
          dueDate,
          dueTime,
          isRecurring,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        return id;
      },
      
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        ),
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      })),
      
      toggleTaskComplete: (id) => set((state) => ({
        tasks: state.tasks.map((task) => {
          if (task.id !== id) return task;
          const isCompleting = task.status === 'active';
          return {
            ...task,
            status: isCompleting ? 'completed' : 'active',
            completedAt: isCompleting ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }),
      })),
      
      archiveTask: (id) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, isArchived: true } : task
        ),
      })),
      
      // 子任务操作
      addSubTask: (taskId, title) => {
        const newSubTask: SubTask = {
          id: uuidv4(),
          title,
          completed: false,
        };
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, subTasks: [...task.subTasks, newSubTask] }
              : task
          ),
        }));
      },
      
      toggleSubTask: (taskId, subTaskId) => set((state) => ({
        tasks: state.tasks.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            subTasks: task.subTasks.map((st) =>
              st.id === subTaskId ? { ...st, completed: !st.completed } : st
            ),
          };
        }),
      })),
      
      deleteSubTask: (taskId, subTaskId) => set((state) => ({
        tasks: state.tasks.map((task) => {
          if (task.id !== taskId) return task;
          return {
            ...task,
            subTasks: task.subTasks.filter((st) => st.id !== subTaskId),
          };
        }),
      })),
      
      // 工具方法
      getTasksByList: (listId) => {
        const { tasks } = get();
        return tasks.filter((task) => task.listId === listId && !task.isArchived);
      },
      
      getTodayTasks: () => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return tasks.filter((task) => {
          if (task.status === 'completed' || task.isArchived) return false;
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate < tomorrow;
        });
      },
      
      getUpcomingTasks: () => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        return tasks.filter((task) => {
          if (task.status === 'completed' || task.isArchived) return false;
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate <= weekEnd;
        });
      },
      
      getImportantTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => 
          task.priority === 'high' && task.status === 'active' && !task.isArchived
        );
      },
      
      getCompletedTasks: () => {
        const { tasks } = get();
        return tasks.filter((task) => task.status === 'completed' && !task.isArchived);
      },
      
      searchTasks: (query) => {
        const { tasks } = get();
        const lowerQuery = query.toLowerCase();
        return tasks.filter((task) =>
          task.title.toLowerCase().includes(lowerQuery) ||
          task.description?.toLowerCase().includes(lowerQuery) ||
          task.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      },
      
      // 每日检查：检查是否有未完成任务需要转移
      checkAndProcessDailyTasks: () => {
        const state = get();
        const today = startOfDay(new Date());
        const lastChecked = state.lastCheckedDate ? startOfDay(parseISO(state.lastCheckedDate)) : null;
        
        // 如果今天已经检查过，不需要重复检查
        if (lastChecked && isSameDay(lastChecked, today)) {
          return;
        }
        
        // 查找昨天的未完成任务（不包括已完成和习惯任务）
        const yesterday = addDays(today, -1);
        const yesterdayTasks = state.tasks.filter((task) => {
          if (task.status === 'completed' || task.isArchived) return false;
          if (task.isRecurring) return false; // 习惯任务不处理
          if (!task.dueDate) return false;
          const dueDate = startOfDay(parseISO(task.dueDate));
          return isSameDay(dueDate, yesterday);
        });
        
        if (yesterdayTasks.length > 0) {
          set({ pendingTransferTasks: yesterdayTasks });
        }
        
        // 更新最后检查日期
        set({ lastCheckedDate: today.toISOString() });
      },
      
      // 设置待转移的任务
      setPendingTransferTasks: (tasks) => set({ pendingTransferTasks: tasks }),
      
      // 确认转移任务
      confirmTransferTasks: () => {
        const { pendingTransferTasks, tasks } = get();
        const today = startOfDay(new Date());
        const todayStr = format(today, 'yyyy-MM-dd');
        
        // 更新昨天未完成任务：标记为已错过（红叉），但保留原记录
        const updatedTasks = tasks.map((task) => {
          const pendingTask = pendingTransferTasks.find((pt) => pt.id === task.id);
          if (pendingTask) {
            return { ...task, missed: true };
          }
          return task;
        });
        
        // 创建今天的新任务（复制未完成的任务）
        const newTasks = pendingTransferTasks.map((task) => ({
          ...task,
          id: uuidv4(),
          dueDate: todayStr,
          status: 'active' as const,
          missed: false,
          completedAt: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          originalTaskId: task.id,
        }));
        
        set({
          tasks: [...updatedTasks, ...newTasks],
          pendingTransferTasks: [],
        });
      },
      
      // 忽略转移任务
      dismissTransferTasks: () => {
        set({ pendingTransferTasks: [] });
      },
      
      // 生成习惯任务（每天自动生成）
      generateRecurringTasks: (today: Date) => {
        const { tasks } = get();
        const todayStart = startOfDay(today);
        const todayStr = format(todayStart, 'yyyy-MM-dd');
        
        // 找出所有习惯任务
        const recurringTasks = tasks.filter((task) => task.isRecurring && !task.isArchived);
        
        // 检查今天是否已经有这个习惯任务
        const existingRecurringTasksToday = tasks.filter((task) => {
          if (!task.isRecurring || task.isArchived) return false;
          if (!task.dueDate) return false;
          return isSameDay(parseISO(task.dueDate), todayStart);
        });
        
        const existingIds = new Set(existingRecurringTasksToday.map((t) => t.originalTaskId || t.id));
        
        // 为今天还没有的习惯任务创建新任务
        const newTasks = recurringTasks
          .filter((task) => !existingIds.has(task.id))
          .map((task) => ({
            ...task,
            id: uuidv4(),
            dueDate: todayStr,
            status: 'active' as const,
            missed: false,
            completedAt: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        
        if (newTasks.length > 0) {
          set((state) => ({ tasks: [...state.tasks, ...newTasks] }));
        }
      },

      // 导出数据
      exportData: () => {
        const state = get();
        const data = {
          tasks: state.tasks,
          lists: state.lists,
          settings: state.settings,
          exportedAt: new Date().toISOString(),
          version: '1.0.6',
        };
        return JSON.stringify(data, null, 2);
      },

      // 导入数据
      importData: (jsonStr: string) => {
        try {
          const data = JSON.parse(jsonStr);
          if (data.tasks && Array.isArray(data.tasks)) {
            set({ tasks: data.tasks });
          }
          if (data.lists && Array.isArray(data.lists)) {
            // 合并清单，保留新清单
            const state = get();
            const existingListIds = new Set(state.lists.map(l => l.id));
            const newLists = data.lists.filter((l: TaskList) => !existingListIds.has(l.id));
            if (newLists.length > 0) {
              set({ lists: [...state.lists, ...newLists] });
            }
          }
          if (data.settings) {
            set((state) => ({
              settings: { ...state.settings, ...data.settings }
            }));
          }
          return true;
        } catch (e) {
          console.error('Import failed:', e);
          return false;
        }
      },

      // 清除已完成任务
      clearCompletedTasks: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.status !== 'completed')
        }));
      },
    }),
    {
      name: 'todo-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
