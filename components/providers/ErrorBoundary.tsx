/**
 * ErrorBoundary - React error boundary with telemetry integration
 *
 * Catches React errors and reports them to the telemetry service.
 * Provides fallback UI and recovery options.
 *
 * @module ErrorBoundary
 * @version 1.0.0
 * @date 2025-12-25
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { TelemetryService } from '@/lib/services/telemetry-service';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ErrorBoundary');

export interface ErrorBoundaryProps {
  /**
   * Child components to render
   */
  children: ReactNode;

  /**
   * Custom fallback component
   */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);

  /**
   * Called when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Called when reset is triggered
   */
  onReset?: () => void;

  /**
   * Module name for telemetry tracking
   */
  module?: string;

  /**
   * Component name for telemetry tracking
   */
  componentName?: string;

  /**
   * Test ID for testing
   */
  testId?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * ErrorBoundary component
 *
 * Catches JavaScript errors anywhere in child component tree,
 * logs them, and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   module="automation"
 *   onError={(error) => log.error('Caught:', error)}
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Something went wrong: {error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Track error with telemetry
    const errorId = TelemetryService.trackReactError(error, {
      componentStack: errorInfo.componentStack || undefined,
    });

    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary caught an error');
      log.error('Error:', error);
      log.error('Component Stack:', errorInfo.componentStack);
      log.error('Error ID:', errorId);
      console.groupEnd();
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    this.props.onReset?.();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, testId = 'error-boundary' } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.handleReset);
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <div
          className="min-h-[200px] flex items-center justify-center p-6"
          data-testid={testId}
        >
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-800">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-red-600">
                    An error occurred in this component
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Error message:
                </p>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {error.message}
                </p>
              </div>

              {errorId && (
                <p className="text-xs text-gray-400 mb-4">
                  Error ID: <code className="font-mono">{errorId}</code>
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  type="button"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  type="button"
                >
                  Reload Page
                </button>
              </div>
            </div>

            {/* Technical details (development only) */}
            {process.env.NODE_ENV === 'development' && errorInfo && (
              <details className="border-t border-gray-100">
                <summary className="px-6 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-50">
                  Technical Details
                </summary>
                <div className="px-6 pb-4">
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-x-auto max-h-48 overflow-y-auto">
                    {error.stack}
                  </pre>
                  {errorInfo.componentStack && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-x-auto max-h-32 overflow-y-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundaryComponent: React.FC<P> = (props: P) => {
    return (
      <ErrorBoundary
        componentName={displayName}
        {...errorBoundaryProps}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `WithErrorBoundary(${displayName})`;

  return WithErrorBoundaryComponent;
}

export default ErrorBoundary;
