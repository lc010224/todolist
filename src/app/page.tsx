'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { Task } from '@/types/todo';
import { Sidebar } from '@/components/Sidebar';
import { TaskItem } from '@/components/TaskItem';
import { TaskEditModal } from '@/components/TaskEditModal';
import { AddTaskModal } from '@/components/AddTaskModal';
import { TransferTasksModal } from '@/components/TransferTasksModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, startOfDay, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 番茄钟配置
const POMODORO_CONFIG = {
  work: 25 * 60, // 25分钟工作
  shortBreak: 5 * 60, // 5分钟短休息
  longBreak: 15 * 60, // 15分钟长休息
  longBreakInterval: 4, // 每4个番茄钟后长休息
};

type TimerMode = 'work' | 'shortBreak' | 'longBreak' | 'custom';

export default function Home() {
  const [currentListId, setCurrentListId] = useState('calendar');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // 番茄钟状态
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [mode, setMode] = useState<TimerMode>('work');
  const [sessions, setSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lists = useTodoStore((state) => state.lists);
  const tasks = useTodoStore((state) => state.tasks);
  const settingsRaw = useTodoStore((state) => state.settings);
  // 添加默认值回退，防止 localStorage 中没有这些字段
  const settings = useMemo(() => ({
    ...settingsRaw,
    pomodoroWorkDuration: settingsRaw.pomodoroWorkDuration || 25,
    pomodoroShortBreak: settingsRaw.pomodoroShortBreak || 5,
    pomodoroLongBreak: settingsRaw.pomodoroLongBreak || 15,
    pomodoroSoundEnabled: settingsRaw.pomodoroSoundEnabled ?? true,
  }), [settingsRaw]);
  const getTasksByList = useTodoStore((state) => state.getTasksByList);
  const getTodayTasks = useTodoStore((state) => state.getTodayTasks);
  const getUpcomingTasks = useTodoStore((state) => state.getUpcomingTasks);
  const getImportantTasks = useTodoStore((state) => state.getImportantTasks);
  const getCompletedTasks = useTodoStore((state) => state.getCompletedTasks);
  const pendingTransferTasks = useTodoStore((state) => state.pendingTransferTasks);
  const confirmTransferTasks = useTodoStore((state) => state.confirmTransferTasks);
  const dismissTransferTasks = useTodoStore((state) => state.dismissTransferTasks);
  const checkAndProcessDailyTasks = useTodoStore((state) => state.checkAndProcessDailyTasks);
  const generateRecurringTasks = useTodoStore((state) => state.generateRecurringTasks);

  // 初始化番茄钟时间
  useEffect(() => {
    if (!initialized) {
      setTimeLeft(settings.pomodoroWorkDuration * 60);
      setInitialized(true);
    }
  }, [settings, initialized]);
  
  const currentList = lists.find((l) => l.id === currentListId);
  
  // 判断是否是日历页面
  const isCalendarPage = currentListId === 'calendar';
  // 判断是否是番茄专注页面
  const isPomodoroPage = currentListId === 'pomodoro';
  // 判断是否是设置页面
  const isSettingsPage = currentListId === 'settings';
  
  // 获取当前列表的任务
  const getCurrentTasks = (): Task[] => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayStart = startOfDay(new Date());
    const yesterdayStart = addDays(todayStart, -1);
    const yesterdayEnd = addDays(todayStart, 0);
    yesterdayEnd.setHours(23, 59, 59, 999);

    // 日历页面：显示所有未完成任务和当天创建的已完成任务
    if (currentListId === 'calendar') {
      const calendarTasks = tasks.filter((t) => !t.isArchived);
      const filteredTasks = calendarTasks.filter((task) => {
        if (task.status === 'completed') {
          return task.createdDate === today;
        }
        return true;
      });
      return [...filteredTasks].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    if (currentListId === 'all' || !lists.find(l => l.id === currentListId)?.isDefault) {
      const listTasks = currentListId === 'all'
        ? tasks.filter((t) => !t.isArchived)
        : getTasksByList(currentListId);

      // 过滤已完成任务：只显示当天创建的任务
      const filteredListTasks = listTasks.filter((task) => {
        if (task.status === 'completed') {
          return task.createdDate === today;
        }
        return true;
      });

      return [...filteredListTasks].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        if (a.status === 'active') {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          if (a.priority !== b.priority) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    switch (currentListId) {
      case 'today':
        return getTodayTasks();
      case 'pomodoro':
        return getUpcomingTasks();
      case 'completed':
        return tasks.filter((t) =>
          !t.isArchived &&
          t.status === 'completed' &&
          t.createdDate === today
        );
      default:
        return getTasksByList(currentListId);
    }
  };
  
  const currentTasks = getCurrentTasks();
  
  // 搜索过滤
  const filteredTasks = searchQuery 
    ? currentTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentTasks;
  
  // 番茄钟功能
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getModeLabel = (m: TimerMode) => {
    switch (m) {
      case 'work': return '专注';
      case 'shortBreak': return '短休息';
      case 'longBreak': return '长休息';
      case 'custom': return '自定义';
    }
  };

  const getModeColor = (m: TimerMode) => {
    switch (m) {
      case 'work': return 'text-red-500';
      case 'shortBreak': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
      case 'custom': return 'text-purple-500';
    }
  };

  const [customTime, setCustomTime] = useState(30); // 自定义时间（分钟）
  const [showCustomModal, setShowCustomModal] = useState(false);

  const getTotalTime = (m: TimerMode) => {
    if (m === 'custom') return customTime * 60;
    switch (m) {
      case 'work': return settings.pomodoroWorkDuration * 60;
      case 'shortBreak': return settings.pomodoroShortBreak * 60;
      case 'longBreak': return settings.pomodoroLongBreak * 60;
      default: return settings.pomodoroWorkDuration * 60;
    }
  };

  const switchMode = useCallback((newMode: TimerMode, customMinutes?: number) => {
    setMode(newMode);
    if (newMode === 'custom' && customMinutes) {
      setTimeLeft(customMinutes * 60);
    } else {
      switch (newMode) {
        case 'work': setTimeLeft(settings.pomodoroWorkDuration * 60); break;
        case 'shortBreak': setTimeLeft(settings.pomodoroShortBreak * 60); break;
        case 'longBreak': setTimeLeft(settings.pomodoroLongBreak * 60); break;
        default: setTimeLeft(settings.pomodoroWorkDuration * 60);
      }
    }
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [settings]);
  
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // 播放提示音
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVcQNpHW+NueZVQ1Wq/w/5xkPzJJlub/o2hbOUmI1vTlpn5gMUOQ3PTrnnxjLj+P4fTvqYZnMD2L4fX0qoNrLzmI4vX4r4RxKjmD4fb8sYd0LzmA4ff+s4l3MzmA4Pf+tYx5NTl/4Pf+u5B8OTl+4Pf+vJJ+PTp94Pf+vpOQQEBA');
              audio.play().catch(() => {});
            } catch (e) {}

            // 切换到下一个模式
            if (mode === 'work') {
              const newSessions = sessions + 1;
              setSessions(newSessions);
              setTotalMinutes((prev) => prev + settings.pomodoroWorkDuration);
              if (newSessions % 4 === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              switchMode('work');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, sessions, switchMode]);
  
  // 每日检查：检查未完成任务和生成习惯任务
  useEffect(() => {
    checkAndProcessDailyTasks();
    generateRecurringTasks(new Date());
  }, [checkAndProcessDailyTasks, generateRecurringTasks]);
  
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  const resetTimer = () => {
    setTimeLeft(getTotalTime(mode));
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // 生成7天的日期数据（用于列表视图）- 从周一开始
  const generateWeekDays = () => {
    const days = [];
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 找到本周一
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = tasks.filter(t => {
        if (t.status === 'completed' || t.isArchived) return false;
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        return due >= dayStart && due <= dayEnd;
      }).length;
      
      days.push({
        date,
        day: date.getDate(),
        weekDay: weekDays[i],
        isToday: date.getTime() === today.getTime(),
        count,
      });
    }
    return days;
  };
  
  const weekDays = generateWeekDays();
  const maxCount = Math.max(...weekDays.map(d => d.count), 1);
  
  // 生成日历数据
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };
  
  const calendarDays = generateCalendarDays();
  
  // 获取某天的任务数量
  const getTaskCountForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return currentTasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= dayStart && due <= dayEnd;
    }).length;
  };
  
  // 获取选中日期的任务
  const getTasksForSelectedDate = () => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return currentTasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= dayStart && due <= dayEnd;
    });
  };
  
  const selectedDateTasks = getTasksForSelectedDate();
  
  // 选中日期的格式化字符串
  const selectedDateStr = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;
  const weekDayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const selectedWeekDay = weekDayNames[selectedDate.getDay()];

  // 获取农历日期（简化版）
  const getLunarDate = (date: Date): string => {
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                       '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                       '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    const month = date.getMonth();
    const day = Math.min(date.getDate() - 1, 29);
    return `${lunarMonths[month]}月${lunarDays[day]}`;
  };

  // 获取节假日信息
  const getHolidayInfo = (date: Date): { name: string; color: string } | null => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();

    const holidays: Record<string, { name: string; color: string }> = {
      '1-1': { name: '元旦', color: 'bg-red-500' },
      '2-14': { name: '情人节', color: 'bg-pink-500' },
      '3-8': { name: '妇女节', color: 'bg-purple-500' },
      '3-12': { name: '植树节', color: 'bg-green-500' },
      '4-1': { name: '愚人节', color: 'bg-orange-500' },
      '4-5': { name: '清明', color: 'bg-green-600' },
      '5-1': { name: '劳动节', color: 'bg-red-500' },
      '5-4': { name: '青年节', color: 'bg-blue-500' },
      '6-1': { name: '儿童节', color: 'bg-pink-400' },
      '7-1': { name: '建党节', color: 'bg-red-600' },
      '8-1': { name: '建军节', color: 'bg-green-700' },
      '9-10': { name: '教师节', color: 'bg-blue-600' },
      '10-1': { name: '国庆', color: 'bg-red-500' },
      '11-11': { name: '双十一', color: 'bg-orange-500' },
      '12-25': { name: '圣诞节', color: 'bg-red-600' },
    };

    const key = `${month}-${day}`;
    if (holidays[key]) return holidays[key];

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { name: dayOfWeek === 0 ? '周日' : '周六', color: 'bg-gray-400' };
    }

    return null;
  };

  // 获取某天的任务详情
  const getTasksForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return tasks.filter(t => {
      if (!t.dueDate || t.isArchived) return false;
      const due = new Date(t.dueDate);
      return due >= dayStart && due <= dayEnd;
    });
  };

  // 渲染日历页面的丰富视图
  const renderCalendarPage = () => (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-4">
      {/* 日历 */}
      <div className="bg-[#f3f3f3] dark:bg-gray-800 p-4">
        {/* 月份导航 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 星期标题 */}
        <div className="grid grid-cols-7 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const taskCount = getTaskCountForDate(day);
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`relative flex flex-col items-center justify-center py-2 rounded-lg transition-all
                           ${!isCurrentMonth ? 'opacity-30' : ''}
                           ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <span className={`text-sm ${isTodayDate && !isSelected ? 'font-bold text-blue-500' : ''}`}>
                  {day.getDate()}
                </span>
                {taskCount > 0 && !isSelected && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-blue-500" />
                    ))}
                  </div>
                )}
                {taskCount > 0 && isSelected && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-white/80" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 选中日期的任务列表 */}
      <div className="px-4 py-4">
        <h3 className="text-base font-medium text-gray-800 dark:text-white mb-3">
          {selectedDateStr} {selectedWeekDay}
        </h3>
        
        {selectedDateTasks.length > 0 ? (
          <div className="space-y-1">
            {selectedDateTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={setEditingTask}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              这天没有任务
            </p>
          </div>
        )}
      </div>
    </div>
  );
  
  // 渲染番茄专注页面的计时器视图
  const renderPomodoroPage = () => (
    <div className="flex-1 flex flex-col items-center justify-center pb-24 md:pb-4 px-4">
      {/* 模式切换 */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => switchMode('work')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                     ${mode === 'work' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          专注
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                     ${mode === 'shortBreak' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          短休息
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                     ${mode === 'longBreak' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          长休息
        </button>
        <button
          onClick={() => setShowCustomModal(true)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                     ${mode === 'custom' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          自定义
        </button>
      </div>
      
      {/* 自定义时间弹窗 */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCustomModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">设置自定义时间</h3>
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => setCustomTime(prev => Math.max(1, prev - 5))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl"
              >
                -
              </button>
              <input
                type="number"
                value={customTime}
                onChange={(e) => setCustomTime(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
                className="w-20 h-12 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white"
                min="1"
                max="180"
              />
              <button
                onClick={() => setCustomTime(prev => Math.min(180, prev + 5))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl"
              >
                +
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">分钟</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
              >
                取消
              </button>
              <button
                onClick={() => {
                  switchMode('custom', customTime);
                  setShowCustomModal(false);
                }}
                className="flex-1 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600"
              >
                开始
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 计时器圆环 */}
      <div className="relative w-64 h-64 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          {/* 背景圆环 */}
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* 进度圆环 */}
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - timeLeft / getTotalTime(mode))}
            className={`transition-all duration-1000 ${getModeColor(mode)}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-6xl font-bold ${getModeColor(mode)}`}>
            {formatTime(timeLeft)}
          </span>
          <span className={`text-sm mt-2 ${getModeColor(mode)}`}>
            {getModeLabel(mode)}
          </span>
        </div>
      </div>
      
      {/* 控制按钮 */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center
                     text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={toggleTimer}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95
                     ${mode === 'work' ? 'bg-red-500 hover:bg-red-600' : 
                       mode === 'shortBreak' ? 'bg-green-500 hover:bg-green-600' :
                       mode === 'custom' ? 'bg-purple-500 hover:bg-purple-600' :
                       'bg-blue-500 hover:bg-blue-600'}`}
        >
          {isRunning ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="w-12 h-12" /> {/* 占位，保持对称 */}
      </div>
      
      {/* 统计信息 */}
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{sessions}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">今日番茄</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{Math.floor(totalMinutes)}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">累计分钟</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{sessions * 25}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">专注分钟</div>
        </div>
      </div>
    </div>
  );
  
  // 渲染设置页面
  const RenderSettingsPage = () => {
    const settingsRaw = useTodoStore((state) => state.settings);
    // 添加默认值回退，防止 localStorage 中没有这些字段
    const settings = {
      ...settingsRaw,
      pomodoroWorkDuration: settingsRaw.pomodoroWorkDuration || 25,
      pomodoroShortBreak: settingsRaw.pomodoroShortBreak || 5,
      pomodoroLongBreak: settingsRaw.pomodoroLongBreak || 15,
      pomodoroSoundEnabled: settingsRaw.pomodoroSoundEnabled ?? true,
    };
    const setTheme = useTodoStore((state) => state.setTheme);
    const toggleNotifications = useTodoStore((state) => state.toggleNotifications);
    const toggleHaptics = useTodoStore((state) => state.toggleHaptics);
    const setPomodoroSettings = useTodoStore((state) => state.setPomodoroSettings);
    const togglePomodoroSound = useTodoStore((state) => state.togglePomodoroSound);
    const exportData = useTodoStore((state) => state.exportData);
    const importData = useTodoStore((state) => state.importData);
    const clearCompletedTasks = useTodoStore((state) => state.clearCompletedTasks);
    const tasks = useTodoStore((state) => state.tasks);

    const totalTasks = tasks.filter(t => !t.isArchived).length;
    const completedTasks = tasks.filter(t => t.status === 'completed' && !t.isArchived).length;
    const activeTasks = totalTasks - completedTasks;
    const recurringTasks = tasks.filter(t => t.isRecurring && !t.isArchived).length;

    // 导出数据
    const handleExport = () => {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // 导入数据
    const handleImport = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (importData(content)) {
              alert('数据导入成功！');
              window.location.reload();
            } else {
              alert('数据导入失败，请检查文件格式！');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    };

    // 清除已完成
    const handleClearCompleted = () => {
      if (completedTasks === 0) {
        alert('没有已完成的任务需要清除');
        return;
      }
      if (confirm(`确定要清除所有 ${completedTasks} 个已完成任务吗？此操作不可恢复！`)) {
        clearCompletedTasks();
        alert('已完成任务已清除');
      }
    };

    // 调整时间
    const [showDurationPicker, setShowDurationPicker] = useState<'work' | 'shortBreak' | 'longBreak' | null>(null);
    const [tempDuration, setTempDuration] = useState(25);

    const openDurationPicker = (type: 'work' | 'shortBreak' | 'longBreak', currentValue: number) => {
      setTempDuration(currentValue);
      setShowDurationPicker(type);
    };

    const saveDuration = (type: 'work' | 'shortBreak' | 'longBreak') => {
      if (type === 'work') {
        setPomodoroSettings({ workDuration: tempDuration });
      } else if (type === 'shortBreak') {
        setPomodoroSettings({ shortBreak: tempDuration });
      } else {
        setPomodoroSettings({ longBreak: tempDuration });
      }
      setShowDurationPicker(null);
    };

    return (
      <div className="flex-1 overflow-y-auto pb-24 md:pb-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-lg mx-auto p-4 space-y-4">
          {/* 用户信息卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                U
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">待办清单用户</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">免费版</p>
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">任务统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeTasks}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">进行中</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">已完成</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalTasks}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">总任务</div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{recurringTasks}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">习惯任务</div>
              </div>
            </div>
          </div>

          {/* 外观设置 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">外观</h3>
            </div>
            <div className="p-2">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <span className="text-lg">🌙</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">深色模式</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">跟随系统</div>
                  </div>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-gray-700 dark:text-gray-300"
                >
                  <option value="system">跟随系统</option>
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                </select>
              </div>
            </div>
          </div>

          {/* 番茄钟设置 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">番茄钟</h3>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => openDurationPicker('work', settings.pomodoroWorkDuration)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <span className="text-lg">🍅</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">专注时长</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">工作专注时间</div>
                  </div>
                </div>
                <span className="text-sm text-blue-500 font-medium">{settings.pomodoroWorkDuration} 分钟</span>
              </button>
              <button
                onClick={() => openDurationPicker('shortBreak', settings.pomodoroShortBreak)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-lg">☕</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">短休息时长</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">工作间休息</div>
                  </div>
                </div>
                <span className="text-sm text-blue-500 font-medium">{settings.pomodoroShortBreak} 分钟</span>
              </button>
              <button
                onClick={() => openDurationPicker('longBreak', settings.pomodoroLongBreak)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-lg">🌴</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">长休息时长</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">周期结束休息</div>
                  </div>
                </div>
                <span className="text-sm text-blue-500 font-medium">{settings.pomodoroLongBreak} 分钟</span>
              </button>
            </div>
          </div>

          {/* 通知与反馈 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">通知与反馈</h3>
            </div>
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-lg">🔔</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">提醒通知</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">任务到期提醒</div>
                  </div>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.enableNotifications ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      settings.enableNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <span className="text-lg">📳</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">振动反馈</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">操作时的触觉反馈</div>
                  </div>
                </div>
                <button
                  onClick={toggleHaptics}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.enableHaptics ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      settings.enableHaptics ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <span className="text-lg">🔊</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">番茄钟提示音</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">专注结束提醒</div>
                  </div>
                </div>
                <button
                  onClick={togglePomodoroSound}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.pomodoroSoundEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      settings.pomodoroSoundEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 数据管理 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">数据管理</h3>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-lg">📤</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">导出数据</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">备份任务列表到文件</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={handleImport}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-lg">📥</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">导入数据</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">从备份文件恢复</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={handleClearCompleted}
                className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-lg">🗑️</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">清除已完成</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">删除所有已完成任务</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 关于 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">关于</h3>
            </div>
            <div className="p-2 space-y-1">
              <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg">ℹ️</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">版本信息</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">v1.0.6</div>
                </div>
              </div>
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">给我们评分</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">喜欢我们的应用？</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg">💬</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">意见反馈</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">帮助我们改进</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-lg">📄</span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">隐私政策</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">了解数据使用</div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 时长选择弹窗 */}
        {showDurationPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDurationPicker(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">设置时长</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setTempDuration(Math.max(1, tempDuration - 5))}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={tempDuration}
                  onChange={(e) => setTempDuration(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                  className="w-20 h-12 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white"
                  min="1"
                  max="120"
                />
                <button
                  onClick={() => setTempDuration(Math.min(120, tempDuration + 5))}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-bold"
                >
                  +
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">分钟</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDurationPicker(null)}
                  className="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => saveDuration(showDurationPicker)}
                  className="flex-1 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNormalPage = () => (
    <div className="flex-1 flex flex-col pb-24 md:pb-4">
      {/* 可滚动的日历区域 */}
      <div className="bg-[#f3f3f3] dark:bg-gray-800 overflow-y-auto max-h-48">
        <div className="px-4 py-3">
          {/* 7天柱状图 */}
          <div className="flex items-end justify-between gap-1 h-24">
            {weekDays.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t transition-all ${day.count > 0 ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`}
                  style={{ height: `${Math.max(day.count / maxCount * 70, day.count > 0 ? 8 : 4)}px` }}
                />
                <div className={`mt-1 flex flex-col items-center ${day.isToday ? 'relative' : ''}`}>
                  <span className={`text-xs ${day.isToday ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {day.day}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {day.weekDay}
                  </span>
                  {day.isToday && (
                    <div className="absolute -bottom-0.5 w-5 h-5 bg-green-500 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* 月份和周导航（可展开更多日历） */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                今天
              </button>
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 全月日历（可折叠/展开） */}
          <div className="mt-2">
            {/* 星期标题 */}
            <div className="grid grid-cols-7 mb-1">
              {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                <div key={day} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 日期网格 */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const taskCount = getTaskCountForDate(day);
                
                return (
                  <div
                    key={index}
                    className={`relative flex flex-col items-center justify-center py-1 text-xs
                               ${!isCurrentMonth ? 'opacity-30' : ''}`}
                  >
                    <span className={`${isTodayDate ? 'w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center font-medium' : ''}`}>
                      {day.getDate()}
                    </span>
                    {taskCount > 0 && (
                      <div className="flex gap-px mt-0.5">
                        {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length > 0 ? (
          <div className="space-y-1 px-4 py-4">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={setEditingTask}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-base font-medium text-gray-500 dark:text-gray-400 mb-1">
              {searchQuery ? '没有找到匹配的任务' : currentListId === 'completed' 
                ? '还没有已完成的任务' 
                : '开始添加任务吧'}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchQuery ? '尝试其他关键词' : currentListId === 'completed' 
                ? '完成任务后会显示在这里' 
                : '点击右下角 + 按钮添加任务'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* 侧边栏 */}
      <div className="hidden md:block">
        <Sidebar currentListId={currentListId} onSelectList={setCurrentListId} />
      </div>
      
      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 relative">
        {/* 顶部灰色背景区域 */}
        <div className="bg-[#f3f3f3] dark:bg-gray-800">
          {/* 标题栏 */}
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentList?.icon || '📋'}</span>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{currentList?.name || '清单'}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isPomodoroPage 
                    ? sessions > 0 ? `${sessions} 个番茄完成` : '开始你的专注'
                    : isCalendarPage ? `${getTasksForDate(selectedDate).length} 个任务` : `${currentTasks.length} 个任务`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 搜索框 */}
          {showSearch && !isCalendarPage && !isPomodoroPage && (
            <div className="px-4 pb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
                           rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}
        </div>
        
        {/* 移动端底部导航 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
          <div className="flex justify-around py-2">
            <button
              onClick={() => setCurrentListId('calendar')}
              className={`flex flex-col items-center py-1 px-2 transition-colors touch-optimize
                         ${currentListId === 'calendar' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className="text-lg">📅</span>
              <span className="text-[10px] mt-0.5">日历</span>
            </button>
            
            <button
              onClick={() => setCurrentListId('all')}
              className={`flex flex-col items-center py-1 px-2 transition-colors touch-optimize
                         ${currentListId === 'all' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className="text-lg">📋</span>
              <span className="text-[10px] mt-0.5">清单</span>
            </button>
            
            <button
              onClick={() => setCurrentListId('pomodoro')}
              className={`flex flex-col items-center py-1 px-2 transition-colors touch-optimize
                         ${currentListId === 'pomodoro' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className="text-lg">🍅</span>
              <span className="text-[10px] mt-0.5">番茄</span>
            </button>
            
            <button
              onClick={() => setCurrentListId('settings')}
              className={`flex flex-col items-center py-1 px-2 transition-colors touch-optimize
                         ${currentListId === 'settings' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <span className="text-lg">⚙️</span>
              <span className="text-[10px] mt-0.5">设置</span>
            </button>
          </div>
        </nav>
        
        {/* 内容区域 */}
        {isPomodoroPage ? renderPomodoroPage() :
         isCalendarPage ? renderCalendarPage() :
         isSettingsPage ? <RenderSettingsPage /> :
         renderNormalPage()}
        
        {/* 右下角添加按钮 - 不显示在番茄页面 */}
        {!isPomodoroPage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg 
                       flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-30"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        
        {/* 添加任务弹窗 */}
        {showAddModal && (
          <AddTaskModal onClose={() => setShowAddModal(false)} />
        )}
      </main>
      
      {/* 编辑任务弹窗 */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      
      {/* 未完成任务转移弹窗 */}
      {pendingTransferTasks.length > 0 && (
        <TransferTasksModal
          tasks={pendingTransferTasks}
          onConfirm={confirmTransferTasks}
          onDismiss={dismissTransferTasks}
        />
      )}
    </div>
  );
}
