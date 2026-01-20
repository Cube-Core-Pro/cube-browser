/**
 * Tab Bar Component - Terminal tab management
 * CUBE Nexum Platform v2.0
 */

import React, { useState, useRef } from 'react';
import { TerminalTab } from '../../types/terminal';
import './TabBar.css';

interface TabBarProps {
  tabs: TerminalTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newTitle: string) => void;
  onNewTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabClose,
  onTabRename,
  onNewTab,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = (tab: TerminalTab) => {
    setEditingTabId(tab.id);
    setEditValue(tab.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRename = () => {
    if (editingTabId && editValue.trim()) {
      onTabRename(editingTabId, editValue.trim());
    }
    setEditingTabId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditValue('');
    }
  };

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab)}
          >
            {editingTabId === tab.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="tab-rename-input"
                title="Rename tab"
                aria-label="Tab name"
                placeholder="Tab name"
              />
            ) : (
              <>
                <span className="tab-title">{tab.title}</span>
                <span className="tab-panes">{tab.panes.length}</span>
              </>
            )}
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="Close Tab"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="new-tab-btn" onClick={onNewTab} title="New Tab">
        <span className="icon">+</span>
      </button>
    </div>
  );
};
