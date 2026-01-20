// CUBE Nexum - Workspaces React Component
// Superior to Chrome Profiles, Arc Spaces, Vivaldi Workspaces

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  workspacesService,
  Workspace,
  WorkspaceTab,
  WorkspaceTemplate,
  WorkspaceStats,
  QuickSwitchItem,
  WorkspaceSettings,
  type WorkspaceLayout as _WorkspaceLayout,
  type SwitchAnimation as _SwitchAnimation,
  WorkspaceColor,
  WorkspaceIconType,
  WORKSPACE_COLORS,
  WORKSPACE_ICONS,
  type WORKSPACE_LAYOUTS as _WORKSPACE_LAYOUTS_TYPE,
  type SWITCH_ANIMATIONS as _SWITCH_ANIMATIONS_TYPE,
  type PRESET_ICONS as _PRESET_ICONS_TYPE,
  getColorHex,
  getIconEmoji,
  formatDuration,
} from '../../lib/services/browser-workspaces-service';
import { logger } from '@/lib/services/logger-service';
import './Workspaces.css';

const log = logger.scope('Workspaces');

// ==================== Icons ====================

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 10C9.1 10 10 9.1 10 8C10 6.9 9.1 6 8 6C6.9 6 6 6.9 6 8C6 9.1 6.9 10 8 10Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14 8C14 8.5 13.9 9 13.8 9.5L15.2 10.6C15.3 10.7 15.4 10.9 15.3 11.1L13.9 13.5C13.8 13.7 13.6 13.7 13.4 13.7L11.7 13C11.3 13.3 10.9 13.5 10.5 13.7L10.2 15.5C10.2 15.7 10 15.9 9.8 15.9H7C6.8 15.9 6.6 15.7 6.6 15.5L6.3 13.7C5.9 13.5 5.5 13.3 5.1 13L3.4 13.7C3.2 13.8 3 13.7 2.9 13.5L1.5 11.1C1.4 10.9 1.5 10.7 1.6 10.6L3 9.5C2.9 9 2.8 8.5 2.8 8C2.8 7.5 2.9 7 3 6.5L1.6 5.4C1.5 5.3 1.4 5.1 1.5 4.9L2.9 2.5C3 2.3 3.2 2.3 3.4 2.3L5.1 3C5.5 2.7 5.9 2.5 6.3 2.3L6.6 0.5C6.6 0.3 6.8 0.1 7 0.1H9.8C10 0.1 10.2 0.3 10.2 0.5L10.5 2.3C10.9 2.5 11.3 2.7 11.7 3L13.4 2.3C13.6 2.2 13.8 2.3 13.9 2.5L15.3 4.9C15.4 5.1 15.3 5.3 15.2 5.4L13.8 6.5C13.9 7 14 7.5 14 8Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4H14M5 4V2H11V4M6 7V12M10 7V12M3 4L4 14H12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArchiveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4H14V6H2V4ZM3 6V14H13V6M6 9H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1V10M4 5L8 1L12 5M3 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const _ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const _ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ==================== Sub-components ====================

interface WorkspaceItemProps {
  workspace: Workspace;
  isActive: boolean;
  showTabCount: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const WorkspaceItem: React.FC<WorkspaceItemProps> = ({
  workspace,
  isActive,
  showTabCount,
  onClick,
  onContextMenu,
}) => {
  const colorHex = getColorHex(workspace.color);
  const emoji = getIconEmoji(workspace.icon);

  const classNames = [
    'workspace-item',
    isActive && 'active',
    workspace.status === 'Sleeping' && 'sleeping',
    workspace.status === 'Archived' && 'archived',
    workspace.pinned && 'pinned',
    workspace.locked && 'locked',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={{ backgroundColor: `${colorHex}20`, borderColor: isActive ? colorHex : 'transparent' }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={workspace.name}
    >
      <span>{emoji}</span>
      {showTabCount && workspace.tabs.length > 0 && (
        <span className="tab-count" style={{ backgroundColor: colorHex }}>
          {workspace.tabs.length}
        </span>
      )}
      <div className="workspace-tooltip">{workspace.name}</div>
    </div>
  );
};

interface TabItemProps {
  tab: WorkspaceTab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onClick, onClose }) => {
  return (
    <div className={`workspace-tab-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      {tab.favicon ? (
        <img src={tab.favicon} alt="" className="workspace-tab-favicon" />
      ) : (
        <div className="workspace-tab-favicon" style={{ background: '#e5e7eb' }} />
      )}
      <span className="workspace-tab-title">{tab.title}</span>
      {tab.pinned && <span className="workspace-tab-pinned">📌</span>}
      <button
        className="workspace-tab-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

interface QuickSwitchModalProps {
  items: QuickSwitchItem[];
  selectedIndex: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (workspaceId: string) => void;
  onClose: () => void;
}

const QuickSwitchModal: React.FC<QuickSwitchModalProps> = ({
  items,
  selectedIndex,
  searchQuery,
  onSearchChange,
  onSelect,
  onClose,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="quick-switch-overlay" onClick={onClose}>
      <div className="quick-switch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-switch-search">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="quick-switch-list">
          {filteredItems.map((item, index) => (
            <div
              key={item.workspace_id}
              className={`quick-switch-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSelect(item.workspace_id)}
            >
              <div
                className="quick-switch-item-icon"
                style={{ backgroundColor: `${getColorHex(item.color)}30` }}
              >
                {getIconEmoji(item.icon)}
              </div>
              <div className="quick-switch-item-info">
                <div className="quick-switch-item-name">{item.name}</div>
                <div className="quick-switch-item-tabs">
                  {item.tab_count} tab{item.tab_count !== 1 ? 's' : ''}
                </div>
              </div>
              {item.keyboard_shortcut && (
                <span className="quick-switch-item-shortcut">
                  {item.keyboard_shortcut}
                </span>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
              No workspaces found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CreateWorkspaceModalProps {
  templates: WorkspaceTemplate[];
  onClose: () => void;
  onCreate: (name: string, templateId?: string, icon?: WorkspaceIconType, color?: WorkspaceColor) => void;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  templates,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>(WORKSPACE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<WorkspaceColor>('Blue');

  const handleSubmit = () => {
    if (!name.trim()) return;
    const icon: WorkspaceIconType = { type: 'Emoji', value: selectedIcon };
    onCreate(name, selectedTemplate || undefined, icon, selectedColor);
    onClose();
  };

  return (
    <div className="quick-switch-overlay" onClick={onClose}>
      <div className="create-workspace-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-workspace-header">
          <h2>Create Workspace</h2>
          <button className="workspace-panel-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="create-workspace-content">
          <div className="create-workspace-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Icon</label>
              <div className="icon-picker">
                {WORKSPACE_ICONS.map((icon) => (
                  <div
                    key={icon}
                    className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {WORKSPACE_COLORS.map((color) => (
                  <div
                    key={color.name}
                    className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setSelectedColor(color.value)}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Start from Template (Optional)</label>
              <div className="template-picker">
                {templates.filter(t => t.is_builtin).map((template) => (
                  <div
                    key={template.id}
                    className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(
                      selectedTemplate === template.id ? null : template.id
                    )}
                  >
                    <div className="template-option-icon">
                      {getIconEmoji(template.icon)}
                    </div>
                    <div className="template-option-name">{template.name}</div>
                    <div className="template-option-desc">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="create-workspace-footer">
          <button className="workspace-action-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="workspace-action-btn primary"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

interface WorkspacePanelProps {
  workspace: Workspace;
  onClose: () => void;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  onPin: (pinned: boolean) => void;
  onLock: (locked: boolean) => void;
  onOpenSettings: () => void;
}

const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  workspace,
  onClose,
  onTabClick,
  onTabClose,
  onArchive,
  onDelete,
  onPin,
  onLock,
  onOpenSettings,
}) => {
  const colorHex = getColorHex(workspace.color);

  return (
    <div className="workspace-panel">
      <div className="workspace-panel-header">
        <h2>Workspace Details</h2>
        <button className="workspace-panel-close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <div className="workspace-details">
        <div className="workspace-info">
          <div
            className="workspace-icon-large"
            style={{ backgroundColor: `${colorHex}30` }}
          >
            {getIconEmoji(workspace.icon)}
          </div>
          <div className="workspace-meta">
            <h3 className="workspace-name">{workspace.name}</h3>
            {workspace.description && (
              <p className="workspace-description">{workspace.description}</p>
            )}
            <div className="workspace-status">
              <span className={`workspace-status-badge ${workspace.status.toLowerCase()}`}>
                {workspace.status}
              </span>
              {workspace.pinned && <span>📌</span>}
              {workspace.locked && <span>🔒</span>}
            </div>
          </div>
        </div>

        <div className="workspace-tabs-section">
          <div className="workspace-tabs-header">
            <h3>Tabs</h3>
            <span className="workspace-tabs-count">{workspace.tabs.length} tabs</span>
          </div>
          <div className="workspace-tabs-list">
            {workspace.tabs.map((tab) => (
              <TabItem
                key={tab.id}
                tab={tab}
                isActive={tab.id === workspace.active_tab_id}
                onClick={() => onTabClick(tab.id)}
                onClose={() => onTabClose(tab.id)}
              />
            ))}
            {workspace.tabs.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>
                No tabs in this workspace
              </div>
            )}
          </div>
        </div>

        <div className="workspace-stats">
          <div className="stat-card">
            <div className="stat-value">{workspace.tabs.length}</div>
            <div className="stat-label">Tabs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatDuration(workspace.total_time_seconds)}</div>
            <div className="stat-label">Time Spent</div>
          </div>
        </div>
      </div>

      <div className="workspace-actions">
        <button
          className="workspace-action-btn"
          onClick={() => onPin(!workspace.pinned)}
        >
          <PinIcon />
          {workspace.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          className="workspace-action-btn"
          onClick={() => onLock(!workspace.locked)}
        >
          <LockIcon />
          {workspace.locked ? 'Unlock' : 'Lock'}
        </button>
        <button className="workspace-action-btn" onClick={onArchive}>
          <ArchiveIcon />
          Archive
        </button>
        <button className="workspace-action-btn" onClick={onOpenSettings}>
          <SettingsIcon />
          Settings
        </button>
        {!workspace.locked && (
          <button className="workspace-action-btn danger" onClick={onDelete}>
            <TrashIcon />
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

// ==================== Main Component ====================

interface WorkspacesProps {
  position?: 'left' | 'top' | 'right';
  onWorkspaceChange?: (workspace: Workspace) => void;
  onTabActivate?: (tabId: string, url: string) => void;
}

export const Workspaces: React.FC<WorkspacesProps> = ({
  position = 'left',
  onWorkspaceChange,
  onTabActivate,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<WorkspaceTemplate[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [_stats, _setStats] = useState<WorkspaceStats | null>(null);

  const [showPanel, setShowPanel] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showQuickSwitch, setShowQuickSwitch] = useState(false);
  const [quickSwitchItems, setQuickSwitchItems] = useState<QuickSwitchItem[]>([]);
  const [quickSwitchIndex, setQuickSwitchIndex] = useState(0);
  const [quickSwitchQuery, setQuickSwitchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ws, activeId, tpl, stg] = await Promise.all([
          workspacesService.getAllWorkspaces(),
          workspacesService.getActiveWorkspaceId(),
          workspacesService.getTemplates(),
          workspacesService.getSettings(),
        ]);
        setWorkspaces(ws);
        setActiveWorkspaceId(activeId);
        setTemplates(tpl);
        setSettings(stg);
      } catch (error) {
        log.error('Failed to load workspace data:', error);
      }
    };
    loadData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick switch: Ctrl/Cmd + Tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        if (!showQuickSwitch) {
          openQuickSwitch();
        } else {
          // Navigate
          if (e.shiftKey) {
            setQuickSwitchIndex((prev) =>
              prev > 0 ? prev - 1 : quickSwitchItems.length - 1
            );
          } else {
            setQuickSwitchIndex((prev) =>
              prev < quickSwitchItems.length - 1 ? prev + 1 : 0
            );
          }
        }
      }

      // Close quick switch on Enter
      if (showQuickSwitch && e.key === 'Enter') {
        const items = quickSwitchItems.filter((item) =>
          item.name.toLowerCase().includes(quickSwitchQuery.toLowerCase())
        );
        if (items[quickSwitchIndex]) {
          handleSwitchWorkspace(items[quickSwitchIndex].workspace_id);
        }
        setShowQuickSwitch(false);
      }

      // Close quick switch on Escape
      if (showQuickSwitch && e.key === 'Escape') {
        setShowQuickSwitch(false);
      }

      // New workspace: Ctrl/Cmd + Shift + N
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setShowCreateModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickSwitch, quickSwitchItems, quickSwitchIndex, quickSwitchQuery]);

  const openQuickSwitch = async () => {
    try {
      const items = await workspacesService.getQuickSwitchItems();
      setQuickSwitchItems(items);
      setQuickSwitchIndex(0);
      setQuickSwitchQuery('');
      setShowQuickSwitch(true);
    } catch (error) {
      log.error('Failed to load quick switch items:', error);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      const workspace = await workspacesService.switchWorkspace(workspaceId);
      setActiveWorkspaceId(workspaceId);
      setWorkspaces((prev) =>
        prev.map((ws) =>
          ws.id === workspaceId
            ? { ...ws, status: 'Active' as const }
            : ws.status === 'Active'
            ? { ...ws, status: 'Sleeping' as const }
            : ws
        )
      );
      onWorkspaceChange?.(workspace);
    } catch (error) {
      log.error('Failed to switch workspace:', error);
    }
  };

  const handleCreateWorkspace = async (
    name: string,
    templateId?: string,
    icon?: WorkspaceIconType,
    color?: WorkspaceColor
  ) => {
    try {
      const workspace = await workspacesService.createWorkspace(name, templateId);
      if (icon || color) {
        await workspacesService.updateWorkspace(workspace.id, undefined, undefined, icon, color);
      }
      setWorkspaces((prev) => [...prev, workspace]);
    } catch (error) {
      log.error('Failed to create workspace:', error);
    }
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    if (workspace.id === activeWorkspaceId) {
      setSelectedWorkspace(workspace);
      setShowPanel(true);
    } else {
      handleSwitchWorkspace(workspace.id);
    }
  };

  const handleTabClick = (tabId: string) => {
    if (selectedWorkspace) {
      const tab = selectedWorkspace.tabs.find((t) => t.id === tabId);
      if (tab) {
        onTabActivate?.(tabId, tab.url);
        workspacesService.setActiveTab(selectedWorkspace.id, tabId).catch(log.error);
      }
    }
  };

  const handleTabClose = async (tabId: string) => {
    if (selectedWorkspace) {
      try {
        await workspacesService.removeTab(selectedWorkspace.id, tabId);
        setSelectedWorkspace((prev) =>
          prev ? { ...prev, tabs: prev.tabs.filter((t) => t.id !== tabId) } : null
        );
        setWorkspaces((prev) =>
          prev.map((ws) =>
            ws.id === selectedWorkspace.id
              ? { ...ws, tabs: ws.tabs.filter((t) => t.id !== tabId) }
              : ws
          )
        );
      } catch (error) {
        log.error('Failed to close tab:', error);
      }
    }
  };

  const handleArchive = async () => {
    if (selectedWorkspace) {
      try {
        await workspacesService.archiveWorkspace(selectedWorkspace.id);
        setWorkspaces((prev) =>
          prev.map((ws) =>
            ws.id === selectedWorkspace.id ? { ...ws, status: 'Archived' as const } : ws
          )
        );
        setShowPanel(false);
      } catch (error) {
        log.error('Failed to archive workspace:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedWorkspace && !selectedWorkspace.locked) {
      if (confirm(`Delete workspace "${selectedWorkspace.name}"?`)) {
        try {
          await workspacesService.deleteWorkspace(selectedWorkspace.id);
          setWorkspaces((prev) => prev.filter((ws) => ws.id !== selectedWorkspace.id));
          setShowPanel(false);
        } catch (error) {
          log.error('Failed to delete workspace:', error);
        }
      }
    }
  };

  const handlePin = async (pinned: boolean) => {
    if (selectedWorkspace) {
      try {
        await workspacesService.pinWorkspace(selectedWorkspace.id, pinned);
        setSelectedWorkspace((prev) => (prev ? { ...prev, pinned } : null));
        setWorkspaces((prev) =>
          prev.map((ws) => (ws.id === selectedWorkspace.id ? { ...ws, pinned } : ws))
        );
      } catch (error) {
        log.error('Failed to pin workspace:', error);
      }
    }
  };

  const handleLock = async (locked: boolean) => {
    if (selectedWorkspace) {
      try {
        await workspacesService.lockWorkspace(selectedWorkspace.id, locked);
        setSelectedWorkspace((prev) => (prev ? { ...prev, locked } : null));
        setWorkspaces((prev) =>
          prev.map((ws) => (ws.id === selectedWorkspace.id ? { ...ws, locked } : ws))
        );
      } catch (error) {
        log.error('Failed to lock workspace:', error);
      }
    }
  };

  const activeWorkspaces = workspaces.filter((ws) => ws.status !== 'Archived');

  return (
    <>
      <div className={`workspace-bar position-${position}`}>
        {activeWorkspaces.map((workspace) => (
          <WorkspaceItem
            key={workspace.id}
            workspace={workspace}
            isActive={workspace.id === activeWorkspaceId}
            showTabCount={settings?.show_tab_count ?? true}
            onClick={() => handleWorkspaceClick(workspace)}
          />
        ))}
        <div className="workspace-add-btn" onClick={() => setShowCreateModal(true)}>
          <PlusIcon />
        </div>
      </div>

      {showPanel && selectedWorkspace && (
        <WorkspacePanel
          workspace={selectedWorkspace}
          onClose={() => setShowPanel(false)}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onPin={handlePin}
          onLock={handleLock}
          onOpenSettings={() => {}}
        />
      )}

      {showQuickSwitch && (
        <QuickSwitchModal
          items={quickSwitchItems}
          selectedIndex={quickSwitchIndex}
          searchQuery={quickSwitchQuery}
          onSearchChange={setQuickSwitchQuery}
          onSelect={(id) => {
            handleSwitchWorkspace(id);
            setShowQuickSwitch(false);
          }}
          onClose={() => setShowQuickSwitch(false)}
        />
      )}

      {showCreateModal && (
        <CreateWorkspaceModal
          templates={templates}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkspace}
        />
      )}
    </>
  );
};

export default Workspaces;
