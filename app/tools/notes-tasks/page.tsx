"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');

/**
 * Notes & Tasks Manager - Main Page
 * CUBE Nexum Platform v2.0
 */


import React, { useState, useEffect } from 'react';
import {
  Note,
  Task,
  Category,
  NoteFilter,
  NoteSort,
  NotesStats,
  NotesSettings,
  ViewMode,
  createDefaultNote,
  createDefaultTask,
  defaultNotesSettings,
  defaultCategories,
  filterNotes,
  sortNotes,
  getNotesStats,
  getAllTags,
  getCategoryStats,
  notesAPI
} from '@/types/notes';
import { NotesList } from '@/components/notes/NotesList';
import { NotesGrid } from '@/components/notes/NotesGrid';
import { KanbanBoard } from '@/components/notes/KanbanBoard';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NotesStats as StatsComponent } from '@/components/notes/NotesStats';
import { NotesSidebar } from '@/components/notes/NotesSidebar';
import { NotesToolbar } from '@/components/notes/NotesToolbar';
import './notes.css';

export default function NotesTasksPage() {
  // ============================================================================
  // STATE
  // ============================================================================

  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [settings, setSettings] = useState<NotesSettings>(defaultNotesSettings);
  
  const [filter, setFilter] = useState<NoteFilter>({
    type: [],
    status: ['active'],
    priority: [],
    categories: [],
    tags: [],
    search: '',
    date_range: { start: null, end: null },
    has_reminder: null,
    pinned_only: false,
    favorite_only: false
  });

  const [sort, setSort] = useState<NoteSort>({
    field: 'updated',
    direction: 'desc'
  });

  const [stats, setStats] = useState<NotesStats>({
    total_notes: 0,
    active_notes: 0,
    completed_notes: 0,
    archived_notes: 0,
    total_tasks: 0,
    active_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    today_tasks: 0,
    this_week_tasks: 0,
    by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
    by_category: {}
  });

  // UI State
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // PERSISTENCE - Backend Integration
  // ============================================================================

  // Load initial data from backend on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load notes from backend
        const backendNotes = await notesAPI.getAllNotes();
        setNotes(backendNotes);

        // Load categories from backend
        const backendCategories = await notesAPI.getAllCategories();
        setCategories(backendCategories);

        // Load settings from localStorage (UI preferences)
        const savedSettings = localStorage.getItem('notes_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        const savedViewMode = localStorage.getItem('notes_view_mode');
        if (savedViewMode) {
          setViewMode(savedViewMode as ViewMode);
        }

        log.debug('📝 Notes & Tasks: Loaded data from backend');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        log.error('Failed to load notes from backend:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save UI preferences to localStorage (not sent to backend)
  useEffect(() => {
    localStorage.setItem('notes_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('notes_view_mode', viewMode);
  }, [viewMode]);

  // ============================================================================
  // STATISTICS
  // ============================================================================

  useEffect(() => {
    setStats(getNotesStats(notes));
  }, [notes]);

  useEffect(() => {
    setCategories(prev => getCategoryStats(notes, prev));
  }, [notes]);

  // ============================================================================
  // NOTE OPERATIONS - Backend Integration
  // ============================================================================

  const handleCreateNote = async () => {
    try {
      const newNote = createDefaultNote();
      await notesAPI.createNote(newNote);
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      setShowEditor(true);
      log.debug('✅ Note created:', newNote.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      log.error('Failed to create note:', err);
    }
  };

  const handleCreateTask = async () => {
    try {
      const newTask = createDefaultTask();
      await notesAPI.createTask(newTask);
      setNotes(prev => [newTask, ...prev]);
      setSelectedNote(newTask);
      setShowEditor(true);
      log.debug('✅ Task created:', newTask.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      log.error('Failed to create task:', err);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    try {
      if (updatedNote.type === 'task') {
        await notesAPI.updateTask(updatedNote as Task);
      } else {
        await notesAPI.updateNote(updatedNote);
      }
      setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
      setSelectedNote(updatedNote);
      log.debug('✅ Note updated:', updatedNote.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      log.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await notesAPI.deleteNote(noteId);
      
      // Update local state (soft delete)
      setNotes(prev => prev.map(n => 
        n.id === noteId 
          ? { ...n, status: 'deleted' as const, updated_at: Date.now() }
          : n
      ));
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setShowEditor(false);
      }
      
      log.debug('✅ Note deleted:', noteId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      log.error('Failed to delete note:', err);
    }
  };

  const handleArchiveNote = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const archivedNote = { 
        ...note, 
        status: 'archived' as const, 
        updated_at: Date.now() 
      };
      
      await notesAPI.updateNote(archivedNote);
      setNotes(prev => prev.map(n => n.id === noteId ? archivedNote : n));
      log.debug('✅ Note archived:', noteId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive note';
      setError(errorMessage);
      log.error('Failed to archive note:', err);
    }
  };

  const _handleRestoreNote = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const restoredNote = { 
        ...note, 
        status: 'active' as const, 
        updated_at: Date.now() 
      };
      
      await notesAPI.updateNote(restoredNote);
      setNotes(prev => prev.map(n => n.id === noteId ? restoredNote : n));
      log.debug('✅ Note restored:', noteId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore note';
      setError(errorMessage);
      log.error('Failed to restore note:', err);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const updatedNote = { 
        ...note, 
        pinned: !note.pinned, 
        updated_at: Date.now() 
      };
      
      await notesAPI.updateNote(updatedNote);
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      log.debug('✅ Note pin toggled:', noteId);
    } catch (err) {
      log.error('Failed to toggle pin:', err);
    }
  };

  const handleToggleFavorite = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const updatedNote = { 
        ...note, 
        favorite: !note.favorite, 
        updated_at: Date.now() 
      };
      
      await notesAPI.updateNote(updatedNote);
      setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      log.debug('✅ Note favorite toggled:', noteId);
    } catch (err) {
      log.error('Failed to toggle favorite:', err);
    }
  };

  const handleDuplicateNote = async (noteId: string) => {
    try {
      const original = notes.find(n => n.id === noteId);
      if (!original) return;

      const duplicate: Note = {
        ...original,
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${original.title} (Copy)`,
        created_at: Date.now(),
        updated_at: Date.now(),
        pinned: false
      };

      await notesAPI.createNote(duplicate);
      setNotes(prev => [duplicate, ...prev]);
      log.debug('✅ Note duplicated:', duplicate.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate note';
      setError(errorMessage);
      log.error('Failed to duplicate note:', err);
    }
  };

  // ============================================================================
  // CATEGORY OPERATIONS
  // ============================================================================

  const handleCreateCategory = (name: string, color: string, icon: string) => {
    const newCategory: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      icon,
      count: 0
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat =>
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Remove category from notes
    setNotes(prev => prev.map(note =>
      note.category === id ? { ...note, category: null } : note
    ));
  };

  // ============================================================================
  // FILTER & SORT
  // ============================================================================

  const handleFilterChange = (newFilter: Partial<NoteFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const handleSortChange = (field: NoteSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const _handleClearFilters = () => {
    setFilter({
      type: [],
      status: ['active'],
      priority: [],
      categories: [],
      tags: [],
      search: '',
      date_range: { start: null, end: null },
      has_reminder: null,
      pinned_only: false,
      favorite_only: false
    });
  };

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const _handleBulkDelete = (noteIds: string[]) => {
    setNotes(prev => prev.map(n =>
      noteIds.includes(n.id)
        ? { ...n, status: 'deleted' as const, updated_at: Date.now() }
        : n
    ));
  };

  const _handleBulkArchive = (noteIds: string[]) => {
    setNotes(prev => prev.map(n =>
      noteIds.includes(n.id)
        ? { ...n, status: 'archived' as const, updated_at: Date.now() }
        : n
    ));
  };

  const _handleBulkChangeCategory = (noteIds: string[], categoryId: string | null) => {
    setNotes(prev => prev.map(n =>
      noteIds.includes(n.id)
        ? { ...n, category: categoryId, updated_at: Date.now() }
        : n
    ));
  };

  const _handleBulkAddTag = (noteIds: string[], tag: string) => {
    setNotes(prev => prev.map(n =>
      noteIds.includes(n.id)
        ? { 
            ...n, 
            tags: n.tags.includes(tag) ? n.tags : [...n.tags, tag],
            updated_at: Date.now() 
          }
        : n
    ));
  };

  // ============================================================================
  // EXPORT/IMPORT
  // ============================================================================

  const handleExportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setNotes(prev => [...imported, ...prev]);
      } catch (_error) {
        setError('Failed to import notes');
      }
    };
    reader.readAsText(file);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const displayNotes = React.useMemo(() => {
    let filtered = filterNotes(notes, filter);
    filtered = sortNotes(filtered, sort);
    
    // Sort pinned notes to top
    const pinned = filtered.filter(n => n.pinned);
    const unpinned = filtered.filter(n => !n.pinned);
    
    return [...pinned, ...unpinned];
  }, [notes, filter, sort]);

  const allTags = React.useMemo(() => {
    return getAllTags(notes);
  }, [notes]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="notes-tasks-page">
      {/* Sidebar */}
      {showSidebar && (
        <NotesSidebar
          categories={categories}
          tags={allTags}
          filter={filter}
          stats={stats}
          onFilterChange={handleFilterChange}
          onCreateCategory={handleCreateCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          onClose={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="notes-main">
        {/* Toolbar */}
        <NotesToolbar
          viewMode={viewMode}
          sort={sort}
          showSidebar={showSidebar}
          showStats={showStats}
          onViewModeChange={setViewMode}
          onSortChange={handleSortChange}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          onToggleStats={() => setShowStats(!showStats)}
          onCreateNote={handleCreateNote}
          onCreateTask={handleCreateTask}
          onExport={handleExportNotes}
          onImport={handleImportNotes}
          onSearch={(search) => handleFilterChange({ search })}
        />

        {/* Statistics */}
        {showStats && (
          <StatsComponent stats={stats} />
        )}

        {/* Notes Display */}
        <div className="notes-content">
          {loading && (
            <div className="notes-loading">Loading...</div>
          )}

          {error && (
            <div className="notes-error">{error}</div>
          )}

          {!loading && !error && displayNotes.length === 0 && (
            <div className="notes-empty">
              <div className="empty-icon">📝</div>
              <h3>No notes found</h3>
              <p>Create your first note or adjust your filters</p>
              <div className="empty-actions">
                <button onClick={handleCreateNote} className="btn-primary">
                  Create Note
                </button>
                <button onClick={handleCreateTask} className="btn-secondary">
                  Create Task
                </button>
              </div>
            </div>
          )}

          {!loading && !error && displayNotes.length > 0 && (
            <>
              {viewMode === 'list' && (
                <NotesList
                  notes={displayNotes}
                  selectedNote={selectedNote}
                  categories={categories}
                  onSelectNote={handleSelectNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onArchiveNote={handleArchiveNote}
                  onTogglePin={handleTogglePin}
                  onToggleFavorite={handleToggleFavorite}
                  onDuplicate={handleDuplicateNote}
                />
              )}

              {viewMode === 'grid' && (
                <NotesGrid
                  notes={displayNotes}
                  selectedNote={selectedNote}
                  categories={categories}
                  onSelectNote={handleSelectNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onArchiveNote={handleArchiveNote}
                  onTogglePin={handleTogglePin}
                  onToggleFavorite={handleToggleFavorite}
                  onDuplicate={handleDuplicateNote}
                />
              )}

              {viewMode === 'kanban' && (
                <KanbanBoard
                  notes={displayNotes.filter(n => n.type === 'task') as Task[]}
                  categories={categories}
                  onSelectNote={handleSelectNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      {showEditor && selectedNote && (
        <NoteEditor
          note={selectedNote}
          categories={categories}
          allTags={allTags}
          settings={settings}
          onSave={handleUpdateNote}
          onClose={() => {
            setShowEditor(false);
            setSelectedNote(null);
          }}
          onDelete={() => {
            handleDeleteNote(selectedNote.id);
            setShowEditor(false);
            setSelectedNote(null);
          }}
        />
      )}
    </div>
  );
}
