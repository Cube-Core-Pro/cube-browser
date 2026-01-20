"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '@/hooks/use-toast';
import ObservabilityDashboard from '@/components/enterprise/ObservabilityDashboard';
import { AlertRule, Dashboard } from '@/types/observability';
import { useTranslation } from '@/hooks/useTranslation';
import './observability.css';

/**
 * Enterprise Observability Page
 * 
 * Full-page implementation of the ObservabilityDashboard component
 * for monitoring, APM, and system health tracking.
 * 
 * Features:
 * - Real-time metrics and KPIs
 * - Distributed tracing visualization
 * - Log aggregation and search
 * - Alert management and escalation
 * - Custom dashboard builder
 */

interface ObservabilityPageState {
  isLoading: boolean;
  error: string | null;
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
}

export default function ObservabilityPage(): React.JSX.Element {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = React.useState<ObservabilityPageState>({
    isLoading: false,
    error: null,
    timeRange: '1h'
  });

  const handleCreateAlert = React.useCallback(async (alert: Partial<AlertRule>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Creating alert:', alert);
      await invoke('observability_create_alert', { alert });
      toast({
        title: 'Alert Created',
        description: `Alert rule "${alert.name || 'Untitled'}" created successfully`,
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create alert';
      toast({
        title: 'Failed to Create Alert',
        description: errorMessage,
        variant: 'destructive',
      });
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [toast]);

  const handleAlertAcknowledge = React.useCallback(async (alertId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Acknowledging alert:', alertId);
      await invoke('observability_acknowledge_alert', { alertId });
      toast({
        title: 'Alert Acknowledged',
        description: 'Alert has been acknowledged',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acknowledge alert';
      toast({
        title: 'Failed to Acknowledge',
        description: errorMessage,
        variant: 'destructive',
      });
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [toast]);

  const handleDashboardCreate = React.useCallback(async (dashboard: Partial<Dashboard>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Creating dashboard:', dashboard);
      await invoke('observability_create_dashboard', { dashboard });
      toast({
        title: 'Dashboard Created',
        description: `Dashboard "${dashboard.name || 'Untitled'}" created successfully`,
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create dashboard';
      toast({
        title: 'Failed to Create Dashboard',
        description: errorMessage,
        variant: 'destructive',
      });
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [toast]);

  const handleRefreshMetrics = React.useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await invoke('observability_refresh_metrics', { timeRange: state.timeRange });
      toast({
        title: 'Metrics Refreshed',
        description: 'All metrics have been updated',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh metrics';
      toast({
        title: 'Refresh Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [toast, state.timeRange]);

  return (
    <AppLayout>
    <div className="observability-page">
      <header className="observability-header">
        <div className="header-left">
          <a href="/enterprise" className="back-link">← Enterprise Suite</a>
          <h1>Observability Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="time-range-selector">
            {(['1h', '6h', '24h', '7d', '30d'] as const).map(range => (
              <button
                key={range}
                className={`time-range-btn ${state.timeRange === range ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, timeRange: range }))}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            className="refresh-btn"
            onClick={handleRefreshMetrics}
            disabled={state.isLoading}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {state.error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{state.error}</span>
          <button 
            className="error-dismiss"
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <main className="observability-main">
        <Suspense fallback={<ObservabilityLoadingSkeleton />}>
          <ObservabilityDashboard
            onAlertCreate={handleCreateAlert}
            onAlertAcknowledge={handleAlertAcknowledge}
            onDashboardCreate={handleDashboardCreate}
          />
        </Suspense>
      </main>

      {state.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span className="loading-text">Loading...</span>
        </div>
      )}
    </div>
    </AppLayout>
  );
}

function ObservabilityLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="observability-skeleton">
      <div className="skeleton-metrics-row">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-metric" />
        ))}
      </div>
      <div className="skeleton-charts">
        <div className="skeleton-chart-large" />
        <div className="skeleton-chart-medium" />
      </div>
      <div className="skeleton-tables">
        <div className="skeleton-table" />
        <div className="skeleton-table" />
      </div>
    </div>
  );
}
