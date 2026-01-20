/**
 * ScheduleTriggerConfig - CUBE Elite v6
 * Configurador de triggers programados con cron y expresiones naturales
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ScheduleTrigger,
  ScheduleFrequency,
  TriggerCondition,
} from '../../types/automation-advanced';
import './ScheduleTriggerConfig.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface ScheduleTriggerConfigProps {
  trigger?: ScheduleTrigger;
  onSave: (trigger: ScheduleTrigger) => void;
  onClose: () => void;
  timezone?: string;
}

interface NextRun {
  date: Date;
  formatted: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FREQUENCIES: { value: ScheduleFrequency; label: string; icon: string }[] = [
  { value: 'once', label: 'Once', icon: '1️⃣' },
  { value: 'minutely', label: 'Every Minute', icon: '⏱️' },
  { value: 'hourly', label: 'Hourly', icon: '🕐' },
  { value: 'daily', label: 'Daily', icon: '📅' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'yearly', label: 'Yearly', icon: '📊' },
  { value: 'custom', label: 'Custom (Cron)', icon: '⚙️' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
];

const CRON_PRESETS = [
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every 30 minutes', cron: '*/30 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 2 hours', cron: '0 */2 * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Every day at midnight', cron: '0 0 * * *' },
  { label: 'Every day at noon', cron: '0 12 * * *' },
  { label: 'Every weekday at 9 AM', cron: '0 9 * * 1-5' },
  { label: 'Every Monday at 9 AM', cron: '0 9 * * 1' },
  { label: 'First day of month at midnight', cron: '0 0 1 * *' },
  { label: 'Last day of month at 23:59', cron: '59 23 L * *' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const ScheduleTriggerConfig: React.FC<ScheduleTriggerConfigProps> = ({
  trigger,
  onSave,
  onClose,
  timezone: defaultTimezone = 'UTC',
}) => {
  // State
  const [name, setName] = useState(trigger?.name || '');
  const [enabled, setEnabled] = useState(trigger?.enabled ?? true);
  const [frequency, setFrequency] = useState<ScheduleFrequency>(trigger?.frequency || 'daily');
  const [cron, setCron] = useState(trigger?.cron || '0 9 * * *');
  const [timezone, setTimezone] = useState(trigger?.timezone || defaultTimezone);
  
  // Specific schedule configs
  const [hour, setHour] = useState(trigger?.hour ?? 9);
  const [minute, setMinute] = useState(trigger?.minute ?? 0);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(trigger?.daysOfWeek || [1, 2, 3, 4, 5]);
  const [dayOfMonth, setDayOfMonth] = useState(trigger?.dayOfMonth || 1);
  const [monthOfYear, setMonthOfYear] = useState(trigger?.monthOfYear || 1);
  
  // Once-specific
  const [specificDateTime, setSpecificDateTime] = useState<string>(
    trigger?.specificDateTime
      ? new Date(trigger.specificDateTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  
  // Range & limits
  const [startDate, setStartDate] = useState<string>(
    trigger?.startDate ? new Date(trigger.startDate).toISOString().slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState<string>(
    trigger?.endDate ? new Date(trigger.endDate).toISOString().slice(0, 10) : ''
  );
  const [maxExecutions, setMaxExecutions] = useState(trigger?.maxExecutions || 0);
  
  // Retry
  const [retryOnFailure, setRetryOnFailure] = useState(trigger?.retryOnFailure ?? true);
  const [maxRetries, setMaxRetries] = useState(trigger?.maxRetries || 3);
  const [retryDelay, setRetryDelay] = useState(trigger?.retryDelay || 60000);
  
  // Conditions
  const [conditions, setConditions] = useState<TriggerCondition[]>(trigger?.conditions || []);

  // Build cron from UI
  useEffect(() => {
    if (frequency === 'custom') return;
    
    let newCron = '* * * * *';
    
    switch (frequency) {
      case 'once':
        // Handled separately
        break;
      case 'minutely':
        newCron = '* * * * *';
        break;
      case 'hourly':
        newCron = `${minute} * * * *`;
        break;
      case 'daily':
        newCron = `${minute} ${hour} * * *`;
        break;
      case 'weekly':
        newCron = `${minute} ${hour} * * ${daysOfWeek.join(',')}`;
        break;
      case 'monthly':
        newCron = `${minute} ${hour} ${dayOfMonth} * *`;
        break;
      case 'yearly':
        newCron = `${minute} ${hour} ${dayOfMonth} ${monthOfYear} *`;
        break;
    }
    
    setCron(newCron);
  }, [frequency, minute, hour, daysOfWeek, dayOfMonth, monthOfYear]);

  // Calculate next runs
  const nextRuns = useMemo((): NextRun[] => {
    const runs: NextRun[] = [];
    const now = new Date();
    
    if (frequency === 'once') {
      const date = new Date(specificDateTime);
      if (date > now) {
        runs.push({
          date,
          formatted: date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
          }),
        });
      }
      return runs;
    }
    
    // Simple next run calculation (real implementation would use cron parser)
    let nextDate = new Date(now);
    
    for (let i = 0; i < 5; i++) {
      switch (frequency) {
        case 'minutely':
          nextDate = new Date(nextDate.getTime() + 60000);
          break;
        case 'hourly':
          nextDate.setHours(nextDate.getHours() + 1);
          nextDate.setMinutes(minute);
          break;
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          nextDate.setHours(hour, minute, 0, 0);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          nextDate.setHours(hour, minute, 0, 0);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(dayOfMonth);
          nextDate.setHours(hour, minute, 0, 0);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          nextDate.setMonth(monthOfYear - 1);
          nextDate.setDate(dayOfMonth);
          nextDate.setHours(hour, minute, 0, 0);
          break;
        default:
          nextDate.setDate(nextDate.getDate() + 1);
      }
      
      runs.push({
        date: new Date(nextDate),
        formatted: nextDate.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      });
    }
    
    return runs;
  }, [frequency, specificDateTime, hour, minute, dayOfMonth, monthOfYear]);

  // Human-readable description
  const scheduleDescription = useMemo(() => {
    switch (frequency) {
      case 'once':
        return `Once on ${new Date(specificDateTime).toLocaleString()}`;
      case 'minutely':
        return 'Every minute';
      case 'hourly':
        return `Every hour at :${minute.toString().padStart(2, '0')}`;
      case 'daily':
        return `Every day at ${hour}:${minute.toString().padStart(2, '0')}`;
      case 'weekly': {
        const dayNames = daysOfWeek.map(d => DAYS_OF_WEEK[d].short).join(', ');
        return `Every ${dayNames} at ${hour}:${minute.toString().padStart(2, '0')}`;
      }
      case 'monthly':
        return `Monthly on day ${dayOfMonth} at ${hour}:${minute.toString().padStart(2, '0')}`;
      case 'yearly': {
        const monthName = MONTHS.find(m => m.value === monthOfYear)?.short;
        return `Yearly on ${monthName} ${dayOfMonth} at ${hour}:${minute.toString().padStart(2, '0')}`;
      }
      case 'custom':
        return `Custom: ${cron}`;
      default:
        return 'Unknown schedule';
    }
  }, [frequency, specificDateTime, hour, minute, daysOfWeek, dayOfMonth, monthOfYear, cron]);

  // Handlers
  const handleToggleDay = useCallback((day: number) => {
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter(d => d !== day));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  }, [daysOfWeek]);

  const handleAddCondition = useCallback(() => {
    setConditions([
      ...conditions,
      { 
        id: `cond-${Date.now()}`,
        type: 'variable',
        field: '', 
        operator: 'equals', 
        value: '',
        enabled: true,
      },
    ]);
  }, [conditions]);

  const handleUpdateCondition = useCallback((index: number, field: keyof TriggerCondition, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  }, [conditions]);

  const handleRemoveCondition = useCallback((index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  }, [conditions]);

  const handleSave = useCallback(() => {
    const scheduleTrigger: ScheduleTrigger = {
      id: trigger?.id || `trigger-${Date.now()}`,
      name: name || scheduleDescription,
      enabled,
      frequency,
      cron: frequency === 'custom' ? cron : undefined,
      timezone,
      hour,
      minute,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      dayOfMonth: ['monthly', 'yearly'].includes(frequency) ? dayOfMonth : undefined,
      monthOfYear: frequency === 'yearly' ? monthOfYear : undefined,
      specificDateTime: frequency === 'once' ? new Date(specificDateTime).getTime() : undefined,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      maxExecutions: maxExecutions > 0 ? maxExecutions : undefined,
      retryOnFailure,
      maxRetries: retryOnFailure ? maxRetries : undefined,
      retryDelay: retryOnFailure ? retryDelay : undefined,
      conditions: conditions.filter(c => c.field),
      lastRun: trigger?.lastRun,
      nextRun: nextRuns[0]?.date.getTime(),
      runCount: trigger?.runCount || 0,
      createdAt: trigger?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    
    onSave(scheduleTrigger);
    onClose();
  }, [
    trigger,
    name,
    enabled,
    frequency,
    cron,
    timezone,
    hour,
    minute,
    daysOfWeek,
    dayOfMonth,
    monthOfYear,
    specificDateTime,
    startDate,
    endDate,
    maxExecutions,
    retryOnFailure,
    maxRetries,
    retryDelay,
    conditions,
    scheduleDescription,
    nextRuns,
    onSave,
    onClose,
  ]);

  return (
    <div className="schedule-trigger-config">
      <div className="config-header">
        <div className="header-content">
          <h3>⏰ Schedule Trigger</h3>
          <p className="schedule-preview">{scheduleDescription}</p>
        </div>
        <div className="header-actions">
          <label className="enabled-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="toggle-label">{enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="config-body">
        <div className="config-main">
          <div className="config-section">
            <label className="section-label">Trigger Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this trigger..."
            />
          </div>

          <div className="config-section">
            <label className="section-label">Frequency</label>
            <div className="frequency-grid">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  className={`frequency-btn ${frequency === f.value ? 'selected' : ''}`}
                  onClick={() => setFrequency(f.value)}
                >
                  <span className="frequency-icon">{f.icon}</span>
                  <span className="frequency-label">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {frequency === 'once' && (
            <div className="config-section">
              <label className="section-label">Date & Time</label>
              <input
                type="datetime-local"
                value={specificDateTime}
                onChange={(e) => setSpecificDateTime(e.target.value)}
              />
            </div>
          )}

          {['hourly', 'daily', 'weekly', 'monthly', 'yearly'].includes(frequency) && (
            <div className="config-section">
              <label className="section-label">Time</label>
              <div className="time-inputs">
                <div className="time-input">
                  <label>Hour</label>
                  <input
                    type="number"
                    value={hour}
                    onChange={(e) => setHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    min={0}
                    max={23}
                  />
                </div>
                <span className="time-separator">:</span>
                <div className="time-input">
                  <label>Minute</label>
                  <input
                    type="number"
                    value={minute}
                    onChange={(e) => setMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    min={0}
                    max={59}
                  />
                </div>
              </div>
            </div>
          )}

          {frequency === 'weekly' && (
            <div className="config-section">
              <label className="section-label">Days of Week</label>
              <div className="days-grid">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    className={`day-btn ${daysOfWeek.includes(day.value) ? 'selected' : ''}`}
                    onClick={() => handleToggleDay(day.value)}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {['monthly', 'yearly'].includes(frequency) && (
            <div className="config-section">
              <label className="section-label">Day of Month</label>
              <input
                type="number"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                min={1}
                max={31}
              />
            </div>
          )}

          {frequency === 'yearly' && (
            <div className="config-section">
              <label className="section-label">Month</label>
              <select value={monthOfYear} onChange={(e) => setMonthOfYear(parseInt(e.target.value))}>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {frequency === 'custom' && (
            <div className="config-section">
              <label className="section-label">Cron Expression</label>
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="* * * * *"
                className="cron-input"
              />
              <div className="cron-presets">
                <label>Presets:</label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setCron(e.target.value);
                  }}
                >
                  <option value="">Select a preset...</option>
                  {CRON_PRESETS.map(p => (
                    <option key={p.cron} value={p.cron}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="cron-help">
                <span>Format: minute hour day month weekday</span>
              </div>
            </div>
          )}

          <div className="config-section">
            <label className="section-label">Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div className="config-section collapsible">
            <details>
              <summary>Advanced Options</summary>
              <div className="advanced-options">
                <div className="option-group">
                  <label>Start Date (optional)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="option-group">
                  <label>End Date (optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="option-group">
                  <label>Max Executions (0 = unlimited)</label>
                  <input
                    type="number"
                    value={maxExecutions}
                    onChange={(e) => setMaxExecutions(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="option-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={retryOnFailure}
                      onChange={(e) => setRetryOnFailure(e.target.checked)}
                    />
                    Retry on failure
                  </label>
                </div>
                {retryOnFailure && (
                  <>
                    <div className="option-group">
                      <label>Max Retries</label>
                      <input
                        type="number"
                        value={maxRetries}
                        onChange={(e) => setMaxRetries(parseInt(e.target.value) || 1)}
                        min={1}
                        max={10}
                      />
                    </div>
                    <div className="option-group">
                      <label>Retry Delay (ms)</label>
                      <input
                        type="number"
                        value={retryDelay}
                        onChange={(e) => setRetryDelay(parseInt(e.target.value) || 1000)}
                        min={1000}
                        step={1000}
                      />
                    </div>
                  </>
                )}
              </div>
            </details>
          </div>

          <div className="config-section collapsible">
            <details>
              <summary>Conditions ({conditions.length})</summary>
              <div className="conditions-section">
                <p className="conditions-hint">Only run when these conditions are met</p>
                {conditions.map((cond, index) => (
                  <div key={index} className="condition-row">
                    <input
                      type="text"
                      value={cond.field || ''}
                      onChange={(e) => handleUpdateCondition(index, 'field', e.target.value)}
                      placeholder="Field"
                    />
                    <select
                      value={cond.operator}
                      onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                    >
                      <option value="equals">equals</option>
                      <option value="not_equals">not equals</option>
                      <option value="contains">contains</option>
                      <option value="greater">greater than</option>
                      <option value="less">less than</option>
                    </select>
                    <input
                      type="text"
                      value={String(cond.value || '')}
                      onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                      placeholder="Value"
                    />
                    <button onClick={() => handleRemoveCondition(index)}>×</button>
                  </div>
                ))}
                <button className="add-condition-btn" onClick={handleAddCondition}>
                  + Add Condition
                </button>
              </div>
            </details>
          </div>
        </div>

        <div className="config-sidebar">
          <div className="next-runs">
            <h4>📆 Next Runs</h4>
            {nextRuns.length === 0 ? (
              <p className="no-runs">No upcoming runs</p>
            ) : (
              <ul>
                {nextRuns.map((run, i) => (
                  <li key={i}>
                    <span className="run-number">#{i + 1}</span>
                    <span className="run-time">{run.formatted}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {trigger && (
            <div className="trigger-stats">
              <h4>📊 Statistics</h4>
              <div className="stat">
                <span className="stat-label">Total Runs</span>
                <span className="stat-value">{trigger.runCount || 0}</span>
              </div>
              {trigger.lastRun !== undefined && (
                <div className="stat">
                  <span className="stat-label">Last Run</span>
                  <span className="stat-value">{new Date(trigger.lastRun).toLocaleString()}</span>
                </div>
              )}
              <div className="stat">
                <span className="stat-label">Created</span>
                <span className="stat-value">{trigger.createdAt ? new Date(trigger.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="config-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>
          💾 Save Trigger
        </button>
      </div>
    </div>
  );
};

export default ScheduleTriggerConfig;
