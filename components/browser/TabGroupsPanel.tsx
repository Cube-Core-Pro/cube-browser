// TabGroupsPanel.tsx
// CUBE Elite v6 - Tab Groups UI Component
// AI-powered tab management superior to Chrome/Opera/Vivaldi

import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  X,
  Layers,
  Sparkles,
  Settings,
  GripVertical,
  ExternalLink,
  Volume2,
  VolumeX,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  CubeTabGroupsService,
  TabGroup,
  TabMetadata,
  GroupSuggestion,
  TabGroupsConfig,
  TabGroupsStats,
  GroupColor,
  getColorHex,
  getColorName,
} from '@/lib/services/browser-tab-groups-service';
import { logger } from '@/lib/services/logger-service';
import './TabGroupsPanel.css';

const log = logger.scope('TabGroupsPanel');

interface TabGroupsPanelProps {
  onClose?: () => void;
  onTabSelect?: (tabId: string) => void;
  className?: string;
}

const TabGroupsPanel: React.FC<TabGroupsPanelProps> = ({
  onClose = () => {},
  onTabSelect = () => {},
  className = '',
}) => {
  // State
  const [config, setConfig] = useState<TabGroupsConfig | null>(null);
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [ungroupedTabs, setUngroupedTabs] = useState<TabMetadata[]>([]);
  const [suggestions, setSuggestions] = useState<GroupSuggestion[]>([]);
  const [stats, setStats] = useState<TabGroupsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState<GroupColor>('blue');
  const [activeTab, setActiveTab] = useState<'groups' | 'suggestions' | 'settings'>('groups');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'group' | 'tab';
    id: string;
    groupId?: string;
  } | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [configData, groupsData, ungroupedData, suggestionsData, statsData] = await Promise.all([
        CubeTabGroupsService.getConfig(),
        CubeTabGroupsService.getAllGroups(),
        CubeTabGroupsService.getUngroupedTabs(),
        CubeTabGroupsService.getSuggestions(),
        CubeTabGroupsService.getStats(),
      ]);

      setConfig(configData);
      setGroups(CubeTabGroupsService.sortGroups(groupsData));
      setUngroupedTabs(ungroupedData);
      setSuggestions(suggestionsData);
      setStats(statsData);

      // Auto-expand first 3 groups
      const initialExpanded = new Set<string>();
      groupsData.slice(0, 3).forEach(g => initialExpanded.add(g.id));
      setExpandedGroups(initialExpanded);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tab groups';
      setError(errorMessage);
      log.error('Error loading tab groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group actions
  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      await CubeTabGroupsService.createGroup(newGroupName.trim(), newGroupColor);
      setShowNewGroupModal(false);
      setNewGroupName('');
      setNewGroupColor('blue');
      await loadData();
    } catch (err) {
      log.error('Failed to create group:', err);
      setError('Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await CubeTabGroupsService.deleteGroup(groupId);
      await loadData();
    } catch (err) {
      log.error('Failed to delete group:', err);
    }
  };

  const handleRenameGroup = async (groupId: string) => {
    if (!editName.trim()) {
      setEditingGroup(null);
      return;
    }

    try {
      await CubeTabGroupsService.renameGroup(groupId, editName.trim());
      setEditingGroup(null);
      setEditName('');
      await loadData();
    } catch (err) {
      log.error('Failed to rename group:', err);
    }
  };

  const handleSetGroupColor = async (groupId: string, color: GroupColor) => {
    try {
      await CubeTabGroupsService.setGroupColor(groupId, color);
      await loadData();
    } catch (err) {
      log.error('Failed to set group color:', err);
    }
  };

  const handleToggleCollapsed = async (groupId: string) => {
    try {
      await CubeTabGroupsService.toggleCollapsed(groupId);
      await loadData();
    } catch (err) {
      log.error('Failed to toggle collapsed:', err);
    }
  };

  const handlePinGroup = async (groupId: string, pinned: boolean) => {
    try {
      await CubeTabGroupsService.pinGroup(groupId, pinned);
      await loadData();
    } catch (err) {
      log.error('Failed to pin group:', err);
    }
  };

  // Tab actions
  const handleUngroupTab = async (tabId: string) => {
    try {
      await CubeTabGroupsService.ungroupTab(tabId);
      await loadData();
    } catch (err) {
      log.error('Failed to ungroup tab:', err);
    }
  };

  const handleMoveTabToGroup = async (tabId: string, groupId: string) => {
    try {
      await CubeTabGroupsService.moveTabToGroup(tabId, groupId);
      await loadData();
    } catch (err) {
      log.error('Failed to move tab:', err);
    }
  };

  // Suggestion actions
  const handleApplySuggestion = async (suggestion: GroupSuggestion) => {
    try {
      await CubeTabGroupsService.applySuggestion(suggestion);
      await loadData();
    } catch (err) {
      log.error('Failed to apply suggestion:', err);
    }
  };

  // Config actions
  const handleToggleAutoGroup = async () => {
    if (!config) return;
    try {
      await CubeTabGroupsService.setAutoGroup(!config.auto_group_enabled);
      await loadData();
    } catch (err) {
      log.error('Failed to toggle auto group:', err);
    }
  };

  const handleToggleVerticalTabs = async () => {
    if (!config) return;
    try {
      await CubeTabGroupsService.setVerticalTabs(!config.vertical_tabs_enabled);
      await loadData();
    } catch (err) {
      log.error('Failed to toggle vertical tabs:', err);
    }
  };

  const handleToggleStacking = async () => {
    if (!config) return;
    try {
      await CubeTabGroupsService.setStacking(!config.stacking_enabled);
      await loadData();
    } catch (err) {
      log.error('Failed to toggle stacking:', err);
    }
  };

  // Context menu handlers
  const handleContextMenu = (
    e: React.MouseEvent,
    type: 'group' | 'tab',
    id: string,
    groupId?: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      id,
      groupId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Render helpers
  const renderTab = (tab: TabMetadata, groupId?: string) => (
    <div
      key={tab.id}
      className="tab-item"
      onClick={() => onTabSelect(tab.id)}
      onContextMenu={(e) => handleContextMenu(e, 'tab', tab.id, groupId)}
      title={tab.title}
    >
      <div className="tab-drag-handle">
        <GripVertical size={12} />
      </div>
      <div className="tab-favicon">
        {tab.favicon ? (
          <img src={tab.favicon} alt="" />
        ) : (
          <ExternalLink size={14} />
        )}
      </div>
      <div className="tab-info">
        <span className="tab-title">{tab.title || 'Untitled'}</span>
        <span className="tab-domain">{tab.domain}</span>
      </div>
      {tab.playing_audio && (
        <button
          className="tab-audio-btn"
          onClick={(e) => {
            e.stopPropagation();
            // Toggle mute
          }}
          title={tab.muted ? 'Unmute' : 'Mute'}
          type="button"
        >
          {tab.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      )}
    </div>
  );

  const renderGroup = (group: TabGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const isEditing = editingGroup === group.id;
    const colorHex = getColorHex(group.color);
    const colorName = getColorName(group.color);

    return (
      <div
        key={group.id}
        className={`tab-group ${group.pinned ? 'pinned' : ''} ${group.collapsed ? 'collapsed' : ''}`}
        style={{ '--group-color': colorHex } as React.CSSProperties}
      >
        <div
          className="group-header"
          onClick={() => toggleGroupExpanded(group.id)}
          onContextMenu={(e) => handleContextMenu(e, 'group', group.id)}
        >
          <button
            className="group-expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleGroupExpanded(group.id);
            }}
            title={isExpanded ? 'Collapse group' : 'Expand group'}
            type="button"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <div className="group-color-dot" style={{ backgroundColor: colorHex }} />

          {isEditing ? (
            <input
              type="text"
              className="group-name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleRenameGroup(group.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameGroup(group.id);
                if (e.key === 'Escape') {
                  setEditingGroup(null);
                  setEditName('');
                }
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter group name"
              title="Group name"
              aria-label="Group name"
            />
          ) : (
            <span className="group-name">
              {group.icon && <span className="group-icon">{group.icon}</span>}
              {group.name}
            </span>
          )}

          <span className="group-tab-count">{group.tab_ids.length}</span>

          {group.pinned && (
            <Pin size={12} className="group-pin-icon" />
          )}

          {group.auto_generated && (
            <span className="group-auto-icon" title="Auto-generated">
              <Sparkles size={12} />
            </span>
          )}

          <div className="group-actions">
            <button
              className="group-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setEditingGroup(group.id);
                setEditName(group.name);
              }}
              title="Rename group"
              type="button"
            >
              <Edit2 size={12} />
            </button>
            <button
              className="group-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                handlePinGroup(group.id, !group.pinned);
              }}
              title={group.pinned ? 'Unpin group' : 'Pin group'}
              type="button"
            >
              {group.pinned ? <PinOff size={12} /> : <Pin size={12} />}
            </button>
            <button
              className="group-action-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGroup(group.id);
              }}
              title="Delete group"
              type="button"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="group-tabs">
            {group.tab_ids.length > 0 ? (
              // We need to fetch actual tab data - for now show tab IDs
              group.tab_ids.map((tabId) => (
                <div key={tabId} className="tab-item-placeholder">
                  <ExternalLink size={14} />
                  <span>{tabId.substring(0, 8)}...</span>
                </div>
              ))
            ) : (
              <div className="group-empty">
                <span>No tabs in this group</span>
              </div>
            )}

            {group.stacks.length > 0 && (
              <div className="group-stacks">
                <span className="stacks-label">
                  <Layers size={12} /> Stacks ({group.stacks.length})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Color picker dropdown */}
        <div className="group-color-picker">
          {CubeTabGroupsService.getColorOptions().map((opt) => (
            <button
              key={opt.value}
              className={`color-option ${colorName === opt.value ? 'active' : ''}`}
              style={{ backgroundColor: opt.hex }}
              onClick={(e) => {
                e.stopPropagation();
                handleSetGroupColor(group.id, opt.value);
              }}
              title={opt.label}
              type="button"
            />
          ))}
        </div>
      </div>
    );
  };

  const renderSuggestion = (suggestion: GroupSuggestion) => (
    <div key={suggestion.id} className="suggestion-item">
      <div className="suggestion-info">
        <div className="suggestion-header">
          <span
            className="suggestion-color"
            style={{ backgroundColor: getColorHex(suggestion.color) }}
          />
          <span className="suggestion-name">{suggestion.name}</span>
          <span className="suggestion-count">{suggestion.tab_ids.length} tabs</span>
        </div>
        <p className="suggestion-reason">{suggestion.reason}</p>
        <span className="suggestion-confidence">
          {Math.round(suggestion.confidence * 100)}% confidence
        </span>
      </div>
      <button
        className="suggestion-apply-btn"
        onClick={() => handleApplySuggestion(suggestion)}
        title="Apply suggestion"
        type="button"
      >
        <Check size={14} /> Apply
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className={`tab-groups-panel loading ${className}`}>
        <div className="loading-spinner">
          <RefreshCw className="spin" size={24} />
          <span>Loading tab groups...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`tab-groups-panel error ${className}`}>
        <div className="error-message">
          <X size={24} />
          <span>{error}</span>
          <button onClick={loadData} type="button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`tab-groups-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <div className="header-title">
          <FolderOpen size={18} />
          <span>Tab Groups</span>
        </div>
        <div className="header-actions">
          <button
            className="header-btn"
            onClick={() => setShowNewGroupModal(true)}
            title="Create new group"
            type="button"
          >
            <Plus size={16} />
          </button>
          <button
            className="header-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
            type="button"
          >
            <Settings size={16} />
          </button>
          <button
            className="header-btn close"
            onClick={onClose}
            title="Close panel"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="panel-stats">
          <div className="stat">
            <span className="stat-value">{stats.total_tabs}</span>
            <span className="stat-label">Tabs</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.total_groups}</span>
            <span className="stat-label">Groups</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.ungrouped_count}</span>
            <span className="stat-label">Ungrouped</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.stacked_tabs}</span>
            <span className="stat-label">Stacked</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`panel-tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
          type="button"
        >
          <FolderOpen size={14} />
          Groups
        </button>
        <button
          className={`panel-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
          type="button"
        >
          <Sparkles size={14} />
          AI Suggestions
          {suggestions.length > 0 && (
            <span className="badge">{suggestions.length}</span>
          )}
        </button>
        <button
          className={`panel-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          type="button"
        >
          <Settings size={14} />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="panel-content">
        {activeTab === 'groups' && (
          <div className="groups-list">
            {/* Pinned groups first */}
            {groups.filter(g => g.pinned).map(renderGroup)}
            
            {/* Regular groups */}
            {groups.filter(g => !g.pinned).map(renderGroup)}

            {/* Ungrouped tabs */}
            {ungroupedTabs.length > 0 && (
              <div className="ungrouped-section">
                <div className="ungrouped-header">
                  <span>Ungrouped ({ungroupedTabs.length})</span>
                </div>
                <div className="ungrouped-tabs">
                  {ungroupedTabs.map((tab) => renderTab(tab))}
                </div>
              </div>
            )}

            {groups.length === 0 && ungroupedTabs.length === 0 && (
              <div className="empty-state">
                <FolderOpen size={48} />
                <h3>No tabs yet</h3>
                <p>Open some tabs to see them organized here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="suggestions-list">
            {suggestions.length > 0 ? (
              suggestions.map(renderSuggestion)
            ) : (
              <div className="empty-state">
                <Sparkles size={48} />
                <h3>No suggestions</h3>
                <p>AI will suggest tab groups as you browse</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && config && (
          <div className="settings-section">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Auto-group tabs</span>
                <span className="setting-description">
                  Automatically group tabs by domain and category
                </span>
              </div>
              <button
                className={`toggle-btn ${config.auto_group_enabled ? 'on' : 'off'}`}
                onClick={handleToggleAutoGroup}
                title={`Auto-group: ${config.auto_group_enabled ? 'Enabled' : 'Disabled'}`}
                type="button"
              >
                <span className="toggle-slider" />
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Vertical tabs</span>
                <span className="setting-description">
                  Show tabs in a vertical sidebar
                </span>
              </div>
              <button
                className={`toggle-btn ${config.vertical_tabs_enabled ? 'on' : 'off'}`}
                onClick={handleToggleVerticalTabs}
                title={`Vertical tabs: ${config.vertical_tabs_enabled ? 'Enabled' : 'Disabled'}`}
                type="button"
              >
                <span className="toggle-slider" />
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Tab stacking</span>
                <span className="setting-description">
                  Allow stacking tabs within groups (Vivaldi-style)
                </span>
              </div>
              <button
                className={`toggle-btn ${config.stacking_enabled ? 'on' : 'off'}`}
                onClick={handleToggleStacking}
                title={`Tab stacking: ${config.stacking_enabled ? 'Enabled' : 'Disabled'}`}
                type="button"
              >
                <span className="toggle-slider" />
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">AI suggestions</span>
                <span className="setting-description">
                  Get AI-powered suggestions for organizing tabs
                </span>
              </div>
              <button
                className={`toggle-btn ${config.ai_suggestions_enabled ? 'on' : 'off'}`}
                onClick={async () => {
                  const newConfig = { ...config, ai_suggestions_enabled: !config.ai_suggestions_enabled };
                  await CubeTabGroupsService.setConfig(newConfig);
                  await loadData();
                }}
                title={`AI suggestions: ${config.ai_suggestions_enabled ? 'Enabled' : 'Disabled'}`}
                type="button"
              >
                <span className="toggle-slider" />
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Show tab count</span>
                <span className="setting-description">
                  Display number of tabs in each group
                </span>
              </div>
              <button
                className={`toggle-btn ${config.show_tab_count ? 'on' : 'off'}`}
                onClick={async () => {
                  const newConfig = { ...config, show_tab_count: !config.show_tab_count };
                  await CubeTabGroupsService.setConfig(newConfig);
                  await loadData();
                }}
                title={`Show tab count: ${config.show_tab_count ? 'Enabled' : 'Disabled'}`}
                type="button"
              >
                <span className="toggle-slider" />
              </button>
            </div>

            <div className="settings-rules">
              <h4>Grouping Rules ({config.grouping_rules.length})</h4>
              {config.grouping_rules.slice(0, 5).map((rule) => (
                <div key={rule.id} className="rule-item">
                  <span
                    className="rule-color"
                    style={{ backgroundColor: getColorHex(rule.group_color) }}
                  />
                  <span className="rule-name">{rule.name}</span>
                  <span className="rule-enabled">
                    {rule.enabled ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="modal-overlay" onClick={() => setShowNewGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Group</h3>
              <button
                className="modal-close"
                onClick={() => setShowNewGroupModal(false)}
                title="Close"
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="group-name-input">Group Name</label>
                <input
                  id="group-name-input"
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-options">
                  {CubeTabGroupsService.getColorOptions().map((opt) => (
                    <button
                      key={opt.value}
                      className={`color-option ${newGroupColor === opt.value ? 'active' : ''}`}
                      style={{ backgroundColor: opt.hex }}
                      onClick={() => setNewGroupColor(opt.value)}
                      title={opt.label}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowNewGroupModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                type="button"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={closeContextMenu}
        >
          {contextMenu.type === 'group' && (
            <>
              <button
                className="context-menu-item"
                onClick={() => {
                  const group = groups.find(g => g.id === contextMenu.id);
                  if (group) {
                    setEditingGroup(contextMenu.id);
                    setEditName(group.name);
                  }
                }}
                type="button"
              >
                <Edit2 size={14} /> Rename
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  const group = groups.find(g => g.id === contextMenu.id);
                  if (group) handlePinGroup(contextMenu.id, !group.pinned);
                }}
                type="button"
              >
                <Pin size={14} /> {groups.find(g => g.id === contextMenu.id)?.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                className="context-menu-item"
                onClick={() => handleToggleCollapsed(contextMenu.id)}
                type="button"
              >
                <ChevronDown size={14} /> Toggle Collapse
              </button>
              <div className="context-menu-divider" />
              <button
                className="context-menu-item danger"
                onClick={() => handleDeleteGroup(contextMenu.id)}
                type="button"
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
          {contextMenu.type === 'tab' && (
            <>
              <button
                className="context-menu-item"
                onClick={() => onTabSelect(contextMenu.id)}
                type="button"
              >
                <ExternalLink size={14} /> Go to Tab
              </button>
              {contextMenu.groupId && (
                <button
                  className="context-menu-item"
                  onClick={() => handleUngroupTab(contextMenu.id)}
                  type="button"
                >
                  <X size={14} /> Remove from Group
                </button>
              )}
              <div className="context-menu-divider" />
              <span className="context-menu-label">Move to Group:</span>
              {groups.slice(0, 5).map((group) => (
                <button
                  key={group.id}
                  className="context-menu-item"
                  onClick={() => handleMoveTabToGroup(contextMenu.id, group.id)}
                  type="button"
                >
                  <span
                    className="context-menu-color"
                    style={{ backgroundColor: getColorHex(group.color) }}
                  />
                  {group.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TabGroupsPanel;
