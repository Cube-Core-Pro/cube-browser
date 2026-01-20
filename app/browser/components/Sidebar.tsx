"use client";
import { logger } from '@/lib/services/logger-service';
const log = logger.scope('Sidebar');
// CUBE Nexum - Sidebar Component
// Superior to Opera/Vivaldi sidebars with messaging, music, web panels

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  browserSidebarService,
  SidebarSettings,
  SidebarState,
  SidebarPanel,
  SidebarNote,
  SidebarTask,
  type SidebarStats as _SidebarStats,
  PanelType,
  TaskPriority,
  type SidebarEvent as _SidebarEvent,
} from '../../../lib/services/browser-sidebar-service';
import './Sidebar.css';

// ==================== Panel Strip Item ====================

interface PanelStripItemProps {
  panel: SidebarPanel;
  isActive: boolean;
  onClick: () => void;
}

const PanelStripItem: React.FC<PanelStripItemProps> = ({
  panel,
  isActive,
  onClick,
}) => {
  return (
    <button
      className={`panel-strip-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={panel.name}
    >
      {panel.icon}
      {panel.badge_count > 0 && (
        <span className="panel-strip-badge">
          {panel.badge_count > 99 ? '99+' : panel.badge_count}
        </span>
      )}
    </button>
  );
};

// ==================== Panel List Item ====================

interface PanelListItemProps {
  panel: SidebarPanel;
  isActive: boolean;
  onClick: () => void;
}

const PanelListItem: React.FC<PanelListItemProps> = ({
  panel,
  isActive,
  onClick,
}) => {
  return (
    <button
      className={`panel-list-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="panel-list-item-icon">{panel.icon}</span>
      <span className="panel-list-item-name">{panel.name}</span>
      {panel.badge_count > 0 && (
        <span className="panel-list-item-badge">
          {panel.badge_count > 99 ? '99+' : panel.badge_count}
        </span>
      )}
    </button>
  );
};

// ==================== Notes Panel ====================

interface NotesPanelProps {
  notes: SidebarNote[];
  onCreateNote: () => void;
  onSelectNote: (note: SidebarNote) => void;
  onTogglePin?: (noteId: string) => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  onCreateNote,
  onSelectNote,
  onTogglePin: _onTogglePin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return b.updated_at - a.updated_at;
    });
  }, [filteredNotes]);

  return (
    <div className="notes-panel">
      <div className="notes-header">
        <input
          type="text"
          className="notes-search"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button className="notes-add-btn" onClick={onCreateNote} title="New note">
          +
        </button>
      </div>
      <div className="notes-list">
        {sortedNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">No notes yet</div>
            <div className="empty-state-description">
              Create your first note to get started
            </div>
          </div>
        ) : (
          sortedNotes.map(note => (
            <div
              key={note.id}
              className={`note-card ${note.is_pinned ? 'pinned' : ''}`}
              style={{ borderLeftColor: note.color }}
              onClick={() => onSelectNote(note)}
            >
              <div className="note-card-title">{note.title || 'Untitled'}</div>
              <div className="note-card-preview">{note.content}</div>
              <div className="note-card-footer">
                <span>{browserSidebarService.formatTimeAgo(note.updated_at)}</span>
                {note.tags.length > 0 && (
                  <div className="note-card-tags">
                    {note.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="note-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ==================== Tasks Panel ====================

interface TasksPanelProps {
  tasks: SidebarTask[];
  onCreateTask: (title: string) => void;
  onToggleComplete: (taskId: string) => void;
  onClearCompleted: () => void;
}

const TasksPanel: React.FC<TasksPanelProps> = ({
  tasks,
  onCreateTask,
  onToggleComplete,
  onClearCompleted,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter(t => !t.completed);
      case 'completed':
        return tasks.filter(t => t.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const sortedTasks = useMemo(() => {
    const priorityOrder: Record<TaskPriority, number> = {
      Urgent: 0,
      High: 1,
      Medium: 2,
      Low: 3,
    };
    return [...filteredTasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [filteredTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onCreateTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="tasks-panel">
      <div className="tasks-header">
        <form className="tasks-input-container" onSubmit={handleSubmit}>
          <input
            type="text"
            className="tasks-input"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
          />
          <button type="submit" className="tasks-add-btn">
            +
          </button>
        </form>
      </div>
      <div className="tasks-filters">
        <button
          className={`task-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({tasks.length})
        </button>
        <button
          className={`task-filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({tasks.length - completedCount})
        </button>
        <button
          className={`task-filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Done ({completedCount})
        </button>
        {completedCount > 0 && (
          <button className="task-filter-btn" onClick={onClearCompleted}>
            Clear
          </button>
        )}
      </div>
      <div className="tasks-list">
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">
              {filter === 'completed' ? 'No completed tasks' : 'No tasks yet'}
            </div>
            <div className="empty-state-description">
              {filter === 'completed'
                ? 'Complete a task to see it here'
                : 'Add your first task to get started'}
            </div>
          </div>
        ) : (
          sortedTasks.map(task => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'completed' : ''}`}
            >
              <div
                className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                onClick={() => onToggleComplete(task.id)}
              />
              <div className="task-content">
                <div className="task-title">{task.title}</div>
                <div className="task-meta">
                  <span className={`task-priority ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                  {task.due_date && (
                    <span className="task-due-date">
                      📅 {new Date(task.due_date * 1000).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ==================== Add Panel Modal ====================

interface AddPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPanel: (panelType: PanelType) => void;
  onAddCustomPanel: (name: string, url: string) => void;
}

const AddPanelModal: React.FC<AddPanelModalProps> = ({
  isOpen,
  onClose,
  onAddPanel,
  onAddCustomPanel,
}) => {
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'messaging', label: 'Messaging', panels: browserSidebarService.getPanelsByCategory('messaging') },
    { id: 'music', label: 'Music', panels: browserSidebarService.getPanelsByCategory('music') },
    { id: 'web', label: 'Web Panels', panels: browserSidebarService.getPanelsByCategory('web').filter(p => p.type !== 'CustomWebPanel') },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName && customUrl) {
      onAddCustomPanel(customName, customUrl);
      setCustomName('');
      setCustomUrl('');
      onClose();
    }
  };

  return (
    <div className="add-panel-modal" onClick={onClose}>
      <div className="add-panel-content" onClick={e => e.stopPropagation()}>
        <div className="add-panel-header">
          <span className="add-panel-title">Add Panel</span>
          <button className="add-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="add-panel-body">
          {categories.map(category => (
            <div key={category.id} className="panel-category">
              <div className="panel-category-title">{category.label}</div>
              <div className="panel-options">
                {category.panels.map(panel => (
                  <button
                    key={panel.type}
                    className="panel-option"
                    onClick={() => {
                      onAddPanel(panel.type);
                      onClose();
                    }}
                  >
                    <span className="panel-option-icon">{panel.icon}</span>
                    <span className="panel-option-name">{panel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <form className="custom-panel-form" onSubmit={handleCustomSubmit}>
          <input
            type="text"
            className="custom-panel-input"
            placeholder="Panel name"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
          />
          <input
            type="url"
            className="custom-panel-input"
            placeholder="https://example.com"
            value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
          />
          <button type="submit" className="custom-panel-submit">
            Add Custom Panel
          </button>
        </form>
      </div>
    </div>
  );
};

// ==================== Main Sidebar Component ====================

interface SidebarProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isVisible = true,
  onVisibilityChange: _onVisibilityChange,
}) => {
  const [settings, setSettings] = useState<SidebarSettings | null>(null);
  const [state, setState] = useState<SidebarState | null>(null);
  const [panels, setPanels] = useState<SidebarPanel[]>([]);
  const [notes, setNotes] = useState<SidebarNote[]>([]);
  const [tasks, setTasks] = useState<SidebarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [loadedSettings, loadedState, loadedPanels, loadedNotes, loadedTasks] =
          await Promise.all([
            browserSidebarService.getSettings(),
            browserSidebarService.getState(),
            browserSidebarService.getAllPanels(),
            browserSidebarService.getAllNotes(),
            browserSidebarService.getAllTasks(),
          ]);

        setSettings(loadedSettings);
        setState(loadedState);
        setPanels(loadedPanels);
        setNotes(loadedNotes);
        setTasks(loadedTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sidebar');
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  // Event listeners
  useEffect(() => {
    const handlePanelChanged = async () => {
      const loadedState = await browserSidebarService.getState();
      setState(loadedState);
    };

    const handleNoteCreated = async () => {
      const loadedNotes = await browserSidebarService.getAllNotes();
      setNotes(loadedNotes);
    };

    const handleTaskCompleted = async () => {
      const loadedTasks = await browserSidebarService.getAllTasks();
      setTasks(loadedTasks);
    };

    browserSidebarService.on('panel-changed', handlePanelChanged);
    browserSidebarService.on('note-created', handleNoteCreated);
    browserSidebarService.on('note-updated', handleNoteCreated);
    browserSidebarService.on('task-created', handleTaskCompleted);
    browserSidebarService.on('task-completed', handleTaskCompleted);

    return () => {
      browserSidebarService.off('panel-changed', handlePanelChanged);
      browserSidebarService.off('note-created', handleNoteCreated);
      browserSidebarService.off('note-updated', handleNoteCreated);
      browserSidebarService.off('task-created', handleTaskCompleted);
      browserSidebarService.off('task-completed', handleTaskCompleted);
    };
  }, []);

  // Toggle sidebar
  const handleToggle = useCallback(async () => {
    try {
      const isExpanded = await browserSidebarService.toggle();
      setState(prev => (prev ? { ...prev, is_expanded: isExpanded } : null));
    } catch (err) {
      log.error('Failed to toggle sidebar:', err);
    }
  }, []);

  // Set active panel
  const handlePanelClick = useCallback(async (panelId: string) => {
    try {
      await browserSidebarService.setActivePanel(panelId);
      setState(prev => (prev ? { ...prev, active_panel_id: panelId } : null));
      
      // Expand if collapsed
      if (!state?.is_expanded) {
        await browserSidebarService.expand();
        setState(prev => (prev ? { ...prev, is_expanded: true } : null));
      }
    } catch (err) {
      log.error('Failed to set active panel:', err);
    }
  }, [state?.is_expanded]);

  // Add panel
  const handleAddPanel = useCallback(async (panelType: PanelType) => {
    try {
      const panel = await browserSidebarService.addPanel(panelType);
      setPanels(prev => [...prev, panel]);
      await browserSidebarService.setActivePanel(panel.id);
      setState(prev => (prev ? { ...prev, active_panel_id: panel.id } : null));
    } catch (err) {
      log.error('Failed to add panel:', err);
    }
  }, []);

  // Add custom panel
  const handleAddCustomPanel = useCallback(async (name: string, url: string) => {
    try {
      const panel = await browserSidebarService.addCustomPanel(name, url);
      setPanels(prev => [...prev, panel]);
      await browserSidebarService.setActivePanel(panel.id);
      setState(prev => (prev ? { ...prev, active_panel_id: panel.id } : null));
    } catch (err) {
      log.error('Failed to add custom panel:', err);
    }
  }, []);

  // Notes operations
  const handleCreateNote = useCallback(async () => {
    try {
      const note = await browserSidebarService.createNote('New Note', '');
      setNotes(prev => [...prev, note]);
    } catch (err) {
      log.error('Failed to create note:', err);
    }
  }, []);

  // Tasks operations
  const handleCreateTask = useCallback(async (title: string) => {
    try {
      const task = await browserSidebarService.createTask(title);
      setTasks(prev => [...prev, task]);
    } catch (err) {
      log.error('Failed to create task:', err);
    }
  }, []);

  const handleToggleTaskComplete = useCallback(async (taskId: string) => {
    try {
      await browserSidebarService.toggleTaskComplete(taskId);
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, completed: !t.completed, completed_at: !t.completed ? Date.now() / 1000 : null }
            : t
        )
      );
    } catch (err) {
      log.error('Failed to toggle task:', err);
    }
  }, []);

  const handleClearCompletedTasks = useCallback(async () => {
    try {
      await browserSidebarService.clearCompletedTasks();
      setTasks(prev => prev.filter(t => !t.completed));
    } catch (err) {
      log.error('Failed to clear completed tasks:', err);
    }
  }, []);

  // Get active panel content
  const activePanel = panels.find(p => p.id === state?.active_panel_id);
  const totalBadgeCount = panels.reduce((sum, p) => sum + p.badge_count, 0);

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className="sidebar-container left collapsed">
        <div className="sidebar-header">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sidebar-container left collapsed">
        <div className="sidebar-header">
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  const position = settings?.position || 'Left';
  const isExpanded = state?.is_expanded || false;

  return (
    <>
      <div
        className={`sidebar-container ${position.toLowerCase()} ${
          isExpanded ? 'expanded' : 'collapsed'
        }`}
        style={{ width: isExpanded ? settings?.width : settings?.collapsed_width }}
      >
        {/* Header */}
        <div className="sidebar-header">
          {isExpanded && (
            <div className="sidebar-title">
              <span className="sidebar-title-icon">📚</span>
              Sidebar
            </div>
          )}
          {totalBadgeCount > 0 && !isExpanded && (
            <span className="sidebar-badge">
              {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
            </span>
          )}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setShowAddPanel(true)}
            title="Add panel"
          >
            +
          </button>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            className="sidebar-toggle-btn"
            onClick={handleToggle}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '◀' : '▶'}
          </button>
        </div>

        {/* Panel Strip (collapsed) / Panel List (expanded) */}
        {isExpanded ? (
          <div className="sidebar-panel-list">
            <div className="panel-list-category">Messaging</div>
            {panels
              .filter(p =>
                ['Messenger', 'WhatsApp', 'Telegram', 'Discord', 'Slack'].includes(
                  p.panel_type
                )
              )
              .map(panel => (
                <PanelListItem
                  key={panel.id}
                  panel={panel}
                  isActive={state?.active_panel_id === panel.id}
                  onClick={() => handlePanelClick(panel.id)}
                />
              ))}

            <div className="sidebar-divider" />

            <div className="panel-list-category">Music</div>
            {panels
              .filter(p =>
                ['Spotify', 'AppleMusic', 'YouTubeMusic', 'SoundCloud', 'Deezer'].includes(
                  p.panel_type
                )
              )
              .map(panel => (
                <PanelListItem
                  key={panel.id}
                  panel={panel}
                  isActive={state?.active_panel_id === panel.id}
                  onClick={() => handlePanelClick(panel.id)}
                />
              ))}

            <div className="sidebar-divider" />

            <div className="panel-list-category">Productivity</div>
            {panels
              .filter(p =>
                ['Notes', 'Tasks', 'Calendar', 'Bookmarks', 'History', 'Downloads'].includes(
                  p.panel_type
                )
              )
              .map(panel => (
                <PanelListItem
                  key={panel.id}
                  panel={panel}
                  isActive={state?.active_panel_id === panel.id}
                  onClick={() => handlePanelClick(panel.id)}
                />
              ))}
          </div>
        ) : (
          <div className="sidebar-panel-strip">
            {panels.slice(0, 8).map(panel => (
              <PanelStripItem
                key={panel.id}
                panel={panel}
                isActive={state?.active_panel_id === panel.id}
                onClick={() => handlePanelClick(panel.id)}
              />
            ))}
          </div>
        )}

        {/* Panel Content */}
        {isExpanded && activePanel && (
          <div className="sidebar-panel-content">
            {activePanel.panel_type === 'Notes' ? (
              <NotesPanel
                notes={notes}
                onCreateNote={handleCreateNote}
                onSelectNote={note => log.debug('Selected note:', note)}
                onTogglePin={noteId =>
                  browserSidebarService.toggleNotePin(noteId)
                }
              />
            ) : activePanel.panel_type === 'Tasks' ? (
              <TasksPanel
                tasks={tasks}
                onCreateTask={handleCreateTask}
                onToggleComplete={handleToggleTaskComplete}
                onClearCompleted={handleClearCompletedTasks}
              />
            ) : activePanel.url ? (
              <iframe
                className="panel-webview"
                src={activePanel.url}
                title={activePanel.name}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">{activePanel.icon}</div>
                <div className="empty-state-title">{activePanel.name}</div>
                <div className="empty-state-description">
                  This panel is not configured yet
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && isExpanded && (
          <div className="sidebar-settings">
            <div className="settings-section">
              <div className="settings-section-title">Appearance</div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Show Panel Names</div>
                </div>
                <div
                  className={`toggle-switch ${settings?.show_panel_names ? 'active' : ''}`}
                  onClick={async () => {
                    if (settings) {
                      const newSettings = {
                        ...settings,
                        show_panel_names: !settings.show_panel_names,
                      };
                      await browserSidebarService.updateSettings(newSettings);
                      setSettings(newSettings);
                    }
                  }}
                />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Compact Mode</div>
                </div>
                <div
                  className={`toggle-switch ${settings?.compact_mode ? 'active' : ''}`}
                  onClick={async () => {
                    await browserSidebarService.toggleCompactMode();
                    const newSettings = await browserSidebarService.getSettings();
                    setSettings(newSettings);
                  }}
                />
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-section-title">Notifications</div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Enable Notifications</div>
                </div>
                <div
                  className={`toggle-switch ${settings?.global_notifications ? 'active' : ''}`}
                  onClick={async () => {
                    if (settings) {
                      const newSettings = {
                        ...settings,
                        global_notifications: !settings.global_notifications,
                      };
                      await browserSidebarService.updateSettings(newSettings);
                      setSettings(newSettings);
                    }
                  }}
                />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Notification Sound</div>
                </div>
                <div
                  className={`toggle-switch ${settings?.notification_sound ? 'active' : ''}`}
                  onClick={async () => {
                    if (settings) {
                      const newSettings = {
                        ...settings,
                        notification_sound: !settings.notification_sound,
                      };
                      await browserSidebarService.updateSettings(newSettings);
                      setSettings(newSettings);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Panel Modal */}
      <AddPanelModal
        isOpen={showAddPanel}
        onClose={() => setShowAddPanel(false)}
        onAddPanel={handleAddPanel}
        onAddCustomPanel={handleAddCustomPanel}
      />
    </>
  );
};

export default Sidebar;
