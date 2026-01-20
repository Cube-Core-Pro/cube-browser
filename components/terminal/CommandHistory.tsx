/**
 * Command History Component - Terminal command history viewer
 * CUBE Nexum Platform v2.0
 */

import React, { useState, useMemo } from 'react';
import { CommandHistoryEntry, formatDuration } from '../../types/terminal';
import './CommandHistory.css';

interface CommandHistoryProps {
  history: CommandHistoryEntry[];
  onSelect: (entry: CommandHistoryEntry) => void;
  onClose: () => void;
}

export const CommandHistory: React.FC<CommandHistoryProps> = ({
  history,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'duration'>('time');
  const [filterExitCode, setFilterExitCode] = useState<'all' | 'success' | 'error'>('all');

  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.cwd.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by exit code
    if (filterExitCode === 'success') {
      filtered = filtered.filter((entry) => entry.exit_code === 0);
    } else if (filterExitCode === 'error') {
      filtered = filtered.filter((entry) => entry.exit_code !== 0);
    }

    // Sort
    if (sortBy === 'time') {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      filtered.sort((a, b) => b.duration - a.duration);
    }

    return filtered;
  }, [history, searchQuery, sortBy, filterExitCode]);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>Command History</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-filters">
          <input
            type="text"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <div className="filter-buttons">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'time' | 'duration')}
              aria-label="Sort commands by"
              title="Sort commands"
            >
              <option value="time">Sort by Time</option>
              <option value="duration">Sort by Duration</option>
            </select>

            <select
              value={filterExitCode}
              onChange={(e) => setFilterExitCode(e.target.value as 'all' | 'success' | 'error')}
              aria-label="Filter by exit code"
              title="Filter commands"
            >
              <option value="all">All Commands</option>
              <option value="success">Successful</option>
              <option value="error">Errors</option>
            </select>
          </div>
        </div>

        <div className="history-content">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <p>No commands found</p>
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`history-entry ${entry.exit_code !== 0 ? 'error' : ''}`}
                  onClick={() => onSelect(entry)}
                >
                  <div className="entry-header">
                    <code className="command">{entry.command}</code>
                    <span className="timestamp">{formatTimestamp(entry.timestamp)}</span>
                  </div>
                  <div className="entry-meta">
                    <span className="cwd">{entry.cwd}</span>
                    <span className="duration">{formatDuration(entry.duration)}</span>
                    <span className={`exit-code ${entry.exit_code !== 0 ? 'error' : 'success'}`}>
                      Exit: {entry.exit_code}
                    </span>
                  </div>
                  {entry.output && (
                    <div className="entry-output">
                      <pre>{entry.output.slice(0, 200)}{entry.output.length > 200 ? '...' : ''}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="history-footer">
          <span className="count">{filteredHistory.length} commands</span>
        </div>
      </div>
    </div>
  );
};
