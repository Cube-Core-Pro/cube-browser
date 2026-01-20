/**
 * Scheduling Service - Task & Workflow Scheduling
 *
 * Enterprise-grade scheduling system with cron support,
 * calendars, and intelligent scheduling.
 *
 * M5 Features:
 * - Cron-based scheduling
 * - Calendar integration
 * - Recurring tasks
 * - Time zones support
 * - Dependencies between tasks
 * - Resource management
 * - Holiday calendars
 * - Intelligent scheduling
 *
 * @module SchedulingService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService } from './telemetry-service';

// ============================================================================
// Schedule Types
// ============================================================================

export interface Schedule {
  /**
   * Schedule ID
   */
  id: string;

  /**
   * Schedule name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Schedule type
   */
  type: ScheduleType;

  /**
   * Cron expression (for cron type)
   */
  cronExpression?: string;

  /**
   * Interval configuration (for interval type)
   */
  interval?: IntervalConfig;

  /**
   * Calendar configuration (for calendar type)
   */
  calendar?: CalendarConfig;

  /**
   * One-time configuration (for once type)
   */
  oneTime?: {
    runAt: number;
  };

  /**
   * Time zone
   */
  timezone: string;

  /**
   * Task to execute
   */
  task: ScheduledTask;

  /**
   * Is enabled
   */
  isEnabled: boolean;

  /**
   * Status
   */
  status: ScheduleStatus;

  /**
   * Priority
   */
  priority: SchedulePriority;

  /**
   * Dependencies
   */
  dependencies?: ScheduleDependency[];

  /**
   * Resource requirements
   */
  resources?: ResourceRequirements;

  /**
   * Retry configuration
   */
  retry?: RetryConfig;

  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Execution window
   */
  executionWindow?: ExecutionWindow;

  /**
   * Blackout periods
   */
  blackoutPeriods?: BlackoutPeriod[];

  /**
   * Last run
   */
  lastRun?: ScheduleRun;

  /**
   * Next run time
   */
  nextRunAt?: number;

  /**
   * Run count
   */
  runCount: number;

  /**
   * Statistics
   */
  stats: ScheduleStats;

  /**
   * Tags
   */
  tags: string[];

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export type ScheduleType =
  | 'cron'
  | 'interval'
  | 'calendar'
  | 'once'
  | 'manual'
  | 'event-triggered';

export type ScheduleStatus =
  | 'active'
  | 'paused'
  | 'running'
  | 'completed'
  | 'failed'
  | 'disabled';

export type SchedulePriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

export interface IntervalConfig {
  /**
   * Interval value
   */
  value: number;

  /**
   * Interval unit
   */
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

  /**
   * Start time
   */
  startAt?: number;

  /**
   * End time
   */
  endAt?: number;
}

export interface CalendarConfig {
  /**
   * Days of week (0-6, Sunday=0)
   */
  daysOfWeek?: number[];

  /**
   * Days of month (1-31)
   */
  daysOfMonth?: number[];

  /**
   * Months (1-12)
   */
  months?: number[];

  /**
   * Specific dates
   */
  specificDates?: string[];

  /**
   * Time of day (HH:mm format)
   */
  timeOfDay: string;

  /**
   * Use holiday calendar
   */
  respectHolidays?: boolean;

  /**
   * Holiday calendar ID
   */
  holidayCalendarId?: string;
}

export interface ScheduledTask {
  /**
   * Task type
   */
  type: TaskType;

  /**
   * Task ID (for workflow/automation)
   */
  taskId?: string;

  /**
   * Command to execute
   */
  command?: string;

  /**
   * Arguments
   */
  args?: string[];

  /**
   * Input data
   */
  inputData?: Record<string, unknown>;

  /**
   * Webhook URL
   */
  webhookUrl?: string;

  /**
   * HTTP method (for webhook)
   */
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  /**
   * Custom handler
   */
  handler?: string;
}

export type TaskType =
  | 'workflow'
  | 'automation'
  | 'script'
  | 'command'
  | 'webhook'
  | 'notification'
  | 'backup'
  | 'cleanup'
  | 'sync'
  | 'report'
  | 'custom';

export interface ScheduleDependency {
  /**
   * Dependent schedule ID
   */
  scheduleId: string;

  /**
   * Dependency type
   */
  type: 'success' | 'completion' | 'start';

  /**
   * Timeout (ms)
   */
  timeout?: number;
}

export interface ResourceRequirements {
  /**
   * Maximum concurrent instances
   */
  maxConcurrent: number;

  /**
   * Required resources
   */
  required?: string[];

  /**
   * Preferred resources
   */
  preferred?: string[];

  /**
   * Memory limit (MB)
   */
  memoryLimit?: number;

  /**
   * CPU limit (%)
   */
  cpuLimit?: number;
}

export interface RetryConfig {
  /**
   * Maximum retries
   */
  maxRetries: number;

  /**
   * Retry delay (ms)
   */
  retryDelay: number;

  /**
   * Backoff multiplier
   */
  backoffMultiplier: number;

  /**
   * Retry on errors
   */
  retryOnErrors?: string[];
}

export interface ExecutionWindow {
  /**
   * Window start time (HH:mm)
   */
  startTime: string;

  /**
   * Window end time (HH:mm)
   */
  endTime: string;

  /**
   * Days of week (0-6)
   */
  daysOfWeek?: number[];
}

export interface BlackoutPeriod {
  /**
   * Period ID
   */
  id: string;

  /**
   * Name
   */
  name: string;

  /**
   * Start time
   */
  startAt: number;

  /**
   * End time
   */
  endAt: number;

  /**
   * Is recurring
   */
  isRecurring: boolean;

  /**
   * Recurrence pattern
   */
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  };
}

// ============================================================================
// Run Types
// ============================================================================

export interface ScheduleRun {
  /**
   * Run ID
   */
  id: string;

  /**
   * Schedule ID
   */
  scheduleId: string;

  /**
   * Status
   */
  status: RunStatus;

  /**
   * Scheduled time
   */
  scheduledAt: number;

  /**
   * Start time
   */
  startedAt?: number;

  /**
   * End time
   */
  completedAt?: number;

  /**
   * Duration (ms)
   */
  duration?: number;

  /**
   * Result
   */
  result?: unknown;

  /**
   * Error
   */
  error?: string;

  /**
   * Retry count
   */
  retryCount: number;

  /**
   * Triggered by
   */
  triggeredBy: 'schedule' | 'manual' | 'dependency' | 'api';

  /**
   * Resource usage
   */
  resourceUsage?: {
    cpuPercent: number;
    memoryMb: number;
  };

  /**
   * Logs
   */
  logs?: RunLog[];
}

export type RunStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'skipped'
  | 'timeout';

export interface RunLog {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface HolidayCalendar {
  /**
   * Calendar ID
   */
  id: string;

  /**
   * Calendar name
   */
  name: string;

  /**
   * Country code
   */
  countryCode?: string;

  /**
   * Holidays
   */
  holidays: Holiday[];

  /**
   * Is public
   */
  isPublic: boolean;

  /**
   * Creation time
   */
  createdAt: number;
}

export interface Holiday {
  /**
   * Holiday ID
   */
  id: string;

  /**
   * Name
   */
  name: string;

  /**
   * Date (YYYY-MM-DD)
   */
  date: string;

  /**
   * Is observed
   */
  isObserved: boolean;

  /**
   * Type
   */
  type: 'public' | 'bank' | 'religious' | 'custom';
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface ScheduleStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  skippedRuns: number;
  averageDuration: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
}

export interface SchedulerStats {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  runningTasks: number;
  pendingTasks: number;
  runsToday: number;
  successRateToday: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    concurrent: number;
    maxConcurrent: number;
  };
}

// ============================================================================
// Schedule Service
// ============================================================================

export const ScheduleService = {
  /**
   * Create schedule
   */
  create: async (
    schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'stats' | 'status'>
  ): Promise<Schedule> => {
    TelemetryService.trackEvent('schedule_created', { type: schedule.type });

    return invoke<Schedule>('schedule_create', { schedule });
  },

  /**
   * Get all schedules
   */
  getAll: async (filters?: {
    type?: ScheduleType;
    status?: ScheduleStatus;
    isEnabled?: boolean;
    tags?: string[];
  }): Promise<Schedule[]> => {
    return invoke<Schedule[]>('schedule_get_all', { filters });
  },

  /**
   * Get schedule by ID
   */
  get: async (scheduleId: string): Promise<Schedule | null> => {
    return invoke<Schedule | null>('schedule_get', { scheduleId });
  },

  /**
   * Update schedule
   */
  update: async (
    scheduleId: string,
    updates: Partial<Schedule>
  ): Promise<Schedule> => {
    return invoke<Schedule>('schedule_update', { scheduleId, updates });
  },

  /**
   * Delete schedule
   */
  delete: async (scheduleId: string): Promise<void> => {
    return invoke('schedule_delete', { scheduleId });
  },

  /**
   * Enable schedule
   */
  enable: async (scheduleId: string): Promise<void> => {
    return invoke('schedule_enable', { scheduleId });
  },

  /**
   * Disable schedule
   */
  disable: async (scheduleId: string): Promise<void> => {
    return invoke('schedule_disable', { scheduleId });
  },

  /**
   * Pause schedule
   */
  pause: async (scheduleId: string): Promise<void> => {
    return invoke('schedule_pause', { scheduleId });
  },

  /**
   * Resume schedule
   */
  resume: async (scheduleId: string): Promise<void> => {
    return invoke('schedule_resume', { scheduleId });
  },

  /**
   * Run schedule now
   */
  runNow: async (
    scheduleId: string,
    inputData?: Record<string, unknown>
  ): Promise<ScheduleRun> => {
    TelemetryService.trackEvent('schedule_manual_run');

    return invoke<ScheduleRun>('schedule_run_now', { scheduleId, inputData });
  },

  /**
   * Cancel running schedule
   */
  cancel: async (scheduleId: string): Promise<void> => {
    return invoke('schedule_cancel', { scheduleId });
  },

  /**
   * Get next run times
   */
  getNextRuns: async (
    scheduleId: string,
    count?: number
  ): Promise<number[]> => {
    return invoke<number[]>('schedule_get_next_runs', { scheduleId, count });
  },

  /**
   * Validate cron expression
   */
  validateCron: async (
    expression: string
  ): Promise<{
    valid: boolean;
    error?: string;
    nextRuns?: number[];
  }> => {
    return invoke('schedule_validate_cron', { expression });
  },

  /**
   * Get human-readable description of cron
   */
  describeCron: async (expression: string): Promise<string> => {
    return invoke<string>('schedule_describe_cron', { expression });
  },

  /**
   * Duplicate schedule
   */
  duplicate: async (
    scheduleId: string,
    newName: string
  ): Promise<Schedule> => {
    return invoke<Schedule>('schedule_duplicate', { scheduleId, newName });
  },

  /**
   * Import schedules
   */
  import: async (
    data: string,
    format: 'json' | 'yaml'
  ): Promise<{ imported: number; errors: string[] }> => {
    return invoke('schedule_import', { data, format });
  },

  /**
   * Export schedules
   */
  export: async (
    scheduleIds?: string[],
    format?: 'json' | 'yaml'
  ): Promise<string> => {
    return invoke<string>('schedule_export', { scheduleIds, format });
  },
};

// ============================================================================
// Run Service
// ============================================================================

export const ScheduleRunService = {
  /**
   * Get runs for schedule
   */
  getBySchedule: async (
    scheduleId: string,
    options?: {
      status?: RunStatus;
      startDate?: number;
      endDate?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ runs: ScheduleRun[]; total: number }> => {
    return invoke('schedule_run_get_by_schedule', { scheduleId, options });
  },

  /**
   * Get run by ID
   */
  get: async (runId: string): Promise<ScheduleRun | null> => {
    return invoke<ScheduleRun | null>('schedule_run_get', { runId });
  },

  /**
   * Get run logs
   */
  getLogs: async (
    runId: string,
    options?: { level?: string; limit?: number }
  ): Promise<RunLog[]> => {
    return invoke<RunLog[]>('schedule_run_get_logs', { runId, options });
  },

  /**
   * Cancel run
   */
  cancel: async (runId: string): Promise<void> => {
    return invoke('schedule_run_cancel', { runId });
  },

  /**
   * Retry run
   */
  retry: async (runId: string): Promise<ScheduleRun> => {
    return invoke<ScheduleRun>('schedule_run_retry', { runId });
  },

  /**
   * Get all running
   */
  getRunning: async (): Promise<ScheduleRun[]> => {
    return invoke<ScheduleRun[]>('schedule_run_get_running');
  },

  /**
   * Get upcoming
   */
  getUpcoming: async (
    limit?: number,
    timeRange?: number
  ): Promise<{ scheduleId: string; scheduleName: string; nextRunAt: number }[]> => {
    return invoke('schedule_run_get_upcoming', { limit, timeRange });
  },
};

// ============================================================================
// Calendar Service
// ============================================================================

export const HolidayCalendarService = {
  /**
   * Create calendar
   */
  create: async (
    calendar: Omit<HolidayCalendar, 'id' | 'createdAt'>
  ): Promise<HolidayCalendar> => {
    return invoke<HolidayCalendar>('holiday_calendar_create', { calendar });
  },

  /**
   * Get all calendars
   */
  getAll: async (): Promise<HolidayCalendar[]> => {
    return invoke<HolidayCalendar[]>('holiday_calendar_get_all');
  },

  /**
   * Get calendar by ID
   */
  get: async (calendarId: string): Promise<HolidayCalendar | null> => {
    return invoke<HolidayCalendar | null>('holiday_calendar_get', { calendarId });
  },

  /**
   * Update calendar
   */
  update: async (
    calendarId: string,
    updates: Partial<HolidayCalendar>
  ): Promise<HolidayCalendar> => {
    return invoke<HolidayCalendar>('holiday_calendar_update', {
      calendarId,
      updates,
    });
  },

  /**
   * Delete calendar
   */
  delete: async (calendarId: string): Promise<void> => {
    return invoke('holiday_calendar_delete', { calendarId });
  },

  /**
   * Add holiday
   */
  addHoliday: async (
    calendarId: string,
    holiday: Omit<Holiday, 'id'>
  ): Promise<Holiday> => {
    return invoke<Holiday>('holiday_calendar_add_holiday', {
      calendarId,
      holiday,
    });
  },

  /**
   * Remove holiday
   */
  removeHoliday: async (
    calendarId: string,
    holidayId: string
  ): Promise<void> => {
    return invoke('holiday_calendar_remove_holiday', { calendarId, holidayId });
  },

  /**
   * Import holidays for country
   */
  importForCountry: async (
    countryCode: string,
    year?: number
  ): Promise<HolidayCalendar> => {
    return invoke<HolidayCalendar>('holiday_calendar_import_country', {
      countryCode,
      year,
    });
  },

  /**
   * Check if date is holiday
   */
  isHoliday: async (
    calendarId: string,
    date: string
  ): Promise<{ isHoliday: boolean; holiday?: Holiday }> => {
    return invoke('holiday_calendar_is_holiday', { calendarId, date });
  },

  /**
   * Get holidays in range
   */
  getHolidaysInRange: async (
    calendarId: string,
    startDate: string,
    endDate: string
  ): Promise<Holiday[]> => {
    return invoke<Holiday[]>('holiday_calendar_get_in_range', {
      calendarId,
      startDate,
      endDate,
    });
  },
};

// ============================================================================
// Blackout Service
// ============================================================================

export const BlackoutService = {
  /**
   * Create blackout period
   */
  create: async (
    blackout: Omit<BlackoutPeriod, 'id'>
  ): Promise<BlackoutPeriod> => {
    return invoke<BlackoutPeriod>('blackout_create', { blackout });
  },

  /**
   * Get all blackout periods
   */
  getAll: async (): Promise<BlackoutPeriod[]> => {
    return invoke<BlackoutPeriod[]>('blackout_get_all');
  },

  /**
   * Get blackout by ID
   */
  get: async (blackoutId: string): Promise<BlackoutPeriod | null> => {
    return invoke<BlackoutPeriod | null>('blackout_get', { blackoutId });
  },

  /**
   * Update blackout
   */
  update: async (
    blackoutId: string,
    updates: Partial<BlackoutPeriod>
  ): Promise<BlackoutPeriod> => {
    return invoke<BlackoutPeriod>('blackout_update', { blackoutId, updates });
  },

  /**
   * Delete blackout
   */
  delete: async (blackoutId: string): Promise<void> => {
    return invoke('blackout_delete', { blackoutId });
  },

  /**
   * Check if time is in blackout
   */
  isInBlackout: async (
    timestamp?: number
  ): Promise<{ inBlackout: boolean; blackout?: BlackoutPeriod }> => {
    return invoke('blackout_check', { timestamp });
  },

  /**
   * Get active blackouts
   */
  getActive: async (): Promise<BlackoutPeriod[]> => {
    return invoke<BlackoutPeriod[]>('blackout_get_active');
  },

  /**
   * Get upcoming blackouts
   */
  getUpcoming: async (days?: number): Promise<BlackoutPeriod[]> => {
    return invoke<BlackoutPeriod[]>('blackout_get_upcoming', { days });
  },
};

// ============================================================================
// Scheduler Stats Service
// ============================================================================

export const SchedulerStatsService = {
  /**
   * Get scheduler stats
   */
  get: async (): Promise<SchedulerStats> => {
    return invoke<SchedulerStats>('scheduler_stats_get');
  },

  /**
   * Get run history
   */
  getRunHistory: async (
    days?: number
  ): Promise<{
    date: string;
    total: number;
    success: number;
    failed: number;
  }[]> => {
    return invoke('scheduler_stats_run_history', { days });
  },

  /**
   * Get top schedules by run count
   */
  getTopByRuns: async (
    limit?: number
  ): Promise<{ scheduleId: string; name: string; runCount: number }[]> => {
    return invoke('scheduler_stats_top_by_runs', { limit });
  },

  /**
   * Get schedules by failure rate
   */
  getByFailureRate: async (
    limit?: number
  ): Promise<{ scheduleId: string; name: string; failureRate: number }[]> => {
    return invoke('scheduler_stats_by_failure_rate', { limit });
  },

  /**
   * Get resource utilization history
   */
  getResourceHistory: async (
    hours?: number
  ): Promise<{
    timestamp: number;
    cpu: number;
    memory: number;
    concurrent: number;
  }[]> => {
    return invoke('scheduler_stats_resource_history', { hours });
  },
};

// ============================================================================
// Cron Helper
// ============================================================================

export const CronHelper = {
  /**
   * Common cron expressions
   */
  presets: {
    everyMinute: '* * * * *',
    every5Minutes: '*/5 * * * *',
    every15Minutes: '*/15 * * * *',
    every30Minutes: '*/30 * * * *',
    everyHour: '0 * * * *',
    everyDay: '0 0 * * *',
    everyDayAt: (hour: number, minute: number = 0) =>
      `${minute} ${hour} * * *`,
    everyWeekday: '0 0 * * 1-5',
    everyWeekend: '0 0 * * 0,6',
    everyMonday: '0 0 * * 1',
    everyMonth: '0 0 1 * *',
    everyMonthOn: (day: number, hour: number = 0, minute: number = 0) =>
      `${minute} ${hour} ${day} * *`,
    everyYear: '0 0 1 1 *',
  },

  /**
   * Build cron expression
   */
  build: (params: {
    minute?: string | number;
    hour?: string | number;
    dayOfMonth?: string | number;
    month?: string | number;
    dayOfWeek?: string | number;
  }): string => {
    const minute = params.minute ?? '*';
    const hour = params.hour ?? '*';
    const dayOfMonth = params.dayOfMonth ?? '*';
    const month = params.month ?? '*';
    const dayOfWeek = params.dayOfWeek ?? '*';

    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  },

  /**
   * Parse cron expression
   */
  parse: (expression: string): {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
  } | null => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      return null;
    }

    return {
      minute: parts[0],
      hour: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4],
    };
  },
};

// ============================================================================
// Timezone Helper
// ============================================================================

export const TimezoneHelper = {
  /**
   * Get available timezones
   */
  getAvailable: async (): Promise<string[]> => {
    return invoke<string[]>('timezone_get_available');
  },

  /**
   * Get current timezone
   */
  getCurrent: async (): Promise<string> => {
    return invoke<string>('timezone_get_current');
  },

  /**
   * Convert timestamp to timezone
   */
  convert: async (
    timestamp: number,
    fromTimezone: string,
    toTimezone: string
  ): Promise<number> => {
    return invoke<number>('timezone_convert', {
      timestamp,
      fromTimezone,
      toTimezone,
    });
  },

  /**
   * Get timezone offset
   */
  getOffset: async (
    timezone: string,
    timestamp?: number
  ): Promise<number> => {
    return invoke<number>('timezone_get_offset', { timezone, timestamp });
  },

  /**
   * Format timestamp in timezone
   */
  format: async (
    timestamp: number,
    timezone: string,
    format?: string
  ): Promise<string> => {
    return invoke<string>('timezone_format', { timestamp, timezone, format });
  },
};

// ============================================================================
// Export
// ============================================================================

export const SchedulingServices = {
  Schedule: ScheduleService,
  Run: ScheduleRunService,
  HolidayCalendar: HolidayCalendarService,
  Blackout: BlackoutService,
  Stats: SchedulerStatsService,
  CronHelper,
  TimezoneHelper,
};

export default SchedulingServices;
