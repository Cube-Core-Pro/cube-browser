/**
 * Notes & Tasks Type Definitions
 * CUBE Nexum Platform v2.0
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type NoteType = 'note' | 'task' | 'checklist';
export type NotePriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteStatus = 'active' | 'completed' | 'archived' | 'deleted';
export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled';
export type ViewMode = 'list' | 'grid' | 'kanban';

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  markdown: boolean;
  tags: string[];
  category: string | null;
  priority: NotePriority;
  status: NoteStatus;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  reminder: Reminder | null;
  checklist: ChecklistItem[] | null;
  color: string | null;
  pinned: boolean;
  favorite: boolean;
}

export interface Task extends Note {
  type: 'task';
  task_status: TaskStatus;
  due_date: number | null;
  estimated_time: number | null; // minutes
  actual_time: number | null; // minutes
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  created_at: number;
  completed_at: number | null;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: number;
  completed_at: number | null;
}

export interface Reminder {
  id: string;
  date: number;
  enabled: boolean;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  repeat_until: number | null;
  notified: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface Tag {
  name: string;
  count: number;
  color: string | null;
}

// ============================================================================
// FILTER AND SORT
// ============================================================================

export interface NoteFilter {
  type: NoteType[];
  status: NoteStatus[];
  priority: NotePriority[];
  categories: string[];
  tags: string[];
  search: string;
  date_range: {
    start: number | null;
    end: number | null;
  };
  has_reminder: boolean | null;
  pinned_only: boolean;
  favorite_only: boolean;
}

export interface NoteSort {
  field: 'title' | 'created' | 'updated' | 'priority' | 'due_date';
  direction: 'asc' | 'desc';
}

// ============================================================================
// KANBAN
// ============================================================================

export interface KanbanColumn {
  id: string;
  title: string;
  task_status: TaskStatus;
  tasks: Task[];
  color: string;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface NotesStats {
  total_notes: number;
  active_notes: number;
  completed_notes: number;
  archived_notes: number;
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  today_tasks: number;
  this_week_tasks: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  by_category: Record<string, number>;
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface NotesSettings {
  default_view: ViewMode;
  markdown_enabled: boolean;
  auto_save: boolean;
  auto_save_interval: number; // seconds
  show_completed: boolean;
  group_by_category: boolean;
  default_priority: NotePriority;
  enable_reminders: boolean;
  reminder_notification: boolean;
  reminder_sound: boolean;
  trash_auto_delete_days: number; // 0 = never
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const generateNoteId = (): string => {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateCategoryId = (): string => {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateSubtaskId = (): string => {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateChecklistItemId = (): string => {
  return `chk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateReminderId = (): string => {
  return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// STATUS HELPERS
// ============================================================================

export const getStatusColor = (status: NoteStatus | TaskStatus): string => {
  const colors: Record<string, string> = {
    active: '#3b82f6',
    completed: '#10b981',
    archived: '#6b7280',
    deleted: '#ef4444',
    todo: '#fbbf24',
    'in-progress': '#3b82f6',
    cancelled: '#6b7280'
  };
  return colors[status] || '#6b7280';
};

export const getPriorityColor = (priority: NotePriority): string => {
  const colors: Record<NotePriority, string> = {
    low: '#10b981',
    medium: '#fbbf24',
    high: '#f97316',
    urgent: '#ef4444'
  };
  return colors[priority];
};

export const getPriorityIcon = (priority: NotePriority): string => {
  const icons: Record<NotePriority, string> = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴'
  };
  return icons[priority];
};

export const getTypeIcon = (type: NoteType): string => {
  const icons: Record<NoteType, string> = {
    note: '📝',
    task: '✓',
    checklist: '☑️'
  };
  return icons[type];
};

// ============================================================================
// DATE HELPERS
// ============================================================================

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `Today at ${hours}:${minutes}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const formatDueDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} days`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due ${date.toLocaleDateString()}`;
  }
};

export const isOverdue = (dueDate: number | null): boolean => {
  if (!dueDate) return false;
  return dueDate < Date.now();
};

export const isDueToday = (dueDate: number | null): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dueDate >= today.getTime() && dueDate < tomorrow.getTime();
};

export const isDueThisWeek = (dueDate: number | null): boolean => {
  if (!dueDate) return false;
  const now = Date.now();
  const weekFromNow = now + (7 * 24 * 60 * 60 * 1000);
  return dueDate >= now && dueDate <= weekFromNow;
};

// ============================================================================
// FILTER HELPERS
// ============================================================================

export const filterNotes = (notes: Note[], filter: NoteFilter): Note[] => {
  return notes.filter(note => {
    // Type filter
    if (filter.type.length > 0 && !filter.type.includes(note.type)) {
      return false;
    }

    // Status filter
    if (filter.status.length > 0 && !filter.status.includes(note.status)) {
      return false;
    }

    // Priority filter
    if (filter.priority.length > 0 && !filter.priority.includes(note.priority)) {
      return false;
    }

    // Category filter
    if (filter.categories.length > 0) {
      if (!note.category || !filter.categories.includes(note.category)) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags.length > 0) {
      const hasTag = filter.tags.some(tag => note.tags.includes(tag));
      if (!hasTag) return false;
    }

    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(searchLower);
      const matchContent = note.content.toLowerCase().includes(searchLower);
      const matchTags = note.tags.some(tag => tag.toLowerCase().includes(searchLower));
      if (!matchTitle && !matchContent && !matchTags) {
        return false;
      }
    }

    // Date range filter
    if (filter.date_range.start && note.created_at < filter.date_range.start) {
      return false;
    }
    if (filter.date_range.end && note.created_at > filter.date_range.end) {
      return false;
    }

    // Reminder filter
    if (filter.has_reminder !== null) {
      const hasReminder = note.reminder !== null;
      if (hasReminder !== filter.has_reminder) {
        return false;
      }
    }

    // Pinned filter
    if (filter.pinned_only && !note.pinned) {
      return false;
    }

    // Favorite filter
    if (filter.favorite_only && !note.favorite) {
      return false;
    }

    return true;
  });
};

export const sortNotes = (notes: Note[], sort: NoteSort): Note[] => {
  return [...notes].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'created':
        comparison = a.created_at - b.created_at;
        break;
      case 'updated':
        comparison = a.updated_at - b.updated_at;
        break;
      case 'priority':
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'due_date':
        const aTask = a as Task;
        const bTask = b as Task;
        const aDue = aTask.due_date || Number.MAX_SAFE_INTEGER;
        const bDue = bTask.due_date || Number.MAX_SAFE_INTEGER;
        comparison = aDue - bDue;
        break;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

export const getNotesStats = (notes: Note[]): NotesStats => {
  const stats: NotesStats = {
    total_notes: notes.length,
    active_notes: 0,
    completed_notes: 0,
    archived_notes: 0,
    total_tasks: 0,
    active_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    today_tasks: 0,
    this_week_tasks: 0,
    by_priority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    },
    by_category: {}
  };

  notes.forEach(note => {
    // Status counts
    if (note.status === 'active') stats.active_notes++;
    else if (note.status === 'completed') stats.completed_notes++;
    else if (note.status === 'archived') stats.archived_notes++;

    // Task counts
    if (note.type === 'task') {
      const task = note as Task;
      stats.total_tasks++;

      if (task.task_status !== 'completed' && task.task_status !== 'cancelled') {
        stats.active_tasks++;

        if (task.due_date) {
          if (isOverdue(task.due_date)) stats.overdue_tasks++;
          if (isDueToday(task.due_date)) stats.today_tasks++;
          if (isDueThisWeek(task.due_date)) stats.this_week_tasks++;
        }
      }

      if (task.task_status === 'completed') {
        stats.completed_tasks++;
      }
    }

    // Priority counts
    stats.by_priority[note.priority]++;

    // Category counts
    if (note.category) {
      stats.by_category[note.category] = (stats.by_category[note.category] || 0) + 1;
    }
  });

  return stats;
};

// ============================================================================
// TAG HELPERS
// ============================================================================

export const getAllTags = (notes: Note[]): Tag[] => {
  const tagMap = new Map<string, number>();

  notes.forEach(note => {
    note.tags.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      color: null
    }))
    .sort((a, b) => b.count - a.count);
};

export const getPopularTags = (notes: Note[], limit: number = 10): Tag[] => {
  return getAllTags(notes).slice(0, limit);
};

// ============================================================================
// CATEGORY HELPERS
// ============================================================================

export const getCategoryStats = (notes: Note[], categories: Category[]): Category[] => {
  const counts = new Map<string, number>();

  notes.forEach(note => {
    if (note.category) {
      counts.set(note.category, (counts.get(note.category) || 0) + 1);
    }
  });

  return categories.map(cat => ({
    ...cat,
    count: counts.get(cat.id) || 0
  }));
};

// ============================================================================
// MARKDOWN HELPERS
// ============================================================================

export const stripMarkdown = (markdown: string): string => {
  return markdown
    .replace(/^#{1,6}\s+/gm, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/`(.+?)`/g, '$1') // Code
    .replace(/^[-*+]\s+/gm, '') // Lists
    .trim();
};

export const getPreview = (content: string, maxLength: number = 150): string => {
  const text = stripMarkdown(content);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// ============================================================================
// CHECKLIST HELPERS
// ============================================================================

export const calculateChecklistProgress = (checklist: ChecklistItem[] | null): number => {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.completed).length;
  return (completed / checklist.length) * 100;
};

export const getCompletedChecklistCount = (checklist: ChecklistItem[] | null): number => {
  if (!checklist) return 0;
  return checklist.filter(item => item.completed).length;
};

// ============================================================================
// SUBTASK HELPERS
// ============================================================================

export const calculateSubtaskProgress = (subtasks: Subtask[]): number => {
  if (subtasks.length === 0) return 0;
  const completed = subtasks.filter(sub => sub.completed).length;
  return (completed / subtasks.length) * 100;
};

export const getCompletedSubtaskCount = (subtasks: Subtask[]): number => {
  return subtasks.filter(sub => sub.completed).length;
};

// ============================================================================
// VALIDATION
// ============================================================================

export const validateNote = (note: Partial<Note>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!note.title || note.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (note.title && note.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (note.tags && note.tags.length > 20) {
    errors.push('Maximum 20 tags allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateTask = (task: Partial<Task>): { valid: boolean; errors: string[] } => {
  const noteValidation = validateNote(task);
  const errors = [...noteValidation.errors];

  if (task.due_date && task.due_date < Date.now() - (24 * 60 * 60 * 1000)) {
    errors.push('Due date cannot be more than 1 day in the past');
  }

  if (task.estimated_time && task.estimated_time < 0) {
    errors.push('Estimated time must be positive');
  }

  if (task.subtasks && task.subtasks.length > 50) {
    errors.push('Maximum 50 subtasks allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const createDefaultNote = (): Note => ({
  id: generateNoteId(),
  type: 'note',
  title: 'Untitled Note',
  content: '',
  markdown: true,
  tags: [],
  category: null,
  priority: 'medium',
  status: 'active',
  created_at: Date.now(),
  updated_at: Date.now(),
  completed_at: null,
  reminder: null,
  checklist: null,
  color: null,
  pinned: false,
  favorite: false
});

export const createDefaultTask = (): Task => ({
  ...createDefaultNote(),
  id: generateTaskId(),
  type: 'task',
  title: 'New Task',
  task_status: 'todo',
  due_date: null,
  estimated_time: null,
  actual_time: null,
  subtasks: []
});

export const defaultNotesSettings: NotesSettings = {
  default_view: 'list',
  markdown_enabled: true,
  auto_save: true,
  auto_save_interval: 30,
  show_completed: true,
  group_by_category: false,
  default_priority: 'medium',
  enable_reminders: true,
  reminder_notification: true,
  reminder_sound: true,
  trash_auto_delete_days: 30
};

export const defaultCategories: Category[] = [
  { id: 'personal', name: 'Personal', color: '#3b82f6', icon: '👤', count: 0 },
  { id: 'work', name: 'Work', color: '#8b5cf6', icon: '💼', count: 0 },
  { id: 'projects', name: 'Projects', color: '#10b981', icon: '🚀', count: 0 },
  { id: 'ideas', name: 'Ideas', color: '#fbbf24', icon: '💡', count: 0 },
  { id: 'shopping', name: 'Shopping', color: '#f97316', icon: '🛒', count: 0 }
];

// ============================================================================
// BACKEND API INTEGRATION
// ============================================================================

import { invoke } from '@tauri-apps/api/core';

/**
 * Notes API - Backend integration via Tauri commands
 * Replaces localStorage with Rust/SQLite backend
 */
export const notesAPI = {
  /**
   * Get all notes from database
   * @returns Promise<Note[]> - Array of all notes (excluding deleted)
   */
  getAllNotes: async (): Promise<Note[]> => {
    try {
      return await invoke<Note[]>('get_all_notes');
    } catch (error) {
      console.error('Failed to get all notes:', error);
      throw new Error(`Failed to retrieve notes: ${error}`);
    }
  },

  /**
   * Create a new note in database
   * @param note - Note object to create
   * @returns Promise<void>
   */
  createNote: async (note: Note): Promise<void> => {
    try {
      await invoke('create_note', { note });
    } catch (error) {
      console.error('Failed to create note:', error);
      throw new Error(`Failed to create note: ${error}`);
    }
  },

  /**
   * Update an existing note in database
   * @param note - Note object with updated data
   * @returns Promise<void>
   */
  updateNote: async (note: Note): Promise<void> => {
    try {
      await invoke('update_note', { note });
    } catch (error) {
      console.error('Failed to update note:', error);
      throw new Error(`Failed to update note: ${error}`);
    }
  },

  /**
   * Delete a note (soft delete - sets status to 'deleted')
   * @param noteId - ID of note to delete
   * @returns Promise<void>
   */
  deleteNote: async (noteId: string): Promise<void> => {
    try {
      await invoke('delete_note', { noteId });
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw new Error(`Failed to delete note: ${error}`);
    }
  },

  /**
   * Get all tasks from database (tasks are notes with type='task')
   * @returns Promise<Task[]> - Array of all tasks
   */
  getAllTasks: async (): Promise<Task[]> => {
    try {
      return await invoke<Task[]>('get_all_tasks');
    } catch (error) {
      console.error('Failed to get all tasks:', error);
      throw new Error(`Failed to retrieve tasks: ${error}`);
    }
  },

  /**
   * Create a new task in database
   * @param task - Task object to create (with subtasks)
   * @returns Promise<void>
   */
  createTask: async (task: Task): Promise<void> => {
    try {
      await invoke('create_task', { task });
    } catch (error) {
      console.error('Failed to create task:', error);
      throw new Error(`Failed to create task: ${error}`);
    }
  },

  /**
   * Update an existing task in database
   * @param task - Task object with updated data
   * @returns Promise<void>
   */
  updateTask: async (task: Task): Promise<void> => {
    try {
      await invoke('update_task', { task });
    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error(`Failed to update task: ${error}`);
    }
  },

  /**
   * Get all categories with note counts
   * @returns Promise<Category[]> - Array of categories
   */
  getAllCategories: async (): Promise<Category[]> => {
    try {
      return await invoke<Category[]>('get_all_categories');
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw new Error(`Failed to retrieve categories: ${error}`);
    }
  },

  /**
   * Get comprehensive statistics about notes and tasks
   * @returns Promise<NotesStats> - Statistics object
   */
  getNotesStats: async (): Promise<NotesStats> => {
    try {
      return await invoke<NotesStats>('get_notes_stats');
    } catch (error) {
      console.error('Failed to get notes stats:', error);
      throw new Error(`Failed to retrieve statistics: ${error}`);
    }
  }
};
