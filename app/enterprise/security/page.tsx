"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import { invoke } from '@tauri-apps/api/core';
import { useToast } from '@/hooks/use-toast';
import SecurityDashboard from '@/components/enterprise/SecurityDashboard';
import { User, Role, AccessPolicy } from '@/types/security-compliance';
import { useTranslation } from '@/hooks/useTranslation';
import './security.css';

/**
 * Enterprise Security & Compliance Page
 * 
 * Full-page implementation of the SecurityDashboard component
 * for managing security policies, RBAC, and compliance.
 * 
 * Features:
 * - Role-based access control (RBAC) management
 * - Audit log viewer and search
 * - Compliance framework tracking (SOC2, HIPAA, GDPR)
 * - Encryption key management
 * - Security policy configuration
 */

interface SecurityPageState {
  isLoading: boolean;
  error: string | null;
}

export default function SecurityPage(): React.JSX.Element {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [state, setState] = React.useState<SecurityPageState>({
    isLoading: false,
    error: null
  });

  const handleUserCreate = React.useCallback(async (user: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Creating user:', user);
      await invoke('security_create_user', { user });
      toast({
        title: 'User Created',
        description: `User "${user.name || user.email || 'New User'}" created successfully`,
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
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

  const handleRoleCreate = React.useCallback(async (role: Partial<Role>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug('Creating role:', role);
      await invoke('security_create_role', { role });
      toast({
        title: 'Role Created',
        description: `Role "${role.name || 'New Role'}" created successfully`,
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
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

  const handlePolicyUpdate = React.useCallback(async (policyId: string, updates: Partial<AccessPolicy>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      log.debug(`Updating policy: ${policyId}`, updates);
      await invoke('security_update_policy', { policyId, updates });
      toast({
        title: 'Policy Updated',
        description: 'Access policy has been updated',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update policy';
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

  return (
    <AppLayout>
    <div className="security-page">
      <header className="security-header">
        <div className="header-left">
          <a href="/enterprise" className="back-link">← Enterprise Suite</a>
          <h1>Security & Compliance</h1>
        </div>
        <div className="header-right">
          <div className="security-stats">
            <span className="stat">
              <span className="stat-value">94%</span>
              <span className="stat-label">Security Score</span>
            </span>
            <span className="stat compliance-badge">
              <span className="badge-icon">✓</span>
              <span className="badge-text">SOC 2 Certified</span>
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

      <main className="security-main">
        <Suspense fallback={<SecurityLoadingSkeleton />}>
          <SecurityDashboard
            onUserCreate={handleUserCreate}
            onRoleCreate={handleRoleCreate}
            onPolicyUpdate={handlePolicyUpdate}
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

function SecurityLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="security-skeleton">
      <div className="skeleton-summary">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-summary-card" />
        ))}
      </div>
      <div className="skeleton-content">
        <div className="skeleton-sidebar">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-nav-item" />
          ))}
        </div>
        <div className="skeleton-main">
          <div className="skeleton-table-header" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row" />
          ))}
        </div>
      </div>
    </div>
  );
}
