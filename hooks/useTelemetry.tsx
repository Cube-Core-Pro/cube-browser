/**
 * useTelemetry Hook - React integration for TelemetryService
 *
 * Provides hooks and utilities for using telemetry in React components.
 *
 * @module useTelemetry
 * @version 1.0.0
 * @date 2025-12-25
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  TelemetryService,
  SpanKind,
  SpanAttributes,
  ErrorType,
  ErrorSeverity,
  SpanStatusCode,
} from '@/lib/services/telemetry-service';

export interface UseTelemetryOptions {
  /**
   * Component name for tracking
   */
  componentName?: string;

  /**
   * Module name for feature tracking
   */
  module?: string;

  /**
   * Enable automatic render tracking
   */
  trackRenders?: boolean;

  /**
   * Enable automatic mount/unmount tracking
   */
  trackLifecycle?: boolean;
}

export interface TelemetryHook {
  /**
   * Start a span for tracking an operation
   */
  startSpan: (name: string, attributes?: SpanAttributes) => string;

  /**
   * End a span
   */
  endSpan: (spanId: string) => void;

  /**
   * Track an error
   */
  trackError: (error: Error | string, context?: Record<string, unknown>) => string;

  /**
   * Track a custom event
   */
  trackEvent: (name: string, properties?: Record<string, string | number | boolean>) => void;

  /**
   * Track feature usage
   */
  trackFeature: (featureName: string) => void;

  /**
   * Track a user action
   */
  trackAction: (action: string, details?: Record<string, unknown>) => void;

  /**
   * Record a timing metric
   */
  recordTiming: (name: string, durationMs: number) => void;

  /**
   * Start a timer and return a function to record the duration
   */
  startTimer: () => () => number;

  /**
   * Trace an async function
   */
  trace: <T>(name: string, fn: () => Promise<T>) => Promise<T>;

  /**
   * Get the current trace ID
   */
  getTraceId: () => string | null;

  /**
   * Get the session ID
   */
  getSessionId: () => string;
}

/**
 * Main telemetry hook for React components
 */
export function useTelemetry(options: UseTelemetryOptions = {}): TelemetryHook {
  const {
    componentName = 'Unknown',
    module = 'unknown',
    trackRenders = false,
    trackLifecycle = false,
  } = options;

  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  // Track component lifecycle
  useEffect(() => {
    if (trackLifecycle) {
      mountTime.current = performance.now();
      TelemetryService.trackEvent('component_mount', {
        component: componentName,
        module,
      });
    }

    return () => {
      if (trackLifecycle) {
        const lifetime = performance.now() - mountTime.current;
        TelemetryService.trackEvent('component_unmount', {
          component: componentName,
          module,
          lifetime_ms: Math.round(lifetime),
        });
      }
    };
  }, [componentName, module, trackLifecycle]);

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      renderCount.current += 1;
      TelemetryService.recordMetric(`component.${componentName}.renders`, renderCount.current);
    }
  });

  const startSpan = useCallback(
    (name: string, attributes?: SpanAttributes): string => {
      return TelemetryService.startSpan(`${componentName}.${name}`, {
        kind: SpanKind.INTERNAL,
        attributes: {
          'component.name': componentName,
          'component.module': module,
          ...attributes,
        },
      });
    },
    [componentName, module]
  );

  const endSpan = useCallback((spanId: string): void => {
    TelemetryService.endSpan(spanId);
  }, []);

  const trackError = useCallback(
    (error: Error | string, context?: Record<string, unknown>): string => {
      return TelemetryService.trackError(error, {
        type: ErrorType.REACT,
        severity: ErrorSeverity.ERROR,
        context: {
          component: componentName,
          extra: context,
        },
      });
    },
    [componentName]
  );

  const trackEvent = useCallback(
    (name: string, properties?: Record<string, string | number | boolean>): void => {
      TelemetryService.trackEvent(name, {
        component: componentName,
        module,
        ...properties,
      });
    },
    [componentName, module]
  );

  const trackFeature = useCallback(
    (featureName: string): void => {
      TelemetryService.trackFeatureUsage(featureName, module);
    },
    [module]
  );

  const trackAction = useCallback(
    (action: string, details?: Record<string, unknown>): void => {
      TelemetryService.trackEvent('user_action', {
        action,
        component: componentName,
        module,
        details: JSON.stringify(details || {}),
      });
    },
    [componentName, module]
  );

  const recordTiming = useCallback(
    (name: string, durationMs: number): void => {
      TelemetryService.recordTiming(`${componentName}.${name}`, durationMs, {
        component: componentName,
        module,
      });
    },
    [componentName, module]
  );

  const startTimer = useCallback((): (() => number) => {
    return TelemetryService.startTimer();
  }, []);

  const trace = useCallback(
    async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
      return TelemetryService.trace(`${componentName}.${name}`, fn, {
        'component.name': componentName,
        'component.module': module,
      });
    },
    [componentName, module]
  );

  const getTraceId = useCallback((): string | null => {
    return TelemetryService.getCurrentTraceId();
  }, []);

  const getSessionId = useCallback((): string => {
    return TelemetryService.getSessionId();
  }, []);

  return {
    startSpan,
    endSpan,
    trackError,
    trackEvent,
    trackFeature,
    trackAction,
    recordTiming,
    startTimer,
    trace,
    getTraceId,
    getSessionId,
  };
}

/**
 * Hook for tracking page views
 */
export function usePageTracking(pagePath: string, pageTitle?: string): void {
  useEffect(() => {
    TelemetryService.recordPageView(pagePath, pageTitle);
  }, [pagePath, pageTitle]);
}

/**
 * Hook for tracking form submissions
 */
export function useFormTracking(formName: string): {
  trackSubmit: (success: boolean, errorMessage?: string) => void;
  trackFieldChange: (fieldName: string) => void;
  trackValidationError: (fieldName: string, error: string) => void;
} {
  const trackSubmit = useCallback(
    (success: boolean, errorMessage?: string): void => {
      TelemetryService.trackEvent('form_submit', {
        form: formName,
        success,
        error: errorMessage || '',
      });
    },
    [formName]
  );

  const trackFieldChange = useCallback(
    (fieldName: string): void => {
      TelemetryService.trackEvent('form_field_change', {
        form: formName,
        field: fieldName,
      });
    },
    [formName]
  );

  const trackValidationError = useCallback(
    (fieldName: string, error: string): void => {
      TelemetryService.trackEvent('form_validation_error', {
        form: formName,
        field: fieldName,
        error,
      });
    },
    [formName]
  );

  return { trackSubmit, trackFieldChange, trackValidationError };
}

/**
 * Hook for tracking async operations
 */
export function useAsyncTracking(operationName: string): {
  trackStart: () => string;
  trackSuccess: (spanId: string) => void;
  trackFailure: (spanId: string, error: Error | string) => void;
} {
  const trackStart = useCallback((): string => {
    return TelemetryService.startSpan(operationName, {
      kind: SpanKind.INTERNAL,
    });
  }, [operationName]);

  const trackSuccess = useCallback((spanId: string): void => {
    TelemetryService.endSpan(spanId, { code: SpanStatusCode.OK });
  }, []);

  const trackFailure = useCallback(
    (spanId: string, error: Error | string): void => {
      const errorMessage = typeof error === 'string' ? error : error.message;
      TelemetryService.setSpanStatus(spanId, SpanStatusCode.ERROR, errorMessage);
      TelemetryService.endSpan(spanId);
      TelemetryService.trackError(error, {
        context: { action: operationName },
      });
    },
    [operationName]
  );

  return { trackStart, trackSuccess, trackFailure };
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking(): {
  trackClick: (target: string, duration?: number) => void;
  trackScroll: (target: string, position: number) => void;
  trackHover: (target: string, duration: number) => void;
} {
  const trackClick = useCallback((target: string, duration?: number): void => {
    TelemetryService.recordInteraction('click', target, duration);
  }, []);

  const trackScroll = useCallback((target: string, position: number): void => {
    TelemetryService.recordInteraction('scroll', target);
    TelemetryService.recordMetric('scroll.position', position, 'px', {
      target,
    });
  }, []);

  const trackHover = useCallback((target: string, duration: number): void => {
    TelemetryService.recordInteraction('input', target, duration);
  }, []);

  return { trackClick, trackScroll, trackHover };
}

/**
 * Hook for tracking API calls in components
 */
export function useApiTracking(): {
  trackApiCall: (
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ) => void;
  withApiTracking: <T>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>
  ) => Promise<T>;
} {
  const trackApiCall = useCallback(
    (endpoint: string, method: string, statusCode: number, duration: number): void => {
      TelemetryService.trackApiCall(endpoint, method, statusCode, duration);
    },
    []
  );

  const withApiTracking = useCallback(
    async <T,>(endpoint: string, method: string, fn: () => Promise<T>): Promise<T> => {
      const timer = TelemetryService.startTimer();
      let statusCode = 200;

      try {
        const result = await fn();
        return result;
      } catch (error) {
        statusCode = error instanceof Response ? error.status : 500;
        throw error;
      } finally {
        const duration = timer();
        TelemetryService.trackApiCall(endpoint, method, statusCode, duration);
      }
    },
    []
  );

  return { trackApiCall, withApiTracking };
}

/**
 * Higher-order component for automatic component tracking
 */
export function withTelemetry<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: UseTelemetryOptions
): React.FC<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithTelemetryComponent: React.FC<P> = (props: P) => {
    useTelemetry({
      componentName: displayName,
      trackLifecycle: true,
      ...options,
    });

    return <WrappedComponent {...props} />;
  };

  WithTelemetryComponent.displayName = `WithTelemetry(${displayName})`;

  return WithTelemetryComponent;
}

export default useTelemetry;
