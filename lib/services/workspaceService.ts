/**
 * Workspace Service - Real Backend Integration
 * 
 * Provides workspace management functionality through Tauri invoke calls
 * All operations are backed by the Rust workspace_manager module
 * 
 * @module workspaceService
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tabs: WorkspaceTab[];
  notes: WorkspaceNote[];
  tasks: WorkspaceTask[];
  sessions: BrowsingSession[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_pinned: boolean;
  sort_order: number;
}

export interface WorkspaceTab {
  id: string;
  workspace_id: string;
  url: string;
  title: string;
  favicon: string;
  is_pinned: boolean;
  is_muted: boolean;
  last_accessed: string;
  created_at: string;
  sort_order: number;
}

export interface WorkspaceNote {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceTask {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BrowsingSession {
  id: string;
  workspace_id: string;
  name: string;
  tabs: SessionTab[];
  created_at: string;
  restored_at: string | null;
  is_auto_saved: boolean;
}

export interface SessionTab {
  url: string;
  title: string;
  favicon: string;
  scroll_position: number;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  is_pinned?: boolean;
  sort_order?: number;
}

export interface CreateTabInput {
  workspace_id: string;
  url: string;
  title?: string;
  favicon?: string;
}

export interface CreateNoteInput {
  workspace_id: string;
  title: string;
  content?: string;
  color?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  color?: string;
  is_pinned?: boolean;
  tags?: string[];
}

export interface CreateTaskInput {
  workspace_id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  tags?: string[];
}

export interface SaveSessionInput {
  workspace_id: string;
  name: string;
  tabs: SessionTab[];
  is_auto_saved?: boolean;
}

export interface WorkspaceStats {
  total_workspaces: number;
  total_tabs: number;
  total_notes: number;
  total_tasks: number;
  total_sessions: number;
  tasks_completed: number;
  tasks_pending: number;
  most_used_workspace: string | null;
  recent_activity: RecentActivity[];
}

export interface RecentActivity {
  type: 'workspace' | 'tab' | 'note' | 'task' | 'session';
  action: string;
  item_name: string;
  timestamp: string;
}

// ============================================================================
// Workspace Operations
// ============================================================================

/**
 * Create a new workspace
 */
export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  try {
    const workspace = await invoke<Workspace>('ws_mgr_create', {
      name: input.name,
      description: input.description || '',
      icon: input.icon || '📁',
      color: input.color || '#6366f1'
    });
    return workspace;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create workspace: ${error.message}`);
    }
    throw new Error('Failed to create workspace: Unknown error');
  }
}

/**
 * Get all workspaces
 */
export async function getAllWorkspaces(): Promise<Workspace[]> {
  try {
    const workspaces = await invoke<Workspace[]>('ws_mgr_get_all');
    return workspaces;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get workspaces: ${error.message}`);
    }
    throw new Error('Failed to get workspaces: Unknown error');
  }
}

/**
 * Get a specific workspace by ID
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  try {
    const workspace = await invoke<Workspace>('ws_mgr_get', { workspaceId });
    return workspace;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get workspace: ${error.message}`);
    }
    throw new Error('Failed to get workspace: Unknown error');
  }
}

/**
 * Get the currently active workspace
 */
export async function getActiveWorkspace(): Promise<Workspace | null> {
  try {
    const workspace = await invoke<Workspace | null>('ws_mgr_get_active');
    return workspace;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get active workspace: ${error.message}`);
    }
    throw new Error('Failed to get active workspace: Unknown error');
  }
}

/**
 * Set a workspace as active
 */
export async function setActiveWorkspace(workspaceId: string): Promise<void> {
  try {
    await invoke('ws_mgr_set_active', { workspaceId });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to set active workspace: ${error.message}`);
    }
    throw new Error('Failed to set active workspace: Unknown error');
  }
}

/**
 * Update a workspace
 */
export async function updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace> {
  try {
    const workspace = await invoke<Workspace>('ws_mgr_update', {
      workspaceId,
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      isPinned: input.is_pinned,
      sortOrder: input.sort_order
    });
    return workspace;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update workspace: ${error.message}`);
    }
    throw new Error('Failed to update workspace: Unknown error');
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  try {
    await invoke('ws_mgr_delete', { workspaceId });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }
    throw new Error('Failed to delete workspace: Unknown error');
  }
}

// ============================================================================
// Tab Operations
// ============================================================================

/**
 * Create a new tab in a workspace
 */
export async function createTab(input: CreateTabInput): Promise<WorkspaceTab> {
  try {
    const tab = await invoke<WorkspaceTab>('ws_mgr_create_tab', {
      workspaceId: input.workspace_id,
      url: input.url,
      title: input.title || 'New Tab',
      favicon: input.favicon || ''
    });
    return tab;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create tab: ${error.message}`);
    }
    throw new Error('Failed to create tab: Unknown error');
  }
}

/**
 * Get all tabs for a workspace
 */
export async function getTabs(workspaceId: string): Promise<WorkspaceTab[]> {
  try {
    const tabs = await invoke<WorkspaceTab[]>('ws_mgr_get_tabs', { workspaceId });
    return tabs;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tabs: ${error.message}`);
    }
    throw new Error('Failed to get tabs: Unknown error');
  }
}

/**
 * Update a tab
 */
export async function updateTab(
  tabId: string, 
  updates: { url?: string; title?: string; is_pinned?: boolean; is_muted?: boolean }
): Promise<WorkspaceTab> {
  try {
    const tab = await invoke<WorkspaceTab>('ws_mgr_update_tab', {
      tabId,
      url: updates.url,
      title: updates.title,
      isPinned: updates.is_pinned,
      isMuted: updates.is_muted
    });
    return tab;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update tab: ${error.message}`);
    }
    throw new Error('Failed to update tab: Unknown error');
  }
}

/**
 * Delete a tab
 */
export async function deleteTab(tabId: string): Promise<void> {
  try {
    await invoke('ws_mgr_delete_tab', { tabId });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete tab: ${error.message}`);
    }
    throw new Error('Failed to delete tab: Unknown error');
  }
}

/**
 * Move a tab to another workspace
 */
export async function moveTab(tabId: string, targetWorkspaceId: string): Promise<WorkspaceTab> {
  try {
    const tab = await invoke<WorkspaceTab>('ws_mgr_move_tab', { tabId, targetWorkspaceId });
    return tab;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to move tab: ${error.message}`);
    }
    throw new Error('Failed to move tab: Unknown error');
  }
}

// ============================================================================
// Note Operations
// ============================================================================

/**
 * Create a new note in a workspace
 */
export async function createNote(input: CreateNoteInput): Promise<WorkspaceNote> {
  try {
    const note = await invoke<WorkspaceNote>('ws_mgr_create_note', {
      workspaceId: input.workspace_id,
      title: input.title,
      content: input.content || '',
      color: input.color || '#fef08a',
      tags: input.tags || []
    });
    return note;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create note: ${error.message}`);
    }
    throw new Error('Failed to create note: Unknown error');
  }
}

/**
 * Get all notes for a workspace
 */
export async function getNotes(workspaceId: string): Promise<WorkspaceNote[]> {
  try {
    const notes = await invoke<WorkspaceNote[]>('ws_mgr_get_notes', { workspaceId });
    return notes;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get notes: ${error.message}`);
    }
    throw new Error('Failed to get notes: Unknown error');
  }
}

/**
 * Update a note
 */
export async function updateNote(noteId: string, input: UpdateNoteInput): Promise<WorkspaceNote> {
  try {
    const note = await invoke<WorkspaceNote>('ws_mgr_update_note', {
      noteId,
      title: input.title,
      content: input.content,
      color: input.color,
      isPinned: input.is_pinned,
      tags: input.tags
    });
    return note;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update note: ${error.message}`);
    }
    throw new Error('Failed to update note: Unknown error');
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  try {
    await invoke('ws_mgr_delete_note', { noteId });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete note: ${error.message}`);
    }
    throw new Error('Failed to delete note: Unknown error');
  }
}

// ============================================================================
// Task Operations
// ============================================================================

/**
 * Create a new task in a workspace
 */
export async function createTask(input: CreateTaskInput): Promise<WorkspaceTask> {
  try {
    const task = await invoke<WorkspaceTask>('ws_mgr_create_task', {
      workspaceId: input.workspace_id,
      title: input.title,
      description: input.description || '',
      priority: input.priority || 'medium',
      dueDate: input.due_date,
      tags: input.tags || []
    });
    return task;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
    throw new Error('Failed to create task: Unknown error');
  }
}

/**
 * Get all tasks for a workspace
 */
export async function getTasks(workspaceId: string): Promise<WorkspaceTask[]> {
  try {
    const tasks = await invoke<WorkspaceTask[]>('ws_mgr_get_tasks', { workspaceId });
    return tasks;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
    throw new Error('Failed to get tasks: Unknown error');
  }
}

/**
 * Update a task
 */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<WorkspaceTask> {
  try {
    const task = await invoke<WorkspaceTask>('ws_mgr_update_task', {
      taskId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.due_date,
      tags: input.tags
    });
    return task;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
    throw new Error('Failed to update task: Unknown error');
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    await invoke('ws_mgr_delete_task', { taskId });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
    throw new Error('Failed to delete task: Unknown error');
  }
}

/**
 * Complete a task
 */
export async function completeTask(taskId: string): Promise<WorkspaceTask> {
  try {
    const task = await invoke<WorkspaceTask>('ws_mgr_complete_task', { taskId });
    return task;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }
    throw new Error('Failed to complete task: Unknown error');
  }
}

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Save a browsing session
 */
export async function saveSession(input: SaveSessionInput): Promise<BrowsingSession> {
  try {
    const session = await invoke<BrowsingSession>('ws_mgr_save_session', {
      workspaceId: input.workspace_id,
      name: input.name,
      tabs: input.tabs,
      isAutoSaved: input.is_auto_saved || false
    });
    return session;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save session: ${error.message}`);
    }
    throw new Error('Failed to save session: Unknown error');
  }
}

/**
 * Get all sessions for a workspace
 */
export async function getSessions(workspaceId: string): Promise<BrowsingSession[]> {
  try {
    const sessions = await invoke<BrowsingSession[]>('ws_mgr_get_sessions', { workspaceId });
    return sessions;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get sessions: ${error.message}`);
    }
    throw new Error('Failed to get sessions: Unknown error');
  }
}

/**
 * Restore a session
 */
export async function restoreSession(sessionId: string): Promise<BrowsingSession> {
  try {
    const session = await invoke<BrowsingSession>('ws_mgr_restore_session', { sessionId });
    return session;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to restore session: ${error.message}`);
    }
    throw new Error('Failed to restore session: Unknown error');
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await invoke('ws_mgr_delete_session', { sessionId });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }
    throw new Error('Failed to delete session: Unknown error');
  }
}

// ============================================================================
// Stats and Search
// ============================================================================

/**
 * Get workspace statistics
 */
export async function getWorkspaceStats(): Promise<WorkspaceStats> {
  try {
    const stats = await invoke<WorkspaceStats>('ws_mgr_get_stats');
    return stats;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get workspace stats: ${error.message}`);
    }
    throw new Error('Failed to get workspace stats: Unknown error');
  }
}

/**
 * Search across all workspaces
 */
export async function searchWorkspaces(query: string): Promise<{
  workspaces: Workspace[];
  tabs: WorkspaceTab[];
  notes: WorkspaceNote[];
  tasks: WorkspaceTask[];
}> {
  try {
    const results = await invoke<{
      workspaces: Workspace[];
      tabs: WorkspaceTab[];
      notes: WorkspaceNote[];
      tasks: WorkspaceTask[];
    }>('ws_mgr_search', { query });
    return results;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search workspaces: ${error.message}`);
    }
    throw new Error('Failed to search workspaces: Unknown error');
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Export a workspace to JSON
 */
export async function exportWorkspace(workspaceId: string): Promise<string> {
  try {
    const json = await invoke<string>('ws_mgr_export', { workspaceId });
    return json;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to export workspace: ${error.message}`);
    }
    throw new Error('Failed to export workspace: Unknown error');
  }
}

/**
 * Import a workspace from JSON
 */
export async function importWorkspace(json: string): Promise<Workspace> {
  try {
    const workspace = await invoke<Workspace>('ws_mgr_import', { json });
    return workspace;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to import workspace: ${error.message}`);
    }
    throw new Error('Failed to import workspace: Unknown error');
  }
}

/**
 * Duplicate a workspace
 */
export async function duplicateWorkspace(workspaceId: string, newName?: string): Promise<Workspace> {
  try {
    const workspace = await invoke<Workspace>('ws_mgr_duplicate', { workspaceId, newName });
    return workspace;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to duplicate workspace: ${error.message}`);
    }
    throw new Error('Failed to duplicate workspace: Unknown error');
  }
}

/**
 * Reorder workspaces
 */
export async function reorderWorkspaces(workspaceIds: string[]): Promise<void> {
  try {
    await invoke('ws_mgr_reorder', { workspaceIds });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to reorder workspaces: ${error.message}`);
    }
    throw new Error('Failed to reorder workspaces: Unknown error');
  }
}

// ============================================================================
// Aliases for Backward Compatibility
// ============================================================================

/**
 * Alias for getAllWorkspaces (backward compatibility)
 */
export const listWorkspaces = getAllWorkspaces;

/**
 * Alias for getAllTabs (backward compatibility)
 */
export const listTabs = getTabs;

// ============================================================================
// Default Export
// ============================================================================

const workspaceService = {
  // Workspace operations
  createWorkspace,
  getAllWorkspaces,
  listWorkspaces: getAllWorkspaces,
  getWorkspace,
  getActiveWorkspace,
  setActiveWorkspace,
  updateWorkspace,
  deleteWorkspace,
  
  // Tab operations
  createTab,
  getTabs,
  updateTab,
  deleteTab,
  moveTab,
  
  // Note operations
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  
  // Task operations
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  completeTask,
  
  // Session operations
  saveSession,
  getSessions,
  restoreSession,
  deleteSession,
  
  // Stats and search
  getWorkspaceStats,
  searchWorkspaces,
  
  // Bulk operations
  exportWorkspace,
  importWorkspace,
  duplicateWorkspace,
  reorderWorkspaces
};

export default workspaceService;
