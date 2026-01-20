"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import IntegrationHub from '@/components/enterprise/IntegrationHub';
import { integrationService } from '@/lib/services/integrationService';
import { useTranslation } from '@/hooks/useTranslation';
import './integrations.css';

/**
 * Enterprise Integrations Page
 * 
 * Full-page implementation of the IntegrationHub component
 * for managing 150+ enterprise integrations.
 * 
 * Features:
 * - Pre-built connectors for popular services
 * - OAuth and API key authentication
 * - Data mapping and transformation
 * - Real-time sync status monitoring
 * - Webhook configuration
 */

interface IntegrationsPageState {
  isLoading: boolean;
  error: string | null;
}

export default function IntegrationsPage(): React.JSX.Element {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = React.useState<IntegrationsPageState>({
    isLoading: false,
    error: null
  });

  const handleConnect = React.useCallback(async (integrationId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Connecting to:', integrationId);
      
      // Call real backend service
      const result = await integrationService.connect(integrationId as Parameters<typeof integrationService.connect>[0], {});
      
      toast({
        title: 'Connected',
        description: result.message || `Successfully connected to ${integrationId}`,
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      toast({
        title: 'Connection Failed',
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

  const handleDisconnect = React.useCallback(async (connectionId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Disconnecting:', connectionId);
      
      await integrationService.disconnect(connectionId);
      
      toast({
        title: 'Disconnected',
        description: 'Integration disconnected successfully',
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect';
      toast({
        title: 'Disconnect Failed',
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

  const handleSync = React.useCallback(async (connectionId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Syncing:', connectionId);
      
      const result = await integrationService.sync(connectionId);
      
      toast({
        title: 'Sync Complete',
        description: `Processed ${result.recordsProcessed} records in ${result.duration}ms`,
      });
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      toast({
        title: 'Sync Failed',
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

  const handleConfigure = React.useCallback(async (connectionId: string) => {
    log.debug('Configuring:', connectionId);
    // Open configuration modal
  }, []);

  return (
    <AppLayout>
    <div className="integrations-page">
      <header className="integrations-header">
        <div className="header-left">
          <a href="/enterprise" className="back-link">← Enterprise Suite</a>
          <h1>Integration Hub</h1>
        </div>
        <div className="header-right">
          <div className="connection-stats">
            <span className="stat">
              <span className="stat-value">150+</span>
              <span className="stat-label">Integrations</span>
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

      <main className="integrations-main">
        <Suspense fallback={<IntegrationsLoadingSkeleton />}>
          <IntegrationHub
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSync={handleSync}
            onConfigure={handleConfigure}
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

function IntegrationsLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="integrations-skeleton">
      <div className="skeleton-sidebar">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-connector" />
        ))}
      </div>
      <div className="skeleton-content">
        <div className="skeleton-header" />
        <div className="skeleton-cards">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
