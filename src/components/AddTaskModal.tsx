'use client';

import React, { useState } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { Priority, Workload, priorityConfig, workloadConfig } from '@/types/todo';
import { format, addDays } from 'date-fns';

interface AddTaskModalProps {
  onClose: () => void;
}

export function AddTaskModal({ onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [workload, setWorkload] = useState<Workload>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  
  const addTask = useTodoStore((state) => state.addTask);
  
  const handleSubmit = () => {
    if (!title.trim()) return;
    
    addTask(
      title.trim(), 
      undefined, 
      priority, 
      workload, 
      dueDate || undefined, 
      dueTime || undefined
    );
    
    onClose();
  };
  
  const quickDates = [
    { label: '今天', date: format(new Date(), 'yyyy-MM-dd') },
    { label: '明天', date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: '本周', date: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">新建任务</h2>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            添加
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 任务标题 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="任务标题..."
            autoFocus
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                       rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
          
          {/* 截止日期快捷选项 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">截止日期</label>
            <div className="flex gap-2 mb-2">
              {quickDates.map((qd) => (
                <button
                  key={qd.label}
                  onClick={() => setDueDate(qd.date)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors
                             ${dueDate === qd.date 
                               ? 'bg-blue-500 text-white' 
                               : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  {qd.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                           rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-28 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                           rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          {/* 优先级 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">优先级</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm
                             ${priority === p 
                               ? 'bg-blue-500 text-white' 
                               : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  <span>{priorityConfig[p].icon}</span>
                  <span>{priorityConfig[p].label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 工作量 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">工作量</label>
            <div className="flex gap-2">
              {(['quick', 'medium', 'long'] as Workload[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWorkload(w)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm
                             ${workload === w 
                               ? 'bg-blue-500 text-white' 
                               : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  <span>{workloadConfig[w].icon}</span>
                  <span>{workloadConfig[w].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
