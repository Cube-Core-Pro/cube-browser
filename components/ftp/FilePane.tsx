'use client';

import React, { useState, useMemo } from 'react';
import {
  FtpEntry,
  LocalEntry,
  PaneState,
  PaneType,
  FtpProtocol,
  formatFileSize,
  formatTimestamp,
  getFileIcon,
  sortEntries,
  filterEntries,
  getParentPath,
} from '../../types/ftp';
import './FilePane.css';

interface FilePaneProps {
  paneType: PaneType;
  state: PaneState;
  connected?: boolean;
  protocol?: FtpProtocol;
  onNavigate: (path: string) => void;
  onSelectionChange: (selected: string[]) => void;
  onRefresh: () => void;
  onDelete?: () => void;
  onRename?: (oldName: string, newName: string) => void;
  onCreateDir?: (dirName: string) => void;
  onChmod?: (filename: string, mode: number) => void;
  onSortChange: (sortBy: 'name' | 'size' | 'modified' | 'type', sortOrder: 'asc' | 'desc') => void;
}

/**
 * FilePane Component
 * 
 * File browser pane for local or remote files with:
 * - Directory navigation
 * - File selection
 * - Sorting and filtering
 * - Context menu actions
 */
export default function FilePane({
  paneType,
  state,
  connected = true,
  protocol,
  onNavigate,
  onSelectionChange,
  onRefresh,
  onDelete,
  onRename,
  onCreateDir,
  onChmod,
  onSortChange,
}: FilePaneProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    entry: FtpEntry | LocalEntry;
  } | null>(null);
  const [renameEntry, setRenameEntry] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showCreateDir, setShowCreateDir] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [showChmod, setShowChmod] = useState<string | null>(null);
  const [chmodValue, setChmodValue] = useState('644');

  const isRemote = paneType === 'remote';
  const canOperate = isRemote ? connected : true;

  // Filter and sort entries
  const displayEntries = useMemo(() => {
    const filtered = filterEntries(state.entries, searchTerm);
    return sortEntries(filtered, state.sort_by, state.sort_order);
  }, [state.entries, state.sort_by, state.sort_order, searchTerm]);

  // Handle entry click
  const handleEntryClick = (entry: FtpEntry | LocalEntry, isDoubleClick: boolean) => {
    if (isDoubleClick && entry.is_directory) {
      // Navigate into directory
      onNavigate(entry.path);
    } else {
      // Toggle selection
      const isSelected = state.selected.includes(entry.name);
      
      if (isSelected) {
        onSelectionChange(state.selected.filter((s) => s !== entry.name));
      } else {
        onSelectionChange([...state.selected, entry.name]);
      }
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, entry: FtpEntry | LocalEntry) => {
    e.preventDefault();
    
    if (!canOperate) return;
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      entry,
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Handle rename
  const handleRenameStart = (entry: FtpEntry | LocalEntry) => {
    setRenameEntry(entry.name);
    setNewName(entry.name);
    closeContextMenu();
  };

  const handleRenameSubmit = () => {
    if (renameEntry && newName && newName !== renameEntry && onRename) {
      onRename(renameEntry, newName);
      setRenameEntry(null);
      setNewName('');
    }
  };

  const handleRenameCancel = () => {
    setRenameEntry(null);
    setNewName('');
  };

  // Handle create directory
  const handleCreateDirStart = () => {
    setShowCreateDir(true);
    closeContextMenu();
  };

  const handleCreateDirSubmit = () => {
    if (newDirName && onCreateDir) {
      onCreateDir(newDirName);
      setShowCreateDir(false);
      setNewDirName('');
    }
  };

  // Handle chmod
  const handleChmodStart = (entry: FtpEntry | LocalEntry) => {
    if (protocol === 'sftp') {
      setShowChmod(entry.name);
      setChmodValue('644');
      closeContextMenu();
    }
  };

  const handleChmodSubmit = () => {
    if (showChmod && onChmod) {
      const mode = parseInt(chmodValue, 8);
      onChmod(showChmod, mode);
      setShowChmod(null);
      setChmodValue('644');
    }
  };

  // Navigate up
  const handleNavigateUp = () => {
    const parent = getParentPath(state.current_path);
    if (parent !== state.current_path) {
      onNavigate(parent);
    }
  };

  // Toggle sort order
  const handleSort = (sortBy: 'name' | 'size' | 'modified' | 'type') => {
    const newOrder = state.sort_by === sortBy && state.sort_order === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newOrder);
  };

  return (
    <div className={`file-pane ${paneType}-pane`} onClick={closeContextMenu} data-tour={`${paneType}-pane`}>
      {/* Header */}
      <div className="file-pane-header">
        <div className="pane-title">
          {isRemote ? 'Remote' : 'Local'} Files
        </div>
        
        {/* Toolbar */}
        <div className="pane-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <button
            className="btn-icon"
            onClick={onRefresh}
            disabled={!canOperate || state.loading}
            title="Refresh"
          >
            🔄
          </button>
          
          {isRemote && onCreateDir && (
            <button
              className="btn-icon"
              onClick={handleCreateDirStart}
              disabled={!canOperate}
              title="New folder"
            >
              📁+
            </button>
          )}
          
          {isRemote && onDelete && state.selected.length > 0 && (
            <button
              className="btn-icon btn-danger"
              onClick={onDelete}
              disabled={!canOperate}
              title="Delete selected"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Path Navigation */}
      <div className="path-nav" data-tour="path-navigation">
        <button
          className="btn-nav"
          onClick={handleNavigateUp}
          disabled={!canOperate || state.current_path === '/'}
          title="Go up"
        >
          ⬆️
        </button>
        
        <div className="current-path">{state.current_path}</div>
      </div>

      {/* Column Headers */}
      <div className="file-list-header">
        <div
          className="col-name"
          onClick={() => handleSort('name')}
        >
          Name {state.sort_by === 'name' && (state.sort_order === 'asc' ? '▲' : '▼')}
        </div>
        <div
          className="col-size"
          onClick={() => handleSort('size')}
        >
          Size {state.sort_by === 'size' && (state.sort_order === 'asc' ? '▲' : '▼')}
        </div>
        <div
          className="col-modified"
          onClick={() => handleSort('modified')}
        >
          Modified {state.sort_by === 'modified' && (state.sort_order === 'asc' ? '▲' : '▼')}
        </div>
        {isRemote && <div className="col-perms">Permissions</div>}
      </div>

      {/* File List */}
      <div className="file-list">
        {state.loading ? (
          <div className="file-list-empty">
            <div className="loading-spinner" />
            <span>Loading...</span>
          </div>
        ) : state.error ? (
          <div className="file-list-empty error">
            <span>⚠️</span>
            <span>{state.error}</span>
          </div>
        ) : !canOperate ? (
          <div className="file-list-empty">
            <span>🔌</span>
            <span>Not connected</span>
          </div>
        ) : displayEntries.length === 0 ? (
          <div className="file-list-empty">
            <span>📭</span>
            <span>Empty directory</span>
          </div>
        ) : (
          displayEntries.map((entry) => {
            const isSelected = state.selected.includes(entry.name);
            const isRenaming = renameEntry === entry.name;
            
            return (
              <div
                key={entry.name}
                className={`file-item ${isSelected ? 'selected' : ''} ${
                  entry.is_directory ? 'directory' : 'file'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEntryClick(entry, false);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleEntryClick(entry, true);
                }}
                onContextMenu={(e) => handleContextMenu(e, entry)}
              >
                <div className="file-item-name">
                  <span className="file-icon">
                    {getFileIcon(entry.name, entry.is_directory)}
                  </span>
                  
                  {isRenaming ? (
                    <input
                      type="text"
                      className="rename-input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={handleRenameCancel}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') handleRenameCancel();
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      title="Enter new filename"
                      aria-label="Rename file"
                      placeholder="Enter new name"
                    />
                  ) : (
                    <span className="file-name">{entry.name}</span>
                  )}
                </div>
                
                <div className="file-item-size">
                  {entry.is_directory ? '—' : formatFileSize(entry.size)}
                </div>
                
                <div className="file-item-modified">
                  {formatTimestamp(entry.modified)}
                </div>
                
                {isRemote && (
                  <div className="file-item-perms">
                    {'permissions' in entry ? entry.permissions : '—'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          ref={(el) => { if (el) { el.style.left = `${contextMenu.x}px`; el.style.top = `${contextMenu.y}px`; } }}
          onClick={(e) => e.stopPropagation()}
        >
          {isRemote && onRename && (
            <button
              className="context-menu-item"
              onClick={() => handleRenameStart(contextMenu.entry)}
            >
              ✏️ Rename
            </button>
          )}
          
          {isRemote && onDelete && (
            <button
              className="context-menu-item danger"
              onClick={() => {
                onDelete();
                closeContextMenu();
              }}
            >
              🗑️ Delete
            </button>
          )}
          
          {isRemote && protocol === 'sftp' && onChmod && !contextMenu.entry.is_directory && (
            <button
              className="context-menu-item"
              onClick={() => handleChmodStart(contextMenu.entry)}
            >
              🔐 Permissions
            </button>
          )}
        </div>
      )}

      {/* Create Directory Dialog */}
      {showCreateDir && (
        <div className="modal-overlay" onClick={() => setShowCreateDir(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Directory</h3>
            
            <input
              type="text"
              className="input-field"
              placeholder="Directory name"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateDirSubmit();
                if (e.key === 'Escape') setShowCreateDir(false);
              }}
              autoFocus
            />
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateDir(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateDirSubmit}
                disabled={!newDirName}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chmod Dialog */}
      {showChmod && (
        <div className="modal-overlay" onClick={() => setShowChmod(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Permissions</h3>
            <p className="modal-subtitle">File: {showChmod}</p>
            
            <div className="chmod-input">
              <label>Octal mode:</label>
              <input
                type="text"
                className="input-field"
                placeholder="644"
                value={chmodValue}
                onChange={(e) => setChmodValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleChmodSubmit();
                  if (e.key === 'Escape') setShowChmod(null);
                }}
                autoFocus
              />
            </div>
            
            <div className="chmod-presets">
              <button onClick={() => setChmodValue('644')}>644 (rw-r--r--)</button>
              <button onClick={() => setChmodValue('755')}>755 (rwxr-xr-x)</button>
              <button onClick={() => setChmodValue('600')}>600 (rw-------)</button>
              <button onClick={() => setChmodValue('777')}>777 (rwxrwxrwx)</button>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowChmod(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleChmodSubmit}
                disabled={!chmodValue}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
