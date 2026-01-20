/**
 * CUBE Elite v7 - Centralized Logger Service
 * 
 * Production-ready logging with:
 * - Environment-aware log levels
 * - Structured logging
 * - Performance metrics
 * - Error tracking
 * 
 * Usage:
 * import { logger } from '@/lib/services/logger-service';
 * logger.info('Message');
 * logger.error('Error', error);
 * logger.debug('Debug info', { data });
 * 
 * @module logger-service
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Log entry structure
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBufferSize: number;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsole: process.env.NODE_ENV !== 'production',
  enableRemote: false,
  maxBufferSize: 100,
};

// Log buffer for batch sending
let logBuffer: LogEntry[] = [];

// Current configuration
let config: LoggerConfig = { ...defaultConfig };

/**
 * Format log entry
 */
const formatEntry = (level: string, message: string, context?: Record<string, unknown>): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  context,
});

/**
 * Output log to console
 */
const outputToConsole = (level: LogLevel, entry: LogEntry): void => {
  if (!config.enableConsole) return;

  const prefix = `[${entry.timestamp}] [${entry.level}]`;
  const formatted = `${prefix} ${entry.message}`;

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formatted, entry.context || '');
      break;
    case LogLevel.INFO:
      console.info(formatted, entry.context || '');
      break;
    case LogLevel.WARN:
      console.warn(formatted, entry.context || '');
      break;
    case LogLevel.ERROR:
      console.error(formatted, entry.context || '');
      if (entry.stack) {
        console.error(entry.stack);
      }
      break;
  }
};

/**
 * Add to buffer for remote sending
 */
const addToBuffer = (entry: LogEntry): void => {
  if (!config.enableRemote) return;

  logBuffer.push(entry);

  if (logBuffer.length >= config.maxBufferSize) {
    flushBuffer();
  }
};

/**
 * Flush log buffer to remote endpoint
 */
const flushBuffer = async (): Promise<void> => {
  if (!config.remoteEndpoint || logBuffer.length === 0) return;

  const entries = [...logBuffer];
  logBuffer = [];

  try {
    await fetch(config.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: entries }),
    });
  } catch (_error) {
    // Re-add failed entries back to buffer (silently fail on network errors)
    logBuffer = [...entries, ...logBuffer].slice(0, config.maxBufferSize);
  }
};

/**
 * Core log function
 */
const log = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  if (level < config.level) return;

  const levelName = LogLevel[level];
  const entry = formatEntry(levelName, message, context);

  outputToConsole(level, entry);
  addToBuffer(entry);
};

/**
 * Logger instance
 */
export const logger = {
  /**
   * Debug level logging - detailed information for debugging
   */
  debug: (message: string, context?: Record<string, unknown> | unknown): void => {
    const ctx = (context && typeof context === 'object' && !Array.isArray(context)) 
      ? context as Record<string, unknown> 
      : context !== undefined ? { value: context } : undefined;
    log(LogLevel.DEBUG, message, ctx);
  },

  /**
   * Info level logging - general information
   */
  info: (message: string, context?: Record<string, unknown> | unknown): void => {
    const ctx = (context && typeof context === 'object' && !Array.isArray(context)) 
      ? context as Record<string, unknown> 
      : context !== undefined ? { value: context } : undefined;
    log(LogLevel.INFO, message, ctx);
  },

  /**
   * Warning level logging - potential issues
   */
  warn: (message: string, context?: Record<string, unknown> | unknown): void => {
    const ctx = (context && typeof context === 'object' && !Array.isArray(context)) 
      ? context as Record<string, unknown> 
      : context !== undefined ? { value: context } : undefined;
    log(LogLevel.WARN, message, ctx);
  },

  /**
   * Error level logging - errors and exceptions
   * Supports: log.error('msg'), log.error('msg', error), log.error('msg', { context })
   */
  error: (message: string, errorOrContext?: Error | unknown | Record<string, unknown>): void => {
    let errorContext: Record<string, unknown> = {};
    let errorStack: string | undefined;

    if (errorOrContext !== undefined) {
      if (errorOrContext instanceof Error) {
        errorContext = { errorMessage: errorOrContext.message };
        errorStack = errorOrContext.stack;
      } else if (typeof errorOrContext === 'object' && errorOrContext !== null && !Array.isArray(errorOrContext)) {
        // It's likely a context object
        errorContext = errorOrContext as Record<string, unknown>;
      } else {
        // It's some other type (string, number, etc.)
        errorContext = { errorValue: String(errorOrContext) };
      }
    }

    const entry = formatEntry('ERROR', message, errorContext);
    if (errorStack) {
      entry.stack = errorStack;
    }

    outputToConsole(LogLevel.ERROR, entry);
    addToBuffer(entry);
  },

  /**
   * Performance timing
   */
  time: (label: string): void => {
    if (config.level <= LogLevel.DEBUG) {
      console.time(label);
    }
  },

  timeEnd: (label: string): void => {
    if (config.level <= LogLevel.DEBUG) {
      console.timeEnd(label);
    }
  },

  /**
   * Group logs
   */
  group: (label: string): void => {
    if (config.level <= LogLevel.DEBUG) {
      console.group(label);
    }
  },

  groupEnd: (): void => {
    if (config.level <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  },

  /**
   * Configure logger
   */
  configure: (options: Partial<LoggerConfig>): void => {
    config = { ...config, ...options };
  },

  /**
   * Get current configuration
   */
  getConfig: (): LoggerConfig => ({ ...config }),

  /**
   * Set log level
   */
  setLevel: (level: LogLevel): void => {
    config.level = level;
  },

  /**
   * Enable/disable console output
   */
  setConsoleEnabled: (enabled: boolean): void => {
    config.enableConsole = enabled;
  },

  /**
   * Enable remote logging
   */
  enableRemote: (endpoint: string): void => {
    config.enableRemote = true;
    config.remoteEndpoint = endpoint;
  },

  /**
   * Disable remote logging
   */
  disableRemote: (): void => {
    config.enableRemote = false;
  },

  /**
   * Flush pending logs
   */
  flush: flushBuffer,

  /**
   * Create scoped logger with prefix
   */
  scope: (prefix: string) => ({
    debug: (message: string, context?: Record<string, unknown> | unknown) => 
      logger.debug(`[${prefix}] ${message}`, context),
    info: (message: string, context?: Record<string, unknown> | unknown) => 
      logger.info(`[${prefix}] ${message}`, context),
    warn: (message: string, context?: Record<string, unknown> | unknown) => 
      logger.warn(`[${prefix}] ${message}`, context),
    error: (message: string, errorOrContext?: Error | unknown | Record<string, unknown>) => 
      logger.error(`[${prefix}] ${message}`, errorOrContext),
  }),
};

// Export types
export type { LoggerConfig, LogEntry };

// Export LogLevel for external use
export { LogLevel as Level };

// Default export
export default logger;
