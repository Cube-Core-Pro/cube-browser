/**
 * MetricsPanel - Real-time metrics visualization component
 *
 * Displays telemetry data including Core Web Vitals, performance metrics,
 * and error tracking information.
 *
 * @module MetricsPanel
 * @version 1.0.0
 * @date 2025-12-25
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useTelemetryContext, useRUMMetrics } from './TelemetryProvider';
import { RUMMetrics as _RUMMetrics } from '@/lib/services/telemetry-service';

export interface MetricsPanelProps {
  /**
   * Whether the panel is visible
   */
  isOpen?: boolean;

  /**
   * Callback when panel is closed
   */
  onClose?: () => void;

  /**
   * Position of the panel
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /**
   * Whether to show in compact mode
   */
  compact?: boolean;

  /**
   * Refresh interval in ms
   */
  refreshInterval?: number;

  /**
   * Test ID for testing
   */
  testId?: string;
}

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  status?: 'good' | 'needs-improvement' | 'poor' | 'neutral';
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit = '',
  status = 'neutral',
  tooltip,
}) => {
  const statusColors: Record<string, string> = {
    good: 'text-green-600 bg-green-50 border-green-200',
    'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200',
    neutral: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  const displayValue = value === null ? '—' : `${value}${unit}`;

  return (
    <div
      className={`p-3 rounded-lg border ${statusColors[status]}`}
      title={tooltip}
    >
      <div className="text-xs font-medium opacity-75 mb-1">{label}</div>
      <div className="text-lg font-bold">{displayValue}</div>
    </div>
  );
};

/**
 * Get status for Core Web Vital metrics
 */
function getWebVitalStatus(
  metric: 'fcp' | 'lcp' | 'fid' | 'cls' | 'ttfb' | 'inp',
  value: number | null
): 'good' | 'needs-improvement' | 'poor' | 'neutral' {
  if (value === null) {
    return 'neutral';
  }

  const thresholds: Record<
    string,
    { good: number; needsImprovement: number }
  > = {
    fcp: { good: 1800, needsImprovement: 3000 },
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    cls: { good: 0.1, needsImprovement: 0.25 },
    ttfb: { good: 800, needsImprovement: 1800 },
    inp: { good: 200, needsImprovement: 500 },
  };

  const threshold = thresholds[metric];
  if (!threshold) {
    return 'neutral';
  }

  if (value <= threshold.good) {
    return 'good';
  }
  if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  }
  return 'poor';
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * MetricsPanel component
 *
 * Displays real-time telemetry metrics including Core Web Vitals,
 * performance data, and session information.
 *
 * @example
 * ```tsx
 * <MetricsPanel
 *   isOpen={showMetrics}
 *   onClose={() => setShowMetrics(false)}
 *   position="bottom-right"
 * />
 * ```
 */
export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  isOpen = true,
  onClose,
  position = 'bottom-right',
  compact = false,
  refreshInterval = 5000,
  testId = 'metrics-panel',
}) => {
  const t = useTranslations('metrics');
  const { isInitialized, sessionId, getSummary, exportData, flush } =
    useTelemetryContext();
  const rumMetrics = useRUMMetrics();
  const [summary, setSummary] = useState<{
    totalSpans: number;
    totalMetrics: number;
    totalErrors: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'vitals' | 'performance' | 'session'>('vitals');

  // Refresh summary periodically
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const updateSummary = (): void => {
      const data = getSummary();
      setSummary({
        totalSpans: data.totalSpans,
        totalMetrics: data.totalMetrics,
        totalErrors: data.totalErrors,
      });
    };

    updateSummary();
    const interval = setInterval(updateSummary, refreshInterval);

    return () => clearInterval(interval);
  }, [isInitialized, getSummary, refreshInterval]);

  const handleExport = useCallback((): void => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-${sessionId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportData, sessionId]);

  const handleFlush = useCallback((): void => {
    flush();
  }, [flush]);

  if (!isOpen || !isInitialized) {
    return null;
  }

  const positionClasses: Record<string, string> = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const renderVitals = (): React.ReactNode => {
    if (!rumMetrics) {
      return (
        <div className="text-center text-gray-500 py-4">
          {t('loading') || 'Loading metrics...'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="FCP"
          value={rumMetrics.fcp ? Math.round(rumMetrics.fcp) : null}
          unit="ms"
          status={getWebVitalStatus('fcp', rumMetrics.fcp)}
          tooltip="First Contentful Paint"
        />
        <MetricCard
          label="LCP"
          value={rumMetrics.lcp ? Math.round(rumMetrics.lcp) : null}
          unit="ms"
          status={getWebVitalStatus('lcp', rumMetrics.lcp)}
          tooltip="Largest Contentful Paint"
        />
        <MetricCard
          label="FID"
          value={rumMetrics.fid ? Math.round(rumMetrics.fid) : null}
          unit="ms"
          status={getWebVitalStatus('fid', rumMetrics.fid)}
          tooltip="First Input Delay"
        />
        <MetricCard
          label="CLS"
          value={rumMetrics.cls ? rumMetrics.cls.toFixed(3) : null}
          status={getWebVitalStatus('cls', rumMetrics.cls)}
          tooltip="Cumulative Layout Shift"
        />
        <MetricCard
          label="TTFB"
          value={rumMetrics.ttfb ? Math.round(rumMetrics.ttfb) : null}
          unit="ms"
          status={getWebVitalStatus('ttfb', rumMetrics.ttfb)}
          tooltip="Time to First Byte"
        />
        <MetricCard
          label="INP"
          value={rumMetrics.inp ? Math.round(rumMetrics.inp) : null}
          unit="ms"
          status={getWebVitalStatus('inp', rumMetrics.inp)}
          tooltip="Interaction to Next Paint"
        />
      </div>
    );
  };

  const renderPerformance = (): React.ReactNode => {
    if (!rumMetrics) {
      return (
        <div className="text-center text-gray-500 py-4">
          {t('loading') || 'Loading metrics...'}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label={t('domLoaded') || 'DOM Loaded'}
            value={
              rumMetrics.domContentLoaded
                ? Math.round(rumMetrics.domContentLoaded)
                : null
            }
            unit="ms"
          />
          <MetricCard
            label={t('pageLoad') || 'Page Load'}
            value={
              rumMetrics.loadComplete
                ? Math.round(rumMetrics.loadComplete)
                : null
            }
            unit="ms"
          />
        </div>

        <div className="border-t pt-3">
          <h4 className="text-xs font-medium text-gray-500 mb-2">
            {t('resources') || 'Resources'}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label={t('resourceCount') || 'Count'}
              value={rumMetrics.resourceCount}
            />
            <MetricCard
              label={t('transferSize') || 'Transfer'}
              value={formatBytes(rumMetrics.totalTransferSize)}
            />
          </div>
        </div>

        {rumMetrics.usedJSHeapSize && (
          <div className="border-t pt-3">
            <h4 className="text-xs font-medium text-gray-500 mb-2">
              {t('memory') || 'Memory'}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard
                label={t('heapUsed') || 'Heap Used'}
                value={formatBytes(rumMetrics.usedJSHeapSize)}
              />
              <MetricCard
                label={t('heapTotal') || 'Heap Total'}
                value={formatBytes(rumMetrics.totalJSHeapSize || 0)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSession = (): React.ReactNode => {
    return (
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs font-medium text-gray-500 mb-1">
            {t('sessionId') || 'Session ID'}
          </div>
          <div className="text-xs font-mono text-gray-700 break-all">
            {sessionId}
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-2">
            <MetricCard
              label={t('spans') || 'Spans'}
              value={summary.totalSpans}
            />
            <MetricCard
              label={t('metrics') || 'Metrics'}
              value={summary.totalMetrics}
            />
            <MetricCard
              label={t('errors') || 'Errors'}
              value={summary.totalErrors}
              status={summary.totalErrors > 0 ? 'poor' : 'good'}
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleExport}
            className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            type="button"
          >
            {t('export') || 'Export'}
          </button>
          <button
            onClick={handleFlush}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            type="button"
          >
            {t('flush') || 'Flush'}
          </button>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div
        className={`fixed ${positionClasses[position]} z-50`}
        data-testid={testId}
      >
        <div className="bg-white rounded-lg shadow-lg border p-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium">FCP:</span>
            <span
              className={
                getWebVitalStatus('fcp', rumMetrics?.fcp ?? null) === 'good'
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }
            >
              {rumMetrics?.fcp ? `${Math.round(rumMetrics.fcp)}ms` : '—'}
            </span>
            <span className="font-medium">LCP:</span>
            <span
              className={
                getWebVitalStatus('lcp', rumMetrics?.lcp ?? null) === 'good'
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }
            >
              {rumMetrics?.lcp ? `${Math.round(rumMetrics.lcp)}ms` : '—'}
            </span>
            {summary && summary.totalErrors > 0 && (
              <span className="text-red-600">⚠ {summary.totalErrors}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 w-80`}
      data-testid={testId}
    >
      <div className="bg-white rounded-lg shadow-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-sm font-semibold text-gray-700">
            {t('title') || '📊 Metrics'}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('vitals')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'vitals'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            type="button"
          >
            {t('webVitals') || 'Web Vitals'}
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'performance'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            type="button"
          >
            {t('performance') || 'Performance'}
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'session'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            type="button"
          >
            {t('session') || 'Session'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'vitals' && renderVitals()}
          {activeTab === 'performance' && renderPerformance()}
          {activeTab === 'session' && renderSession()}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-400 text-center">
          CUBE Elite v6 Telemetry
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
