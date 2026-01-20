'use client';

import React, { useState, useEffect, useCallback } from 'react';
import workspaceService, { 
  type Workspace, 
  type WorkspaceTab, 
  type WorkspaceNote,
  type WorkspaceTask,
  type WorkspaceStats
} from '../../lib/services/workspaceService';

interface WorkspaceManagerProps {
  onWorkspaceSelect?: (workspace: Workspace) => void;
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  onWorkspaceSelect
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState('#6366f1');
  const [newWorkspaceIcon, setNewWorkspaceIcon] = useState('📁');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'workspaces' | 'tabs' | 'notes' | 'tasks'>('workspaces');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [workspaceList, activeWorkspace, workspaceStats] = await Promise.all([
        workspaceService.getAllWorkspaces(),
        workspaceService.getActiveWorkspace(),
        workspaceService.getWorkspaceStats()
      ]);
      
      setWorkspaces(workspaceList);
      setStats(workspaceStats);
      
      if (activeWorkspace) {
        setCurrentWorkspace(activeWorkspace);
      } else if (workspaceList.length > 0) {
        setCurrentWorkspace(workspaceList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const workspace = await workspaceService.createWorkspace({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim(),
        icon: newWorkspaceIcon,
        color: newWorkspaceColor
      });
      
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      setNewWorkspaceColor('#6366f1');
      setNewWorkspaceIcon('📁');
      setShowNewWorkspace(false);
      await loadData();
      
      if (onWorkspaceSelect) {
        onWorkspaceSelect(workspace);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      await workspaceService.setActiveWorkspace(workspaceId);
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace) {
        setCurrentWorkspace(workspace);
        if (onWorkspaceSelect) {
          onWorkspaceSelect(workspace);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch workspace');
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;

    try {
      await workspaceService.deleteWorkspace(workspaceId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
    }
  };

  const handleDuplicateWorkspace = async (workspaceId: string) => {
    try {
      await workspaceService.duplicateWorkspace(workspaceId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate workspace');
    }
  };

  const handleExportWorkspace = async (workspaceId: string) => {
    try {
      const json = await workspaceService.exportWorkspace(workspaceId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspace-${workspaceId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export workspace');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadData();
      return;
    }

    try {
      const results = await workspaceService.searchWorkspaces(searchQuery);
      setWorkspaces(results.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  const formatDate = (timestamp: string | number | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'
  ];

  const iconOptions = ['📁', '🏠', '💼', '🎯', '📊', '🔬', '💡', '🎨', '🚀', '⚡', '🔧', '📱'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Workspace Manager</h2>
          <button
            onClick={() => setShowNewWorkspace(!showNewWorkspace)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <span>+</span> New Workspace
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Workspaces</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_workspaces}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Tabs</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_tabs}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_notes}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Tasks</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_tasks}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Sessions</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_sessions}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search workspaces, tabs, notes, tasks..."
            className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Search
          </button>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); loadData(); }}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Current Workspace */}
        {currentWorkspace && (
          <div 
            className="mt-4 p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${currentWorkspace.color}10`, 
              borderColor: `${currentWorkspace.color}40` 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentWorkspace.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: currentWorkspace.color }}>
                    Active Workspace
                  </p>
                  <p className="text-lg font-semibold text-foreground">{currentWorkspace.name}</p>
                  {currentWorkspace.description && (
                    <p className="text-sm text-muted-foreground">{currentWorkspace.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportWorkspace(currentWorkspace.id)}
                  className="px-3 py-1.5 bg-muted text-foreground text-sm rounded hover:bg-muted/80 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDuplicateWorkspace(currentWorkspace.id)}
                  className="px-3 py-1.5 bg-muted text-foreground text-sm rounded hover:bg-muted/80 transition-colors"
                >
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* New Workspace Form */}
      {showNewWorkspace && (
        <div className="p-6 bg-muted border-b border-border">
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Create New Workspace</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newWorkspaceDescription}
                  onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewWorkspaceIcon(icon)}
                      className={`w-10 h-10 text-xl rounded-lg border transition-all ${
                        newWorkspaceIcon === icon 
                          ? 'border-blue-500 bg-blue-500/20' 
                          : 'border-border hover:border-blue-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewWorkspaceColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        newWorkspaceColor === color 
                          ? 'ring-2 ring-offset-2 ring-blue-500' 
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Workspace
              </button>
              <button
                type="button"
                onClick={() => setShowNewWorkspace(false)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {(['workspaces', 'tabs', 'notes', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'workspaces' && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">All Workspaces</h3>
            
            {workspaces.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">No workspaces yet</p>
                <p className="text-sm">Create your first workspace to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                      workspace.id === currentWorkspace?.id
                        ? 'ring-2'
                        : 'hover:shadow-md'
                    }`}
                    style={{
                      borderColor: workspace.id === currentWorkspace?.id ? workspace.color : undefined,
                      '--tw-ring-color': workspace.color
                    } as React.CSSProperties}
                    onClick={() => handleSwitchWorkspace(workspace.id)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span 
                        className="text-2xl p-2 rounded-lg"
                        style={{ backgroundColor: `${workspace.color}20` }}
                      >
                        {workspace.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-foreground truncate">
                          {workspace.name}
                          {workspace.id === currentWorkspace?.id && (
                            <span 
                              className="ml-2 text-xs text-white px-2 py-0.5 rounded"
                              style={{ backgroundColor: workspace.color }}
                            >
                              Active
                            </span>
                          )}
                          {workspace.is_pinned && (
                            <span className="ml-1 text-yellow-500">📌</span>
                          )}
                        </h4>
                        {workspace.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {workspace.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                      <span>{workspace.tabs.length} tabs</span>
                      <span>{workspace.notes.length} notes</span>
                      <span>{workspace.tasks.length} tasks</span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      Updated: {formatDate(workspace.updated_at)}
                    </p>

                    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      {workspace.id !== currentWorkspace?.id && (
                        <button
                          onClick={() => handleSwitchWorkspace(workspace.id)}
                          className="px-3 py-1 text-white text-sm rounded hover:opacity-90 transition-colors"
                          style={{ backgroundColor: workspace.color }}
                        >
                          Switch
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicateWorkspace(workspace.id)}
                        className="px-3 py-1 bg-muted text-foreground text-sm rounded hover:bg-muted/80 transition-colors"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleExportWorkspace(workspace.id)}
                        className="px-3 py-1 bg-muted text-foreground text-sm rounded hover:bg-muted/80 transition-colors"
                      >
                        Export
                      </button>
                      {workspace.id !== currentWorkspace?.id && (
                        <button
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tabs' && currentWorkspace && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Tabs in {currentWorkspace.name}
            </h3>
            
            {currentWorkspace.tabs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tabs in this workspace</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentWorkspace.tabs.map((tab: WorkspaceTab) => (
                  <div
                    key={tab.id}
                    className="p-3 border border-border rounded-lg flex items-center gap-3 hover:bg-muted/50 transition-colors"
                  >
                    {tab.favicon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tab.favicon} alt="" className="w-5 h-5" />
                    ) : (
                      <div className="w-5 h-5 bg-muted rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tab.title || 'Untitled'}
                        {tab.is_pinned && <span className="ml-1 text-yellow-500">📌</span>}
                        {tab.is_muted && <span className="ml-1 text-muted-foreground">🔇</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{tab.url}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tab.last_accessed)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && currentWorkspace && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Notes in {currentWorkspace.name}
            </h3>
            
            {currentWorkspace.notes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No notes in this workspace</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentWorkspace.notes.map((note: WorkspaceNote) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg border border-border"
                    style={{ backgroundColor: `${note.color}20` }}
                  >
                    <h4 className="font-semibold text-foreground mb-2">
                      {note.title}
                      {note.is_pinned && <span className="ml-1 text-yellow-500">📌</span>}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                      {note.content || 'No content'}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && currentWorkspace && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Tasks in {currentWorkspace.name}
            </h3>
            
            {currentWorkspace.tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tasks in this workspace</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentWorkspace.tasks.map((task: WorkspaceTask) => (
                  <div
                    key={task.id}
                    className={`p-3 border border-border rounded-lg flex items-center gap-3 ${
                      task.status === 'completed' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} title={task.priority} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-foreground ${
                        task.status === 'completed' ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                      )}
                    </div>
                    <span className={`text-xs text-white px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceManager;
