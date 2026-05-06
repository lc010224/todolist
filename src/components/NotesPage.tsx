'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { Note, NoteType } from '@/types/todo';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 获取预览文本
const getPreview = (content: string, maxLength: number = 60) => {
  const lines = content.split('\n').filter(l => l.trim());
  const firstLine = lines[0] || '';
  return firstLine.length > maxLength ? firstLine.substring(0, maxLength) + '...' : firstLine;
};

type SortType = 'updated' | 'created' | 'title';
type FilterType = 'all' | 'normal' | 'markdown' | 'pinned' | 'favorite';

export function NotesPage() {
  const { notes, noteFolders, addNote, addNoteFolder, updateNoteFolder, deleteNoteFolder, updateNote, deleteNote, toggleNotePin, toggleNoteFavorite, searchNotes, convertNoteType } = useTodoStore();
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('updated');
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);
  const [shouldFocusTitle, setShouldFocusTitle] = useState(false);
  const [externalNoteId, setExternalNoteId] = useState<string | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);
  
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const selectedNote = notes.find(n => n.id === selectedNoteId);
  
  // 监听笔记数量变化
  useEffect(() => {
    const latestNote = notes[0];
    if (latestNote && latestNote.id !== lastCreatedNoteId && notes.length > 0) {
      const now = Date.now();
      const noteTime = new Date(latestNote.updatedAt).getTime();
      if (now - noteTime < 2000) {
        setSelectedNoteId(latestNote.id);
        setLastCreatedNoteId(latestNote.id);
        setShouldFocusTitle(true);
      }
    }
  }, [notes.length]);
  
  // 新建笔记后自动聚焦标题输入框
  useEffect(() => {
    if (shouldFocusTitle && selectedNoteId) {
      setTimeout(() => {
        titleInputRef.current?.focus();
        setShouldFocusTitle(false);
      }, 100);
    }
  }, [shouldFocusTitle, selectedNoteId]);
  
  // 监听外部创建的笔记事件
  useEffect(() => {
    const handleSelectNote = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setSelectedNoteId(customEvent.detail);
        setShouldFocusTitle(true);
        setIsNewNote(true);
      }
    };
    window.addEventListener('selectNote', handleSelectNote);
    return () => window.removeEventListener('selectNote', handleSelectNote);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const filteredNotes = searchQuery
    ? searchNotes(searchQuery)
    : notes;
  
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    switch (sortBy) {
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title, 'zh-CN');
      default:
        return 0;
    }
  }).filter(note => {
    switch (filterBy) {
      case 'normal':
        return note.type === 'normal';
      case 'markdown':
        return note.type === 'markdown';
      case 'pinned':
        return note.isPinned;
      case 'favorite':
        return note.isFavorite;
      default:
        return true;
    }
  });
  
  // 处理返回列表
  const handleBackToList = () => {
    const currentNoteId = selectedNoteId;
    const shouldDelete = isNewNote;
    
    // 先清空选中状态
    setSelectedNoteId(null);
    
    // 如果是新笔记，延迟检查并删除空笔记
    if (shouldDelete) {
    if (shouldDelete && currentNoteId) {
      // 使用回调获取最新的笔记数据
      setTimeout(() => {
        const noteToCheck = useTodoStore.getState().notes.find(n => n.id === currentNoteId);
        if (noteToCheck) {
          const isEmpty = !noteToCheck.title.trim() && !noteToCheck.content.trim();
          if (isEmpty) {
            useTodoStore.getState().deleteNote(currentNoteId);
          }
        }
        setIsNewNote(false);
      }, 50);
    }
    }
  };

  // 保存笔记
  const handleSave = useCallback(() => {
    if (selectedNoteId && hasUnsavedChanges) {
      // 触发自动保存
      setHasUnsavedChanges(false);
    }
    // 保存后返回列表
    handleBackToList();
  }, [selectedNoteId, hasUnsavedChanges]);
  
  const handleTitleChange = (value: string) => {
    if (selectedNoteId) {
      updateNote(selectedNoteId, { title: value });
      setHasUnsavedChanges(true);
    }
  };
  
  const handleContentChange = (value: string) => {
    if (selectedNoteId) {
      updateNote(selectedNoteId, { content: value });
      setHasUnsavedChanges(true);
    }
  };
  
  const handleDelete = () => {
    if (selectedNoteId) {
      deleteNote(selectedNoteId);
      setSelectedNoteId(null);
      setShowDeleteConfirm(false);
      setIsNewNote(false);
    }
  };
  
  const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedNoteId) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = selectedNote?.content || '';
    const selectedText = currentContent.substring(start, end);
    const insertText = selectedText || placeholder;
    const newText = currentContent.substring(0, start) + prefix + insertText + suffix + currentContent.substring(end);

    handleContentChange(newText);
    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      const newEnd = newStart + insertText.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedNoteId) return;

    const start = textarea.selectionStart;
    const currentContent = selectedNote?.content || '';

    // 找到当前行的开始
    let lineStart = start;
    while (lineStart > 0 && currentContent[lineStart - 1] !== '\n') {
      lineStart--;
    }

    const newText = currentContent.substring(0, lineStart) + prefix + currentContent.substring(lineStart);
    handleContentChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedNoteId) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = selectedNote?.content || '';
    const selectedText = currentContent.substring(start, end) || '代码';
    const newText = currentContent.substring(0, start) + '```\n' + selectedText + '\n```' + currentContent.substring(end);

    handleContentChange(newText);
    setTimeout(() => {
      textarea.focus();
      const codeStart = start + 4;
      const codeEnd = codeStart + selectedText.length;
      textarea.setSelectionRange(codeStart, codeEnd);
    }, 0);
  };

  const insertTable = () => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedNoteId) return;

    const start = textarea.selectionStart;
    const currentContent = selectedNote?.content || '';
    const table = '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n';
    const newText = currentContent.substring(0, start) + table + currentContent.substring(start);

    handleContentChange(newText);
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const insertHorizontalRule = () => {
    const textarea = textareaRef.current;
    if (!textarea || !selectedNoteId) return;

    const start = textarea.selectionStart;
    const currentContent = selectedNote?.content || '';
    const newText = currentContent.substring(0, start) + '\n---\n' + currentContent.substring(start);

    handleContentChange(newText);
    setTimeout(() => {
      textarea.focus();
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
  
  const handleExport = (exportFormat: 'txt' | 'md' | 'json') => {
    if (!selectedNote) return;
    
    let content: string;
    let filename: string;
    let mimeType: string;
    
    const safeTitle = selectedNote.title.replace(/[/\\?%*:|"<>]/g, '-');
    
    switch (exportFormat) {
      case 'txt':
        content = `${selectedNote.title}\n\n${selectedNote.content}`;
        filename = `${safeTitle}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        content = `# ${selectedNote.title}\n\n${selectedNote.content}`;
        filename = `${safeTitle}.md`;
        mimeType = 'text/markdown';
        break;
      case 'json':
        content = JSON.stringify({ title: selectedNote.title, content: selectedNote.content, type: selectedNote.type, createdAt: selectedNote.createdAt, updatedAt: selectedNote.updatedAt }, null, 2);
        filename = `${safeTitle}.json`;
        mimeType = 'application/json';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };
  
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addNoteFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };
  
  const sortLabels: Record<SortType, string> = {
    updated: '最近编辑',
    created: '创建时间',
    title: '标题',
  };
  
  const filterLabels: Record<FilterType, string> = {
    all: '全部',
    normal: '普通',
    markdown: 'Markdown',
    pinned: '已置顶',
    favorite: '已收藏',
  };
  
  // 笔记列表视图
  const renderListView = () => (
    <>
      {/* 顶部操作栏 */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索笔记..."
              className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              📊
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[120px] z-10">
                {(Object.keys(sortLabels) as SortType[]).map(key => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${sortBy === key ? 'text-purple-500' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    {sortLabels[key]}
                    {sortBy === key && '✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              🔽
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[120px] z-10">
                {(Object.keys(filterLabels) as FilterType[]).map(key => (
                  <button
                    key={key}
                    onClick={() => { setFilterBy(key); setShowFilterMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${filterBy === key ? 'text-purple-500' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                  >
                    {filterLabels[key]}
                    {filterBy === key && '✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {noteFolders.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">文件夹</span>
              <button
                onClick={() => setShowFolderModal(true)}
                className="text-xs text-purple-500 hover:text-purple-600"
              >
                + 新建
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {sortedNotes.length > 0 ? (
            sortedNotes.map(note => (
              <NoteSwipeCard
                key={note.id}
                note={note}
                onClick={() => { setSelectedNoteId(note.id); setIsNewNote(false); }}
                onDelete={() => { setSelectedNoteId(note.id); setShowDeleteConfirm(true); }}
                onTogglePin={() => toggleNotePin(note.id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {searchQuery ? '没有找到相关笔记' : '还没有笔记'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {searchQuery ? '尝试其他关键词' : '点击右下角按钮创建笔记'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
  
  // 编辑器视图
  const renderEditorView = () => (
    <div className="flex flex-col h-full">
      {/* 编辑器顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackToList}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            ←
          </button>
          <span className={`text-xs px-2 py-0.5 rounded ${selectedNote?.type === 'markdown' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {selectedNote?.type === 'markdown' ? 'Markdown' : '普通'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-orange-500">未保存</span>
          )}
          <button
            onClick={handleSave}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasUnsavedChanges ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            disabled={!hasUnsavedChanges}
          >
            保存
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 min-w-[160px] z-10">
                <button
                  onClick={() => { toggleNotePin(selectedNoteId!); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {selectedNote?.isPinned ? '📌 取消置顶' : '📌 置顶'}
                </button>
                <button
                  onClick={() => { toggleNoteFavorite(selectedNoteId!); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {selectedNote?.isFavorite ? '❤️ 取消收藏' : '🤍 收藏'}
                </button>
                <button
                  onClick={() => { convertNoteType(selectedNoteId!, selectedNote?.type === 'normal' ? 'markdown' : 'normal'); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {selectedNote?.type === 'normal' ? '📝 转为 Markdown' : '📄 转为普通笔记'}
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
        </div>
      </div>
      
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <input
          ref={titleInputRef}
          type="text"
          value={selectedNote?.title || ''}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="无标题"
          className="w-full text-lg font-medium bg-transparent border-none outline-none text-gray-800 dark:text-white placeholder-gray-400"
        />
      </div>
      
      {/* Markdown 工具栏 */}
      {selectedNote?.type === 'markdown' && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          {/* 标题 */}
          <button onClick={() => insertMarkdown('# ', '', '标题')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-sm" title="一级标题">H1</button>
          <button onClick={() => insertMarkdown('## ', '', '标题')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-xs" title="二级标题">H2</button>
          <button onClick={() => insertMarkdown('### ', '', '标题')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-xs" title="三级标题">H3</button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

          {/* 文本格式 */}
          <button onClick={() => insertMarkdown('**', '**', '粗体')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold" title="粗体">B</button>
          <button onClick={() => insertMarkdown('*', '*', '斜体')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 italic" title="斜体">I</button>
          <button onClick={() => insertMarkdown('~~', '~~', '删除线')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 line-through" title="删除线">S</button>
          <button onClick={() => insertMarkdown('`', '`', '行内代码')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-mono text-xs" title="行内代码">`</button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

          {/* 列表 */}
          <button onClick={() => insertMarkdown('- ', '', '列表项')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="无序列表">•</button>
          <button onClick={() => insertMarkdown('1. ', '', '列表项')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="有序列表">1.</button>
          <button onClick={() => insertMarkdown('- [ ] ', '', '待办事项')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="待办事项">☐</button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

          {/* 特殊格式 */}
          <button onClick={() => insertMarkdown('> ', '', '引用')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm" title="引用">❝</button>
          <button onClick={() => insertMarkdown('`', '`', '行内代码')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="行内代码">Code</button>
          <button onClick={insertCodeBlock} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="代码块">{ }</button>
          <button onClick={() => insertMarkdown('---', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="分割线">—</button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

          {/* 链接与图片 */}
          <button onClick={() => insertMarkdown('[', '](url)', '链接文字')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="链接">🔗</button>
          <button onClick={() => insertMarkdown('![', '](image-url)', '图片描述')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="图片">🖼</button>
          <button onClick={insertTable} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="表格">📊</button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

          {/* 脚注与高亮 */}
          <button onClick={() => insertMarkdown('[^', ']', '脚注')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="脚注">ⁿ</button>
          <button onClick={() => insertMarkdown('==', '==', '高亮')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="高亮">▮</button>
          <button onClick={() => insertMarkdown('<kbd>', '</kbd>', '按键')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="键盘按键">⌨</button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />

          {/* HTML实体 */}
          <button onClick={() => insertMarkdown('&nbsp;', '', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="空格">␣</button>
          <button onClick={() => insertMarkdown('&copy;', '', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="版权符号">©</button>
          <button onClick={() => insertMarkdown('&trade;', '', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="商标符号">™</button>
          <button onClick={() => insertMarkdown('&reg;', '', '')} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs" title="注册商标">®</button>

          <div className="flex-1" />

          {/* 预览切换 */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 rounded text-xs font-medium ${showPreview ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            {showPreview ? '编辑' : '预览'}
          </button>
        </div>
      )}
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {showPreview && selectedNote?.type === 'markdown' ? (
          <div className="h-full p-4 overflow-y-auto prose dark:prose-invert max-w-none">
            <h1 className="text-2xl font-bold mb-4">{selectedNote.title || '无标题'}</h1>
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.content) }} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={selectedNote?.content || ''}
            onChange={e => handleContentChange(e.target.value)}
            placeholder={selectedNote?.type === 'markdown' ? '使用 Markdown 编写...\n\n# 标题\n## 二级标题\n**粗体** *斜体*\n- 列表项\n> 引用' : '开始书写...'}
            className="w-full h-full p-4 resize-none bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
            style={{ minHeight: '300px' }}
          />
        )}
      </div>
      
      {/* 底部状态栏 */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
        <div>
          {selectedNote?.wordCount || 0} 字 · {(selectedNote?.content || '').split('\n').length} 行
        </div>
        <div>
          编辑于 {selectedNote ? format(new Date(selectedNote.updatedAt), 'M月d日 HH:mm', { locale: zhCN }) : ''}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      {selectedNoteId ? renderEditorView() : renderListView()}
      
      {/* 新建文件夹弹窗 */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFolderModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">新建文件夹</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              placeholder="文件夹名称"
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowFolderModal(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 导出弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
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
};

// 滑动卡片组件
interface NoteSwipeCardProps {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

const NoteSwipeCard = ({ note, onClick, onDelete, onTogglePin }: NoteSwipeCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    // 只允许向左滑动
    if (diff < 0) {
      setTranslateX(Math.max(diff, -120));
    } else {
      setTranslateX(Math.min(diff, 0));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-100);
    } else {
      setTranslateX(0);
    }
  };

  const handleClose = () => {
    setTranslateX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* 滑动操作按钮 */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={() => { onTogglePin(); handleClose(); }}
          className={`h-full px-4 flex flex-col items-center justify-center text-white ${note.isPinned ? 'bg-yellow-500' : 'bg-blue-500'}`}
        >
          <span className="text-lg">📌</span>
          <span className="text-xs mt-1">{note.isPinned ? '取消置顶' : '置顶'}</span>
        </button>
        <button
          onClick={() => { onDelete(); handleClose(); }}
          className="h-full px-4 flex flex-col items-center justify-center text-white bg-red-500"
        >
          <span className="text-lg">🗑️</span>
          <span className="text-xs mt-1">删除</span>
        </button>
      </div>

      {/* 卡片主体 */}
      <div
        ref={cardRef}
        onClick={() => {
          if (translateX < -10) {
            handleClose();
          } else {
            onClick();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${translateX}px)` }}
        className="relative p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm cursor-pointer transition-colors border border-gray-100 dark:border-gray-700 select-none"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {note.isPinned && <span className="text-yellow-500">📌</span>}
              <h3 className="font-medium text-gray-800 dark:text-white truncate">
                {note.title || '无标题'}
              </h3>
              <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${note.type === 'markdown' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {note.type === 'markdown' ? 'MD' : 'TXT'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
              {getPreview(note.content) || '暂无内容'}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{format(new Date(note.updatedAt), 'M月d日 HH:mm', { locale: zhCN })}</span>
              <span>{note.wordCount} 字</span>
              {note.isFavorite && <span>❤️</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;