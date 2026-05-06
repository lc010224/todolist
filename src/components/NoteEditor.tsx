'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { Note, NoteType } from '@/types/todo';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const { notes, updateNote, deleteNote, toggleNotePin, toggleNoteFavorite, addNote, convertNoteType } = useTodoStore();
  const note = notes.find(n => n.id === noteId);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteType>('normal');
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setType(note.type);
    }
  }, [note]);
  
  useEffect(() => {
    if (noteId) {
      const timeout = setTimeout(() => {
        if (title.trim() || content.trim()) {
          updateNote(noteId, { title, content });
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [title, content, noteId, updateNote]);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleTypeChange = (newType: NoteType) => {
    if (noteId) {
      convertNoteType(noteId, newType);
      setType(newType);
    }
  };
  
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    
    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };
  
  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 underline" target="_blank">$1</a>')
      .replace(/^[-*] (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-600 dark:text-gray-400 my-2">$1</blockquote>')
      .replace(/---/g, '<hr class="my-4 border-gray-300 dark:border-gray-600" />')
      .replace(/\n/g, '<br />');
    return html;
  };
  
  const handleExport = (format: 'txt' | 'md' | 'json') => {
    let filename: string;
    let mimeType: string;
    let exportContent: string;
    
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
    
    switch (format) {
      case 'txt':
        exportContent = `${title}\n\n${content}`;
        filename = `${safeTitle}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        exportContent = `# ${title}\n\n${content}`;
        filename = `${safeTitle}.md`;
        mimeType = 'text/markdown';
        break;
      case 'json':
        exportContent = JSON.stringify({ title, content, type, createdAt: note?.createdAt, updatedAt: note?.updatedAt }, null, 2);
        filename = `${safeTitle}.json`;
        mimeType = 'application/json';
        break;
    }
    
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };
  
  const handleDelete = () => {
    if (noteId) {
      deleteNote(noteId);
      onClose();
    }
  };
  
  if (!noteId || !note) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="无标题"
              className="text-lg font-medium bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder-gray-400 w-64"
            />
            <span className={`text-xs px-2 py-0.5 rounded ${type === 'markdown' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
              {type === 'markdown' ? 'MD' : '普通'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleNotePin(noteId)}
              className={`p-2 rounded-lg transition-colors ${note.isPinned ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="置顶"
            >
              📌
            </button>
            <button
              onClick={() => toggleNoteFavorite(noteId)}
              className={`p-2 rounded-lg transition-colors ${note.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="收藏"
            >
              {note.isFavorite ? '❤️' : '🤍'}
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ⋮
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[160px] z-10">
                  <button
                    onClick={() => { handleTypeChange(type === 'normal' ? 'markdown' : 'normal'); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {type === 'normal' ? '📝 转为 Markdown' : '📄 转为普通笔记'}
                  </button>
                  <button
                    onClick={() => { setShowExportModal(true); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    📤 导出
                  </button>
                  <hr className="my-1 border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    🗑️ 删除
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Markdown 工具栏 */}
        {type === 'markdown' && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            <button onClick={() => insertMarkdown('# ', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-sm">H1</button>
            <button onClick={() => insertMarkdown('## ', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-xs">H2</button>
            <button onClick={() => insertMarkdown('### ', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold text-xs">H3</button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
            <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold">B</button>
            <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 italic">I</button>
            <button onClick={() => insertMarkdown('`', '`')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-mono text-sm">Code</button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
            <button onClick={() => insertMarkdown('- ', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">•</button>
            <button onClick={() => insertMarkdown('1. ', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">1.</button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
            <button onClick={() => insertMarkdown('> ', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">❝</button>
            <button onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Link</button>
            <button onClick={() => insertMarkdown('---', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs">—</button>
            <div className="flex-1" />
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1 rounded text-xs font-medium ${showPreview ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              {showPreview ? '编辑' : '预览'}
            </button>
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {showPreview && type === 'markdown' ? (
            <div className="h-full p-4 overflow-y-auto prose dark:prose-invert max-w-none">
              <h1 className="text-2xl font-bold mb-4">{title || '无标题'}</h1>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={type === 'markdown' ? '使用 Markdown 编写...\n\n# 标题\n## 二级标题\n**粗体** *斜体*\n- 列表项\n> 引用' : '开始书写...'}
              className="w-full h-full p-4 resize-none bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
              style={{ minHeight: '300px' }}
            />
          )}
        </div>
        
        {/* 底部状态栏 */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <div>
            {note.wordCount} 字 · {content.split('\n').length} 行
          </div>
          <div>
            编辑于 {format(new Date(note.updatedAt), 'M月d日 HH:mm', { locale: zhCN })}
          </div>
        </div>
      </div>
      
      {/* 导出弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setShowExportModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">导出笔记</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('txt')}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                📄 导出为 TXT
              </button>
              <button
                onClick={() => handleExport('md')}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                📝 导出为 Markdown
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                📋 导出为 JSON
              </button>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
      
      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-center">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              确定要删除这篇笔记吗？此操作无法撤销。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
