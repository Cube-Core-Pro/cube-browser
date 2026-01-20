"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '@/hooks/use-toast';
import { APIGatewayDashboard } from '@/components/enterprise/APIGatewayDashboard';
import { ApiEndpoint } from '@/types/api-gateway';
import { useTranslation } from '@/hooks/useTranslation';
import './api-gateway.css';

/**
 * Enterprise API Gateway Page
 * 
 * Full-page implementation of the APIGatewayDashboard component
 * for managing API endpoints, rate limiting, and authentication.
 * 
 * Features:
 * - API endpoint management
 * - Rate limiting and throttling
 * - Authentication policies (OAuth, JWT, API Keys)
 * - Real-time metrics and monitoring
 * - Request/response transformation
 */

interface APIGatewayPageState {
  isLoading: boolean;
  error: string | null;
}

export default function APIGatewayPage(): React.JSX.Element {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = React.useState<APIGatewayPageState>({
    isLoading: false,
    error: null
  });

  const handleCreateEndpoint = React.useCallback(async (endpoint: Partial<ApiEndpoint>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Creating endpoint:', endpoint);
      await invoke('api_gateway_create_endpoint', { endpoint });
      toast({
        title: 'Endpoint Created',
        description: `API endpoint "${endpoint.path || '/new'}" created successfully`,
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create endpoint';
      toast({
        title: 'Creation Failed',
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

  const handleUpdateEndpoint = React.useCallback(async (id: string, updates: Partial<ApiEndpoint>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug(`Updating endpoint: ${id}`, updates);
      await invoke('api_gateway_update_endpoint', { id, updates });
      toast({
        title: 'Endpoint Updated',
        description: 'API endpoint configuration updated',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update endpoint';
      toast({
        title: 'Update Failed',
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

  const handleDeleteEndpoint = React.useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Deleting endpoint:', id);
      await invoke('api_gateway_delete_endpoint', { id });
      toast({
        title: 'Endpoint Deleted',
        description: 'API endpoint has been removed',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete endpoint';
      toast({
        title: 'Deletion Failed',
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

  const handleTestEndpoint = React.useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Testing endpoint:', id);
      const result = await invoke<{ success: boolean; latency: number }>('api_gateway_test_endpoint', { id });
      toast({
        title: result.success ? 'Test Passed' : 'Test Failed',
        description: result.success 
          ? `Endpoint responded in ${result.latency}ms` 
          : 'Endpoint is not responding correctly',
        variant: result.success ? 'default' : 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Endpoint test failed';
      toast({
        title: 'Test Failed',
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

  return (
    <AppLayout>
    <div className="api-gateway-page">
      <header className="api-gateway-header">
        <div className="header-left">
          <a href="/enterprise" className="back-link">← Enterprise Suite</a>
          <h1>API Gateway</h1>
        </div>
        <div className="header-right">
          <div className="gateway-stats">
            <span className="stat">
              <span className="stat-value">1.2M</span>
              <span className="stat-label">Requests</span>
            </span>
            <span className="stat">
              <span className="stat-value">145ms</span>
              <span className="stat-label">Latency</span>
            </span>
            <span className="stat">
              <span className="stat-value">0.3%</span>
              <span className="stat-label">Errors</span>
            </span>
          </div>
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

      <main className="api-gateway-main">
        <Suspense fallback={<APIGatewayLoadingSkeleton />}>
          <APIGatewayDashboard
            onCreateEndpoint={handleCreateEndpoint}
            onUpdateEndpoint={handleUpdateEndpoint}
            onDeleteEndpoint={handleDeleteEndpoint}
            onTestEndpoint={handleTestEndpoint}
          />
        </Suspense>
      </main>

      {state.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span className="loading-text">Processing...</span>
        </div>
      )}
    </div>
    </AppLayout>
  );
}

function APIGatewayLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="api-gateway-skeleton">
      <div className="skeleton-metrics">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-metric-card" />
        ))}
      </div>
      <div className="skeleton-table">
        <div className="skeleton-table-header" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-table-row" />
        ))}
      </div>
    </div>
  );
}
