/**
 * Notes Toolbar Component - Simplified
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import { ViewMode, NoteSort } from '@/types/notes';
import './NotesToolbar.css';

interface NotesToolbarProps {
  viewMode: ViewMode;
  sort: NoteSort;
  showSidebar: boolean;
  showStats: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (field: NoteSort['field']) => void;
  onToggleSidebar: () => void;
  onToggleStats: () => void;
  onCreateNote: () => void;
  onCreateTask: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: (search: string) => void;
}

export const NotesToolbar: React.FC<NotesToolbarProps> = ({
  viewMode,
  onViewModeChange,
  onToggleSidebar,
  onToggleStats,
  onCreateNote,
  onCreateTask,
  onSearch
}) => {
  return (
    <div className="notes-toolbar">
      <div className="toolbar-left">
        <button onClick={onToggleSidebar} className="toolbar-btn">☰</button>
        <input
          type="search"
          placeholder="Search notes..."
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="toolbar-center">
        <button onClick={() => onViewModeChange('list')} className={viewMode === 'list' ? 'active' : ''}>
          ☰ List
        </button>
        <button onClick={() => onViewModeChange('grid')} className={viewMode === 'grid' ? 'active' : ''}>
          ⊞ Grid
        </button>
        <button onClick={() => onViewModeChange('kanban')} className={viewMode === 'kanban' ? 'active' : ''}>
          ≡ Kanban
        </button>
      </div>

      <div className="toolbar-right">
        <button onClick={onToggleStats} className="toolbar-btn">📊</button>
        <button onClick={onCreateNote} className="btn-create">+ Note</button>
        <button onClick={onCreateTask} className="btn-create">+ Task</button>
      </div>
    </div>
  );
};
