'use client';

import React, { useState } from 'react';
import { Task } from '@/types/todo';
import { useTodoStore } from '@/store/todoStore';
import { workloadConfig } from '@/types/todo';
import { format, isToday, isTomorrow, isPast, parseISO, isThisWeek } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSubTasks, setShowSubTasks] = useState(false);
  const [newSubTask, setNewSubTask] = useState('');
  
  const toggleTaskComplete = useTodoStore((state) => state.toggleTaskComplete);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  const addSubTask = useTodoStore((state) => state.addSubTask);
  const toggleSubTask = useTodoStore((state) => state.toggleSubTask);
  const deleteSubTask = useTodoStore((state) => state.deleteSubTask);
  
  const isCompleted = task.status === 'completed';
  
  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    const date = parseISO(task.dueDate);
    if (isToday(date)) return { text: '今天', color: 'text-orange-500' };
    if (isTomorrow(date)) return { text: '明天', color: 'text-blue-500' };
    if (isPast(date) && !isCompleted) return { text: '已逾期', color: 'text-red-500 font-medium' };
    if (isThisWeek(date)) return { text: format(date, 'EEEE'), color: 'text-gray-500' };
    return { text: format(date, 'M月d日'), color: 'text-gray-500' };
  };
  
  const dueDateDisplay = getDueDateDisplay();
  const workloadInfo = task.workload ? workloadConfig[task.workload] : null;
  const completedSubTasks = task.subTasks.filter((st) => st.completed).length;
  const totalSubTasks = task.subTasks.length;
  
  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTask.trim()) return;
    addSubTask(task.id, newSubTask.trim());
    setNewSubTask('');
  };
  
  const cyclePriority = () => {
    const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
    const currentIndex = priorities.indexOf(task.priority);
    const nextPriority = priorities[(currentIndex + 1) % 3];
    updateTask(task.id, { priority: nextPriority });
  };
  
  return (
    <div className="group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-lg">
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* 圆形复选框 */}
        <button
          onClick={() => toggleTaskComplete(task.id)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                     ${isCompleted 
                       ? 'bg-blue-500 border-blue-500' 
                       : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
        >
          {isCompleted && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        
        {/* 任务内容 */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onEdit?.(task)}
        >
          <div className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
            {task.title}
          </div>
          
          {/* 标签行 */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* 日期 */}
            {dueDateDisplay && (
              <div className={`flex items-center gap-1 text-xs ${dueDateDisplay.color}`}>
                <span className="w-1 h-1 rounded-full bg-current"></span>
                <span>{dueDateDisplay.text}</span>
              </div>
            )}
            
            {/* 工作量 */}
            {workloadInfo && (
              <div className={`flex items-center gap-1 text-xs ${workloadInfo.color}`}>
                <span>{workloadInfo.icon}</span>
                <span>{workloadInfo.label}</span>
              </div>
            )}
            
            {/* 子任务 */}
            {totalSubTasks > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>📋</span>
                <span>{completedSubTasks}/{totalSubTasks}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 优先级旗子 */}
        <button
          onClick={(e) => { e.stopPropagation(); cyclePriority(); }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <span className="text-base">
            {task.priority === 'high' ? '🚩' : task.priority === 'medium' ? '🏁' : '⚪'}
          </span>
        </button>
        
        {/* 更多按钮 */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(task); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  编辑
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSubTasks(!showSubTasks); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  添加步骤
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  删除
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 子任务区域 */}
      {(showSubTasks || totalSubTasks > 0) && (
        <div className="px-3 pb-2 border-t border-gray-100 dark:border-gray-700 pt-2 ml-4">
          {task.subTasks.map((subTask) => (
            <div key={subTask.id} className="flex items-center gap-2 py-1 group/sub">
              <button
                onClick={() => toggleSubTask(task.id, subTask.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0
                           ${subTask.completed 
                             ? 'bg-blue-500 border-blue-500' 
                             : 'border-gray-300 dark:border-gray-600'}`}
              >
                {subTask.completed && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={`text-xs flex-1 ${subTask.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {subTask.title}
              </span>
              <button
                onClick={() => deleteSubTask(task.id, subTask.id)}
                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/sub:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {showSubTasks && (
            <form onSubmit={handleAddSubTask} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                placeholder="添加步骤..."
                className="flex-1 px-2 py-1 text-xs bg-transparent border-b border-gray-200 dark:border-gray-700 
                           focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newSubTask.trim()}
                className="text-xs text-blue-500 disabled:text-gray-300"
              >
                添加
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
