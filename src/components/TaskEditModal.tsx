'use client';

import React, { useState } from 'react';
import { Task, Priority } from '@/types/todo';
import { useTodoStore } from '@/store/todoStore';
import { priorityConfig } from '@/types/todo';
import { format, addDays } from 'date-fns';

interface TaskEditModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskEditModal({ task, isOpen, onClose }: TaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [dueTime, setDueTime] = useState(task.dueTime || '');
  const [tags, setTags] = useState(task.tags.join(', '));
  
  const updateTask = useTodoStore((state) => state.updateTask);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    if (!title.trim()) return;
    
    updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    
    onClose();
  };
  
  const priorities: Priority[] = ['high', 'medium', 'low'];
  
  const quickDates = [
    { label: '今天', date: format(new Date(), 'yyyy-MM-dd') },
    { label: '明天', date: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: '本周', date: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">编辑任务</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* 标题 */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="任务名称"
            />
          </div>
          
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
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {dueDate && (
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                           rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            )}
          </div>
          
          {/* 优先级 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">优先级</label>
            <div className="flex gap-2">
              {priorities.map((p) => (
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
          
          {/* 描述 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">备注</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="添加备注..."
            />
          </div>
        </div>
        
        {/* 底部 */}
        <div className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 
                       dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 
                       text-white rounded-lg font-medium transition-colors text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
