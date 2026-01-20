/**
 * ScheduleBuilder Component
 * 
 * Visual cron expression builder and schedule manager.
 * Allows users to schedule workflows with cron expressions or intervals.
 * 
 * Features:
 * - Visual cron builder with presets
 * - Validate cron expressions with next run preview
 * - Interval-based scheduling
 * - One-time execution scheduling
 * - Retry policy configuration
 * - Schedule enable/disable
 * 
 * @component
 */

'use client';

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ScheduleBuilder');

import React, { useState, useEffect, useCallback } from 'react';
import { SchedulerService } from '@/lib/services/workflow-service';
import { Clock, Calendar, Repeat, Play, Pause, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';
import './ScheduleBuilder.css';

// Toast notification type
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ScheduledWorkflow {
  id: string;
  workflow_id: string;
  workflow_name: string;
  schedule_type: ScheduleType;
  cron_expression?: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  run_count: number;
  retry_policy: RetryPolicy;
}

interface ScheduleType {
  type: 'Cron' | 'Interval' | 'Once' | 'Event';
  expression?: string;
  seconds?: number;
  at?: string;
  event_type?: string;
}

interface RetryPolicy {
  max_retries: number;
  retry_delay_seconds: number;
  exponential_backoff: boolean;
}

interface ExecutionQueueItem {
  id: string;
  workflow_id: string;
  scheduled_id: string;
  scheduled_time: string;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Retrying' | 'Cancelled';
  retry_count: number;
  error?: string;
}

interface ScheduleBuilderProps {
  workflowId: string;
  workflowName: string;
  onClose: () => void;
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({
  workflowId,
  workflowName,
  onClose,
}) => {
  const [scheduleType, setScheduleType] = useState<'cron' | 'interval' | 'once'>('cron');
  const [cronExpression, setCronExpression] = useState('0 0 * * *'); // Daily at midnight
  const [intervalSeconds, setIntervalSeconds] = useState(3600); // 1 hour
  const [onceAt, setOnceAt] = useState('');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [cronError, setCronError] = useState<string | null>(null);
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryDelay, setRetryDelay] = useState(60);
  const [exponentialBackoff, setExponentialBackoff] = useState(true);
  const [schedules, setSchedules] = useState<ScheduledWorkflow[]>([]);
  const [queue, setQueue] = useState<ExecutionQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Cron presets
  const cronPresets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Daily at 9 AM', value: '0 9 * * *' },
    { label: 'Weekly on Monday', value: '0 0 * * 1' },
    { label: 'Monthly on 1st', value: '0 0 1 * *' },
  ];

  // Validate cron expression
  const validateCron = async (expression: string) => {
    try {
      const runs = await SchedulerService.validateCron(expression);
      setNextRuns(runs);
      setCronError(null);
    } catch (error) {
      setCronError(error as string);
      setNextRuns([]);
    }
  };

  useEffect(() => {
    if (scheduleType === 'cron') {
      validateCron(cronExpression);
    }
  }, [cronExpression, scheduleType]);

  useEffect(() => {
    loadSchedules();
    loadQueue();
  }, []);

  const loadSchedules = async () => {
    try {
      const all = await SchedulerService.getSchedules();
      setSchedules(all);
    } catch (error) {
      log.error('Failed to load schedules:', error);
    }
  };

  const loadQueue = async () => {
    try {
      const items = await SchedulerService.getQueue();
      setQueue(items);
    } catch (error) {
      log.error('Failed to load queue:', error);
    }
  };

  const handleCreateSchedule = async () => {
    setLoading(true);
    try {
      const schedule: ScheduledWorkflow = {
        id: `schedule-${Date.now()}`,
        workflow_id: workflowId,
        workflow_name: workflowName,
        schedule_type:
          scheduleType === 'cron'
            ? { type: 'Cron', expression: cronExpression }
            : scheduleType === 'interval'
            ? { type: 'Interval', seconds: intervalSeconds }
            : { type: 'Once', at: onceAt },
        cron_expression: scheduleType === 'cron' ? cronExpression : undefined,
        enabled: true,
        run_count: 0,
        retry_policy: {
          max_retries: maxRetries,
          retry_delay_seconds: retryDelay,
          exponential_backoff: exponentialBackoff,
        },
      };

      await SchedulerService.addSchedule(schedule);
      await SchedulerService.start(); // Ensure scheduler is running
      await loadSchedules();
      showToast('success', 'Schedule created successfully!');
    } catch (error) {
      showToast('error', `Failed to create schedule: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      await SchedulerService.toggleSchedule(scheduleId, enabled);
      await loadSchedules();
      showToast('success', `Schedule ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      showToast('error', `Failed to toggle schedule: ${error}`);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Delete this schedule?')) return;
    try {
      await SchedulerService.removeSchedule(scheduleId);
      await loadSchedules();
      showToast('success', 'Schedule deleted');
    } catch (error) {
      showToast('error', `Failed to delete schedule: ${error}`);
    }
  };

  const handleCancelExecution = async (executionId: string) => {
    try {
      await SchedulerService.cancelExecution(executionId);
      await loadQueue();
      showToast('success', 'Execution cancelled');
    } catch (error) {
      showToast('error', `Failed to cancel execution: ${error}`);
    }
  };

  return (
    <div className="schedule-builder">
      <div className="schedule-builder-header">
        <h2>Schedule Workflow: {workflowName}</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="schedule-builder-content">
        {/* Schedule Type Selector */}
        <div className="schedule-type-selector">
          <button
            className={scheduleType === 'cron' ? 'active' : ''}
            onClick={() => setScheduleType('cron')}
          >
            <Clock className="w-4 h-4" />
            Cron Schedule
          </button>
          <button
            className={scheduleType === 'interval' ? 'active' : ''}
            onClick={() => setScheduleType('interval')}
          >
            <Repeat className="w-4 h-4" />
            Interval
          </button>
          <button
            className={scheduleType === 'once' ? 'active' : ''}
            onClick={() => setScheduleType('once')}
          >
            <Calendar className="w-4 h-4" />
            One-Time
          </button>
        </div>

        {/* Cron Schedule */}
        {scheduleType === 'cron' && (
          <div className="schedule-config">
            <div className="form-group">
              <label>Cron Expression:</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 0 * * *"
              />
              {cronError && (
                <div className="error-message">
                  <AlertCircle className="w-4 h-4" />
                  {cronError}
                </div>
              )}
            </div>

            <div className="cron-presets">
              <label>Presets:</label>
              <div className="preset-buttons">
                {cronPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setCronExpression(preset.value)}
                    className="preset-button"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {nextRuns.length > 0 && (
              <div className="next-runs">
                <label>Next 5 runs:</label>
                <ul>
                  {nextRuns.map((run, i) => (
                    <li key={i}>{run}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Interval Schedule */}
        {scheduleType === 'interval' && (
          <div className="schedule-config">
            <div className="form-group">
              <label>Interval (seconds):</label>
              <input
                type="number"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
                min="60"
              />
              <span className="helper-text">
                = {Math.floor(intervalSeconds / 60)} minutes
              </span>
            </div>
          </div>
        )}

        {/* One-Time Schedule */}
        {scheduleType === 'once' && (
          <div className="schedule-config">
            <div className="form-group">
              <label>Execute at:</label>
              <input
                type="datetime-local"
                value={onceAt}
                onChange={(e) => setOnceAt(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Retry Policy */}
        <div className="retry-policy">
          <h3>Retry Policy</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Max Retries:</label>
              <input
                type="number"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                min="0"
                max="10"
              />
            </div>
            <div className="form-group">
              <label>Retry Delay (seconds):</label>
              <input
                type="number"
                value={retryDelay}
                onChange={(e) => setRetryDelay(parseInt(e.target.value))}
                min="10"
              />
            </div>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={exponentialBackoff}
                onChange={(e) => setExponentialBackoff(e.target.checked)}
              />
              Exponential Backoff
            </label>
          </div>
        </div>

        <button
          onClick={handleCreateSchedule}
          disabled={loading || (scheduleType === 'cron' && !!cronError)}
          className="create-schedule-button"
        >
          Create Schedule
        </button>

        {/* Existing Schedules */}
        <div className="existing-schedules">
          <h3>Active Schedules</h3>
          {schedules.length === 0 ? (
            <p className="empty-state">No schedules yet</p>
          ) : (
            <div className="schedules-list">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="schedule-item">
                  <div className="schedule-info">
                    <strong>{schedule.workflow_name}</strong>
                    <span className="schedule-type">
                      {schedule.schedule_type.type}
                      {schedule.cron_expression && `: ${schedule.cron_expression}`}
                    </span>
                    {schedule.next_run && (
                      <span className="next-run">Next: {schedule.next_run}</span>
                    )}
                    <span className="run-count">Runs: {schedule.run_count}</span>
                  </div>
                  <div className="schedule-actions">
                    <button
                      onClick={() => handleToggleSchedule(schedule.id, !schedule.enabled)}
                      className={schedule.enabled ? 'pause-button' : 'play-button'}
                    >
                      {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="delete-button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution Queue */}
        <div className="execution-queue">
          <h3>Execution Queue</h3>
          {queue.length === 0 ? (
            <p className="empty-state">Queue is empty</p>
          ) : (
            <div className="queue-list">
              {queue.map((item) => (
                <div key={item.id} className={`queue-item status-${item.status.toLowerCase()}`}>
                  <div className="queue-info">
                    <strong>{item.workflow_id}</strong>
                    <span className="status">{item.status}</span>
                    <span className="scheduled-time">{item.scheduled_time}</span>
                    {item.error && <span className="error-text">{item.error}</span>}
                  </div>
                  {(item.status === 'Queued' || item.status === 'Running') && (
                    <button
                      onClick={() => handleCancelExecution(item.id)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {toast.type === 'info' && <AlertCircle className="w-4 h-4" />}
              <span className="toast-message">{toast.message}</span>
              <button onClick={() => dismissToast(toast.id)} className="toast-dismiss">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
