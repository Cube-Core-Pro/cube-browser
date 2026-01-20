import React, { useState, useCallback } from 'react';
import { logger } from '@/lib/services/logger-service';
import { ConnectionLog } from '../../types/vpn';
import './ConnectionLogs.css';

const log = logger.scope('ConnectionLogs');

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ConnectionLogsProps {
  logs: ConnectionLog[];
  onRefresh: () => Promise<void>;
}

type LogFilter = 'all' | 'connect' | 'disconnect' | 'config' | 'error';

/**
 * ConnectionLogs Component
 * 
 * Displays VPN connection logs with:
 * - Chronological log display
 * - Filter by event type
 * - Success/failure indicators
 * - Timestamp formatting
 * - Log export capability
 */
export const ConnectionLogs: React.FC<ConnectionLogsProps> = ({
  logs,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<LogFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  /**
   * Format timestamp to readable date/time
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    // If within last minute
    if (diff < 60) {
      return 'Just now';
    }

    // If within last hour
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    // If today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Otherwise full date
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get event type display name
   */
  const getEventName = (event: string): string => {
    const names: Record<string, string> = {
      connect: 'Connected',
      disconnect: 'Disconnected',
      config_update: 'Config Updated',
      kill_switch: 'Kill Switch',
      split_tunnel: 'Split Tunneling',
      refresh_servers: 'Servers Refreshed',
    };
    return names[event] || event;
  };

  /**
   * Get event icon
   */
  const getEventIcon = (event: string) => {
    switch (event) {
      case 'connect':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'disconnect':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'config_update':
      case 'kill_switch':
      case 'split_tunnel':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'refresh_servers':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  /**
   * Filter logs
   */
  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'error') return !log.success;
    if (filter === 'connect' || filter === 'disconnect') return log.event === filter;
    if (filter === 'config')
      return ['config_update', 'kill_switch', 'split_tunnel'].includes(log.event);
    return true;
  });

  /**
   * Sort logs by timestamp (newest first)
   */
  const sortedLogs = [...filteredLogs].sort((a, b) => b.timestamp - a.timestamp);

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      log.error('Failed to refresh logs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Export logs to JSON
   */
  const handleExport = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpn-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Clear logs
   */
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      // Note: This would need a backend command to actually clear logs
      showToast('info', 'Clear logs functionality requires backend implementation');
    }
  };

  return (
    <div className="connection-logs">
      {/* Header */}
      <div className="logs-header">
        <div className="header-left">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Connection Logs
          </h2>
          <span className="log-count">
            {sortedLogs.length} log{sortedLogs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="header-actions">
          <button onClick={handleRefresh} disabled={refreshing} className="btn-refresh-logs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={refreshing ? 'spinning' : ''}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button onClick={handleExport} className="btn-export">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button onClick={handleClear} className="btn-clear">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        <button
          className={`filter-button ${filter === 'connect' ? 'active' : ''}`}
          onClick={() => setFilter('connect')}
        >
          Connections
        </button>
        <button
          className={`filter-button ${filter === 'disconnect' ? 'active' : ''}`}
          onClick={() => setFilter('disconnect')}
        >
          Disconnections
        </button>
        <button
          className={`filter-button ${filter === 'config' ? 'active' : ''}`}
          onClick={() => setFilter('config')}
        >
          Configuration
        </button>
        <button
          className={`filter-button ${filter === 'error' ? 'active' : ''}`}
          onClick={() => setFilter('error')}
        >
          Errors
        </button>
      </div>

      {/* Logs List */}
      {sortedLogs.length === 0 ? (
        <div className="empty-logs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3>No logs found</h3>
          <p>
            {filter === 'all'
              ? 'Connection logs will appear here'
              : `No ${filter} events found. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="logs-list">
          {sortedLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className={`log-item ${log.success ? 'success' : 'error'}`}
            >
              <div className="log-icon">{getEventIcon(log.event)}</div>
              <div className="log-content">
                <div className="log-header">
                  <div className="log-event-name">{getEventName(log.event)}</div>
                  <div className="log-timestamp">{formatTimestamp(log.timestamp)}</div>
                </div>
                {log.server && (
                  <div className="log-server">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    {log.server}
                  </div>
                )}
                <div className="log-message">{log.message}</div>
              </div>
              <div className={`log-status ${log.success ? 'success' : 'error'}`}>
                {log.success ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
