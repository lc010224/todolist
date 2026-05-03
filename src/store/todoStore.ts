import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskList, AppSettings, defaultLists, Priority, SubTask, TaskStatus, Workload } from '@/types/todo';

interface TodoStore {
  // 状态
  tasks: Task[];
  lists: TaskList[];
  settings: AppSettings;
  
  // 设置
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultList: (listId: string) => void;
  toggleNotifications: () => void;
  toggleHaptics: () => void;
  
  // 列表操作
  addList: (name: string, icon: string, color: string) => void;
  updateList: (id: string, updates: Partial<TaskList>) => void;
  deleteList: (id: string) => void;
  
  // 任务操作
  addTask: (title: string, listId?: string, priority?: Priority, workload?: Workload, dueDate?: string, dueTime?: string) => string;
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
      },
      
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
      addTask: (title, listId, priority = 'medium', workload, dueDate, dueTime) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newTask: Task = {
          id,
          title,
          priority,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          listId: listId || get().settings.defaultListId,
          subTasks: [],
          tags: [],
          isArchived: false,
          workload,
          dueDate,
          dueTime,
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
    }),
    {
      name: 'todo-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
