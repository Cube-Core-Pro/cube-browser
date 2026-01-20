/**
 * LogsViewer Component
 * 
 * Advanced logs viewer with:
 * - Real-time log streaming
 * - Multi-criteria filtering
 * - Search by keyword
 * - Level filtering
 * - Date range selection
 * - Export to JSON/CSV/TXT
 * 
 * @component
 */

'use client';

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('LogsViewer');

import React, { useState, useEffect, useCallback } from 'react';
import { LogsService } from '@/lib/services/monitoring-service';
import type { LogEntry, LogFilter } from '@/lib/services/monitoring-service';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Trash2,
  Calendar,
  FileJson,
  FileText,
  File,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import './LogsViewer.css';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [workflowId, setWorkflowId] = useState('');
  const [executionId, setExecutionId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(500);
  
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filter: LogFilter = {
        limit,
      };

      if (workflowId) filter.workflow_id = workflowId;
      if (executionId) filter.execution_id = executionId;
      if (selectedLevel !== 'all') filter.level = selectedLevel as LogFilter['level'];
      if (startDate) filter.start_time = new Date(startDate).toISOString();
      if (endDate) filter.end_time = new Date(endDate).toISOString();
      if (keyword) filter.keyword = keyword;

      const result = await LogsService.get(filter);
      setLogs(result);
      setFilteredLogs(result);
    } catch (error) {
      log.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadLogs();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, workflowId, executionId, selectedLevel, startDate, endDate, keyword, limit]);

  const handleExport = async (format: 'json' | 'csv' | 'txt') => {
    try {
      const filter: LogFilter = {
        workflow_id: workflowId || undefined,
        execution_id: executionId || undefined,
        level: selectedLevel !== 'all' ? (selectedLevel as LogFilter['level']) : undefined,
        start_time: startDate ? new Date(startDate).toISOString() : undefined,
        end_time: endDate ? new Date(endDate).toISOString() : undefined,
        keyword: keyword || undefined,
      };

      const extensions = {
        json: ['json'],
        csv: ['csv'],
        txt: ['txt'],
      };

      const defaultPath = `logs-${Date.now()}.${format}`;
      
      const path = await save({
        defaultPath,
        filters: [{
          name: `${format.toUpperCase()} Files`,
          extensions: extensions[format],
        }],
      });

      if (!path) return;

      let result: string;
      switch (format) {
        case 'json':
          result = await LogsService.exportJson(filter, path);
          break;
        case 'csv':
          result = await LogsService.exportCsv(filter, path);
          break;
        case 'txt':
          result = await LogsService.exportTxt(filter, path);
          break;
      }

      showToast('success', `Logs exported successfully to ${result}`);
    } catch (error) {
      showToast('error', `Export failed: ${error}`);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear all logs? This action cannot be undone.')) return;

    try {
      const count = await invoke<number>('logs_clear');
      showToast('success', `Cleared ${count} logs`);
      setLogs([]);
      setFilteredLogs([]);
    } catch (error) {
      showToast('error', `Failed to clear logs: ${error}`);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="logs-viewer">
      <div className="logs-header">
        <h1>
          <FileText className="header-icon" />
          Logs Viewer
        </h1>
        <div className="header-stats">
          <span className="log-count">
            {filteredLogs.length} logs
            {filteredLogs.length !== logs.length && ` (${logs.length} total)`}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="filter-row">
          <div className="filter-group search-group">
            <Search className="filter-icon" />
            <input
              type="text"
              placeholder="Search logs..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="filter-select"
              title="Filter by log level"
              aria-label="Filter logs by level"
            >
              <option value="all">All Levels</option>
              <option value="Debug">Debug</option>
              <option value="Info">Info</option>
              <option value="Warn">Warn</option>
              <option value="Error">Error</option>
            </select>
          </div>

          <div className="filter-group">
            <input
              type="number"
              placeholder="Limit"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 500)}
              className="filter-input small"
              min="10"
              max="10000"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Workflow ID"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <input
              type="text"
              placeholder="Execution ID"
              value={executionId}
              onChange={(e) => setExecutionId(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group date-group">
            <Calendar className="filter-icon" />
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="filter-input"
              placeholder="Start Date"
            />
          </div>

          <div className="filter-group date-group">
            <Calendar className="filter-icon" />
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="filter-input"
              placeholder="End Date"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={loadLogs} className="action-button primary">
            <RefreshCw className="w-4 h-4" />
            Apply Filters
          </button>

          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (3s)
          </label>

          <div className="export-buttons">
            <button onClick={() => handleExport('json')} className="action-button">
              <FileJson className="w-4 h-4" />
              JSON
            </button>
            <button onClick={() => handleExport('csv')} className="action-button">
              <File className="w-4 h-4" />
              CSV
            </button>
            <button onClick={() => handleExport('txt')} className="action-button">
              <FileText className="w-4 h-4" />
              TXT
            </button>
          </div>

          <button onClick={handleClearLogs} className="action-button danger">
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="logs-container">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinning" />
            Loading logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            No logs found matching your filters
          </div>
        ) : (
          <div className="logs-table">
            {filteredLogs.map((log) => (
              <div key={log.id} className="log-row">
                <div className="log-cell timestamp">
                  {formatTimestamp(log.timestamp)}
                </div>
                <div className="log-cell level">
                  <span
                    className={`level-badge level-${log.level.toLowerCase()}`}
                  >
                    {log.level}
                  </span>
                </div>
                <div className="log-cell ids">
                  {log.workflow_id && (
                    <span className="id-badge workflow">WF: {log.workflow_id.slice(0, 8)}</span>
                  )}
                  {log.execution_id && (
                    <span className="id-badge execution">EX: {log.execution_id.slice(0, 8)}</span>
                  )}
                  {log.node_id && (
                    <span className="id-badge node">N: {log.node_id.slice(0, 8)}</span>
                  )}
                </div>
                <div className="log-cell message">
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {toast.type === 'info' && <FileText className="w-4 h-4" />}
              <span>{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="toast-dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
