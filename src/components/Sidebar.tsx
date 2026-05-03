'use client';

import React from 'react';
import { useTodoStore } from '@/store/todoStore';

interface SidebarProps {
  currentListId: string;
  onSelectList: (listId: string) => void;
}

export function Sidebar({ currentListId, onSelectList }: SidebarProps) {
  const lists = useTodoStore((state) => state.lists);
  const tasks = useTodoStore((state) => state.tasks);
  const addList = useTodoStore((state) => state.addList);
  
  const [showAddList, setShowAddList] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  
  const getTaskCount = (listId: string) => {
    switch (listId) {
      case 'all':
        return tasks.filter((t) => t.status === 'active' && !t.isArchived).length;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tasks.filter((t) => {
          if (t.status !== 'active' || t.isArchived) return false;
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due >= today && due < tomorrow;
        }).length;
      case 'upcoming':
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return tasks.filter((t) => {
          if (t.status !== 'active' || t.isArchived) return false;
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due >= weekStart && due <= weekEnd;
        }).length;
      case 'important':
        return tasks.filter((t) => t.priority === 'high' && t.status === 'active' && !t.isArchived).length;
      case 'completed':
        return tasks.filter((t) => t.status === 'completed' && !t.isArchived).length;
      default:
        return tasks.filter((t) => t.listId === listId && !t.isArchived).length;
    }
  };
  
  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    addList(newListName.trim(), '📁', '#0078d4');
    setNewListName('');
    setShowAddList(false);
  };
  
  const defaultLists = lists.filter(l => l.isDefault);
  const customLists = lists.filter(l => !l.isDefault);
  
  // 检查是否有已完成的任务
  const hasCompletedTasks = tasks.some(t => t.status === 'completed' && !t.isArchived);
  
  // 检查自定义列表中是否有任务（包含未完成和已完成）
  const customListsWithTasks = customLists.map(list => ({
    ...list,
    totalCount: tasks.filter((t) => t.listId === list.id && !t.isArchived).length,
    completedCount: tasks.filter((t) => t.listId === list.id && t.status === 'completed' && !t.isArchived).length,
  }));
  
  return (
    <div className="w-full md:w-64 h-full bg-[#f3f3f3] dark:bg-gray-900 flex flex-col">
      {/* 头部 */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          <h1 className="text-base font-semibold text-gray-800 dark:text-white">待办清单</h1>
        </div>
        <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      </div>
      
      {/* 清单标题 */}
      <div className="px-4 py-2">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          清单
        </h2>
      </div>
      
      {/* 清单列表 */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-0.5">
          {defaultLists.map((list) => {
            const count = getTaskCount(list.id);
            const isActive = currentListId === list.id;
            
            return (
              <button
                key={list.id}
                onClick={() => onSelectList(list.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors touch-optimize text-left
                           ${isActive 
                             ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-medium' 
                             : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
              >
                <span className="text-base">{list.icon}</span>
                <span className="flex-1 text-sm">{list.name}</span>
                {count > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* 自定义清单 */}
        <div className="space-y-0.5 mt-2">
          {customListsWithTasks.map((list) => {
            const isActive = currentListId === list.id;
            const showCompleted = list.completedCount > 0;
            
            return (
              <div key={list.id}>
                {/* 主清单（未完成任务） */}
                <button
                  onClick={() => onSelectList(list.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors touch-optimize text-left
                             ${isActive 
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-medium' 
                               : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                >
                  <span className="text-base">{list.icon}</span>
                  <span className="flex-1 text-sm">{list.name}</span>
                  {(list.totalCount - list.completedCount) > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{list.totalCount - list.completedCount}</span>
                  )}
                </button>
                
                {/* 已完成子项 */}
                {showCompleted && (
                  <button
                    onClick={() => onSelectList(list.id)}
                    className={`w-full flex items-center gap-3 px-3 py-1.5 ml-4 rounded-lg transition-colors touch-optimize text-left
                               ${isActive 
                                 ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-medium' 
                                 : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                  >
                    <span className="text-base">✓</span>
                    <span className="flex-1 text-sm">已完成</span>
                    <span className="text-xs">{list.completedCount}</span>
                  </button>
                )}
              </div>
            );
          })}
          
          {/* 添加清单 */}
          {showAddList ? (
            <form onSubmit={handleAddList} className="px-3 py-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="清单名称"
                autoFocus
                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                           rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  添加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddList(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddList(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 
                         hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-base">➕</span>
              <span className="text-sm">新建清单</span>
            </button>
          )}
        </div>
      </div>
      
      {/* 底部用户区 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-white">用户</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">免费版</p>
          </div>
        </div>
      </div>
    </div>
  );
}
