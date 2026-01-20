/**
 * TelemetryProvider - React context provider for telemetry
 *
 * Initializes and provides telemetry services throughout the application.
 *
 * @module TelemetryProvider
 * @version 1.0.0
 * @date 2025-12-25
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  TelemetryService,
  TelemetryConfig,
  RUMMetrics,
  UserInfo,
} from '@/lib/services/telemetry-service';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('TelemetryProvider');

export interface TelemetryContextValue {
  /**
   * Whether telemetry is initialized
   */
  isInitialized: boolean;

  /**
   * Whether telemetry is enabled
   */
  isEnabled: boolean;

  /**
   * Current session ID
   */
  sessionId: string;

  /**
   * Current RUM metrics
   */
  rumMetrics: RUMMetrics | null;

  /**
   * Set user information
   */
  setUser: (user: UserInfo | null) => void;

  /**
   * Enable telemetry
   */
  enable: () => void;

  /**
   * Disable telemetry
   */
  disable: () => void;

  /**
   * Get telemetry summary
   */
  getSummary: () => {
    sessionId: string;
    totalSpans: number;
    totalMetrics: number;
    totalErrors: number;
    rum: RUMMetrics;
  };

  /**
   * Export telemetry data
   */
  exportData: () => string;

  /**
   * Manually flush telemetry data
   */
  flush: () => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export interface TelemetryProviderProps {
  /**
   * Child components
   */
  children: ReactNode;

  /**
   * Telemetry configuration
   */
  config?: Partial<TelemetryConfig>;

  /**
   * Initial user information
   */
  initialUser?: UserInfo;

  /**
   * Whether to track page views automatically
   */
  trackPageViews?: boolean;

  /**
   * Callback when telemetry is initialized
   */
  onInitialized?: () => void;

  /**
   * Callback when an error is tracked
   */
  onError?: (error: Error) => void;
}

/**
 * TelemetryProvider component
 *
 * Wraps the application to provide telemetry context and automatic tracking.
 *
 * @example
 * ```tsx
 * <TelemetryProvider
 *   config={{
 *     serviceName: 'cube-elite',
 *     environment: 'production',
 *     debug: false,
 *   }}
 *   trackPageViews={true}
 * >
 *   <App />
 * </TelemetryProvider>
 * ```
 */
export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({
  children,
  config = {},
  initialUser,
  trackPageViews = true,
  onInitialized,
  onError,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(config.enabled !== false);
  const [sessionId, setSessionId] = useState('');
  const [rumMetrics, setRumMetrics] = useState<RUMMetrics | null>(null);
  const pathname = usePathname();

  // Initialize telemetry on mount
  useEffect(() => {
    const initConfig: Partial<TelemetryConfig> = {
      serviceName: 'cube-elite-v6',
      serviceVersion: '6.0.0',
      environment:
        process.env.NODE_ENV === 'production' ? 'production' : 'development',
      debug: process.env.NODE_ENV === 'development',
      enableRUM: true,
      enableErrorTracking: true,
      enablePerformanceMetrics: true,
      ...config,
      enabled: isEnabled,
    };

    TelemetryService.init(initConfig);
    setSessionId(TelemetryService.getSessionId());
    setIsInitialized(true);
    log.info('Telemetry initialized');

    if (initialUser) {
      TelemetryService.setUser(initialUser);
      log.debug(`User set: ${initialUser.email || initialUser.id}`);
    }

    onInitialized?.();

    return () => {
      TelemetryService.shutdown();
      log.info('Telemetry shutdown');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  // Track page views
  useEffect(() => {
    if (isInitialized && trackPageViews && pathname) {
      TelemetryService.recordPageView(pathname, document?.title);
    }
  }, [pathname, isInitialized, trackPageViews]);

  // Update RUM metrics periodically
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const updateRumMetrics = (): void => {
      setRumMetrics(TelemetryService.getRUMMetrics());
    };

    // Initial update after page load
    const initialTimeout = setTimeout(updateRumMetrics, 3000);

    // Periodic updates
    const interval = setInterval(updateRumMetrics, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isInitialized]);

  // Set up error boundary integration
  useEffect(() => {
    if (!isInitialized || !onError) {
      return;
    }

    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const error = args[0];
      if (error instanceof Error) {
        onError(error);
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, [isInitialized, onError]);

  const setUser = useCallback((user: UserInfo | null): void => {
    TelemetryService.setUser(user);
  }, []);

  const enable = useCallback((): void => {
    setIsEnabled(true);
    TelemetryService.init({ ...config, enabled: true });
  }, [config]);

  const disable = useCallback((): void => {
    setIsEnabled(false);
    TelemetryService.shutdown();
  }, []);

  const getSummary = useCallback(() => {
    return TelemetryService.getSummary();
  }, []);

  const exportData = useCallback((): string => {
    return TelemetryService.exportData();
  }, []);

  const flush = useCallback((): void => {
    TelemetryService.flush();
  }, []);

  const contextValue = useMemo<TelemetryContextValue>(
    () => ({
      isInitialized,
      isEnabled,
      sessionId,
      rumMetrics,
      setUser,
      enable,
      disable,
      getSummary,
      exportData,
      flush,
    }),
    [
      isInitialized,
      isEnabled,
      sessionId,
      rumMetrics,
      setUser,
      enable,
      disable,
      getSummary,
      exportData,
      flush,
    ]
  );

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
};

/**
 * Hook to access telemetry context
 */
export function useTelemetryContext(): TelemetryContextValue {
  const context = useContext(TelemetryContext);

  if (!context) {
    throw new Error(
      'useTelemetryContext must be used within a TelemetryProvider'
    );
  }

  return context;
}

/**
 * Hook to get RUM metrics
 */
export function useRUMMetrics(): RUMMetrics | null {
  const { rumMetrics } = useTelemetryContext();
  return rumMetrics;
}

/**
 * Hook to get session ID
 */
export function useSessionId(): string {
  const { sessionId } = useTelemetryContext();
  return sessionId;
}

export default TelemetryProvider;
