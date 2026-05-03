'use client';

import React from 'react';
import { useTodoStore } from '@/store/todoStore';
import { Task } from '@/types/todo';

interface TransferTasksModalProps {
  tasks: Task[];
  onConfirm: () => void;
  onDismiss: () => void;
}

export function TransferTasksModal({ tasks, onConfirm, onDismiss }: TransferTasksModalProps) {
  if (tasks.length === 0) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white text-center">
            📋 发现未完成任务
          </h2>
        </div>
        
        {/* 内容 */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
            以下任务昨天未完成，是否转移到今天？
          </p>
          
          <div className="space-y-2">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <span className="text-red-500 text-lg">✕</span>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* 按钮 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            忽略
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            转移到今天
          </button>
        </div>
      </div>
    </div>
  );
}
